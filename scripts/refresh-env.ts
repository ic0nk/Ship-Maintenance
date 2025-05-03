/**
 * This script refreshes the environment variables by writing them to a temporary file
 * and then copying them back to .env.local
 * Run with: npx tsx scripts/refresh-env.ts
 */

import fs from "fs"
import path from "path"

async function refreshEnv() {
  const envPath = path.join(process.cwd(), ".env.local")
  const tempPath = path.join(process.cwd(), ".env.temp")

  console.log("Refreshing environment variables...")

  try {
    // Read the current .env.local file
    const envContent = fs.readFileSync(envPath, "utf8")

    // Write to a temporary file
    fs.writeFileSync(tempPath, envContent)

    // Delete the original file
    fs.unlinkSync(envPath)

    // Copy the temp file back to .env.local
    fs.copyFileSync(tempPath, envPath)

    // Delete the temp file
    fs.unlinkSync(tempPath)

    console.log("Environment variables refreshed successfully!")
    console.log("Please restart your Next.js server for the changes to take effect.")
  } catch (error) {
    console.error("Error refreshing environment variables:", error)
  }
}

refreshEnv()
