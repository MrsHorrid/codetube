/**
 * WebSocket Client Tests
 *
 * Tests the WebSocket client wrapper including:
 * - Connection management
 * - Message sending/receiving
 * - Reconnection logic
 * - Event handlers
 */

import { WebSocketClient, getWebSocketClient } from '@/lib/websocket';

// Store original WebSocket
declare global {
  interface Window {
    _originalWebSocket: typeof WebSocket;
  }
}

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;

  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;

  private sentMessages: string[] = [];

  constructor(url: string | URL) {
    this.url = url.toString();
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (typeof data === 'string') {
      this.sentMessages.push(data);
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  // Test helper methods
  simulateMessage(data: any) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.(new MessageEvent('message', { data: message }));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  simulateDisconnect() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  getSentMessages() {
    return this.sentMessages;
  }
}

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockWs: MockWebSocket | null = null;

  beforeEach(() => {
    jest.useFakeTimers();

    // Replace global WebSocket with mock
    (global as any).WebSocket = jest.fn((url: string) => {
      mockWs = new MockWebSocket(url);
      return mockWs;
    });

    client = new WebSocketClient('ws://localhost:8000/ws');
  });

  afterEach(() => {
    client.disconnect();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Connection', () => {
    it('should connect to WebSocket server', () => {
      client.connect();
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws');
    });

    it('should not create duplicate connection if already connected', () => {
      client.connect();
      jest.advanceTimersByTime(20);

      client.connect();

      expect(global.WebSocket).toHaveBeenCalledTimes(1);
    });

    it('should call onConnect callbacks when connected', () => {
      const onConnect = jest.fn();
      client.onConnect(onConnect);

      client.connect();
      jest.advanceTimersByTime(20);

      expect(onConnect).toHaveBeenCalled();
    });

    it('should return connection status', () => {
      expect(client.isConnected()).toBe(false);

      client.connect();
      jest.advanceTimersByTime(20);

      expect(client.isConnected()).toBe(true);
    });

    it('should call onDisconnect callbacks when disconnected', () => {
      const onDisconnect = jest.fn();
      client.onDisconnect(onDisconnect);

      client.connect();
      jest.advanceTimersByTime(20);

      mockWs?.simulateDisconnect();

      expect(onDisconnect).toHaveBeenCalled();
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      client.connect();
      jest.advanceTimersByTime(20);
    });

    it('should send messages', () => {
      client.send('test-message', { data: 'value' });

      const messages = mockWs?.getSentMessages();
      expect(messages).toHaveLength(1);

      const parsed = JSON.parse(messages![0]);
      expect(parsed.type).toBe('test-message');
      expect(parsed.payload).toEqual({ data: 'value' });
    });

    it('should not send if not connected', () => {
      mockWs?.simulateDisconnect();

      // Should not throw
      expect(() => {
        client.send('test', {});
      }).not.toThrow();
    });

    it('should receive and dispatch messages', () => {
      const handler = jest.fn();
      client.on('test-event', handler);

      mockWs?.simulateMessage({
        type: 'test-event',
        payload: { key: 'value' },
      });

      expect(handler).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should handle multiple handlers for same event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      client.on('event', handler1);
      client.on('event', handler2);

      mockWs?.simulateMessage({ type: 'event', payload: {} });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should unsubscribe from events', () => {
      const handler = jest.fn();
      const unsubscribe = client.on('event', handler);

      unsubscribe();

      mockWs?.simulateMessage({ type: 'event', payload: {} });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle unknown message types gracefully', () => {
      // Should not throw
      mockWs?.simulateMessage({
        type: 'unknown-type',
        payload: {},
      });
    });

    it('should handle invalid JSON messages', () => {
      // Should not throw
      mockWs?.simulateMessage('invalid json {{{');
    });
  });

  describe('Reconnection', () => {
    it('should attempt to reconnect on disconnect', () => {
      client.connect();
      jest.advanceTimersByTime(20);

      mockWs?.simulateDisconnect();
      jest.advanceTimersByTime(1100); // First reconnect delay

      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for reconnection', () => {
      client.connect();
      jest.advanceTimersByTime(20);

      // First disconnect
      mockWs?.simulateDisconnect();
      jest.advanceTimersByTime(1000); // First attempt: ~1s

      // Second disconnect
      mockWs?.simulateDisconnect();
      jest.advanceTimersByTime(2000); // Second attempt: ~2s

      // Third disconnect
      mockWs?.simulateDisconnect();
      jest.advanceTimersByTime(4000); // Third attempt: ~4s

      expect(global.WebSocket).toHaveBeenCalledTimes(4);
    });

    it('should stop reconnecting after max attempts', () => {
      client.connect();

      for (let i = 0; i < 10; i++) {
        mockWs?.simulateDisconnect();
        jest.advanceTimersByTime(10000);
      }

      // Should not attempt more connections after max
      const callCount = (global.WebSocket as jest.Mock).mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(7); // 1 initial + 5 reconnects
    });

    it('should reset reconnect counter on successful connection', () => {
      client.connect();
      jest.advanceTimersByTime(20);

      mockWs?.simulateDisconnect();
      jest.advanceTimersByTime(1100);

      // Reconnected - counter should reset
      jest.advanceTimersByTime(20);

      // Next disconnect should start from beginning
      mockWs?.simulateDisconnect();
      jest.advanceTimersByTime(1100);

      expect(global.WebSocket).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      // Should not throw
      expect(() => {
        client.connect();
        mockWs?.simulateError();
      }).not.toThrow();
    });

    it('should handle errors during message send', () => {
      client.connect();
      jest.advanceTimersByTime(20);

      // Override send to throw
      mockWs!.send = () => {
        throw new Error('Send failed');
      };

      // Should not throw
      expect(() => {
        client.send('test', {});
      }).not.toThrow();
    });
  });

  describe('Disconnect', () => {
    it('should close connection on disconnect', () => {
      client.connect();
      jest.advanceTimersByTime(20);

      const closeSpy = jest.spyOn(mockWs!, 'close');
      client.disconnect();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', () => {
      // Should not throw
      expect(() => {
        client.disconnect();
      }).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getWebSocketClient', () => {
      const client1 = getWebSocketClient();
      const client2 = getWebSocketClient();

      expect(client1).toBe(client2);
    });
  });

  describe('Multiple Event Types', () => {
    beforeEach(() => {
      client.connect();
      jest.advanceTimersByTime(20);
    });

    it('should handle different message types independently', () => {
      const authHandler = jest.fn();
      const playbackHandler = jest.fn();
      const chatHandler = jest.fn();

      client.on('auth', authHandler);
      client.on('playback', playbackHandler);
      client.on('chat', chatHandler);

      mockWs?.simulateMessage({ type: 'auth', payload: { userId: '1' } });
      mockWs?.simulateMessage({ type: 'playback', payload: { timestamp: 1000 } });
      mockWs?.simulateMessage({ type: 'chat', payload: { message: 'hello' } });

      expect(authHandler).toHaveBeenCalledWith({ userId: '1' });
      expect(playbackHandler).toHaveBeenCalledWith({ timestamp: 1000 });
      expect(chatHandler).toHaveBeenCalledWith({ message: 'hello' });
    });

    it('should handle complex nested payloads', () => {
      const handler = jest.fn();
      client.on('complex-event', handler);

      const complexPayload = {
        user: { id: '1', name: 'Test' },
        data: { nested: { value: [1, 2, 3] } },
        timestamp: Date.now(),
      };

      mockWs?.simulateMessage({
        type: 'complex-event',
        payload: complexPayload,
      });

      expect(handler).toHaveBeenCalledWith(complexPayload);
    });
  });
});
