# Chat with PDF using LM Studio

A web application that allows users to chat with their PDF documents using local Large Language Models through LM Studio. This application provides a user-friendly interface for uploading PDFs and asking questions about their content, with all processing happening locally on your machine.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Setting up LM Studio](#setting-up-lm-studio)
  - [Setting up the Application](#setting-up-the-application)
- [Configuration](#configuration)
- [Usage](#usage)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## Features

- 📄 Upload and process PDF documents
- 💬 Chat interface for asking questions about document content
- 🔒 Secure file handling with automatic cleanup
- 🎨 Modern, responsive UI
- 🚀 Real-time responses using local LLMs
- 📱 Mobile-friendly design
- 🔍 Smart document processing with text extraction
- 🧹 Automatic file cleanup after 1 hour

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- LM Studio (for running local language models)
- At least 16GB RAM recommended
- Sufficient disk space for language models

## Installation

### Setting up LM Studio

1. Download LM Studio from [https://lmstudio.ai/](https://lmstudio.ai/) for your operating system

2. Install and launch LM Studio

3. Download a language model:
   - Click on "Browse Models"
   - Select a model (recommended: Mistral-7B-Instruct or similar)
   - Click "Download"
   - Wait for the download to complete

4. Configure the model:
   - Select your downloaded model in LM Studio
   - Click "Start Server"
   - Note: The server will run on http://localhost:1234 by default

### Setting up the Application

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd [your-repo-name]
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the uploads directory:
   ```bash
   mkdir uploads
   ```

4. Build the TypeScript code:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

## Configuration

### Environment Variables
No environment variables are required as the application uses default settings. However, you can modify the following in `app.ts`:

- Server port (default: 3000)
- LM Studio API URL (default: http://localhost:1234/v1)
- Maximum file size (default: 5MB)
- File cleanup interval (default: 1 hour)

### File Upload Settings
- Maximum file size: 5MB
- Allowed file types: PDF only
- Files are automatically deleted after 1 hour
- Random file names are generated for security

## Usage

1. **Start LM Studio**
   - Open LM Studio
   - Select your model
   - Click "Start Server"
   - Wait for the confirmation that the server is running

2. **Upload a PDF**
   - Open http://localhost:3000 in your browser
   - Click "Choose File" in the upload section
   - Select a PDF file (max 5MB)
   - Click "Upload PDF"
   - Wait for the upload confirmation

3. **Chat with your Document**
   - Type your question in the chat input
   - Click "Send" or press Enter
   - Wait for the AI to process and respond
   - View the formatted response in the chat window

4. **Managing Documents**
   - Remove uploaded documents using the "Remove" button
   - Upload a new document to replace the current one
   - Clear the chat history using the "Clear Chat" button

## Security Features

- 🔒 File upload validation
- 🔑 Secure file storage with random names
- 🧹 Automatic file cleanup
- 🛡️ XSS protection through input sanitization
- 🚫 Blocked direct access to uploads directory
- ✅ MIME type verification
- 📝 Input validation and sanitization

## API Endpoints

### POST /upload
Uploads a PDF document
- Method: POST
- Content-Type: multipart/form-data
- Max file size: 5MB
- Returns: { message: string, file: { name: string, id: string } }

### POST /chat
Sends a message to chat with the document
- Method: POST
- Content-Type: application/json
- Body: { message: string }
- Returns: { response: string }

### DELETE /document/:id
Removes an uploaded document
- Method: DELETE
- URL Parameter: id (document ID)
- Returns: { message: string }

## Troubleshooting

### Common Issues

1. **LM Studio Connection Error**
   - Ensure LM Studio server is running
   - Check if the correct port (1234) is being used
   - Verify no firewall is blocking the connection

2. **File Upload Issues**
   - Verify file is under 5MB
   - Ensure file is in PDF format
   - Check browser console for error messages

3. **Performance Issues**
   - Ensure sufficient RAM for model operation
   - Close unnecessary applications
   - Consider using a smaller language model

### Error Messages

- "File too large": The PDF exceeds 5MB limit
- "Only PDF files are allowed": File type validation failed
- "No document uploaded yet": Upload a document before chatting
- "Invalid response from AI model": LM Studio connection issue

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 