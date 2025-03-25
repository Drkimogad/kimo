import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';
const Tesseract = window.Tesseract; // Ensure Tesseract.js is already loaded in the HTML script tag


let mobilenetModel;
let useModel;
let activeModel;

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

export const recognizeHandwriting = (imageSource) => {
  // Check if the image source is a canvas or an image URL
  let imagePath = imageSource;

  // If it's a canvas, convert it to a data URL first
  if (imageSource instanceof HTMLCanvasElement) {
    imagePath = imageSource.toDataURL('image/png'); // Convert canvas to base64 string
  }

  Tesseract.recognize(
    imagePath,
    'eng', // Language (English in this case)
    {
      logger: (m) => console.log(m), // Log progress
    }
  ).then(({ data: { text } }) => {
    console.log('Recognized Text:', text); // Output recognized text
    // Here you can update the UI or pass the text back
  }).catch(err => {
    console.error('Error:', err); // Handle errors
  });
};

// Wrap Tesseract usage inside an event listener
window.addEventListener('load', () => {
    console.log("Window loaded. Checking Tesseract...");
    console.log(window.Tesseract);  // Should print an object if loaded correctly
});
