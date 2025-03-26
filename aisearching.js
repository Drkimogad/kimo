import { getSummarizerModel, getPersonalizerModel, loadModels } from './models.js';

let searchInput = document.getElementById("searchInput");
let responseContainer = document.getElementById("response-container");
let welcomeMessage = document.getElementById("welcome-message");
let spinner = document.getElementById("searching-spinner");
let saveButton = document.getElementById("save-btn");
let clearButton = document.getElementById("clear-btn");

let voiceInputButton = document.getElementById("voiceInputButton");
let photoUploadButton = document.getElementById("file-upload");

// Initialize the app
async function initializeApp() {
    // Hide the response container and display the welcome message on app load
    responseContainer.style.display = 'none';
    welcomeMessage.style.display = 'block';
    
    // Hide clear and save buttons initially
    saveButton.style.display = 'none';
    clearButton.style.display = 'none';
    
    // Load models
    await loadModels();
    
    // Hide welcome message after a brief moment
    setTimeout(() => {
        welcomeMessage.style.display = 'none';
    }, 3000); // Welcome message stays for 3 seconds

    // Add event listeners for buttons
    voiceInputButton.addEventListener('click', toggleVoiceRecognition);
    saveButton.addEventListener('click', saveSearchResults);
    clearButton.addEventListener('click', clearSearchResults);
}

// Voice recognition function
let isListening = false;
let recognition;

function toggleVoiceRecognition() {
    if (!isListening) {
        startVoiceRecognition();
    } else {
        stopVoiceRecognition();
    }
}

function startVoiceRecognition() {
    isListening = true;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        displayError('Speech Recognition API not supported by this browser.');
        return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => toggleListeningUI(true);
    recognition.onend = () => {
        toggleListeningUI(false);
        searchContent(searchInput.value); // Perform search after stopping voice recognition
    };
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        displayError('Failed to recognize speech.');
    };
    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        searchInput.value = transcript;
    };

    recognition.start();
    console.log("Voice recognition started");
}

function stopVoiceRecognition() {
    isListening = false;
    if (recognition) {
        recognition.stop();
        console.log("Voice recognition stopped");
    }
}

// Search function that fetches results from DuckDuckGo and Wikipedia APIs
async function searchContent(query) {
    responseContainer.style.display = 'none';
    spinner.style.display = 'block'; // Show spinner during search

    try {
        const [duckDuckGoResults, wikipediaResults] = await Promise.all([
            fetchDuckDuckGoResults(query),
            fetchWikipediaResults(query)
        ]);

        const combinedResults = [...duckDuckGoResults, ...wikipediaResults];

        if (!combinedResults || combinedResults.length === 0) {
            throw new Error("No results found.");
        }

        // Process and display search results
        displaySearchResults(combinedResults);
    } catch (error) {
        console.error(error);
        displayError("Failed to fetch contents. Please try again later.");
    } finally {
        spinner.style.display = 'none'; // Hide spinner after search completes
    }
}

// Function to fetch DuckDuckGo results (replace with actual API call)
async function fetchDuckDuckGoResults(query) {
    // Mocking the DuckDuckGo API call here
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                { title: "DuckDuckGo Result 1", link: "https://duckduckgo.com" },
                { title: "DuckDuckGo Result 2", link: "https://duckduckgo.com" }
            ]);
        }, 2000);
    });
}

// Function to fetch Wikipedia results
async function fetchWikipediaResults(query) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srsearch=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.query.search.map(result => ({
        title: result.title,
        link: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title)}`
    }));
}

// Display search results in the response container
function displaySearchResults(results) {
    let resultsHTML = '<h3>Search Results</h3><ul>';
    
    results.forEach(result => {
        resultsHTML += `<li><a href="${result.link}" target="_blank">${result.title}</a></li>`;
    });
    
    resultsHTML += '</ul>';
    
    responseContainer.innerHTML = resultsHTML;
    responseContainer.style.display = 'block';
    
    // Show clear and save buttons when results are displayed
    saveButton.style.display = 'block';
    clearButton.style.display = 'block';
}

// Error handling function
function displayError(message) {
    responseContainer.innerHTML = `<p style="color: red;">${message}</p>`;
    responseContainer.style.display = 'block';
}

// Clear the search results and input
function clearSearchResults() {
    responseContainer.innerHTML = '';
    searchInput.value = '';
}

// Save the search results or summarized text
function saveSearchResults() {
    const contentToSave = responseContainer.innerHTML;
    if (contentToSave) {
        saveContent(contentToSave);
    } else {
        alert("No content to save.");
    }
}

// Implement saving content locally (as an example)
function saveContent(content) {
    const blob = new Blob([content], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'search_results.html';
    link.click();
}

// Initialize app on window load
window.onload = initializeApp;
