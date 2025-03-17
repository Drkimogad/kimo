import axios from 'axios';

export default async (req, res) => {
  // Customize your AI behavior here
const config = {
  model: "google/flan-t5-xxl", // Try others: "bigscience/bloom"
  parameters: {
    temperature: 0.9, // More creative
    max_new_tokens: 200
  }
};

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${config.model}`,
      {
        inputs: req.body.prompt,
        parameters: config.parameters
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`
        }
      }
    );

    res.status(200).json({ response: response.data[0].generated_text });
  } catch (error) {
    res.status(500).json({ error: "AI Agent failed to respond" });
  }
};
