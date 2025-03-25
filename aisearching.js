// aisearching.js

import { loadModels, summarizerModel, personalizerModel } from './models.js';

let searchInput = document.getElementById("searchInput");
let responseContainer = document.getElementById("responseContainer");
let welcomeMessage = document.getElementById("welcomeMessage");
let spinner = document.getElementById("spinner");
let saveButton = document.getElementById("saveButton");

let voiceInputButton = document.getElementById("voiceInputButton");
let photoUploadButton = document.getElementById("photoUploadButton");

// Initialize the app
async function initializeApp() {
    // Hide the response container and display the welcome message on app load
    responseContainer.style.display = 'none';
    welcomeMessage.style.display = 'block';
    
    // Load models
    await loadModels();
    
    // Hide welcome message after a brief moment
    setTimeout(() => {
        welcomeMessage.style.display = 'none';
    }, 3000); // Welcome message stays for 3 seconds
}

// Voice recognition function
let isListening = false;

function toggleVoiceRecognition() {
    if (!isListening) {
        startVoiceRecognition();
    } else {
        stopVoiceRecognition();
    }
}

function startVoiceRecognition() {
    isListening = true;
    // Your voice recognition logic goes here (web speech API or custom implementation)
    console.log("Voice recognition started");
    // Trigger speech recognition
}

function stopVoiceRecognition() {
    isListening = false;
    // Stop voice recognition logic here
    console.log("Voice recognition stopped");
    // Perform search after stopping voice recognition
    searchContent(searchInput.value);
}

// Search function that fetches results from DuckDuckGo API
async function searchContent(query) {
    responseContainer.style.display = 'none';
    spinner.style.display = 'block'; // Show spinner during search

    try {
        const results = await fetchDuckDuckGoResults(query);
        
        if (!results || results.length === 0) {
            throw new Error("No results found.");
        }

        // Process and display search results
        displaySearchResults(results);
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
                { title: "Result 1", link: "https://duckduckgo.com" },
                { title: "Result 2", link: "https://duckduckgo.com" }
            ]);
        }, 2000);
    });
}

// Display search results in categorized sections
function displaySearchResults(results) {
    const duckDuckGoResults = results.filter(result => result.source === 'duckduckgo');
    const wikipediaResults = results.filter(result => result.source === 'wikipedia');

    let resultsHTML = '';

    // Display DuckDuckGo Results
    if (duckDuckGoResults.length > 0) {
        resultsHTML += '<h3>DuckDuckGo Results</h3>';
        resultsHTML += '<ul>';
        duckDuckGoResults.forEach(result => {
            resultsHTML += `<li><a href="${result.link}" target="_blank">${result.title}</a></li>`;
        });
        resultsHTML += '</ul>';
    }

    // Display Wikipedia Results
    if (wikipediaResults.length > 0) {
        resultsHTML += '<h3>Wikipedia Results</h3>';
        resultsHTML += '<ul>';
        wikipediaResults.forEach(result => {
            resultsHTML += `<li><a href="${result.link}" target="_blank">${result.title}</a></li>`;
        });
        resultsHTML += '</ul>';
    }

    responseContainer.innerHTML = resultsHTML;
    responseContainer.style.display = 'block';
}

// Error handling function
function displayError(message) {
    responseContainer.innerHTML = `<p style="color: red;">${message}</p>`;
    responseContainer.style.display = 'block';
}

// Save the search results or summarized text
saveButton.addEventListener('click', () => {
    const contentToSave = responseContainer.innerHTML;
    if (contentToSave) {
        saveContent(contentToSave);
    } else {
        alert("No content to save.");
    }
});

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

