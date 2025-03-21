import * as use from 'https://esm.sh/@tensorflow-models/universal-sentence-encoder';
import tf from './main.js';

export const text = {
  model: null,
  
  async init() {
    try {
      this.model = await use.load();
      console.log('Text model loaded');
    } catch (error) {
      console.error('Text model failed:', error);
      throw new Error('Text processing unavailable');
    }
  },

  async checkPlagiarism(content) {
    if (!this.model) await this.init();
    
    // Ensure sessionHistory is defined and accessible
    const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory')) || [];

    // Compare with history
    const currentEmbedding = await this.model.embed(content);
    const similarities = await Promise.all(
      sessionHistory
        .filter(entry => entry.type === 'text')
        .map(async entry => {
          const histEmbedding = await this.model.embed(entry.content);
          return cosineSimilarity(currentEmbedding, histEmbedding);
        })
    );

    return {
      score: Math.max(...similarities) * 100 || 0,
      isPlagiarized: Math.max(...similarities) > 0.85
    };
  }
};

// Helper function
function cosineSimilarity(a, b) {
  return tf.tidy(() => {
    const aNorm = a.norm();
    const bNorm = b.norm();
    const dotProduct = a.dot(b.transpose()).dataSync()[0];
    return dotProduct / (aNorm * bNorm);
  });
}
