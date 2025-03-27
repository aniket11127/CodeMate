import { WebSocketMessage } from "@/types";

export function initialConnection(roomId: string): WebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws?roomId=${roomId}`;
  
  return new WebSocket(wsUrl);
}

export function sendToWebSocket(ws: WebSocket, message: WebSocketMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.error("WebSocket is not open. Unable to send message.");
  }
}
