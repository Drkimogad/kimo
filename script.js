// MobileNet Model Idocument.addEventListener('DOMContentLoaded', () => {
  // ====================
  // 1. INITIALIZATIONS
  // ====================
  let isListening = false;
  let recognition;
  let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
  let imageModel; // MobileNet instance

  // ====================
  // 2. MODEL MANAGEMENT
  // ====================
  async function initializeModels() {
    try {
      // Load MobileNet
      imageModel = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      
      // Load other models
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

  // ====================
  // 3. IMAGE PROCESSING
  // ====================
  async function handleImageUpload(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      
      // Get predictions from MobileNet
      const predictions = await imageModel.classify(img);
      
      // Format results
      const resultText = predictions
        .map(p => `${p.className} (${Math.round(p.probability * 100)}%)`)
        .join('\n');
      
      displayResponse(`Image Analysis:\n${resultText}`);
      addToHistory({
        type: 'image',
        file: file.name,
        results: predictions
      });

    } catch (error) {
      console.error('Image processing error:', error);
      displayResponse('Failed to analyze image', true);
    } finally {
      hideLoading();
    }
  }

  // ====================
  // 4. UPDATED FILE UPLOAD HANDLER
  // ====================
  document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.type.startsWith('image/')) {
        await handleImageUpload(file);
      } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        const plagiarismResult = await text.checkPlagiarism(textContent);
        displayResponse(`Plagiarism Score: ${plagiarismResult.score}%`);
      }
    } catch (error) {
      console.error('File processing error:', error);
      displayResponse('Error processing file', true);
    }
  });

  // ====================
  // 5. SERVICE WORKER CONFIG
  // ====================
  const MODEL_CACHE = [
    // MobileNet files
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json',
    'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/group1-shard*.bin',
    // Your existing model files
    'https://drkimogad.github.io/kimo/models/handwritingModel.js',
    'https://drkimogad.github.io/kimo/models/image-model.js',
    'https://drkimogad.github.io/kimo/models/text-model.js'
  ];

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered');
        // Update check logic remains
      });
  }

  // ====================
  // 6. INITIALIZE APP
  // ====================
  initializeModels();
  
  // Rest of your existing code remains unchanged below...
  // [Keep all your voice, theme, search, and other handlers]

  // PWA Install Prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-btn').style.display = 'block';
  });

  document.getElementById('install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome} the install prompt`);
      deferredPrompt = null;
    }
  });

  // 🌙 Theme Toggle with localStorage
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.body.dataset.theme = currentTheme;

  themeToggle.addEventListener('click', () => {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
  });

  // 🎤 Enhanced Voice Input
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

  // 📂 File Upload with error handling
  document.getElementById('file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.type.startsWith('image/')) {
        const img = await loadImage(file);
        const handwritingText = await recognizeHandwriting(img);
        displayResponse(`Recognized text: ${handwritingText}`);
      } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        const plagiarismResult = await checkPlagiarism(textContent);
        displayResponse(`Plagiarism Likelihood: ${plagiarismResult.score}%`);
      }
    } catch (error) {
      console.error('File processing error:', error);
      displayResponse('Error processing file. Please try again.');
    }
  });

  // 🚀 Enhanced Query Handling
  document.getElementById('submit-btn').addEventListener('click', async () => {
    const input = document.getElementById('user-input').value.trim();
    if (!input) return;

    try {
      displayResponse("Processing...", true);
      
      if (isSearchQuery(input)) {
        const searchResults = await fetchDuckDuckGoResults(input);
        sessionHistory.push({ type: 'search', query: input, results: searchResults });
        displayResponse(searchResults.AbstractText || "No results found.");
      } else {
        const aiResponse = await generateAIResponse(input);
        sessionHistory.push({ type: 'ai', query: input, response: aiResponse });
        displayResponse(aiResponse);
      }
      
      localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
    } catch (error) {
      console.error('Processing error:', error);
      displayResponse('An error occurred. Please try again.');
    }
  });

  // 🔍 Enhanced Search with fallback
  async function fetchDuckDuckGoResults(query) {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
      if (!response.ok) throw new Error('Network response was not OK');
      return await response.json();
    } catch (error) {
      console.error("Search failed:", error);
      return { AbstractText: "Search unavailable. Showing local results...", RelatedTopics: [] };
    }
  }

  // 📝 Humanize with AI model
  async function humanizeText(text) {
    try {
      return await text.humanize(text);
    } catch (error) {
      console.error('Humanization failed:', error);
      return text; // Return original as fallback
    }
  }

  // 💾 Enhanced Save with filename
  document.getElementById('save-btn').addEventListener('click', () => {
    const text = document.getElementById('response-area').innerText;
    if (text) {
      const filename = `kimo_${new Date().toISOString().slice(0,10)}.txt`;
      saveToFile(text, filename);
    }
  });

  // Helper functions
  function displayResponse(content, clear = false) {
    const responseArea = document.getElementById('response-area');
    if (clear) responseArea.innerHTML = '';
    responseArea.innerHTML += `<div class="response">${content}</div>`;
  }

  function isSearchQuery(input) {
    return input.startsWith('search:') || input.split(' ').length < 5;
  }

  function saveToFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Service Worker with update check
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('https://drkimogad.github.io/kimo/sw.js')
      .then(registration => {
        console.log('SW registered');
        registration.addEventListener('updatefound', () => {
          console.log('New SW version found');
        });
      })
      .catch(err => console.log('SW registration failed:', err));
    
    // Check for updates hourly
    setInterval(() => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) registration.update();
      });
    }, 3600000);
  }
});
