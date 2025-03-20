import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';
// HANDWRITING RECOGNITION FUNCTION FROM OCR.JS
import { recognizeHandwriting } from './ocr.js';
const imagePath = 'images/handwritten.jpg'; // Path to the image
recognizeHandwriting(imagePath); // Run OCR on the image
let mobilenetModel;
let useModel;
let handwritingModelInitialized = false;

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
    loadPromises.push(recognizeHandwriting.initialize().then(() => {
      handwritingModelInitialized = true;
      console.log('Handwriting model initialized');
    }));
  }

  await Promise.all(loadPromises);
  console.log('All specified models loaded successfully');
}

export { mobilenetModel, useModel, recognizeHandwriting };
