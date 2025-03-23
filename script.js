import { loadModels } from './models.js';
import { recognizeHandwriting } from './ocr.js';

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

// Unified DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', async () => {
  let isListening = false;
  let sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

  // Display processing message on app start
  displayProcessingMessage();

  // Model Initialization
  try {
    await loadModels();
    console.log('All models loaded successfully');
    hideProcessingMessage();
  } catch (error) {
    console.error('Model initialization failed:', error);
    displayResponse('Some features might be unavailable', true);
  }

  // Element references
  const responseArea = $('response-area');
  const searchButton = $('submit-btn');
  const userInput = $('user-input');

  // Search functionality
  if (searchButton && userInput) {
    searchButton.addEventListener('click', async () => {
      const query = userInput.value.trim();
      console.log(`Search button clicked with input: ${query}`);
      
      if (query) {
        showLoading();
        try {
          await performSearch(query);
          responseArea?.classList.remove('hidden');
        } catch (error) {
          console.error('Search failed:', error);
          displayResponse('Search failed. Please try again.', true);
        } finally {
          hideLoading();
        }
      } else {
        alert('Please enter a search query!');
      }
    });
  }

  // Initialize theme
  const themeToggle = $('theme-toggle');
  if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = currentTheme;
  }
});

// API Configuration
const API_ENDPOINTS = {
  duckDuckGo: "https://api.duckduckgo.com/?q={query}&format=json",
  wikipedia: "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json&origin=*",
  google: "https://www.googleapis.com/customsearch/v1?q={query}&key=YOUR_GOOGLE_API_KEY&cx=YOUR_SEARCH_ENGINE_ID",
  openSource: "https://api.example-opensource.com/search?q={query}"
};

// Search Functions
async function searchDuckDuckGo(query) {
  const url = API_ENDPOINTS.duckDuckGo.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.RelatedTopics?.map(item => ({ 
      title: item.Text, 
      link: item.FirstURL 
    })) || [];
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    return [];
  }
}

async function searchWikipedia(query) {
  const url = API_ENDPOINTS.wikipedia.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.query?.search?.map(item => ({
      title: item.title,
      link: `https://en.wikipedia.org/wiki/${item.title.replace(/ /g, '_')}`
    })) || [];
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return [];
  }
}

async function searchGoogle(query) {
  const url = API_ENDPOINTS.google.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items?.map(item => ({
      title: item.title,
      link: item.link
    })) || [];
  } catch (error) {
    console.error("Google Custom Search error:", error);
    return [];
  }
}

async function searchOpenSource(query) {
  const url = API_ENDPOINTS.openSource.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results?.map(item => ({
      title: item.title,
      link: item.url
    })) || [];
  } catch (error) {
    console.error("Open Source search error:", error);
    return [];
  }
}

// Unified Search Execution
async function performSearch(query) {
  const [duckDuckGoResults, wikipediaResults, googleResults, openSourceResults] = await Promise.all([
    searchDuckDuckGo(query),
    searchWikipedia(query),
    searchGoogle(query),
    searchOpenSource(query)
  ]);

  displayResults({
    "DuckDuckGo": duckDuckGoResults,
    "Wikipedia": wikipediaResults,
    "Google": googleResults,
    "Open Source": openSourceResults
  });
}

// Results Display
function displayResults(categorizedResults) {
  const resultsContainers = {
    "DuckDuckGo": $('duckduckgo-results'),
    "Wikipedia": $('wikipedia-results'),
    "Google": $('google-results'),
    "Open Source": $('open-source-results')
  };

  Object.entries(categorizedResults).forEach(([category, results]) => {
    const container = resultsContainers[category];
    if (!container) return;

    container.innerHTML = '';
    results.forEach(result => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = result.link;
      link.textContent = result.title;
      link.target = '_blank';
      li.appendChild(link);
      container.appendChild(li);
    });
  });
}

// Speech Recognition
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
  recognition.continuous = true;

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
$('voice-btn')?.addEventListener('click', startSpeechRecognition);

$('clear-btn')?.addEventListener('click', () => {
  $('user-input').value = '';
  displayResponse('', true);
});

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

$('theme-toggle')?.addEventListener('click', () => {
  const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
});

$('humanize-btn')?.addEventListener('click', async () => {
  const input = $('user-input')?.value.trim();
  if (!input) return;
  console.log(`Humanize button clicked with input: ${input}`);
  await processUserText(input);
  await checkPlagiarism(input);
});

$('response-area')?.addEventListener('click', async (e) => {
  if (e.target.classList.contains('result-link')) {
    e.preventDefault();
    const url = e.target.getAttribute('data-url');
    await loadContent(url);
  }
});

// UI Initialization
const photoUploadBox = $('photo-upload-box');
const clearButton = $('clear-btn');
if (photoUploadBox && clearButton) {
  photoUploadBox.style.display = 'none';
  clearButton.style.display = 'none';
}

$('file-upload')?.addEventListener('change', () => {
  if (photoUploadBox && clearButton) {
    photoUploadBox.style.display = 'block';
    clearButton.style.display = 'block';
  }
});
