// models/handwritingModel.js
export const recognizeHandwriting = {
  model: null,
  
  async init() {
    this.model = await tf.loadGraphModel('https://drkimogad.github.io/kimo/models/crnn/model.json');
  },

  async recognize(canvas) {
    // Preprocess for CRNN model
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(canvas)
        .resizeNearestNeighbor([32, 128])
        .mean(2)
        .expandDims(2)
        .expandDims()
        .toFloat()
        .div(255.0);
    });

    const prediction = this.model.predict(tensor);
    const sequence = await processCRNNOutput(prediction);
    return sequence;
  }
};

// CRNN output decoder
const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function processCRNNOutput(prediction) {
  const [output] = prediction.dataSync();
  return Array.from(output)
    .map(idx => CHAR_SET[idx] || '')
    .join('');
}
