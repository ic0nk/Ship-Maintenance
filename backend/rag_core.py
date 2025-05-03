import os
import re
import pandas as pd
import time
import logging
from typing import List, Dict, Tuple, Optional, Any

from langchain.chains import ConversationalRetrievalChain
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.docstore.document import Document
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import FAISS
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.schema import BaseRetriever, BaseMemory
from langchain.schema.messages import BaseMessage
from langchain.schema.document import Document as LangchainDocument # Alias to avoid clash
from langchain.base_language import BaseLanguageModel # Correct type hint

import shutil

import logging
import re

from config import (
    DATA_DIR, CSV_FILE_NAME, VECTORSTORE_DIR, VECTORSTORE_INDEX_NAME,
    EMBEDDING_MODEL, LLM_MODEL, LLM_TEMPERATURE, RAG_SEARCH_TYPE, RAG_K,
    MAX_SOLUTION_STEPS, TAVILY_API_KEY, TAVILY_MAX_RESULTS,
    TAVILY_SEARCH_DESCRIPTION, WEB_SEARCH_RESULT_MAX_CHARS, GOOGLE_API_KEY
)
from models import TroubleshootingState, Message # Import necessary models

# --- Global Storage (initialized at app startup) ---
# These will be populated by the lifespan manager in main.py
vectorstore: Optional[FAISS] = None
llm: Optional[BaseLanguageModel] = None
rag_chain: Optional[ConversationalRetrievalChain] = None
problem_dict: Dict[str, Dict[str, str]] = {}
tavily_tool: Optional[TavilySearchResults] = None

# --- Initialization Functions ---

def init_tavily_search():
    """Initializes the Tavily Search Tool."""
    global tavily_tool
    if TAVILY_API_KEY:
        try:
            tavily_tool = TavilySearchResults(
                max_results=TAVILY_MAX_RESULTS,
                description=TAVILY_SEARCH_DESCRIPTION
            )
            logging.info("Tavily Search Tool initialized successfully.")
            return True
        except Exception as e:
            logging.error(f"Error initializing Tavily Search Tool: {e}", exc_info=True)
            tavily_tool = None
            return False
    else:
        logging.warning("TAVILY_API_KEY not found. Web search disabled.")
        tavily_tool = None
        return False

def load_documents_from_csv(data_dir: str, csv_file_name: str) -> List[LangchainDocument]:
    """Loads documents from the specified CSV, creating one Document per row."""
    documents = []
    try:
        file_path = os.path.join(data_dir, csv_file_name)
        logging.info(f"Attempting to load CSV from: {file_path}")
        if not os.path.exists(file_path):
             logging.error(f"CSV file '{csv_file_name}' not found in '{data_dir}'")
             return []

        try:
            df = pd.read_csv(file_path, on_bad_lines='skip', dtype=str, keep_default_na=False)
        except TypeError: # Fallback for older pandas versions
            df = pd.read_csv(file_path, error_bad_lines=False, warn_bad_lines=True, dtype=str, keep_default_na=False) # Note: error_bad_lines/warn_bad_lines deprecated
        logging.info(f"CSV loaded, {len(df)} rows found.")

        required_columns = ['problem', 'solution_step_1'] # Minimal required
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            logging.error(f"CSV missing required columns: {', '.join(missing_cols)}")
            return []

        solution_cols = [f'solution_step_{i}' for i in range(1, MAX_SOLUTION_STEPS + 1)]
        processed_count = 0
        skipped_count = 0

        for index, row in df.iterrows():
            problem = str(row.get('problem', '')).strip()
            cause = str(row.get('possible_cause', '')).strip()
            step1 = str(row.get('solution_step_1', '')).strip()

            if not problem or not step1:
                logging.warning(f"Skipping row {index+2}: Missing essential data (problem or solution_step_1). Problem='{problem}', Step1='{step1}'")
                skipped_count += 1
                continue

            metadata = {'source': csv_file_name, 'row': index + 2, 'problem': problem}
            content_parts = [f"Problem: {problem}"]

            if cause:
                 metadata['possible_cause'] = cause
                 content_parts.append(f"Possible Cause: {cause}")

            valid_steps_found = False
            for i, col_name in enumerate(solution_cols, 1):
                 step_content = str(row.get(col_name, '')).strip()
                 metadata[col_name] = step_content # Store even if empty for consistency
                 if step_content:
                     content_parts.append(f"Solution Step {i}: {step_content}")
                     valid_steps_found = True

            if not valid_steps_found:
                 logging.warning(f"Skipping row {index+2} for problem '{problem}': No valid solution steps found.")
                 skipped_count += 1
                 continue

            page_content = "\n".join(content_parts)
            documents.append(LangchainDocument(page_content=page_content, metadata=metadata))
            processed_count += 1

        if documents:
            logging.info(f"Successfully processed {processed_count} valid records into documents (skipped {skipped_count}).")
        else:
            logging.warning(f"No valid, processable records found in '{csv_file_name}' (skipped {skipped_count}).")
        return documents

    except pd.errors.ParserError as e:
        logging.error(f"Error parsing CSV: {e}", exc_info=True)
        return []
    except Exception as e:
        logging.error(f"An unexpected error occurred while loading CSV: {e}", exc_info=True)
        return []

