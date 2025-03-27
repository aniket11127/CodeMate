import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRoom } from "@/hooks/use-room";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { Message } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Chat() {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const { messages, sendMessage } = useRoom();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to the bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    
    sendMessage({
      userId: user.id,
      username: user.username,
      text: message,
      timestamp: new Date().toISOString(),
    });
    
    setMessage("");
  };

  function getInitials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }

  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-base">Chat</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow h-full px-3 pb-3">
        <div className="space-y-4 py-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm p-4">
              No messages yet
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className="flex items-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(msg.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">{msg.username}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="icon" disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
