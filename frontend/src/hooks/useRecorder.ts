import { useRef, useState, useCallback } from 'react';
import type * as monaco from 'monaco-editor';
import {
  RecorderStatus,
  RecorderState,
  RecordingEvent,
  RecordingCheckpoint,
  RecordingFile,
  KeyboardEvent as KbdEvent,
  CursorEvent as CurEvent,
  ContentEvent as CntEvent,
  SystemEvent as SysEvent,
} from '@/types/recording';

// Simple ID generator (ULID-like)
let _idCounter = 0;
function genId(): string {
  return `evt_${Date.now()}_${(++_idCounter).toString(36)}`;
}

function genCheckpointId(): string {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const CHUNK_INTERVAL_MS = 5000; // chunk events every 5 seconds
const FILE_ID = 'file_main';

// ============================================================
// Build the final RecordingFile from raw state
// ============================================================
function buildRecordingFile(state: RecorderState, duration: number): RecordingFile {
  const events = state.events;
  
  // Chunk events by time window
  const chunks: RecordingFile['chunks'] = [];
  let chunkStart = 0;
  let batch: RecordingEvent[] = [];

  for (const evt of events) {
    if (batch.length > 0 && evt.timestamp - chunkStart > CHUNK_INTERVAL_MS) {
      chunks.push({
        id: genId(),
        timestamp: chunkStart,
        endTime: batch[batch.length - 1].timestamp,
        events: [...batch],
      });
      chunkStart = evt.timestamp;
      batch = [];
    }
    batch.push(evt);
  }
  // Flush remaining
  if (batch.length > 0) {
    chunks.push({
      id: genId(),
      timestamp: chunkStart,
      endTime: batch[batch.length - 1].timestamp,
      events: [...batch],
    });
  }

  const metadata: RecordingFile['metadata'] = {
    version: '1.0.0',
    recordingId: `rec_${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: state.title || 'Untitled Recording',
    language: state.language || 'typescript',
    duration,
    eventCount: events.length,
    fileCount: 1,
    initialContent: state.currentCode,
    settings: {
      editorTheme: 'vs-dark',
      fontSize: 14,
      tabSize: 2,
    },
  };

  return {
    metadata,
    chunks,
    checkpoints: state.checkpoints,
  };
}

// ============================================================
// useRecorder Hook
// ============================================================
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [checkpoints, setCheckpoints] = useState<RecordingCheckpoint[]>([]);
  const [savedRecording, setSavedRecording] = useState<RecordingFile | null>(null);

  const stateRef = useRef<RecorderState>({
    status: 'idle',
    startTime: null,
    pausedAt: null,
    totalPausedMs: 0,
    events: [],
    checkpoints: [],
    currentCode: '',
    language: 'typescript',
    title: 'My Recording',
  });

  // Monaco editor refs for attaching listeners
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const listenersRef = useRef<monaco.IDisposable[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCursorRef = useRef<{ line: number; column: number } | null>(null);

  // ─── Helper: get current recording timestamp ───────────────
  function getTimestamp(): number {
    const s = stateRef.current;
    if (!s.startTime) return 0;
    return Date.now() - s.startTime - s.totalPausedMs;
  }

  // ─── Helper: push event ────────────────────────────────────
  function pushEvent(event: RecordingEvent) {
    stateRef.current.events.push(event);
    setEventCount(stateRef.current.events.length);
  }

  // ─── Attach Monaco listeners ────────────────────────────────
  const attachListeners = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    const disposables: monaco.IDisposable[] = [];

    // 1. Content change → ContentEvent
    const contentDisposable = editor.onDidChangeModelContent((e) => {
      if (stateRef.current.status !== 'recording') return;
      const ts = getTimestamp();

      for (const change of e.changes) {
        const { range, text, rangeLength } = change;

        let operation: 'insert' | 'delete' | 'replace';
        if (rangeLength === 0) {
          operation = 'insert';
        } else if (!text) {
          operation = 'delete';
        } else {
          operation = 'replace';
        }

        const evt: CntEvent = {
          id: genId(),
          type: 'cnt',
          timestamp: ts,
          fileId: FILE_ID,
          operation,
          position: { line: range.startLineNumber, column: range.startColumn },
          content: text || undefined,
          length: rangeLength || undefined,
        };
        pushEvent(evt);
      }

      // Update currentCode snapshot
      stateRef.current.currentCode = editor.getValue();
    });
    disposables.push(contentDisposable);

    // 2. Cursor position → CursorEvent (throttled)
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      if (stateRef.current.status !== 'recording') return;
      const ts = getTimestamp();

      const pos = e.position;
      const last = lastCursorRef.current;

      // Throttle: only emit if position changed by at least 1 line or different column
      if (last && last.line === pos.lineNumber && last.column === pos.column) return;

      lastCursorRef.current = { line: pos.lineNumber, column: pos.column };

      const selection = editor.getSelection();
      const hasSelection =
        selection &&
        (selection.startLineNumber !== selection.endLineNumber ||
          selection.startColumn !== selection.endColumn);

      const evt: CurEvent = {
        id: genId(),
        type: 'cur',
        timestamp: ts,
        fileId: FILE_ID,
        position: { line: pos.lineNumber, column: pos.column },
        selection: hasSelection
          ? {
              start: { line: selection!.startLineNumber, column: selection!.startColumn },
              end: { line: selection!.endLineNumber, column: selection!.endColumn },
            }
          : undefined,
      };
      pushEvent(evt);
    });
    disposables.push(cursorDisposable);

    // 3. Keyboard events (capture from DOM on the editor container)
    const container = editor.getContainerDomNode();
    const keyHandler = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (stateRef.current.status !== 'recording') return;
      const ts = getTimestamp();

      const evt: KbdEvent = {
        id: genId(),
        type: 'kbd',
        timestamp: ts,
        key: ke.key,
        code: ke.code,
        modifiers: {
          ctrl: ke.ctrlKey,
          alt: ke.altKey,
          shift: ke.shiftKey,
          meta: ke.metaKey,
        },
      };
      pushEvent(evt);
    };

    container.addEventListener('keydown', keyHandler);
    disposables.push({
      dispose: () => container.removeEventListener('keydown', keyHandler),
    });

    listenersRef.current = disposables;
  }, []);

  // ─── Detach Monaco listeners ────────────────────────────────
  const detachListeners = useCallback(() => {
    listenersRef.current.forEach((d) => d.dispose());
    listenersRef.current = [];
  }, []);

  // ─── START recording ────────────────────────────────────────
  const startRecording = useCallback(
    (opts?: { title?: string; language?: string; initialCode?: string }) => {
      const now = Date.now();
      stateRef.current = {
        status: 'recording',
        startTime: now,
        pausedAt: null,
        totalPausedMs: 0,
        events: [],
        checkpoints: [],
        currentCode: opts?.initialCode ?? '',
        language: opts?.language ?? 'typescript',
        title: opts?.title ?? 'My Recording',
      };

      // Push system start event
      const startEvt: SysEvent = {
        id: genId(),
        type: 'sys',
        timestamp: 0,
        action: 'start',
      };
      pushEvent(startEvt);

      // Elapsed timer
      timerRef.current = setInterval(() => {
        setElapsedMs(getTimestamp());
      }, 100);

      setStatus('recording');
      setEventCount(1);
      setCheckpoints([]);
      setSavedRecording(null);
    },
    []
  );

  // ─── PAUSE recording ────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (stateRef.current.status !== 'recording') return;
    stateRef.current.pausedAt = Date.now();
    stateRef.current.status = 'paused';

    const ts = getTimestamp();
    const pauseEvt: SysEvent = {
      id: genId(),
      type: 'sys',
      timestamp: ts,
      action: 'pause',
    };
    pushEvent(pauseEvt);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('paused');
  }, []);

  // ─── RESUME recording ───────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (stateRef.current.status !== 'paused') return;
    const s = stateRef.current;
    if (s.pausedAt) {
      s.totalPausedMs += Date.now() - s.pausedAt;
    }
    s.pausedAt = null;
    s.status = 'recording';

    const ts = getTimestamp();
    const resumeEvt: SysEvent = {
      id: genId(),
      type: 'sys',
      timestamp: ts,
      action: 'resume',
    };
    pushEvent(resumeEvt);

    timerRef.current = setInterval(() => {
      setElapsedMs(getTimestamp());
    }, 100);

    setStatus('recording');
  }, []);

  // ─── STOP recording ─────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (!['recording', 'paused'].includes(stateRef.current.status)) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const duration = getTimestamp();

    // Push stop event
    const stopEvt: SysEvent = {
      id: genId(),
      type: 'sys',
      timestamp: duration,
      action: 'stop',
    };
    stateRef.current.events.push(stopEvt);
    stateRef.current.status = 'stopped';

    // Build the recording file
    const recording = buildRecordingFile(stateRef.current, duration);

    // Save to localStorage
    const key = `codetube_recording_${recording.metadata.recordingId}`;
    try {
      localStorage.setItem(key, JSON.stringify(recording));
      localStorage.setItem('codetube_latest_recording', key);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    setSavedRecording(recording);
    setStatus('stopped');
    setElapsedMs(duration);
    detachListeners();
  }, [detachListeners]);

  // ─── MARK CHECKPOINT ────────────────────────────────────────
  const markCheckpoint = useCallback((label?: string) => {
    if (stateRef.current.status !== 'recording') return;
    const ts = getTimestamp();

    const checkpoint: RecordingCheckpoint = {
      id: genCheckpointId(),
      timestamp: ts,
      label: label ?? `Checkpoint ${stateRef.current.checkpoints.length + 1}`,
      code_snapshot: editorRef.current?.getValue() ?? stateRef.current.currentCode,
    };

    stateRef.current.checkpoints.push(checkpoint);

    const sysEvt: SysEvent = {
      id: genId(),
      type: 'sys',
      timestamp: ts,
      action: 'checkpoint',
      data: {
        checkpointId: checkpoint.id,
        checkpointName: checkpoint.label,
      },
    };
    pushEvent(sysEvt);

    setCheckpoints([...stateRef.current.checkpoints]);
  }, []);

  // ─── DOWNLOAD recording as JSON ─────────────────────────────
  const downloadRecording = useCallback((recording?: RecordingFile) => {
    const rec = recording ?? savedRecording;
    if (!rec) return;

    const json = JSON.stringify(rec, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rec.metadata.title.replace(/\s+/g, '_')}_${rec.metadata.recordingId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [savedRecording]);

  // ─── GET recording stats ────────────────────────────────────
  const getStats = useCallback(() => {
    const rec = savedRecording;
    if (!rec) return null;
    const json = JSON.stringify(rec);
    return {
      duration: rec.metadata.duration,
      eventCount: rec.metadata.eventCount,
      checkpointCount: rec.checkpoints.length,
      chunkCount: rec.chunks.length,
      fileSizeBytes: new Blob([json]).size,
    };
  }, [savedRecording]);

  // ─── RESET ──────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    detachListeners();
    stateRef.current = {
      status: 'idle',
      startTime: null,
      pausedAt: null,
      totalPausedMs: 0,
      events: [],
      checkpoints: [],
      currentCode: '',
      language: 'typescript',
      title: 'My Recording',
    };
    setStatus('idle');
    setElapsedMs(0);
    setEventCount(0);
    setCheckpoints([]);
    setSavedRecording(null);
  }, [detachListeners]);

  return {
    // State
    status,
    elapsedMs,
    eventCount,
    checkpoints,
    savedRecording,
    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    markCheckpoint,
    downloadRecording,
    getStats,
    reset,
    // Editor integration
    attachListeners,
    detachListeners,
  };
}
