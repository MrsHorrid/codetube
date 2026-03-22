import { useState, useRef, useCallback, useEffect, RefObject } from 'react';
import type { Recording, PlaybackEvent } from '@/types/codetube';
import type { CodeEditorRef } from '@/components/CodeEditor/CodeEditor';

// ─── State ───────────────────────────────────────────────────────────────────

export interface EngineState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalDuration: number;
  speed: number;
  currentEventIndex: number;
  isComplete: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface Options {
  recording: Recording;
  editorRef: RefObject<CodeEditorRef | null>;
  onComplete?: () => void;
}

export function usePlaybackEngine({ recording, editorRef, onComplete }: Options) {
  const [state, setState] = useState<EngineState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    totalDuration: recording.duration,
    speed: 1,
    currentEventIndex: 0,
    isComplete: false,
  });

  // Mutable refs for the animation loop (avoid stale closures)
  const stateRef = useRef(state);
  stateRef.current = state;

  const rafRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number>(0);
  const isActiveRef = useRef(false); // true while loop should run

  // ── Apply a single event ────────────────────────────────────────────────

  const applyEvent = useCallback(
    (event: PlaybackEvent) => {
      const editor = editorRef.current;
      if (!editor) return;

      switch (event.type) {
        case 'insert': {
          const { text, position } = event.data as { text: string; position: { line: number; column: number } };
          editor.insertText(text, position.line, position.column);
          break;
        }
        case 'delete': {
          const { startLine, startCol, endLine, endCol } = event.data as {
            startLine: number; startCol: number; endLine: number; endCol: number;
          };
          editor.deleteRange(startLine, startCol, endLine, endCol);
          break;
        }
        case 'cursor': {
          const { line, column } = event.data as { line: number; column: number };
          editor.setCursorPosition(line, column);
          break;
        }
        case 'scroll': {
          const { line } = event.data as { line: number };
          editor.revealLine(line);
          break;
        }
        default:
          break;
      }
    },
    [editorRef]
  );

  // ── Main animation loop ─────────────────────────────────────────────────

  const loop = useCallback(
    (timestamp: number) => {
      if (!isActiveRef.current) return;

      const s = stateRef.current;

      if (!s.isPlaying || s.isPaused) {
        // Paused — stop loop but don't clear isActive yet
        rafRef.current = null;
        return;
      }

      if (lastFrameTsRef.current === 0) {
        lastFrameTsRef.current = timestamp;
      }

      const delta = timestamp - lastFrameTsRef.current;
      lastFrameTsRef.current = timestamp;

      const newTime = s.currentTime + delta * s.speed;

      const events = recording.events;
      let idx = s.currentEventIndex;

      // Drain all events whose timestamp <= newTime
      while (idx < events.length && events[idx].timestamp <= newTime) {
        applyEvent(events[idx]);
        idx++;
      }

      const isComplete = newTime >= recording.duration && idx >= events.length;

      setState((prev) => ({
        ...prev,
        currentTime: Math.min(newTime, recording.duration),
        currentEventIndex: idx,
        isComplete,
        isPlaying: isComplete ? false : prev.isPlaying,
        isPaused: isComplete ? true : prev.isPaused,
      }));

      if (isComplete) {
        isActiveRef.current = false;
        editorRef.current?.setPlaybackMode(false);
        onComplete?.();
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applyEvent, recording.duration, recording.events, onComplete]
  );

  // ── Controls ────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    editorRef.current?.setPlaybackMode(true);
    lastFrameTsRef.current = 0;
    isActiveRef.current = true;

    setState((prev) => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      isComplete: false,
    }));

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, editorRef]);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
    // loop will see isPaused and stop scheduling frames
  }, []);

  const resume = useCallback(() => {
    lastFrameTsRef.current = 0;
    setState((prev) => ({ ...prev, isPaused: false }));
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  const stop = useCallback(() => {
    isActiveRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    editorRef.current?.setPlaybackMode(false);
    editorRef.current?.setValue(recording.initialCode);
    setState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      totalDuration: recording.duration,
      speed: stateRef.current.speed,
      currentEventIndex: 0,
      isComplete: false,
    });
  }, [editorRef, recording.initialCode, recording.duration]);

  // Seek: rebuild editor state from scratch up to targetTime
  const seek = useCallback(
    (targetTime: number) => {
      const clampedTime = Math.max(0, Math.min(targetTime, recording.duration));
      const wasPlaying = stateRef.current.isPlaying && !stateRef.current.isPaused;

      // Stop current animation
      isActiveRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // Reset editor to initial state
      editorRef.current?.setPlaybackMode(true);
      editorRef.current?.setValue(recording.initialCode);

      // Fast-apply all events up to clampedTime
      const events = recording.events;
      let idx = 0;
      while (idx < events.length && events[idx].timestamp <= clampedTime) {
        applyEvent(events[idx]);
        idx++;
      }

      // Restore play state
      setState((prev) => ({
        ...prev,
        currentTime: clampedTime,
        currentEventIndex: idx,
        isPlaying: wasPlaying,
        isPaused: !wasPlaying,
        isComplete: false,
      }));

      if (wasPlaying) {
        lastFrameTsRef.current = 0;
        isActiveRef.current = true;
        rafRef.current = requestAnimationFrame(loop);
      } else {
        editorRef.current?.setPlaybackMode(false);
      }
    },
    [applyEvent, editorRef, loop, recording.duration, recording.events, recording.initialCode]
  );

  const setSpeed = useCallback((speed: number) => {
    setState((prev) => ({ ...prev, speed: Math.max(0.25, Math.min(4, speed)) }));
  }, []);

  const jumpToNextCheckpoint = useCallback(() => {
    const next = recording.checkpoints.find(
      (cp) => cp.timestamp > stateRef.current.currentTime + 200
    );
    if (next) seek(next.timestamp);
  }, [recording.checkpoints, seek]);

  const jumpToPreviousCheckpoint = useCallback(() => {
    const prev = [...recording.checkpoints]
      .reverse()
      .find((cp) => cp.timestamp < stateRef.current.currentTime - 200);
    if (prev) seek(prev.timestamp);
  }, [recording.checkpoints, seek]);

  // ── Effect: restart loop when isPaused flips off ─────────────────────────

  useEffect(() => {
    if (state.isPlaying && !state.isPaused && !rafRef.current && isActiveRef.current) {
      lastFrameTsRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [state.isPlaying, state.isPaused, loop]);

  // ── Cleanup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    state,
    play,
    pause,
    resume,
    stop,
    seek,
    setSpeed,
    jumpToNextCheckpoint,
    jumpToPreviousCheckpoint,
  };
}
