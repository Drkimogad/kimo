// models/handwritingModel.js
export const recognizeHandwriting = {
  model: null,
  
  async init() {
    try {
      // Load pre-trained handwriting model
      this.model = await tf.loadLayersModel('/models/handwriting/model.json');
      console.log('Handwriting model loaded');
    } catch (error) {
      console.error('Handwriting model failed to load:', error);
      throw new Error('Handwriting recognition unavailable');
    }
  },

  async recognize(canvas) {
    if (!this.model) await this.init();
    
    // Preprocess image
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(canvas)
        .resizeNearestNeighbor([28, 28])
        .mean(2)
        .expandDims(2)
        .expandDims()
        .toFloat()
        .div(255.0);
    });

    // Predict
    const prediction = this.model.predict(tensor);
    const results = await prediction.data();
    
    // Map to characters (A-Z)
    const charCode = 65 + results.indexOf(Math.max(...results));
    return String.fromCharCode(charCode);
  }
};
