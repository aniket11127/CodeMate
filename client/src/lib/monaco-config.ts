import type { Monaco } from "@monaco-editor/react";

export function setupMonaco(monaco: Monaco) {
  // Simple code suggestions by language
  monaco.languages.registerCompletionItemProvider("javascript", {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: "console.log",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "console.log($1);",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Log to the console"
        },
        {
          label: "function",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "function ${1:name}(${2:params}) {\n\t${3}\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Function definition"
        },
        {
          label: "if",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "if (${1:condition}) {\n\t${2}\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "If statement"
        },
        {
          label: "for",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "For loop"
        }
      ];

      return { suggestions };
    }
  });

  monaco.languages.registerCompletionItemProvider("python", {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: "print",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "print($1)",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Print to the console"
        },
        {
          label: "def",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "def ${1:name}(${2:params}):\n\t${3}\n",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Function definition"
        },
        {
          label: "if",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "if ${1:condition}:\n\t${2}\n",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "If statement"
        },
        {
          label: "for",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "for ${1:item} in ${2:items}:\n\t${3}\n",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "For loop"
        }
      ];

      return { suggestions };
    }
  });

  monaco.languages.registerCompletionItemProvider("java", {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: "System.out.println",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "System.out.println($1);",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Print to the console"
        },
        {
          label: "main",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "public static void main(String[] args) {\n\t${1}\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Main method"
        },
        {
          label: "if",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "if (${1:condition}) {\n\t${2}\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "If statement"
        },
        {
          label: "for",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "for (int ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "For loop"
        }
      ];

      return { suggestions };
    }
  });

  // Add more language-specific suggestions as needed
  // Configure editor theme
  monaco.editor.defineTheme("codecollab-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1E293B",
      "editor.foreground": "#F1F5F9",
      "editorLineNumber.foreground": "#64748B",
      "editor.selectionBackground": "#3B82F630",
      "editor.lineHighlightBackground": "#64748B20",
    },
  });

  monaco.editor.setTheme("codecollab-dark");
}
