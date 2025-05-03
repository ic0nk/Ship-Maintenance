import { type NextRequest, NextResponse } from "next/server"

// Get the AI service URL from environment variables
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000"

// This is a simple proxy to forward requests to the FastAPI backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const endpoint = request.nextUrl.searchParams.get("endpoint") || "chat"

    console.log(`Proxying request to ${AI_SERVICE_URL}/${endpoint}`)
    console.log("Request body:", JSON.stringify(body))

    const response = await fetch(`${AI_SERVICE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error(`Proxy request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      // Try to parse the error response
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: response.status })
      } catch (e) {
        // If parsing fails, return the raw error text
        return NextResponse.json(
          { error: errorText || `Failed to process request: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }
    }

    const data = await response.json()
    console.log("API response:", JSON.stringify(data))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in AI proxy:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get("endpoint") || "status"

    console.log(`Proxying GET request to ${AI_SERVICE_URL}/${endpoint}`)

    const response = await fetch(`${AI_SERVICE_URL}/${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Proxy GET request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      // Try to parse the error response
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: response.status })
      } catch (e) {
        // If parsing fails, return the raw error text
        return NextResponse.json(
          { error: errorText || `Failed to process request: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }
    }

    const data = await response.json()
    console.log("API response:", JSON.stringify(data))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in AI proxy:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get("endpoint") || "delete_kb"

    console.log(`Proxying DELETE request to ${AI_SERVICE_URL}/${endpoint}`)

    const response = await fetch(`${AI_SERVICE_URL}/${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Proxy DELETE request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      // Try to parse the error response
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: response.status })
      } catch (e) {
        // If parsing fails, return the raw error text
        return NextResponse.json(
          { error: errorText || `Failed to process request: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }
    }

    const data = await response.json()
    console.log("API response:", JSON.stringify(data))
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in AI proxy:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
