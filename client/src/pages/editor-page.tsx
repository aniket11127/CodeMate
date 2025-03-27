import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useAuth } from "@/hooks/use-auth";
import { CodeEditor } from "@/components/code-editor/CodeEditor";
import { Chat } from "@/components/room/Chat";
import { OutputTerminal } from "@/components/room/OutputTerminal";
import { RoomHeader } from "@/components/room/RoomHeader";
import { CodeExecutionProvider } from "@/hooks/use-code-execution";
import { RoomProvider } from "@/hooks/use-room";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function EditorPage() {
  const { roomId: paramRoomId } = useParams<{ roomId?: string }>();
  const [roomId, setRoomId] = useState<string>(paramRoomId || "");
  const { user } = useAuth();

  // If no roomId provided, generate one
  useEffect(() => {
    if (!roomId) {
      const newRoomId = nanoid(10);
      setRoomId(newRoomId);
      
      // Update the URL without full page reload
      window.history.pushState(null, "", `/editor/${newRoomId}`);
    }
  }, [roomId]);

  if (!roomId || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Initializing room...</p>
      </div>
    );
  }

  return (
    <CodeExecutionProvider>
      <RoomProvider roomId={roomId}>
        <div className="flex flex-col h-screen overflow-hidden">
          <RoomHeader roomId={roomId} />
          
          <ResizablePanelGroup direction="horizontal" className="flex-grow">
            <ResizablePanel defaultSize={70} minSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={30}>
                  <CodeEditor roomId={roomId} />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={15}>
                  <OutputTerminal />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            
            <ResizableHandle />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              <Chat />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </RoomProvider>
    </CodeExecutionProvider>
  );
}
