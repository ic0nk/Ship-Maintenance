import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { TroubleshootingState } from "@/lib/services/ai-service"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface TroubleshootingPanelProps {
  state: TroubleshootingState
}

export function TroubleshootingPanel({ state }: TroubleshootingPanelProps) {
  const { is_active, current_problem, current_step } = state

  if (!is_active) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 text-muted-foreground/50" />
            <p>No active troubleshooting session</p>
            <p className="text-sm mt-2">Describe a ship maintenance problem to start troubleshooting</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Troubleshooting</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Current Problem</h3>
            <Badge variant="outline" className="text-sm font-normal py-1 px-2">
              {current_problem}
            </Badge>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <h3 className="text-sm font-medium">Current Step</h3>
              <span className="text-sm text-muted-foreground">Step {current_step}</span>
            </div>
            <Progress value={current_step * 33} className="h-2" />
          </div>

          <div className="bg-muted rounded-md p-3 text-sm">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Follow the instructions provided by the assistant and report back if the step solved the problem.
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
