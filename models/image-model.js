// image-model.js
let imageModel = null; // Isolated model instance

export const classifyImage = async (imgElement) => {
  try {
    // Dynamically load MobileNet and TensorFlow
    const [mobilenet, tf] = await Promise.all([
      import("https://esm.sh/@tensorflow-models/mobilenet@2.1.0"),
      import("https://esm.sh/@tensorflow/tfjs@4.22.0")
    ]);

    // Lazy-load model
    if (!imageModel) {
      imageModel = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      console.log("🖼️ Image model initialized");
    }

    // Perform classification
    const predictions = await imageModel.classify(imgElement);
    return predictions;

  } catch (error) {
    console.error("Image model error:", error);
    return [];
  }
};
