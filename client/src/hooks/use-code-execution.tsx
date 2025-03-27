import { useState, createContext, useContext } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CodeExecutionContextProps {
  children: React.ReactNode;
}

interface CodeExecutionContextState {
  output: string;
  error: string | null;
  isExecuting: boolean;
  executeCode: (code: string, language: string) => Promise<void>;
  clearOutput: () => void;
}

const CodeExecutionContext = createContext<CodeExecutionContextState | undefined>(undefined);

export function CodeExecutionProvider({ children }: CodeExecutionContextProps) {
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  const executeCode = async (code: string, language: string) => {
    if (!code.trim()) {
      toast({
        title: "Empty code",
        description: "Please enter some code to execute",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    setOutput("");
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/execute", {
        code,
        language,
      });
      
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        setOutput(result.output);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute code");
      toast({
        title: "Execution failed",
        description: err.message || "There was an error executing your code",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const clearOutput = () => {
    setOutput("");
    setError(null);
  };

  const value = {
    output,
    error,
    isExecuting,
    executeCode,
    clearOutput,
  };

  return (
    <CodeExecutionContext.Provider value={value}>
      {children}
    </CodeExecutionContext.Provider>
  );
}

export function useCodeExecution() {
  const context = useContext(CodeExecutionContext);
  
  if (context === undefined) {
    throw new Error("useCodeExecution must be used within a CodeExecutionProvider");
  }
  
  return context;
}