def create_or_load_vectorstore(documents: Optional[List[LangchainDocument]], persist_directory: str, index_name: str) -> Optional[FAISS]:
    """Creates or loads the FAISS vector store."""
    if not GOOGLE_API_KEY:
         logging.error("Cannot create/load vector store: GOOGLE_API_KEY is missing.")
         return None

    try:
        embeddings = GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)
        index_path = os.path.join(persist_directory, f"{index_name}.faiss")

        if not os.path.exists(index_path):
            if not documents:
                 logging.error("No documents provided and no existing index found. Cannot create vector store.")
                 return None

            if not os.path.exists(persist_directory):
                try:
                    os.makedirs(persist_directory)
                    logging.info(f"Created directory: {persist_directory}")
                except OSError as e:
                    logging.error(f"Failed to create directory {persist_directory}: {e}", exc_info=True)
                    return None

            logging.info(f"Creating new FAISS vector store in '{persist_directory}'...")
            start_time = time.time()
            vs = FAISS.from_documents(documents, embeddings)
            vs.save_local(persist_directory, index_name)
            end_time = time.time()
            logging.info(f"FAISS index created and saved to '{persist_directory}' (took {end_time - start_time:.2f} seconds).")
            return vs
        else:
            logging.info(f"Loading existing FAISS vector store from '{persist_directory}'...")
            start_time = time.time()
            # Allow dangerous deserialization is often needed for FAISS with custom embeddings/objects
            vs = FAISS.load_local(persist_directory, embeddings, index_name, allow_dangerous_deserialization=True)
            end_time = time.time()
            logging.info(f"FAISS index loaded successfully (took {end_time - start_time:.2f} seconds).")
            return vs
    except Exception as e:
        logging.error(f"Error in create_or_load_vectorstore: {e}", exc_info=True)
        return None

def setup_llm_and_rag_chain(vs: FAISS) -> Tuple[Optional[BaseLanguageModel], Optional[ConversationalRetrievalChain]]:
    """Sets up the LLM and RAG conversational chain."""
    if not GOOGLE_API_KEY:
        logging.error("Cannot set up LLM/RAG chain: GOOGLE_API_KEY is missing.")
        return None, None
    if vs is None:
        logging.error("Vector store is None in setup_llm_and_rag_chain.")
        return None, None

    try:
        logging.info("Setting up LLM and RAG chain...")
        llm_instance = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            convert_system_message_to_human=True, # Important for conversational chains
            google_api_key=GOOGLE_API_KEY # Explicitly pass key if needed
            # Add safety settings if required for Gemini
        )
        logging.info(f"Initialized LLM: {LLM_MODEL}")

        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key='answer'
        )
        retriever = vs.as_retriever(
            search_type=RAG_SEARCH_TYPE,
            search_kwargs={"k": RAG_K}
        )

        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=llm_instance,
            retriever=retriever,
            memory=memory,
            return_source_documents=True,
            output_key='answer' # Ensure output key consistency
            # verbose=True # Enable for debugging langchain calls
        )
        logging.info("RAG Conversational Chain setup complete.")
        return llm_instance, qa_chain
    except Exception as e:
        logging.error(f"Failed to set up LLM or RAG chain: {e}", exc_info=True)
        if "API key" in str(e):
            logging.error("Please ensure your Google API Key (GOOGLE_API_KEY) is correctly set and valid.")
        return None, None

