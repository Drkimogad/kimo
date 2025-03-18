// models/image-model.js (Placeholder Version)
export const image = {
  model: null,
  
  async init() {
    // Load MobileNet from CDN
    this.model = await mobilenet.load({ version: 2, alpha: 1.0 });
  },

  async classify(imgElement) {
    if (!this.model) await this.init();
    return this.model.classify(imgElement);
  }
};
