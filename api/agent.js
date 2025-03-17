// In your Vercel API route (api/agent.js)
import axios from 'axios';

export default async (req, res) => {
  try {
    // 1. Validate input
    if (!req.body.prompt?.trim()) {
      return res.status(400).json({ error: "Empty prompt" });
    }

    // 2. Configure request
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-xxl',
      {
        inputs: req.body.prompt, // Required field
        parameters: { // Optional parameters
          temperature: 0.7,
          max_new_tokens: 150
        }
      },
      { // Config object (3rd parameter)
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true' // Prevent timeout
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    // 3. Return formatted response
    res.status(200).json({ 
      response: response.data[0]?.generated_text || "No response"
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: error.response?.data?.error || "AI request failed"
    });
  }
};
