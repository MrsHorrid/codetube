# CodeTube Monaco Editor Integration Design

## Overview

This document outlines the architecture for integrating Monaco Editor into CodeTube - an interactive coding tutorial platform that supports instructor recordings with synchronized code playback and user editing capabilities.

---

## 1. Monaco Editor Setup

### 1.1 Core Editor Component

```tsx
// components/CodeEditor/CodeEditor.tsx
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

// Initialize Monaco loader with custom configuration
loader.config({
  paths: {
    vs: '/monaco-editor/min/vs',
  },
});

export interface CodeEditorProps {
  language: 'typescript' | 'javascript' | 'python' | 'json' | 'html' | 'css';
  value: string;
  onChange?: (value: string) => void;
  onCursorChange?: (position: CursorPosition) => void;
  onUserEdit?: (edit: EditOperation) => void;
  theme?: 'vs-dark' | 'light' | 'codetube-dark';
  readOnly?: boolean;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

export interface CodeEditorRef {
  getEditor: () => monaco.editor.IStandaloneCodeEditor;
  setValue: (value: string, animate?: boolean) => void;
  insertText: (text: string, position: monaco.Position) => void;
  setCursorPosition: (line: number, column: number, animate?: boolean) => void;
  focus: () => void;
  applyEdit: (edit: TextEdit) => void;
  highlightRange: (range: monaco.IRange, className?: string) => void;
  clearHighlight: () => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  ({ language, value, onChange, onCursorChange, onUserEdit, theme = 'codetube-dark', readOnly = false, options }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const isPlaybackActive = useRef(false);
    const decorationsRef = useRef<string[]>([]);

    // Initialize Monaco Editor
    useEffect(() => {
      if (!containerRef.current) return;

      // Define custom CodeTube theme
      monaco.editor.defineTheme('codetube-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: '569CD6' },
          { token: 'identifier', foreground: '9CDCFE' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'operator', foreground: 'D4D4D4' },
        ],
        colors: {
          'editor.background': '#1E1E1E',
          'editor.lineHighlightBackground': '#2D2D2D',
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
          'editorCursor.foreground': '#AEAFAD',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#C6C6C6',
        },
      });

      editorRef.current = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'line',
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
        fontLigatures: true,
        readOnly,
        ...options,
      });

      // Set up change detection
      editorRef.current.onDidChangeModelContent((event) => {
        if (!isPlaybackActive.current && onUserEdit) {
          const changes = event.changes.map((change) => ({
            range: change.range,
            text: change.text,
            rangeOffset: change.rangeOffset,
            rangeLength: change.rangeLength,
          }));
          onUserEdit({ changes, timestamp: Date.now() });
        }
        if (onChange) {
          onChange(editorRef.current!.getValue());
        }
      });

      // Track cursor position
      editorRef.current.onDidChangeCursorPosition((event) => {
        if (onCursorChange) {
          onCursorChange({
            line: event.position.lineNumber,
            column: event.position.column,
            isPlayback: isPlaybackActive.current,
          });
        }
      });

      // Detect user focus
      editorRef.current.onDidFocusEditorText(() => {
        if (!readOnly && !isPlaybackActive.current) {
          // User has manually focused - signal to pause playback
          document.dispatchEvent(new CustomEvent('codetube:user-focus'));
        }
      });

      return () => {
        editorRef.current?.dispose();
      };
    }, []);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current!,
      
      setValue: (newValue: string, animate = false) => {
        if (!editorRef.current) return;
        
        if (!animate) {
          editorRef.current.setValue(newValue);
          return;
        }

        // Animated value setting with character-by-character insertion
        const currentValue = editorRef.current.getValue();
        const model = editorRef.current.getModel();
        if (!model) return;

        // Clear and set new value with animation
        model.setValue('');
        const chars = newValue.split('');
        let index = 0;

        const typeNextChar = () => {
          if (index < chars.length) {
            const pos = model.getPositionAt(model.getValueLength());
            model.applyEdits([{
              range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
              text: chars[index],
            }]);
            index++;
            setTimeout(typeNextChar, 10); // Typing speed
          }
        };

        typeNextChar();
      },

      insertText: (text: string, position: monaco.Position) => {
        if (!editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        model.applyEdits([{
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text,
        }]);
      },

      setCursorPosition: (line: number, column: number, animate = false) => {
        if (!editorRef.current) return;
        
        const position = new monaco.Position(line, column);
        
        if (!animate) {
          editorRef.current.setPosition(position);
          editorRef.current.revealPositionInCenterIfOutsideViewport(position);
          return;
        }

        // Animate cursor movement
        const currentPos = editorRef.current.getPosition();
        if (!currentPos) return;

        // Simple interpolation for cursor animation
        const steps = 10;
        const dLine = (line - currentPos.lineNumber) / steps;
        const dCol = (column - currentPos.column) / steps;
        let step = 0;

        const animateStep = () => {
          if (step < steps) {
            const newLine = Math.round(currentPos.lineNumber + dLine * step);
            const newCol = Math.round(currentPos.column + dCol * step);
            editorRef.current?.setPosition(new monaco.Position(newLine, newCol));
            step++;
            requestAnimationFrame(animateStep);
          } else {
            editorRef.current?.setPosition(position);
            editorRef.current?.revealPositionInCenterIfOutsideViewport(position);
          }
        };

        animateStep();
      },

      focus: () => {
        editorRef.current?.focus();
      },

      applyEdit: (edit: TextEdit) => {
        if (!editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        model.pushEditOperations(
          [],
          [{
            range: monaco.Range.lift(edit.range),
            text: edit.text,
            forceMoveMarkers: true,
          }],
          () => null
        );
      },

      highlightRange: (range: monaco.IRange, className = 'codetube-highlight') => {
        if (!editorRef.current) return;
        
        const newDecorations = editorRef.current.deltaDecorations(
          decorationsRef.current,
          [{
            range,
            options: {
              className,
              isWholeLine: false,
              overviewRuler: { color: '#FFD700', position: monaco.editor.OverviewRulerLane.Center },
            },
          }]
        );
        decorationsRef.current = newDecorations;
      },

      clearHighlight: () => {
        if (!editorRef.current) return;
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      },
    }));

    return (
      <div
        ref={containerRef}
        className="codetube-editor"
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      />
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
```

