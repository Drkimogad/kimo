// aisearching.js - Main App Logic
import { 
  loadModels, 
  imageModel, 
  textModel,
  Summarizer,
  Personalizer 
} from './models.js';

// DOM Elements
const elements = {
  searchInput: document.getElementById('searchInput'),
  responseContainer: document.getElementById('response-container'),
  fileUpload: document.getElementById('file-upload')
};

// Initialize App
export async function initializeApp() {
  try {
    await loadModels();
    bindEventListeners();
  } catch (error) {
    showError('Failed to initialize AI engine');
  }
}

// Event Bindings
function bindEventListeners() {
  // File Upload
  elements.fileUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await imageModel.classify(file);
      elements.searchInput.value = text;
      triggerSearch(text);
    } catch (error) {
      showError('Image processing failed');
    }
  });

  // Search Trigger
  document.getElementById('search-btn').addEventListener('click', () => {
    triggerSearch(elements.searchInput.value);
  });
}

// Core Functions
async function triggerSearch(query) {
  try {
    const [ddgResults, wikiResults] = await Promise.all([
      fetchDuckDuckGo(query),
      fetchWikipedia(query)
    ]);

    const personalized = await Personalizer.rankResults([
      ...ddgResults,
      ...wikiResults
    ]);

    displayResults(personalized);
  } catch (error) {
    showError('Search failed. Please try again.');
  }
}

// Display Results
function displayResults(results) {
  elements.responseContainer.innerHTML = results
    .map(result => `
      <div class="result">
        <a href="${result.url}" target="_blank">${result.title}</a>
        <p>${result.description || ''}</p>
      </div>
    `)
    .join('');
}

// Error Handling
function showError(message) {
  elements.responseContainer.innerHTML = `
    <div class="error">
      ${message}
      <button onclick="window.location.reload()">Retry</button>
    </div>
  `;
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initializeApp);
