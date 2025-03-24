import { OfflineStorage } from '../utils/offlineStorage.js';

const PERSONALIZATION_WEIGHTS = {
  click: 2.0,
  dwell: 0.01, // per second
  search: 1.5
};

export class Personalizer {
  static async rankResults(results, query) {
    const history = await OfflineStorage.getAll('searchHistory');
    const userProfile = this._analyzeHistory(history);
    
    return results.map(result => ({
      ...result,
      score: this._calculateScore(result, query, userProfile)
    })).sort((a, b) => b.score - a.score);
  }

  static _analyzeHistory(history) {
    return history.reduce((profile, entry) => {
      const domain = new URL(entry.link).hostname;
      profile.domains[domain] = (profile.domains[domain] || 0) + 1;
      profile.queries[entry.query] = (profile.queries[entry.query] || 0) + 1;
      return profile;
    }, { domains: {}, queries: {} });
  }

  static _calculateScore(result, query, profile) {
    const domain = new URL(result.link).hostname;
    const baseScore = Math.random(); // Default random ranking
    
    return baseScore +
      (profile.domains[domain] || 0) * PERSONALIZATION_WEIGHTS.click +
      (profile.queries[query] || 0) * PERSONALIZATION_WEIGHTS.search;
  }

  static async trackInteraction(type, data) {
    await OfflineStorage.add('searchHistory', {
      type,
      data,
      timestamp: Date.now()
    });
  }
}
