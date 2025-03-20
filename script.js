// Import external scripts
import tf from './main.js';
import loadModels from 'https://drkimogad.github.io/kimo/models.js';
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

  function toggleListeningUI(listening) {
    const voiceBtn = $('voice-btn');
    if (voiceBtn) voiceBtn.classList.toggle('recording', listening);
    isListening = listening;
  }

  // ************** IMAGE CLASSIFICATION **************
  async function classifyUploadedImage(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      const results = await classifyImage(img);
      displayResponse(`Image Classification: ${results}`);
      updateSessionHistory('image-classification', { file: file.name, classification: results });
    } catch (error) {
      console.error('Image classification error:', error);
      displayResponse('Failed to classify image.', true);
    } finally {
      hideLoading();
    }
  }

  // ************** TEXT PROCESSING **************
  async function processUserText(text) {
    try {
      showLoading();
      const processedText = await processText(text);
      displayResponse(`Processed Text: ${processedText}`);
      updateSessionHistory('text-processing', { input: text, processed: processedText });
    } catch (error) {
      console.error('Text processing error:', error);
      displayResponse('Failed to process text.', true);
    } finally {
      hideLoading();
    }
  }

  // ************** OCR HANDLING **************
  async function handleImageUpload(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      const recognizedText = await recognizeHandwriting(img);
      displayResponse(`Recognized Text: ${recognizedText}`);
      updateSessionHistory('handwriting', { file: file.name, text: recognizedText });
    } catch (error) {
      console.error('Image processing error:', error);
      displayResponse('Failed to analyze image.', true);
    } finally {
      hideLoading();
    }
  }

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
        await classifyUploadedImage(file); // Image classification
        await handleImageUpload(file); // OCR
      } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        await processUserText(textContent); // Text processing
      }
    } catch (error) {
      console.error('File processing error:', error);
      displayResponse('Error processing file.', true);
    } finally {
      hideLoading();
    }
  });

  // ************** SEARCH HANDLING **************
  $('submit-btn')?.addEventListener('click', async () => {
    const input = $('user-input')?.value.trim();
    if (!input) return;
    await processUserText(input);
  });

  // ************** SAVE BUTTON FUNCTIONALITY **************
  $('save-btn')?.addEventListener('click', () => {
    const responseArea = $('response-area');
    if (!responseArea || !responseArea.innerText.trim()) return;

    const savedData = responseArea.innerText.trim();
    const blob = new Blob([savedData], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'saved_output.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    displayResponse('Saved successfully.');
  });

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
});
