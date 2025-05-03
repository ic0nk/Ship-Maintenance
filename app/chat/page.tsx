"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MainLayout } from "@/components/layout/main-layout"
import {
  Bot,
  Send,
  User,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  Upload,
  FileText,
  X,
  Database,
  RefreshCw,
  FileUp,
  Server,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileUploader, type FileType } from "@/components/file-uploader"
import { FileList } from "@/components/file-list"
import { AIStatusIndicator } from "@/components/ai-status-indicator"
import {
  checkAiServiceHealth,
  sendMessageToAi,
  performAdvancedSearch,
  resetAiConversation,
} from "@/lib/utils/ai-service"
import { FEATURES } from "@/lib/config"

// Import the debug panel at the top of the file
import { DebugPanel } from "@/components/debug-panel"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isSearchResult?: boolean
}

type DiagnosticResult = {
  severity: "low" | "medium" | "high"
  issue: string
  recommendation: string
}

type CatalogFile = FileType & {
  content?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your ship maintenance AI assistant. I can help diagnose potential issues with your vessel and provide maintenance recommendations. For more accurate assistance, please upload your ship component catalogs, maintenance manuals, or technical specifications.",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([])
  const [activeTab, setActiveTab] = useState("chat")
  const [catalogs, setCatalogs] = useState<CatalogFile[]>([])
  const [technicalDocs, setTechnicalDocs] = useState<FileType[]>([])
  const [showCatalogUploader, setShowCatalogUploader] = useState(false)
  const [showFileUploader, setShowFileUploader] = useState(false)
  const [aiStatus, setAiStatus] = useState<{
    healthy: boolean
    apiKeysValid: boolean
    missingKeys: string[]
  }>({
    healthy: false,
    apiKeysValid: false,
    missingKeys: [],
  })
  const [isPerformingSearch, setIsPerformingSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update the useEffect that checks the AI service status to be more resilient

  // Replace the existing useEffect for checking AI status with this:
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkAiServiceHealth()
        setAiStatus(status)
      } catch (error) {
        console.warn("Failed to check AI service status:", error)
        // Set a default status when check fails
        setAiStatus({
          healthy: false,
          apiKeysValid: false,
          missingKeys: ["Connection to AI service failed"],
        })
      }
    }

    checkStatus()
  }, [])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Switch to diagnostics tab when new results are available
  useEffect(() => {
    if (diagnosticResults.length > 0 && !isLoading) {
      // Wait a moment before switching tabs for better UX
      const timer = setTimeout(() => {
        setActiveTab("diagnostics")
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [diagnosticResults, isLoading])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Check if we should perform an advanced search
      const shouldSearch =
        FEATURES.ENABLE_ADVANCED_SEARCH &&
        aiStatus.apiKeysValid &&
        (inputValue.toLowerCase().includes("search") ||
          inputValue.toLowerCase().includes("find") ||
          inputValue.toLowerCase().includes("information about"))

      // If advanced search is requested and API keys are valid
      if (shouldSearch) {
        setIsPerformingSearch(true)

        try {
          const results = await performAdvancedSearch(inputValue)
          setSearchResults(results.results || [])

          // Add a message about the search
          setMessages((prev) => [
            ...prev,
            {
              id: `search-${Date.now()}`,
              role: "assistant",
              content: `I've searched for information about your query. Here's what I found:\n\n${results.results
                .map((r: any, i: number) => `${i + 1}. **${r.title}**: ${r.snippet}`)
                .join("\n\n")}`,
              timestamp: new Date(),
              isSearchResult: true,
            },
          ])

          setIsLoading(false)
          setIsPerformingSearch(false)
          return
        } catch (error) {
          console.error("Search failed:", error)
          // Continue with normal message processing if search fails
          setIsPerformingSearch(false)
        }
      }

      // If AI backend is unhealthy or API keys are invalid, use the fallback
      if (!aiStatus.healthy || !aiStatus.apiKeysValid) {
        const aiResponse = generateFallbackResponse(inputValue, catalogs)

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: aiResponse.message,
              timestamp: new Date(),
            },
          ])

          if (aiResponse.diagnostics.length > 0) {
            setDiagnosticResults(aiResponse.diagnostics)
          }

          setIsLoading(false)
        }, 1500)

        return
      }

      // Use the AI backend with API keys for response
      const documentIds = [...catalogs, ...technicalDocs].map((doc) => doc.id)

      const aiResponse = await sendMessageToAi(inputValue, {
        useAdvancedSearch: FEATURES.ENABLE_ADVANCED_SEARCH,
        documentIds,
      })

      console.log("AI response received:", aiResponse)

      // Make sure we have a valid response
      if (!aiResponse || typeof aiResponse.response !== "string") {
        console.error("Invalid AI response format:", aiResponse)
        throw new Error("Invalid response format from AI service")
      }

      // Add the AI response to messages
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse.response,
          timestamp: new Date(),
        },
      ])

      // Check if there are diagnostic results in the response
      if (aiResponse.current_step || aiResponse.is_solved === false) {
        // Extract diagnostic information from the response
        const newDiagnostic: DiagnosticResult = {
          severity: aiResponse.current_step ? "medium" : "low",
          issue: "AI-identified maintenance issue",
          recommendation: aiResponse.response,
        }

        setDiagnosticResults([newDiagnostic])
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error getting AI response:", error)

      // Fallback to the local response generator
      const fallbackResponse = generateFallbackResponse(inputValue, catalogs)

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I'm having trouble connecting to the AI service. ${fallbackResponse.message}`,
          timestamp: new Date(),
        },
      ])

      if (fallbackResponse.diagnostics.length > 0) {
        setDiagnosticResults(fallbackResponse.diagnostics)
      }

      setIsLoading(false)
    }
  }

  const generateFallbackResponse = (input: string, catalogs: CatalogFile[]) => {
    const lowerInput = input.toLowerCase()
    const hasCatalogs = catalogs.length > 0
    const hasTechnicalDocs = technicalDocs.length > 0

    // Reference catalogs and technical docs in responses if available
    const docsReference =
      hasCatalogs || hasTechnicalDocs
        ? `Based on your ${catalogs.length + technicalDocs.length} uploaded document${
            catalogs.length + technicalDocs.length > 1 ? "s" : ""
          } (${[...catalogs, ...technicalDocs].map((c) => c.name).join(", ")}), `
        : ""

    // Simple pattern matching for demo purposes
    if (lowerInput.includes("engine") || lowerInput.includes("motor")) {
      return {
        message: `${docsReference}I've analyzed your description of the engine issues. There might be a problem with your ship's engine system. ${
          hasCatalogs || hasTechnicalDocs ? "According to the maintenance manual specifications, " : ""
        }I've generated some potential diagnoses. Please check the Diagnostics tab for more details.`,
        diagnostics: [
          {
            severity: "high",
            issue: "Potential fuel injector malfunction",
            recommendation:
              hasCatalogs || hasTechnicalDocs
                ? "Inspect and clean fuel injectors according to section 3.2 of your maintenance manual. Replace if necessary with part #FI-2045 as specified in your component catalog."
                : "Inspect and clean fuel injectors. Replace if necessary.",
          },
          {
            severity: "medium",
            issue: "Engine cooling system inefficiency",
            recommendation:
              hasCatalogs || hasTechnicalDocs
                ? "Check coolant levels and inspect for leaks as outlined in maintenance procedure MP-103. Clean heat exchangers using the recommended solution (HE-Clean) mentioned in your catalog."
                : "Check coolant levels and inspect for leaks. Clean heat exchangers.",
          },
        ],
      }
    } else if (lowerInput.includes("propeller") || lowerInput.includes("vibration")) {
      return {
        message: `${docsReference}I've analyzed your description of the propeller issues. ${
          hasCatalogs || hasTechnicalDocs ? "Referencing your component specifications, " : ""
        }This could indicate several problems. I've added my diagnostic results to the Diagnostics tab for your review.`,
        diagnostics: [
          {
            severity: "medium",
            issue: "Propeller blade damage or imbalance",
            recommendation:
              hasCatalogs || hasTechnicalDocs
                ? "Inspect propeller for physical damage according to inspection protocol IP-78 in your manual. Consider balancing using the B-200 equipment or replacement with the P-450 series propeller specified in your catalog."
                : "Inspect propeller for physical damage. Consider balancing or replacement.",
          },
          {
            severity: "low",
            issue: "Shaft misalignment",
            recommendation:
              hasCatalogs || hasTechnicalDocs
                ? "Check shaft alignment using the laser alignment tool (LAT-3000) mentioned in your catalog. Adjust bearings according to the tolerance specifications in section 5.4 of your maintenance manual."
                : "Check shaft alignment and bearings. Adjust as needed.",
          },
        ],
      }
    } else if (lowerInput.includes("electrical") || lowerInput.includes("power")) {
      return {
        message: `${docsReference}I've analyzed your electrical system concerns. ${
          hasCatalogs || hasTechnicalDocs ? "Based on the electrical specifications in your documentation, " : ""
        }There appear to be some issues that require attention. Please check the Diagnostics tab for my assessment.`,
        diagnostics: [
          {
            severity: "high",
            issue: "Electrical system overload",
            recommendation:
              hasCatalogs || hasTechnicalDocs
                ? "Check for short circuits using the diagnostic procedure DP-42 outlined in your manual. Inspect all connections according to the wiring diagram WD-103 in your documentation. Review power consumption against the maximum ratings listed in your component catalog."
                : "Check for short circuits and inspect all connections. Review power consumption.",
          },
          {
            severity: "medium",
            issue: "Battery degradation",
            recommendation:
              hasCatalogs || hasTechnicalDocs
                ? "Test battery capacity using the BT-500 tester referenced in your catalog. Check charging system according to maintenance schedule MS-7. Replace batteries if below 70% capacity with the recommended BT-Marine-200 model specified in your documentation."
                : "Test battery capacity and charging system. Replace batteries if below 70% capacity.",
          },
        ],
      }
    } else {
      return {
        message: `Thank you for providing that information. ${
          hasCatalogs || hasTechnicalDocs ? "I've referenced your uploaded documentation, but " : ""
        }To give you a more accurate diagnosis, could you please provide more specific details about the issue you're experiencing? For example, are you noticing unusual sounds, vibrations, performance issues, or fluid leaks?`,
        diagnostics: [],
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = async () => {
    // Reset conversation in the AI backend if it's healthy
    if (aiStatus.healthy) {
      await resetAiConversation()
    }

    setMessages([
      {
        id: "clear-" + Date.now().toString(),
        role: "assistant",
        content: "Chat history has been cleared. How can I assist you with your ship maintenance needs today?",
        timestamp: new Date(),
      },
    ])
    setDiagnosticResults([])
    setActiveTab("chat")
  }

  const handleAddCatalog = (file: CatalogFile) => {
    setCatalogs((prev) => [...prev, file])
    setShowCatalogUploader(false)

    // Add a system message about the catalog being added
    setMessages((prev) => [
      ...prev,
      {
        id: "catalog-" + Date.now().toString(),
        role: "assistant",
        content: `I've received your catalog "${file.name}". I'll reference this information when answering your questions about ship maintenance.`,
        timestamp: new Date(),
      },
    ])
  }

  const handleAddTechnicalDoc = (file: FileType) => {
    setTechnicalDocs((prev) => [...prev, file])
    setShowFileUploader(false)

    // Add a system message about the technical document being added
    setMessages((prev) => [
      ...prev,
      {
        id: "techdoc-" + Date.now().toString(),
        role: "assistant",
        content: `I've received your technical document "${file.name}". This will help me provide more accurate and context-aware assistance for your ship maintenance queries.`,
        timestamp: new Date(),
      },
    ])
  }

  const handleRemoveCatalog = (id: string) => {
    const catalogToRemove = catalogs.find((cat) => cat.id === id)
    setCatalogs((prev) => prev.filter((catalog) => catalog.id !== id))

    if (catalogToRemove) {
      // Add a system message about the catalog being removed
      setMessages((prev) => [
        ...prev,
        {
          id: "remove-catalog-" + Date.now().toString(),
          role: "assistant",
          content: `I've removed the catalog "${catalogToRemove.name}" from our conversation.`,
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleRemoveTechnicalDoc = (id: string) => {
    const docToRemove = technicalDocs.find((doc) => doc.id === id)
    setTechnicalDocs((prev) => prev.filter((doc) => doc.id !== id))

    if (docToRemove) {
      // Add a system message about the technical document being removed
      setMessages((prev) => [
        ...prev,
        {
          id: "remove-techdoc-" + Date.now().toString(),
          role: "assistant",
          content: `I've removed the technical document "${docToRemove.name}" from our conversation.`,
          timestamp: new Date(),
        },
      ])
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-amber-500"
      case "low":
        return "text-green-500"
      default:
        return ""
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "medium":
        return <HelpCircle className="h-5 w-5 text-amber-500" />
      case "low":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return null
    }
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {!aiStatus.healthy && (
            <Alert className="mb-4 border-amber-500 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-500">
                The AI service is currently unavailable. Using fallback responses. Some advanced features may be
                limited.
              </AlertDescription>
            </Alert>
          )}

          {aiStatus.healthy && !aiStatus.apiKeysValid && (
            <Alert className="mb-4 border-amber-500 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-500">
                {aiStatus.missingKeys.length > 0
                  ? `Missing API keys: ${aiStatus.missingKeys.join(", ")}. Some advanced features may be limited.`
                  : "API keys are not properly configured. Some advanced features may be limited."}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="diagnostics" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Diagnostics
                  {diagnosticResults.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {diagnosticResults.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="catalogs" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Catalogs
                  {catalogs.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {catalogs.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="technical" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Technical Docs
                  {technicalDocs.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {technicalDocs.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <AIStatusIndicator status={aiStatus} />
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col space-y-4 h-[calc(100vh-220px)]">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Ship Maintenance AI Assistant</CardTitle>
                      <CardDescription>
                        Describe your ship's issues for AI-powered diagnostics and maintenance recommendations
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCatalogUploader(true)}
                              className="flex items-center gap-1"
                            >
                              <Database className="h-4 w-4" />
                              <span className="hidden sm:inline">Upload Catalog</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload ship component catalogs or maintenance manuals</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowFileUploader(true)}
                              className="flex items-center gap-1"
                            >
                              <FileUp className="h-4 w-4" />
                              <span className="hidden sm:inline">Upload Technical Doc</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Upload technical specifications, logs, or other documents</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleClearChat}
                              className="flex items-center gap-1"
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span className="hidden sm:inline">Clear Chat</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Clear the current conversation</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Document indicators */}
                  {(catalogs.length > 0 || technicalDocs.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Using documents:</span>
                      {catalogs.map((catalog) => (
                        <Badge key={catalog.id} variant="outline" className="flex items-center gap-1 text-xs">
                          <Database className="h-3 w-3" />
                          {catalog.name}
                        </Badge>
                      ))}
                      {technicalDocs.map((doc) => (
                        <Badge key={doc.id} variant="outline" className="flex items-center gap-1 text-xs">
                          <FileText className="h-3 w-3" />
                          {doc.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <div className="space-y-4 pr-4">
                      <AnimatePresence initial={false}>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-lg px-4 py-3",
                                message.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : message.isSearchResult
                                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                    : "bg-muted",
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {message.role === "assistant" ? (
                                  message.isSearchResult ? (
                                    <Search className="h-4 w-4" />
                                  ) : (
                                    <Bot className="h-4 w-4" />
                                  )
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                                <span className="text-sm font-medium">
                                  {message.role === "assistant"
                                    ? message.isSearchResult
                                      ? "AI Search Results"
                                      : "AI Assistant"
                                    : "You"}
                                </span>
                                <span className="text-xs opacity-70">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert">
                                {message.content.split("\n").map((line, i) => (
                                  <p key={i} className={i > 0 ? "mt-2" : ""}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                            <div className="flex items-center gap-2 mb-1">
                              <Bot className="h-4 w-4" />
                              <span className="text-sm font-medium">AI Assistant</span>
                            </div>
                            <div className="flex space-x-2">
                              <motion.div
                                animate={{ scale: [0.8, 1.2, 0.8] }}
                                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                                className="h-2 w-2 rounded-full bg-primary"
                              ></motion.div>
                              <motion.div
                                animate={{ scale: [0.8, 1.2, 0.8] }}
                                transition={{
                                  repeat: Number.POSITIVE_INFINITY,
                                  duration: 1.5,
                                  delay: 0.2,
                                }}
                                className="h-2 w-2 rounded-full bg-primary"
                              ></motion.div>
                              <motion.div
                                animate={{ scale: [0.8, 1.2, 0.8] }}
                                transition={{
                                  repeat: Number.POSITIVE_INFINITY,
                                  duration: 1.5,
                                  delay: 0.4,
                                }}
                                className="h-2 w-2 rounded-full bg-primary"
                              ></motion.div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {isPerformingSearch && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="max-w-[80%] rounded-lg px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-1">
                              <Search className="h-4 w-4" />
                              <span className="text-sm font-medium">AI Search</span>
                            </div>
                            <p>Searching for information about your query...</p>
                            <div className="flex space-x-2 mt-2">
                              <motion.div
                                animate={{ scale: [0.8, 1.2, 0.8] }}
                                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                                className="h-2 w-2 rounded-full bg-blue-500"
                              ></motion.div>
                              <motion.div
                                animate={{ scale: [0.8, 1.2, 0.8] }}
                                transition={{
                                  repeat: Number.POSITIVE_INFINITY,
                                  duration: 1.5,
                                  delay: 0.2,
                                }}
                                className="h-2 w-2 rounded-full bg-blue-500"
                              ></motion.div>
                              <motion.div
                                animate={{ scale: [0.8, 1.2, 0.8] }}
                                transition={{
                                  repeat: Number.POSITIVE_INFINITY,
                                  duration: 1.5,
                                  delay: 0.4,
                                }}
                                className="h-2 w-2 rounded-full bg-blue-500"
                              ></motion.div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full items-center space-x-2">
                    <Textarea
                      placeholder="Describe your ship's issue or maintenance question..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1"
                      rows={3}
                    />
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      disabled={!inputValue.trim() || isLoading}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="diagnostics" className="flex-1 flex flex-col space-y-4 h-[calc(100vh-220px)]">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Diagnostic Results</CardTitle>
                  <CardDescription>AI-generated analysis of potential ship maintenance issues</CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosticResults.length > 0 ? (
                    <div className="space-y-6">
                      <AnimatePresence initial={false}>
                        {diagnosticResults.map((result, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              {getSeverityIcon(result.severity)}
                              <h3 className={cn("text-lg font-semibold", getSeverityColor(result.severity))}>
                                {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} Severity Issue
                              </h3>
                            </div>
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Identified Issue:</h4>
                              <p className="font-medium">{result.issue}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Recommendation:</h4>
                              <p>{result.recommendation}</p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center justify-center h-[calc(100vh-350px)] text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Diagnostics Yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        Describe your ship's maintenance issues in the chat to receive AI-powered diagnostic results and
                        recommendations.
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalogs" className="flex-1 flex flex-col space-y-4 h-[calc(100vh-220px)]">
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Ship Component Catalogs</CardTitle>
                      <CardDescription>
                        Upload ship component catalogs or maintenance manuals for more accurate assistance
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowCatalogUploader(true)} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Catalog
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FileList
                    files={catalogs}
                    onRemove={handleRemoveCatalog}
                    emptyMessage="No catalogs uploaded. Upload ship component catalogs or maintenance manuals to help the AI provide more accurate assistance."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="flex-1 flex flex-col space-y-4 h-[calc(100vh-220px)]">
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Technical Documents</CardTitle>
                      <CardDescription>
                        Upload technical specifications, maintenance logs, or other documents for enhanced AI assistance
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowFileUploader(true)} className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <FileList
                    files={technicalDocs}
                    onRemove={handleRemoveTechnicalDoc}
                    emptyMessage="No technical documents uploaded. Upload specifications, logs, or other documents to enhance the AI's understanding of your vessel."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Catalog Uploader Modal */}
          <AnimatePresence>
            {showCatalogUploader && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card border rounded-lg shadow-lg w-full max-w-md relative"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => setShowCatalogUploader(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>

                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Upload Ship Catalog</h2>
                    <p className="text-muted-foreground mb-6">
                      Upload ship component catalogs or maintenance manuals to help the AI provide more accurate and
                      context-aware assistance.
                    </p>

                    <Alert className="mb-6 bg-primary/5 border-primary/20">
                      <FileText className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">
                        Supported file types: PDF, TXT, DOC, DOCX, XLS, XLSX
                      </AlertDescription>
                    </Alert>

                    <FileUploader
                      onUpload={handleAddCatalog}
                      title="Upload Ship Catalog"
                      description="Drag & drop your catalog or click to browse"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Technical Document Uploader Modal */}
          <AnimatePresence>
            {showFileUploader && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card border rounded-lg shadow-lg w-full max-w-md relative"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={() => setShowFileUploader(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>

                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Upload Technical Document</h2>
                    <p className="text-muted-foreground mb-6">
                      Upload technical specifications, maintenance logs, or other documents to enhance the AI's
                      understanding of your vessel.
                    </p>

                    <Alert className="mb-6 bg-primary/5 border-primary/20">
                      <Server className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm">
                        Files are processed by our AI system to provide context-aware assistance
                      </AlertDescription>
                    </Alert>

                    <FileUploader
                      onUpload={handleAddTechnicalDoc}
                      title="Upload Technical Document"
                      description="Drag & drop your document or click to browse"
                      allowedTypes={[
                        "text/csv",
                        "application/pdf",
                        "text/plain",
                        "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "application/vnd.ms-excel",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      ]}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <DebugPanel />
      </div>
    </MainLayout>
  )
}
