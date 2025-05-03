"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, CheckCircle, AlertCircle, X } from "lucide-react"

type CatalogFile = {
  id: string
  name: string
  size: number
  type: string
  content: string
}

interface CatalogUploaderProps {
  onUpload: (file: CatalogFile) => void
}

export function CatalogUploader({ onUpload }: CatalogUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFile = (file: File) => {
    // Check file type
    const validTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!validTypes.includes(file.type)) {
      setError("Invalid file type. Please upload PDF, TXT, DOC, DOCX, XLS, or XLSX files.")
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.")
      return
    }

    setError(null)
    setIsUploading(true)

    // Simulate file reading and upload progress
    const reader = new FileReader()

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        setUploadProgress(progress)
      }
    }

    reader.onload = (event) => {
      // Simulate network delay
      setTimeout(() => {
        setIsUploading(false)
        setSuccess(true)

        // Create catalog file object
        const catalogFile: CatalogFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          content: (event.target?.result as string) || "",
        }

        onUpload(catalogFile)

        // Reset form
        setTimeout(() => {
          setSuccess(false)
          setUploadProgress(0)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }, 1500)
      }, 1500)
    }

    reader.onerror = () => {
      setIsUploading(false)
      setError("Error reading file. Please try again.")
    }

    reader.readAsText(file)
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
          <h3 className="text-lg font-medium mb-2">Drag & Drop Your Catalog</h3>
          <p className="text-sm text-muted-foreground mb-4">or click to browse from your computer</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.txt,.doc,.docx,.xls,.xlsx"
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
          <p>Catalog uploaded successfully!</p>
        </motion.div>
      )}
    </div>
  )
}
