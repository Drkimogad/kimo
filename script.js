document.addEventListener('DOMContentLoaded', () => {
  // ************** INITIALIZATIONS **************
  let isListening = false;
  let recognition;
  let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
  let imageModel; // MobileNet instance

  // ************** MODEL MANAGEMENT **************
  async function initializeModels() {
    try {
      // Initialize MobileNet
      imageModel = await mobilenet.load({ version: 2, alpha: 1.0 });
      
      // Initialize other models
      await Promise.all([
        recognizeHandwriting.init(),
        image.init(),
        text.init()
      ]);
      
      console.log('All models loaded successfully');
    } catch (error) {
      console.error('Model initialization failed:', error);
      displayResponse('Some features might be unavailable', true);
    }
  }

  // ************** IMAGE PROCESSING **************
  async function handleImageUpload(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      const predictions = await imageModel.classify(img);
      
      const resultText = predictions
        .map(p => `${p.className} (${Math.round(p.probability * 100)}%)`)
        .join('\n');
      
      displayResponse(`Image Analysis:\n${resultText}`);
      sessionHistory.push({
        type: 'image',
        file: file.name,
        results: predictions,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));

    } catch (error) {
      console.error('Image processing error:', error);
      displayResponse('Failed to analyze image', true);
    } finally {
      hideLoading();
    }
  }

  // ************** FILE UPLOAD HANDLER **************
 document.getElementById('file-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    showLoading();
    
    if (file.type.startsWith('image/')) {
      const img = await loadImage(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const recognizedText = await recognizeHandwriting.recognize(canvas);
      displayResponse(`Handwriting Recognition: ${recognizedText}`);
      
      sessionHistory.push({
        type: 'handwriting',
        file: file.name,
        text: recognizedText,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
    }
    // Existing text/plain handling...
  } catch (error) {
    console.error('File processing error:', error);
    displayResponse('Error processing file', true);
  } finally {
    hideLoading();
  }
});

  // ************** VOICE INPUT HANDLING **************
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('user-input').value = transcript;
      toggleListeningUI(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toggleListeningUI(false);
    };

    recognition.onend = () => {
      isListening = false;
      toggleListeningUI(false);
    };
  }

  function toggleListeningUI(listening) {
    const voiceBtn = document.getElementById('voice-btn');
    voiceBtn.classList.toggle('recording', listening);
    isListening = listening;
  }

  document.getElementById('voice-btn').addEventListener('click', () => {
    if (!isListening) {
      recognition.start();
      toggleListeningUI(true);
    } else {
      recognition.stop();
      toggleListeningUI(false);
    }
  });

// Canvas Drawing Implementation
let isDrawing = false;
let lastX = 0;
let lastY = 0;
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 200;

// Drawing functions
function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
  if (!isDrawing) return;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.stroke();
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function endDrawing() {
  isDrawing = false;
}

// Event listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing);

document.getElementById('clear-canvas').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Add recognize button handler
document.getElementById('recognize-btn').addEventListener('click', async () => {
  const recognizedText = await recognizeHandwriting.recognize(canvas);
  displayResponse(`Handwriting: ${recognizedText}`);
});

  
  // ************** THEME MANAGEMENT **************
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.body.dataset.theme = currentTheme;

  themeToggle.addEventListener('click', () => {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
  });

  // ************** SEARCH/QUERY HANDLING **************
  document.getElementById('submit-btn').addEventListener('click', async () => {
    const input = document.getElementById('user-input').value.trim();
    if (!input) return;

    try {
      displayResponse("Processing...", true);
      
      if (isSearchQuery(input)) {
        const searchResults = await fetchDuckDuckGoResults(input);
        sessionHistory.push({ 
          type: 'search', 
          query: input, 
          results: searchResults,
          timestamp: new Date().toISOString()
        });
        displayResponse(searchResults.AbstractText || "No results found.");
      } else {
        const aiResponse = await generateAIResponse(input);
        sessionHistory.push({ 
          type: 'ai', 
          query: input, 
          response: aiResponse,
          timestamp: new Date().toISOString()
        });
        displayResponse(aiResponse);
      }
      
      localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
    } catch (error) {
      console.error('Processing error:', error);
      displayResponse('An error occurred. Please try again.');
    }
  });

  // ************** UTILITY FUNCTIONS **************
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function showLoading() {
    document.getElementById('loading').classList.remove('loading-hidden');
  }

  function hideLoading() {
    document.getElementById('loading').classList.add('loading-hidden');
  }

  function displayResponse(content, clear = false) {
    const responseArea = document.getElementById('response-area');
    if (clear) responseArea.innerHTML = '';
    responseArea.innerHTML += `<div class="response">${content}</div>`;
  }

  // ************** SERVICE WORKER **************
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered');
        setInterval(() => registration.update(), 3600000);
      })
      .catch(err => console.log('SW registration failed:', err));
  }

  // ************** INITIALIZE APP **************
  initializeModels();
});