### 1.2 Language Configuration

```typescript
// config/monacoLanguages.ts
import * as monaco from 'monaco-editor';

export const SUPPORTED_LANGUAGES = [
  { id: 'typescript', extensions: ['.ts', '.tsx'], aliases: ['TypeScript', 'ts'] },
  { id: 'javascript', extensions: ['.js', '.jsx', '.mjs'], aliases: ['JavaScript', 'js'] },
  { id: 'python', extensions: ['.py', '.pyw'], aliases: ['Python', 'py'] },
  { id: 'json', extensions: ['.json'], aliases: ['JSON'] },
  { id: 'html', extensions: ['.html', '.htm'], aliases: ['HTML'] },
  { id: 'css', extensions: ['.css'], aliases: ['CSS'] },
  { id: 'rust', extensions: ['.rs'], aliases: ['Rust'] },
  { id: 'go', extensions: ['.go'], aliases: ['Go'] },
  { id: 'sql', extensions: ['.sql'], aliases: ['SQL'] },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['id'];

// Configure language features
export function configureLanguages(): void {
  // TypeScript/JavaScript enhanced configuration
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowSyntheticDefaultImports: true,
    strict: true,
  });

  // Add type definitions for common libraries
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare module "react" { export = React; }`,
    'react.d.ts'
  );
}
```

---

## 2. Playback System

### 2.1 Playback Engine Hook

```typescript
// hooks/usePlaybackEngine.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import * as monaco from 'monaco-editor';

export interface PlaybackEvent {
  timestamp: number;      // Time from start of recording (ms)
  type: 'insert' | 'delete' | 'cursor' | 'selection' | 'scroll';
  data: Record<string, any>;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;    // Current playback position (ms)
  totalDuration: number;  // Total recording duration (ms)
  speed: number;          // Playback speed multiplier
  currentEventIndex: number;
}

export interface UsePlaybackEngineOptions {
  recording: Recording;
  onStateChange?: (state: PlaybackState) => void;
  onEvent?: (event: PlaybackEvent) => void;
  onComplete?: () => void;
  editorRef: React.RefObject<CodeEditorRef>;
}

