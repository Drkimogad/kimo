// Import the required TensorFlow models directly
import "https://esm.sh/@tensorflow/tfjs@4.9.0";
import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';

// Import other AI functionality and OCR tools
import { Summarizer } from './ai/summarizer.js'; // Xenova summarizer
import { Personalizer } from './ai/personalizer.js'; // Xenova personalizer
import * as Tesseract from 'https://unpkg.com/tesseract.js@6.0.0/dist/tesseract.min.js'; // Tesseract.js for OCR

import { Buffer } from 'buffer';
window.Buffer = Buffer;
import Long from 'long';
window.Long = Long;

// Declare variables for the models
// Existing imports remain the same

// Declare variables for the models
let mobilenetModel, useModel, summarizerModel, personalizerModel, activeModel;

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

export async function loadModels(modelsToLoad = ['mobilenet', 'use', 'summarizer', 'personalizer']) {
  const loadPromises = [];

  // Loading MobileNet model
  if (modelsToLoad.includes('mobilenet')) {
    loadPromises.push(mobilenet.load().then(model => {
      mobilenetModel = model;
      console.log('MobileNet model loaded');
    }));
  }

  // Loading Universal Sentence Encoder
  if (modelsToLoad.includes('use')) {
    loadPromises.push(use.load().then(model => {
      useModel = model;
      console.log('Universal Sentence Encoder model loaded');
    }));
  }

  // Loading Summarizer model
  if (modelsToLoad.includes('summarizer')) {
    loadPromises.push(Summarizer.load().then(model => {
      summarizerModel = model;
      console.log('Summarizer model loaded');
    }));
  }

  // Loading Personalizer model
  if (modelsToLoad.includes('personalizer')) {
    loadPromises.push(Personalizer.load().then(model => {
      personalizerModel = model;
      console.log('Personalizer model loaded');
    }));
  }

  // Wait for all model loading promises to resolve
  await Promise.all(loadPromises);
  console.log('All specified models loaded successfully');
}

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

export { mobilenetModel, useModel, activeModel };
