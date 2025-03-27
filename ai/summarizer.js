import { getModel } from '../js/models.js';

export class Summarizer {
  static async init() {
    const t5 = getModel('t5');
    if (!t5?.config) throw new Error('T5 config not loaded');
    
    this.config = {
      max_length: t5.config.task_specific_params?.summarization?.max_length || 200,
      min_length: t5.config.task_specific_params?.summarization?.min_length || 30,
      // ... other params
    };
  }
}

import { OfflineStorage } from './OfflineStorage.js';
import { getModel } from '../models.js';

const SUMMARY_CACHE_TTL = 3600 * 24 * 7; // 1 week cache
const FALLBACK_OPTIONS = {
  min_length_ratio: 0.3,
  max_chunk_size: 512
};

export class Summarizer {
  static #model = null;
  static #status = 'unloaded'; // unloaded | loading | ready | error

  static async init() {
    if (this.#status === 'ready') return true;
    if (this.#status === 'loading') {
      return await this.#waitForLoading();
    }

    this.#status = 'loading';
    
    try {
      // Try loading from IndexedDB cache first
      const cachedModel = await OfflineStorage.getCachedModel('summarizer');
      if (cachedModel) {
        this.#model = cachedModel;
        this.#status = 'ready';
        return true;
      }

      // Fallback to loading from main models.js
      this.#model = await getModel('summarizer');
      
      if (!this.#model) {
        throw new Error('Summarizer model not available');
      }

      // Cache the loaded model
      await OfflineStorage.cacheModel('summarizer', this.#model, SUMMARY_CACHE_TTL);
      this.#status = 'ready';
      return true;
    } catch (error) {
      this.#status = 'error';
      console.error('Summarizer initialization failed:', error);
      throw new Error(`SUMMARIZER_INIT_ERROR: ${error.message}`);
    }
  }

  static async #waitForLoading() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.#status !== 'loading') {
          clearInterval(interval);
          resolve(this.#status === 'ready');
        }
      }, 100);
    });
  }

  static async generate(text, options = {}) {
    const {
      max_length = 150,
      strategy = 'auto' // auto | local | cloud | fallback
    } = options;

    try {
      // Validate input
      if (typeof text !== 'string' || text.trim().length < 10) {
        throw new Error('Input text too short');
      }

      // Check cache first
      const cacheKey = this.#generateCacheKey(text, max_length);
      const cached = await OfflineStorage.getCachedModel(cacheKey);
      if (cached) return cached;

      // Determine processing strategy
      const processingMethod = this.#determineProcessingStrategy(strategy);
      const summary = await processingMethod(text, max_length);

      // Cache results
      await OfflineStorage.cacheModel(cacheKey, summary, SUMMARY_CACHE_TTL);
      return summary;
    } catch (error) {
      console.error('Summarization failed:', error);
      return this.#generateFallback(text, max_length);
    }
  }

  static async simplify(text) {
    return this.generate(text, { max_length: 100 });
  }

  static async #processLocal(text, max_length) {
    if (this.#status !== 'ready') await this.init();
    
    const min_length = Math.floor(max_length * FALLBACK_OPTIONS.min_length_ratio);
    const chunks = this.#chunkText(text, FALLBACK_OPTIONS.max_chunk_size);
    
    const results = await Promise.all(
      chunks.map(chunk => 
        this.#model(chunk, { max_length, min_length })
      )
    );
    
    return results.map(r => r[0]?.summary_text).join(' ');
  }

  static async #processCloud(text, max_length) {
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, max_length })
      });
      
      if (!response.ok) throw new Error('Cloud summarizer unavailable');
      const { summary } = await response.json();
      return summary;
    } catch (error) {
      console.warn('Cloud summarization failed, falling back to local');
      return this.#processLocal(text, max_length);
    }
  }

  static #generateFallback(text, max_length) {
    return {
      summary: text.split(/\s+/).slice(0, max_length).join(' ') + '...',
      isFallback: true,
      warning: 'Summary quality may be reduced'
    };
  }

  static #determineProcessingStrategy(strategy) {
    const strategies = {
      auto: () => navigator.onLine ? this.#processCloud : this.#processLocal,
      local: () => this.#processLocal,
      cloud: () => this.#processCloud,
      fallback: () => (t, l) => this.#generateFallback(t, l)
    };
    
    return strategies[strategy] ? strategies[strategy]() : strategies.auto();
  }

  static #chunkText(text, maxChunkSize) {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    
    words.forEach(word => {
      if (currentChunk.join(' ').length + word.length + 1 <= maxChunkSize) {
        currentChunk.push(word);
      } else {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
      }
    });
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    return chunks;
  }

  static #generateCacheKey(text, max_length) {
    const hashPrefix = text.split(/\s+/).slice(0, 5).join('-');
    return `summary-${hashPrefix}-${max_length}-${text.length}`;
  }

  static get status() {
    return this.#status;
  }
}

// Automatic initialization in background
setTimeout(() => {
  Summarizer.init().catch(() => {});
}, 3000);
