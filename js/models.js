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

const MODEL_BASE_PATH = '../models/t5-small';
const modelRegistry = {
  tf: { state: MODEL_STATES.NOT_LOADED, instance: null },
  mobilenet: { state: MODEL_STATES.NOT_LOADED, instance: null },
  tesseract: { state: MODEL_STATES.NOT_LOADED, worker: null },
  t5: { state: MODEL_STATES.NOT_LOADED, config: null },
  summarizer: { state: MODEL_STATES.NOT_LOADED, instance: null },
  personalizer: { state: MODEL_STATES.NOT_LOADED, instance: null }
};

async function loadT5Config() {
  try {
    const response = await fetch(`${MODEL_BASE_PATH}/config.json`);
    if (!response.ok) throw new Error('Config load failed');
    const config = await response.json();
    
    if (!config.d_model || !config.num_layers) {
      throw new Error('Invalid T5 config');
    }
    
    return config;
  } catch (error) {
    console.error('Failed to load T5 config:', error);
    return {
      d_model: 512,
      num_layers: 6,
      num_heads: 8,
      vocab_size: 32128,
      task_specific_params: {
        summarization: {
          max_length: 200,
          min_length: 30,
          length_penalty: 2.0
        }
      }
    };
  }
}

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

export async function loadModels() {
  try {
    // Phase 1: Load core frameworks
    await loadWithRetry(() => import('../model-cache/tf.js'), 'tf');
    
    // Phase 2: Parallel load heavy models and configs
    const [mobilenet, tesseract, t5Config] = await Promise.all([
      loadWithRetry(() => import('../model-cache/mobilenet.js')
        .then(m => m.load()), 'mobilenet'),
      loadWithRetry(() => import('../model-cache/tesseract.js')
        .then(Tesseract => Tesseract.createWorker()), 'tesseract'),
      loadT5Config()
    ]);
    
    // Register T5 config
    modelRegistry.t5 = {
      config: t5Config,
      state: MODEL_STATES.LOADED
    };
    
    // Phase 3: Initialize application models
    modelRegistry.summarizer.instance = new Summarizer(t5Config);
    modelRegistry.personalizer.instance = new Personalizer();
    
    console.log('All models loaded successfully');
    return true;
  } catch (error) {
    console.error('Model loading failed:', error);
    throw new Error(`MODEL_LOAD_ERROR: ${error.message}`);
  }
}

export function getModel(name) {
  if (!modelRegistry[name] || modelRegistry[name].state !== MODEL_STATES.LOADED) {
    console.warn(`Model ${name} not loaded or unavailable`);
    return null;
  }
  return modelRegistry[name].instance || modelRegistry[name].config;
}

export function getModelStatus(name) {
  return modelRegistry[name]?.state || MODEL_STATES.NOT_LOADED;
}

export { imageModel, textModel, Summarizer, Personalizer, OfflineStorage };
