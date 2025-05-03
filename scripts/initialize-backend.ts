/**
 * This script initializes the backend by making a request to the /initialize endpoint
 * Run with: npx tsx scripts/initialize-backend.ts
 */

import { API_CONFIG } from "../lib/config"

async function initializeBackend() {
  console.log("Initializing backend...")

  try {
    const response = await fetch(`${API_CONFIG.AI_SERVICE_URL}/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        force_reload: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
      console.error(`Failed to initialize backend: ${errorData.detail || response.statusText}`)
      return
    }

    const data = await response.json()
    console.log("Backend initialized successfully:", data)
  } catch (error) {
    console.error(`Error initializing backend: ${error instanceof Error ? error.message : String(error)}`)
  }
}

initializeBackend()
