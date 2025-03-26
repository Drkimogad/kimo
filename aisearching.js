import { loadModels, recognizeHandwriting } from './models.js';

// DOM Elements
const elements = {
  searchInput: document.getElementById('searchInput'),
  responseContainer: document.getElementById('response-container'),
  welcomeMessage: document.getElementById('welcome-message'),
  spinner: document.getElementById('searching-spinner'),
  saveBtn: document.getElementById('save-btn'),
  clearBtn: document.getElementById('clear-btn'),
  fileUpload: document.getElementById('file-upload')
};

// State Management
let searchResults = [];

// Initialize App
export async function initializeApp() {
  try {
    elements.welcomeMessage.style.display = 'block';
    await loadModels();
    bindEvents();
  } catch (error) {
    showError('Failed to initialize AI engine');
  }
}

// Event Binding
function bindEvents() {
  // Search Submit
  document.getElementById('submit-btn').addEventListener('click', () => 
    triggerSearch(elements.searchInput.value)
  );
  
  // File Upload
  elements.fileUpload.addEventListener('change', handleFileUpload);
  
  // Clear/Save Buttons
  elements.clearBtn.addEventListener('click', clearAll);
  elements.saveBtn.addEventListener('click', saveResults);
}

// Core Search Function
async function triggerSearch(query) {
  if (!query.trim()) return;
  
  try {
    showLoading();
    const results = await Promise.all([
      fetchDuckDuckGo(query),
      fetchWikipedia(query)
    ]);
    
    searchResults = results.flat();
    displayResults();
  } catch (error) {
    showError('Search failed: ' + error.message);
  } finally {
    hideLoading();
  }
}

// API Functions
async function fetchDuckDuckGo(query) {
  const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
  const data = await response.json();
  return data.RelatedTopics.map(item => ({
    title: item.Text,
    url: item.FirstURL,
    source: 'DuckDuckGo'
  }));
}

async function fetchWikipedia(query) {
  const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`);
  const data = await response.json();
  return data.query.search.map(item => ({
    title: item.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
    source: 'Wikipedia'
  }));
}

// Display Results
function displayResults() {
  elements.responseContainer.innerHTML = `
    <div class="results-header">
      <h3>Search Results</h3>
      <div class="result-actions">
        <button id="save-results">💾 Save</button>
        <button id="clear-results">🗑️ Clear</button>
      </div>
    </div>
    <div class="result-categories">
      ${renderCategory('DuckDuckGo')}
      ${renderCategory('Wikipedia')}
    </div>
  `;
  
  // Re-bind buttons
  document.getElementById('save-results').addEventListener('click', saveResults);
  document.getElementById('clear-results').addEventListener('click', clearResults);
}

function renderCategory(source) {
  const items = searchResults.filter(r => r.source === source);
  if (!items.length) return '';
  
  return `
    <div class="result-category">
      <h4>${source}</h4>
      <ul>
        ${items.map(item => `
          <li>
            <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// File Handling
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    showLoading();
    const text = await recognizeHandwriting(file);
    elements.searchInput.value = text;
    triggerSearch(text);
  } catch (error) {
    showError('OCR failed: ' + error.message);
  } finally {
    event.target.value = ''; // Reset input
    hideLoading();
  }
}

// Utility Functions
function showLoading() {
  elements.spinner.style.display = 'block';
  elements.responseContainer.style.display = 'none';
}

function hideLoading() {
  elements.spinner.style.display = 'none';
  elements.responseContainer.style.display = 'block';
}

function showError(message) {
  elements.responseContainer.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
      <button onclick="window.location.reload()">Retry</button>
    </div>
  `;
}

function clearAll() {
  elements.searchInput.value = '';
  elements.responseContainer.innerHTML = '';
  elements.welcomeMessage.style.display = 'block';
  searchResults = [];
}

function saveResults() {
  const blob = new Blob([JSON.stringify(searchResults, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kimo-search-${new Date().toISOString()}.json`;
  a.click();
}

// Initialize
window.addEventListener('DOMContentLoaded', initializeApp);
