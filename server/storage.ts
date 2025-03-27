import {
  users,
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

const MemoryStore = createMemoryStore(session);

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
  sessionStore: any; // Using any for session store type
}

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
  sessionStore: any; // Using any for session store type

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

export const storage = new MemStorage();