def load_problem_data_dict(data_dir: str, csv_file_name: str) -> Dict[str, Dict[str, str]]:
    """Load problems and solutions from CSV into a dictionary for quick lookup."""
    problem_lookup = {}
    file_path = os.path.join(data_dir, csv_file_name)
    if not os.path.exists(file_path):
        logging.warning(f"Problem data CSV not found at {file_path} for dictionary loading.")
        return {}

    try:
        logging.info(f"Loading problem data dictionary from: {file_path}")
        try:
            df = pd.read_csv(file_path, on_bad_lines='skip', dtype=str, keep_default_na=False)
        except TypeError:
            df = pd.read_csv(file_path, error_bad_lines=False, warn_bad_lines=True, dtype=str, keep_default_na=False)

        required_columns = ['problem', 'solution_step_1']
        if not all(col in df.columns for col in required_columns):
            logging.warning(f"CSV missing required columns ('problem', 'solution_step_1') for problem dictionary.")
            return {}

        loaded_count = 0
        for index, row in df.iterrows():
            problem_key = str(row.get('problem', '')).strip()
            if problem_key:
                problem_entry = {'possible_cause': str(row.get('possible_cause', '')).strip()}
                has_at_least_one_step = False
                for i in range(1, MAX_SOLUTION_STEPS + 1):
                    step_key = f'solution_step_{i}'
                    step_content = str(row.get(step_key, '')).strip()
                    problem_entry[step_key] = step_content
                    if step_content:
                        has_at_least_one_step = True

                if has_at_least_one_step:
                    problem_lookup[problem_key] = problem_entry
                    loaded_count += 1
                else:
                     logging.warning(f"Problem '{problem_key}' in CSV row {index+2} has no solution steps, excluding from interactive mode.")

        if problem_lookup:
            logging.info(f"Loaded {loaded_count} problems into dictionary for interactive mode.")
        else:
             logging.warning("No problems loaded for interactive mode dictionary. Check CSV content.")
        return problem_lookup
    except Exception as e:
        logging.error(f"Error loading problem data into dictionary: {e}", exc_info=True)
        return {}

# --- Intent Detection Helpers ---
def detect_problem(text: str, problems: Dict[str, Dict[str, str]]) -> Optional[str]:
    """Detects if the text likely refers to a known problem."""
    if not problems or not text: return None
    text_lower = text.lower().strip()

    # Check for exact match first (case-insensitive)
    for problem_key in problems:
        if problem_key.lower() == text_lower:
            return problem_key

    # Simple keyword/substring check (can be enhanced with fuzzy matching or embeddings)
    best_match = None
    max_overlap = 0 # Could be based on word count or ratio

    # Prefer substring containment if a significant part matches
    for problem_key in problems:
        if problem_key.lower() in text_lower:
             # Maybe add a length check - e.g., substring must be > N chars or % of problem_key
             if len(problem_key) > max_overlap: # Simple length heuristic
                  max_overlap = len(problem_key)
                  best_match = problem_key

    # Fallback to keyword overlap if substring not found
    if not best_match:
         text_keywords = set(re.findall(r'\b\w{3,}\b', text_lower)) # Words with 3+ chars
         if len(text_keywords) < 2: # Avoid matching on single common words
              return None
         for problem_key in problems:
             problem_keywords = set(re.findall(r'\b\w{3,}\b', problem_key.lower()))
             common_keywords = text_keywords.intersection(problem_keywords)
             # Require a minimum number or ratio of overlapping keywords
             if len(common_keywords) >= 2 and len(common_keywords) > max_overlap:
                  max_overlap = len(common_keywords)
                  best_match = problem_key

    if best_match:
         logging.info(f"Detected potential problem match: '{best_match}' for text: '{text}'")
    return best_match


