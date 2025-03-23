import { loadModels } from './models.js';
import { recognizeHandwriting } from './ocr.js';

// Global state declaration
let isListening = false;

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
  document.getElementById('loading').classList.add('loading-visible');
}

function hideLoading() {
  document.getElementById('loading').classList.remove('loading-visible');
}

function updateSessionHistory(type, data) {
  const entry = { type, ...data, timestamp: new Date().toISOString() };
  const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];
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
  // Remove displayProcessingMessage() call
  try {
    await loadModels();
    console.log('All models loaded');
    // Keep welcome message visible
    $('response-area').innerHTML = `
      <div class="welcome-message">
        Welcome to Kimo AI 🚀<br>
        Your AI-powered search companion and more!
      </div>
    `;
  } catch (error) {
    console.error('Initialization failed:', error);
  }

  // Theme initialization
  const themeToggle = $('theme-toggle');
  if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = currentTheme;
    themeToggle.addEventListener('click', () => {
      const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      
      // Force redraw for theme transition
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = 'block';
    });
  }
});

// API Configuration
const API_ENDPOINTS = {
  duckDuckGo: "https://api.duckduckgo.com/?q={query}&format=json",
  wikipedia: "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json&origin=*",
  google: "https://www.googleapis.com/customsearch/v1?q={query}&key=AIzaSyCP_lCg66Fd6cNdNWLO8Se12YOp8m11aAA&cx=56296f4e79fe04f61", // Fixed cx value
  braveSearch: "https://api.search.brave.com/res/v1/web/search?q={query}"
};

const BRAVE_API_HEADERS = {
  'X-Subscription-Token': 'BRAVE_API_KEY',
  'Accept': 'application/json'
};

// Search Functions
async function searchDuckDuckGo(query) {
  const url = API_ENDPOINTS.duckDuckGo.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

async function searchBrave(query) {
  const url = API_ENDPOINTS.braveSearch.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url, { 
      headers: BRAVE_API_HEADERS,
      mode: 'cors'
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.web?.results?.map(item => ({
      title: item.title,
      link: item.url
    })) || [];
  } catch (error) {
    console.error("Brave search error:", error);
    return [];
  }
}

// Search Execution
async function performSearch(query) {
  showLoading();
  try {
    const [ddgResults, wikiResults, googleResults, braveResults] = await Promise.all([
      searchDuckDuckGo(query),
      searchWikipedia(query),
      searchGoogle(query),
      searchBrave(query)
    ]);

    displayResults({
      "DuckDuckGo": ddgResults,
      "Wikipedia": wikiResults,
      "Google": googleResults,
      "Brave Search": braveResults
    });
    
  } catch (error) {
    console.error('Search failed:', error);
    displayResponse('Search failed. Please try again.', true);
  } finally {
    hideLoading();
  }
}

// Results Display
function displayResults(categorizedResults) {
  const resultsContainers = {
    "DuckDuckGo": $('duckduckgo-results'),
    "Wikipedia": $('wikipedia-results'),
    "Google": $('google-results'),
    "Brave Search": $('open-source-results')
  };

  Object.entries(categorizedResults).forEach(([category, results]) => {
    const container = resultsContainers[category];
    if (!container) return;

    container.innerHTML = '';
    
    if (results.length === 0) {
      const li = document.createElement('li');
      li.textContent = `No results found via ${category}`;
      container.appendChild(li);
      return;
    }

    results.forEach(result => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = result.link;
      link.textContent = result.title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      li.appendChild(link);
      container.appendChild(li);
    });
  });

  $('response-area').classList.add('has-results');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Search functionality
  $('submit-btn')?.addEventListener('click', async () => {
    const query = $('user-input').value.trim();
    if (query.length >= 2) {
      await performSearch(query);
    }
  });

  // Clear functionality
  $('clear-btn')?.addEventListener('click', () => {
    $('user-input').value = '';
    $('response-area').innerHTML = '';
    $('response-area').classList.remove('has-results');
  });

  // Voice input
  $('voice-btn')?.addEventListener('click', startSpeechRecognition);

  // File upload
  $('file-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      showLoading();
      try {
        if (file.type.startsWith('image/')) {
          await recognizeHandwriting(file);
        } else if (file.type === 'text/plain') {
          const text = await file.text();
          await processUserText(text);
        }
      } catch (error) {
        console.error('File processing error:', error);
        displayResponse('Error processing file.', true);
      } finally {
        hideLoading();
      }
    }
  });
});

// Voice Recognition
function startSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    displayResponse('Speech Recognition not supported', true);
    return;
  }

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.interimResults = true;

  let timeoutId;
  
  recognition.onstart = () => {
    toggleListeningUI(true);
    timeoutId = setTimeout(() => recognition.stop(), 8000);
  };

  recognition.onend = () => {
    toggleListeningUI(false);
    clearTimeout(timeoutId);
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');
    $('user-input').value = transcript;
  };

  recognition.start();
}

// Initialize UI elements
const photoUploadBox = $('photo-upload-box');
if (photoUploadBox) {
  photoUploadBox.style.display = 'none';
}
// Theme toggle
// Add to DOMContentLoaded event
$('theme-toggle').addEventListener('click', () => {
  const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  
  // Force redraw for theme transition
  document.body.style.display = 'none';
  document.body.offsetHeight; // Trigger reflow
  document.body.style.display = 'block';
});
