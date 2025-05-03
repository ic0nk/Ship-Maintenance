import { NextResponse } from "next/server"
import { API_CONFIG, API_KEYS, validateApiKeys } from "@/lib/config"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    console.log("Health check endpoint called")
    console.log("API Keys in health check:", {
      GOOGLE_API_KEY: API_KEYS.GOOGLE_API_KEY ? "Set" : "Not set",
      TAVILY_API_KEY: API_KEYS.TAVILY_API_KEY ? "Set" : "Not set",
    })

    // Check if the uploads directory exists and is writable
    const uploadDir = path.join(process.cwd(), "uploads")

    let directoryStatus = "ok"
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      // Test write permissions by creating a temporary file
      const testFile = path.join(uploadDir, `.test-${Date.now()}`)
      fs.writeFileSync(testFile, "test")
      fs.unlinkSync(testFile)
    } catch (error) {
      directoryStatus = "error"
      console.error("Upload directory issue:", error)
    }

    // Check if the AI service is available
    let aiStatus = "unknown"
    let apiKeysValid = false
    let apiKeysResponse = { google_api_key_available: false, tavily_api_key_available: false }

    try {
      // Add API keys to headers
      const headers: HeadersInit = {
        "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY || "",
        "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      }

      console.log(`Attempting to connect to AI service at: ${API_CONFIG.AI_SERVICE_URL}/health`)

      // Use AbortController to add a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        const aiResponse = await fetch(`${API_CONFIG.AI_SERVICE_URL}/health`, {
          headers,
          signal: controller.signal,
          cache: "no-store", // Prevent caching
        })

        clearTimeout(timeoutId)

        if (aiResponse.ok) {
          const data = await aiResponse.json()
          console.log("AI service health check response:", data)
          aiStatus = "healthy"

          // Extract API key status from response
          if (data.api_keys) {
            apiKeysResponse = data.api_keys
            apiKeysValid = data.api_keys.google_api_key_available && data.api_keys.tavily_api_key_available
          }
        } else {
          console.warn(`AI service returned status: ${aiResponse.status}`)
          aiStatus = "unhealthy"
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.warn(`AI service connection error: ${error instanceof Error ? error.message : String(error)}`)
        aiStatus = "unhealthy"
      }
    } catch (error) {
      aiStatus = "unhealthy"
      console.warn(`AI service health check failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Validate API keys
    const { valid: localApiKeysValid, missing: missingApiKeys } = validateApiKeys()

    // If backend reports API keys as valid, use that instead of our local check
    const finalApiKeysValid = apiKeysValid || localApiKeysValid
    const finalMissingKeys = apiKeysValid ? [] : missingApiKeys

    return NextResponse.json({
      status: "healthy",
      services: {
        fileStorage: directoryStatus,
        aiService: aiStatus,
      },
      apiKeys: {
        valid: finalApiKeysValid,
        missing: finalMissingKeys,
      },
      api_keys: apiKeysResponse, // Include the raw response from the backend
      environment: {
        aiApiConfigured: !!API_CONFIG.AI_SERVICE_URL,
        googleApiConfigured: !!API_KEYS.GOOGLE_API_KEY,
        tavilyApiConfigured: !!API_KEYS.TAVILY_API_KEY,
      },
    })
  } catch (error) {
    console.error(`Health check error: ${error instanceof Error ? error.message : String(error)}`)
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "System health check failed",
      },
      { status: 500 },
    )
  }
}
