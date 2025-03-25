// Import dependencies for the models
import  mobilenet from './models.js';
import  use from './models.js;
import { Summarizer } from './ai/summarizer.js';  // Xenova summarizer
import { Personalizer } from './ai/personalizer.js'; // Xenova personalizer
import * as Tesseract from 'https://unpkg.com/tesseract.js@6.0.0/dist/tesseract.min.js'; // Tesseract.js for OCR

// Declare variables for the models
let mobilenetModel;
let useModel;
let summarizer;
let personalizer;
let activeModel;  // Add a variable to track the active model

// Function to load the models
export async function loadModels(modelsToLoad = ['mobilenet', 'use', 'summarizer', 'personalizer']) {
  const loadPromises = [];

  // Load the MobileNet model
  if (modelsToLoad.includes('mobilenet')) {
    loadPromises.push(mobilenet.load().then(model => {
      mobilenetModel = model;
      console.log('MobileNet model loaded');
    }));
  }

  // Load the Universal Sentence Encoder model
  if (modelsToLoad.includes('use')) {
    loadPromises.push(use.load().then(model => {
      useModel = model;
      console.log('Universal Sentence Encoder model loaded');
    }));
  }

  // Load the Summarizer model
  if (modelsToLoad.includes('summarizer')) {
    loadPromises.push(Summarizer.load().then(model => {
      summarizer = model;
      console.log('Summarizer model loaded');
    }));
  }

  // Load the Personalizer model
  if (modelsToLoad.includes('personalizer')) {
    loadPromises.push(Personalizer.load().then(model => {
      personalizer = model;
      console.log('Personalizer model loaded');
    }));
  }

  // Wait for all models to load
  await Promise.all(loadPromises);
  console.log('All specified models loaded successfully');
}

// Function to recognize handwriting from an image
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
export { mobilenetModel, useModel, summarizer, personalizer, activeModel };
