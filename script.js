import { loadModels } from './models.js';
import { recognizeHandwriting } from './ocr.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  let isListening = false;
  let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

  // Model Initialization
  try {
    await loadModels();
    console.log('All models loaded successfully');
  } catch (error) {
    console.error('Model initialization failed:', error);
    displayResponse('Some features might be unavailable', true);
  }

  // Helper Functions
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

  // DuckDuckGo Search
  async function searchDuckDuckGo(query) {
    console.log(`Searching DuckDuckGo for: ${query}`);
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

  // Define startSpeechRecognition
  async function startSpeechRecognition() {
    console.log('Starting speech recognition');
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

  // Event Listeners
  $('submit-btn')?.addEventListener('click', async () => {
    const input = $('user-input')?.value.trim();
    if (!input) return;
    console.log(`Search button clicked with input: ${input}`);
    await searchDuckDuckGo(input);
  });

  // More Event Listeners and Functions...
  // (Handle Image Upload, OCR, Speech Recognition, etc.)

  // File Upload Handling
  $('file-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log(`File uploaded: ${file.name}`);
    try {
      showLoading();
      if (file.type.startsWith('image/')) {
        await classifyUploadedImage(file);
        await handleImageUpload(file);
      } else if (file.type === 'text/plain') {
        const textContent = await file.text();
        await processUserText(textContent);
      }
    } catch (error) {
      console.error('File processing error:', error);
      displayResponse('Error processing file.', true);
    } finally {
      hideLoading();
    }
  });

  // Save Button Functionality
  $('save-btn')?.addEventListener('click', () => {
    const responseArea = $('response-area');
    if (!responseArea || !responseArea.innerText.trim()) return;

    console.log('Save button clicked');
    const savedData = responseArea.innerText.trim();
    const blob = new Blob([savedData], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'saved_output.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    displayResponse('Saved successfully.');
  });

  // Theme Toggle
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

  // Voice Input Button
  $('voice-btn')?.addEventListener('click', startSpeechRecognition);

  // Humanize Button
  $('humanize-btn')?.addEventListener('click', async () => {
    const input = $('user-input')?.value.trim();
    if (!input) return;
    console.log(`Humanize button clicked with input: ${input}`);
    await processUserText(input);
    await checkPlagiarism(input);
  });
});
