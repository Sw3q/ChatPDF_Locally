const uploadForm = document.getElementById('uploadForm');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const messages = document.getElementById('messages');
const uploadMessage = document.querySelector('.upload-message');
const uploadedFiles = document.querySelector('.uploaded-files');

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
      uploadMessage.style.color = '#48bb78'; // Success green color
      
      // Show the uploaded file name
      uploadedFiles.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 4.5V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 2 14.5523 2 14V2C2 1.44772 2.44772 1 3 1H10.5L14 4.5Z" stroke="#4A5568" stroke-width="2"/>
          </svg>
          <span>${file.name}</span>
        </div>
      `;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    uploadMessage.textContent = 'Failed to upload document. Please try again.';
    uploadMessage.style.color = '#e53e3e'; // Error red color
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