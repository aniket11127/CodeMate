import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import CodeEditor from "@/lib/CodeEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Code,
  Send,
  ArrowLeft,
  Play,
  Save,
  Copy,
  Loader2,
  Users,
  MessageSquare,
} from "lucide-react";
import { Room, Message, CompileResult } from "@shared/schema";

export default function CodeRoom() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [chatMessage, setChatMessage] = useState("");
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isCodeUpdating = useRef(false);

  // Get room details
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useQuery<Room>({
    queryKey: [`/api/rooms/${roomId}`],
    onSuccess: (room) => {
      if (!isCodeUpdating.current) {
        setCode(room.code || "");
        setLanguage(room.language);
      }
    },
  });

  // Get chat messages
  const {
    data: messages,
    isLoading: isLoadingMessages,
  } = useQuery<Message[]>({
    queryKey: [`/api/rooms/${roomId}/messages`],
    refetchInterval: 3000, // Fallback polling if WebSocket fails
  });

  // Execute code mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/compile`, {
        code,
        language,
      });
      return await res.json();
    },
    onSuccess: (result: CompileResult) => {
      toast({
        title: result.success ? "Code executed successfully" : "Execution failed",
        description: result.success 
          ? "Your code ran without errors." 
          : "There was an error executing your code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Execution failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save snippet mutation
  const saveSnippetMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await apiRequest("POST", `/api/snippets`, {
        code,
        language,
        title: data.title,
        roomId,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Snippet saved",
        description: "Your code snippet has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save snippet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/rooms/${roomId}/messages`, {
        content: message,
      });
      return await res.json();
    },
    onSuccess: () => {
      setChatMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/messages`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save code to room mutation
  const saveCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/rooms/${roomId}`, {
        code,
        language,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Code saved",
        description: "Your code has been saved to the room.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect to WebSocket
  useEffect(() => {
    if (!roomId || !user) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?roomId=${roomId}&userId=${user.id}&username=${user.username}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connection established");
      setWebSocket(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "code_update" && data.sender !== user.id) {
        isCodeUpdating.current = true;
        setCode(data.code);
        setLanguage(data.language);
        setTimeout(() => {
          isCodeUpdating.current = false;
        }, 100);
      } else if (data.type === "chat_message") {
        queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/messages`] });
      } else if (data.type === "user_joined" || data.type === "user_left") {
        toast({
          title: data.type === "user_joined" ? "User joined" : "User left",
          description: `${data.username} has ${data.type === "user_joined" ? "joined" : "left"} the room.`,
        });
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection error",
        description: "Failed to connect to the collaboration server.",
        variant: "destructive",
      });
    };
    
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    return () => {
      ws.close();
    };
  }, [roomId, user]);

  // Send code updates through WebSocket
  useEffect(() => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN && !isCodeUpdating.current && user) {
      webSocket.send(JSON.stringify({
        type: "code_update",
        code,
        language,
        sender: user.id,
        roomId,
      }));
    }
  }, [code, language, webSocket, roomId, user]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Redirect if room not found
  useEffect(() => {
    if (roomError) {
      toast({
        title: "Room not found",
        description: "The room you're trying to access doesn't exist.",
        variant: "destructive",
      });
      navigate("/home");
    }
  }, [roomError, navigate, toast]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    // Try to send via WebSocket first
    if (webSocket && webSocket.readyState === WebSocket.OPEN && user) {
      webSocket.send(JSON.stringify({
        type: "chat_message",
        content: chatMessage,
        senderId: user.id,
        senderName: user.username,
        roomId,
        timestamp: new Date().toISOString(),
      }));
      setChatMessage("");
    } else {
      // Fallback to REST API
      sendMessageMutation.mutate(chatMessage);
    }
  };

  const handleSaveSnippet = (title: string) => {
    saveSnippetMutation.mutate({ title });
  };

  const handleExecuteCode = () => {
    executeMutation.mutate();
  };

  const handleSaveCode = () => {
    saveCodeMutation.mutate();
  };

  if (isLoadingRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-medium">
                {room?.name || "Coding Room"}
              </h1>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveCode}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Save Snippet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Code Snippet</DialogTitle>
                  <DialogDescription>
                    Give your code snippet a title to save it for later use.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    id="snippet-title"
                    placeholder="Snippet Title"
                    className="w-full"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={() => {
                      const titleInput = document.getElementById("snippet-title") as HTMLInputElement;
                      if (titleInput && titleInput.value.trim()) {
                        handleSaveSnippet(titleInput.value);
                      }
                    }}
                  >
                    Save Snippet
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={handleExecuteCode} disabled={executeMutation.isPending}>
              {executeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Code
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Editor Area - Left Side */}
        <div className="w-full md:w-2/3 h-screen p-4 pb-0 md:pb-4 flex flex-col">
          <div className="flex-1 border rounded-md overflow-hidden">
            <CodeEditor 
              value={code} 
              language={language} 
              onChange={setCode} 
            />
          </div>
          
          {/* Output Panel */}
          {executeMutation.data && (
            <Card className="mt-4 h-1/3">
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Output</CardTitle>
              </CardHeader>
              <CardContent className="font-mono text-xs bg-muted p-2 rounded max-h-[calc(100%-40px)] overflow-auto">
                {executeMutation.data.success ? (
                  <pre className="whitespace-pre-wrap">{executeMutation.data.output}</pre>
                ) : (
                  <pre className="text-destructive whitespace-pre-wrap">{executeMutation.data.error}</pre>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat & Participants - Right Side */}
        <div className="w-full md:w-1/3 h-[50vh] md:h-screen p-4 flex flex-col">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Room Chat</CardTitle>
                  <CardDescription>
                    Discuss your code with others in the room
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <div 
                    ref={chatContainerRef} 
                    className="h-full p-4 overflow-y-auto space-y-4"
                  >
                    {isLoadingMessages ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : !messages || messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.senderId === user?.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}
                          >
                            {message.senderId !== user?.id && (
                              <div className="font-semibold text-xs mb-1">
                                {message.senderName}
                              </div>
                            )}
                            <div className="text-sm break-words">{message.content}</div>
                            <div className="text-xs opacity-70 mt-1 text-right">
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-3">
                  <div className="flex w-full gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="flex-1 mt-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">Active Users</CardTitle>
                  <CardDescription>
                    People currently in this room
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {room?.participants && room.participants.length > 0 ? (
                    <div className="space-y-2">
                      {room.participants.map((participant) => (
                        <div 
                          key={participant.id} 
                          className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            {participant.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{participant.username}</div>
                            {participant.id === room.createdById && (
                              <div className="text-xs text-muted-foreground">Creator</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No other users in this room.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
