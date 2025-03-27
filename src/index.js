// Correct variable declarations for CDN-loaded libraries
const tf = window.tf;
const mobilenet = window.mobilenet;
const use = window['universal-sentence-encoder']; // or window.universalSentenceEncoder
const Tesseract = window.Tesseract;

// Import local AI modules
import { Summarizer } from './ai/summarizer.js';
import { Personalizer } from './ai/personalizer.js';

// Model instances
let mobilenetModel;
let useModel;
let summarizerInstance;
let personalizerInstance;
let activeModel;

/**
 * Load AI models with error handling
 * @param {Array} modelsToLoad - Array of model names to load
 */
export async function loadModels(modelsToLoad = ['mobilenet', 'use', 'summarizer', 'personalizer']) {
  try {
    const loadPromises = [];

    if (modelsToLoad.includes('mobilenet')) {
      loadPromises.push(
        mobilenet.load()
          .then(model => {
            mobilenetModel = model;
            console.log('MobileNet model loaded');
          })
          .catch(err => console.error('MobileNet load failed:', err))
      );
    }

    if (modelsToLoad.includes('use')) {
      loadPromises.push(
        use.load()
          .then(model => {
            useModel = model;
            console.log('Universal Sentence Encoder model loaded');
          })
          .catch(err => console.error('USE load failed:', err))
      );
    }

    if (modelsToLoad.includes('summarizer')) {
      loadPromises.push(
        Summarizer.init()
          .then(model => {
            summarizerInstance = model;
            console.log('Summarizer model loaded');
          })
          .catch(err => console.error('Summarizer init failed:', err))
      );
    }

    if (modelsToLoad.includes('personalizer')) {
      loadPromises.push(
        Personalizer.init()
          .then(model => {
            personalizerInstance = model;
            console.log('Personalizer model loaded');
          })
          .catch(err => console.error('Personalizer init failed:', err))
      );
    }

    await Promise.all(loadPromises);
    console.log('All specified models loaded successfully');
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
}

/**
 * Text summarization with error handling
 * @param {string} text - Input text to summarize
 * @returns {Promise<string>} - Summary text
 */
export async function summarizeText(text) {
  if (!summarizerInstance) {
    throw new Error('Summarizer not initialized. Call loadModels() first.');
  }

  try {
    const result = await summarizerInstance.summarize(text);
    return result.summary_text || result;
  } catch (error) {
    console.error('Summarization failed:', error);
    throw error;
  }
}

/**
 * Handwriting recognition with Tesseract
 * @param {HTMLImageElement|HTMLCanvasElement|string} imageSource
 */
export async function recognizeHandwriting(imageSource) {
  try {
    const imagePath = imageSource instanceof HTMLCanvasElement
      ? imageSource.toDataURL('image/png')
      : imageSource;

    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      { logger: m => console.log(m) }
    );
    
    console.log('Recognized Text:', text);
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}

/**
 * Set active model for classification
 * @param {'mobilenet'|'use'} modelName 
 */
export function setActiveModel(modelName) {
  if (modelName === 'mobilenet' && mobilenetModel) {
    activeModel = mobilenetModel;
    console.log('MobileNet model activated');
  } else if (modelName === 'use' && useModel) {
    activeModel = useModel;
    console.log('Universal Sentence Encoder activated');
  } else {
    throw new Error(`Invalid model name or model not loaded: ${modelName}`);
  }
}

// Export all available functionality
export {
  tf,
  mobilenetModel,
  useModel,
  summarizerInstance as summarizer,
  personalizerInstance as personalizer,
  activeModel,
  Tesseract
};
