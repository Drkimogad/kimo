import { loadModels } from './models.js';
import { recognizeHandwriting } from './ocr.js';

// Global state declaration
let isListening = false;
const API_BASE = import.meta.env.VITE_API_BASE || 'https://your-proxy-service.com';

// Helper Functions
function $(id) {
  return document.getElementById(id);
}

function displayResponse(content, clear = false) {
  const responseArea = $('response-area');
  if (!responseArea) return;
  
  const div = document.createElement('div');
  div.className = 'response';
  div.textContent = content; // Safe textContent instead of innerHTML
  
  if (clear) responseArea.innerHTML = '';
  responseArea.appendChild(div);
  responseArea.scrollTop = responseArea.scrollHeight;
}

function toggleLoading(show) {
  const loader = $('loading');
  if (!loader) return;
  loader.classList.toggle('loading-visible', show);
  loader.innerHTML = show ? '<div class="spinner"></div> Searching...' : '';
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

// Consolidated DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize theme
    const themeToggle = $('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = currentTheme;
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
      });
    }

    // Load models and initialize UI
    await loadModels();
    $('response-area').innerHTML = `
      <div class="welcome-message">
        Welcome to Kimo AI 🚀<br>
        Your AI-powered search companion and more!
      </div>`;
    
    document.querySelector('.response-actions')?.style?.setProperty('display', 'none');
  } catch (error) {
    console.error('Initialization failed:', error);
    displayResponse('Initialization failed. Please refresh the page.', true);
  }
});

// API Configuration
const API_ENDPOINTS = {
  duckDuckGo: `${API_BASE}/search/ddg?q=`,
  wikipedia: `${API_BASE}/search/wiki?q=`,
  google: `${API_BASE}/search/google?q=`
};

