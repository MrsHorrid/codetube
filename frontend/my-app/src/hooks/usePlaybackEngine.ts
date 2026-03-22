// hooks/usePlaybackEngine.ts
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { usePlaybackStore } from '@/stores/playbackStore';
import type { PlaybackEvent, Recording } from '@/types/codetube';

interface UsePlaybackEngineOptions {
  recording: Recording;
  editorRef: React.RefObject<any>;
  onStateChange?: (state: { currentTime: number; isPlaying: boolean; isPaused: boolean }) => void;
  onEvent?: (event: PlaybackEvent) => void;
  onComplete?: () => void;
  onCheckpointReached?: (checkpoint: any) => void;
}

export function usePlaybackEngine({
  recording,
  editorRef,
  onStateChange,
  onEvent,
  onComplete,
  onCheckpointReached,
}: UsePlaybackEngineOptions) {
  const playbackStore = usePlaybackStore();
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const eventsRef = useRef<PlaybackEvent[]>(recording.events);
  const isPlaybackActiveRef = useRef(false);

  // Apply a single playback event to the editor
  const applyEvent = useCallback((event: PlaybackEvent) => {
    if (!editorRef.current) return;

    switch (event.type) {
      case 'insert': {
        const { text, position } = event.data;
        editorRef.current.insertText(text, position);
        break;
      }

      case 'delete': {
        const { range } = event.data;
        editorRef.current.applyEdit({
          range,
          text: '',
        });
        break;
      }

      case 'cursor': {
        const { line, column, animate = true } = event.data;
        editorRef.current.setCursorPosition(line, column, animate);
        break;
      }

      case 'selection': {
        const { range, className = 'codetube-selection' } = event.data;
        editorRef.current.highlightRange(range, className);
        setTimeout(() => editorRef.current?.clearHighlight(), 500);
        break;
      }

      case 'scroll': {
        const { line } = event.data;
        editorRef.current.getEditor()?.revealLineInCenter(line);
        break;
      }
    }

    if (onEvent) {
      onEvent(event);
    }
  }, [editorRef, onEvent]);

  // Smooth typing animation for insert events
  const animateTyping = useCallback(async (event: PlaybackEvent) => {
    if (!editorRef.current || event.type !== 'insert') {
      applyEvent(event);
      return;
    }

    const { text, position } = event.data;
    const chars = text.split('');
    const baseDelay = 30 / playbackStore.speed;

    for (let i = 0; i < chars.length; i++) {
      if (!isPlaybackActiveRef.current) break;

      const char = chars[i];
      const delay = char === ' ' || char === '\n' ? baseDelay * 2 : baseDelay;
      const variance = Math.random() * 10;

      await new Promise((resolve) => setTimeout(resolve, delay + variance));

      if (isPlaybackActiveRef.current) {
        editorRef.current.insertText(char, {
          lineNumber: position.line,
          column: position.column + i,
        });
        editorRef.current.setCursorPosition(
          position.line,
          position.column + i + 1,
          false
        );
      }
    }
  }, [applyEvent, playbackStore.speed, editorRef]);

  // Main playback loop
  const playbackLoop = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    if (playbackStore.isPlaying && !playbackStore.isPaused) {
      const prevTime = playbackStore.currentTime;
      playbackStore.updateTime(deltaTime);
      const newTime = playbackStore.currentTime;

      // Find and apply events that should have occurred
      while (
        playbackStore.currentEventIndex < eventsRef.current.length &&
        eventsRef.current[playbackStore.currentEventIndex].timestamp <= newTime
      ) {
        const event = eventsRef.current[playbackStore.currentEventIndex];

        if (event.type === 'insert' && event.data.text.length > 1) {
          animateTyping(event);
        } else {
          applyEvent(event);
        }

        // Check for checkpoints
        const checkpoint = recording.checkpoints.find(
          (cp) => cp.timestamp > prevTime && cp.timestamp <= newTime
        );
        if (checkpoint) {
          onCheckpointReached?.(checkpoint);
        }
      }

      // Check if playback is complete
      if (newTime >= recording.duration) {
        playbackStore.pause();
        if (onComplete) onComplete();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(playbackLoop);
  }, [
    playbackStore,
    recording.duration,
    recording.checkpoints,
    applyEvent,
    animateTyping,
    onComplete,
    onCheckpointReached,
  ]);

  // Start playback
  const play = useCallback(() => {
    isPlaybackActiveRef.current = true;
    playbackStore.play();
    lastFrameTimeRef.current = 0;
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    }
  }, [playbackStore, playbackLoop]);

  // Pause playback
  const pause = useCallback(() => {
    isPlaybackActiveRef.current = false;
    playbackStore.pause();
  }, [playbackStore]);

  // Resume playback
  const resume = useCallback(() => {
    isPlaybackActiveRef.current = true;
    lastFrameTimeRef.current = 0;
    playbackStore.resume();
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    }
  }, [playbackStore, playbackLoop]);

  // Stop playback and reset
  const stop = useCallback(() => {
    isPlaybackActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    playbackStore.stop();
    
    // Reset editor to initial state
    if (editorRef.current) {
      editorRef.current.setValue(recording.initialCode);
    }
  }, [playbackStore, recording.initialCode, editorRef]);

  // Seek to specific time
  const seek = useCallback(
    (time: number) => {
      playbackStore.seek(time);
      
      // Reconstruct editor state up to this point
      if (editorRef.current) {
        editorRef.current.setValue(recording.initialCode);
        
        const eventIndex = recording.events.findIndex((e) => e.timestamp > time);
        const newIndex = eventIndex === -1 ? recording.events.length : eventIndex;
        
        for (let i = 0; i < newIndex; i++) {
          const event = recording.events[i];
          if (event.timestamp <= time) {
            const eventWithoutAnimation = { ...event };
            if (eventWithoutAnimation.type === 'cursor') {
              eventWithoutAnimation.data = { ...eventWithoutAnimation.data, animate: false };
            }
            applyEvent(eventWithoutAnimation);
          }
        }
      }
    },
    [playbackStore, recording.initialCode, recording.events, editorRef, applyEvent]
  );

  // Set playback speed
  const setSpeed = useCallback(
    (speed: number) => {
      playbackStore.setSpeed(speed);
    },
    [playbackStore]
  );

  // Jump to next checkpoint
  const jumpToNextCheckpoint = useCallback(() => {
    playbackStore.jumpToNextCheckpoint();
  }, [playbackStore]);

  // Jump to previous checkpoint
  const jumpToPreviousCheckpoint = useCallback(() => {
    playbackStore.jumpToPreviousCheckpoint();
  }, [playbackStore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Notify state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        currentTime: playbackStore.currentTime,
        isPlaying: playbackStore.isPlaying,
        isPaused: playbackStore.isPaused,
      });
    }
  }, [
    playbackStore.currentTime,
    playbackStore.isPlaying,
    playbackStore.isPaused,
    onStateChange,
  ]);

  return {
    state: {
      isPlaying: playbackStore.isPlaying,
      isPaused: playbackStore.isPaused,
      currentTime: playbackStore.currentTime,
      totalDuration: recording.duration,
      speed: playbackStore.speed,
      currentEventIndex: playbackStore.currentEventIndex,
    },
    play,
    pause,
    resume,
    stop,
    seek,
    setSpeed,
    jumpToNextCheckpoint,
    jumpToPreviousCheckpoint,
    isPlaybackActive: isPlaybackActiveRef.current,
  };
}
