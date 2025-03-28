import { storage } from './src/utils/offlineStorage';

const PERSONALIZATION_WEIGHTS = {
  click: 2.0,
  dwell: 0.01,
  search: 1.5
};

export class Personalizer {
  static async trackSearch(query) {
    await OfflineStorage.add('history', {
      type: 'search',
      query,
      timestamp: Date.now()
    });
  }

  static async rankResults(results) {
    const history = await OfflineStorage.getAll('history');
    const profile = this._analyzeHistory(history);
    
    return results.map(result => ({
      ...result,
      score: this._calculateScore(result, profile)
    })).sort((a, b) => b.score - a.score);
  }

  static _analyzeHistory(history) {
    return history.reduce((stats, entry) => {
      if (entry.type === 'click') {
        stats.clicks[entry.url] = (stats.clicks[entry.url] || 0) + 1;
      }
      if (entry.type === 'search') {
        stats.searches[entry.query] = (stats.searches[entry.query] || 0) + 1;
      }
      return stats;
    }, { clicks: {}, searches: {} });
  }

  static _calculateScore(result, profile) {
    const clickScore = profile.clicks[result.link] || 0;
    const queryScore = Object.entries(profile.searches)
      .reduce((acc, [query, count]) => 
        acc + (result.title.includes(query) ? count : 0), 0);
    
    return (clickScore * PERSONALIZATION_WEIGHTS.click) +
           (queryScore * PERSONALIZATION_WEIGHTS.search);
  }

  static async trackInteraction(type, data) {
    await OfflineStorage.add('history', {
      type,
      ...data,
      timestamp: Date.now()
    });
  }
}
