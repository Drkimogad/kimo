// Model initialization
import { loadModels, setActiveModel, recognizeHandwriting } from './models.js';

window.addEventListener('load', async () => {
  // 1. Load the models (MobileNet and Universal Sentence Encoder)
  await loadModels();

  // 2. Set the active model for processing (e.g., 'mobilenet' or 'use')
  setActiveModel('mobilenet'); // Change to 'use' if needed for sentence encoding

  console.log('Models loaded and active model set.');
});

// Handle Image Upload and Trigger OCR Recognition
const imageUploadButton = document.getElementById('imageUploadButton');
const imageInput = document.getElementById('imageInput');
const resultTextArea = document.getElementById('resultTextArea');

imageUploadButton.addEventListener('click', () => {
  const file = imageInput.files[0];
  
  if (file) {
    const imageURL = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Check if the image is ready for OCR
      recognizeHandwriting(img); // Pass the loaded image to Tesseract.js for OCR processing
    };
    img.src = imageURL;
  } else {
    alert('Please upload an image file');
  }
});

// Function to display the OCR result in the result area
function displayOCRResult(text) {
  resultTextArea.textContent = text; // Display recognized text in the UI
}

// Integrate the result display in the recognizeHandwriting function
export const recognizeHandwriting = (imageSource) => {
  let imagePath = imageSource;

  // If the image source is a canvas, convert to data URL
  if (imageSource instanceof HTMLCanvasElement) {
    imagePath = imageSource.toDataURL('image/png');
  }

  Tesseract.recognize(
    imagePath,
    'eng', 
    {
      logger: (m) => console.log(m), // Show progress in the console
    }
  ).then(({ data: { text } }) => {
    console.log('Recognized Text:', text);
    displayOCRResult(text); // Display the recognized text in the result area
  }).catch(err => {
    console.error('OCR Error:', err); // Handle errors
  });
};

// Example of image classification using MobileNet (if it's the active model)
const classifyImageButton = document.getElementById('classifyImageButton');
const classifyImageInput = document.getElementById('classifyImageInput');
const classificationResultArea = document.getElementById('classificationResult');

classifyImageButton.addEventListener('click', () => {
  const file = classifyImageInput.files[0];
  
  if (file) {
    const imageURL = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      if (activeModel === mobilenetModel) {
        // Classify the image using the MobileNet model
        const predictions = await activeModel.classify(img);
        displayClassificationResult(predictions);
      }
    };
    img.src = imageURL;
  } else {
    alert('Please upload an image to classify');
  }
});

// Function to display classification results
function displayClassificationResult(predictions) {
  classificationResultArea.textContent = JSON.stringify(predictions, null, 2);
}

// Example usage for sentence encoding with USE (if it's the active model)
const encodeSentenceButton = document.getElementById('encodeSentenceButton');
const sentenceInput = document.getElementById('sentenceInput');
const sentenceEmbeddingResultArea = document.getElementById('sentenceEmbeddingResult');

encodeSentenceButton.addEventListener('click', async () => {
  const sentence = sentenceInput.value.trim();

  if (sentence) {
    if (activeModel === useModel) {
      const embeddings = await activeModel.embed([sentence]);
      displaySentenceEmbeddingResult(embeddings);
    } else {
      alert('Universal Sentence Encoder is not the active model');
    }
  } else {
    alert('Please enter a sentence to encode');
  }
});

// Function to display the sentence embedding result
function displaySentenceEmbeddingResult(embeddings) {
  sentenceEmbeddingResultArea.textContent = JSON.stringify(embeddings.arraySync(), null, 2);
}
