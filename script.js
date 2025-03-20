import { loadModels } from 'https://drkimogad.github.io/kimo/models.js';  // Add this import line at the top of your script.js
import { recognizeHandwriting } from 'https://drkimogad.github.io/kimo/ocr.js';  // Import the handwriting recognition function

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

  // ************** IMAGE PREPROCESSING **************
  function preprocessImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Apply Grayscale
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;      // Red
      data[i + 1] = avg;  // Green
      data[i + 2] = avg;  // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  function adjustImageContrast(img, contrast = 100) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Apply Contrast
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;     // Red
      data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
      data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  // Function to load image as a Promise
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // ************** IMAGE UPLOAD HANDLER **************
  async function handleImageUpload(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      
      // Preprocess the image
      const preprocessedCanvas = preprocessImage(img);
      const contrastAdjustedCanvas = adjustImageContrast(preprocessedCanvas, 50); // Adjust contrast

      // Call OCR on the preprocessed image
      const recognizedText = await recognizeHandwriting(contrastAdjustedCanvas);  // Call the OCR function
      displayResponse(`Handwriting Recognition: ${recognizedText}`);
      updateSessionHistory('handwriting', { file: file.name, text: recognizedText });
      
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
