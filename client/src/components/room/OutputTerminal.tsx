import { useCodeExecution } from "@/hooks/use-code-execution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OutputTerminal() {
  const { output, isExecuting, error } = useCodeExecution();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-base flex items-center justify-between">
          Output
          {isExecuting && (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-xs">Executing...</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-4 font-mono text-sm">
          {error ? (
            <div className="text-destructive whitespace-pre-wrap">{error}</div>
          ) : output ? (
            <pre className="whitespace-pre-wrap">{output}</pre>
          ) : (
            <div className="text-muted-foreground">
              Code execution output will appear here.
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
