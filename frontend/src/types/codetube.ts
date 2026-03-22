// ─── Core Types ───────────────────────────────────────────────────────────────

export interface CursorPosition {
  line: number;
  column: number;
  isPlayback?: boolean;
}

export interface TextEdit {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
}

export interface EditOperation {
  changes: Array<{
    range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
    text: string;
    rangeOffset: number;
    rangeLength: number;
  }>;
  timestamp: number;
}

// ─── Playback Events ─────────────────────────────────────────────────────────

export type PlaybackEventType = 'insert' | 'delete' | 'cursor' | 'selection' | 'scroll';

export interface PlaybackEvent {
  timestamp: number;      // ms from recording start
  type: PlaybackEventType;
  data: Record<string, unknown>;
}

// ─── Checkpoints ─────────────────────────────────────────────────────────────

export interface Checkpoint {
  id: string;
  timestamp: number;
  label: string;
  description?: string;
  codeSnapshot: string;
  cursorPosition: CursorPosition;
}

// ─── Recording ───────────────────────────────────────────────────────────────

export interface Recording {
  id: string;
  title: string;
  description?: string;
  language: 'typescript' | 'javascript' | 'python' | 'json' | 'html' | 'css';
  initialCode: string;
  finalCode: string;
  duration: number;   // ms
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

// ─── State Machine ───────────────────────────────────────────────────────────

export type EditorMode = 'FOLLOWING' | 'EXPLORING' | 'EDITING';

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalDuration: number;
  speed: number;
  currentEventIndex: number;
}

export interface ViewerState {
  code: string;
  cursorPosition: CursorPosition;
  edits: EditOperation[];
  lastModified: number;
  isDirty: boolean;
}

export interface InstructorState {
  currentCode: string;
  cursorPosition: CursorPosition;
  currentEventIndex: number;
}
