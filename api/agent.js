import axios from 'axios';

export default async (req, res) => {
  // Customize your AI behavior here
  const config = {
    model: "google/flan-t5-xxl", // Or any free model
    parameters: {
      temperature: 0.7, // Control creativity
      max_new_tokens: 150
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