def is_asking_for_help(text: str) -> bool:
    """Checks if the user seems to be asking for help or reporting a problem."""
    text_lower = text.lower()
    # Combined and slightly refined patterns
    help_patterns = [
        r'how\s+(to|do\s+i)\s+(fix|solve|repair|troubleshoot)',
        r'\b(fix|solve|repair|troubleshoot|diagnose)\b',
        r'\b(issue|problem|error|fault|failure)\s+with\b',
        r'is\s+(not\s+working|failing|broken|down|acting\s+up)',
        r'\b(help|assist|advice|guidance)\s+(me\s+)?(with|on)?\b',
        r'what\s+to\s+do\s+(about|if|when)',
        r'can\s+you\s+help'
    ]
    return any(re.search(pattern, text_lower) for pattern in help_patterns)

def is_problem_solved(text: str) -> bool:
    """Checks if the user indicates the problem is solved."""
    text_lower = text.lower().strip()
    solved_patterns = [
        r'\b(solved|fixed|resolved|ok|okay|worked|working)\b',
        r'\bit\s+works\b', r'\bproblem\s+(is\s+)?gone\b', r'\tissue\s+fixed\b',
        r'\bthat\s+(did|fixed)\s+(it|the\s+trick)\b',
        r'^(yes|yeah|yep|affirmative)\b',
        r'(great|perfect|excellent|awesome|thanks|thank\s+you).*\b(it|that)\s+worked',
        r'all\s+good\s+now', r'running\s+smoothly',
    ]
    negation_patterns = [r'\b(no(t)?|didn\'?t|doesn\'?t|hasn\'?t|haven\'?t|isn\'?t|aren\'t|can\'?t|couldn\'?t|still|yet)\b']

    # Check for explicit negation first
    if any(re.search(p, text_lower) for p in negation_patterns):
        # Handle cases like "no, it's not solved" or "not yet"
        # Be careful with simple "no" - could be answering a different question.
        # If text is just "no", it might mean "not solved" in context.
        if text_lower in ["no", "nope"]:
            return False # Assume "no" means "not solved" in this context
        # Check if a solved word is ALSO present despite negation (e.g., "it didn't seem to work, but now it is working") - rare case
        if not any(re.search(sp, text_lower) for sp in solved_patterns):
            return False

    # If no negation detected (or negation overridden), check for solved patterns
    if any(re.search(p, text_lower) for p in solved_patterns):
        return True

    # Handle simple affirmations/thanks *if* the context is right (last msg was a step suggestion)
    # This context check needs to happen in the main logic, not here.
    # If text_lower in ["thanks", "thank you", "ok", "okay", "got it"]: return True (conditionally)

    return False

def is_problem_not_solved(text: str) -> bool:
    """Checks if the user indicates the problem persists."""
    text_lower = text.lower().strip()
    not_solved_patterns = [
        r'\bnot\s+(solved|fixed|working|resolved|helping)\b',
        r'\b(didn\'?t|doesn\'?t|did\s+not|does\s+not)\s+(work|help|fix|solve|change)\b',
        r'\bno\s+(change|effect|luck|joy|difference)\b',
        r'\bstill\s+(have|having|seeing)\s+(the\s+|an\s+)?(problem|issue|error)\b',
        r'\b(same|persistent)\s+(problem|issue)\b',
        r'^(no|nope|negative)\b',
        r'didn\'?t\s+(do\s+)?(anything|it)',
        r'that\s+wasn\'?t\s+it',
    ]
    # Avoid matching "is not working" if "is working" is also present (e.g. "it was not working, but now it is")
    if is_problem_solved(text_lower): # Reuse the solved check
         return False

    return any(re.search(pattern, text_lower) for pattern in not_solved_patterns)

def get_next_solution_step(problem_name: str, current_step_index: int) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """Gets the next valid solution step text, its new index (1-based), and the possible cause."""
    problem_data = problem_dict.get(problem_name)
    if not problem_data:
        logging.warning(f"Tried to get next step for unknown problem: {problem_name}")
        return None, None, None

    cause = problem_data.get('possible_cause', 'N/A')
    next_step_index = current_step_index + 1

    while next_step_index <= MAX_SOLUTION_STEPS:
        step_key = f'solution_step_{next_step_index}'
        step_text = problem_data.get(step_key, '').strip()
        if step_text:
            logging.info(f"Providing step {next_step_index} for problem '{problem_name}'")
            return next_step_index, step_text, cause
        next_step_index += 1

    logging.info(f"No more solution steps found for problem '{problem_name}' after step {current_step_index}.")
    return None, None, cause # No more valid steps

