import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
import re # Make sure re is imported
import time
import google.api_core.exceptions
from typing import Tuple
# Import necessary components from other modules
from config import (
    DATA_DIR, CSV_FILE_NAME, VECTORSTORE_DIR, VECTORSTORE_INDEX_NAME,
    TAVILY_API_KEY, GOOGLE_API_KEY
)

from models import (
    ChatRequest, ChatResponse, Message, StatusResponse, TroubleshootingState, SimpleResponse
)
import rag_core # Import the whole module to access its functions and globals

# --- FastAPI Lifespan Management (for loading models on startup) ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logging.info("Application startup: Initializing components...")
    rag_core.init_tavily_search() # Initialize Tavily tool

    # Load existing vectorstore or create if necessary (initial load)
    await load_knowledge_base_logic()

    yield # Application runs after this point

    # --- Shutdown ---
    logging.info("Application shutdown.")
    # Cleanup resources if needed (e.g., close database connections)
    # rag_core.vectorstore = None # etc. - not strictly necessary for globals

# --- Helper function for loading KB ---
async def load_knowledge_base_logic() -> Tuple[bool, str]:
    """Loads documents, creates/loads vectorstore, sets up LLM & RAG chain, loads problem dict."""
    if not GOOGLE_API_KEY:
        msg = "Cannot load Knowledge Base: GOOGLE_API_KEY is missing."
        logging.error(msg)
        return False, msg

    logging.info("Attempting to load knowledge base...")
    start_time = time.time()

    # 1. Load Documents
    docs = rag_core.load_documents_from_csv(DATA_DIR, CSV_FILE_NAME)
    if not docs:
        logging.warning("No documents loaded from CSV. KB will be empty or use existing index if available.")
        # Allow loading existing index even if CSV fails/is empty now

    # 2. Create/Load Vectorstore
    rag_core.vectorstore = rag_core.create_or_load_vectorstore(docs, VECTORSTORE_DIR, VECTORSTORE_INDEX_NAME)

    if not rag_core.vectorstore:
        msg = "Failed to create or load the vector store."
        logging.error(msg)
        # Reset other components if VS fails
        rag_core.llm = None
        rag_core.rag_chain = None
        rag_core.problem_dict = {}
        return False, msg

    # 3. Setup LLM and RAG Chain
    rag_core.llm, rag_core.rag_chain = rag_core.setup_llm_and_rag_chain(rag_core.vectorstore)

    if not rag_core.llm or not rag_core.rag_chain:
        msg = "Failed to set up the LLM or RAG chain after loading vector store."
        logging.error(msg)
        # Keep vectorstore loaded, but RAG won't work
        rag_core.problem_dict = {} # Reset this too as RAG failed
        return False, msg

    # 4. Load Problem Dictionary for troubleshooting mode
    rag_core.problem_dict = rag_core.load_problem_data_dict(DATA_DIR, CSV_FILE_NAME)
    # Loading this dict is not critical for basic RAG, so don't fail if it's empty

    end_time = time.time()
    msg = f"Knowledge Base loaded successfully in {end_time - start_time:.2f} seconds."
    logging.info(msg)
    return True, msg

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Smart Ship Assistant API",
    description="API backend for the Ship Troubleshooting & Maintenance Assistant",
    version="1.0.0",
    lifespan=lifespan # Use the lifespan context manager
)

