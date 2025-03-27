import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

// Initialize Monaco editor workers
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  }
};

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const CodeEditor = ({ value, language, onChange, readOnly = false }: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        readOnly,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        lineNumbers: 'on',
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
        },
      });

      monacoEditorRef.current.onDidChangeModelContent(() => {
        onChange(monacoEditorRef.current?.getValue() || '');
      });
    }

    return () => {
      monacoEditorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (monacoEditorRef.current) {
      if (monacoEditorRef.current.getValue() !== value) {
        monacoEditorRef.current.setValue(value);
      }
    }
  }, [value]);

  // Map our language values to Monaco language identifiers
  const getMonacoLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'csharp': 'csharp',
      'html': 'html',
      'css': 'css'
    };
    return languageMap[lang] || lang;
  };

  useEffect(() => {
    if (monacoEditorRef.current) {
      const monacoLang = getMonacoLanguage(language);
      monaco.editor.setModelLanguage(monacoEditorRef.current.getModel()!, monacoLang);
    }
  }, [language]);

  return <div ref={editorRef} className="h-full w-full border border-border rounded-md overflow-hidden" />;
};

export default CodeEditor;