# --- RAG & Web Search Helpers ---

def check_rag_relevance(source_documents: List[LangchainDocument], query: str) -> bool:
    """Checks if the retrieved documents seem relevant to the query."""
    if not source_documents:
        logging.info("RAG relevance check: No documents retrieved.")
        return False

    query_lower = query.lower()
    # Extract potential keywords (simple approach)
    query_keywords = set(re.findall(r'\b\w{3,}\b', query_lower)) # Words of 3+ chars
    if not query_keywords:
        logging.info("RAG relevance check: No usable keywords in query.")
        return True # Cannot determine relevance, assume potentially relevant

    relevant_docs_count = 0
    min_keyword_overlap = 2 # Require at least 2 keywords to match

    for doc in source_documents:
        doc_text_lower = doc.page_content.lower()
        doc_keywords = set(re.findall(r'\b\w{3,}\b', doc_text_lower))

        # Check 1: Keyword Overlap
        overlap = len(query_keywords.intersection(doc_keywords))
        if overlap >= min_keyword_overlap:
            relevant_docs_count += 1
            continue # Counted as relevant

        # Check 2: Check if problem from metadata matches query context (if available)
        doc_problem = doc.metadata.get('problem', '').lower()
        if doc_problem and doc_problem in query_lower:
             relevant_docs_count += 1
             continue

    is_relevant = relevant_docs_count > 0
    logging.info(f"RAG relevance check: Found {relevant_docs_count}/{len(source_documents)} potentially relevant documents based on query '{query}'. Result: {'Relevant' if is_relevant else 'Not Relevant'}")
    return is_relevant

def format_web_results_for_llm(search_results: List[Dict[str, Any]], max_chars: int = WEB_SEARCH_RESULT_MAX_CHARS) -> str:
    """Formats Tavily results into a string for the LLM prompt, respecting character limits."""
    if not search_results:
        return "No web search results found."

    formatted = []
    total_chars = 0
    separator = "\n\n---\n\n"
    sep_len = len(separator)

    for i, res in enumerate(search_results):
        title = res.get('title', 'N/A')
        url = res.get('url', 'N/A')
        content = res.get('content', '').strip()

        entry = f"Result {i+1}:\nSource: {url}\nTitle: {title}\nContent: {content}"
        entry_len = len(entry)

        if total_chars == 0: # First item
             if entry_len <= max_chars:
                  formatted.append(entry)
                  total_chars += entry_len
             else: # First item is too long, truncate content
                  available_chars = max_chars - len(f"Result {i+1}:\nSource: {url}\nTitle: {title}\nContent: ")
                  truncated_content = content[:available_chars] + "..." if available_chars > 3 else ""
                  formatted.append(f"Result {i+1}:\nSource: {url}\nTitle: {title}\nContent: {truncated_content}")
                  total_chars = max_chars # Stop adding more
                  break
        else: # Subsequent items
             if total_chars + sep_len + entry_len <= max_chars:
                  formatted.append(entry)
                  total_chars += sep_len + entry_len
             else:
                  # Try adding just title/URL if content makes it too long
                  short_entry = f"Result {i+1}:\nSource: {url}\nTitle: {title}"
                  short_len = len(short_entry)
                  if total_chars + sep_len + short_len <= max_chars:
                      formatted.append(short_entry)
                      total_chars += sep_len + short_len
                  # Stop adding results if limit reached even with short entry
                  break

    return separator.join(formatted)


