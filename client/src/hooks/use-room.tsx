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
  users: User[];
  messages: Message[];
  cursors: CursorPosition[];
  updateCode: (newCode: string) => void;
  sendMessage: (message: Message) => void;
  sendCursorPosition: (cursorPosition: CursorPosition) => void;
  saveSnippet: (snippet: Omit<CodeSnippet, "id" | "userId" | "createdAt">) => Promise<void>;
}

const RoomContext = createContext<RoomContextState | undefined>(undefined);

export function RoomProvider({ children, roomId }: RoomContextProps) {
  const [code, setCode] = useState("");
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
          setCode(data.payload.code);
          break;
        case "user_list":
          setUsers(data.payload.users);
          break;
        case "message":
          setMessages(prev => [...prev, data.payload]);
          break;
        case "cursor_update":
          setCursors(prev => {
            const existing = prev.findIndex(c => c.userId === data.payload.userId);
            if (existing >= 0) {
              return [
                ...prev.slice(0, existing),
                data.payload,
                ...prev.slice(existing + 1)
              ];
            }
            return [...prev, data.payload];
          });
          break;
        case "error":
          toast({
            title: "Room error",
            description: data.payload.message,
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
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN && user) {
      sendToWebSocket(wsConnection, {
        type: "code_update",
        payload: {
          userId: user.id,
          code: newCode,
          roomId
        }
      });
    }
  };

  const sendMessage = (message: Message) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      sendToWebSocket(wsConnection, {
        type: "message",
        payload: message
      });
    }
  };

  const sendCursorPosition = (cursorPosition: CursorPosition) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      sendToWebSocket(wsConnection, {
        type: "cursor_update",
        payload: cursorPosition
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
    users,
    messages,
    cursors,
    updateCode,
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
