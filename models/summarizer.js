import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformer';

const SUMMARY_CACHE = new Map();
const CLOUD_SUMMARY_URL = import.meta.env.VITE_SUMMARY_API || '/api/summarize';

export class Summarizer {
  static async warmup() {
    if (!this.model) {
      this.model = await pipeline('summarization', 'Xenova/t5-small', {
        quantized: true,
        progress_callback: this._handleProgress
      });
    }
  }

  static async generate(text, { max_length = 150 } = {}) {
    try {
      if (navigator.onLine) {
        return await this._cloudSummary(text, max_length);
      }
      return await this._localSummary(text, max_length);
    } catch (error) {
      console.error('Summarization failed:', error);
      return this._fallbackSummary(text, max_length);
    }
  }

  static async simplify(text) {
    return this.generate(text, { max_length: 100 });
  }

  static async _localSummary(text, max_length) {
    await this.warmup();
    const result = await this.model(text, {
      max_length,
      min_length: Math.floor(max_length * 0.3),
    });
    return result[0].summary_text;
  }

  static async _cloudSummary(text, max_length) {
    const cacheKey = `${text.slice(0, 50)}-${max_length}`;
    if (SUMMARY_CACHE.has(cacheKey)) return SUMMARY_CACHE.get(cacheKey);
    
    const response = await fetch(CLOUD_SUMMARY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, max_length })
    });
    
    const { summary } = await response.json();
    SUMMARY_CACHE.set(cacheKey, summary);
    return summary;
  }

  static _fallbackSummary(text, max_length) {
    return text.split(/\s+/).slice(0, max_length).join(' ') + '...';
  }

  static _handleProgress(progress) {
    const event = new CustomEvent('model-progress', {
      detail: (progress.loaded / progress.total) * 100
    });
    window.dispatchEvent(event);
  }
}
