/**
 * Utility functions for interacting with the AI service
 */
import { API_CONFIG, validateApiKeys } from "@/lib/config"

// Check if the AI service is available
export async function checkAiServiceHealth(): Promise<{
  healthy: boolean
  apiKeysValid: boolean
  missingKeys: string[]
}> {
  try {
    console.log("Checking AI service health")

    // Check API keys first
    const { valid, missing } = validateApiKeys()
    console.log("API keys validation:", { valid, missing })

    // Try to connect to the health endpoint with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    console.log(`Checking AI service health at: ${API_CONFIG.HEALTH_ENDPOINT}`)

    try {
      const response = await fetch(API_CONFIG.HEALTH_ENDPOINT, {
        signal: controller.signal,
        cache: "no-store", // Prevent caching
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`AI service health check returned status: ${response.status}`)
        return {
          healthy: false,
          apiKeysValid: valid,
          missingKeys: missing,
        }
      }

      const data = await response.json()
      console.log("AI service health check response:", data)

      // Check if the API keys are valid according to the backend
      const backendApiKeysValid =
        data.apiKeys?.valid === true ||
        (data.api_keys?.google_api_key_available === true && data.api_keys?.tavily_api_key_available === true)

      // If backend reports API keys as valid, override our local check
      const finalApiKeysValid = backendApiKeysValid || valid
      const finalMissingKeys = backendApiKeysValid ? [] : missing

      console.log("Final API status:", {
        healthy: data.services?.aiService === "healthy" || data.status === "healthy",
        apiKeysValid: finalApiKeysValid,
        missingKeys: finalMissingKeys,
      })

      return {
        healthy: data.services?.aiService === "healthy" || data.status === "healthy",
        apiKeysValid: finalApiKeysValid,
        missingKeys: finalMissingKeys,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.warn(`AI service health check fetch error: ${error instanceof Error ? error.message : String(error)}`)
      return {
        healthy: false,
        apiKeysValid: valid,
        missingKeys: missing,
      }
    }
  } catch (error) {
    console.warn(`Error in checkAiServiceHealth: ${error instanceof Error ? error.message : String(error)}`)
    // Return keys status even if service check fails
    const { valid, missing } = validateApiKeys()
    return {
      healthy: false,
      apiKeysValid: valid,
      missingKeys: missing,
    }
  }
}

// Reset the AI conversation
export async function resetAiConversation(): Promise<boolean> {
  try {
    console.log("Resetting AI conversation")
    const response = await fetch(API_CONFIG.AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "reset",
      }),
    })

    if (!response.ok) {
      console.error(`Failed to reset conversation: ${response.status} ${response.statusText}`)
      return false
    }

    const data = await response.json()
    console.log("Reset conversation response:", data)
    return true
  } catch (error) {
    console.error(`Error resetting AI conversation: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// Send a message to the AI service
export async function sendMessageToAi(
  message: string,
  options?: {
    useAdvancedSearch?: boolean
    documentIds?: string[]
  },
): Promise<any> {
  try {
    console.log("Sending message to AI:", message, options)

    const requestBody = {
      action: "troubleshoot",
      message,
      options: {
        useAdvancedSearch: options?.useAdvancedSearch ?? true,
        documentIds: options?.documentIds || [],
      },
    }

    console.log("Request body:", JSON.stringify(requestBody))

    const response = await fetch(API_CONFIG.AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("AI response status:", response.status, response.statusText)

    if (!response.ok) {
      console.error(`Failed to get AI response: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)
      throw new Error(`Failed to get AI response: ${response.status} ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log("Raw AI response text:", responseText)

    let data
    try {
      data = JSON.parse(responseText)
      console.log("Parsed AI response data:", data)
    } catch (e) {
      console.error("Error parsing AI response JSON:", e)
      throw new Error("Failed to parse AI response")
    }

    // If the response doesn't have the expected format, create a fallback response
    if (!data.response && !data.error) {
      console.warn("AI response missing expected 'response' field, creating fallback")
      return {
        response: "I received your message but couldn't generate a proper response. Please try again.",
        is_solved: false,
      }
    }

    return data
  } catch (error) {
    console.error(`Error sending message to AI: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

// Perform an advanced search using Tavily
export async function performAdvancedSearch(query: string): Promise<any> {
  try {
    console.log("Performing advanced search:", query)

    const response = await fetch(API_CONFIG.AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "search",
        query,
      }),
    })

    console.log("Search response status:", response.status, response.statusText)

    if (!response.ok) {
      console.error(`Failed to perform advanced search: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)
      throw new Error(`Failed to perform advanced search: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Search response data:", data)
    return data
  } catch (error) {
    console.error(`Error performing advanced search: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}
