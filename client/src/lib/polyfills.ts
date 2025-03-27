// SimplePeer requires the global object which is not available in browsers
// Make sure this runs immediately without conditions
window.global = window;

// Create minimal process object with only what's needed by simple-peer
window.process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: require('next-tick')
} as any;

// Add Buffer from the buffer package
window.Buffer = require('buffer/').Buffer;