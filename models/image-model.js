// models/image-model.js
import * as tf from '@tensorflow/tfjs';

export const image = {
  model: null,
  classes: ["dog", "cat", "bird", "car", "tree", "building"],
  threshold: 0.7,

  async init() {
    try {
      // Try loading from IndexedDB first
      this.model = await this.loadCachedModel();
      
      if (!this.model) {
        // Load from local files
        this.model = await tf.loadLayersModel('/models/image-model.json');
        await this.cacheModel();
      }
    } catch (error) {
      console.error('Model initialization failed:', error);
      throw new Error('Failed to load image classification model');
    }
  },

  async classify(imageElement) {
    if (!this.model) await this.init();

    // Preprocess image
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims();
    });

    // Predict
    const predictions = await this.model.predict(tensor);
    const data = await predictions.data();
    tensor.dispose();
    predictions.dispose();

    // Process results
    return this.processPredictions(data);
  },

  processPredictions(predictions) {
    return this.classes
      .map((className, index) => ({
        className,
        confidence: predictions[index],
        timestamp: new Date().toISOString()
      }))
      .filter(item => item.confidence >= this.threshold)
      .sort((a, b) => b.confidence - a.confidence);
  },

  async cacheModel() {
    const saveResult = await this.model.save('indexeddb://image-model-v1');
    console.log('Model cached successfully');
    return saveResult;
  },

  async loadCachedModel() {
    try {
      const model = await tf.loadLayersModel('indexeddb://image-model-v1');
      console.log('Loaded model from cache');
      return model;
    } catch (error) {
      console.log('No cached model found');
      return null;
    }
  }
};