// Search Functions
async function searchAPI(endpoint, query) {
  try {
    const response = await fetch(`${endpoint}${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

const searchDuckDuckGo = (query) => searchAPI(API_ENDPOINTS.duckDuckGo, query);
const searchWikipedia = (query) => searchAPI(API_ENDPOINTS.wikipedia, query);
const searchGoogle = (query) => searchAPI(API_ENDPOINTS.google, query);

// Search Execution
async function performSearch(query) {
  // Validate input
  if (!query || query.length < 2 || /[<>]/.test(query)) {
    displayResponse('Please enter a valid search query (2+ characters, no special symbols)');
    return;
  }

  toggleLoading(true);
  try {
    const [ddgResults, wikiResults, googleResults] = await Promise.all([
      searchDuckDuckGo(query),
      searchWikipedia(query),
      searchGoogle(query)
    ]);

    displayResults({
      "DuckDuckGo": ddgResults,
      "Wikipedia": wikiResults,
      "Google": googleResults
    });

    $('response-area').classList.add('has-results');
    document.querySelector('.response-actions')?.style?.setProperty('display', 'flex');
  } catch (error) {
    console.error('Search failed:', error);
    displayResponse('Search failed. Please try again.', true);
  } finally {
    toggleLoading(false);
  }
}

// Results Display
function displayResults(categorizedResults) {
  const sanitizeHTML = (str) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const resultsContainers = {
    "DuckDuckGo": $('duckduckgo-results'),
    "Wikipedia": $('wikipedia-results'),
    "Google": $('google-results')
  };

  Object.entries(categorizedResults).forEach(([category, results]) => {
    const container = resultsContainers[category];
    if (!container) return;

    container.innerHTML = '';
    
    if (!results?.length) {
      const li = document.createElement('li');
      li.textContent = `No results found via ${category}`;
      container.appendChild(li);
      return;
    }

    results.forEach(result => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = sanitizeHTML(result.link);
      link.textContent = sanitizeHTML(result.title);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      li.appendChild(link);
      container.appendChild(li);
    });
  });
}

// File Processing
async function processUserText(text) {
  try {
    // Basic sanitization before processing
    const cleanText = text.replace(/[<>]/g, '');
    await performSearch(cleanText);
  } catch (error) {
    console.error('Text processing error:', error);
    displayResponse('Error processing text file.', true);
  }
}

// Event Listeners
function setupEventListeners() {
  // Search functionality
  $('submit-btn')?.addEventListener('click', async () => {
    const query = $('user-input').value.trim();
    if (query) await performSearch(query);
  });

  // Clear functionality
  $('clear-btn')?.addEventListener('click', () => {
    $('user-input').value = '';
    $('response-area').innerHTML = '';
    $('response-area').classList.remove('has-results');
    document.querySelector('.response-actions')?.style?.setProperty('display', 'none');
  });

  // Voice input
  $('voice-btn')?.addEventListener('click', startSpeechRecognition);

  // File upload
  $('file-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      displayResponse('File too large (max 5MB)');
      return;
    }

    toggleLoading(true);
    try {
      if (file.type.startsWith('image/')) {
        await recognizeHandwriting(file);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        await processUserText(text);
      } else {
        displayResponse('Unsupported file type');
      }
    } catch (error) {
      console.error('File processing error:', error);
      displayResponse('Error processing file.', true);
    } finally {
      toggleLoading(false);
    }
  });
}

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

  recognition.onresult = async (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('')
      .replace(/[<>]/g, ''); // Basic sanitization

    $('user-input').value = transcript;
    if (transcript.length >= 2) await performSearch(transcript);
  };

  recognition.start();
}

// Initialize UI elements
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  $('photo-upload-box').style.display = 'none';
});

// new AI enhancements 
// ==================== AI ENHANCEMENTS ==================== //
// Import AI modules at top (add after existing imports)
import { Summarizer } from './ai/summarizer.js';
import { Personalizer } from './ai/personalizer.js';
import { OfflineStorage } from './utils/offlineStorage.js';

// Add AI state management
let aiConfig = {
  personalization: true,
  summarization: true,
  modelStatus: 'loading'
};

// Add after DOMContentLoaded handler
async function initializeAISystems() {
  try {
    await OfflineStorage.init();
    await Summarizer.warmup();
    aiConfig.modelStatus = 'ready';
    console.log('AI systems initialized');
  } catch (error) {
    console.error('AI initialization failed:', error);
    aiConfig.modelStatus = 'error';
  }
}

// Add to existing DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', async () => {
  // Add to existing try block
  try {
    // Add after loadModels()
    await initializeAISystems();
    
    // Update welcome message
    const welcomeMessage = aiConfig.modelStatus === 'ready' 
      ? 'AI-powered search companion! 🧠'
      : 'Basic search companion';
    
    $('response-area').innerHTML = `
      <div class="welcome-message">
        Welcome to Kimo AI 🚀<br>
        ${welcomeMessage}
      </div>`;
      
  } catch (error) {
    // Existing error handling
  }
});

// Enhanced performSearch with AI features
async function performSearch(query) {
  // Add to validation
  if (aiConfig.modelStatus === 'error') {
    displayResponse('AI features temporarily unavailable');
  }

  // Add personalization tracking
  if (aiConfig.personalization) {
    await Personalizer.trackSearch(query);
  }

  // Modify results processing
  const [ddgResults, wikiResults, googleResults] = await Promise.all([
    searchDuckDuckGo(query),
    searchWikipedia(query),
    searchGoogle(query)
  ]);

  // Personalize results
  let processedResults = {
    "DuckDuckGo": aiConfig.personalization 
      ? await Personalizer.rankResults(ddgResults) 
      : ddgResults,
    "Wikipedia": aiConfig.personalization
      ? await Personalizer.rankResults(wikiResults)
      : wikiResults,
    "Google": aiConfig.personalization
      ? await Personalizer.rankResults(googleResults)
      : googleResults
  };

  displayResults(processedResults);

  // Add AI summary
  if (aiConfig.summarization) {
    const summary = await Summarizer.generate(
      [...ddgResults, ...wikiResults, ...googleResults]
        .map(r => r.title)
        .join('. ')
    );
    displayResponse(`AI Summary: ${summary}`);
  }
}

// Add new event listeners at bottom
document.addEventListener('DOMContentLoaded', () => {
  // Privacy toggle
  $('#privacy-toggle').addEventListener('click', () => {
    aiConfig.personalization = !aiConfig.personalization;
    localStorage.setItem('aiPrivacy', aiConfig.personalization);
    displayResponse(`Personalization ${aiConfig.personalization ? 'enabled' : 'disabled'}`);
  });

  // Summary toggle
  $('#summary-toggle').addEventListener('click', () => {
    aiConfig.summarization = !aiConfig.summarization;
    localStorage.setItem('aiSummary', aiConfig.summarization);
    displayResponse(`Summarization ${aiConfig.summarization ? 'enabled' : 'disabled'}`);
  });

  // Humanize button
  $('#humanize-btn').addEventListener('click', async () => {
    const results = Array.from(document.querySelectorAll('.response'))
      .map(el => el.textContent)
      .join('\n');
    
    const simplified = await Summarizer.simplify(results);
    displayResponse(simplified, true);
  });
});
