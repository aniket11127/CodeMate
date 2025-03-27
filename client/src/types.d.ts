// Extending Window interface to support our polyfills
interface Window {
  global?: any;
  process?: any;
  Buffer?: any;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Cursor position for collaborative editing
export interface CursorPosition {
  userId: number;
  username: string;
  position: {
    lineNumber: number;
    column: number;
  };
}

// Code snippet type
export interface CodeSnippet {
  id: number;
  title: string;
  code: string;
  language: string;
  userId: number;
  roomId?: string;
  createdAt: string;
}