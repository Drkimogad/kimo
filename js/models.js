// models.js - Core Model Loader
import { imageModel } from '../tfj/image-model.js';
import { textModel } from '../tfj/text-model.js';
import { Summarizer } from '../ai/summarizer.js';
import { Personalizer } from '../ai/personalizer.js';
import { OfflineStorage } from '../utils/offlineStorage.js';

const MODEL_STATES = {
  NOT_LOADED: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};

const modelRegistry = {
  tf: { state: MODEL_STATES.NOT_LOADED, instance: null },
  mobilenet: { state: MODEL_STATES.NOT_LOADED, instance: null },
  tesseract: { state: MODEL_STATES.NOT_LOADED, worker: null },
  summarizer: { state: MODEL_STATES.NOT_LOADED },
  personalizer: { state: MODEL_STATES.NOT_LOADED }
};

export async function loadModels() {
  try {
    // Load core models
    await loadWithRetry(() => import('../model-cache/tf.js'), 'tf');
    
    await Promise.all([
      loadWithRetry(() => import('../model-cache/mobilenet.js')
        .then(m => m.load()), 'mobilenet'),
      loadWithRetry(() => import('../model-cache/tesseract.js')
        .then(Tesseract => Tesseract.createWorker()), 'tesseract')
    ]);

    // Initialize custom models
    modelRegistry.summarizer.instance = new Summarizer();
    modelRegistry.personalizer.instance = new Personalizer();
    
    return true;
  } catch (error) {
    console.error('Model loading failed:', error);
    throw new Error(`MODEL_LOAD_ERROR: ${error.message}`);
  }
}

// Helper function
async function loadWithRetry(loader, modelName, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const model = await loader();
      modelRegistry[modelName].state = MODEL_STATES.LOADED;
      modelRegistry[modelName].instance = model;
      return model;
    } catch (error) {
      if (i === retries - 1) {
        modelRegistry[modelName].state = MODEL_STATES.ERROR;
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export function getModel(name) {
  return modelRegistry[name]?.instance || null;
}

export { imageModel, textModel, Summarizer, Personalizer, OfflineStorage };
