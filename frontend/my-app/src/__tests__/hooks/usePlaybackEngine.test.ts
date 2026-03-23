/**
 * usePlaybackEngine Hook Tests
 *
 * Tests the playback engine hook including:
 * - Event application (insert, delete, cursor, selection, scroll)
 * - Typing animation
 * - Playback loop
 * - Seek behavior
 * - Speed control
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlaybackEngine } from '@/hooks/usePlaybackEngine';
import type { PlaybackEvent, Recording } from '@/types/codetube';

// Mock editor ref
const createMockEditorRef = () => ({
  current: {
    insertText: jest.fn(),
    applyEdit: jest.fn(),
    setCursorPosition: jest.fn(),
    highlightRange: jest.fn(),
    clearHighlight: jest.fn(),
    setValue: jest.fn(),
    getEditor: jest.fn(() => ({
      revealLineInCenter: jest.fn(),
    })),
  },
});

const mockRecording: Recording = {
  id: 'test-recording',
  title: 'Test',
  language: 'typescript',
  initialCode: '',
  finalCode: 'console.log("hello")',
  duration: 30000,
  events: [
    {
      timestamp: 0,
      type: 'insert',
      data: { text: 'const x = 1;', position: { line: 1, column: 1 } },
    },
    {
      timestamp: 5000,
      type: 'cursor',
      data: { line: 2, column: 1, animate: true },
    },
    {
      timestamp: 10000,
      type: 'insert',
      data: { text: 'console.log(x)', position: { line: 2, column: 1 } },
    },
    {
      timestamp: 15000,
      type: 'selection',
      data: { range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 12 } },
    },
    {
      timestamp: 20000,
      type: 'delete',
      data: { range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 12 } },
    },
    {
      timestamp: 25000,
      type: 'scroll',
      data: { line: 5 },
    },
  ],
  checkpoints: [
    { id: 'cp-1', timestamp: 8000, label: 'First', codeSnapshot: '', cursorPosition: { line: 1, column: 1 } },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  instructor: { id: '1', name: 'Test' },
};

describe('usePlaybackEngine', () => {
  let mockEditorRef: ReturnType<typeof createMockEditorRef>;

  beforeEach(() => {
    mockEditorRef = createMockEditorRef();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      expect(result.current.state.isPlaying).toBe(false);
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.currentTime).toBe(0);
      expect(result.current.state.totalDuration).toBe(30000);
      expect(result.current.state.speed).toBe(1);
      expect(result.current.state.currentEventIndex).toBe(0);
    });

    it('should call onStateChange when state changes', async () => {
      const onStateChange = jest.fn();

      renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
          onStateChange,
        })
      );

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith({
          currentTime: 0,
          isPlaying: false,
          isPaused: false,
        });
      });
    });
  });

  describe('Event Application', () => {
    it('should apply insert events', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.play();
      });

      // Manually trigger event application by seeking past first event
      act(() => {
        result.current.seek(1000);
      });

      expect(mockEditorRef.current.insertText).toHaveBeenCalledWith(
        'const x = 1;',
        { lineNumber: 1, column: 1 }
      );
    });

    it('should apply cursor events', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(6000);
      });

      expect(mockEditorRef.current.setCursorPosition).toHaveBeenCalledWith(
        2, 1, true
      );
    });

    it('should apply delete events', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(21000);
      });

      expect(mockEditorRef.current.applyEdit).toHaveBeenCalledWith({
        range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 12 },
        text: '',
      });
    });

    it('should apply selection events', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(16000);
      });

      expect(mockEditorRef.current.highlightRange).toHaveBeenCalledWith(
        { startLine: 1, startColumn: 1, endLine: 1, endColumn: 12 },
        'codetube-selection'
      );
    });

    it('should handle scroll events', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(26000);
      });

      expect(mockEditorRef.current.getEditor()?.revealLineInCenter).toHaveBeenCalledWith(5);
    });

    it('should call onEvent callback', () => {
      const onEvent = jest.fn();
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
          onEvent,
        })
      );

      act(() => {
        result.current.seek(1000);
      });

      expect(onEvent).toHaveBeenCalled();
    });
  });

  describe('Playback Controls', () => {
    it('should start playback with play()', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.play();
      });

      expect(result.current.state.isPlaying).toBe(true);
      expect(result.current.state.isPaused).toBe(false);
    });

    it('should pause playback with pause()', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.play();
        result.current.pause();
      });

      expect(result.current.state.isPlaying).toBe(true);
      expect(result.current.state.isPaused).toBe(true);
    });

    it('should resume playback with resume()', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.play();
        result.current.pause();
        result.current.resume();
      });

      expect(result.current.state.isPaused).toBe(false);
    });

    it('should stop and reset with stop()', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(15000);
        result.current.stop();
      });

      expect(result.current.state.isPlaying).toBe(false);
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.currentTime).toBe(0);
      expect(mockEditorRef.current.setValue).toHaveBeenCalledWith('');
    });

    it('should change speed with setSpeed()', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.setSpeed(2);
      });

      expect(result.current.state.speed).toBe(2);
    });
  });

  describe('Seek Behavior', () => {
    it('should seek to specific time', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(15000);
      });

      expect(result.current.state.currentTime).toBe(15000);
    });

    it('should reconstruct editor state when seeking', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(12000);
      });

      // Should reset to initial code
      expect(mockEditorRef.current.setValue).toHaveBeenCalledWith('');

      // Should apply events up to 12000ms
      expect(mockEditorRef.current.insertText).toHaveBeenCalled();
    });

    it('should jump to next checkpoint', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.jumpToNextCheckpoint();
      });

      expect(result.current.state.currentTime).toBe(8000);
    });

    it('should jump to previous checkpoint', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.seek(15000);
        result.current.jumpToPreviousCheckpoint();
      });

      expect(result.current.state.currentTime).toBe(8000);
    });
  });

  describe('Playback Loop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should call onComplete when playback finishes', () => {
      const onComplete = jest.fn();
      const shortRecording = {
        ...mockRecording,
        duration: 100,
        events: [],
      };

      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: shortRecording,
          editorRef: mockEditorRef as any,
          onComplete,
        })
      );

      act(() => {
        result.current.play();
      });

      // Fast forward past duration
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should call onCheckpointReached when checkpoint is passed', () => {
      const onCheckpointReached = jest.fn();

      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
          onCheckpointReached,
        })
      );

      act(() => {
        result.current.seek(9000);
      });

      expect(onCheckpointReached).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing editor ref gracefully', () => {
      const emptyRef = { current: null };

      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: emptyRef as any,
        })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.seek(1000);
        });
      }).not.toThrow();
    });

    it('should handle empty recording', () => {
      const emptyRecording: Recording = {
        ...mockRecording,
        events: [],
        duration: 0,
      };

      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: emptyRecording,
          editorRef: mockEditorRef as any,
        })
      );

      expect(result.current.state.totalDuration).toBe(0);
    });

    it('should handle events with missing data', () => {
      const recordingWithInvalidEvents: Recording = {
        ...mockRecording,
        events: [
          { timestamp: 0, type: 'insert', data: {} },
          { timestamp: 1000, type: 'cursor', data: {} },
        ] as PlaybackEvent[],
      };

      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: recordingWithInvalidEvents,
          editorRef: mockEditorRef as any,
        })
      );

      // Should not throw
      expect(() => {
        act(() => {
          result.current.seek(2000);
        });
      }).not.toThrow();
    });

    it('should handle rapid play/pause toggles', () => {
      const { result } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      act(() => {
        result.current.play();
        result.current.pause();
        result.current.resume();
        result.current.pause();
        result.current.play();
      });

      expect(result.current.state.isPlaying).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cancel animation frame on unmount', () => {
      const cancelAnimationFrameSpy = jest.spyOn(global, 'cancelAnimationFrame');

      const { unmount } = renderHook(() =>
        usePlaybackEngine({
          recording: mockRecording,
          editorRef: mockEditorRef as any,
        })
      );

      unmount();

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });
});
