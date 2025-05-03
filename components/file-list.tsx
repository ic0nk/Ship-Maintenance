"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { FileType } from "./file-uploader"

interface FileListProps {
  files: FileType[]
  onRemove: (id: string) => void
  emptyMessage?: string
}

export function FileList({ files, onRemove, emptyMessage = "No files uploaded" }: FileListProps) {
  const [previewFile, setPreviewFile] = useState<FileType | null>(null)

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-5 w-5 text-primary" />
  }

  const getFileTypeBadge = (fileType: string) => {
    const type = fileType.split("/").pop()?.toUpperCase() || fileType
    return (
      <Badge variant="outline" className="text-xs">
        {type}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
      ) : (
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-medium truncate max-w-[200px] sm:max-w-[300px]" title={file.name}>
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {getFileTypeBadge(file.type)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.type.includes("text") || file.type.includes("csv") ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Preview file</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {getFileIcon(file.type)}
                              <span className="truncate">{file.name}</span>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-auto mt-4 p-4 border rounded-md bg-muted/30 text-sm font-mono">
                            {file.content ? (
                              <pre className="whitespace-pre-wrap">{file.content}</pre>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                Preview not available. File content will be processed by the AI assistant.
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
