// text-model.js
let textModel = null; // Keep model reference isolated

// Helper function for similarity calculation
const cosineSimilarity = async (a, b) => {
  // Dynamically import TensorFlow ONLY when needed
  const tf = await import("https://esm.sh/@tensorflow/tfjs@4.22.0");
  
  return tf.tidy(() => {
    const aNorm = a.norm();
    const bNorm = b.norm();
    const dotProduct = a.dot(b.transpose()).dataSync()[0];
    return dotProduct / (aNorm * bNorm);
  });
};

export const checkPlagiarism = async (content) => {
  try {
    // Dynamically load sentence encoder
    const { load } = await import(
      "https://esm.sh/@tensorflow-models/universal-sentence-encoder@1.3.3"
    );

    // Lazy-load model
    if (!textModel) {
      textModel = await load();
      console.log("📄 Text model initialized");
    }

    // Get session history
    const sessionHistory = JSON.parse(localStorage.getItem("sessionHistory")) || [];

    // Generate embeddings
    const currentEmbedding = await textModel.embed(content);
    
    // Compare with history
    const similarities = await Promise.all(
      sessionHistory
        .filter(entry => entry.type === "text")
        .map(async (entry) => {
          const histEmbedding = await textModel.embed(entry.content);
          return await cosineSimilarity(currentEmbedding, histEmbedding);
        })
    );

    // Return results
    const maxSimilarity = Math.max(...similarities) || 0;
    return {
      score: (maxSimilarity * 100).toFixed(2),
      isPlagiarized: maxSimilarity > 0.85
    };

  } catch (error) {
    console.error("Text model error:", error);
    return { score: 0, isPlagiarized: false };
  }
};
