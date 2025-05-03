import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG, API_KEYS } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("AI API route received request:", body)

    // Determine which endpoint to use
    let endpoint = "troubleshoot"
    if (body.action === "reset") {
      endpoint = "reset"
    } else if (body.action === "search") {
      endpoint = "search"
    }

    // Create headers with API keys
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY || "",
      "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY || "",
    }

    console.log(`Forwarding request to ${API_CONFIG.AI_SERVICE_URL}/${endpoint}`)
    console.log("Request headers:", {
      "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY ? "Set" : "Not set",
      "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY ? "Set" : "Not set",
    })

    // Use AbortController to add a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for AI operations

    try {
      // Prepare the request body based on the action
      let requestBody: any = {}

      if (body.action === "reset") {
        requestBody = {}
      } else if (body.action === "search") {
        requestBody = { query: body.query }
      } else {
        requestBody = {
          query: body.message,
          options: body.options || {},
        }
      }

      console.log("Request body to backend:", JSON.stringify(requestBody))

      // Forward the request to the appropriate FastAPI endpoint
      const response = await fetch(`${API_CONFIG.AI_SERVICE_URL}/${endpoint}`, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      })

      clearTimeout(timeoutId)
      console.log(`Backend response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Backend error response: ${errorText}`)

        try {
          const errorData = JSON.parse(errorText)
          return NextResponse.json(
            { error: errorData.detail || "Failed to process request" },
            { status: response.status },
          )
        } catch (e) {
          return NextResponse.json(
            { error: `Failed to process request: ${response.status} ${response.statusText}` },
            { status: response.status },
          )
        }
      }

      const responseText = await response.text()
      console.log("Backend response text:", responseText)

      try {
        // Make sure we have valid JSON before parsing
        if (!responseText || responseText.trim() === "") {
          console.error("Empty response from backend")
          return NextResponse.json({ error: "Empty response from backend" }, { status: 500 })
        }

        const data = JSON.parse(responseText)
        console.log("Parsed backend response:", data)

        // Ensure the response has the expected format
        if (endpoint === "troubleshoot" && !data.response) {
          console.error("Backend response missing 'response' field:", data)
          return NextResponse.json({
            response: "I received your message but couldn't generate a proper response. Please try again.",
            is_solved: false,
          })
        }

        return NextResponse.json(data)
      } catch (e) {
        console.error("Error parsing JSON response:", e)
        return NextResponse.json(
          {
            error: "Failed to parse backend response",
            rawResponse: responseText.substring(0, 500), // Include part of the raw response for debugging
          },
          { status: 500 },
        )
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`Error in AI API route fetch: ${error instanceof Error ? error.message : String(error)}`)

      const errorMessage =
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out"
          : `Failed to connect to AI service: ${error instanceof Error ? error.message : String(error)}`

      return NextResponse.json({ error: errorMessage }, { status: 503 })
    }
  } catch (error) {
    console.error(`Error in AI API route: ${error instanceof Error ? error.message : String(error)}`)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    console.log("AI API GET route called")

    // Add API keys to headers
    const headers: HeadersInit = {
      "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY || "",
      "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY || "",
    }

    console.log("Request headers:", {
      "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY ? "Set" : "Not set",
      "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY ? "Set" : "Not set",
    })

    // Use AbortController to add a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(`${API_CONFIG.AI_SERVICE_URL}/health`, {
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`Backend health check status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Backend health check error: ${errorText}`)
        return NextResponse.json({ status: "unhealthy" }, { status: response.status })
      }

      const responseText = await response.text()
      console.log("Backend health check response:", responseText)

      try {
        const data = JSON.parse(responseText)
        console.log("Parsed health check response:", data)
        return NextResponse.json(data)
      } catch (e) {
        console.error("Error parsing JSON health check response:", e)
        return NextResponse.json(
          {
            status: "unhealthy",
            error: "Failed to parse backend response",
            rawResponse: responseText.substring(0, 500), // Include part of the raw response for debugging
          },
          { status: 500 },
        )
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`Error checking AI health: ${error instanceof Error ? error.message : String(error)}`)

      const errorMessage =
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out"
          : `Failed to connect to AI service: ${error instanceof Error ? error.message : String(error)}`

      return NextResponse.json(
        {
          status: "unhealthy",
          error: errorMessage,
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error(`Error in AI health check: ${error instanceof Error ? error.message : String(error)}`)
    return NextResponse.json(
      {
        status: "unhealthy",
        error: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
