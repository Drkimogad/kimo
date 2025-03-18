let textModel, imageModel;

async function loadModels() {
  textModel = await tf.loadLayersModel('/models/text-model.json'); // Local model
  imageModel = await tf.loadLayersModel('/models/image-model.json'); // Local model
}
