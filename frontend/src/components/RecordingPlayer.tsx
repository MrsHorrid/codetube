import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { RecordingFile, RecordingEvent, ContentEvent, CursorEvent } from '@/types/recording';
import { formatDuration } from '@/utils/format';

type PlayState = 'idle' | 'playing' | 'paused' | 'ended';

interface Props {
  recording: RecordingFile;
}

export function RecordingPlayer({ recording }: Props) {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [activeCheckpointIdx, setActiveCheckpointIdx] = useState<number | null>(null);

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const allEventsRef = useRef<RecordingEvent[]>([]);
  const eventIdxRef = useRef(0);
  const startRealTimeRef = useRef<number>(0);
  const startEventTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Flatten all events from chunks
  useEffect(() => {
    const events: RecordingEvent[] = [];
    for (const chunk of recording.chunks) {
      events.push(...chunk.events);
    }
    events.sort((a, b) => a.timestamp - b.timestamp);
    allEventsRef.current = events;
  }, [recording]);

  const handleEditorMount = useCallback(
    (editor: monacoEditor.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      // Set initial content
      editor.setValue(recording.metadata.initialContent ?? '');
    },
    [recording]
  );

  // Apply a content event to the editor
  const applyContentEvent = useCallback((evt: ContentEvent) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    if (evt.operation === 'insert' && evt.content) {
      const pos = { lineNumber: evt.position.line, column: evt.position.column };
      model.applyEdits([
        {
          range: {
            startLineNumber: pos.lineNumber,
            startColumn: pos.column,
            endLineNumber: pos.lineNumber,
            endColumn: pos.column,
          },
          text: evt.content,
        },
      ]);
    } else if (evt.operation === 'delete') {
      const startPos = { lineNumber: evt.position.line, column: evt.position.column };
      // Calculate end position based on length
      const fullText = model.getValue();
      const startOffset = model.getOffsetAt(startPos);
      const endOffset = Math.min(startOffset + (evt.length ?? 1), fullText.length);
      const endPos = model.getPositionAt(endOffset);
      model.applyEdits([
        {
          range: {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          },
          text: '',
        },
      ]);
    } else if (evt.operation === 'replace' && evt.content !== undefined) {
      const startPos = { lineNumber: evt.position.line, column: evt.position.column };
      const fullText = model.getValue();
      const startOffset = model.getOffsetAt(startPos);
      const endOffset = Math.min(startOffset + (evt.length ?? 0), fullText.length);
      const endPos = model.getPositionAt(endOffset);
      model.applyEdits([
        {
          range: {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          },
          text: evt.content,
        },
      ]);
    }
  }, []);

  // Apply a cursor event
  const applyCursorEvent = useCallback((evt: CursorEvent) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      editor.setPosition({ lineNumber: evt.position.line, column: evt.position.column });
      if (evt.selection) {
        editor.setSelection({
          startLineNumber: evt.selection.start.line,
          startColumn: evt.selection.start.column,
          endLineNumber: evt.selection.end.line,
          endColumn: evt.selection.end.column,
        });
      }
    } catch {/* ignore */}
  }, []);

  // Playback RAF loop
  const playbackLoop = useCallback(() => {
    const elapsed = (Date.now() - startRealTimeRef.current) * speedRef.current;
    const recordingTime = startEventTimeRef.current + elapsed;

    setCurrentTimeMs(recordingTime);

    // Update active checkpoint
    const cps = recording.checkpoints;
    for (let i = cps.length - 1; i >= 0; i--) {
      if (cps[i].timestamp <= recordingTime) {
        setActiveCheckpointIdx(i);
        break;
      }
    }

    // Process all events up to recordingTime
    const events = allEventsRef.current;
    while (eventIdxRef.current < events.length) {
      const evt = events[eventIdxRef.current];
      if (evt.timestamp > recordingTime) break;

      // Apply event
      switch (evt.type) {
        case 'cnt':
          applyContentEvent(evt as ContentEvent);
          break;
        case 'cur':
          applyCursorEvent(evt as CursorEvent);
          break;
        // kbd/sys: visual only for now
      }
      eventIdxRef.current++;
    }

    // Check if ended
    if (recordingTime >= recording.metadata.duration) {
      setPlayState('ended');
      setCurrentTimeMs(recording.metadata.duration);
      return;
    }

    rafRef.current = requestAnimationFrame(playbackLoop);
  }, [recording, applyContentEvent, applyCursorEvent]);

  const play = useCallback(() => {
    if (playState === 'ended') {
      // Restart from beginning
      editorRef.current?.setValue(recording.metadata.initialContent ?? '');
      eventIdxRef.current = 0;
      startEventTimeRef.current = 0;
      setCurrentTimeMs(0);
      setActiveCheckpointIdx(null);
    } else if (playState === 'paused') {
      startEventTimeRef.current = currentTimeMs;
    }

    startRealTimeRef.current = Date.now();
    setPlayState('playing');
  }, [playState, currentTimeMs, recording]);

  // Start playback loop when state becomes playing
  useEffect(() => {
    if (playState === 'playing') {
      rafRef.current = requestAnimationFrame(playbackLoop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playState, playbackLoop]);

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlayState('paused');
  }, []);

  const seekToCheckpoint = useCallback(
    (idx: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const cp = recording.checkpoints[idx];

      // Restore snapshot
      editorRef.current?.setValue(cp.code_snapshot);
      eventIdxRef.current = allEventsRef.current.findIndex((e) => e.timestamp > cp.timestamp);
      if (eventIdxRef.current === -1) eventIdxRef.current = allEventsRef.current.length;
      startEventTimeRef.current = cp.timestamp;
      startRealTimeRef.current = Date.now();
      setCurrentTimeMs(cp.timestamp);
      setActiveCheckpointIdx(idx);

      if (playState === 'playing') {
        rafRef.current = requestAnimationFrame(playbackLoop);
      }
    },
    [recording, playState, playbackLoop]
  );

  const progress = recording.metadata.duration > 0
    ? Math.min((currentTimeMs / recording.metadata.duration) * 100, 100)
    : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>{recording.metadata.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {recording.metadata.language} · {formatDuration(recording.metadata.duration)} · {recording.metadata.eventCount} events
          </div>
        </div>

        {/* Speed control */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Speed:</span>
          {[0.5, 1, 1.5, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: speed === s ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                color: speed === s ? '#0d1117' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: speed === s ? 700 : 400,
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div
        style={{
          flex: 1,
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid var(--border-color)',
          minHeight: '350px',
        }}
      >
        <Editor
          defaultLanguage={recording.metadata.language}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            tabSize: 2,
            minimap: { enabled: false },
            readOnly: playState === 'playing',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: '4px',
          background: 'var(--bg-tertiary)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--accent-blue)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Playback controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
        }}
      >
        {playState !== 'playing' ? (
          <button className="recording-btn btn-record" onClick={play}>
            <PlayIcon /> {playState === 'ended' ? 'Replay' : 'Play'}
          </button>
        ) : (
          <button className="recording-btn btn-pause" onClick={pause}>
            <PauseIcon /> Pause
          </button>
        )}

        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          {formatDuration(currentTimeMs)} / {formatDuration(recording.metadata.duration)}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {playState === 'ended' && '✓ Finished'}
          {playState === 'playing' && '▶ Playing'}
          {playState === 'paused' && '⏸ Paused'}
          {playState === 'idle' && '⏹ Ready'}
        </div>
      </div>

      {/* Checkpoints */}
      {recording.checkpoints.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Checkpoints — click to jump
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recording.checkpoints.map((cp, idx) => (
              <button
                key={cp.id}
                onClick={() => seekToCheckpoint(idx)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: activeCheckpointIdx === idx ? 'rgba(88,166,255,0.25)' : 'rgba(88,166,255,0.1)',
                  border: `1px solid ${activeCheckpointIdx === idx ? 'var(--accent-blue)' : 'rgba(88,166,255,0.3)'}`,
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                  fontWeight: activeCheckpointIdx === idx ? 700 : 400,
                }}
              >
                🚩 {cp.label}
                <span style={{ opacity: 0.7, marginLeft: '4px' }}>
                  {formatDuration(cp.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
