import http from 'http';
import app from './app';
import { setupWebSocketServer } from './websocket/server';
import { SERVER_CONFIG } from './utils/config';

const PORT = SERVER_CONFIG.port;

const server = http.createServer(app);

// Setup WebSocket server
const wss = setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}/ws`);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('\n👋 Shutting down gracefully...');
  
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
