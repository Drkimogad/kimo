import { mobilenetModel, useModel, summarizer, personalizer } from './models.js';

// Online search functionality (DuckDuckGo, Wikipedia)
async function onlineSearch(query) {
  const duckDuckGoUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`;

  // Open these URLs or display results in your app
  console.log(`DuckDuckGo Search: ${duckDuckGoUrl}`);
  console.log(`Wikipedia Search: ${wikipediaUrl}`);
}

// AI-based searching with Summarizer and Personalizer
async function aiSearch(query) {
  const summarizedResult = await summarizer.summarize(query);
  const personalizedResult = await personalizer.personalize(summarizedResult);

  console.log('Summarized Result:', summarizedResult);
  console.log('Personalized Result:', personalizedResult);
  return personalizedResult;
}

// Image Classification (MobileNet)
async function classifyImage(image) {
  if (!mobilenetModel) {
    console.error('MobileNet model not loaded');
    return;
  }

  const prediction = await mobilenetModel.classify(image);
  console.log('Predictions:', prediction);
  return prediction;
}

// Text Embedding (Universal Sentence Encoder)
async function getTextEmbedding(text) {
  if (!useModel) {
    console.error('Universal Sentence Encoder model not loaded');
    return;
  }

  const embedding = await useModel.embed(text);
  console.log('Text Embedding:', embedding);
  return embedding;
}

// Speech Recognition (Voice Input)
function initSpeechRecognition() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    console.log('Voice Input:', spokenText);

    // Process the voice input (e.g., trigger a search or text generation)
    aiSearch(spokenText);  // Example: Use voice input for AI searching
  };

  recognition.onerror = (event) => {
    console.error('Speech Recognition Error:', event.error);
  };
}

// Trigger voice input through a button click or some other event
document.getElementById('start-voice-input').addEventListener('click', () => {
  initSpeechRecognition();
});

export { onlineSearch, aiSearch, classifyImage, getTextEmbedding, initSpeechRecognition };
