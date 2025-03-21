// Import external scripts
import tf from './main.js';
import loadModels, { recognizeHandwriting } from './models.js';  // Ensure we import recognizeHandwriting
import { processOCR } from './ocr.js';  // Ensure we import processOCR if it's in ocr.js

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
    const loader = $('loading');
    if (loader) loader.classList.remove('loading-hidden');
  }

  function hideLoading() {
    const loader = $('loading');
    if (loader) loader.classList.add('loading-hidden');
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

  // ************** DUCKDUCKGO SEARCH **************
  async function searchDuckDuckGo(query) {
    try {
      showLoading();
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
      const data = await response.json();
      if (data && data.RelatedTopics) {
        const results = data.RelatedTopics.map(topic => topic.Text).join('<br>');
        displayResponse(`DuckDuckGo Search Results:<br>${results}`, true);
        updateSessionHistory('search', { query, results });
      } else {
        displayResponse('No results found.', true);
      }
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      displayResponse('Failed to search online.', true);
    } finally {
      hideLoading();
    }
  }

  // ************** IMAGE CLASSIFICATION **************
  async function classifyUploadedImage(file) {
    try {
      showLoading();
      const img = await loadImage(file);
      const results = await classifyImage(img);
      displayResponse(`Image Classification: ${results}`, true);
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
      displayResponse(`Processed Text: ${processedText}`, true);
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
      const recognizedText = await recognizeHandwriting(file);  // Ensure we call recognizeHandwriting
      displayResponse(`Recognized Text: ${recognizedText}`, true);
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
      const recognizedText = await recognizeHandwriting(canvas);  // Ensure we call recognizeHandwriting
      displayResponse(`Canvas OCR: ${recognizedText}`, true);
      updateSessionHistory('drawing', { text: recognizedText });
    } catch (error) {
      console.error('Canvas OCR error:', error);
      displayResponse('Failed to recognize handwriting.', true);
    } finally {
      hideLoading();
    }
  }

  // ************** SPEECH RECOGNITION **************
  async function startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      displayResponse('Speech Recognition API not supported by this browser.', true);
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => toggleListeningUI(true);
    recognition.onend = () => toggleListeningUI(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      displayResponse('Failed to recognize speech.', true);
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      $('user-input').value = transcript;
    };

    recognition.start();
  }

  // ************** PLAGIARISM DETECTION **************
  async function checkPlagiarism(text) {
    try {
      showLoading();
      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
      const previousTexts = sessionHistory.filter(entry => entry.type === 'text-processing').map(entry => entry.input);
      const results = previousTexts.map(entry => {
        // Simple plagiarism check by comparing text similarity
        return text.includes(entry) ? `Similar content found: "${entry}"` : null;
      }).filter(result => result !== null);

      if (results.length > 0) {
        displayResponse(`Plagiarism Check Results:<br>${results.join('<br>')}`, true);
      } else {
        displayResponse('No plagiarism detected.', true);
      }
    } catch (error) {
      console.error('Plagiarism detection error:', error);
      displayResponse('Failed to check for plagiarism.', true);
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
    await searchDuckDuckGo(input);
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

  // ************** VOICE INPUT BUTTON **************
  $('voice-btn')?.addEventListener('click', startSpeechRecognition);

  // ************** HUMANIZE BUTTON **************
  $('humanize-btn')?.addEventListener('click', async () => {
    const input = $('user-input')?.value.trim();
    if (!input) return;
    await processUserText(input);
    await checkPlagiarism(input);
  });
});
