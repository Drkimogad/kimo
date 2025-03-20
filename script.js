import { loadModels } from './models.js';  // Add this import line at the top of your script.js
import { recognizeHandwriting } from './ocr.js';  // Import the handwriting recognition function

document.addEventListener('DOMContentLoaded', async () => {
  // ************** INITIALIZATIONS **************
  let isListening = false;
  let recognition;
  let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

  // ************** MODEL INITIALIZATION **************
  try {
    await loadModels(); // Load all models at the start
    console.log('All models loaded successfully');
  } catch (error) {
    console.error('Model initialization failed:', error);
    displayResponse('Some features might be unavailable', true);
  }

  // function to response-box
  function displayResponse(content, clear = false) {
    const responseArea = document.getElementById('response-area');
    if (clear) responseArea.innerHTML = '';
    responseArea.innerHTML += `<div class="response">${content}</div>`;
    responseArea.scrollTop = responseArea.scrollHeight;
  }

  // ************** IMAGE PROCESSING **************
  async function handleImageUpload(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      const predictions = await mobilenetModel.classify(img);
      
      const resultText = predictions
        .map(p => `${p.className} (${Math.round(p.probability * 100)}%)`)
        .join('\n');
      
      displayResponse(`Image Analysis:\n${resultText}`);
      updateSessionHistory('image', { file: file.name, results: predictions });
    } catch (error) {
      console.error('Image processing error:', error);
      displayResponse('Failed to analyze image', true);
    } finally {
      hideLoading();
    }
  }

  // ************** UNIFIED FILE UPLOAD HANDLER **************
  document.getElementById('file-upload')?.addEventListener('change', async (e) => {  // Safely add event listener
    const file = e.target.files[0];
    if (!file) return;

    try {
      showLoading();
      
      if (file.type.startsWith('image/')) {
        // Handle image classification
        await handleImageUpload(file);
        
        // Handle handwriting recognition (new addition)
        const img = await loadImage(file);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const recognizedText = await recognizeHandwriting(canvas);  // Call the OCR function
        displayResponse(`Handwriting Recognition: ${recognizedText}`);
        updateSessionHistory('handwriting', { file: file.name, text: recognizedText });
        
      } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        const plagiarismResult = await useModel.checkPlagiarism(textContent);
        displayResponse(`Plagiarism Score: ${plagiarismResult.score.toFixed(1)}%`);
        updateSessionHistory('text', { content: textContent, score: plagiarismResult.score });
      }
      
    } catch (error) {
      console.error('File processing error:', error);
      displayResponse('Error processing file', true);
    } finally {
      hideLoading();
    }
  });

  // ************** CANVAS DRAWING IMPLEMENTATION **************
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Canvas setup
  canvas.width = 800;
  canvas.height = 200;

  // Drawing event handlers
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDrawing);
  canvas.addEventListener('mouseout', endDrawing);

  document.getElementById('clear-canvas')?.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  document.getElementById('recognize-btn')?.addEventListener('click', async () => {
    showLoading();  // Show loading spinner while processing
    const recognizedText = await recognizeHandwriting(canvas);  // Call OCR on canvas
    displayResponse(`Handwriting: ${recognizedText}`);
    updateSessionHistory('drawing', { text: recognizedText });
    hideLoading();  // Hide loading spinner after processing
  });

  // ************** HELPER FUNCTIONS **************
  function updateSessionHistory(type, data) {
    const entry = {
      type,
      ...data,
      timestamp: new Date().toISOString()
    };
    sessionHistory.push(entry);
    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
  }

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

  function toggleListeningUI(listening) {
    const voiceBtn = document.getElementById('voice-btn');
    voiceBtn.classList.toggle('recording', listening);
    isListening = listening;
  }

  // ************** THEME MANAGEMENT **************
  const themeToggle = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.body.dataset.theme = currentTheme;

  themeToggle?.addEventListener('click', () => {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
  });

  // ************** SEARCH/QUERY HANDLING **************
  document.getElementById('submit-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('user-input').value.trim();
    if (!input) return;

    try {
      displayResponse("Processing...", true);
      
      const searchResults = await fetchDuckDuckGoResults(input);
      displayResponse(searchResults.AbstractText);

      // Handle search results or anything else here
    } catch (error) {
      console.error("Search error:", error);
      displayResponse("Failed to fetch search results.", true);
    }
  });

  function displayResponse(responseText, isError = false) {
    const responseBox = document.getElementById('response-box');
    if (!responseBox) {
      console.error('response-box element not found');
      return;
    }

    responseBox.textContent = responseText;
    if (isError) {
      responseBox.classList.add('error');
    } else {
      responseBox.classList.remove('error');
    }
  }

  function showLoading() {
    document.getElementById('loading-spinner').style.display = 'block';
  }

  function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
  }
});
