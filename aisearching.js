import { loadModels, recognizeHandwriting } from './models.js';

const UIState = {
    READY: 1,
    PROCESSING: 2,
    ERROR: 3
};
let currentState = UIState.READY;

// Unified Event Handler
function bindInteractiveElements() {
    const elements = {
        voiceInput: document.getElementById('voiceInputButton'),
        fileUpload: document.getElementById('file-upload'),
        searchInput: document.getElementById('searchInput'),
        submitBtn: document.getElementById('submit-btn'),
        summarizeBtn: document.getElementById('summarize-btn'),
        personalizeBtn: document.getElementById('personalize-btn'),
        clearBtn: document.getElementById('clear-btn'),
        saveBtn: document.getElementById('save-btn')
    };

    // Voice Input
    elements.voiceInput.addEventListener('click', handleVoiceInput);
    
    // File Upload
    elements.fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const text = await recognizeHandwriting(file);
                elements.searchInput.value = text;
                triggerSearch(text);
            } catch (error) {
                showError(error.message);
            }
        }
    });

    // Search Triggers
    elements.submitBtn.addEventListener('click', () => triggerSearch(elements.searchInput.value));
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            triggerSearch(elements.searchInput.value);
        }
    });

    // AI Actions
    elements.summarizeBtn.addEventListener('click', handleSummarize);
    elements.personalizeBtn.addEventListener('click', handlePersonalize);

    // Utilities
    elements.clearBtn.addEventListener('click', clearResults);
    elements.saveBtn.addEventListener('click', saveResults);
}

// Voice Input Handler
let recognition;
function handleVoiceInput() {
    if (currentState === UIState.PROCESSING) return;

    if (!('webkitSpeechRecognition' in window)) {
        showError('Voice input not supported in this browser');
        return;
    }

    recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition))();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        document.getElementById('searchInput').value = transcript;
        triggerSearch(transcript);
    };

    recognition.start();
}

// Core Search Function
async function triggerSearch(query) {
    if (!query.trim() || currentState === UIState.PROCESSING) return;
    
    try {
        setUIState(UIState.PROCESSING);
        const results = await Promise.allSettled([
            fetchSearchResults(query),
            fetchAIAnalysis(query)
        ]);
        
        displayResults(results);
        setUIState(UIState.READY);
    } catch (error) {
        showError('Search failed. Try again later.');
        setUIState(UIState.ERROR);
    }
}

// State Management
function setUIState(state) {
    currentState = state;
    const loadingElem = document.getElementById('loading');
    const buttons = document.querySelectorAll('button');
    
    switch(state) {
        case UIState.PROCESSING:
            loadingElem.classList.remove('loading-hidden');
            buttons.forEach(btn => btn.disabled = true);
            break;
        case UIState.ERROR:
            loadingElem.classList.add('loading-hidden');
            buttons.forEach(btn => btn.disabled = false);
            break;
        default:
            loadingElem.classList.add('loading-hidden');
            buttons.forEach(btn => btn.disabled = false);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadModels();
        bindInteractiveElements();
        document.getElementById('welcome-message').style.display = 'block';
    } catch (error) {
        showError('Failed to initialize application');
    }
});
