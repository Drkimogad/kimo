let isListening = false;
let recognition;
let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

// Load models
let plagiarismModel;
let imageModel;

async function loadModels() {
  // Load Universal Sentence Encoder for plagiarism detection
  plagiarismModel = await use.load();
  // Load MobileNet for image classification
  imageModel = await tf.loadLayersModel('https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/4/default/1');
}

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
});

// Voice input
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
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

// File upload
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

  // Save to session history
  sessionHistory.push(input);
  localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));

  // Get AI response
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
  const sample = "Original text for comparison...";
  const embeddings = await plagiarismModel.embed([text, sample]);
  const similarity = tf.matMul(embeddings[0], embeddings[1], false, true).dataSync()[0];
  return similarity > 0.8;
}

function humanizeResponse(text) {
  return text
    .replace(/AI/g, "this agent")
    .replace(/automatically/g, "carefully")
    .replace(/(\w)(\1{2,})/g, "$1"); // Basic stutter remover
}

function displayResponse(text) {
  const responseArea = document.getElementById('response-area');
  responseArea.innerHTML = `<p>${text}</p>`;
  responseArea.scrollTop = responseArea.scrollHeight;
}

// Initialize
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
