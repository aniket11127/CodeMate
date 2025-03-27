import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";
import { initialConnection, sendToWebSocket } from "../lib/websocket";
import { Message, CursorPosition, User, CodeSnippet } from "../types";
import { useToast } from "./use-toast";
import { apiRequest } from "../lib/queryClient";

interface RoomContextProps {
  children: ReactNode;
  roomId?: string;
}

interface RoomContextState {
  code: string;
  language: string;
  users: User[];
  messages: Message[];
  cursors: CursorPosition[];
  updateCode: (newCode: string) => void;
  updateLanguage: (newLanguage: string) => void;
  sendMessage: (message: Message) => void;
  sendCursorPosition: (cursorPosition: CursorPosition) => void;
  saveSnippet: (snippet: Omit<CodeSnippet, "id" | "userId" | "createdAt">) => Promise<void>;
}

const RoomContext = createContext<RoomContextState | undefined>(undefined);

export function RoomProvider({ children, roomId }: RoomContextProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;

    const connection = initialConnection(roomId, user.id, user.username);

    connection.onopen = () => {
      console.log("WebSocket connected");
      sendToWebSocket(connection, {
        type: "join",
        payload: {
          userId: user.id,
          username: user.username,
          roomId
        }
      });
    };

    connection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "code_update":
          setCode(data.code);
          break;
        case "language_update":
          setLanguage(data.language);
          break;
        case "chat_message":
          setMessages(prev => [...prev, data]);
          break;
        case "cursor_update":
          setCursors(prev => {
            const existing = prev.findIndex(c => c.userId === data.userId);
            if (existing >= 0) {
              return [
                ...prev.slice(0, existing),
                data,
                ...prev.slice(existing + 1)
              ];
            }
            return [...prev, data];
          });
          break;
        case "user_joined":
          setUsers(prev => {
            if (!prev.some(u => u.id === data.userId)) {
              return [...prev, { id: data.userId, username: data.username }];
            }
            return prev;
          });
          toast({
            title: "User joined",
            description: `${data.username} has joined the room`,
          });
          break;
        case "user_left":
          setUsers(prev => prev.filter(user => user.id !== data.userId));
          setCursors(prev => prev.filter(cursor => cursor.userId !== data.userId));
          toast({
            title: "User left",
            description: `${data.username} has left the room`,
          });
          break;
        case "error":
          toast({
            title: "Room error",
            description: data.message,
            variant: "destructive",
          });
          break;
        case "room_closed":
          toast({
            title: "Room closed",
            description: "This room has been closed by the host",
          });
          setLocation("/");
          break;
      }
    };

    connection.onclose = () => {
      console.log("WebSocket disconnected");
      toast({
        title: "Disconnected",
        description: "You have been disconnected from the room",
      });
    };

    setWsConnection(connection);

    // Fetch initial code if it exists
    const fetchInitialCode = async () => {
      try {
        const response = await apiRequest("GET", `/api/snippets/${roomId}`);
        const data = await response.json();
        if (data && data.code) {
          setCode(data.code);
        }
      } catch (error) {
        // No existing code for this room, that's ok
      }
    };
    
    fetchInitialCode();

    return () => {
      if (connection.readyState === WebSocket.OPEN) {
        sendToWebSocket(connection, {
          type: "leave",
          payload: {
            userId: user.id,
            roomId
          }
        });
      }
      connection.close();
    };
  }, [roomId, user, setLocation, toast]);

  const updateCode = (newCode: string) => {
    setCode(newCode);
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && user && roomId) {
      sendToWebSocket(wsConnection, {
        type: "code_update",
        userId: user.id,
        code: newCode,
        roomId,
        language,
        shouldPersist: true
      });
    }
  };

  const sendMessage = (message: Message) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      sendToWebSocket(wsConnection, {
        type: "chat_message",
        ...message
      });
    }
  };

  const sendCursorPosition = (cursorPosition: CursorPosition) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      sendToWebSocket(wsConnection, {
        type: "cursor_update",
        ...cursorPosition
      });
    }
  };

  const updateLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    // If needed, broadcast language change to other users
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && user && roomId) {
      sendToWebSocket(wsConnection, {
        type: "language_update",
        userId: user.id,
        language: newLanguage,
        roomId
      });
    }
  };

  const saveSnippet = async (snippet: Omit<CodeSnippet, "id" | "userId" | "createdAt">) => {
    if (!user) throw new Error("User not authenticated");

    const response = await apiRequest("POST", "/api/snippets", {
      ...snippet,
      roomId: roomId || null
    });

    return response.json();
  };

  const value = {
    code,
    language,
    users,
    messages,
    cursors,
    updateCode,
    updateLanguage,
    sendMessage,
    sendCursorPosition,
    saveSnippet
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
