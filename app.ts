import OpenAI from 'openai';
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: "http://127.0.0.1:1234/v1",
  apiKey: "not-needed"
});

// Configure multer for secure file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}.pdf`);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype !== 'application/pdf') {
    cb(new Error('Only PDF files are allowed'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

// Keep track of uploaded documents with metadata
interface UploadedDocument extends Express.Multer.File {
  uploadedAt: Date;
}

const uploadedDocuments: UploadedDocument[] = [];

// Cleanup old files periodically (every hour)
setInterval(async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  for (let i = uploadedDocuments.length - 1; i >= 0; i--) {
    const doc = uploadedDocuments[i];
    if (doc.uploadedAt < oneHourAgo) {
      try {
        await fs.unlink(doc.path);
        uploadedDocuments.splice(i, 1);
      } catch (error) {
        console.error('Error cleaning up old file:', doc.filename);
      }
    }
  }
}, 60 * 60 * 1000);

// Serve static files but block access to uploads directory
app.use('/uploads', (req: Request, res: Response) => {
  res.status(403).send('Forbidden');
});
app.use(express.static('public'));

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err.message);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      return;
    }
    res.status(400).json({ message: 'Error uploading file.' });
    return;
  }
  
  res.status(500).json({ message: 'Internal server error.' });
};

app.use(errorHandler);

app.post('/upload', upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded.' });
    return;
  }

  try {
    // Add metadata to the uploaded file
    const docWithMetadata: UploadedDocument = {
      ...(req.file as Express.Multer.File),
      uploadedAt: new Date()
    };
    
    uploadedDocuments.push(docWithMetadata);
    
    res.json({ 
      message: 'Document uploaded successfully',
      file: {
        name: req.file.originalname,
        id: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ message: 'Error processing upload.' });
  }
});

interface DeleteDocumentParams {
  id: string;
}

app.delete('/document/:id', async (req: Request<DeleteDocumentParams>, res: Response): Promise<void> => {
  const fileId = req.params.id;
  
  // Validate file ID format
  if (!fileId || !/^[a-f0-9]{32}\.pdf$/.test(fileId)) {
    res.status(400).json({ message: 'Invalid file ID format.' });
    return;
  }

  const docIndex = uploadedDocuments.findIndex(doc => doc.filename === fileId);
  
  if (docIndex === -1) {
    res.status(404).json({ message: 'Document not found.' });
    return;
  }

  try {
    const doc = uploadedDocuments[docIndex];
    await fs.unlink(doc.path);
    uploadedDocuments.splice(docIndex, 1);
    res.json({ message: 'Document removed successfully.' });
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ message: 'Error removing document.' });
  }
});

app.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const { message } = req.body;

  // Validate input
  if (!message || typeof message !== 'string') {
    res.status(400).json({ message: 'Invalid message format.' });
    return;
  }

  if (uploadedDocuments.length === 0) {
    res.status(400).json({ message: 'Please upload a document first.' });
    return;
  }

  // Sanitize input
  const sanitizedMessage = sanitizeHtml(message, {
    allowedTags: [],
    allowedAttributes: {}
  });

  try {
    const documentContents = await Promise.all(uploadedDocuments.map(async (doc) => {
      const dataBuffer = await fs.readFile(doc.path);
      
      try {
        const result = await pdfParse(dataBuffer);
        return result.text;
      } catch (err) {
        console.error('Error parsing PDF:', doc.filename);
        return '';
      }
    }));

    if (documentContents.every(content => !content)) {
      res.status(400).json({ message: 'No valid documents to process.' });
      return;
    }

    const completion = await client.chat.completions.create({
      model: "local-model",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful assistant. You respond exclusively in the language of the user's message. Format your responses as HTML. Use appropriate HTML tags to structure the content in a readable way, for example:
- Use <h1>, <h2> etc for headings 
- Use <p> for paragraphs of text
- Use <ul> and <li> for bullet point lists
- Use <table>, <tr>, <th>, <td> for tabular data
Respond to the user's message based on the content of the uploaded documents:\n\n${documentContents.join('\n\n').slice(0, 4000)}` 
        },
        { role: "user", content: sanitizedMessage }
      ],
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      res.status(500).json({ message: 'Invalid response from AI model.' });
      return;
    }

    // Sanitize AI response to prevent XSS
    const sanitizedResponse = sanitizeHtml(responseContent, {
      allowedTags: ['h1', 'h2', 'h3', 'p', 'ul', 'li', 'table', 'tr', 'th', 'td'],
      allowedAttributes: {}
    });

    res.json({ response: sanitizedResponse });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ message: 'Error processing your request.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
