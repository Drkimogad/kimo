import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';
import { Summarizer } from './summarizer.js';  // Xenova summarizer
import { Personalizer } from './personalizer.js'; // Xenova personalizer
import * as Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@2.0.0/dist/tesseract.min.js'; // Tesseract.js for OCR

let mobilenetModel;
let useModel;
let summarizer;
let personalizer;

export async function loadModels(modelsToLoad = ['mobilenet', 'use', 'summarizer', 'personalizer']) {
  const loadPromises = [];

  if (modelsToLoad.includes('mobilenet')) {
    loadPromises.push(mobilenet.load().then(model => {
      mobilenetModel = model;
      console.log('MobileNet model loaded');
    }));
  }

  if (modelsToLoad.includes('use')) {
    loadPromises.push(use.load().then(model => {
      useModel = model;
      console.log('Universal Sentence Encoder model loaded');
    }));
  }

  if (modelsToLoad.includes('summarizer')) {
    loadPromises.push(Summarizer.load().then(model => {
      summarizer = model;
      console.log('Summarizer model loaded');
    }));
  }

  if (modelsToLoad.includes('personalizer')) {
    loadPromises.push(Personalizer.load().then(model => {
      personalizer = model;
      console.log('Personalizer model loaded');
    }));
  }

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

export { mobilenetModel, useModel, summarizer, personalizer };


// models.js

// Initialize the models and functions that will be used for summarizing and personalizing
let summarizerModel, personalizerModel;

async function loadModels() {
    try {
        // Load summarizer and personalizer models (This assumes you're using a local model or API)
        summarizerModel = await loadSummarizerModel();  // Implement loadSummarizerModel as per your setup
        personalizerModel = await loadPersonalizerModel(); // Implement loadPersonalizerModel as per your setup
        console.log("Models loaded successfully.");
    } catch (error) {
        console.error("Error loading models:", error);
    }
}

// Example functions to load models, replace with actual logic
async function loadSummarizerModel() {
    // Logic to load summarizer model (either locally or from an endpoint)
    return new Promise(resolve => {
        setTimeout(() => resolve("Summarizer Model Loaded"), 1000);
    });
}

async function loadPersonalizerModel() {
    // Logic to load personalizer model
    return new Promise(resolve => {
        setTimeout(() => resolve("Personalizer Model Loaded"), 1000);
    });
}

// Exporting the loadModels function and the models
export { loadModels, summarizerModel, personalizerModel };

