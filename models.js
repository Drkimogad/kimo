// Handwriting for OCR.JS 
import Tesseract from 'tesseract.js';

// Function to recognize handwriting from an image
export const recognizeHandwriting = (imagePath) => {
  Tesseract.recognize(
    imagePath,
    'eng',
    {
      logger: (m) => console.log(m) // Log progress
    }
  ).then(({ data: { text } }) => {
    console.log(text); // Output recognized text
  }).catch(err => {
    console.error(err); // Handle errors
  });
};

// Example usage within models.js
const imagePath = 'images/handwritten.jpg'; // Path to the image
recognizeHandwriting(imagePath); // Run OCR on the image

// other import functions
import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';

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
    loadPromises.push(recognizeHandwriting().then(() => {
      handwritingModelInitialized = true;
      console.log('Handwriting model initialized');
    }));
  }

  await Promise.all(loadPromises);
  console.log('All specified models loaded successfully');
}

export { mobilenetModel, useModel };