# --- RAG Chain Invocation ---
async def invoke_rag_chain(chain: ConversationalRetrievalChain, prompt: str, history: List[Message]) -> Dict[str, Any]:
    """Invokes the RAG chain asynchronously if possible, handling Langchain's sync/async."""
    # Convert Pydantic Message models to Langchain's BaseMessage if needed by memory
    # Note: ConversationalRetrievalChain's default memory usually handles dicts ok,
    # but explicit conversion can be safer. Let's assume it works for now.
    chat_history_tuples = [(msg.role, msg.content) for msg in history]

    # Prepare the input, adding context/persona guidance
    # IMPORTANT: Gemini models work better with explicit role turns (user/model)
    # ConversationalRetrievalChain might handle this, but direct guidance helps.
    contextual_prompt = f"""You are an expert Ship Maintenance AI Assistant.
                Use the retrieved internal documents to answer the user's question accurately and concisely.
                If the documents don't contain the answer, state that clearly.
                Prioritize safety procedures and standard operating protocols mentioned in the documents.

                User Question: {prompt}
                """
    # Use ainvoke if available and working, otherwise fallback to sync invoke in thread
    # Note: ConversationalRetrievalChain might not fully support ainvoke depending on components
    try:
        # Check if the chain instance itself has a working `ainvoke`
        # This is a bit of a heuristic; proper check might involve inspecting the chain type
        if hasattr(chain, 'ainvoke'):
             logging.debug("Attempting ainvoke on RAG chain")
             response = await chain.ainvoke({
                 "question": contextual_prompt,
                 # History format might depend on memory type. Check chain/memory docs.
                 # Let's try passing our simple history list, maybe the memory adapts.
                 "chat_history": history # Pass the list of Message objects directly
             })
             logging.debug("ainvoke successful")
             return response
        else:
             raise AttributeError("Chain does not have ainvoke") # Force fallback

    except (NotImplementedError, AttributeError, Exception) as e:
        logging.warning(f"ainvoke failed or not implemented for RAG chain ({type(e).__name__}: {e}), falling back to sync invoke.")
        import asyncio
        # Run the synchronous chain.invoke in a separate thread
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None, # Use default thread pool executor
            chain.invoke,
            {
                "question": contextual_prompt,
                 "chat_history": history # Pass the list of Message objects directly
            }
        )
        return response

