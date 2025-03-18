let isListening = false;
let recognition;
let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('PWA installation available');
});

// Load models
let plagiarismModel;
let imageModel;

async function loadModels() {
  // Load MobileNet model using ml5.js
  imageModel = await ml5.imageClassifier('MobileNet');
  console.log("Image classification model loaded.");

  console.log("Models initialized.");
}

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
});

// Voice input using cross-browser SpeechRecognition API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('user-input').value = transcript;
  };
}

document.getElementById('voice-btn').addEventListener('click', () => {
  if (!isListening) {
    recognition.start();
    isListening = true;
  } else {
    recognition.stop();
    isListening = false;
  }
});

// File upload for images and text
document.getElementById('file-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file.type.startsWith('image/')) {
    const img = await loadImage(file);
    const predictions = await classifyImage(img);
    displayResponse(`Image classified as: ${predictions[0].className}`);
  } else if (file.type === 'text/plain') {
    const text = await file.text();
    const isPlagiarized = await checkPlagiarism(text);
    displayResponse(`Plagiarism likelihood: ${isPlagiarized ? 'High' : 'Low'}`);
  }
});

// Submit handler
document.getElementById('submit-btn').addEventListener('click', async () => {
  const input = document.getElementById('user-input').value;
  if (!input) return;

  sessionHistory.push(input);
  localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));

  try {
    const response = await getAIResponse(input);
    const humanized = humanizeResponse(response);
    displayResponse(humanized);
  } catch (error) {
    displayResponse("Sorry, I'm having trouble responding right now.");
    console.error("API Error:", error);
  }
});

// Helper functions
async function getAIResponse(input) {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: input })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.response || "No response generated";
}

async function checkPlagiarism(text) {
  const apiKey = "YOUR_OPENAI_API_KEY"; // Replace with your actual API key
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  });

  const data = await response.json();
  return data && data.data ? data.data.length > 0 : false;
}

async function classifyImage(image) {
  return await imageModel.classify(image);
}

function humanizeResponse(text) {
  return text
    .replace(/AI/g, "this agent")
    .replace(/automatically/g, "carefully")
    .replace(/(\w)(\1{2,})/g, "$1");
}

function displayResponse(text) {
  const responseArea = document.getElementById('response-area');
  responseArea.innerHTML = `<p>${text}</p>`;
  responseArea.scrollTop = responseArea.scrollHeight;
}

// Initialize models
loadModels().catch(error => {
  console.error("Model loading failed:", error);
  displayResponse("Failed to initialize AI models. Please refresh.");
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.log('SW Registration Failed:', err));
}
