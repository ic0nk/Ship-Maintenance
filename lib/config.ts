/**
 * Application configuration
 * Centralizes access to environment variables and configuration settings
 */

// API endpoints
export const API_CONFIG = {
  // Keep existing config values
  HEALTH_ENDPOINT: "/api/health",
  AI_ENDPOINT: "/api/ai",
  // Add new AI service URL
  AI_SERVICE_URL: process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000",
}

// API keys (server-side only)
export const API_KEYS = {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || "",
}

// Add console logs to help debug
console.log("Environment variables loaded:", {
  AI_API_URL: process.env.AI_API_URL,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "Set" : "Not set",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ? "Set" : "Not set",
})

// Feature flags
export const FEATURES = {
  ENABLE_DOCUMENT_PROCESSING: true,
  ENABLE_ADVANCED_SEARCH: true,
  ENABLE_IMAGE_ANALYSIS: false, // Future feature
}

// Validate that required API keys are available
export function validateApiKeys(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  if (!API_KEYS.GOOGLE_API_KEY) missing.push("GOOGLE_API_KEY")
  if (!API_KEYS.TAVILY_API_KEY) missing.push("TAVILY_API_KEY")

  return {
    valid: missing.length === 0,
    missing,
  }
}
