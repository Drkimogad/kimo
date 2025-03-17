// Initialize TensorFlow.js model here
let model;

async function loadModel() {
  // Example: Load a pre-trained model
  model = await tf.loadLayersModel('https://tfhub.dev/google/tfjs-model/mobilenet/v2/1/default/1');
  console.log("Model loaded!");
}

function appendMessage(text, isUser = false) {
  const chatArea = document.getElementById('chat-area');
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'ai-message';
  messageDiv.textContent = text;
  chatArea.appendChild(messageDiv);
}

document.getElementById('submit-btn').addEventListener('click', async () => {
  const input = document.getElementById('user-input').value;
  appendMessage(input, true);
  
  // Replace with actual AI logic
  appendMessage("Thinking...", false);
  
  // Example: Mock response
  setTimeout(() => {
    appendMessage("This is a sample AI response.", false);
  }, 1000);
  
  document.getElementById('user-input').value = '';
});

// Load model on startup
loadModel().catch(console.error);