export function usePlaybackEngine({
  recording,
  onStateChange,
  onEvent,
  onComplete,
  editorRef,
}: UsePlaybackEngineOptions) {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    totalDuration: recording.duration,
    speed: 1,
    currentEventIndex: 0,
  });

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
        const pos = new monaco.Position(position.line, position.column);
        editorRef.current.insertText(text, pos);
        break;
      }

      case 'delete': {
        const { range } = event.data;
        editorRef.current.applyEdit({
          range: monaco.Range.lift(range),
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
        // Handle selection highlighting
        const { range, className = 'codetube-selection' } = event.data;
        editorRef.current.highlightRange(range, className);
        setTimeout(() => editorRef.current?.clearHighlight(), 500);
        break;
      }

      case 'scroll': {
        // Programmatically scroll to position
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
    const baseDelay = 30 / state.speed; // Base typing speed adjusted by playback speed

    for (let i = 0; i < chars.length; i++) {
      if (!isPlaybackActiveRef.current) break;

      const char = chars[i];
      const delay = char === ' ' || char === '\n' ? baseDelay * 2 : baseDelay;
      
      // Vary typing speed slightly for realism
      const variance = Math.random() * 10;
      
      await new Promise(resolve => setTimeout(resolve, delay + variance));
      
      if (isPlaybackActiveRef.current) {
        const currentPos = new monaco.Position(
          position.line,
          position.column + i
        );
        editorRef.current.insertText(char, currentPos);
        editorRef.current.setCursorPosition(currentPos.lineNumber, currentPos.column + 1, false);
      }
    }
  }, [applyEvent, state.speed]);

  // Main playback loop
  const playbackLoop = useCallback((timestamp: number) => {
    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp;
    }

    const deltaTime = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    if (state.isPlaying && !state.isPaused) {
      const newTime = state.currentTime + deltaTime * state.speed;
      
      // Find and apply events that should have occurred
      while (
        state.currentEventIndex < eventsRef.current.length &&
        eventsRef.current[state.currentEventIndex].timestamp <= newTime
      ) {
        const event = eventsRef.current[state.currentEventIndex];
        
        if (event.type === 'insert' && event.data.text.length > 1) {
          animateTyping(event);
        } else {
          applyEvent(event);
        }
        
        setState(prev => ({ ...prev, currentEventIndex: prev.currentEventIndex + 1 }));
      }

      // Update current time
      setState(prev => ({ ...prev, currentTime: newTime }));

      // Check if playback is complete
      if (newTime >= state.totalDuration) {
        setState(prev => ({ ...prev, isPlaying: false, currentTime: state.totalDuration }));
        if (onComplete) onComplete();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(playbackLoop);
  }, [state.isPlaying, state.isPaused, state.currentTime, state.speed, state.totalDuration, state.currentEventIndex, applyEvent, animateTyping, onComplete]);

  // Start playback
  const play = useCallback(() => {
    isPlaybackActiveRef.current = true;
    setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    lastFrameTimeRef.current = 0;
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(playbackLoop);
    }
  }, [playbackLoop]);

  // Pause playback
  const pause = useCallback(() => {
    isPlaybackActiveRef.current = false;
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  // Resume playback
  const resume = useCallback(() => {
    isPlaybackActiveRef.current = true;
    lastFrameTimeRef.current = 0;
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // Stop playback and reset
  const stop = useCallback(() => {
    isPlaybackActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      totalDuration: recording.duration,
      speed: state.speed,
      currentEventIndex: 0,
    });
    // Reset editor to initial state
    if (editorRef.current) {
      editorRef.current.setValue(recording.initialCode);
    }
  }, [recording, state.speed, editorRef]);

  // Seek to specific time
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, state.totalDuration));
    
    // Find the event index for this time
    const eventIndex = eventsRef.current.findIndex(e => e.timestamp > clampedTime);
    const newIndex = eventIndex === -1 ? eventsRef.current.length : eventIndex;

    // Reconstruct editor state up to this point
    if (editorRef.current) {
      // Start from initial code
      editorRef.current.setValue(recording.initialCode);
      
      // Apply all events up to the seek point
      for (let i = 0; i < newIndex; i++) {
        const event = eventsRef.current[i];
        if (event.timestamp <= clampedTime) {
          // Skip animation for seek operations
          const eventWithoutAnimation = { ...event };
          if (eventWithoutAnimation.type === 'cursor') {
            eventWithoutAnimation.data = { ...eventWithoutAnimation.data, animate: false };
          }
          applyEvent(eventWithoutAnimation);
        }
      }
    }

    setState(prev => ({
      ...prev,
      currentTime: clampedTime,
      currentEventIndex: newIndex,
    }));
  }, [state.totalDuration, applyEvent, editorRef, recording.initialCode]);

  // Set playback speed
  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed: Math.max(0.25, Math.min(3, speed)) }));
  }, []);

  // Jump to next checkpoint
  const jumpToNextCheckpoint = useCallback(() => {
    const nextCheckpoint = recording.checkpoints.find(cp => cp.timestamp > state.currentTime);
    if (nextCheckpoint) {
      seek(nextCheckpoint.timestamp);
    }
  }, [recording.checkpoints, state.currentTime, seek]);

  // Jump to previous checkpoint
  const jumpToPreviousCheckpoint = useCallback(() => {
    const prevCheckpoints = recording.checkpoints.filter(cp => cp.timestamp < state.currentTime);
    if (prevCheckpoints.length > 0) {
      seek(prevCheckpoints[prevCheckpoints.length - 1].timestamp);
    }
  }, [recording.checkpoints, state.currentTime, seek]);

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
      onStateChange(state);
    }
  }, [state, onStateChange]);

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
    isPlaybackActive: isPlaybackActiveRef.current,
  };
}
```

### 2.2 Typing Animation Component

```tsx
// components/Playback/TypingAnimator.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { usePlaybackEngine } from '@/hooks/usePlaybackEngine';

interface TypingAnimatorProps {
  recording: Recording;
  editorRef: React.RefObject<CodeEditorRef>;
  isActive: boolean;
  onTypingStart?: () => void;
  onTypingComplete?: () => void;
}

export const TypingAnimator: React.FC<TypingAnimatorProps> = ({
  recording,
  editorRef,
  isActive,
  onTypingStart,
  onTypingComplete,
}) => {
  const { state, play, pause, seek } = usePlaybackEngine({
    recording,
    editorRef,
    onComplete: onTypingComplete,
  });

  // Auto-start when active
  useEffect(() => {
    if (isActive && !state.isPlaying) {
      onTypingStart?.();
      play();
    } else if (!isActive && state.isPlaying) {
      pause();
    }
  }, [isActive, play, pause, state.isPlaying, onTypingStart]);

  return null; // This is a logic-only component
};
```

---

## 3. State Management

### 3.1 TypeScript Interfaces

```typescript
// types/codetube.ts

// Position in the editor
export interface CursorPosition {
  line: number;
  column: number;
  isPlayback?: boolean;
}

