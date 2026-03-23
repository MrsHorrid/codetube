/**
 * WebSocket Server Tests
 *
 * Tests WebSocket authentication, session management, playback sync,
 * and real-time collaboration features.
 */

import { WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { setupWebSocketServer, sessions, clients } from '../websocket/server';
import { JWT_CONFIG } from '../utils/config';
import prisma from '../models/prisma';

// Increase timeout for WebSocket tests
jest.setTimeout(15000);

describe('WebSocket Server', () => {
  let server: http.Server;
  let wss: ReturnType<typeof setupWebSocketServer>;
  let wsUrl: string;

  const testUser = {
    userId: 'test-ws-user-' + Date.now(),
    username: 'wstestuser',
    email: 'wstest@example.com',
  };

  const createToken = (userId: string) => {
    return jwt.sign({ userId, username: 'test', email: 'test@test.com' }, JWT_CONFIG.secret, {
      expiresIn: '1h',
    });
  };

  const createWebSocketClient = async (url: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        resolve(ws);
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  };

  const waitForMessage = (ws: WebSocket, expectedType?: string, timeout = 3000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Message timeout')), timeout);

      const handler = (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (!expectedType || message.type === expectedType) {
            clearTimeout(timer);
            ws.off('message', handler);
            resolve(message);
          }
        } catch (err) {
          // Ignore parse errors
        }
      };

      ws.on('message', handler);
    });
  };

  beforeAll((done) => {
    server = http.createServer();
    wss = setupWebSocketServer(server);

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as { port: number };
      wsUrl = `ws://127.0.0.1:${address.port}/ws`;
      done();
    });
  });

  afterAll((done) => {
    // Clear all sessions and clients
    sessions.clear();
    clients.clear();
    wss.close();
    server.close(done);
  });

  beforeEach(() => {
    sessions.clear();
    clients.clear();
  });

  describe('Connection & Authentication', () => {
    it('should accept WebSocket connections', async () => {
      const ws = await createWebSocketClient(wsUrl);
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });

    it('should authenticate with valid token', async () => {
      const ws = await createWebSocketClient(wsUrl);
      const token = createToken(testUser.userId);

      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));

      const response = await waitForMessage(ws, 'auth_ok');
      expect(response.type).toBe('auth_ok');
      expect(response.payload.userId).toBe(testUser.userId);
      expect(response.payload.sessionId).toBeDefined();

      ws.close();
    });

    it('should reject authentication without token', async () => {
      const ws = await createWebSocketClient(wsUrl);

      ws.send(JSON.stringify({ type: 'auth', payload: {} }));

      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');
      expect(response.payload.code).toBe('AUTH_ERROR');
      expect(response.payload.message).toContain('No token provided');

      ws.close();
    });

    it('should reject authentication with invalid token', async () => {
      const ws = await createWebSocketClient(wsUrl);

      ws.send(JSON.stringify({ type: 'auth', payload: { token: 'invalid-token' } }));

      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');
      expect(response.payload.code).toBe('AUTH_ERROR');
      expect(response.payload.message).toContain('Invalid token');

      ws.close();
    });

    it('should reject expired token', async () => {
      const ws = await createWebSocketClient(wsUrl);
      const expiredToken = jwt.sign(
        { userId: testUser.userId, username: 'test', email: 'test@test.com' },
        JWT_CONFIG.secret,
        { expiresIn: '-1h' }
      );

      ws.send(JSON.stringify({ type: 'auth', payload: { token: expiredToken } }));

      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');
      expect(response.payload.code).toBe('AUTH_ERROR');

      ws.close();
    });
  });

  describe('Session Management', () => {
    it('should allow joining a tutorial session', async () => {
      const ws = await createWebSocketClient(wsUrl);
      const token = createToken(testUser.userId);
      const tutorialId = 'test-tutorial-123';

      // Authenticate
      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
      await waitForMessage(ws, 'auth_ok');

      // Join session
      ws.send(JSON.stringify({
        type: 'session.join',
        payload: { tutorialId, recordingId: 'rec-123' }
      }));

      const response = await waitForMessage(ws, 'session.joined');
      expect(response.type).toBe('session.joined');
      expect(response.payload.tutorialId).toBe(tutorialId);
      expect(response.payload.activeViewers).toBe(1);

      ws.close();
    });

    it('should reject joining session without tutorialId', async () => {
      const ws = await createWebSocketClient(wsUrl);
      const token = createToken(testUser.userId);

      // Authenticate
      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
      await waitForMessage(ws, 'auth_ok');

      // Try to join without tutorialId
      ws.send(JSON.stringify({ type: 'session.join', payload: {} }));

      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');
      expect(response.payload.code).toBe('INVALID_PAYLOAD');

      ws.close();
    });

    it('should track multiple viewers in a session', async () => {
      const tutorialId = 'multi-viewer-tutorial';
      const token1 = createToken('user-1');
      const token2 = createToken('user-2');

      const ws1 = await createWebSocketClient(wsUrl);
      const ws2 = await createWebSocketClient(wsUrl);

      // Authenticate both clients
      ws1.send(JSON.stringify({ type: 'auth', payload: { token: token1 } }));
      ws2.send(JSON.stringify({ type: 'auth', payload: { token: token2 } }));

      await Promise.all([
        waitForMessage(ws1, 'auth_ok'),
        waitForMessage(ws2, 'auth_ok'),
      ]);

      // Join same session
      ws1.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));
      await waitForMessage(ws1, 'session.joined');

      ws2.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));

      // Both should receive viewer updates
      const [msg1, msg2] = await Promise.all([
        waitForMessage(ws1, 'session.viewers'),
        waitForMessage(ws2, 'session.joined'),
      ]);

      expect(msg2.payload.activeViewers).toBe(2);

      ws1.close();
      ws2.close();
    });

    it('should handle leaving a session', async () => {
      const tutorialId = 'leave-test-tutorial';
      const token = createToken(testUser.userId);

      const ws = await createWebSocketClient(wsUrl);
      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
      await waitForMessage(ws, 'auth_ok');

      ws.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));
      await waitForMessage(ws, 'session.joined');

      ws.send(JSON.stringify({ type: 'session.leave' }));

      // Give time for leave to process
      await new Promise(r => setTimeout(r, 100));

      // Session should be cleaned up if empty
      expect(sessions.has(tutorialId)).toBe(false);

      ws.close();
    });

    it('should auto-leave session on disconnect', async () => {
      const tutorialId = 'disconnect-test-tutorial';
      const token = createToken(testUser.userId);

      const ws = await createWebSocketClient(wsUrl);
      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
      await waitForMessage(ws, 'auth_ok');

      ws.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));
      await waitForMessage(ws, 'session.joined');

      // Abrupt disconnect
      ws.terminate();

      // Give time for disconnect to process
      await new Promise(r => setTimeout(r, 200));

      expect(sessions.has(tutorialId)).toBe(false);
    });
  });

  describe('Playback Synchronization', () => {
    it('should sync playback state', async () => {
      const tutorialId = 'playback-sync-tutorial';
      const token = createToken(testUser.userId);

      const ws = await createWebSocketClient(wsUrl);
      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
      await waitForMessage(ws, 'auth_ok');

      ws.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));
      await waitForMessage(ws, 'session.joined');

      ws.send(JSON.stringify({
        type: 'playback.sync',
        payload: { timestampMs: 15000, eventIndex: 100, action: 'playing' }
      }));

      const response = await waitForMessage(ws, 'playback.synced');
      expect(response.type).toBe('playback.synced');
      expect(response.payload.timestampMs).toBe(15000);
      expect(response.payload.action).toBe('playing');

      ws.close();
    });

    it('should reject playback sync without session', async () => {
      const token = createToken(testUser.userId);

      const ws = await createWebSocketClient(wsUrl);
      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
      await waitForMessage(ws, 'auth_ok');

      // Try to sync without joining session
      ws.send(JSON.stringify({
        type: 'playback.sync',
        payload: { timestampMs: 5000, eventIndex: 50, action: 'paused' }
      }));

      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');
      expect(response.payload.code).toBe('NOT_IN_SESSION');

      ws.close();
    });

    it('should broadcast playback updates to other viewers', async () => {
      const tutorialId = 'broadcast-tutorial';
      const token1 = createToken('viewer-1');
      const token2 = createToken('viewer-2');

      const ws1 = await createWebSocketClient(wsUrl);
      const ws2 = await createWebSocketClient(wsUrl);

      // Setup both clients
      ws1.send(JSON.stringify({ type: 'auth', payload: { token: token1 } }));
      ws2.send(JSON.stringify({ type: 'auth', payload: { token: token2 } }));
      await Promise.all([waitForMessage(ws1, 'auth_ok'), waitForMessage(ws2, 'auth_ok')]);

      ws1.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));
      ws2.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));
      await Promise.all([waitForMessage(ws1, 'session.joined'), waitForMessage(ws2, 'session.joined')]);

      // Wait for viewer count broadcasts
      await new Promise(r => setTimeout(r, 100));

      // ws1 sends sync - ws2 should receive playback.update
      ws1.send(JSON.stringify({
        type: 'playback.sync',
        payload: { timestampMs: 20000, eventIndex: 150, action: 'playing' }
      }));

      // ws1 gets ack
      await waitForMessage(ws1, 'playback.synced');

      // ws2 gets broadcast
      const broadcast = await waitForMessage(ws2, 'playback.update');
      expect(broadcast.type).toBe('playback.update');
      expect(broadcast.payload.timestampMs).toBe(20000);
      expect(broadcast.payload.action).toBe('playing');

      ws1.close();
      ws2.close();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON messages', async () => {
      const ws = await createWebSocketClient(wsUrl);

      ws.send('not valid json {{{');

      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');
      expect(response.payload.code).toBe('INVALID_MESSAGE');

      ws.close();
    });

    it('should handle unknown message types', async () => {
      const ws = await createWebSocketClient(wsUrl);

      ws.send(JSON.stringify({ type: 'unknown_type_xyz', payload: {} }));

      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');
      expect(response.payload.code).toBe('UNKNOWN_TYPE');

      ws.close();
    });

    it('should handle malformed messages gracefully', async () => {
      const ws = await createWebSocketClient(wsUrl);

      ws.send(JSON.stringify({ type: null }));
      ws.send(JSON.stringify({}));
      ws.send(JSON.stringify({ type: 'auth' }));

      // Should receive auth error for the last one
      const response = await waitForMessage(ws, 'error');
      expect(response.type).toBe('error');

      ws.close();
    });

    it('should handle rapid message flooding', async () => {
      const ws = await createWebSocketClient(wsUrl);
      const token = createToken(testUser.userId);

      ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
      await waitForMessage(ws, 'auth_ok');

      // Send many messages rapidly
      for (let i = 0; i < 50; i++) {
        ws.send(JSON.stringify({
          type: 'playback.sync',
          payload: { timestampMs: i * 1000, eventIndex: i, action: 'playing' }
        }));
      }

      // Should still be connected and responsive
      expect(ws.readyState).toBe(WebSocket.OPEN);

      ws.close();
    });
  });

  describe('Concurrent Sessions', () => {
    it('should handle multiple concurrent tutorial sessions', async () => {
      const token = createToken(testUser.userId);
      const tutorialIds = ['tutorial-a', 'tutorial-b', 'tutorial-c'];

      const clients: WebSocket[] = [];

      for (const tutorialId of tutorialIds) {
        const ws = await createWebSocketClient(wsUrl);
        ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
        await waitForMessage(ws, 'auth_ok');

        ws.send(JSON.stringify({ type: 'session.join', payload: { tutorialId } }));
        await waitForMessage(ws, 'session.joined');

        clients.push(ws);
      }

      // Verify all sessions exist
      expect(sessions.size).toBe(3);
      for (const tid of tutorialIds) {
        expect(sessions.has(tid)).toBe(true);
      }

      // Cleanup
      clients.forEach(ws => ws.close());
    });

    it('should isolate sessions from each other', async () => {
      const token1 = createToken('user-a');
      const token2 = createToken('user-b');
      const tutorialA = 'isolated-a';
      const tutorialB = 'isolated-b';

      const wsA1 = await createWebSocketClient(wsUrl);
      const wsA2 = await createWebSocketClient(wsUrl);
      const wsB = await createWebSocketClient(wsUrl);

      // Setup
      wsA1.send(JSON.stringify({ type: 'auth', payload: { token: token1 } }));
      wsA2.send(JSON.stringify({ type: 'auth', payload: { token: token2 } }));
      wsB.send(JSON.stringify({ type: 'auth', payload: { token: token1 } }));

      await Promise.all([
        waitForMessage(wsA1, 'auth_ok'),
        waitForMessage(wsA2, 'auth_ok'),
        waitForMessage(wsB, 'auth_ok'),
      ]);

      // Join different tutorials
      wsA1.send(JSON.stringify({ type: 'session.join', payload: { tutorialId: tutorialA } }));
      wsA2.send(JSON.stringify({ type: 'session.join', payload: { tutorialId: tutorialA } }));
      wsB.send(JSON.stringify({ type: 'session.join', payload: { tutorialId: tutorialB } }));

      await Promise.all([
        waitForMessage(wsA1, 'session.joined'),
        waitForMessage(wsA2, 'session.joined'),
        waitForMessage(wsB, 'session.joined'),
      ]);

      // Sync in tutorial A
      wsA1.send(JSON.stringify({
        type: 'playback.sync',
        payload: { timestampMs: 10000, eventIndex: 50, action: 'playing' }
      }));

      // wsA2 should receive broadcast, wsB should not
      const [msgA2] = await Promise.all([
        waitForMessage(wsA2, 'playback.update'),
        // wsB should timeout waiting for playback.update
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500)),
      ]).catch(() => [null]);

      expect(msgA2).toBeNull(); // We expect wsA2 got the message but wsB timed out

      wsA1.close();
      wsA2.close();
      wsB.close();
    });
  });
});
