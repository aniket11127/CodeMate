import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Code, 
  LogOut, 
  PlusCircle, 
  ArrowRightCircle, 
  FileCode, 
  Loader2, 
  Users 
} from "lucide-react";
import { Snippet, Room } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [createRoomLanguage, setCreateRoomLanguage] = useState("javascript");
  const [createRoomName, setCreateRoomName] = useState("");

  // Query for user's snippets
  const { 
    data: snippets, 
    isLoading: isLoadingSnippets 
  } = useQuery<Snippet[]>({
    queryKey: ["/api/snippets"],
  });

  // Query for available rooms
  const { 
    data: rooms, 
    isLoading: isLoadingRooms 
  } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; language: string }) => {
      const res = await apiRequest("POST", "/api/rooms", roomData);
      return await res.json();
    },
    onSuccess: (room: Room) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Room created",
        description: `Room "${room.name}" created successfully.`,
      });
      navigate(`/room/${room.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!createRoomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a name for your room.",
        variant: "destructive",
      });
      return;
    }
    
    createRoomMutation.mutate({
      name: createRoomName,
      language: createRoomLanguage,
    });
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast({
        title: "Room ID required",
        description: "Please enter a room ID to join.",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/room/${joinRoomId}`);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">
              Code<span className="text-accent">Collab</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Actions */}
          <div className="w-full md:w-1/3 space-y-6">
            {/* Create Room Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  Create Room
                </CardTitle>
                <CardDescription>
                  Start a new collaborative coding session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Name</label>
                  <Input
                    placeholder="My Coding Room"
                    value={createRoomName}
                    onChange={(e) => setCreateRoomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select value={createRoomLanguage} onValueChange={setCreateRoomLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
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
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCreateRoom}
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Room
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Join Room Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightCircle className="h-5 w-5 text-primary" />
                  Join Room
                </CardTitle>
                <CardDescription>
                  Enter a room ID to join an existing session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter Room ID"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleJoinRoom}>
                  <Users className="mr-2 h-4 w-4" />
                  Join Room
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="w-full md:w-2/3">
            <Tabs defaultValue="rooms">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rooms">Available Rooms</TabsTrigger>
                <TabsTrigger value="snippets">My Code Snippets</TabsTrigger>
              </TabsList>
              
              {/* Rooms Tab */}
              <TabsContent value="rooms" className="mt-4">
                <div className="rounded-md border">
                  <div className="p-4 bg-muted/50">
                    <h3 className="text-lg font-medium">All Rooms</h3>
                    <p className="text-sm text-muted-foreground">
                      Join an existing collaboration room
                    </p>
                  </div>
                  <div className="p-4">
                    {isLoadingRooms ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : !rooms || rooms.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileCode className="h-10 w-10 mb-2 mx-auto opacity-50" />
                        <p>No rooms available. Create a new room to get started!</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {rooms.map((room) => (
                          <Card key={room.id} className="overflow-hidden">
                            <div className="p-3 bg-primary text-primary-foreground text-sm font-medium">
                              {room.language.toUpperCase()}
                            </div>
                            <CardContent className="pt-4">
                              <h4 className="font-medium">{room.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Created by {room.createdByUsername}
                              </p>
                            </CardContent>
                            <CardFooter className="border-t pt-4 pb-4 bg-muted/30">
                              <Button
                                className="w-full"
                                size="sm"
                                onClick={() => navigate(`/room/${room.id}`)}
                              >
                                Join Room
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Snippets Tab */}
              <TabsContent value="snippets" className="mt-4">
                <div className="rounded-md border">
                  <div className="p-4 bg-muted/50">
                    <h3 className="text-lg font-medium">My Saved Snippets</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage your saved code snippets
                    </p>
                  </div>
                  <div className="p-4">
                    {isLoadingSnippets ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : !snippets || snippets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileCode className="h-10 w-10 mb-2 mx-auto opacity-50" />
                        <p>No snippets saved yet. Snippets created in rooms will appear here.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 grid-cols-1">
                        {snippets.map((snippet) => (
                          <Card key={snippet.id} className="overflow-hidden">
                            <div className="p-3 bg-primary text-primary-foreground text-sm font-medium">
                              {snippet.language.toUpperCase()}
                            </div>
                            <CardContent className="pt-4">
                              <h4 className="font-medium">{snippet.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1 mb-2">
                                Created: {new Date(snippet.createdAt).toLocaleDateString()}
                              </p>
                              <div className="bg-muted p-2 rounded-md font-mono text-xs max-h-32 overflow-y-auto">
                                <pre>{snippet.code.slice(0, 150)}{snippet.code.length > 150 ? '...' : ''}</pre>
                              </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 pb-4 bg-muted/30">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button className="w-full" size="sm">
                                    View Snippet
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>{snippet.title}</DialogTitle>
                                    <DialogDescription>
                                      {snippet.language.toUpperCase()} • Created: {new Date(snippet.createdAt).toLocaleDateString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="bg-muted p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
                                    <pre>{snippet.code}</pre>
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={() => navigate(`/room/${snippet.roomId}`)}>
                                      Open in Room
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
