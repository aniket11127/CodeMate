import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import { executeCode } from "./compile";
import { db } from "./db";
import { users, rooms, messages, snippets, waitlist } from "@shared/schema";

interface WebSocketClient extends WebSocket {
  userId?: number;
  username?: string;
  roomId?: string;
  isAlive: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the database if we're using PostgreSQL
  if (process.env.DATABASE_URL) {
    try {
      console.log("Using PostgreSQL with Drizzle ORM");
      
      // Simply make an initial query to verify the database connection
      const testResult = await db.select().from(users).limit(1);
      console.log("Database connection verified successfully");
    } catch (error) {
      console.error("Error connecting to database:", error);
    }
  }

  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // In-memory storage for active room connections
  const activeRooms = new Map<string, Set<WebSocketClient>>();
  
  // Set up WebSocket connection handling
  wss.on('connection', (ws: WebSocketClient, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const roomId = url.searchParams.get('roomId');
    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');
    
    if (!roomId || !userId || !username) {
      ws.close(1008, 'Missing required parameters');
      return;
    }
    
    // Set up client properties
    ws.roomId = roomId;
    ws.userId = parseInt(userId);
    ws.username = username;
    ws.isAlive = true;
    
    // Add client to room
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Set());
    }
    activeRooms.get(roomId)?.add(ws);
    
    // Notify other room members about new user
    broadcastToRoom(roomId, {
      type: 'user_joined',
      username,
      userId,
      timestamp: new Date().toISOString()
    }, ws);
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'code_update') {
          broadcastToRoom(roomId, data, ws);
          // Also save to database periodically
          if (data.shouldPersist) {
            await storage.updateRoomCode(roomId, data.code, data.language);
          }
        } else if (data.type === 'chat_message') {
          // Store message in database
          const savedMessage = await storage.createMessage({
            content: data.content,
            senderId: parseInt(userId),
            senderName: username,
            roomId,
            timestamp: new Date().toISOString()
          });
          
          // Broadcast to all clients in the room
          broadcastToRoom(roomId, {
            type: 'chat_message',
            ...savedMessage
          }, ws);
        } 
        // Handle video chat messages
        else if (data.type === 'video_join') {
          // Broadcast to all clients in the room
          broadcastToRoom(roomId, data);
        } else if (data.type === 'video_offer' || data.type === 'video_answer' || data.type === 'video_ice_candidate') {
          // Forward the offer/answer/candidate to the specific target client
          const targetClient = Array.from(activeRooms.get(roomId) || [])
            .find(client => client.userId === data.target) as WebSocketClient;
            
          if (targetClient && targetClient.readyState === WebSocket.OPEN) {
            targetClient.send(JSON.stringify(data));
          }
        } else if (data.type === 'video_leave') {
          // Broadcast to all clients in the room
          broadcastToRoom(roomId, data);
        } else if (data.type === 'cursor_update') {
          // Broadcast cursor position to all clients in the room
          broadcastToRoom(roomId, data);
        } else if (data.type === 'language_update') {
          // Broadcast language change to all clients in the room
          broadcastToRoom(roomId, data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle pings to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (ws.roomId && activeRooms.has(ws.roomId)) {
        const room = activeRooms.get(ws.roomId)!;
        room.delete(ws);
        
        // Clean up empty rooms
        if (room.size === 0) {
          activeRooms.delete(ws.roomId);
        } else {
          // Notify others that user left
          broadcastToRoom(ws.roomId, {
            type: 'user_left',
            username: ws.username,
            userId: ws.userId,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });
  
  // Keep connections alive with ping/pong
  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as WebSocketClient;
      if (!ws.isAlive) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  // Helper to broadcast messages to all clients in a room
  function broadcastToRoom(roomId: string, data: any, sender?: WebSocketClient) {
    const clients = activeRooms.get(roomId);
    if (!clients) return;
    
    const message = JSON.stringify(data);
    
    clients.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // API routes
  // Rooms
  app.get('/api/rooms', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/rooms/:id', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      const room = await storage.getRoom(req.params.id);
      if (!room) return res.status(404).send('Room not found');
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/rooms', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      
      const { name, language } = req.body;
      if (!name || !language) return res.status(400).send('Name and language are required');
      
      const roomId = randomBytes(8).toString('hex');
      const room = await storage.createRoom({
        id: roomId,
        name,
        language,
        code: '',
        createdById: req.user.id,
        createdByUsername: req.user.username,
        createdAt: new Date().toISOString()
      });
      
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/rooms/:id', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      
      const { code, language } = req.body;
      if (code === undefined || !language) return res.status(400).send('Code and language are required');
      
      const room = await storage.updateRoomCode(req.params.id, code, language);
      if (!room) return res.status(404).send('Room not found');
      
      res.json(room);
    } catch (error) {
      next(error);
    }
  });

  // Messages
  app.get('/api/rooms/:roomId/messages', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      
      const messages = await storage.getMessagesByRoom(req.params.roomId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/rooms/:roomId/messages', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      
      const { content } = req.body;
      if (!content) return res.status(400).send('Message content is required');
      
      const message = await storage.createMessage({
        content,
        senderId: req.user.id,
        senderName: req.user.username,
        roomId: req.params.roomId,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });

  // Code snippets
  app.get('/api/snippets', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      
      const snippets = await storage.getSnippetsByUser(req.user.id);
      res.json(snippets);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/snippets', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      
      const { title, code, language, roomId } = req.body;
      if (!title || !code || !language) {
        return res.status(400).send('Title, code, and language are required');
      }
      
      const snippet = await storage.createSnippet({
        title,
        code,
        language,
        userId: req.user.id,
        roomId,
        createdAt: new Date().toISOString()
      });
      
      res.status(201).json(snippet);
    } catch (error) {
      next(error);
    }
  });

  // Code execution
  app.post('/api/compile', async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
      
      const { code, language } = req.body;
      if (!code || !language) return res.status(400).send('Code and language are required');
      
      const result = await executeCode(code, language);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Waitlist API
  app.post('/api/waitlist', async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).send('Email is required');
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email format');
      }
      
      const waitlistEntry = await storage.addToWaitlist(email);
      res.status(201).json(waitlistEntry);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
