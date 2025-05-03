"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ChatInterface } from "@/components/ai-chat/chat-interface"
import { TroubleshootingPanel } from "@/components/ai-chat/troubleshooting-panel"
import { AIStatusIndicator } from "@/components/ai-chat/ai-status-indicator"
import { checkAiStatus, type TroubleshootingState, defaultTroubleshootingState } from "@/lib/services/ai-service"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Database, AlertTriangle } from "lucide-react"
import { loadKnowledgeBase, deleteKnowledgeBase } from "@/lib/services/ai-service"

export default function AIChatPage() {
  const [troubleshootingState, setTroubleshootingState] = useState<TroubleshootingState>(defaultTroubleshootingState)
  const [aiStatus, setAiStatus] = useState({
    status: "Loading...",
    kb_loaded: false,
    web_search_enabled: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Check AI status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkAiStatus()
        setAiStatus(status)
      } catch (error) {
        console.error("Failed to check AI status:", error)
        setAiStatus({
          status: "Error",
          kb_loaded: false,
          web_search_enabled: false,
          message: "Failed to connect to AI service",
        })
      }
    }

    checkStatus()
    // Poll status every 30 seconds
    const intervalId = setInterval(checkStatus, 30000)
    return () => clearInterval(intervalId)
  }, [])

  const handleRefreshStatus = async () => {
    try {
      const status = await checkAiStatus()
      setAiStatus(status)
      setStatusMessage("Status refreshed successfully")
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (error) {
      console.error("Failed to refresh AI status:", error)
      setStatusMessage("Failed to refresh status")
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  const handleLoadKB = async () => {
    setIsLoading(true)
    setStatusMessage(null)
    try {
      const result = await loadKnowledgeBase()
      setStatusMessage(result.message)
      // Refresh status after loading KB
      const status = await checkAiStatus()
      setAiStatus(status)
    } catch (error) {
      console.error("Failed to load knowledge base:", error)
      setStatusMessage("Failed to load knowledge base")
    } finally {
      setIsLoading(false)
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  const handleDeleteKB = async () => {
    setIsLoading(true)
    setStatusMessage(null)
    try {
      const result = await deleteKnowledgeBase()
      setStatusMessage(result.message)
      // Refresh status after deleting KB
      const status = await checkAiStatus()
      setAiStatus(status)
    } catch (error) {
      console.error("Failed to delete knowledge base:", error)
      setStatusMessage("Failed to delete knowledge base")
    } finally {
      setIsLoading(false)
      setTimeout(() => setStatusMessage(null), 5000)
    }
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Ship Maintenance AI Assistant</h1>
            <AIStatusIndicator status={aiStatus} />
          </div>

          {statusMessage && (
            <Alert className="border-blue-500 bg-blue-500/10">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-500">{statusMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshStatus} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadKB}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <Database className="h-4 w-4" />
              {isLoading ? "Loading..." : "Load Knowledge Base"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteKB}
              disabled={isLoading}
              className="flex items-center gap-1 text-red-500 hover:text-red-700"
            >
              <AlertTriangle className="h-4 w-4" />
              {isLoading ? "Deleting..." : "Delete Knowledge Base"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <ChatInterface onTroubleshootingStateChange={setTroubleshootingState} />
            </div>
            <div>
              <TroubleshootingPanel state={troubleshootingState} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
