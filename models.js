import tf from './main.js'; // Import TensorFlow.js from main.js
import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';

let mobilenetModel;
let useModel;
let handwritingModelInitialized = false;

export const recognizeHandwriting = (input) => {
  return new Promise((resolve, reject) => {
    if (!input) {
      console.error("No image or canvas provided for handwriting recognition.");
      reject("No image or canvas provided.");
      return;
    }

    let imageData;

    if (input instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        imageData = reader.result;
        processOCR(imageData, resolve, reject);
      };
      reader.readAsDataURL(input);
    } else if (input instanceof HTMLCanvasElement) {
      imageData = input.toDataURL();
      processOCR(imageData, resolve, reject);
    } else {
      console.error("Unsupported input type for OCR.");
      reject("Unsupported input type.");
    }
  });
};

function processOCR(imageData, resolve, reject) {
  Tesseract.recognize(imageData, 'eng', { logger: (m) => console.log(m) })
    .then(({ data: { text } }) => {
      console.log("Recognized Text:", text);
      resolve(text);
    })
    .catch(err => {
      console.error("Error in OCR:", err);
      reject(err);
    });
}

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
