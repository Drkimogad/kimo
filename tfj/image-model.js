// Enhanced image-model.js
import { getModel } from '../models.js';

const MODEL_NAME = 'mobilenet';
const modelCache = {
  instance: null,
  status: 'NOT_LOADED', // NOT_LOADED | LOADING | READY | ERROR
  lastUsed: null
};

export const imageModel = {
  async init() {
    if (modelCache.status === 'READY') return true;
    if (modelCache.status === 'LOADING') {
      return await this.waitForLoading();
    }

    modelCache.status = 'LOADING';
    
    try {
      // Get pre-loaded model from models.js
      modelCache.instance = await getModel(MODEL_NAME);
      
      if (!modelCache.instance) {
        throw new Error('MobileNet not available in model registry');
      }
      
      modelCache.status = 'READY';
      modelCache.lastUsed = Date.now();
      console.debug('Image model ready');
      return true;
    } catch (error) {
      modelCache.status = 'ERROR';
      console.error('Image model initialization failed:', error);
      throw new Error(`IMAGE_MODEL_ERROR: ${error.message}`);
    }
  },

  async waitForLoading() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (modelCache.status !== 'LOADING') {
          clearInterval(checkInterval);
          resolve(modelCache.status === 'READY');
        }
      }, 100);
    });
  },

  async classify(imgElement, topK = 5) {
    try {
      if (modelCache.status !== 'READY') {
        await this.init();
      }

      if (!(imgElement instanceof HTMLImageElement || imgElement instanceof HTMLCanvasElement)) {
        throw new Error('Invalid image element');
      }

      const predictions = await modelCache.instance.classify(imgElement, topK);
      modelCache.lastUsed = Date.now();
      
      return {
        success: true,
        predictions: predictions.map(pred => ({
          className: pred.className,
          probability: Math.round(pred.probability * 100)
        })),
        model: 'MobileNet v2',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Classification failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: 'Try using a clearer image'
      };
    }
  },

  getStatus() {
    return {
      status: modelCache.status,
      lastUsed: modelCache.lastUsed
    };
  }
};

// Automatic cleanup on page exit
window.addEventListener('beforeunload', () => {
  if (modelCache.instance?.dispose) {
    modelCache.instance.dispose();
  }
});
