import tf from './main.js'; // Import TensorFlow.js from main.js
import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';

let mobilenetModel;
let useModel;
let handwritingModelInitialized = false;

// Load AI models dynamically
export async function loadModels(modelsToLoad = ['mobilenet', 'use', 'handwriting']) {
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

  if (modelsToLoad.includes('handwriting')) {
    handwritingModelInitialized = true;
    console.log('Handwriting recognition ready (handled dynamically)');
  }

  await Promise.all(loadPromises);
  console.log('All specified models loaded successfully');
}
