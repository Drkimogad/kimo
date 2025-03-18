// Load Handwriting Recognition Model
async function loadHandwritingModel() {
    try {
        const modelURL = './models/handwriting_model/model.json';
        handwritingModel = await tf.loadLayersModel(modelURL);
        console.log("📝 Handwriting Model Loaded Successfully!");
    } catch (error) {
        console.error("❌ Error loading handwriting model:", error);
    }
}

// Recognize Handwriting from an Image
async function recognizeHandwriting(image) {
    try {
        if (!handwritingModel) {
            throw new Error("Model not loaded yet!");
        }

        // Convert Image to Tensor
        const tensor = tf.browser.fromPixels(image)
            .resizeNearestNeighbor([28, 28]) // Adjust for your model's expected input size
            .mean(2) // Convert to grayscale
            .toFloat()
            .expandDims(0)
            .expandDims(-1)
            .div(255.0); // Normalize pixels

        // Make Prediction
        const prediction = await handwritingModel.predict(tensor).data();

        // Release Memory
        tf.dispose(tensor);

        // Return the Most Likely Character
        const predictedIndex = prediction.indexOf(Math.max(...prediction));
        return { text: String.fromCharCode(65 + predictedIndex), confidence: prediction[predictedIndex] };
    } catch (error) {
        console.error("❌ Handwriting recognition error:", error);
        return { text: "Unknown", confidence: 0 };
    }
}

// Load model when script runs
loadHandwritingModel();
