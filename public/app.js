const uploadForm = document.getElementById('uploadForm');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const messages = document.getElementById('messages');

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(uploadForm);
  const response = await fetch('/upload', { method: 'POST', body: formData });
  const result = await response.json();
  console.log('Document uploaded:', result);
});

sendButton.addEventListener('click', async () => {
  const message = userInput.value;
  userInput.value = '';

  const response = await fetch('/chat', { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  const result = await response.json();
  messages.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
  messages.innerHTML += `<p><strong>Assistant:</strong> ${result.response}</p>`;
}); 