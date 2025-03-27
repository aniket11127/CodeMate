import { Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoom } from "@/hooks/use-room";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoomHeaderProps {
  roomId: string;
}

export function RoomHeader({ roomId }: RoomHeaderProps) {
  const { toast } = useToast();
  const { users } = useRoom();

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Room ID copied",
      description: "The room ID has been copied to your clipboard.",
    });
  };

  return (
    <div className="flex justify-between items-center bg-card py-2 px-4 border-b">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">
          <span className="text-primary">Code</span>
          <span className="text-accent">Collab</span>
        </h1>
        <div className="flex items-center ml-4">
          <Badge variant="outline" className="text-xs">
            Room: {roomId}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={copyRoomId} className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy room ID</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{users.length}</span>
        </div>
        <div className="flex -space-x-2">
          {users.slice(0, 3).map((user, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground border-2 border-background">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.username}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {users.length > 3 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
              +{users.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
