# Ship Maintenance AI Assistant

This application provides an AI-powered assistant for ship maintenance diagnostics and recommendations.

## API Keys Setup

The application uses two external API keys to enhance the AI assistant's capabilities:

1. **Google API Key**: Used for accessing Google's Gemini Pro model for advanced AI processing
2. **Tavily API Key**: Used for performing web searches to gather relevant information

These keys are already configured in your `.env.local` file:

\`\`\`
# API Configuration
AI_API_URL=http://localhost:8000
GOOGLE_API_KEY=AIzaSyCrQ1tQgFkFGGVuVnQzSn_C17F1hVQNTRw
TAVILY_API_KEY=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
\`\`\`

## Running the Application

### Option 1: Frontend Only (with Fallback Mode)

If you just want to preview the application without the AI backend:

\`\`\`bash
npm run dev
\`\`\`

The application will run in fallback mode, using pre-programmed responses instead of the AI service.

### Option 2: Full Application with AI Backend

For the complete experience with AI-powered responses:

1. **Install Python dependencies**:

\`\`\`bash
pip install fastapi uvicorn python-dotenv google-generativeai langchain langchain-google-genai langchain-community faiss-cpu requests
\`\`\`

2. **Start the FastAPI backend**:

\`\`\`bash
cd backend
uvicorn main:app --reload
\`\`\`

The backend will run on http://localhost:8000 by default.

3. **Start the Next.js Frontend** (in a separate terminal):

\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at http://localhost:3000.

## Features

- AI-powered ship maintenance diagnostics
- Upload and process ship component catalogs and technical documents
- Advanced search capabilities using Tavily
- Diagnostic results with severity levels and recommendations
- Responsive design for all devices

## Troubleshooting

If you encounter issues with the AI service:

1. **Backend Not Running**: If you see "AI Service: Offline" in the UI, check if the Python backend is running.
2. **API Key Issues**: If you see "AI Service: Limited", check that your API keys are correctly set in `.env.local`.
3. **Connection Timeout**: If the health check is slow, the backend might be unreachable. Check your network settings.
4. **CORS Issues**: If you see network errors in the console, there might be CORS issues. Make sure the backend has CORS middleware enabled.

### Fallback Mode

The application includes a fallback mode that works even when the AI service is unavailable. This allows you to preview and test the UI without running the backend.

In fallback mode:
- The AI will respond with pre-programmed answers based on keywords in your queries
- Document upload will work, but documents won't be processed by AI
- Advanced search functionality will be limited
