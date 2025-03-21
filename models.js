import { tf } from './main.js'; // Correctly import TensorFlow.js from main.js
import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';

let mobilenetModel;
let useModel;

export async function loadModels(modelsToLoad = ['mobilenet', 'use']) {
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

  await Promise.all(loadPromises);
  console.log('All specified models loaded successfully');
}