// Text edit operation
export interface TextEdit {
  range: monaco.IRange;
  text: string;
}

// Single edit operation from user or playback
export interface EditOperation {
  changes: Array<{
    range: monaco.IRange;
    text: string;
    rangeOffset: number;
    rangeLength: number;
  }>;
  timestamp: number;
}

// Checkpoint in the recording
export interface Checkpoint {
  id: string;
  timestamp: number;
  label: string;
  description?: string;
  codeSnapshot: string;
  cursorPosition: CursorPosition;
}

// Recording metadata and events
export interface Recording {
  id: string;
  title: string;
  description?: string;
  language: string;
  initialCode: string;
  finalCode: string;
  duration: number; // milliseconds
  events: PlaybackEvent[];
  checkpoints: Checkpoint[];
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Viewer (user) state
export interface ViewerState {
  code: string;
  cursorPosition: CursorPosition;
  edits: EditOperation[];
  lastModified: number;
  isDirty: boolean;
}

// Combined state for the session
export interface CodeTubeSession {
  recording: Recording;
  instructorState: InstructorState;
  viewerState: ViewerState;
  playback: PlaybackState;
  mode: 'following' | 'exploring' | 'editing';
}

// Instructor state (original recording)
export interface InstructorState {
  currentCode: string;
  cursorPosition: CursorPosition;
  currentEventIndex: number;
}

// Playback state
export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  speed: number;
  loop: boolean;
}

// User interaction event
export interface UserInteractionEvent {
  type: 'focus' | 'blur' | 'edit' | 'cursor_move' | 'scroll';
  timestamp: number;
  data?: Record<string, any>;
}
```

### 3.2 Session State Hook

```typescript
// hooks/useCodeTubeSession.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import type {
  Recording,
  ViewerState,
  InstructorState,
  CodeTubeSession,
  CursorPosition,
  EditOperation,
} from '@/types/codetube';

interface UseCodeTubeSessionOptions {
  recording: Recording;
  editorRef: React.RefObject<CodeEditorRef>;
  autoFollow?: boolean;
}

interface UseCodeTubeSessionReturn {
  session: CodeTubeSession;
  mode: 'following' | 'exploring' | 'editing';
  
  // Mode transitions
  startExploring: () => void;
  startEditing: () => void;
  followInstructor: (resetToCurrentPlayback?: boolean) => void;
  
  // Viewer state management
  saveViewerSnapshot: () => void;
  restoreViewerSnapshot: () => void;
  resetToInstructor: () => void;
  
  // State accessors
  getCurrentCode: () => string;
  isCodeDifferent: () => boolean;
}

