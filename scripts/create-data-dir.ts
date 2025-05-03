/**
 * This script creates the data directory in the backend
 * Run with: npx tsx scripts/create-data-dir.ts
 */

import fs from "fs"
import path from "path"

const dataDir = path.join(process.cwd(), "backend", "data")

console.log(`Creating data directory at: ${dataDir}`)

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log("Data directory created successfully!")
  } catch (error) {
    console.error("Error creating data directory:", error)
  }
} else {
  console.log("Data directory already exists.")
}

// Create a simple ships.csv file if it doesn't exist
const csvFile = path.join(dataDir, "ships.csv")

if (!fs.existsSync(csvFile)) {
  try {
    const csvContent = `problem,possible_cause,solution_step_1,solution_step_2,solution_step_3
Liferaft not deploying,Improper storage or jam,Check securing straps,Lubricate mechanisms,Test release system
Engine overheating,Coolant leak or blockage,Check coolant level,Inspect for leaks,Clean cooling system
Propeller vibration,Blade damage or imbalance,Inspect propeller,Balance propeller,Replace if necessary
Electrical system failure,Short circuit or battery issue,Check circuit breakers,Test battery voltage,Inspect wiring
Steering system malfunction,Hydraulic fluid leak,Check fluid level,Inspect hoses for leaks,Bleed air from system`

    fs.writeFileSync(csvFile, csvContent)
    console.log("Created sample ships.csv file")
  } catch (error) {
    console.error("Error creating ships.csv file:", error)
  }
} else {
  console.log("ships.csv file already exists.")
}
