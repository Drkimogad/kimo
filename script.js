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
// online searching function//
// Combined search logic and UI/UX enhancements
async function performSearch(query) {
  const responseArea = document.getElementById('response-area');
  responseArea.innerHTML = `<p>Searching for: <strong>${query}</strong>...</p>`;

  // Create containers for categorized results
  responseArea.innerHTML += `
    <div id="search-results">
      <h3>DuckDuckGo Results</h3>
      <ul id="duckduckgo-results" class="results-list"></ul>

      <h3>Wikipedia Results</h3>
      <ul id="wikipedia-results" class="results-list"></ul>

      <h3>External URL Results (Fetched via Proxy)</h3>
      <ul id="external-url-results" class="results-list"></ul>
    </div>
  `;

  try {
    // Perform DuckDuckGo Search
    const duckDuckGoResults = await fetchDuckDuckGoResults(query);
    displayResults(duckDuckGoResults, 'duckduckgo-results');

    // Perform Wikipedia Search
    const wikipediaResults = await fetchWikipediaResults(query);
    displayResults(wikipediaResults, 'wikipedia-results');

    // Proxy search - fetch URLs via your Vercel proxy
    const externalUrls = ["https://example1.com", "https://example2.com"];
    for (const url of externalUrls) {
      const proxyResponse = await fetchExternalUrl(url);
      displayExternalResult(proxyResponse, 'external-url-results');
    }
  } catch (error) {
    console.error('Error performing search:', error);
    responseArea.innerHTML += '<p style="color:red;">An error occurred while fetching search results.</p>';
  }
}

// Fetching DuckDuckGo Results
async function fetchDuckDuckGoResults(query) {
  const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1`;
  const response = await fetch(url);
  const data = await response.json();
  return data.RelatedTopics.slice(0, 5).map(item => ({
    title: item.Text,
    link: item.FirstURL,
  }));
}

// Fetching Wikipedia Results
async function fetchWikipediaResults(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*`;
  const response = await fetch(url);
  const data = await response.json();
  return data.query.search.slice(0, 5).map(item => ({
    title: item.title,
    link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
  }));
}

// Fetch External URLs via Vercel Proxy
async function fetchExternalUrl(url) {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  const data = await response.text();
  return { title: url, content: data }; // Return the raw HTML or relevant text
}

// Display search results dynamically
function displayResults(results, containerId) {
  const container = document.getElementById(containerId);
  results.forEach(result => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `<a href="${result.link}" target="_blank">${result.title}</a>`;
    container.appendChild(listItem);
  });
}

// Display external URL content
function displayExternalResult(result, containerId) {
  const container = document.getElementById(containerId);
  const listItem = document.createElement('li');
  listItem.innerHTML = `<details><summary>${result.title}</summary><p>${result.content.slice(0, 200)}...</p></details>`;
  container.appendChild(listItem);
}

// Basic Styling
const style = document.createElement('style');
style.innerHTML = `
  #search-results {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 10px;
    background-color: #f9f9f9;
  }
  .results-list {
    list-style-type: none;
    padding: 0;
  }
  .results-list li {
    margin-bottom: 10px;
  }
  .results-list a {
    color: #007bff;
    text-decoration: none;
  }
  .results-list a:hover {
    text-decoration: underline;
  }
  details {
    cursor: pointer;
  }
`;
document.head.appendChild(style);

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