export function useCodeTubeSession({
  recording,
  editorRef,
  autoFollow = true,
}: UseCodeTubeSessionOptions): UseCodeTubeSessionReturn {
  // Session state
  const [mode, setMode] = useState<'following' | 'exploring' | 'editing'>('following');
  
  // Instructor state (always reflects the recording playback)
  const [instructorState, setInstructorState] = useState<InstructorState>({
    currentCode: recording.initialCode,
    cursorPosition: { line: 1, column: 1 },
    currentEventIndex: 0,
  });

  // Viewer state (user's edits)
  const [viewerState, setViewerState] = useState<ViewerState>({
    code: recording.initialCode,
    cursorPosition: { line: 1, column: 1 },
    edits: [],
    lastModified: Date.now(),
    isDirty: false,
  });

  // Snapshot for saving viewer state during following
  const viewerSnapshotRef = useRef<ViewerState | null>(null);
  
  // Track if we need to restore viewer state when switching back to exploring
  const shouldRestoreSnapshot = useRef(false);

  // Transition to exploring mode (keep user's edits)
  const startExploring = useCallback(() => {
    if (mode === 'following') {
      // Save instructor position before switching
      viewerSnapshotRef.current = { ...viewerState };
    }
    setMode('exploring');
    
    // Re-enable editor editing
    if (editorRef.current) {
      editorRef.current.getEditor().updateOptions({ readOnly: false });
    }
  }, [mode, viewerState, editorRef]);

  // Transition to editing mode (explicit editing)
  const startEditing = useCallback(() => {
    startExploring();
    setMode('editing');
    editorRef.current?.focus();
  }, [startExploring, editorRef]);

  // Return to following mode
  const followInstructor = useCallback((resetToCurrentPlayback = true) => {
    setMode('following');
    
    // Disable editor editing during playback
    if (editorRef.current) {
      editorRef.current.getEditor().updateOptions({ readOnly: true });
    }

    if (resetToCurrentPlayback) {
      // Reset to the instructor's current code state
      editorRef.current?.setValue(instructorState.currentCode);
      editorRef.current?.setCursorPosition(
        instructorState.cursorPosition.line,
        instructorState.cursorPosition.column,
        false
      );
    }
  }, [instructorState, editorRef]);

  // Save current viewer state as snapshot
  const saveViewerSnapshot = useCallback(() => {
    viewerSnapshotRef.current = { ...viewerState };
  }, [viewerState]);

  // Restore viewer state from snapshot
  const restoreViewerSnapshot = useCallback(() => {
    if (viewerSnapshotRef.current && editorRef.current) {
      setViewerState(viewerSnapshotRef.current);
      editorRef.current.setValue(viewerSnapshotRef.current.code);
      editorRef.current.setCursorPosition(
        viewerSnapshotRef.current.cursorPosition.line,
        viewerSnapshotRef.current.cursorPosition.column,
        false
      );
    }
  }, [editorRef]);

  // Reset viewer code to match instructor
  const resetToInstructor = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      code: instructorState.currentCode,
      isDirty: false,
      edits: [],
    }));
    
    if (editorRef.current) {
      editorRef.current.setValue(instructorState.currentCode);
    }
  }, [instructorState, editorRef]);

  // Get current code based on mode
  const getCurrentCode = useCallback(() => {
    return mode === 'following' ? instructorState.currentCode : viewerState.code;
  }, [mode, instructorState, viewerState]);

  // Check if viewer code differs from instructor
  const isCodeDifferent = useCallback(() => {
    return viewerState.code !== instructorState.currentCode;
  }, [viewerState, instructorState]);

  // Handle user edits
  const handleUserEdit = useCallback((edit: EditOperation) => {
    if (mode === 'following' && autoFollow) {
      // User started editing while following - pause and switch to exploring
      document.dispatchEvent(new CustomEvent('codetube:pause-playback'));
      setMode('exploring');
    }

    setViewerState(prev => ({
      ...prev,
      edits: [...prev.edits, edit],
      lastModified: Date.now(),
      isDirty: true,
    }));
  }, [mode, autoFollow]);

  // Listen for user interaction events
  useEffect(() => {
    const handleUserFocus = () => {
      if (mode === 'following') {
        document.dispatchEvent(new CustomEvent('codetube:pause-playback'));
        startExploring();
      }
    };

    document.addEventListener('codetube:user-focus', handleUserFocus);
    return () => document.removeEventListener('codetube:user-focus', handleUserFocus);
  }, [mode, startExploring]);

  return {
    session: {
      recording,
      instructorState,
      viewerState,
      playback: {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        speed: 1,
        loop: false,
      },
      mode,
    },
    mode,
    startExploring,
    startEditing,
    followInstructor,
    saveViewerSnapshot,
    restoreViewerSnapshot,
    resetToInstructor,
    getCurrentCode,
    isCodeDifferent,
  };
}
```

---

## 4. User Interactions

### 4.1 Playback Controls Component

```tsx
// components/Controls/PlaybackControls.tsx
import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  Bookmark,
} from 'lucide-react';
import type { PlaybackState } from '@/types/codetube';

interface PlaybackControlsProps {
  state: PlaybackState;
  checkpoints: Checkpoint[];
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onNextCheckpoint: () => void;
  onPreviousCheckpoint: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  state,
  checkpoints,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeek,
  onSpeedChange,
  onNextCheckpoint,
  onPreviousCheckpoint,
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (state.currentTime / state.totalDuration) * 100;

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * state.totalDuration;
    onSeek(newTime);
  };

  return (
    <div className="codetube-controls">
      {/* Timeline Scrubber */}
      <div className="timeline-container">
        <div className="timeline-track">
          {/* Progress bar */}
          <div
            className="timeline-progress"
            style={{ width: `${progress}%` }}
          />
          
          {/* Checkpoint markers */}
          {checkpoints.map((cp) => {
            const cpProgress = (cp.timestamp / state.totalDuration) * 100;
            return (
              <button
                key={cp.id}
                className="checkpoint-marker"
                style={{ left: `${cpProgress}%` }}
                onClick={() => onSeek(cp.timestamp)}
                title={cp.label}
              >
                <Bookmark size={12} />
              </button>
            );
          })}
          
          {/* Scrubber input */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleScrubberChange}
            className="timeline-scrubber"
          />
        </div>
        
        {/* Time display */}
        <div className="time-display">
          <span>{formatTime(state.currentTime)}</span>
          <span>/</span>
          <span>{formatTime(state.totalDuration)}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="control-buttons">
        {/* Previous checkpoint */}
        <button
          onClick={onPreviousCheckpoint}
          className="control-btn"
          title="Previous checkpoint"
        >
          <SkipBack size={20} />
        </button>

        {/* Rewind/Reset */}
        <button
          onClick={onStop}
          className="control-btn"
          title="Reset to beginning"
        >
          <RotateCcw size={20} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={state.isPlaying ? (state.isPaused ? onResume : onPause) : onPlay}
          className="control-btn play-btn"
        >
          {state.isPlaying && !state.isPaused ? (
            <Pause size={24} />
          ) : (
            <Play size={24} />
          )}
        </button>

        {/* Next checkpoint */}
        <button
          onClick={onNextCheckpoint}
          className="control-btn"
          title="Next checkpoint"
        >
          <SkipForward size={20} />
        </button>

        {/* Speed control */}
        <div className="speed-control">
          <FastForward size={16} />
          <select
            value={state.speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="speed-select"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
```

### 4.2 Mode Switcher Component

```tsx
// components/Controls/ModeSwitcher.tsx
import React from 'react';
import { Eye, Pencil, MonitorPlay, GitCompare } from 'lucide-react';

interface ModeSwitcherProps {
  currentMode: 'following' | 'exploring' | 'editing';
  hasChanges: boolean;
  onFollowInstructor: () => void;
  onStartExploring: () => void;
  onStartEditing: () => void;
  onShowDiff?: () => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  currentMode,
  hasChanges,
  onFollowInstructor,
  onStartExploring,
  onStartEditing,
  onShowDiff,
}) => {
  return (
    <div className="mode-switcher">
      <div className="mode-tabs">
        <button
          onClick={onFollowInstructor}
          className={`mode-tab ${currentMode === 'following' ? 'active' : ''}`}
        >
          <MonitorPlay size={16} />
          <span>Follow Instructor</span>
          {currentMode === 'following' && (
            <span className="mode-indicator live">LIVE</span>
          )}
        </button>

        <button
          onClick={onStartExploring}
          className={`mode-tab ${currentMode === 'exploring' ? 'active' : ''}`}
        >
          <Eye size={16} />
          <span>Explore Code</span>
          {hasChanges && currentMode !== 'following' && (
            <span className="changes-dot" />
          )}
        </button>

        <button
          onClick={onStartEditing}
          className={`mode-tab ${currentMode === 'editing' ? 'active' : ''}`}
        >
          <Pencil size={16} />
          <span>Edit</span>
        </button>
      </div>

      {hasChanges && (
        <button onClick={onShowDiff} className="diff-btn">
          <GitCompare size={16} />
          <span>Compare</span>
        </button>
      )}
    </div>
  );
};
```

### 4.3 User Interaction Detection Hook

```typescript
// hooks/useUserInteraction.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseUserInteractionOptions {
  editorRef: React.RefObject<CodeEditorRef>;
  onInteractionStart: () => void;
  onInteractionEnd?: () => void;
  debounceMs?: number;
}

