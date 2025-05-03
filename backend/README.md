# Ship Maintenance AI Backend

This is the FastAPI backend for the Ship Maintenance AI Assistant.

## Setup

1. Install the required Python packages:

\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Create a `.env` file in the backend directory with your API keys:

\`\`\`
GOOGLE_API_KEY=your_google_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
\`\`\`

3. Create a `data` directory in the backend directory and place your `ships.csv` file there.

## Running the Backend

Start the FastAPI backend:

\`\`\`bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

## API Endpoints

- `GET /health`: Check the health of the backend
- `POST /initialize`: Initialize or re-initialize the knowledge base
- `GET /status`: Get the status of the backend
- `POST /chat`: Send a message to the AI assistant
- `POST /clear_chat/{session_id}`: Clear the chat history for a session
- `DELETE /knowledge_base`: Delete the knowledge base

## Troubleshooting

If you encounter issues:

1. Check that the backend is running on http://localhost:8000
2. Verify that your API keys are correctly set in the `.env` file
3. Make sure the `ships.csv` file is in the `data` directory
4. Check the console logs for error messages
