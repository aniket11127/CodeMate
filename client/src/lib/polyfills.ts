// SimplePeer requires the global object which is not available in browsers
// Make sure this runs immediately without conditions
window.global = window;

// Create minimal process object with only what's needed by simple-peer
window.process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: function(fn: any) { setTimeout(fn, 0); }
} as any;

// Add Buffer to the global object for simple-peer
// This is a minimal implementation to make simple-peer work
import { Buffer as BufferPolyfill } from 'buffer';
window.Buffer = BufferPolyfill;

// Polyfill for events.EventEmitter
class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  removeListener(event: string, listener: Function): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.removeListener(event, onceWrapper);
    };
    return this.on(event, onceWrapper);
  }
}

// Mock util module
const util = {
  debuglog: () => () => {},
  inspect: (obj: any) => String(obj),
};

// Export the modules
(window as any).events = { EventEmitter };
(window as any).util = util;