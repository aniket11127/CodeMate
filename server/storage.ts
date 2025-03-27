import {
  users,
  rooms,
  messages,
  snippets,
  waitlist,
  type User,
  type InsertUser,
  type Room,
  type InsertRoom,
  type Message,
  type InsertMessage,
  type Snippet,
  type InsertSnippet,
  type WaitlistEntry
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Room operations
  getRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoomCode(id: string, code: string, language: string): Promise<Room | undefined>;
  
  // Message operations
  getMessagesByRoom(roomId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Snippet operations
  getSnippetsByUser(userId: number): Promise<Snippet[]>;
  createSnippet(snippet: InsertSnippet): Promise<Snippet>;
  
  // Waitlist operations
  addToWaitlist(email: string): Promise<WaitlistEntry>;
  
  // Session store
  sessionStore: session.Store;
}

// PostgreSQL implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: db.$client, 
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Room operations
  async getRooms(): Promise<Room[]> {
    const result = await db.select().from(rooms).orderBy(desc(rooms.createdAt));
    return result;
  }
  
  async getRoom(id: string): Promise<Room | undefined> {
    const roomResult = await db.select().from(rooms).where(eq(rooms.id, id));
    if (roomResult.length === 0) return undefined;
    
    const room = roomResult[0];
    
    // Get all users who have sent messages to this room
    const messageUsers = await db
      .select({ 
        id: messages.senderId, 
        username: messages.senderName 
      })
      .from(messages)
      .where(eq(messages.roomId, id))
      .groupBy(messages.senderId, messages.senderName);
    
    // Add the room creator
    const participants = [
      { id: room.createdById, username: room.createdByUsername },
      ...messageUsers.filter(user => user.id !== room.createdById)
    ];
    
    return {
      ...room,
      participants
    };
  }
  
  async createRoom(room: InsertRoom): Promise<Room> {
    // Generate a random ID if not provided
    const roomWithId = {
      ...room,
      id: room.id || this.generateRoomId(),
      createdAt: new Date().toISOString()
    };
    
    const result = await db.insert(rooms).values(roomWithId).returning();
    return {
      ...result[0],
      participants: []
    };
  }
  
  private generateRoomId(): string {
    return Math.random().toString(16).substring(2, 16);
  }
  
  async updateRoomCode(id: string, code: string, language: string): Promise<Room | undefined> {
    const result = await db
      .update(rooms)
      .set({ code, language })
      .where(eq(rooms.id, id))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Reload the room to include participants
    return this.getRoom(id);
  }
  
  // Message operations
  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(asc(messages.timestamp));
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const messageWithDefaults = {
      ...insertMessage,
      timestamp: insertMessage.timestamp || new Date().toISOString()
    };
    
    const result = await db
      .insert(messages)
      .values(messageWithDefaults)
      .returning();
    
    return result[0];
  }
  
  // Snippet operations
  async getSnippetsByUser(userId: number): Promise<Snippet[]> {
    return await db
      .select()
      .from(snippets)
      .where(eq(snippets.userId, userId))
      .orderBy(desc(snippets.createdAt));
  }
  
  async createSnippet(insertSnippet: InsertSnippet): Promise<Snippet> {
    const snippetWithTimestamp = {
      ...insertSnippet,
      createdAt: new Date().toISOString()
    };
    
    const result = await db
      .insert(snippets)
      .values(snippetWithTimestamp)
      .returning();
    
    return result[0];
  }
  
  // Waitlist operations
  async addToWaitlist(email: string): Promise<WaitlistEntry> {
    try {
      const entry = {
        email,
        createdAt: new Date().toISOString()
      };
      
      const result = await db
        .insert(waitlist)
        .values(entry)
        .returning();
      
      return result[0];
    } catch (error: any) {
      // Handle duplicate email (unique constraint violation)
      if (error.code === '23505') { // PostgreSQL unique violation error code
        const existing = await db
          .select()
          .from(waitlist)
          .where(eq(waitlist.email, email));
        
        return existing[0];
      }
      throw error;
    }
  }
}

// Memory storage implementation for fallback or testing
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<string, Room>;
  private messages: Message[];
  private snippets: Snippet[];
  private waitlist: WaitlistEntry[];
  private usersCounter: number;
  private messagesCounter: number;
  private snippetsCounter: number;
  private waitlistCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.messages = [];
    this.snippets = [];
    this.waitlist = [];
    this.usersCounter = 1;
    this.messagesCounter = 1;
    this.snippetsCounter = 1;
    this.waitlistCounter = 1;
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.usersCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Room operations
  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }
  
  async getRoom(id: string): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    // Add participants info
    const participants = Array.from(this.users.values())
      .filter(user => this.messages.some(msg => msg.roomId === id && msg.senderId === user.id))
      .map(({ id, username }) => ({ id, username }));
    
    return {
      ...room,
      participants: [
        // Always include the creator
        { id: room.createdById, username: room.createdByUsername },
        // Add other participants who sent messages (avoiding duplicates)
        ...participants.filter(p => p.id !== room.createdById)
      ]
    };
  }
  
  async createRoom(room: InsertRoom): Promise<Room> {
    // Ensure code is not undefined by providing empty string as default
    const roomWithDefaults: Room = {
      ...room,
      code: room.code || null
    };
    this.rooms.set(room.id, roomWithDefaults);
    return roomWithDefaults;
  }
  
  async updateRoomCode(id: string, code: string, language: string): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = {
      ...room,
      code,
      language
    };
    
    this.rooms.set(id, updatedRoom);
    return this.getRoom(id);
  }
  
  // Message operations
  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return this.messages
      .filter(message => message.roomId === roomId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messagesCounter++;
    const message: Message = { ...insertMessage, id };
    this.messages.push(message);
    return message;
  }
  
  // Snippet operations
  async getSnippetsByUser(userId: number): Promise<Snippet[]> {
    return this.snippets
      .filter(snippet => snippet.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async createSnippet(insertSnippet: InsertSnippet): Promise<Snippet> {
    const id = this.snippetsCounter++;
    // Ensure roomId is not undefined by providing null as default
    const snippet: Snippet = { 
      ...insertSnippet, 
      id,
      roomId: insertSnippet.roomId || null 
    };
    this.snippets.push(snippet);
    return snippet;
  }
  
  // Waitlist operations
  async addToWaitlist(email: string): Promise<WaitlistEntry> {
    const existingEntry = this.waitlist.find(entry => entry.email === email);
    if (existingEntry) return existingEntry;
    
    const id = this.waitlistCounter++;
    const entry: WaitlistEntry = {
      id,
      email,
      createdAt: new Date().toISOString()
    };
    
    this.waitlist.push(entry);
    return entry;
  }
}

// Create the appropriate storage implementation based on environment
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