async def perform_web_search_and_synthesis(query: str) -> Tuple[str, str]:
    """Performs web search via Tavily and synthesizes an answer using the LLM,
       specifically tailored for ship maintenance context."""
    logging.info(f"Initiating web search and synthesis for query: '{query}'") # Log start

    if not tavily_tool:
        logging.warning("Web search requested but Tavily tool is not available.")
        return "Web search is currently disabled.", "Web Search Disabled"
    if not llm:
        logging.error("LLM not available for web search synthesis.")
        return "Sorry, the AI model is not available to process web search results.", "Error"

    try:
        # 1. Perform Tavily Search
        logging.info(f"Performing Tavily web search for: '{query}'")
        import asyncio
        loop = asyncio.get_running_loop()
        search_results = await loop.run_in_executor(
            None,
            tavily_tool.invoke,
            {"query": query}
        )
        logging.info(f"Tavily search returned {len(search_results)} results.")
        if not search_results:
            logging.warning("Tavily search returned no results.")
            return "I searched the web, but couldn't find any relevant results for your query.", "Web Search No Results"

        formatted_results = format_web_results_for_llm(search_results)
        logging.info(f"Formatted web search results length: {len(formatted_results)}")

        # 2. Create Enhanced Synthesis Prompt (ensure this is the detailed ship-specific one)
        synthesis_prompt = f"""You are an expert AI Assistant specializing **exclusively in Ship Maintenance and Troubleshooting**.
        A user asked the following question related to a ship system:
        "{query}"
        An initial search of the internal knowledge base did not provide a sufficiently specific or actionable answer.
        Your task is to analyze the following web search results and synthesize a *concise, actionable, and relevant* answer **specifically for a maritime/ship context**.
        **Instructions for Synthesis:**
        1.  **Filter Relevance:** Discard any information clearly not applicable to ships, marine environments, or industrial equipment typically found on vessels. Focus on results mentioning specific ship components, marine standards, or common maritime issues.
        2.  **Extract Actions:** Identify potential diagnostic steps, repair procedures, or safety precautions relevant to the user's query. If steps are found, list them clearly (e.g., using numbered points). **Select the most credible and actionable solution path if multiple options exist.**
        3.  **Synthesize, Don't List:** Do not just list snippets from the search results. Combine the relevant information into a coherent response.
        4.  **Prioritize Safety:** If the query involves potentially hazardous systems (electrical, hydraulic, fuel, high pressure), emphasize safety precautions mentioned in the results or add standard warnings (e.g., "Ensure the system is de-energized/depressurized before work," "Follow lock-out/tag-out procedures").
        5.  **Acknowledge Source:** Begin your response by clearly stating that the information is based on external web search results (e.g., "Based on information gathered from web sources related to ship systems...").
        6.  **Advise Caution:** Conclude by advising the user to consult the official ship/equipment manuals or a qualified marine engineer/technician, especially if the problem persists or the task is complex.
        7.  **Be Concise:** Provide the necessary information without unnecessary jargon or lengthy explanations, unless explaining a critical concept.
        --- WEB SEARCH RESULTS ---
        {formatted_results}
        --- END WEB SEARCH RESULTS ---
        Synthesized Answer (following all instructions above) for the ship maintenance query "{query}":
        """
        logging.debug(f"Synthesis prompt generated (first 300 chars): {synthesis_prompt[:300]}...") # Log prompt start

        # 3. Call the LLM directly for Synthesis
        logging.info("Synthesizing ship-specific answer from web search results using LLM...")
        # Use a timeout if possible/needed (depends on underlying library)
        # enhanced_answer_response = await asyncio.wait_for(llm.ainvoke(synthesis_prompt), timeout=60.0) # Example timeout
        enhanced_answer_response = await llm.ainvoke(synthesis_prompt)

        # Handle potential variations in response structure (e.g., Gemini)
        final_answer = ""
        if hasattr(enhanced_answer_response, 'content'):
            final_answer = enhanced_answer_response.content.strip()
            logging.info("LLM synthesis successful (used .content attribute).")
        elif isinstance(enhanced_answer_response, str):
            final_answer = enhanced_answer_response.strip()
            logging.info("LLM synthesis successful (response was string).")
        else:
            logging.warning(f"Unexpected LLM response structure for synthesis: {type(enhanced_answer_response)}. Attempting string conversion.")
            try:
                final_answer = str(enhanced_answer_response).strip()
            except Exception as str_conv_err:
                logging.error(f"Could not convert LLM response to string: {str_conv_err}")
                final_answer = "" # Ensure it's empty if conversion fails

        if not final_answer:
             logging.warning("LLM synthesis resulted in an empty answer.")
             # Decide if empty answer means failure or just no synthesis possible
             return "I processed the web search results, but could not synthesize a specific answer based on them.", "Web Search Synthesis Failed (Empty)"

        logging.info(f"Successfully synthesized ship-specific answer from web search (Length: {len(final_answer)}).")
        return final_answer, "Web Search Synthesis (Ship Focused)"

    # More specific exception handling if possible
    except ImportError as e:
         logging.error(f"ImportError during web search/synthesis (check dependencies like tavily-python): {e}", exc_info=True)
         return f"An internal setup error occurred (ImportError).", "Error"
    except Exception as e:
        # Log the specific exception
        logging.error(f"Error during web search or synthesis execution: {type(e).__name__} - {e}", exc_info=True)
        # Check for common API key errors (customize based on actual error messages)
        if "api key" in str(e).lower():
             error_msg = "There seems to be an issue with the API key required for web search or processing."
        else:
             error_msg = f"Sorry, I encountered an error ({type(e).__name__}) while trying to search the web or process the results for ship information."
        return error_msg, "Error"

    text_lower = answer_text.lower()

    # Patterns indicating lack of specific information or uncertainty
    insufficient_patterns = [
        r"couldn't find specific details",
        r"do not have specific information",
        r"information is not available",
        r"based on the provided documents?.?.? i can't",
        r"unable to provide specific steps",
        r"no mention of",
        r"documents? don't cover",
        r"general information",
        r"i can only provide general advice",
        r"it might be", # Sometimes used when uncertain
        r"possible causes could include", # Okay if followed by specifics, bad if that's all
        r"recommend consulting the manual", # Good advice, but often means the KB lacked specifics
        r"refer to standard procedures", # Similar to above
        r"i cannot answer",
    ]

    # Patterns indicating potential sufficiency (less reliable, use cautiously)
    # sufficient_patterns = [
    #     r"step \d+:", r"solution is to", r"you should", r"perform the following",
    #     r"check the", r"replace the", r"inspect the",
    # ]

    for pattern in insufficient_patterns:
        if re.search(pattern, text_lower):
            logging.warning(f"RAG sufficiency check: Found insufficiency pattern '{pattern}'. Triggering fallback.")
            return False

    # Optional: Check for absence of action verbs if needed, but can be complex

    logging.info("RAG sufficiency check: Answer seems sufficiently specific.")
    return True

