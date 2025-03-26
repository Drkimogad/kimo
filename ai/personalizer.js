import { OfflineStorage } from './OfflineStorage.js';

const PERSONALIZATION_WEIGHTS = {
  click: 2.0,
  dwell: 0.01,
  search: 1.5,
  share: 3.0,
  bookmark: 4.0
};

const DECAY_FACTOR = 0.95; // 5% decay per day
const MAX_HISTORY_DAYS = 30;

export class Personalizer {
  static async trackSearch(query, metadata = {}) {
    await this.#recordEvent('search', {
      query,
      ...metadata,
      entities: this.#extractEntities(query)
    });
  }

  static async trackInteraction(type, data) {
    await this.#recordEvent(type, data);
  }

  static async rankResults(results, options = {}) {
    const {
      freshnessWeight = 0.3,
      personalizationWeight = 0.7,
      maxHistoryDays = MAX_HISTORY_DAYS
    } = options;

    try {
      const history = await this.#getRelevantHistory(maxHistoryDays);
      const profile = this.#analyzeHistory(history);
      
      return results.map(result => {
        const baseScore = result.score || 0;
        const personalScore = this.#calculatePersonalScore(result, profile);
        const freshnessScore = this.#calculateFreshnessScore(result);
        
        return {
          ...result,
          score: (baseScore * (1 - personalizationWeight - freshnessWeight)) +
                (personalScore * personalizationWeight) +
                (freshnessScore * freshnessWeight),
          _debug: {
            baseScore,
            personalScore,
            freshnessScore
          }
        };
      }).sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Personalization failed, returning original results:', error);
      return results;
    }
  }

  static async #recordEvent(type, data) {
    await OfflineStorage.add('history', {
      type,
      ...data,
      timestamp: Date.now(),
      decay: 1.0 // Initial decay value
    });
  }

  static async #getRelevantHistory(maxDays) {
    const cutoff = Date.now() - (maxDays * 24 * 3600 * 1000);
    const history = await OfflineStorage.getAll('history', {
      index: 'timestamp',
      range: IDBKeyRange.lowerBound(cutoff)
    });

    // Apply time decay
    return history.map(entry => ({
      ...entry,
      weight: entry.decay * Math.pow(DECAY_FACTOR, 
               (Date.now() - entry.timestamp) / (24 * 3600 * 1000))
    }));
  }

  static #analyzeHistory(history) {
    return history.reduce((stats, entry) => {
      const weight = entry.weight || 1;
      
      switch(entry.type) {
        case 'click':
          stats.clicks[entry.url] = (stats.clicks[entry.url] || 0) + 
                                   (weight * PERSONALIZATION_WEIGHTS.click);
          break;
          
        case 'search':
          (entry.entities || []).forEach(entity => {
            stats.entities[entity] = (stats.entities[entity] || 0) + 
                                   (weight * PERSONALIZATION_WEIGHTS.search);
          });
          break;
          
        case 'dwell':
          stats.dwells[entry.url] = (stats.dwells[entry.url] || 0) + 
                                   (entry.duration * weight * PERSONALIZATION_WEIGHTS.dwell);
          break;
          
        case 'bookmark':
          stats.bookmarks[entry.url] = (stats.bookmarks[entry.url] || 0) + 
                                     (weight * PERSONALIZATION_WEIGHTS.bookmark);
          break;
      }
      
      return stats;
    }, { 
      clicks: {}, 
      dwells: {}, 
      entities: {}, 
      bookmarks: {} 
    });
  }

  static #calculatePersonalScore(result, profile) {
    const url = result.link;
    
    // Click and dwell behavior
    const clickScore = profile.clicks[url] || 0;
    const dwellScore = profile.dwells[url] || 0;
    
    // Content relevance
    const entityScore = Object.entries(profile.entities)
      .reduce((acc, [entity, weight]) => 
        acc + (this.#textContains(result, entity) ? weight : 0, 0);
    
    // Bookmarks
    const bookmarkScore = profile.bookmarks[url] || 0;
    
    return clickScore + dwellScore + entityScore + bookmarkScore;
  }

  static #calculateFreshnessScore(result) {
    const pubDate = result.date ? new Date(result.date).getTime() : Date.now();
    const ageDays = (Date.now() - pubDate) / (24 * 3600 * 1000);
    return Math.max(0, 1 - (ageDays / 30)); // Linear decay over 30 days
  }

  static #extractEntities(text) {
    // Simple entity extraction - can be enhanced with NLP
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => 
      word.length > 3 && 
      !STOP_WORDS.has(word)
      .map(word => word.replace(/[^a-z0-9]/g, ''));
  }

  static #textContains(result, term) {
    const searchText = `${result.title} ${result.description || ''}`.toLowerCase();
    return searchText.includes(term.toLowerCase());
  }
}

// Basic stop words list
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'your', 'are', 'was', 'were'
]);

// Automatic history maintenance
setInterval(async () => {
  try {
    const oldItems = await OfflineStorage.getAll('history', {
      index: 'timestamp',
      range: IDBKeyRange.upperBound(Date.now() - (MAX_HISTORY_DAYS * 24 * 3600 * 1000))
    });
    
    await Promise.all(oldItems.map(item => 
      OfflineStorage.delete('history', item.id)
    ));
    
    if (oldItems.length > 0) {
      console.log(`Cleaned up ${oldItems.length} old history items`);
    }
  } catch (error) {
    console.error('History cleanup failed:', error);
  }
}, 3600000); // Run hourly
