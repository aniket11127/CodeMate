import { WebSocketMessage } from "../types";

export function initialConnection(roomId: string, userId?: number, username?: string): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  let wsUrl = `${protocol}//${window.location.host}/ws?roomId=${roomId}`;
  
  if (userId !== undefined && username) {
    wsUrl += `&userId=${userId}&username=${encodeURIComponent(username)}`;
  }
  
  return new WebSocket(wsUrl);
}

export function sendToWebSocket(ws: WebSocket, message: WebSocketMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.error("WebSocket is not open. Unable to send message.");
  }
}
