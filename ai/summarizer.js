import { pipeline } from '@xenova/transformers';

const SUMMARY_CACHE = new Map();
const CLOUD_API = 'https://your-cloud-ai-service.com/summarize';

export class Summarizer {
  static async initialize() {
    this.model = await pipeline('summarization', 'Xenova/t5-small', {
      progress_callback: (progress) => {
        console.log(`Model loading: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
      }
    });
  }

  static async generate(text, { max_length = 150, onlineFirst = true } = {}) {
    try {
      if (onlineFirst && navigator.onLine) {
        return await this._cloudSummarize(text, max_length);
      }
      return await this._localSummarize(text, max_length);
    } catch (error) {
      console.error('Summarization failed:', error);
      return this._fallbackSummary(text, max_length);
    }
  }

  static async _cloudSummarize(text, max_length) {
    const cacheKey = `${text.slice(0, 50)}-${max_length}`;
    if (SUMMARY_CACHE.has(cacheKey)) return SUMMARY_CACHE.get(cacheKey);
    
    const response = await fetch(CLOUD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, max_length })
    });
    
    const { summary } = await response.json();
    SUMMARY_CACHE.set(cacheKey, summary);
    return summary;
  }

  static async _localSummarize(text, max_length) {
    if (!this.model) await this.initialize();
    const result = await this.model(text, {
      max_length,
      min_length: Math.floor(max_length * 0.3),
    });
    return result[0].summary_text;
  }

  static _fallbackSummary(text, max_length) {
    return text.split(/\s+/).slice(0, max_length).join(' ') + '...';
  }
}
