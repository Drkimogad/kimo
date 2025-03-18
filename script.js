let isListening = false;
let recognition;
let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('PWA installation available');
});

// Load AI models (from models.js)
loadModels();

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
});

// Voice input
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    document.getElementById('user-input').value = event.results[0][0].transcript;
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

// File upload (image classification & text processing)
document.getElementById('file-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

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
  const input = document.getElementById('user-input').value.trim();
  if (!input) return;

  sessionHistory.push(input);
  localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));

  const response = generateAIResponse(input);
  displayResponse(response);
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.log('SW Registration Failed:', err));
}
