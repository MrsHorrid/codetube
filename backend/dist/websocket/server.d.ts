import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
interface WebSocketClient extends WebSocket {
    userId?: string;
    sessionId?: string;
    currentTutorialId?: string;
}
interface SessionData {
    tutorialId: string;
    viewers: Set<string>;
}
declare const sessions: Map<string, SessionData>;
declare const clients: Map<string, WebSocketClient>;
export declare const setupWebSocketServer: (server: Server) => WebSocketServer;
export { sessions, clients };
//# sourceMappingURL=server.d.ts.map