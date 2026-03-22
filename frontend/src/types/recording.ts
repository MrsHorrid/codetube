// ============================================================
// CodeTube Recording Types
// Based on ARCHITECTURE.md specification
// ============================================================

export type EventType = 'kbd' | 'cur' | 'cnt' | 'fil' | 'sys';

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: number; // ms since recording start
}

export interface KeyboardEvent extends BaseEvent {
  type: 'kbd';
  key: string;
  code: string;
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
}

export interface CursorEvent extends BaseEvent {
  type: 'cur';
  fileId: string;
  position: { line: number; column: number };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface ContentEvent extends BaseEvent {
  type: 'cnt';
  fileId: string;
  operation: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content?: string;  // for insert/replace
  length?: number;   // for delete
  fullSnapshot?: string; // periodic full snapshot for integrity
}

export interface FileEvent extends BaseEvent {
  type: 'fil';
  action: 'create' | 'open' | 'close' | 'delete' | 'rename' | 'switch';
  fileId: string;
  metadata?: {
    name: string;
    path: string;
    language: string;
    initialContent?: string;
  };
}

export interface SystemEvent extends BaseEvent {
  type: 'sys';
  action: 'pause' | 'resume' | 'checkpoint' | 'start' | 'stop';
  data?: {
    checkpointId?: string;
    checkpointName?: string;
    duration?: number;
  };
}

export type RecordingEvent =
  | KeyboardEvent
  | CursorEvent
  | ContentEvent
  | FileEvent
  | SystemEvent;

// ============================================================
// Recording File Format
// ============================================================

export interface RecordingCheckpoint {
  id: string;
  timestamp: number;
  label: string;
  code_snapshot: string; // full code at this point
  description?: string;
}

export interface RecordingChunk {
  id: string;
  timestamp: number; // start time of chunk
  endTime: number;
  events: RecordingEvent[];
}

export interface RecordingMetadata {
  version: string;
  recordingId: string;
  createdAt: string;
  title: string;
  language: string;
  duration: number;       // ms
  eventCount: number;
  fileCount: number;
  initialContent: string; // starting code snapshot
  settings?: {
    editorTheme?: string;
    fontSize?: number;
    tabSize?: number;
  };
}

export interface RecordingFile {
  metadata: RecordingMetadata;
  chunks: RecordingChunk[];
  checkpoints: RecordingCheckpoint[];
}

// ============================================================
// Recorder State
// ============================================================

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecorderState {
  status: RecorderStatus;
  startTime: number | null;
  pausedAt: number | null;
  totalPausedMs: number;
  events: RecordingEvent[];
  checkpoints: RecordingCheckpoint[];
  currentCode: string;
  language: string;
  title: string;
}
