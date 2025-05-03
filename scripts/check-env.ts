/**
 * This script checks if the environment variables are correctly loaded
 * Run with: npx tsx scripts/check-env.ts
 */

console.log("Checking environment variables...")
console.log({
  AI_API_URL: process.env.AI_API_URL,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "Set" : "Not set",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY ? "Set" : "Not set",
})

if (!process.env.GOOGLE_API_KEY || !process.env.TAVILY_API_KEY) {
  console.error("Warning: Some API keys are missing!")
  console.log("Make sure you have the following in your .env.local file:")
  console.log(`
# API Configuration
AI_API_URL=http://localhost:8000
GOOGLE_API_KEY=AIzaSyCrQ1tQgFkFGGVuVnQzSn_C17F1hVQNTRw
TAVILY_API_KEY=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
  `)
} else {
  console.log("All environment variables are set correctly!")
}
