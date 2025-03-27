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