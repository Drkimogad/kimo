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

  // Hide the response area initially // added last!
  const responseArea = document.getElementById("response-area");
  if (responseArea) {
    responseArea.classList.add("hidden");
  }

  // Attach event listener to the search button
  const searchButton = document.getElementById("search-button");
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      const query = document.getElementById("user-input").value;

      if (query) {
        performSearch(query);  // Call your search function

        // Show the results after performing the search
        responseArea.classList.remove("hidden");
      } else {
        alert("Please enter a search query!");
      }
    });
  } else {
    console.error("Search button not found in the DOM.");
  }
});

// 1. Define API Endpoints and Keys
const duckDuckGoEndpoint = "https://api.duckduckgo.com/?q={query}&format=json";
const wikipediaEndpoint = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json&origin=*";
const googleEndpoint = "https://www.googleapis.com/customsearch/v1?q={query}&key=YOUR_GOOGLE_API_KEY&cx=YOUR_SEARCH_ENGINE_ID";
const bingEndpoint = "https://api.bing.microsoft.com/v7.0/search?q={query}";
const openSourceEndpoint = "https://api.example-opensource.com/search?q={query}"; // Placeholder

// 2. Define API Functions
async function searchDuckDuckGo(query) {
  const url = duckDuckGoEndpoint.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.RelatedTopics.map(item => ({ title: item.Text, link: item.FirstURL }));
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    return [];
  }
}

async function searchWikipedia(query) {
  const url = wikipediaEndpoint.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.query.search.map(item => ({ title: item.title, link: `https://en.wikipedia.org/wiki/${item.title.replace(/ /g, '_')}` }));
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return [];
  }
}

async function searchGoogle(query) {
  const url = googleEndpoint.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.items.map(item => ({ title: item.title, link: item.link }));
  } catch (error) {
    console.error("Google Custom Search error:", error);
    return [];
  }
}

async function searchBing(query) {
  const url = bingEndpoint.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": "YOUR_BING_API_KEY" } });
    const data = await response.json();
    return data.webPages.value.map(item => ({ title: item.name, link: item.url }));
  } catch (error) {
    console.error("Bing search error:", error);
    return [];
  }
}

async function searchOpenSource(query) {
  const url = openSourceEndpoint.replace("{query}", encodeURIComponent(query));
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results.map(item => ({ title: item.title, link: item.url }));
  } catch (error) {
    console.error("Open Source search error:", error);
    return [];
  }
}

// 3. Perform All Searches Simultaneously
async function performSearch(query) {
  const [duckDuckGoResults, wikipediaResults, googleResults, bingResults, openSourceResults] = await Promise.all([
    searchDuckDuckGo(query),
    searchWikipedia(query),
    searchGoogle(query),
    searchBing(query),
    searchOpenSource(query)
  ]);

  displayResults({
    "DuckDuckGo": duckDuckGoResults,
    "Wikipedia": wikipediaResults,
    "Google": googleResults,
    "Bing": bingResults,
    "Open Source": openSourceResults
  });
}

// 4. Display Categorized Results
function displayResults(categorizedResults) {
  const resultsArea = document.getElementById("results");
  if (!resultsArea) {
    console.error("Results area not found in the DOM.");
    return;
  }
  resultsArea.innerHTML = ""; // Clear previous results

  Object.keys(categorizedResults).forEach(category => {
    const section = document.createElement("div");
    section.className = "result-category";

    const heading = document.createElement("h3");
    heading.textContent = category;
    section.appendChild(heading);

    categorizedResults[category].forEach(result => {
      const link = document.createElement("a");
      link.href = result.link;
      link.textContent = result.title;
      link.target = "_blank"; // Opens in default browser
      section.appendChild(link);
    });

    resultsArea.appendChild(section);
  });
}

// 5. Handle Search Button Click
document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("search-button");
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      const query = document.getElementById("search-input").value;
      performSearch(query);
    });
  } else {
    console.error("Search button not found in the DOM.");
  }
});

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
