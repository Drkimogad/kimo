import { pipeline } from '@xenova/transformers';

export default async (req, res) => {
  try {
    // 1. Validate input
    if (!req.body.prompt?.trim()) {
      return res.status(400).json({ error: "Empty prompt" });
    }

    // 2. Load AI Model (FLAN-T5 Small for efficiency)
    const generateText = await pipeline('text2text-generation', 'Xenova/flan-t5-small');

    // 3. Generate Response
    const output = await generateText(req.body.prompt, {
      max_length: 150,
      temperature: 0.7
    });

    // 4. Return Response
    res.status(200).json({ response: output[0]?.generated_text || "No response generated" });

  } catch (error) {
    console.error('AI Processing Error:', error);
    res.status(500).json({ error: "AI request failed" });
  }
};
