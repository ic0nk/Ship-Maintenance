"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { sendMessageToAi, checkAiServiceHealth } from "@/lib/utils/ai-service"
import { Code } from "lucide-react"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      // Test health check
      const healthResult = await checkAiServiceHealth()

      // Test sending a message
      const messageResult = await sendMessageToAi("Test message from debug panel", {})

      setTestResult({
        health: healthResult,
        message: messageResult,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px]">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Debug Panel
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">AI Service Debug</CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-4">
              <Button onClick={runTest} disabled={isLoading} size="sm" className="w-full">
                {isLoading ? "Testing..." : "Test AI Connection"}
              </Button>

              {testResult && (
                <div className="text-xs overflow-auto max-h-[300px] bg-muted p-2 rounded">
                  <pre>{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
