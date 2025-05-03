/**
 * This script tests the backend API directly
 * Run with: npx tsx scripts/test-backend.ts
 */

import { API_CONFIG, API_KEYS } from "../lib/config"

async function testBackend() {
  console.log("Testing backend API...")
  console.log("API_CONFIG:", API_CONFIG)
  console.log("API_KEYS:", {
    GOOGLE_API_KEY: API_KEYS.GOOGLE_API_KEY ? "Set" : "Not set",
    TAVILY_API_KEY: API_KEYS.TAVILY_API_KEY ? "Set" : "Not set",
  })

  // Test health endpoint
  try {
    console.log("\nTesting health endpoint...")
    const headers: HeadersInit = {
      "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY || "",
      "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY || "",
    }

    const healthResponse = await fetch(`${API_CONFIG.AI_SERVICE_URL}/health`, {
      headers,
    })

    console.log("Health status:", healthResponse.status, healthResponse.statusText)

    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log("Health response:", JSON.stringify(healthData, null, 2))
    } else {
      const errorText = await healthResponse.text()
      console.error("Health error:", errorText)
    }
  } catch (error) {
    console.error("Health check error:", error)
  }

  // Test troubleshoot endpoint
  try {
    console.log("\nTesting troubleshoot endpoint...")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY || "",
      "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY || "",
    }

    const troubleshootResponse = await fetch(`${API_CONFIG.AI_SERVICE_URL}/troubleshoot`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: "How do I fix an overheating engine?",
        options: {
          useAdvancedSearch: true,
          documentIds: [],
        },
      }),
    })

    console.log("Troubleshoot status:", troubleshootResponse.status, troubleshootResponse.statusText)

    if (troubleshootResponse.ok) {
      const troubleshootData = await troubleshootResponse.json()
      console.log("Troubleshoot response:", JSON.stringify(troubleshootData, null, 2))
    } else {
      const errorText = await troubleshootResponse.text()
      console.error("Troubleshoot error:", errorText)
    }
  } catch (error) {
    console.error("Troubleshoot error:", error)
  }

  // Test reset endpoint
  try {
    console.log("\nTesting reset endpoint...")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Google-API-Key": API_KEYS.GOOGLE_API_KEY || "",
      "X-Tavily-API-Key": API_KEYS.TAVILY_API_KEY || "",
    }

    const resetResponse = await fetch(`${API_CONFIG.AI_SERVICE_URL}/reset`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    })

    console.log("Reset status:", resetResponse.status, resetResponse.statusText)

    if (resetResponse.ok) {
      const resetData = await resetResponse.json()
      console.log("Reset response:", JSON.stringify(resetData, null, 2))
    } else {
      const errorText = await resetResponse.text()
      console.error("Reset error:", errorText)
    }
  } catch (error) {
    console.error("Reset error:", error)
  }
}

testBackend()
