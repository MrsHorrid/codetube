"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clients = exports.sessions = exports.setupWebSocketServer = void 0;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../utils/config");
const sessions = new Map();
exports.sessions = sessions;
const clients = new Map();
exports.clients = clients;
const setupWebSocketServer = (server) => {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleMessage(ws, message);
            }
            catch (error) {
                sendError(ws, 'INVALID_MESSAGE', 'Failed to parse message');
            }
        });
        ws.on('close', () => {
            handleDisconnect(ws);
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });
    return wss;
};
exports.setupWebSocketServer = setupWebSocketServer;
const handleMessage = (ws, message) => {
    switch (message.type) {
        case 'auth':
            handleAuth(ws, message.payload);
            break;
        case 'session.join':
            handleJoinSession(ws, message.payload);
            break;
        case 'session.leave':
            handleLeaveSession(ws);
            break;
        case 'playback.sync':
            handlePlaybackSync(ws, message.payload);
            break;
        default:
            sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${message.type}`);
    }
};
const handleAuth = (ws, payload) => {
    try {
        if (!payload?.token) {
            sendError(ws, 'AUTH_ERROR', 'No token provided');
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(payload.token, config_1.JWT_CONFIG.secret);
        ws.userId = decoded.userId;
        ws.sessionId = generateSessionId();
        clients.set(ws.sessionId, ws);
        sendMessage(ws, 'auth_ok', {
            userId: decoded.userId,
            sessionId: ws.sessionId,
        });
    }
    catch {
        sendError(ws, 'AUTH_ERROR', 'Invalid token');
    }
};
const handleJoinSession = (ws, payload) => {
    if (!payload?.tutorialId) {
        sendError(ws, 'INVALID_PAYLOAD', 'tutorialId is required');
        return;
    }
    // Leave current session if any
    handleLeaveSession(ws);
    ws.currentTutorialId = payload.tutorialId;
    // Get or create session
    let session = sessions.get(payload.tutorialId);
    if (!session) {
        session = { tutorialId: payload.tutorialId, viewers: new Set() };
        sessions.set(payload.tutorialId, session);
    }
    session.viewers.add(ws.sessionId || 'anonymous');
    sendMessage(ws, 'session.joined', {
        tutorialId: payload.tutorialId,
        sessionId: ws.sessionId,
        activeViewers: session.viewers.size,
    });
    // Broadcast viewer count to all clients in session
    broadcastToSession(payload.tutorialId, {
        type: 'session.viewers',
        payload: {
            tutorialId: payload.tutorialId,
            count: session.viewers.size,
        },
    }, ws);
};
const handleLeaveSession = (ws) => {
    if (ws.currentTutorialId) {
        const session = sessions.get(ws.currentTutorialId);
        if (session) {
            session.viewers.delete(ws.sessionId || 'anonymous');
            // Broadcast updated viewer count
            broadcastToSession(ws.currentTutorialId, {
                type: 'session.viewers',
                payload: {
                    tutorialId: ws.currentTutorialId,
                    count: session.viewers.size,
                },
            });
            // Clean up empty sessions
            if (session.viewers.size === 0) {
                sessions.delete(ws.currentTutorialId);
            }
        }
        ws.currentTutorialId = undefined;
    }
};
const handlePlaybackSync = (ws, payload) => {
    if (!ws.currentTutorialId) {
        sendError(ws, 'NOT_IN_SESSION', 'Not currently in a session');
        return;
    }
    // Acknowledge sync
    sendMessage(ws, 'playback.synced', {
        timestampMs: payload?.timestampMs || 0,
        action: payload?.action || 'playing',
    });
    // Broadcast to other viewers in the same session
    broadcastToSession(ws.currentTutorialId, {
        type: 'playback.update',
        payload: {
            userId: ws.userId,
            timestampMs: payload?.timestampMs,
            action: payload?.action,
        },
    }, ws);
};
const handleDisconnect = (ws) => {
    handleLeaveSession(ws);
    if (ws.sessionId) {
        clients.delete(ws.sessionId);
    }
    console.log('WebSocket client disconnected');
};
const sendMessage = (ws, type, payload) => {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, payload }));
    }
};
const sendError = (ws, code, message) => {
    sendMessage(ws, 'error', { code, message });
};
const broadcastToSession = (tutorialId, message, excludeWs) => {
    const session = sessions.get(tutorialId);
    if (!session)
        return;
    session.viewers.forEach((sessionId) => {
        const client = clients.get(sessionId);
        if (client && client !== excludeWs && client.currentTutorialId === tutorialId) {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        }
    });
};
const generateSessionId = () => {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
//# sourceMappingURL=server.js.map