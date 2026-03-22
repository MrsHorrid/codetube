"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const server_1 = require("./websocket/server");
const config_1 = require("./utils/config");
const PORT = config_1.SERVER_CONFIG.port;
const server = http_1.default.createServer(app_1.default);
// Setup WebSocket server
const wss = (0, server_1.setupWebSocketServer)(server);
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
//# sourceMappingURL=index.js.map