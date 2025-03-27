import React, { useEffect, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { setupMonaco } from "@/lib/monaco-config";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";
import { useRoom } from "@/hooks/use-room";
import { useCodeExecution } from "@/hooks/use-code-execution";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface CodeEditorProps {
  roomId?: string;
}

export function CodeEditor({ roomId }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [language, setLanguage] = useState<string>("javascript");
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeCode, isExecuting } = useCodeExecution();
  const { 
    code, 
    updateCode, 
    sendCursorPosition, 
    saveSnippet 
  } = useRoom();

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setupMonaco(monaco);

    // Setup cursor position change event
    editor.onDidChangeCursorPosition((e: any) => {
      if (user && roomId) {
        sendCursorPosition({
          userId: user.id,
          username: user.username,
          position: {
            lineNumber: e.position.lineNumber,
            column: e.position.column
          }
        });
      }
    });
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateCode(value);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const handleExecuteCode = async () => {
    if (!editorRef.current) return;
    
    const codeToExecute = editorRef.current.getValue();
    executeCode(codeToExecute, language);
  };

  const handleSaveSnippet = async () => {
    if (!editorRef.current || !user) return;
    
    setIsPending(true);
    try {
      await saveSnippet({
        code: editorRef.current.getValue(),
        language,
        title: `Snippet - ${new Date().toLocaleString()}`,
      });
      
      toast({
        title: "Snippet saved",
        description: "Your code snippet has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving snippet",
        description: "There was an error saving your code snippet.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="flex flex-col border rounded-md overflow-hidden h-full">
      <div className="flex items-center justify-between p-2 bg-card border-b">
        <LanguageSelector value={language} onChange={handleLanguageChange} />
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleSaveSnippet}
            disabled={isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button 
            size="sm" 
            onClick={handleExecuteCode}
            disabled={isExecuting}
          >
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
        </div>
      </div>
      <div className="flex-grow h-full min-h-[400px]">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "JetBrains Mono, monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            lineNumbers: "on",
            glyphMargin: true,
          }}
        />
      </div>
    </Card>
  );
}
