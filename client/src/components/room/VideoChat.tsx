import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';

// We'll dynamically import SimplePeer
let SimplePeerModule: any = null;

interface VideoChatProps {
  roomId: string;
  webSocket: WebSocket | null;
}

interface PeerConnection {
  userId: number;
  peer: any; // Dynamic SimplePeer instance
  username: string;
  stream?: MediaStream;
}

export function VideoChat({ roomId, webSocket }: VideoChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Record<number, PeerConnection>>({});
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Record<number, PeerConnection>>({});
  
  // Remove a peer connection
  const removePeer = useCallback((userId: number) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.destroy();
      const updatedPeers = { ...peersRef.current };
      delete updatedPeers[userId];
      peersRef.current = updatedPeers;
      setPeers(updatedPeers);
    }
  }, []);
  
  // Handle new ICE candidate
  const handleNewICECandidate = useCallback((data: any) => {
    const { userId, candidate } = data;
    
    if (peersRef.current[userId] && candidate) {
      peersRef.current[userId].peer.signal({ type: 'candidate', candidate });
    }
  }, []);
  
  // Handle incoming video answer
  const handleVideoAnswer = useCallback((data: any) => {
    const { userId, signal } = data;
    
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.signal(signal);
    }
  }, []);
  
  // Create a new peer connection
  const createPeer = useCallback((userId: number, username: string, initiator: boolean) => {
    if (!localStream || !SimplePeerModule) return;
    
    const peer = new SimplePeerModule({
      initiator,
      stream: localStream,
      trickle: true
    });
    
    peer.on('signal', (signal: any) => {
      if (!webSocket || webSocket.readyState !== WebSocket.OPEN || !user) return;
      
      webSocket.send(JSON.stringify({
        type: initiator ? 'video_offer' : 'video_answer',
        signal,
        userId: user.id,
        target: userId,
        roomId
      }));
    });
    
    peer.on('stream', (remoteStream: MediaStream) => {
      // Add remote stream to the peer object
      const updatedPeers = { ...peersRef.current };
      if (updatedPeers[userId]) {
        updatedPeers[userId].stream = remoteStream;
        peersRef.current = updatedPeers;
        setPeers(updatedPeers);
      }
    });
    
    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
      toast({
        title: 'Connection Error',
        description: 'There was an error with the video connection',
        variant: 'destructive'
      });
    });
    
    const peerObj: PeerConnection = { peer, userId, username };
    peersRef.current[userId] = peerObj;
    setPeers(prev => ({ ...prev, [userId]: peerObj }));
  }, [localStream, SimplePeerModule, webSocket, user, roomId, toast]);
  
  // Handle incoming video offer
  const handleVideoOffer = useCallback((data: any) => {
    const { userId, username, signal } = data;
    
    // Create a new peer if it doesn't exist
    if (!peersRef.current[userId]) {
      createPeer(userId, username, false);
    }
    
    // Signal the peer with the received offer
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.signal(signal);
    }
  }, [createPeer]);
  
  // Dynamically load SimplePeer
  useEffect(() => {
    if (isCalling && !SimplePeerModule) {
      import('simple-peer').then(module => {
        SimplePeerModule = module.default;
      }).catch(error => {
        console.error('Error loading SimplePeer:', error);
        toast({
          title: 'Failed to load video chat module',
          description: 'There was an error loading the video chat feature',
          variant: 'destructive'
        });
        setIsCalling(false);
      });
    }
  }, [isCalling, toast]);

  // Initialize WebRTC
  useEffect(() => {
    if (!webSocket || !user || !isCalling || !SimplePeerModule) return;

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Let other users know we're ready for a call
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.send(JSON.stringify({
            type: 'video_join',
            userId: user.id,
            username: user.username,
            roomId
          }));
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: 'Camera/Microphone Error',
          description: 'Could not access your camera or microphone. Please check permissions.',
          variant: 'destructive'
        });
        setIsCalling(false);
      }
    };
    
    startMedia();
    
    return () => {
      // Clean up local stream when component unmounts
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webSocket, user, roomId, isCalling, videoEnabled, audioEnabled]);
  
  // Handle WebSocket messages for video chat
  useEffect(() => {
    if (!webSocket || !user || !localStream || !SimplePeerModule) return;
    
    const handleWebSocketMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'video_join':
          // Someone wants to join the video chat
          if (data.userId !== user.id && localStream) {
            if (typeof createPeer === 'function') {
              createPeer(data.userId, data.username, true);
            }
          }
          break;
          
        case 'video_offer':
          // Received an offer from someone
          if (data.target === user.id && localStream) {
            if (typeof handleVideoOffer === 'function') {
              handleVideoOffer(data);
            }
          }
          break;
          
        case 'video_answer':
          // Received an answer to our offer
          if (data.target === user.id) {
            handleVideoAnswer(data);
          }
          break;
          
        case 'video_ice_candidate':
          // Received ICE candidate
          if (data.target === user.id) {
            handleNewICECandidate(data);
          }
          break;
          
        case 'video_leave':
          // Someone left the video chat
          if (data.userId !== user.id) {
            removePeer(data.userId);
          }
          break;
      }
    };
    
    webSocket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      webSocket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [webSocket, user, localStream, SimplePeerModule, createPeer, handleVideoOffer, handleVideoAnswer, handleNewICECandidate, removePeer]);
  

  
  // Toggle video on/off
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };
  
  // Toggle audio on/off
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };
  
  // End call
  const endCall = () => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN && user) {
      webSocket.send(JSON.stringify({
        type: 'video_leave',
        userId: user.id,
        roomId
      }));
    }
    
    // Stop all peer connections
    Object.values(peersRef.current).forEach((peer) => {
      peer.peer.destroy();
    });
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    setLocalStream(null);
    setPeers({});
    peersRef.current = {};
    setIsCalling(false);
  };

  // Start a call
  const startCall = () => {
    setIsCalling(true);
  };

  if (!isCalling) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Video Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={startCall} className="w-full">
            <Video className="mr-2 h-4 w-4" />
            Start Video Call
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 flex flex-col">
      <CardHeader className="py-3">
        <CardTitle className="text-base">Video Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="grid grid-cols-2 gap-2 p-2">
          {/* Local video */}
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="rounded-md w-full h-auto bg-muted"
            />
            <div className="absolute bottom-2 left-2 text-xs bg-background/70 px-2 py-1 rounded-full">
              {user?.username} (You)
            </div>
          </div>
          
          {/* Remote videos */}
          {Object.values(peers).map((peer) => (
            <div key={peer.userId} className="relative">
              <video
                autoPlay
                playsInline
                className="rounded-md w-full h-auto bg-muted"
                ref={(element) => {
                  if (element && peer.stream) {
                    element.srcObject = peer.stream;
                  }
                }}
              />
              <div className="absolute bottom-2 left-2 text-xs bg-background/70 px-2 py-1 rounded-full">
                {peer.username}
              </div>
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="flex justify-center gap-2 p-2 border-t">
          <Button 
            onClick={toggleVideo} 
            variant={videoEnabled ? "default" : "outline"}
            size="icon"
          >
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={toggleAudio} 
            variant={audioEnabled ? "default" : "outline"}
            size="icon"
          >
            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button onClick={endCall} variant="destructive" size="icon">
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}