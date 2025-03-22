import { loadModels } from './models.js';
import { recognizeHandwriting } from './ocr.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  let isListening = false;
  let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

  // Display processing message on app start
  displayProcessingMessage();

  // Model Initialization
  try {
    await loadModels();
    console.log('All models loaded successfully');
    hideProcessingMessage(); // Hide processing message
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

  function displayProcessingMessage() {
    const loader = $('loading');
    if (loader) {
      loader.classList.remove('loading-hidden');
      loader.textContent = 'Processing...';
    }
  }

  function hideProcessingMessage() {
    const loader = $('loading');
    if (loader) loader.classList.add('loading-hidden');
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
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.RelatedTopics) {
        const results = data.RelatedTopics.map(topic => {
          if (topic.FirstURL) {
            return `<a href="#" data-url="${topic.FirstURL}" class="result-link">${topic.Text}</a>`;
          } else {
            return topic.Text;
          }
        }).join('<br>');
        return results;
      } else {
        return 'No results found on DuckDuckGo.';
      }
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return 'Failed to search DuckDuckGo.';
    }
  }

  async function searchWikipedia(query) {
    console.log(`Searching Wikipedia for: ${query}`);
    try {
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
      const data = await response.json();
      if (data && data.query && data.query.search) {
        const results = data.query.search.map(result => {
          return `<a href="#" data-url="https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}" class="result-link">${result.title}</a>: ${result.snippet}`;
        }).join('<br>');
        return results;
      } else {
        return 'No results found on Wikipedia.';
      }
    } catch (error) {
      console.error('Wikipedia search error:', error);
      return 'Failed to search Wikipedia.';
    }
  }

  async function searchAndGenerate(query) {
    showLoading();
    const duckDuckGoResults = await searchDuckDuckGo(query);
    const wikipediaResults = await searchWikipedia(query);
    displayResponse(`DuckDuckGo Results:<br>${duckDuckGoResults}<br><br>Wikipedia Results:<br>${wikipediaResults}`, true);
    updateSessionHistory('search', { query, duckDuckGoResults, wikipediaResults });
    hideLoading();
  }

  async function loadContent(url) {
    try {
      showLoading();
      const proxyUrl = `https://kimo-peach.vercel.app?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.text();
      displayResponse(`<div>${data}</div>`, false);
      hideLoading();
    } catch (error) {
      console.error('Failed to load content:', error);
      displayResponse('Failed to load content.', true);
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
    recognition.continuous = true; // Allow for continuous listening

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
    await searchAndGenerate(input);
  });

  // Clear Button
  $('clear-btn')?.addEventListener('click', () => {
    $('user-input').value = '';
    displayResponse('', true);
  });

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

  // Event delegation for result links
  $('response-area')?.addEventListener('click', async (e) => {
    if (e.target.classList.contains('result-link')) {
      e.preventDefault();
      const url = e.target.getAttribute('data-url');
      await loadContent(url);
    }
  });

  // Hide photo upload box initially
  const photoUploadBox = $('photo-upload-box');
  const clearButton = $('clear-btn');
  if (photoUploadBox && clearButton) {
    photoUploadBox.style.display = 'none';
    clearButton.style.display = 'none';
  }

  // Show photo upload box when a file is selected
  $('file-upload')?.addEventListener('change', () => {
    if (photoUploadBox && clearButton) {
      photoUploadBox.style.display = 'block';
      clearButton.style.display = 'block';
    }
  });
});
