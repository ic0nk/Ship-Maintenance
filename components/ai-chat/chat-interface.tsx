"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send, AlertCircle, Search } from "lucide-react"
import {
  sendChatMessage,
  type Message,
  type TroubleshootingState,
  defaultTroubleshootingState,
} from "@/lib/services/ai-service"
import { cn } from "@/lib/utils"

interface ChatInterfaceProps {
  onTroubleshootingStateChange?: (state: TroubleshootingState) => void
}

export function ChatInterface({ onTroubleshootingStateChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Ship Maintenance AI Assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [troubleshootingState, setTroubleshootingState] = useState<TroubleshootingState>(defaultTroubleshootingState)
  const [offerWebSearch, setOfferWebSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Update parent component with troubleshooting state
  useEffect(() => {
    if (onTroubleshootingStateChange) {
      onTroubleshootingStateChange(troubleshootingState)
    }
  }, [troubleshootingState, onTroubleshootingStateChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setError(null)
    setOfferWebSearch(false)
    setIsLoading(true)

    try {
      // Send message to AI service
      const response = await sendChatMessage(input, messages, troubleshootingState, false)

      // Update messages with AI response
      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }])

      // Update troubleshooting state
      setTroubleshootingState(response.troubleshooting_state)

      // Check if web search is offered
      setOfferWebSearch(response.offer_web_search)

      console.log("Chat response:", response)
    } catch (err) {
      console.error("Error sending message:", err)
      setError(`Failed to get response: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWebSearch = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)
    setOfferWebSearch(false)

    try {
      // Get the last user message
      const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")
      if (!lastUserMessage) {
        throw new Error("No user message found to search for")
      }

      // Add a system message indicating web search
      setMessages((prev) => [...prev, { role: "assistant", content: "Searching the web for more information..." }])

      // Send message with force web search flag
      const response = await sendChatMessage(
        lastUserMessage.content,
        messages.slice(0, -1), // Exclude the "Searching..." message
        troubleshootingState,
        true, // Force web search
      )

      // Update messages with AI response
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: response.answer }])

      // Update troubleshooting state
      setTroubleshootingState(response.troubleshooting_state)

      console.log("Web search response:", response)
    } catch (err) {
      console.error("Error performing web search:", err)
      setError(`Failed to search the web: ${err instanceof Error ? err.message : String(err)}`)
      // Remove the "Searching..." message if there was an error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Ship Maintenance Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-4">
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col max-w-[80%] rounded-lg p-4",
                  message.role === "user" ? "bg-primary text-primary-foreground self-end" : "bg-muted self-start",
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col max-w-[80%] rounded-lg p-4 bg-muted self-start">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {offerWebSearch && !isLoading && (
              <div className="flex justify-center mt-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleWebSearch}>
                  <Search className="h-4 w-4" />
                  Search the web for more information
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
