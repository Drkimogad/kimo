```mermaid
sequenceDiagram
    participant User
    participant Vercel
    participant HuggingFace

    User->>Vercel: POST /api/agent (input text)
    Note right of Vercel: HUGGINGFACE_KEY is hidden<br>in environment variables
    Vercel->>HuggingFace: API request (with secret key)
    HuggingFace->>Vercel: AI response
    Vercel->>User: Formatted result
