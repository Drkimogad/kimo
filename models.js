// Load Text & Image Models
let textModel, imageModel;

// Function to Load AI Models
async function loadModels() {
  try {
    console.log("Loading models...");

    // Load Text Model (Pretrained)
    textModel = await use.load();
    console.log("Text model loaded!");

    // Load Image Model (Pretrained)
    imageModel = await tf.loadLayersModel('/models/image-model.json');
    console.log("Image model loaded!");

  } catch (error) {
    console.error("Error loading models:", error);
  }
}

// Call Model Loader on App Start
loadModels();