export function useUserInteraction({
  editorRef,
  onInteractionStart,
  onInteractionEnd,
  debounceMs = 1000,
}: UseUserInteractionOptions) {
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef(false);

  const handleInteractionStart = useCallback(() => {
    if (!isInteractingRef.current) {
      isInteractingRef.current = true;
      onInteractionStart();
    }

    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }

    // Set new timeout for interaction end
    interactionTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      onInteractionEnd?.();
    }, debounceMs);
  }, [onInteractionStart, onInteractionEnd, debounceMs]);

  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (!editor) return;

    // Listen for various interaction events
    const disposables = [
      editor.onDidChangeModelContent(() => {
        handleInteractionStart();
      }),
      
      editor.onDidChangeCursorPosition(() => {
        handleInteractionStart();
      }),
      
      editor.onDidChangeCursorSelection(() => {
        handleInteractionStart();
      }),
      
      editor.onDidScrollChange(() => {
        handleInteractionStart();
      }),
    ];

    // Listen for keyboard events on the editor container
    const domNode = editor.getDomNode();
    if (domNode) {
      domNode.addEventListener('keydown', handleInteractionStart);
      domNode.addEventListener('mousedown', handleInteractionStart);
    }

    return () => {
      disposables.forEach(d => d.dispose());
      if (domNode) {
        domNode.removeEventListener('keydown', handleInteractionStart);
        domNode.removeEventListener('mousedown', handleInteractionStart);
      }
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [editorRef, handleInteractionStart]);

  return {
    isInteracting: () => isInteractingRef.current,
  };
}
```

---

## 5. Code Structure - Main Integration

### 5.1 Main CodeTube Editor Component

```tsx
// components/CodeTubeEditor/CodeTubeEditor.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { CodeEditor, CodeEditorRef } from '@/components/CodeEditor/CodeEditor';
import { PlaybackControls } from '@/components/Controls/PlaybackControls';
import { ModeSwitcher } from '@/components/Controls/ModeSwitcher';
import { usePlaybackEngine } from '@/hooks/usePlaybackEngine';
import { useCodeTubeSession } from '@/hooks/useCodeTubeSession';
import { useUserInteraction } from '@/hooks/useUserInteraction';
import type { Recording } from '@/types/codetube';

interface CodeTubeEditorProps {
  recording: Recording;
  onCheckpointReached?: (checkpoint: Checkpoint) => void;
  onPlaybackComplete?: () => void;
}

