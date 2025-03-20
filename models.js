import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';

let mobilenetModel;
let useModel;
let handwritingModelInitialized = false;

// Function to recognize handwriting from a user-uploaded image
export const recognizeHandwriting = (imageFile) => {
  return new Promise((resolve, reject) => {
    if (!imageFile) {
      console.error("No image file provided for handwriting recognition.");
      reject("No image file provided.");
      return;
    }

    // Convert file to a Base64 data URL
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result; // Base64 format

      Tesseract.recognize(imageData, 'eng', { logger: (m) => console.log(m) })
        .then(({ data: { text } }) => {
          console.log("Recognized Text:", text);
          resolve(text); // Return recognized text
        })
        .catch(err => {
          console.error("Error in OCR:", err);
          reject(err);
        });
    };

    reader.readAsDataURL(imageFile);
  });
};

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

export { mobilenetModel, useModel };
