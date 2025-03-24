// Unregister previous service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

import { loadModels } from './models.js';
import { recognizeHandwriting } from './ocr.js';
import { Summarizer } from './models/summarizer.js';
import { Personalizer } from './models/personalizer.js';
import { OfflineStorage } from './models/offlineStorage.js';

// script.js - Your main application logic
export async function analyzeContent(content) {
  try {
    // Lazy-load models only when needed
    const { checkPlagiarism } = await import('./text-model.js');
    const { classifyImage } = await import('./image-model.js');

    // Text analysis
    const textResult = await checkPlagiarism(content.text);
    
    // Image analysis
    const imageResult = await classifyImage(content.image);

    return {
      text: textResult,
      image: imageResult
    };

  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Content analysis unavailable");
  }
}

// Initialize when DOM loads
window.addEventListener('DOMContentLoaded', () => {
  // Example usage
  const sampleContent = {
    text: "Artificial intelligence is transforming the world",
    image: document.getElementById('preview-image')
  };

  analyzeContent(sampleContent)
    .then(results => console.log("Analysis results:", results))
    .catch(console.error);
});


// Function to load the model dynamically
async function loadModel() {
    const generator = await pipeline('text-generation', 'Xenova/t5-small', {
        cache: true, // Enable caching after the first download
        progress_callback: (progress) => console.log(`Downloading: ${Math.round(progress * 100)}%`),
    });

    const result = await generator('Translate this text to French: Hello, how are you?');
    console.log(result); // Example output from the text generation model
}

loadModel(); // Call the function to load the model when the app runs


// Global state declaration
let isListening = false;
const API_BASE = import.meta.env.VITE_API_BASE || 'https://your-proxy-service.com';
let aiConfig = {
  personalization: true,
  summarization: true,
  modelStatus: 'loading'
};

// Helper Functions
function $(id) {
  return document.getElementById(id);
}

function displayResponse(content, clear = false) {
  const responseArea = $('response-area');
  if (!responseArea) return;
  
  const div = document.createElement('div');
  div.className = 'response';
  div.textContent = content;
  
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

function toggleListeningUI(listening) {
  const voiceBtn = $('voice-btn');
  if (voiceBtn) voiceBtn.classList.toggle('recording', listening);
  isListening = listening;
}

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

// Unified Search Execution
async function performSearch(query) {
  if (!query || query.length < 2 || /[<>]/.test(query)) {
    displayResponse('Please enter a valid search query (2+ characters, no special symbols)');
    return;
  }

  if (aiConfig.modelStatus === 'error') {
    displayResponse('AI features temporarily unavailable');
  }

  toggleLoading(true);
  try {
    const [ddgResults, wikiResults, googleResults] = await Promise.all([
      searchDuckDuckGo(query),
      searchWikipedia(query),
      searchGoogle(query)
    ]);

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

    if (aiConfig.summarization) {
      const summary = await Summarizer.generate(
        [...ddgResults, ...wikiResults, ...googleResults]
          .map(r => r.title)
          .join('. ')
      );
      displayResponse(`AI Summary: ${summary}`);
    }

    $('response-area').classList.add('has-results');
    document.querySelector('.response-actions').style.display = 'flex';

    if (aiConfig.personalization) {
      await Personalizer.trackSearch(query);
    }

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

    container.innerHTML = results.length === 0 
      ? `<li>No ${category} results found</li>`
      : '';

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

// AI Initialization
async function initializeAISystems() {
  try {
    await OfflineStorage.init();
    await Summarizer.warmup();
    aiConfig.modelStatus = 'ready';
  } catch (error) {
    console.error('AI initialization failed:', error);
    aiConfig.modelStatus = 'error';
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
        await performSearch(text.replace(/[<>]/g, ''));
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

  // AI Controls
  $('#privacy-toggle').addEventListener('click', () => {
    aiConfig.personalization = !aiConfig.personalization;
    localStorage.setItem('aiPrivacy', aiConfig.personalization);
    displayResponse(`Personalization ${aiConfig.personalization ? 'enabled' : 'disabled'}`);
  });

  $('#summary-toggle').addEventListener('click', () => {
    aiConfig.summarization = !aiConfig.summarization;
    localStorage.setItem('aiSummary', aiConfig.summarization);
    displayResponse(`Summarization ${aiConfig.summarization ? 'enabled' : 'disabled'}`);
  });

  $('#humanize-btn').addEventListener('click', async () => {
    const results = Array.from(document.querySelectorAll('.response'))
      .map(el => el.textContent)
      .join('\n');
    const simplified = await Summarizer.simplify(results);
    displayResponse(simplified, true);
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
      .replace(/[<>]/g, '');
    
    $('user-input').value = transcript;
    if (transcript.length >= 2) await performSearch(transcript);
  };

  recognition.start();
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  try {
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

    await loadModels();
    await initializeAISystems();
    
    const welcomeMessage = aiConfig.modelStatus === 'ready' 
      ? 'AI-powered search companion! 🧠'
      : 'Basic search companion';
    
    $('response-area').innerHTML = `
      <div class="welcome-message">
        Welcome to Kimo AI 🚀<br>
        ${welcomeMessage}
      </div>`;

    setupEventListeners();
    $('photo-upload-box').style.display = 'none';

  } catch (error) {
    console.error('Initialization failed:', error);
    displayResponse('Initialization failed. Please refresh the page.', true);
  }
});

// ONNX Runtime Model
async function run() {
  try {
    // 1. Use a simple base64-encoded model (y = 2x)
    const modelBase64 = 
      "o4IAAAKAAQADAAIAAAAAAAAAggABAP////8CAAAAAQAAAAYAAABsaW5lYXIAAAAAAgAAABEAAAAHAAAAeAAAAAAAAAAA" +
      "AAAAAAEAAAAFAAAAeAAAAAEAAAACAAAAAQAAAAUAAAB5AAAAAQAAAAIAAAAFAAAAbW9kZWwAAAAABQAAAGxpbmVh" +
      "cgAAAAADAAAAAQAAABQAAAAQAAAAAgAAAAAAAABAAAAAQAAAAAEAAAA=";

    // 2. Convert to Uint8Array
    const modelBytes = Uint8Array.from(atob(modelBase64), c => c.charCodeAt(0));
    
    // 3. Load model
    const session = await ort.InferenceSession.create(modelBytes);
    
    // 4. Test with input x=3
    const input = new ort.Tensor('float32', new Float32Array([3]), [1]);
    const output = await session.run({ x: input });
    
    console.log("Result:", output.y.data); // Should output [6]
    
  } catch (error) {
    console.error('ONNX Error:', error);
  }
}