export const CodeTubeEditor: React.FC<CodeTubeEditorProps> = ({
  recording,
  onCheckpointReached,
  onPlaybackComplete,
}) => {
  const editorRef = useRef<CodeEditorRef>(null);

  // Session management
  const {
    mode,
    startExploring,
    startEditing,
    followInstructor,
    isCodeDifferent,
  } = useCodeTubeSession({
    recording,
    editorRef,
    autoFollow: true,
  });

  // Playback engine
  const {
    state: playbackState,
    play,
    pause,
    resume,
    stop,
    seek,
    setSpeed,
    jumpToNextCheckpoint,
    jumpToPreviousCheckpoint,
  } = usePlaybackEngine({
    recording,
    editorRef,
    onStateChange: (state) => {
      // Check for checkpoint proximity
      const nearbyCheckpoint = recording.checkpoints.find(
        cp => Math.abs(cp.timestamp - state.currentTime) < 500
      );
      if (nearbyCheckpoint) {
        onCheckpointReached?.(nearbyCheckpoint);
      }
    },
    onComplete: onPlaybackComplete,
  });

  // User interaction detection
  useUserInteraction({
    editorRef,
    onInteractionStart: () => {
      if (playbackState.isPlaying && !playbackState.isPaused) {
        pause();
        startExploring();
      }
    },
  });

  // Listen for pause events from other components
  useEffect(() => {
    const handlePause = () => pause();
    document.addEventListener('codetube:pause-playback', handlePause);
    return () => document.removeEventListener('codetube:pause-playback', handlePause);
  }, [pause]);

  // Handle editor value changes from user
  const handleEditorChange = useCallback((value: string) => {
    // This is triggered by both playback and user edits
    // User edits are already handled by onUserEdit in useCodeTubeSession
  }, []);

  return (
    <div className="codetube-editor-container">
      {/* Header with mode switcher */}
      <div className="codetube-header">
        <div className="recording-info">
          <h2>{recording.title}</h2>
          <span className="instructor">
            by {recording.instructor.name}
          </span>
        </div>
        
        <ModeSwitcher
          currentMode={mode}
          hasChanges={isCodeDifferent()}
          onFollowInstructor={() => {
            followInstructor(true);
            resume();
          }}
          onStartExploring={startExploring}
          onStartEditing={startEditing}
        />
      </div>

      {/* Main editor area */}
      <div className="editor-wrapper">
        <CodeEditor
          ref={editorRef}
          language={recording.language as any}
          value={recording.initialCode}
          onChange={handleEditorChange}
          readOnly={mode === 'following'}
          theme="codetube-dark"
          options={{
            glyphMargin: true, // For checkpoint indicators
            lineNumbers: 'on',
            folding: true,
            renderWhitespace: 'selection',
          }}
        />
        
        {/* Checkpoint indicators in gutter */}
        {mode === 'following' && (
          <CheckpointIndicators
            checkpoints={recording.checkpoints}
            currentTime={playbackState.currentTime}
          />
        )}
      </div>

      {/* Playback controls */}
      <PlaybackControls
        state={playbackState}
        checkpoints={recording.checkpoints}
        onPlay={play}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onSeek={(time) => {
          seek(time);
          if (mode === 'following') {
            // Stay in following mode but update position
          } else {
            // In exploring/editing mode, show confirmation
          }
        }}
        onSpeedChange={setSpeed}
        onNextCheckpoint={jumpToNextCheckpoint}
        onPreviousCheckpoint={jumpToPreviousCheckpoint}
      />

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className={`mode-badge ${mode}`}>
            {mode === 'following' && 'Following Instructor'}
            {mode === 'exploring' && 'Exploring Code'}
            {mode === 'editing' && 'Editing'}
          </span>
          
          {mode !== 'following' && isCodeDifferent() && (
            <span className="unsaved-indicator">
              • Your code differs from instructor
            </span>
          )}
        </div>
        
        <div className="status-right">
          <span>{recording.language.toUpperCase()}</span>
          <span>{playbackState.speed}x</span>
        </div>
      </div>
    </div>
  );
};
```

### 5.2 CSS Styles

```scss
// styles/codetube.scss
.codetube-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1E1E1E;
  color: #D4D4D4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// Header
.codetube-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #252526;
  border-bottom: 1px solid #3E3E42;

  .recording-info {
    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    .instructor {
      font-size: 12px;
      color: #858585;
    }
  }
}

// Mode Switcher
.mode-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-tabs {
  display: flex;
  background: #3C3C3C;
  border-radius: 6px;
  padding: 2px;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #CCCCCC;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: #094771;
    color: #FFFFFF;
  }

  .mode-indicator {
    font-size: 9px;
    padding: 2px 4px;
    border-radius: 3px;
    background: #238636;
    color: white;
    font-weight: bold;
  }

  .changes-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #E3B341;
  }
}

// Editor Wrapper
.editor-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

// Playback Controls
.codetube-controls {
  padding: 12px 20px;
  background: #252526;
  border-top: 1px solid #3E3E42;
}

.timeline-container {
  margin-bottom: 12px;
}

.timeline-track {
  position: relative;
  height: 24px;
  background: #3C3C3C;
  border-radius: 4px;
  overflow: hidden;
}

.timeline-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #094771 0%, #1177BB 100%);
  transition: width 0.1s linear;
}

.checkpoint-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #E3B341;
  border: 2px solid #252526;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 2;

  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }

  svg {
    color: #252526;
  }
}

.timeline-scrubber {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: #858585;
  font-variant-numeric: tabular-nums;
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: #3C3C3C;
  color: #CCCCCC;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4C4C4C;
    color: #FFFFFF;
  }

  &.play-btn {
    background: #094771;
    color: #FFFFFF;

    &:hover {
      background: #1177BB;
    }
  }
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
  padding: 4px 8px;
  background: #3C3C3C;
  border-radius: 4px;
  color: #CCCCCC;

  .speed-select {
    background: transparent;
    border: none;
    color: #CCCCCC;
    font-size: 13px;
    cursor: pointer;

    &:focus {
      outline: none;
    }
  }
}

