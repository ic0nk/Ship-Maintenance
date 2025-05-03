from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Pydantic Models for API Data Structures ---

class Message(BaseModel):
    """Represents a single message in the chat history."""
    role: str = Field(..., description="Role of the message sender ('user' or 'assistant')")
    content: str = Field(..., description="Content of the message")

class TroubleshootingState(BaseModel):
    """Holds the state required for interactive troubleshooting."""
    is_active: bool = Field(False, description="Is troubleshooting mode currently active?")
    current_problem: Optional[str] = Field(None, description="The name of the problem being troubleshooted")
    current_step: int = Field(0, description="The index (1-based) of the last solution step suggested")
    # problem_data is derived from the problem_dict on the backend when starting troubleshooting
    # No need to pass the whole dict back and forth usually.

class ChatRequest(BaseModel):
    """Request body for the /chat endpoint."""
    prompt: str = Field(..., description="The user's latest input/question")
    history: List[Message] = Field([], description="The conversation history up to this point")
    troubleshooting_state: TroubleshootingState = Field(default_factory=TroubleshootingState, description="Current troubleshooting status")
    force_web_search: bool = Field(False, description="Flag to force a web search instead of RAG (e.g., user clicked 'Search Web')")
    # session_id: Optional[str] = Field(None, description="Optional session identifier if managing multiple users") # Example if scaling state management

class ChatResponse(BaseModel):
    """Response body for the /chat endpoint."""
    answer: str = Field(..., description="The AI assistant's response message")
    history: List[Message] = Field(..., description="The updated conversation history")
    troubleshooting_state: TroubleshootingState = Field(..., description="The potentially updated troubleshooting status")
    offer_web_search: bool = Field(False, description="Indicates if the assistant suggests a web search")
    final_answer_source: str = Field("unknown", description="Source of the answer (e.g., 'Internal Knowledge', 'Web Search Synthesis', 'Troubleshooting Step', 'Error')")
    # source_documents: Optional[List[Dict[str, Any]]] = Field(None, description="Retrieved source documents (optional, for debugging/display)")

class StatusResponse(BaseModel):
    """Response for the /status endpoint."""
    status: str
    kb_loaded: bool
    web_search_enabled: bool
    message: Optional[str] = None

class SimpleResponse(BaseModel):
    """Generic success/error response."""
    success: bool
    message: str