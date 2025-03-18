// Load Text & Image Models
let textModel, imageModel, handwritingModel;

// Function to Load AI Models
async function loadModels() {
  textModel = await use.load();
  imageModel = await tf.loadLayersModel('/models/image_classification/model.json');
  handwritingModel = await tf.loadLayersModel('/models/handwriting_recognition/model.json');
}

// Call Model Loader on App Start
loadModels();