# --- RAG Answer Sufficiency Check ---
def is_rag_answer_sufficient(answer_text: str) -> bool:
    """
    Analyzes the RAG answer text to determine if it's likely sufficient or too vague.
    Returns True if likely sufficient, False otherwise (triggering fallback).
    """
    if not answer_text:
        logging.warning("RAG sufficiency check: Answer is None or empty.")
        return False

    MIN_SUFFICIENT_LENGTH = 50 # Adjust sensitivity as needed
    if len(answer_text) < MIN_SUFFICIENT_LENGTH:
        logging.warning(f"RAG sufficiency check: Answer is too short (length {len(answer_text)} < {MIN_SUFFICIENT_LENGTH}).")
        # Allow specific "I don't know" short answers to be caught by patterns below
        # return False # Commented out to allow pattern matching on short denials

    text_lower = answer_text.lower()

    # Patterns indicating lack of specific information or uncertainty
    insufficient_patterns = [
        # Existing patterns
        r"couldn't find specific details", r"could not find information", r"do not have specific information",
        r"information is not available", r"based on the provided documents?.?.? i can't",
        r"unable to provide specific steps", r"no mention of", r"documents? don't cover",
        r"general information", r"i can only provide general advice",
        r"it might be", r"possible causes could include", # Often okay if followed by specifics, bad if just this
        r"recommend consulting the manual", r"refer to standard procedures",
        r"i cannot answer", r"don't have enough information", r"therefore,? i don't know",

        # Added patterns from your update
        r"i am sorry,? but the provided documents?",
        r"documents? provided do not contain information",
        r"based on the information i have",
        r"i don't have access to information about that",
        r"my knowledge base doesn't include details on",
        r"unable to find relevant information in the context",
        r"the context provided does not answer",
        r"the retrieved documents? seem unrelated",
        r"i lack the specific data",
    ]

    for pattern in insufficient_patterns:
        if re.search(pattern, text_lower):
            logging.warning(f"RAG sufficiency check: Found insufficiency pattern '{pattern}'. Triggering fallback.")
            return False # Trigger fallback

    # If no insufficient patterns found and length check passed (or was ignored for short denials)
    logging.info("RAG sufficiency check: Answer seems sufficiently specific.")
    return True

# --- Helper to delete the knowledge base ---
def delete_vectorstore_directory(persist_directory: str) -> Tuple[bool, str]:
     """Deletes the specified vector store directory. Guarantees returning a tuple."""
     logging.info(f"Attempting to delete vector store directory: {persist_directory}")
     if not isinstance(persist_directory, str) or not persist_directory:
         logging.error("Invalid persist_directory provided (must be non-empty string).")
         return False, "Internal configuration error: Invalid directory path provided."

     if os.path.exists(persist_directory):
         try:
             logging.info(f"Directory '{persist_directory}' exists. Calling shutil.rmtree...")
             shutil.rmtree(persist_directory)
             # Double-check deletion (optional, might fail on slow filesystems/network drives)
             # time.sleep(0.1) # Small delay
             # if os.path.exists(persist_directory):
             #    logging.warning(f"shutil.rmtree completed but directory '{persist_directory}' still exists.")
             #    return False, "Deletion command executed but directory may still exist (check permissions/locks)."

             logging.info(f"Successfully deleted directory: {persist_directory}")
             return True, f"Knowledge base directory '{persist_directory}' deleted successfully."

         except PermissionError as pe:
             logging.error(f"PermissionError deleting directory {persist_directory}: {pe}", exc_info=True)
             return False, f"Permission denied when trying to delete knowledge base: {pe}"
         except OSError as oe:
             logging.error(f"OSError deleting directory {persist_directory}: {oe}", exc_info=True)
             return False, f"OS error deleting knowledge base (perhaps directory is in use or path invalid?): {oe}"
         except Exception as e: # Catch any other unexpected error during deletion
             logging.error(f"Unexpected error during shutil.rmtree for {persist_directory}: {e}", exc_info=True)
             return False, f"Unexpected error during knowledge base deletion: {e}"
     else:
         logging.info(f"Directory '{persist_directory}' not found, cannot delete.")
         return False, f"Knowledge base directory '{persist_directory}' not found."