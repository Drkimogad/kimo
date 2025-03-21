import * as mobilenet from 'https://esm.sh/@tensorflow-models/mobilenet';
import tf from '../main.js';

export const image = {
  model: null,
  
  async init() {
    try {
      // Load MobileNet from CDN
      this.model = await mobilenet.load({ version: 2, alpha: 1.0 });
      console.log('Image model loaded');
    } catch (error) {
      console.error('Image model failed:', error);
      throw new Error('Image classification unavailable');
    }
  },

  async classify(imgElement) {
    if (!this.model) await this.init();
    return this.model.classify(imgElement);
  }
};
