const uploadForm = document.getElementById('uploadForm');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const messages = document.getElementById('messages');
const uploadMessage = document.querySelector('.upload-message');
const uploadedFiles = document.querySelector('.uploaded-files');
const clearChatButton = document.getElementById('clearChat');
const fileInput = uploadForm.querySelector('input[type="file"]');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Add file size validation
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      uploadMessage.textContent = 'File is too large. Maximum size is 5MB.';
      uploadMessage.style.color = '#e53e3e';
      fileInput.value = ''; // Clear the file input
      return;
    }
    if (!file.type.includes('pdf')) {
      uploadMessage.textContent = 'Only PDF files are allowed.';
      uploadMessage.style.color = '#e53e3e';
      fileInput.value = ''; // Clear the file input
      return;
    }
    uploadMessage.textContent = 'File selected. Click Upload to proceed.';
    uploadMessage.style.color = '#718096';
  }
});

let currentDocumentId = null;

// Add clear chat functionality
clearChatButton.addEventListener('click', () => {
  messages.innerHTML = '';
  messages.style.opacity = '0';
  setTimeout(() => {
    messages.style.opacity = '1';
  }, 300);
});

// Function to remove the current document
async function removeDocument(fileId) {
  try {
    const response = await fetch(`/document/${fileId}`, { 
      method: 'DELETE'
    });
    
    if (response.ok) {
      uploadedFiles.innerHTML = '';
      uploadMessage.textContent = 'No document uploaded yet.';
      uploadMessage.style.color = '#718096';
      currentDocumentId = null;
      
      // Reset the file input
      const fileInput = uploadForm.querySelector('input[type="file"]');
      fileInput.value = '';
    } else {
      throw new Error('Failed to remove document');
    }
  } catch (error) {
    console.error('Error removing document:', error);
    uploadMessage.textContent = 'Failed to remove document. Please try again.';
    uploadMessage.style.color = '#e53e3e';
  }
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(uploadForm);
  const file = formData.get('document');
  
  if (!file || file.size === 0) {
    uploadMessage.textContent = 'Please select a file first.';
    return;
  }

  try {
    const response = await fetch('/upload', { method: 'POST', body: formData });
    const result = await response.json();
    
    if (response.ok) {
      uploadMessage.textContent = 'Document uploaded successfully!';
      uploadMessage.style.color = '#48bb78';
      currentDocumentId = result.file.id;
      
      // Show the uploaded file name with remove button
      uploadedFiles.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: #f7fafc; border-radius: 6px;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 4.5V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 2 14.5523 2 14V2C2 1.44772 2.44772 1 3 1H10.5L14 4.5Z" stroke="#4A5568" stroke-width="2"/>
            </svg>
            <span>${result.file.name}</span>
          </div>
          <button type="button" onclick="removeDocument('${result.file.id}')" 
                  style="padding: 0.25rem 0.5rem; background: #fed7d7; color: #c53030; border-radius: 4px;">
            Remove
          </button>
        </div>
      `;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    uploadMessage.textContent = 'Failed to upload document. Please try again.';
    uploadMessage.style.color = '#e53e3e';
  }
});

sendButton.addEventListener('click', async () => {
  const message = userInput.value;
  if (!message.trim()) return;
  
  userInput.value = '';

  // Add user message with proper styling
  const userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'message user-message';
  userMessageDiv.textContent = message;
  messages.appendChild(userMessageDiv);

  try {
    const response = await fetch('/chat', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const result = await response.json();
    
    // Add assistant message with proper styling
    const assistantMessageDiv = document.createElement('div');
    assistantMessageDiv.className = 'message assistant-message';
    assistantMessageDiv.innerHTML = result.response;
    messages.appendChild(assistantMessageDiv);

    // Scroll to the bottom of the messages
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    console.error('Error sending message:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message assistant-message';
    errorDiv.textContent = 'Sorry, there was an error processing your message. Please try again.';
    messages.appendChild(errorDiv);
  }
}); 