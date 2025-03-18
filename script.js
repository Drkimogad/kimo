let isListening = false;
let recognition;
let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('PWA installation available');
});

// Load models
let imageModel;

async function loadModels() {
  // Load MobileNet model using ml5.js
  imageModel = await ml5.imageClassifier('MobileNet');
  console.log("Image classification model loaded.");
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
    const isPlagiarized = checkPlagiarism(text);
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
    const response = getAIResponse(input);
    displayResponse(response);
  } catch (error) {
    displayResponse("Sorry, I'm having trouble responding right now.");
    console.error("Error:", error);
  }
});

// Helper functions
function getAIResponse(input) {
  return "This is a sample AI response (local function)."; // Replace this with offline logic if needed
}

function checkPlagiarism(text) {
  const sampleText = "This is an example of original content for comparison.";
  const similarity = stringSimilarity.compareTwoStrings(text, sampleText);
  return similarity > 0.8;
}

async function classifyImage(image) {
  return await imageModel.classify(image);
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
