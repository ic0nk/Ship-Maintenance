import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { StatusResponse } from "@/lib/services/ai-service"
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react"

interface AIStatusIndicatorProps {
  status: StatusResponse
}

export function AIStatusIndicator({ status }: AIStatusIndicatorProps) {
  const { status: aiStatus, kb_loaded, web_search_enabled, message } = status

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Badge
                variant={aiStatus === "Ready" ? "default" : aiStatus === "Error" ? "destructive" : "outline"}
                className="flex items-center gap-1"
              >
                {aiStatus === "Ready" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : aiStatus === "Error" ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                <span>AI Status: {aiStatus}</span>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{message || "AI service status"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Badge variant={kb_loaded ? "default" : "outline"} className="flex items-center gap-1">
                {kb_loaded ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span>KB: {kb_loaded ? "Loaded" : "Not Loaded"}</span>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{kb_loaded ? "Knowledge base is loaded" : "Knowledge base is not loaded"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Badge variant={web_search_enabled ? "default" : "outline"} className="flex items-center gap-1">
                {web_search_enabled ? <CheckCircle2 className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
                <span>Web Search: {web_search_enabled ? "Enabled" : "Disabled"}</span>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {web_search_enabled
                ? "Web search is enabled for questions not in the knowledge base"
                : "Web search is disabled - Tavily API key may be missing"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