// Status Bar
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 20px;
  background: #007ACC;
  color: #FFFFFF;
  font-size: 12px;
}

.status-left, .status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 500;

  &.following {
    background: #238636;
  }

  &.exploring {
    background: #E3B341;
    color: #1E1E1E;
  }

  &.editing {
    background: #6F42C1;
  }
}

.unsaved-indicator {
  opacity: 0.8;
}

// Editor Customizations
.codetube-editor {
  .codetube-highlight {
    background: rgba(227, 179, 65, 0.3);
    border: 1px solid #E3B341;
  }

  .codetube-selection {
    background: rgba(17, 119, 187, 0.4);
  }
}

// Checkpoint indicator in gutter
.checkpoint-gutter-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .checkpoint-icon {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #E3B341;
  }
}
```

---

## 6. Usage Example

```tsx
// App.tsx - Usage Example
import React from 'react';
import { CodeTubeEditor } from '@/components/CodeTubeEditor/CodeTubeEditor';
import type { Recording } from '@/types/codetube';

// Sample recording data
const sampleRecording: Recording = {
  id: 'rec-001',
  title: 'Building a React Counter',
  description: 'Learn useState with a simple counter example',
  language: 'typescript',
  initialCode: `import React from 'react';

function Counter() {
  return (
    <div>
      <h1>Count: 0</h1>
    </div>
  );
}

export default Counter;`,
  finalCode: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;`,
  duration: 120000, // 2 minutes
  events: [
    {
      timestamp: 5000,
      type: 'cursor',
      data: { line: 1, column: 1 },
    },
    {
      timestamp: 6000,
      type: 'selection',
      data: { range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 26 } },
    },
    {
      timestamp: 7000,
      type: 'delete',
      data: { range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 26 } },
    },
    {
      timestamp: 7200,
      type: 'insert',
      data: { text: 'import React, { useState } from \'react\';', position: { line: 1, column: 1 } },
    },
    // ... more events
  ],
  checkpoints: [
    {
      id: 'cp-1',
      timestamp: 0,
      label: 'Start',
      description: 'Initial component setup',
      codeSnapshot: '// Initial code',
      cursorPosition: { line: 1, column: 1 },
    },
    {
      id: 'cp-2',
      timestamp: 15000,
      label: 'Add useState',
      description: 'Import and initialize useState',
      codeSnapshot: '// After adding useState',
      cursorPosition: { line: 4, column: 1 },
    },
    {
      id: 'cp-3',
      timestamp: 45000,
      label: 'Add Button',
      description: 'Add increment button',
      codeSnapshot: '// After adding button',
      cursorPosition: { line: 8, column: 1 },
    },
  ],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  instructor: {
    id: 'inst-1',
    name: 'Sarah Chen',
    avatar: '/avatars/sarah.jpg',
  },
};

function App() {
  return (
    <div className="app">
      <CodeTubeEditor
        recording={sampleRecording}
        onCheckpointReached={(checkpoint) => {
          console.log('Reached checkpoint:', checkpoint.label);
        }}
        onPlaybackComplete={() => {
          console.log('Playback complete!');
        }}
      />
    </div>
  );
}

export default App;
```

---

## 7. File Structure Summary

```
codetube/
├── components/
│   ├── CodeEditor/
│   │   ├── CodeEditor.tsx           # Core Monaco wrapper
│   │   └── index.ts
│   ├── CodeTubeEditor/
│   │   ├── CodeTubeEditor.tsx       # Main integration component
│   │   └── index.ts
│   ├── Controls/
│   │   ├── PlaybackControls.tsx     # Play/pause/seek controls
│   │   ├── ModeSwitcher.tsx         # Following/Exploring/Editing switcher
│   │   └── CheckpointIndicators.tsx # Gutter checkpoint markers
│   └── Playback/
│       └── TypingAnimator.tsx       # Typing animation logic
├── hooks/
│   ├── usePlaybackEngine.ts         # Playback state machine
│   ├── useCodeTubeSession.ts        # Session state management
│   └── useUserInteraction.ts        # User interaction detection
├── types/
│   └── codetube.ts                  # TypeScript interfaces
├── config/
│   └── monacoLanguages.ts           # Language configurations
├── styles/
│   └── codetube.scss                # Component styles
└── utils/
    └── recordingHelpers.ts          # Recording data utilities
```

---

## 8. Key Design Decisions

1. **Imperative Editor API**: Using `useImperativeHandle` allows direct editor manipulation for smooth animations while maintaining React's declarative nature for the UI.

2. **Three-Mode System**: 
   - **Following**: Read-only, playback active
   - **Exploring**: Editable but paused
   - **Editing**: Explicit editing mode with full control

3. **Event-Based Playback**: Recording events are timestamped and applied sequentially for accurate reconstruction of the instructor's session.

4. **Smooth Typing Animation**: Character-by-character insertion with variable delays creates realistic typing simulation.

5. **Checkpoint System**: Allows users to jump to key moments and provides structure to the tutorial flow.

6. **Auto-Pause on Interaction**: Any user input automatically pauses playback and switches to exploring mode.
