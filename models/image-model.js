// models/image-model.js
import * as tf from '@tensorflow/tfjs';

export const image = {
  model: null,
  classes: ["dog", "cat", "bird", "car", "tree", "building"],
  threshold: 0.5, // Lowered for testing

  async init() {
    try {
      this.model = await tf.loadLayersModel('/models/image-model.json');
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
    }
  },

  async classify(imgElement) {
    if (!this.model) {
      await this.init();
    }

    // Simple preprocessing
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(imgElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255)
        .expandDims();
    });

    // Prediction
    try {
      const prediction = this.model.predict(tensor);
      const results = await prediction.data();
      return this.formatResults(results);
    } finally {
      tensor.dispose();
    }
  },

  formatResults(predictions) {
    return this.classes
      .map((className, index) => ({
        class: className,
        confidence: predictions[index]
      }))
      .filter(item => item.confidence >= this.threshold)
      .sort((a, b) => b.confidence - a.confidence);
  }
};
