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
