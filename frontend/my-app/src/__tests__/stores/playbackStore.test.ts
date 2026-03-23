/**
 * Playback Store Tests
 *
 * Tests Zustand store state management, state transitions,
 * and store actions for the playback system.
 */

import { act, renderHook } from '@testing-library/react';
import { usePlaybackStore } from '@/stores/playbackStore';
import type { Recording, Checkpoint } from '@/types/codetube';

// Mock recording data
const mockRecording: Recording = {
  id: 'test-recording-1',
  title: 'Test Recording',
  language: 'typescript',
  initialCode: '// Initial code',
  finalCode: '// Final code',
  duration: 60000, // 60 seconds
  events: [
    { timestamp: 0, type: 'insert', data: { text: 'const x = 1;', position: { line: 1, column: 1 } } },
    { timestamp: 5000, type: 'cursor', data: { line: 2, column: 1 } },
    { timestamp: 10000, type: 'insert', data: { text: 'console.log(x);', position: { line: 2, column: 1 } } },
    { timestamp: 15000, type: 'scroll', data: { line: 5 } },
  ],
  checkpoints: [
    { id: 'cp-1', timestamp: 5000, label: 'First Checkpoint', codeSnapshot: '// cp1', cursorPosition: { line: 1, column: 1 } },
    { id: 'cp-2', timestamp: 15000, label: 'Second Checkpoint', codeSnapshot: '// cp2', cursorPosition: { line: 2, column: 1 } },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  instructor: {
    id: 'instructor-1',
    name: 'Test Instructor',
  },
};

describe('Playback Store', () => {
  // Reset store before each test
  beforeEach(() => {
    act(() => {
      usePlaybackStore.setState({
        recording: null,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        totalDuration: 0,
        speed: 1,
        loop: false,
        currentEventIndex: 0,
        mode: 'following',
        hasChanges: false,
        currentCheckpoint: null,
      });
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = usePlaybackStore.getState();

      expect(state.recording).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(state.totalDuration).toBe(0);
      expect(state.speed).toBe(1);
      expect(state.loop).toBe(false);
      expect(state.currentEventIndex).toBe(0);
      expect(state.mode).toBe('following');
      expect(state.hasChanges).toBe(false);
      expect(state.currentCheckpoint).toBeNull();
    });
  });

  describe('setRecording', () => {
    it('should set recording and reset playback state', () => {
      act(() => {
        usePlaybackStore.getState().setRecording(mockRecording);
      });

      const state = usePlaybackStore.getState();
      expect(state.recording).toEqual(mockRecording);
      expect(state.totalDuration).toBe(mockRecording.duration);
      expect(state.currentTime).toBe(0);
      expect(state.currentEventIndex).toBe(0);
    });

    it('should handle null recording', () => {
      act(() => {
        usePlaybackStore.getState().setRecording(null);
      });

      const state = usePlaybackStore.getState();
      expect(state.recording).toBeNull();
      expect(state.totalDuration).toBe(0);
    });
  });

  describe('Playback Controls', () => {
    beforeEach(() => {
      act(() => {
        usePlaybackStore.getState().setRecording(mockRecording);
      });
    });

    describe('play', () => {
      it('should set isPlaying to true and isPaused to false', () => {
        act(() => {
          usePlaybackStore.getState().play();
        });

        const state = usePlaybackStore.getState();
        expect(state.isPlaying).toBe(true);
        expect(state.isPaused).toBe(false);
      });
    });

    describe('pause', () => {
      it('should set isPaused to true while playing', () => {
        act(() => {
          usePlaybackStore.getState().play();
          usePlaybackStore.getState().pause();
        });

        const state = usePlaybackStore.getState();
        expect(state.isPlaying).toBe(true);
        expect(state.isPaused).toBe(true);
      });
    });

    describe('resume', () => {
      it('should set isPaused to false', () => {
        act(() => {
          usePlaybackStore.getState().play();
          usePlaybackStore.getState().pause();
          usePlaybackStore.getState().resume();
        });

        const state = usePlaybackStore.getState();
        expect(state.isPaused).toBe(false);
        expect(state.isPlaying).toBe(true);
      });
    });

    describe('stop', () => {
      it('should reset playback to initial state', () => {
        // First advance time
        act(() => {
          usePlaybackStore.getState().play();
          usePlaybackStore.getState().updateTime(10000);
        });

        expect(usePlaybackStore.getState().currentTime).toBe(10000);

        // Then stop
        act(() => {
          usePlaybackStore.getState().stop();
        });

        const state = usePlaybackStore.getState();
        expect(state.isPlaying).toBe(false);
        expect(state.isPaused).toBe(false);
        expect(state.currentTime).toBe(0);
        expect(state.currentEventIndex).toBe(0);
      });
    });
  });

  describe('seek', () => {
    beforeEach(() => {
      act(() => {
        usePlaybackStore.getState().setRecording(mockRecording);
      });
    });

    it('should update currentTime and find event index', () => {
      act(() => {
        usePlaybackStore.getState().seek(8000);
      });

      const state = usePlaybackStore.getState();
      expect(state.currentTime).toBe(8000);
      expect(state.currentEventIndex).toBe(2); // First event after 8000ms
    });

    it('should clamp time to valid range', () => {
      act(() => {
        usePlaybackStore.getState().seek(-1000);
      });
      expect(usePlaybackStore.getState().currentTime).toBe(0);

      act(() => {
        usePlaybackStore.getState().seek(100000);
      });
      expect(usePlaybackStore.getState().currentTime).toBe(60000);
    });

    it('should update current checkpoint', () => {
      act(() => {
        usePlaybackStore.getState().seek(7000);
      });

      const state = usePlaybackStore.getState();
      expect(state.currentCheckpoint?.id).toBe('cp-1');
    });

    it('should find correct event index at boundaries', () => {
      act(() => {
        usePlaybackStore.getState().seek(0);
      });
      expect(usePlaybackStore.getState().currentEventIndex).toBe(1);

      act(() => {
        usePlaybackStore.getState().seek(15000);
      });
      expect(usePlaybackStore.getState().currentEventIndex).toBe(4);
    });
  });

  describe('setSpeed', () => {
    it('should update playback speed', () => {
      act(() => {
        usePlaybackStore.getState().setSpeed(2);
      });
      expect(usePlaybackStore.getState().speed).toBe(2);
    });

    it('should clamp speed to minimum 0.25', () => {
      act(() => {
        usePlaybackStore.getState().setSpeed(0.1);
      });
      expect(usePlaybackStore.getState().speed).toBe(0.25);
    });

    it('should clamp speed to maximum 3', () => {
      act(() => {
        usePlaybackStore.getState().setSpeed(5);
      });
      expect(usePlaybackStore.getState().speed).toBe(3);
    });
  });

  describe('updateTime', () => {
    beforeEach(() => {
      act(() => {
        usePlaybackStore.getState().setRecording(mockRecording);
        usePlaybackStore.getState().play();
      });
    });

    it('should advance time based on delta and speed', () => {
      act(() => {
        usePlaybackStore.getState().setSpeed(2);
        usePlaybackStore.getState().updateTime(1000);
      });

      expect(usePlaybackStore.getState().currentTime).toBe(2000);
    });

    it('should update event index as time advances', () => {
      act(() => {
        usePlaybackStore.getState().updateTime(6000);
      });

      expect(usePlaybackStore.getState().currentEventIndex).toBe(2);
    });

    it('should stop playback when reaching end', () => {
      act(() => {
        usePlaybackStore.getState().updateTime(65000);
      });

      const state = usePlaybackStore.getState();
      expect(state.currentTime).toBe(60000);
      expect(state.isPlaying).toBe(false);
    });

    it('should update checkpoint when passing one', () => {
      act(() => {
        usePlaybackStore.getState().updateTime(6000);
      });

      expect(usePlaybackStore.getState().currentCheckpoint?.id).toBe('cp-1');
    });
  });

  describe('Mode Management', () => {
    it('should set mode to following', () => {
      act(() => {
        usePlaybackStore.getState().setMode('following');
      });
      expect(usePlaybackStore.getState().mode).toBe('following');
    });

    it('should set mode to exploring', () => {
      act(() => {
        usePlaybackStore.getState().setMode('exploring');
      });
      expect(usePlaybackStore.getState().mode).toBe('exploring');
    });

    it('should set mode to editing', () => {
      act(() => {
        usePlaybackStore.getState().setMode('editing');
      });
      expect(usePlaybackStore.getState().mode).toBe('editing');
    });
  });

  describe('Change Tracking', () => {
    it('should track hasChanges flag', () => {
      act(() => {
        usePlaybackStore.getState().setHasChanges(true);
      });
      expect(usePlaybackStore.getState().hasChanges).toBe(true);

      act(() => {
        usePlaybackStore.getState().setHasChanges(false);
      });
      expect(usePlaybackStore.getState().hasChanges).toBe(false);
    });
  });

  describe('Checkpoint Navigation', () => {
    beforeEach(() => {
      act(() => {
        usePlaybackStore.getState().setRecording(mockRecording);
      });
    });

    describe('jumpToNextCheckpoint', () => {
      it('should jump to next checkpoint', () => {
        act(() => {
          usePlaybackStore.getState().seek(1000);
          usePlaybackStore.getState().jumpToNextCheckpoint();
        });

        expect(usePlaybackStore.getState().currentTime).toBe(5000);
      });

      it('should not jump if already at last checkpoint', () => {
        act(() => {
          usePlaybackStore.getState().seek(15000);
          usePlaybackStore.getState().jumpToNextCheckpoint();
        });

        expect(usePlaybackStore.getState().currentTime).toBe(15000);
      });

      it('should handle no checkpoints', () => {
        act(() => {
          usePlaybackStore.getState().setRecording({
            ...mockRecording,
            checkpoints: [],
          });
          usePlaybackStore.getState().seek(1000);
          usePlaybackStore.getState().jumpToNextCheckpoint();
        });

        expect(usePlaybackStore.getState().currentTime).toBe(1000);
      });
    });

    describe('jumpToPreviousCheckpoint', () => {
      it('should jump to previous checkpoint', () => {
        act(() => {
          usePlaybackStore.getState().seek(10000);
          usePlaybackStore.getState().jumpToPreviousCheckpoint();
        });

        expect(usePlaybackStore.getState().currentTime).toBe(5000);
      });

      it('should not jump if before first checkpoint', () => {
        act(() => {
          usePlaybackStore.getState().seek(1000);
          usePlaybackStore.getState().jumpToPreviousCheckpoint();
        });

        expect(usePlaybackStore.getState().currentTime).toBe(1000);
      });

      it('should handle no checkpoints', () => {
        act(() => {
          usePlaybackStore.getState().setRecording({
            ...mockRecording,
            checkpoints: [],
          });
          usePlaybackStore.getState().seek(10000);
          usePlaybackStore.getState().jumpToPreviousCheckpoint();
        });

        expect(usePlaybackStore.getState().currentTime).toBe(10000);
      });
    });
  });

  describe('Complex State Transitions', () => {
    it('should handle full playback lifecycle', () => {
      const store = usePlaybackStore.getState();

      // Load recording
      act(() => {
        store.setRecording(mockRecording);
      });
      expect(store.isPlaying).toBe(false);

      // Start playback
      act(() => {
        store.play();
      });
      expect(store.isPlaying).toBe(true);
      expect(store.isPaused).toBe(false);

      // Pause
      act(() => {
        store.pause();
      });
      expect(store.isPaused).toBe(true);

      // Resume
      act(() => {
        store.resume();
      });
      expect(store.isPaused).toBe(false);

      // Advance time
      act(() => {
        store.updateTime(3000);
      });
      expect(store.currentTime).toBe(3000);

      // Seek while playing
      act(() => {
        store.seek(10000);
      });
      expect(store.currentTime).toBe(10000);

      // Stop
      act(() => {
        store.stop();
      });
      expect(store.isPlaying).toBe(false);
      expect(store.currentTime).toBe(0);
    });

    it('should handle speed changes during playback', () => {
      act(() => {
        usePlaybackStore.getState().setRecording(mockRecording);
        usePlaybackStore.getState().play();
        usePlaybackStore.getState().updateTime(1000); // 1s at 1x = 1000ms
      });

      expect(usePlaybackStore.getState().currentTime).toBe(1000);

      act(() => {
        usePlaybackStore.getState().setSpeed(2);
        usePlaybackStore.getState().updateTime(1000); // 1s at 2x = 2000ms
      });

      expect(usePlaybackStore.getState().currentTime).toBe(3000);

      act(() => {
        usePlaybackStore.getState().setSpeed(0.5);
        usePlaybackStore.getState().updateTime(1000); // 1s at 0.5x = 500ms
      });

      expect(usePlaybackStore.getState().currentTime).toBe(3500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle seeking to exact checkpoint timestamp', () => {
      act(() => {
        usePlaybackStore.getState().setRecording(mockRecording);
        usePlaybackStore.getState().seek(5000);
      });

      const state = usePlaybackStore.getState();
      expect(state.currentTime).toBe(5000);
      expect(state.currentCheckpoint?.id).toBe('cp-1');
    });

    it('should handle empty events array', () => {
      act(() => {
        usePlaybackStore.getState().setRecording({
          ...mockRecording,
          events: [],
        });
        usePlaybackStore.getState().seek(1000);
      });

      expect(usePlaybackStore.getState().currentEventIndex).toBe(0);
    });

    it('should handle events with same timestamp', () => {
      const recordingWithSameTimestamps = {
        ...mockRecording,
        events: [
          { timestamp: 0, type: 'insert', data: {} },
          { timestamp: 0, type: 'cursor', data: {} },
          { timestamp: 0, type: 'delete', data: {} },
        ],
      };

      act(() => {
        usePlaybackStore.getState().setRecording(recordingWithSameTimestamps);
        usePlaybackStore.getState().seek(0);
      });

      expect(usePlaybackStore.getState().currentEventIndex).toBe(3);
    });

    it('should handle very long recordings', () => {
      const longRecording: Recording = {
        ...mockRecording,
        duration: 3600000, // 1 hour
      };

      act(() => {
        usePlaybackStore.getState().setRecording(longRecording);
        usePlaybackStore.getState().seek(1800000); // 30 minutes
      });

      expect(usePlaybackStore.getState().currentTime).toBe(1800000);
    });
  });
});
