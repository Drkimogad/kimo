// image-model.js
export const image = {
  model: null,
  classes: ["dog", "cat", "bird", "car", "tree", "building"],
  threshold: 0.7,

  async init() {
    // 1. Load model from IndexedDB (offline-first)
    const cachedModel = await this.loadCachedModel();
    
    if(cachedModel) {
      this.model = cachedModel;
    } else {
      // 2. Load from local bundled model
      this.model = await tf.loadLayersModel('models/image-model.json');
      
      // 3. Cache for future offline use
      await this.cacheModel();
    }
  },

  async classify(imgElement) {
    // Preprocess image
    const tensor = tf.browser.fromPixels(imgElement)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(255)
      .expandDims();

    // Predict
    const predictions = await this.model.predict(tensor);
    const results = Array.from(predictions.dataSync());

    // Map to classes
    return this.classes
      .map((className, index) => ({
        class: className,
        confidence: results[index]
      }))
      .filter(item => item.confidence >= this.threshold);
  },

  // IndexedDB caching implementation
  async cacheModel() {
    const modelArtifacts = await this.model.save('indexeddb://my-image-model');
  },

  async loadCachedModel() {
    try {
      return await tf.loadLayersModel('indexeddb://my-image-model');
    } catch(error) {
      return null;
    }
  }
};
