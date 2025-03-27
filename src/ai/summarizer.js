const { pipeline } = window.transformers || {};

class Summarizer {
  static #model = null;
  static #cache = new Map();
  static #isInitialized = false;
  static CLOUD_ENDPOINT = import.meta.env?.VITE_SUMMARY_API || '/api/summarize';

  /**
   * Initialize model (auto-called on first use)
   */
  static async #initialize() {
    if (this.#isInitialized) return;
    
    try {
      if (!pipeline) throw new Error('Transformers.js not loaded');
      
      this.#model = await pipeline('summarization', 'Xenova/t5-small', {
        quantized: true,
        progress_callback: progress => {
          window.dispatchEvent(new CustomEvent('summary-progress', {
            detail: Math.round((progress.loaded / progress.total) * 100)
          }));
        }
      });
      
      this.#isInitialized = true;
    } catch (error) {
      console.error('⚠️ Summarizer initialization failed', error);
      throw error;
    }
  }

  /**
   * Main summarization method
   * @param {string} text - Input text
   * @param {object} [options] - Options
   * @param {number} [options.max_length=150] - Max summary length
   * @param {boolean} [options.forceLocal=false] - Skip cloud check
   * @returns {Promise<string>} Summary text
   */
  static async summarize(text, { max_length = 150, forceLocal = false } = {}) {
    if (!text?.trim()) return '';
    
    try {
      // Try cloud first (if online and not forced local)
      if (!forceLocal && navigator.onLine && this.CLOUD_ENDPOINT) {
        return await this.#cloudSummarize(text, max_length);
      }
      // Fallback to local model
      return await this.#localSummarize(text, max_length);
    } catch (error) {
      console.warn('⚠️ Summarization failed, using fallback', error);
      return this.#basicFallback(text, max_length);
    }
  }

  static async #localSummarize(text, max_length) {
    await this.#initialize();
    const result = await this.#model(text, {
      max_length,
      min_length: Math.floor(max_length * 0.3),
    });
    return result[0]?.summary_text || this.#basicFallback(text, max_length);
  }

  static async #cloudSummarize(text, max_length) {
    const cacheKey = `${text.length}-${max_length}-${hashString(text.substring(0, 50))}`;
    
    if (this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey);
    }

    const response = await fetch(this.CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, max_length })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const { summary } = await response.json();
    this.#cache.set(cacheKey, summary);
    return summary;
  }

  static #basicFallback(text, max_length) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences[0].split(/\s+/).slice(0, max_length).join(' ') + 
      (sentences.length > 1 ? '...' : '');
  }
}

// Helper for cache keys
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export { Summarizer };
