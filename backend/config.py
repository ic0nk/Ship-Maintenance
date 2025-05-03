import os
from dotenv import load_dotenv
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Core Paths and Files ---
DATA_DIR = os.getenv("DATA_DIR", "data")
VECTORSTORE_DIR = os.getenv("VECTORSTORE_DIR", "vectorstore_faiss")
CSV_FILE_NAME = os.getenv("CSV_FILE_NAME", "ships.csv")
VECTORSTORE_INDEX_NAME = "index" # FAISS index name within the folder

# --- API Keys ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# --- Model & RAG Configuration ---
EMBEDDING_MODEL = "models/embedding-001"
LLM_MODEL = "gemini-2.0-flash-lite"
LLM_TEMPERATURE = 0.2
RAG_SEARCH_TYPE = "similarity" # or "mmr"
RAG_K = 4 # Number of documents to retrieve

# --- Troubleshooting ---
MAX_SOLUTION_STEPS = 3 # Max steps defined in CSV

# --- Web Search ---
TAVILY_MAX_RESULTS = 5
TAVILY_SEARCH_DESCRIPTION = "Useful for searching the web for current ship maintenance procedures, technical specifications, error codes, or troubleshooting advice not found in internal documents."
WEB_SEARCH_RESULT_MAX_CHARS = 3000

# --- Error Handling ---
MAX_CONSECUTIVE_ERRORS = 3 # Example threshold

# --- Basic Validation ---
if not GOOGLE_API_KEY:
    logging.warning("GOOGLE_API_KEY not found in environment variables. AI features requiring it will fail.")

if not TAVILY_API_KEY:
    logging.warning("TAVILY_API_KEY not found. Web search functionality will be disabled.")

# You could add checks here to ensure DATA_DIR exists, etc.
if not os.path.exists(DATA_DIR):
     logging.warning(f"Data directory '{DATA_DIR}' not found. Ensure it exists and contains '{CSV_FILE_NAME}'.")