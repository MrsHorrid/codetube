// stores/playbackStore.ts
import { create } from 'zustand';
import { type PlaybackState, type Checkpoint, type Recording } from '@/types/codetube';

interface PlaybackStoreState extends PlaybackState {
  recording: Recording | null;
  mode: 'following' | 'exploring' | 'editing';
  hasChanges: boolean;
  currentCheckpoint: Checkpoint | null;
  
  // Actions
  setRecording: (recording: Recording | null) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  setMode: (mode: 'following' | 'exploring' | 'editing') => void;
  setHasChanges: (hasChanges: boolean) => void;
  jumpToNextCheckpoint: () => void;
  jumpToPreviousCheckpoint: () => void;
  updateTime: (deltaTime: number) => void;
}

export const usePlaybackStore = create<PlaybackStoreState>()((set, get) => ({
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

  setRecording: (recording) => set({
    recording,
    totalDuration: recording?.duration || 0,
    currentTime: 0,
    currentEventIndex: 0,
  }),

  play: () => set({ isPlaying: true, isPaused: false }),
  
  pause: () => set({ isPaused: true }),
  
  resume: () => set({ isPaused: false }),
  
  stop: () => set({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    currentEventIndex: 0,
  }),

  seek: (time) => {
    const { recording } = get();
    const clampedTime = Math.max(0, Math.min(time, recording?.duration || 0));
    
    // Find event index for this time
    const eventIndex = recording?.events.findIndex(e => e.timestamp > clampedTime) || 0;
    const newIndex = eventIndex === -1 ? (recording?.events.length || 0) : eventIndex;
    
    // Find current checkpoint
    const checkpoints = recording?.checkpoints || [];
    const currentCheckpoint = [...checkpoints]
      .reverse()
      .find(cp => cp.timestamp <= clampedTime) || null;
    
    set({
      currentTime: clampedTime,
      currentEventIndex: newIndex,
      currentCheckpoint,
    });
  },

  setSpeed: (speed) => set({ speed: Math.max(0.25, Math.min(3, speed)) }),

  setMode: (mode) => set({ mode }),

  setHasChanges: (hasChanges) => set({ hasChanges }),

  jumpToNextCheckpoint: () => {
    const { recording, currentTime } = get();
    const nextCheckpoint = recording?.checkpoints.find(cp => cp.timestamp > currentTime);
    if (nextCheckpoint) {
      get().seek(nextCheckpoint.timestamp);
    }
  },

  jumpToPreviousCheckpoint: () => {
    const { recording, currentTime } = get();
    const prevCheckpoints = recording?.checkpoints.filter(cp => cp.timestamp < currentTime) || [];
    if (prevCheckpoints.length > 0) {
      get().seek(prevCheckpoints[prevCheckpoints.length - 1].timestamp);
    }
  },

  updateTime: (deltaTime) => {
    const { currentTime, totalDuration, speed, recording } = get();
    const newTime = currentTime + deltaTime * speed;
    
    if (newTime >= totalDuration) {
      set({ isPlaying: false, currentTime: totalDuration });
      return;
    }
    
    // Find and update event index
    const eventIndex = recording?.events.findIndex(e => e.timestamp > newTime) || 0;
    const newIndex = eventIndex === -1 ? (recording?.events.length || 0) : eventIndex;
    
    // Check for checkpoint proximity
    const checkpoints = recording?.checkpoints || [];
    const currentCheckpoint = [...checkpoints]
      .reverse()
      .find(cp => cp.timestamp <= newTime) || null;
    
    set({
      currentTime: newTime,
      currentEventIndex: newIndex,
      currentCheckpoint,
    });
  },
}));
