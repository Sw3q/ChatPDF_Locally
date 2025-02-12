import OpenAI from 'openai';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const client = new OpenAI({
  baseURL: "http://127.0.0.1:1234/v1",
  apiKey: "not-needed" // LLM Studio doesn't require an API key by default
});

const upload = multer({ dest: 'uploads/' });
const uploadedDocuments: Express.Multer.File[] = [];

async function testLLMStudio() {
  try {
    const completion = await client.chat.completions.create({
      model: "local-model", // This can be any string as LLM Studio doesn't check the model name
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello!" }
      ],
      temperature: 0.7,
    });

    console.log("Response:", completion.choices[0].message);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test
testLLMStudio();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('document'), (req: Request, res) => {
  console.log('Uploaded document:', (req as any).file);
  uploadedDocuments.push((req as any).file);
  res.json({ message: 'Document uploaded successfully' });
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  const documentContents = await Promise.all(uploadedDocuments.map(async (doc) => {
    console.log('Processing document:', doc.path);
    
    const dataBuffer = await fs.readFile(doc.path);
    console.log('Read document content, size:', dataBuffer.length);
    
    return new Promise<string>((resolve, reject) => {
      pdfParse(dataBuffer).then(result => {
        console.log('Parsed PDF, text length:', result.text.length);
        resolve(result.text);
      }).catch(err => {
        console.error('Error parsing PDF:', err);
        reject(err);
      });
    });
  }));

  console.log('Extracted document contents:', documentContents);

  const completion = await client.chat.completions.create({
    model: "local-model",
    messages: [
      { role: "system", content: `You are a helpful assistant. You respond exclusively in the language of the user's message. Format your responses as HTML. Use appropriate HTML tags to structure the content in a readable way, for example:
- Use <h1>, <h2> etc for headings 
- Use <p> for paragraphs of text
- Use <ul> and <li> for bullet point lists
- Use <table>, <tr>, <th>, <td> for tabular data
Respond to the user's message based on the content of the uploaded documents:\n\n${documentContents.join('\n\n').slice(0, 4000)}` },
      { role: "user", content: message }
    ],
    temperature: 0.1,
  });

  console.log('LLM Studio API response:', completion);

  res.json({ response: completion.choices[0].message.content });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
