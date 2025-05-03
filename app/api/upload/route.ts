import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"

// Define upload directory
const UPLOAD_DIR = join(process.cwd(), "uploads")

export async function POST(request: NextRequest) {
  try {
    // Ensure upload directory exists
    try {
      await mkdir(UPLOAD_DIR, { recursive: true })
    } catch (error) {
      console.error("Error creating upload directory:", error)
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""

    // Validate file type
    const allowedExtensions = ["csv", "pdf", "txt", "doc", "docx", "xls", "xlsx"]
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed types: CSV, PDF, TXT, DOC, DOCX, XLS, XLSX" },
        { status: 400 },
      )
    }

    // Generate a unique filename
    const uniqueFilename = `${Date.now()}-${file.name}`
    const filePath = join(UPLOAD_DIR, uniqueFilename)

    // Convert file to buffer and save
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, fileBuffer)

    // Return success response with file details
    return NextResponse.json({
      success: true,
      file: {
        id: Date.now().toString(),
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
