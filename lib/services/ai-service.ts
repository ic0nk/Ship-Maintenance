export interface Message {
  role: "user" | "assistant"
  content: string
}

export interface TroubleshootingState {
  is_active: boolean
  current_problem: string | null
  current_step: number
}

export interface ChatRequest {
  prompt: string
  history: Message[]
  troubleshooting_state: TroubleshootingState
  force_web_search: boolean
}

export interface ChatResponse {
  answer: string
  history: Message[]
  troubleshooting_state: TroubleshootingState
  offer_web_search: boolean
  final_answer_source: string
}

export interface StatusResponse {
  status: string
  kb_loaded: boolean
  web_search_enabled: boolean
  message?: string
}

export interface SimpleResponse {
  success: boolean
  message: string
}

// Default troubleshooting state
export const defaultTroubleshootingState: TroubleshootingState = {
  is_active: false,
  current_problem: null,
  current_step: 0,
}

// Update the API endpoints to use our proxy
export async function checkAiStatus(): Promise<StatusResponse> {
  try {
    console.log("Checking AI backend status")
    const response = await fetch(`/api/ai-proxy?endpoint=status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`AI status check failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      return {
        status: "Error",
        kb_loaded: false,
        web_search_enabled: false,
        message: `Failed to connect to AI service: ${response.status} ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log("AI status response:", data)
    return data
  } catch (error) {
    console.error("Error checking AI status:", error)
    return {
      status: "Error",
      kb_loaded: false,
      web_search_enabled: false,
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function sendChatMessage(
  prompt: string,
  history: Message[],
  troubleshootingState: TroubleshootingState = defaultTroubleshootingState,
  forceWebSearch = false,
): Promise<ChatResponse> {
  try {
    console.log("Sending chat message:", { prompt, history, troubleshootingState, forceWebSearch })

    const request: ChatRequest = {
      prompt,
      history,
      troubleshooting_state: troubleshootingState,
      force_web_search: forceWebSearch,
    }

    const response = await fetch(`/api/ai-proxy?endpoint=chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      console.error(`Chat request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      let errorMessage = "Failed to get AI response"
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail || errorData.error || errorMessage
      } catch (e) {
        // Use default error message if parsing fails
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("AI chat response:", data)

    // Ensure the response has the expected structure
    if (!data.answer) {
      console.error("Invalid response format:", data)
      throw new Error("Invalid response format from AI service")
    }

    return {
      answer: data.answer,
      history: data.history || [
        ...history,
        { role: "user", content: prompt },
        { role: "assistant", content: data.answer },
      ],
      troubleshooting_state: data.troubleshooting_state || defaultTroubleshootingState,
      offer_web_search: data.offer_web_search || false,
      final_answer_source: data.final_answer_source || "Unknown",
    }
  } catch (error) {
    console.error("Error sending chat message:", error)
    throw error
  }
}

export async function loadKnowledgeBase(): Promise<SimpleResponse> {
  try {
    console.log("Loading knowledge base")
    const response = await fetch(`/api/ai-proxy?endpoint=load_kb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      console.error(`Load KB request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      // Try to parse the error response for more details
      let errorMessage = `Failed to load knowledge base: ${response.status} ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.detail) {
          errorMessage = `Backend error: ${errorData.detail}`
        } else if (errorData.error) {
          errorMessage = `Backend error: ${errorData.error}`
        }
      } catch (e) {
        // If parsing fails, use the raw error text if it's not too long
        if (errorText && errorText.length < 200) {
          errorMessage += ` - ${errorText}`
        }
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    const data = await response.json()
    console.log("Load KB response:", data)
    return data
  } catch (error) {
    console.error("Error loading knowledge base:", error)
    return {
      success: false,
      message: `Error loading knowledge base: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function deleteKnowledgeBase(): Promise<SimpleResponse> {
  try {
    console.log("Deleting knowledge base")
    const response = await fetch(`/api/ai-proxy?endpoint=delete_kb`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Delete KB request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      // Try to parse the error response for more details
      let errorMessage = `Failed to delete knowledge base: ${response.status} ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.detail) {
          errorMessage = `Backend error: ${errorData.detail}`
        } else if (errorData.error) {
          errorMessage = `Backend error: ${errorData.error}`
        }
      } catch (e) {
        // If parsing fails, use the raw error text if it's not too long
        if (errorText && errorText.length < 200) {
          errorMessage += ` - ${errorText}`
        }
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    const data = await response.json()
    console.log("Delete KB response:", data)
    return data
  } catch (error) {
    console.error("Error deleting knowledge base:", error)
    return {
      success: false,
      message: `Error deleting knowledge base: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
