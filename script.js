// Import external scripts
import { loadModels } from 'https://drkimogad.github.io/kimo/models.js';
import { recognizeHandwriting } from 'https://drkimogad.github.io/kimo/ocr.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  let isListening = false;
  let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

  // ************** MODEL INITIALIZATION **************
  try {
    await loadModels(); // Load AI models at startup
    console.log('All models loaded successfully');
  } catch (error) {
    console.error('Model initialization failed:', error);
    displayResponse('Some features might be unavailable', true);
  }

  // ************** HELPER FUNCTIONS **************
  function $(id) {
    return document.getElementById(id);
  }

  function displayResponse(content, clear = false) {
    const responseArea = $('response-area');
    if (!responseArea) return;
    if (clear) responseArea.innerHTML = '';
    responseArea.innerHTML += `<div class="response">${content}</div>`;
    responseArea.scrollTop = responseArea.scrollHeight;
  }

  function showLoading() {
    const loader = $('loading-spinner');
    if (loader) loader.style.display = 'block';
  }

  function hideLoading() {
    const loader = $('loading-spinner');
    if (loader) loader.style.display = 'none';
  }

  function updateSessionHistory(type, data) {
    const entry = { type, ...data, timestamp: new Date().toISOString() };
    sessionHistory.push(entry);
    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory));
  }

  // ************** IMAGE PREPROCESSING **************
  function preprocessImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Convert to grayscale
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = avg;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  // Load image from file input
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // ************** OCR HANDLING **************
  async function handleImageUpload(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      const processedCanvas = preprocessImage(img);

      // Real-time OCR processing
      const recognizedText = await recognizeHandwriting(processedCanvas);
      displayResponse(`Recognized Text: ${recognizedText}`);
      updateSessionHistory('handwriting', { file: file.name, text: recognizedText });

    } catch (error) {
      console.error('Image processing error:', error);
      displayResponse('Failed to analyze image', true);
    } finally {
      hideLoading();
    }
  }

  // OCR for Canvas Drawing
  async function handleCanvasOCR(canvas) {
    try {
      showLoading();
      const recognizedText = await recognizeHandwriting(canvas);
      displayResponse(`Canvas OCR: ${recognizedText}`);
      updateSessionHistory('drawing', { text: recognizedText });
    } catch (error) {
      console.error('Canvas OCR error:', error);
      displayResponse('Failed to recognize handwriting.', true);
    } finally {
      hideLoading();
    }
  }

  // ************** FILE UPLOAD HANDLING **************
  $('file-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showLoading();

      if (file.type.startsWith('image/')) {
        await handleImageUpload(file); // OCR for images
      } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        displayResponse(`Uploaded Text: ${textContent}`);
        updateSessionHistory('text', { content: textContent });
      }
      
    } catch (error) {
      console.error('File processing error:', error);
      displayResponse('Error processing file.', true);
    } finally {
      hideLoading();
    }
  });

  // ************** CANVAS DRAWING **************
  const canvas = $('drawing-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0, lastY = 0;

    canvas.width = 800;
    canvas.height = 200;

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

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseout', endDrawing);

    $('clear-canvas')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    $('recognize-btn')?.addEventListener('click', () => handleCanvasOCR(canvas));
  }

  // ************** CROPPING TOOL **************
  function enableCropping(canvas) {
    const cropButton = document.getElementById('crop-btn');
    cropButton.addEventListener('click', async () => {
      const ctx = canvas.getContext('2d');
      const cropWidth = 200;  // Define crop width
      const cropHeight = 100; // Define crop height
      const cropX = 100;      // Define starting X position
      const cropY = 50;       // Define starting Y position

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedCtx = croppedCanvas.getContext('2d');
      
      croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      // Proceed with OCR on the cropped section
      const recognizedText = await recognizeHandwriting(croppedCanvas);
      displayResponse(`Cropped Handwriting: ${recognizedText}`);
      updateSessionHistory('cropped', { text: recognizedText });
    });
  }
  
  // ************** THEME TOGGLE **************
  const themeToggle = $('theme-toggle');
  if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = currentTheme;

    themeToggle.addEventListener('click', () => {
      const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = newTheme;
      localStorage.setItem('theme', newTheme);
    });
  }

  // ************** SEARCH HANDLING **************
  $('submit-btn')?.addEventListener('click', async () => {
    const input = $('user-input')?.value.trim();
    if (!input) return;

    try {
      displayResponse('Searching...', true);
      const searchResults = await fetchDuckDuckGoResults(input);
      displayResponse(searchResults.AbstractText);
    } catch (error) {
      console.error('Search error:', error);
      displayResponse('Failed to fetch search results.', true);
    }
  });
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
