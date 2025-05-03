"use client"

import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AIStatusIndicatorProps {
  status: {
    healthy: boolean
    apiKeysValid: boolean
    missingKeys: string[]
  }
}

export function AIStatusIndicator({ status }: AIStatusIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false)
  console.log("AI Status in indicator:", status)

  // Determine the status indicator
  let icon = <AlertTriangle className="h-4 w-4 text-amber-500" />
  let text = "AI Service Status: Unknown"
  let description = "Unable to determine AI service status"

  if (status.healthy && status.apiKeysValid) {
    icon = <CheckCircle className="h-4 w-4 text-green-500" />
    text = "AI Service: Online"
    description = "All systems operational"
  } else if (status.healthy && !status.apiKeysValid) {
    icon = <AlertTriangle className="h-4 w-4 text-amber-500" />
    text = "AI Service: Limited"
    description = `Missing API keys: ${status.missingKeys.join(", ")}`
  } else if (!status.healthy) {
    icon = <XCircle className="h-4 w-4 text-red-500" />
    text = "AI Service: Offline"
    description = "Service unavailable"
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 text-xs h-8 px-2"
              onClick={() => setShowDetails(true)}
            >
              {icon}
              <span className="hidden sm:inline">{text}</span>
              <Info className="h-3 w-3 ml-1 opacity-70" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
            <p className="text-xs mt-1 opacity-70">Click for more details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {icon}
              <span>{text}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <h3 className="text-sm font-medium mb-1">Status Details:</h3>
              <ul className="text-sm space-y-1">
                <li className="flex items-center gap-2">
                  {status.healthy ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Backend Service: {status.healthy ? "Online" : "Offline"}</span>
                </li>
                <li className="flex items-center gap-2">
                  {status.apiKeysValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>API Keys: {status.apiKeysValid ? "Valid" : "Invalid or Missing"}</span>
                </li>
              </ul>
            </div>

            {status.missingKeys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">Missing API Keys:</h3>
                <ul className="text-sm list-disc pl-5">
                  {status.missingKeys.map((key, index) => (
                    <li key={index}>{key}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-1">Troubleshooting:</h3>
              <ul className="text-sm list-disc pl-5">
                <li>
                  Check if the backend server is running at{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">http://localhost:8000</code>
                </li>
                <li>
                  Verify API keys are correctly set in{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code>
                </li>
                <li>Check browser console for detailed error messages</li>
                <li>Try restarting both frontend and backend servers</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
