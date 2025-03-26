// Import TensorFlow.js
import "https://unpkg.com/@tensorflow/tfjs@4.9.0"; // Alternative

// Import MobileNet model
import * as mobilenet from 'https://unpkg.com/@tensorflow-models/mobilenet@2.1.0'; // Alternative

// Import Universal Sentence Encoder
import * as use from 'https://unpkg.com/@tensorflow-models/universal-sentence-encoder@1.3.2'; // Alternative

// Import other AI functionality and OCR tools
import { Summarizer } from './ai/summarizer.js'; // Xenova summarizer
import { Personalizer } from './ai/personalizer.js'; // Xenova personalizer
import * as Tesseract from 'https://unpkg.com/tesseract.js@6.0.0/dist/tesseract.min.js'; // Tesseract.js for OCR

// Polyfill for buffer
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Polyfill for long
import { Long } from 'long';
window.Long = Long;

// Declare variables for the models
let mobilenetModel, useModel, summarizerModel, personalizerModel, activeModel;

// Import model loader from models.js
import { loadModels } from './models.js';

async function initApp() {
  console.log('Initializing App...');
  await loadModels();  // Load all specified models before starting the app
  console.log('Models loaded. App is ready.');
}

initApp();  // Initialize the app

// Export the loaders instead of direct variables to avoid undefined exports
export function getSummarizerModel() {
  if (summarizerModel) return summarizerModel;
  console.warn('Summarizer model not loaded yet. Please wait until models are fully loaded.');
  return null;
}

export function getPersonalizerModel() {
  if (personalizerModel) return personalizerModel;
  console.warn('Personalizer model not loaded yet. Please wait until models are fully loaded.');
  return null;
}

// Handwriting recognition function
export function recognizeHandwriting(imageSource) {
  let imagePath = imageSource;
  if (imageSource instanceof HTMLCanvasElement) {
    imagePath = imageSource.toDataURL('image/png');
  }
  Tesseract.recognize(imagePath, 'eng', {
    logger: (m) => console.log(m),
  }).then(({ data: { text } }) => {
    console.log('Recognized Text:', text);
  }).catch(err => {
    console.error('Error:', err);
  });
}

// Function to set the active model (MobileNet or Universal Sentence Encoder)
export function setActiveModel(modelName) {
  if (modelName === 'mobilenet' && mobilenetModel) {
    activeModel = mobilenetModel;
    console.log('MobileNet model is now active');
  } else if (modelName === 'use' && useModel) {
    activeModel = useModel;
    console.log('Universal Sentence Encoder model is now active');
  } else {
    console.error('Invalid model name or model not loaded');
  }
}

// Export the models for use in other scripts
export { mobilenetModel, useModel, activeModel };
