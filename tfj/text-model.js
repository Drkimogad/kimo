// Enhanced text-model.js
import { getModel } from '../models.js';
import * as tf from '@tensorflow/tfjs';

const MODEL_NAME = 'universal-sentence-encoder';
const PLAGIARISM_THRESHOLD = 0.85;
const modelCache = {
  instance: null,
  status: 'NOT_LOADED', // NOT_LOADED | LOADING | READY | ERROR
  lastUsed: null
};

export const textModel = {
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
        throw new Error('USE model not available in model registry');
      }
      
      modelCache.status = 'READY';
      modelCache.lastUsed = Date.now();
      console.debug('Text model ready');
      return true;
    } catch (error) {
      modelCache.status = 'ERROR';
      console.error('Text model initialization failed:', error);
      throw new Error(`TEXT_MODEL_ERROR: ${error.message}`);
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

  async checkPlagiarism(content, options = {}) {
    try {
      if (modelCache.status !== 'READY') {
        await this.init();
      }

      if (typeof content !== 'string' || content.trim().length < 10) {
        throw new Error('Content must be at least 10 characters');
      }

      const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
      const textEntries = sessionHistory.filter(entry => entry?.type === 'text');

      if (textEntries.length === 0) {
        return this.formatResult(0, false);
      }

      const currentEmbedding = await modelCache.instance.embed(content);
      const similarities = await Promise.all(
        textEntries.map(async entry => {
          try {
            const histEmbedding = await modelCache.instance.embed(entry.content);
            return this.cosineSimilarity(currentEmbedding, histEmbedding);
          } catch (e) {
            console.warn('Failed to compare with history entry:', e);
            return 0;
          }
        })
      );

      const maxSimilarity = Math.max(...similarities);
      return this.formatResult(
        maxSimilarity * 100,
        maxSimilarity > (options.threshold || PLAGIARISM_THRESHOLD)
      );
    } catch (error) {
      console.error('Plagiarism check failed:', error);
      return this.formatResult(0, false, {
        error: error.message,
        fallback: 'Try checking with shorter text segments'
      });
    }
  },

  cosineSimilarity(a, b) {
    return tf.tidy(() => {
      const aNorm = tf.norm(a);
      const bNorm = tf.norm(b);
      const dotProduct = tf.dot(a, b.transpose()).dataSync()[0];
      return dotProduct / (aNorm.mul(bNorm).dataSync()[0];
    });
  },

  formatResult(score, isPlagiarized, meta = {}) {
    return {
      success: !meta.error,
      score: parseFloat(score.toFixed(2)),
      isPlagiarized,
      model: 'Universal Sentence Encoder',
      timestamp: new Date().toISOString(),
      ...meta
    };
  },

  getStatus() {
    return {
      status: modelCache.status,
      lastUsed: modelCache.lastUsed
    };
  }
};

// Memory management
window.addEventListener('beforeunload', () => {
  if (modelCache.instance?.dispose) {
    modelCache.instance.dispose();
  }
});