# --- CORS Middleware ---
# Allow requests from your Next.js frontend domain (adjust origin as needed)
# Use "*" for development, but be more specific in production.
origins = [
    "http://localhost",         # Allow local development
    "http://localhost:3000",    # Default Next.js dev port
    # Add your deployed frontend URL here for production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)

# --- Dependency to check if RAG is ready ---
async def get_ready_state():
    if not rag_core.rag_chain or not rag_core.llm:
        raise HTTPException(
            status_code=503, # Service Unavailable
            detail="AI Assistant is not ready. Knowledge Base might not be loaded or initialized correctly."
        )
    # Could add more checks here if needed
    return True

# --- API Endpoints ---

@app.get("/status", response_model=StatusResponse, tags=["Status"])
async def get_status():
    """Check the operational status of the API and Knowledge Base."""
    kb_loaded = rag_core.vectorstore is not None and rag_core.rag_chain is not None
    web_search_ok = rag_core.tavily_tool is not None
    status_msg = "Ready" if kb_loaded else "Initializing or Error"
    if not GOOGLE_API_KEY:
         status_msg = "Error: GOOGLE_API_KEY missing"
         kb_loaded = False # Mark as not loaded if key missing
    elif not kb_loaded:
         status_msg = "Knowledge Base not loaded. Use /load_kb endpoint."

    return StatusResponse(
        status=status_msg,
        kb_loaded=kb_loaded,
        web_search_enabled=web_search_ok,
        message="Tavily API Key missing or invalid." if TAVILY_API_KEY and not web_search_ok else None
    )

@app.post("/load_kb", response_model=SimpleResponse, tags=["Knowledge Base"])
async def load_knowledge_base_endpoint():
    """Triggers the loading/reloading of the knowledge base."""
    # Call the loading logic
    success, message = await load_knowledge_base_logic()
    if not success:
        raise HTTPException(status_code=500, detail=message)
    return SimpleResponse(success=True, message=message)

@app.delete("/delete_kb", response_model=SimpleResponse, tags=["Knowledge Base"])
async def delete_knowledge_base_endpoint():
    """Deletes the cached knowledge base directory."""
    logging.info("Received request to delete knowledge base.")

    # Call the deletion logic directly. If it raises an exception handled internally,
    # it will return False, message. If it raises an unhandled one, FastAPI catches it.
    success, message = rag_core.delete_vectorstore_directory(VECTORSTORE_DIR)

    if success:
        # Only reset globals AFTER successful deletion is confirmed
        try:
            logging.info("Resetting global state variables after KB deletion.")
            rag_core.vectorstore = None
            rag_core.rag_chain = None
            rag_core.llm = None
            rag_core.problem_dict = {}
            logging.info("Global state variables reset successfully.")
            # Return success response
            return SimpleResponse(success=True, message=message)
        except Exception as reset_err:
            # Log the state reset error clearly, but deletion succeeded.
            logging.error(f"Error resetting global state after KB deletion (DELETION SUCCEEDED): {reset_err}", exc_info=True)
            # Return success but mention the state reset issue
            return SimpleResponse(success=True, message=f"{message} (Note: Error during internal state reset.)")
    else:
        # Deletion function returned False, use its message
        logging.warning(f"Knowledge base deletion reported failure: {message}")
        # If the reason was 'not found', return a 404 error.
        # Otherwise, return a 500 error, using the message from rag_core.
        if "not found" in message.lower():
             raise HTTPException(status_code=404, detail=message) # Correct status for not found
        else:
             # Raise 500 for permission errors, OS errors etc. reported by rag_core
             raise HTTPException(status_code=500, detail=f"Failed to delete knowledge base: {message}")


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_endpoint(
    chat_request: ChatRequest = Body(...),
    is_ready: bool = Depends(get_ready_state)
):
    # ... (Initial setup: prompt, history, etc.) ...
    prompt = chat_request.prompt
    history = chat_request.history
    ts_state = chat_request.troubleshooting_state
    force_web_search = chat_request.force_web_search

    assistant_response_content = "Sorry, something went wrong processing your request."
    final_answer_source = "Error"
    offer_web_search = False
    updated_history = history + [Message(role="user", content=prompt)]
    rag_answer = ""

    try: # Wrap the main logic in a try-catch block
        # --- Web Search & Synthesis (if explicitly forced/requested) ---
        if force_web_search:
            logging.info("Forcing web search based on request flag.")
            if not rag_core.tavily_tool:
                assistant_response_content = "Web search was requested, but it is currently disabled (missing API key or initialization error)."
                final_answer_source = "Web Search Disabled"
            else:
                # Use the refined synthesis function directly
                assistant_response_content, final_answer_source = await rag_core.perform_web_search_and_synthesis(prompt)
            # Reset troubleshooting state if web search was forced
            ts_state = TroubleshootingState()

        # --- Regular Processing (Troubleshooting or RAG) ---
        else:
            response_strategy = "rag"
            needs_rag_call = True
            contextual_prompt = prompt

            # --- Determine strategy (Troubleshooting Checks - remains the same) ---
            if ts_state.is_active and ts_state.current_problem:
                # ... (existing logic for solved/not solved/follow-up question) ...
                # Ensure needs_rag_call is set correctly
                problem_name = ts_state.current_problem
                current_step = ts_state.current_step
                if rag_core.is_problem_solved(prompt):
                    response_strategy = "solved"
                    needs_rag_call = False
                elif rag_core.is_problem_not_solved(prompt):
                    response_strategy = "next_step"
                    needs_rag_call = False
                else:
                    contextual_prompt = (f"Context: Currently troubleshooting ship problem '{problem_name}' "
                                     f"(last suggested step was {current_step}). User asks: {prompt}")
                    response_strategy = "rag_troubleshooting_context"
                    needs_rag_call = True
            elif not ts_state.is_active and rag_core.problem_dict:
                 detected_problem = rag_core.detect_problem(prompt, rag_core.problem_dict)
                 if detected_problem and rag_core.is_asking_for_help(prompt):
                      response_strategy = "start_troubleshooting"
                      needs_rag_call = False

            # --- Execute based on strategy ---
            # --- Handle Troubleshooting Steps (Solved, Next Step, Start) ---
            if response_strategy == "solved":
                # ... (existing logic) ...
                assistant_response_content = f"Excellent! Glad to hear the issue with **'{problem_name}'** is resolved. How else can I help?"
                final_answer_source = "Troubleshooting Solved"
                ts_state = TroubleshootingState()
            elif response_strategy == "next_step":
                # ... (existing logic) ...
                next_step_num, next_step_text, cause = rag_core.get_next_solution_step(problem_name, current_step)
                if next_step_num and next_step_text:
                    ts_state.current_step = next_step_num
                    assistant_response_content = f"Okay, let's try the next step for **'{problem_name}'**:\n\n**Step {next_step_num}: {next_step_text}**\n\nPlease try this and let me know if it solved the problem."
                    final_answer_source = "Troubleshooting Step"
                else:
                    # ... (end of steps logic, potentially offer web search) ...
                    assistant_response_content = f"We've tried all the documented steps for **'{problem_name}'**.\n\nI couldn't resolve it with the internal guide."
                    final_answer_source = "Troubleshooting End"
                    if rag_core.tavily_tool:
                        offer_web_search = True
                        assistant_response_content += "\n\nWould you like me to search the web for additional insights?"
                    ts_state = TroubleshootingState()
            elif response_strategy == "start_troubleshooting":
                 # ... (existing logic) ...
                 problem_data = rag_core.problem_dict.get(detected_problem)
                 if problem_data:
                      first_step_num, first_step_text, cause = rag_core.get_next_solution_step(detected_problem, 0)
                      if first_step_num and first_step_text:
                           ts_state = TroubleshootingState(is_active=True, current_problem=detected_problem, current_step=first_step_num)
                           cause_text = f"(Possible Cause: *{cause}*)" if cause and cause != 'N/A' else ""
                           assistant_response_content = f"Okay, let's start troubleshooting for **'{detected_problem}'**. {cause_text}\n\n**Step {first_step_num}: {first_step_text}**\n\nPlease perform this step and tell me if it solved the problem."
                           final_answer_source = "Troubleshooting Start"
                      else:
                           # ... (no steps found logic, potentially offer web search) ...
                           assistant_response_content = f"I found **'{detected_problem}'** in the guide, but there are no specific solution steps listed."
                           final_answer_source = "Troubleshooting No Steps"
                           if rag_core.tavily_tool:
                                offer_web_search = True
                                assistant_response_content += "\n\nWould you like me to search the web?"
                           ts_state = TroubleshootingState()
                 else: # Should not happen if detect_problem worked
                     assistant_response_content = "I recognized the problem, but encountered an internal error retrieving the steps."
                     final_answer_source = "Error"
                     ts_state = TroubleshootingState()

            # --- RAG Call and Quality-Based Fallback ---
            elif needs_rag_call:
                rag_response = None
                rate_limit_hit_during_rag = False

                try:
                    logging.info(f"Performing RAG call with effective prompt: {contextual_prompt}")
                    rag_response = await rag_core.invoke_rag_chain(rag_core.rag_chain, contextual_prompt, history)
                    rag_answer = rag_response.get('answer', "").strip()
                    logging.info("RAG call successful.")

                # Keep specific catch first, just in case it works sometimes
                except google.api_core.exceptions.ResourceExhausted as specific_rate_limit_exc:
                    logging.warning(f"Caught specific ResourceExhausted during RAG: {specific_rate_limit_exc}") # Log if this *ever* hits
                    rate_limit_hit_during_rag = True
                    # (Same logic as below to set response)
                    retry_match = re.search(r"retry_delay {\s*seconds: (\d+)\s*}", str(specific_rate_limit_exc))
                    delay_msg = " Please try again later."
                    if retry_match: delay_msg = f" Please try again in about {retry_match.group(1)} seconds."
                    assistant_response_content = f"The AI service is temporarily busy due to high demand.{delay_msg}"
                    final_answer_source = "Error (Rate Limited)"

                # *** MODIFIED GENERIC EXCEPTION HANDLER ***
                except Exception as rag_exc:
                    logging.error(f"Exception occurred during RAG call execution: {type(rag_exc).__name__} - {rag_exc}", exc_info=False) # exc_info=False optional for cleaner logs here

                    # Check if the caught exception IS or WAS CAUSED BY ResourceExhausted
                    is_rate_limit_error = False
                    actual_exception_for_message = rag_exc
                    if isinstance(rag_exc, google.api_core.exceptions.ResourceExhausted):
                        is_rate_limit_error = True
                    elif isinstance(rag_exc.__cause__, google.api_core.exceptions.ResourceExhausted):
                        is_rate_limit_error = True
                        actual_exception_for_message = rag_exc.__cause__ # Use the original cause for the message
                    # Add more checks here if LangChain wraps it differently, e.g. check rag_exc.args

                    if is_rate_limit_error:
                        logging.error(f"Identified Rate Limit Error within generic Exception block: {actual_exception_for_message}")
                        rate_limit_hit_during_rag = True # Set the flag
                        # Extract retry delay from the actual ResourceExhausted exception
                        retry_match = re.search(r"retry_delay {\s*seconds: (\d+)\s*}", str(actual_exception_for_message))
                        delay_msg = " Please try again later."
                        if retry_match: delay_msg = f" Please try again in about {retry_match.group(1)} seconds."
                        assistant_response_content = f"The AI service is temporarily busy due to high demand.{delay_msg}"
                        final_answer_source = "Error (Rate Limited)"
                    else:
                        # It's some other RAG error
                        rate_limit_hit_during_rag = True # Treat other RAG errors as blocking fallback too for now
                        assistant_response_content = f"Sorry, an error occurred while retrieving information from the knowledge base ({type(rag_exc).__name__})."
                        final_answer_source = "Error (RAG Failure)"


                # --- Proceed only if RAG call didn't hit rate limit or other critical error ---
                if not rate_limit_hit_during_rag:
                    # ** Assess RAG Answer Quality (if RAG succeeded) **
                    if rag_answer and rag_core.is_rag_answer_sufficient(rag_answer):
                        # RAG answer is deemed good enough
                        assistant_response_content = rag_answer
                        final_answer_source = "Internal Knowledge (RAG)"
                        logging.info("RAG answer assessed as sufficient.")

                    else:
                        # RAG answer is insufficient or empty, AUTOMATICALLY attempt web search fallback
                        if not rag_answer:
                            logging.warning("RAG call returned an empty answer. Attempting web search fallback.")
                        # (Log message for insufficient answer is inside is_rag_answer_sufficient)

                        if rag_core.tavily_tool:
                            logging.info("Attempting automatic web search fallback due to insufficient/empty RAG answer...")
                            # ... (rest of the web search fallback logic remains the same) ...
                            # try:
                            #     web_search_answer, web_search_source = await rag_core.perform_web_search_and_synthesis(prompt)
                            #     ... (process web_search_answer and web_search_source) ...
                            # except Exception as web_exc:
                            #     ... (handle web search specific errors) ...
                            # *********************************************************************
                            # THE WEB SEARCH FALLBACK LOGIC SHOULD NOW CORRECTLY EXECUTE ONLY
                            # IF THE INITIAL RAG CALL DID NOT HIT A RATE LIMIT OR OTHER BLOCKING ERROR
                            # *********************************************************************
                            web_search_answer = None
                            web_search_source = None
                            try:
                                web_search_answer, web_search_source = await rag_core.perform_web_search_and_synthesis(prompt)
                                # ... (DEBUG logging and processing logic as added previously) ...
                                logging.info(f"[main.py] Received from rag_core -> Source: '{web_search_source}', ...") # Keep debug logs

                                expected_success_source = "Web Search Synthesis (Ship Focused)"
                                source_comparison_result = web_search_source == expected_success_source
                                answer_validity_check = bool(web_search_answer)

                                if source_comparison_result and answer_validity_check:
                                    assistant_response_content = web_search_answer
                                    final_answer_source = web_search_source
                                    logging.info(f"SUCCESS BLOCK ENTERED. Final source set to: {final_answer_source}")
                                # ... (rest of elif/else blocks for web search results) ...
                                elif web_search_source in ["Web Search No Results", ...]: # Handle other cases
                                     assistant_response_content = web_search_answer
                                     final_answer_source = web_search_source
                                     logging.warning(f"NON-SUCCESS BLOCK ENTERED (Known Type): {web_search_source}")
                                     if rag_answer: assistant_response_content = f"{rag_answer}\n\n{web_search_answer}"
                                elif web_search_source == "Error" or web_search_source == "Error (Rate Limited)": # Catch rate limit from web search too
                                     error_message_detail = web_search_answer
                                     logging.error(f"ERROR BLOCK ENTERED (Reported by rag_core during web search): {error_message_detail}")
                                     assistant_response_content = f"{rag_answer}\n\n_({error_message_detail})_" if rag_answer else f"I couldn't find information internally. {error_message_detail}"
                                     final_answer_source = "Internal Knowledge (Limited)" if rag_answer else "Error"
                                else: # Unexpected state
                                     logging.error(f"UNEXPECTED STATE BLOCK ENTERED after web search. Source: '{web_search_source}', ...")
                                     assistant_response_content = f"{rag_answer}\n\n_(Internal knowledge was limited. Web search fallback did not produce a usable result [State: {web_search_source}])_" if rag_answer else "I couldn't find information internally, and the web search fallback did not produce a usable result [State: {web_search_source}]."
                                     final_answer_source = "Internal Knowledge (Limited)"

                            except Exception as web_exc:
                                logging.error(f"Exception occurred *calling* automatic web search fallback: {web_exc}", exc_info=True)
                                error_msg = f"An error occurred while initiating the web search ({type(web_exc).__name__})."
                                assistant_response_content = f"{rag_answer}\n\n_({error_msg})_" if rag_answer else f"I couldn't find information internally. {error_msg}"
                                final_answer_source = "Internal Knowledge (Limited)" if rag_answer else "Error"
                        else:
                            # Web search disabled logic
                            logging.warning("RAG answer insufficient/empty, and web search is disabled.")
                            assistant_response_content = f"{rag_answer}\n\n_(Internal knowledge was limited, and web search is currently unavailable.)_" if rag_answer else "I couldn't find specific information in the internal guide, and web search is currently unavailable."
                            final_answer_source = "Internal Knowledge (Limited)"
            else:
                 # This case should only be hit if troubleshooting logic didn't produce content
                 if not assistant_response_content or final_answer_source == "Error":
                      logging.warning(f"Reached end of main logic without a definitive answer. Strategy was '{response_strategy}'.")
                      # Use a generic message if no other content was set
                      assistant_response_content = assistant_response_content or "I was unable to determine the next step or find information for your request."
                      final_answer_source = final_answer_source or "Error"


    except Exception as e:
        # Catch unexpected errors in the overall endpoint logic
        logging.error(f"Unhandled exception in chat_endpoint: {e}", exc_info=True)
        assistant_response_content = f"An unexpected server error occurred: {type(e).__name__}"
        final_answer_source = "Server Error"
        ts_state = TroubleshootingState() # Reset state on major error
        offer_web_search = False


    # --- Final Response Assembly ---
    # Ensure there's always some content
    if not assistant_response_content:
         logging.error("Assistant response content was empty before final assembly. Setting generic error.")
         assistant_response_content = "Sorry, I encountered an issue and couldn't generate a response."
         final_answer_source = "Error"

    updated_history.append(Message(role="assistant", content=assistant_response_content))

    return ChatResponse(
        answer=assistant_response_content,
        history=updated_history,
        troubleshooting_state=ts_state,
        offer_web_search=offer_web_search,
        final_answer_source=final_answer_source
    )


# --- Optional: Add timing utility ---
import time
from functools import wraps

def timing_sync(description: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            logging.info(f"{description} took {end_time - start_time:.4f} seconds")
            return result
        return wrapper
    return decorator

def timing_async(description: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            end_time = time.time()
            logging.info(f"{description} took {end_time - start_time:.4f} seconds")
            return result
        return wrapper
    return decorator

# Add it to functions in rag_core if desired, e.g.:
# @timing_sync("Load Documents from CSV")
# def load_documents_from_csv(...)

# @timing_async("Invoke RAG Chain")
# async def invoke_rag_chain(...)


# --- Main execution block for running with Uvicorn ---
if __name__ == "__main__":
    import uvicorn
    # Make sure logging is configured before uvicorn starts capturing logs
    logging.info("Starting Uvicorn server...")
    # Reload=True is useful for development but should be False in production
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
    # Production command might be: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4