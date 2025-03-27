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
import { CursorPosition } from "@/types";

interface CodeEditorProps {
  roomId?: string;
}

export function CodeEditor({ roomId }: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const cursorDecoratorsRef = useRef<Record<number, string[]>>({});
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeCode, isExecuting } = useCodeExecution();
  const { 
    code, 
    language,
    updateCode, 
    updateLanguage,
    sendCursorPosition, 
    saveSnippet,
    cursors
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
    updateLanguage(newLanguage);
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
  
  // Update the cursor decorations when cursors change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !user) return;
    
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    
    // Remove old decorations
    Object.values(cursorDecoratorsRef.current).forEach(decorators => {
      editor.deltaDecorations(decorators, []);
    });
    
    // Create new decorations for other users' cursors
    const newDecorators: Record<number, string[]> = {};
    
    cursors.forEach(cursor => {
      // Don't show cursor for the current user
      if (cursor.userId === user.id) return;
      
      // Generate a unique color based on the user ID
      const hue = (cursor.userId * 137) % 360;
      const cursorColor = `hsl(${hue}, 70%, 60%)`;
      
      const decorations = editor.deltaDecorations(
        cursorDecoratorsRef.current[cursor.userId] || [],
        [
          // Line decoration
          {
            range: new monaco.Range(
              cursor.position.lineNumber,
              1,
              cursor.position.lineNumber,
              1
            ),
            options: {
              isWholeLine: true,
              className: `cursor-line-${cursor.userId}`,
              glyphMarginClassName: `cursor-glyph-${cursor.userId}`,
              overviewRuler: {
                color: cursorColor,
                position: monaco.editor.OverviewRulerLane.Center
              },
              minimap: {
                color: cursorColor,
                position: monaco.editor.MinimapPosition.Inline
              },
              after: {
                content: `  ${cursor.username}`,
                inlineClassName: `cursor-after-${cursor.userId}`
              }
            }
          },
          // Cursor decoration
          {
            range: new monaco.Range(
              cursor.position.lineNumber,
              cursor.position.column,
              cursor.position.lineNumber,
              cursor.position.column + 1
            ),
            options: {
              className: `cursor-${cursor.userId}`,
            }
          }
        ]
      );
      
      newDecorators[cursor.userId] = decorations;
      
      // Add dynamic CSS to document for cursor color
      const styleId = `cursor-style-${cursor.userId}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .cursor-${cursor.userId} {
            background-color: ${cursorColor};
            border-left: 2px solid ${cursorColor};
            width: 2px !important;
          }
          .cursor-line-${cursor.userId} {
            background-color: ${cursorColor}20;
          }
          .cursor-glyph-${cursor.userId}::after {
            content: "•";
            color: ${cursorColor};
            margin-left: 5px;
          }
          .cursor-after-${cursor.userId} {
            color: ${cursorColor};
            font-size: 10px;
            font-style: italic;
            margin-left: 10px;
          }
        `;
        document.head.appendChild(style);
      }
    });
    
    cursorDecoratorsRef.current = newDecorators;
    
    // Clean up when component unmounts
    return () => {
      // Remove all decorations
      Object.values(cursorDecoratorsRef.current).forEach(decorators => {
        editor.deltaDecorations(decorators, []);
      });
      
      // Remove dynamic CSS
      cursors.forEach(cursor => {
        const styleId = `cursor-style-${cursor.userId}`;
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          document.head.removeChild(styleElement);
        }
      });
    };
  }, [cursors, monacoRef, editorRef, user]);

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
