"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, AlertCircle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export type FileType = {
  id: string
  name: string
  size: number
  type: string
  path?: string
  content?: string
}

interface FileUploaderProps {
  onUpload: (file: FileType) => void
  allowedTypes?: string[]
  maxSize?: number // in bytes
  title?: string
  description?: string
  uploadEndpoint?: string
}

export function FileUploader({
  onUpload,
  allowedTypes = [
    "text/csv",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  maxSize = 10 * 1024 * 1024, // 10MB default
  title = "Upload File",
  description = "Upload files to enhance AI assistance",
  uploadEndpoint = "/api/upload",
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get allowed extensions for display
  const allowedExtensions = allowedTypes.map((type) => {
    const parts = type.split("/")
    return parts[1]?.toUpperCase() || type
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Please upload one of the following: ${allowedExtensions.join(", ")}`)
      return
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`)
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)

      // Upload file to server
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText)
          setIsUploading(false)
          setSuccess(true)

          // Create file object
          const uploadedFile: FileType = {
            id: response.file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            path: response.file.path,
          }

          onUpload(uploadedFile)

          // Reset form
          setTimeout(() => {
            setSuccess(false)
            setUploadProgress(0)
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }, 1500)
        } else {
          let errorMessage = "Upload failed"
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            errorMessage = errorResponse.error || errorMessage
          } catch (e) {
            // Use default error message
          }
          setIsUploading(false)
          setError(errorMessage)
        }
      })

      xhr.addEventListener("error", () => {
        setIsUploading(false)
        setError("Network error occurred during upload")
      })

      xhr.addEventListener("abort", () => {
        setIsUploading(false)
        setError("Upload was aborted")
      })

      xhr.open("POST", uploadEndpoint)
      xhr.send(formData)
    } catch (err) {
      setIsUploading(false)
      setError("Error uploading file. Please try again.")
      console.error("Upload error:", err)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {allowedExtensions.map((ext, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {ext}
              </Badge>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={allowedTypes.join(",")}
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            Select File
          </Button>
        </div>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 text-destructive rounded-md p-3 flex items-start gap-2"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto -mr-1 h-6 w-6 shrink-0 text-destructive/50 hover:text-destructive"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-md p-3 flex items-center gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          <p>File uploaded successfully!</p>
        </motion.div>
      )}
    </div>
  )
}
