let isListening = false;
let recognition;
let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('PWA installation available');
});

// Load AI models
loadModels();

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
});

// 🎤 Voice Input
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

// 📂 File Upload (OCR & Text Processing)
document.getElementById('file-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type.startsWith('image/')) {
    const text = await extractHandwriting(file);
    displayResponse(`Extracted text: ${text}`);
  } else if (file.type === 'text/plain') {
    const text = await file.text();
    const isPlagiarized = await checkPlagiarism(text);
    displayResponse(`Plagiarism Likelihood: ${isPlagiarized ? 'High' : 'Low'}`);
  }
});

// 🚀 Submit Query (Search or AI Generation)
document.getElementById('submit-btn').addEventListener('click', async () => {
  const input = document.getElementById('user-input').value.trim();
  if (!input) return;

  displayResponse("Processing...");

  if (isSearchQuery(input)) {
    const searchResults = await fetchDuckDuckGoResults(input);
    displayResponse(searchResults || "No results found.");
  } else {
    const aiResponse = generateAIResponse(input);
    displayResponse(aiResponse);
  }
});

// 🔍 Online Search via DuckDuckGo API
async function fetchDuckDuckGoResults(query) {
  try {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await response.json();
    return data.AbstractText || "No detailed summary found.";
  } catch (error) {
    console.error("Search failed:", error);
    return "Search error. Try again.";
  }
}

// 📝 Humanize Text
document.getElementById('humanize-btn').addEventListener('click', async () => {
  const text = document.getElementById('response-area').innerText;
  if (text) {
    const humanizedText = await humanizeText(text);
    displayResponse(humanizedText);
  }
});

// 💾 Save Response
document.getElementById('save-btn').addEventListener('click', () => {
  const text = document.getElementById('response-area').innerText;
  if (text) saveToFile(text, "ai_generated.txt");
});

function saveToFile(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.log('SW Registration Failed:', err));
}
