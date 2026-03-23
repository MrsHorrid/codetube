import '@testing-library/jest-dom';
import React from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { ...props, alt: props.alt || '' });
  },
}));

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: function MockEditor({ value, onChange, onMount }: any) {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: () => value,
          setValue: (v: string) => onChange?.(v),
          getModel: () => ({
            getValueLength: () => value?.length || 0,
            getPositionAt: () => ({ lineNumber: 1, column: 1 }),
            applyEdits: jest.fn(),
            pushEditOperations: jest.fn(),
          }),
          onDidChangeModelContent: (cb: any) => {
            (mockEditor as any)._contentCallback = cb;
            return { dispose: jest.fn() };
          },
          onDidChangeCursorPosition: (cb: any) => {
            (mockEditor as any)._cursorCallback = cb;
            return { dispose: jest.fn() };
          },
          onDidFocusEditorText: (cb: any) => {
            (mockEditor as any)._focusCallback = cb;
            return { dispose: jest.fn() };
          },
          setPosition: jest.fn(),
          revealPositionInCenterIfOutsideViewport: jest.fn(),
          revealLineInCenter: jest.fn(),
          focus: jest.fn(),
          deltaDecorations: jest.fn(() => []),
          getPosition: () => ({ lineNumber: 1, column: 1 }),
        };
        onMount(mockEditor);
      }
    }, [onMount]);

    return React.createElement('div', { 'data-testid': 'monaco-editor', 'data-value': value },
      React.createElement('textarea', {
        'data-testid': 'mock-editor-textarea',
        value: value || '',
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      })
    );
  },
  loader: {
    config: jest.fn(),
    init: jest.fn(() => Promise.resolve({
      editor: {
        defineTheme: jest.fn(),
      },
      languages: {
        typescript: {
          typescriptDefaults: {
            setCompilerOptions: jest.fn(),
          },
        },
      },
    })),
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock WebSocket
global.WebSocket = class WebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = WebSocket.OPEN;
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;

  constructor(public url: string | URL) {}

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {}

  close() {
    this.readyState = WebSocket.CLOSED;
  }
} as any;

// Suppress console errors during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
