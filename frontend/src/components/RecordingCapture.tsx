import React, { useRef, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { useRecorder } from '@/hooks/useRecorder';
import { RecordingFile } from '@/types/recording';
import { formatDuration, formatFileSize } from '@/utils/format';

const STARTER_CODE = `// Welcome to CodeTube Recording Studio!
// Start recording and code something awesome.

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
`;

interface RecordingCaptureProps {
  onSaved?: (recording: RecordingFile) => void;
}

export function RecordingCapture({ onSaved }: RecordingCaptureProps) {
  const [title, setTitle] = useState('My First Tutorial');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState(STARTER_CODE);
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [showCheckpointInput, setShowCheckpointInput] = useState(false);

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);

  const {
    status,
    elapsedMs,
    eventCount,
    checkpoints,
    savedRecording,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    markCheckpoint,
    downloadRecording,
    getStats,
    reset,
    attachListeners,
  } = useRecorder();

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;
      attachListeners(editor);
    },
    [attachListeners]
  );

  const handleStart = () => {
    const currentCode = editorRef.current?.getValue() ?? code;
    startRecording({ title, language, initialCode: currentCode });
  };

  const handleStop = () => {
    stopRecording();
    setTimeout(() => {
      if (onSaved && savedRecording) {
        onSaved(savedRecording);
      }
    }, 50);
  };

  const handleMarkCheckpoint = () => {
    if (showCheckpointInput) {
      markCheckpoint(checkpointLabel || undefined);
      setCheckpointLabel('');
      setShowCheckpointInput(false);
    } else {
      setShowCheckpointInput(true);
    }
  };

  const stats = getStats();
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isStopped = status === 'stopped';
  const isIdle = status === 'idle';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', background: '#161b22',
        borderRadius: '8px', border: '1px solid #30363d',
      }}>
        <span style={{ fontWeight: 700, fontSize: '16px' }}>
          🔴 Recording Studio
        </span>
        {(isRecording || isPaused) && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            color: isRecording ? '#ff4757' : '#d29922',
            fontSize: '13px', fontWeight: 600,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isRecording ? '#ff4757' : '#d29922',
              display: 'inline-block',
              animation: isRecording ? 'pulse-red 1.2s ease-in-out infinite' : 'none',
            }} />
            {isPaused ? 'PAUSED' : 'REC'}
          </span>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isIdle}
          placeholder="Recording title..."
          style={{
            background: '#21262d', border: '1px solid #30363d',
            borderRadius: '6px', padding: '6px 12px',
            color: '#e6edf3', fontSize: '14px', width: '220px',
            marginLeft: 'auto',
          }}
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={!isIdle}
          style={{
            background: '#21262d', border: '1px solid #30363d',
            borderRadius: '6px', padding: '6px 10px',
            color: '#e6edf3', fontSize: '14px',
          }}
        >
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="rust">Rust</option>
          <option value="go">Go</option>
        </select>
      </div>

      {/* Editor */}
      <div style={{
        borderRadius: '8px', overflow: 'hidden',
        border: `2px solid ${isRecording ? '#ff4757' : isPaused ? '#d29922' : '#30363d'}`,
        height: '420px',
      }}>
        <Editor
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={(val) => setCode(val ?? '')}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14, tabSize: 2,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        padding: '12px 16px', background: '#161b22',
        borderRadius: '8px', border: '1px solid #30363d',
      }}>
        {isIdle && (
          <button className="recording-btn btn-record" onClick={handleStart}>
            ⏺ Record
          </button>
        )}

        {(isRecording || isPaused) && (
          <>
            {isRecording ? (
              <button className="recording-btn btn-pause" onClick={pauseRecording}>⏸ Pause</button>
            ) : (
              <button className="recording-btn btn-record" onClick={resumeRecording}>▶ Resume</button>
            )}
            <button className="recording-btn btn-stop" onClick={handleStop}>⏹ Stop & Save</button>

            {showCheckpointInput ? (
              <>
                <input
                  value={checkpointLabel}
                  onChange={(e) => setCheckpointLabel(e.target.value)}
                  placeholder="Checkpoint label..."
                  onKeyDown={(e) => e.key === 'Enter' && handleMarkCheckpoint()}
                  autoFocus
                  style={{
                    background: '#21262d', border: '1px solid #58a6ff',
                    borderRadius: '6px', padding: '7px 12px',
                    color: '#e6edf3', fontSize: '14px', width: '180px',
                  }}
                />
                <button className="recording-btn btn-checkpoint" onClick={handleMarkCheckpoint}>✓ Save</button>
                <button className="recording-btn btn-stop" onClick={() => { setShowCheckpointInput(false); setCheckpointLabel(''); }}>✕</button>
              </>
            ) : (
              <button className="recording-btn btn-checkpoint" onClick={handleMarkCheckpoint} disabled={!isRecording}>
                🚩 Checkpoint
              </button>
            )}
          </>
        )}

        {isStopped && (
          <button className="recording-btn btn-record" onClick={reset}>⏺ New Recording</button>
        )}

        <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: isRecording ? '#ff4757' : '#8b949e' }}>
          {formatDuration(elapsedMs)}
        </div>
        <div style={{ fontSize: '13px', color: '#8b949e', marginLeft: '12px' }}>{eventCount} events</div>
      </div>

      {/* Checkpoint timeline */}
      {checkpoints.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
          <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Checkpoints</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {checkpoints.map((cp) => (
              <span key={cp.id} className="checkpoint-badge">
                🚩 {cp.label} <span style={{ opacity: 0.6, marginLeft: '4px' }}>{formatDuration(cp.timestamp)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats after stop */}
      {isStopped && stats && (
        <div style={{ padding: '16px', background: '#161b22', borderRadius: '8px', border: '1px solid rgba(63,185,80,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px', color: '#3fb950' }}>✓ Recording saved!</span>
            <button className="recording-btn btn-download" onClick={() => downloadRecording()}>⬇ Download JSON</button>
          </div>
          <div className="stats-grid">
            {[
              ['Duration', formatDuration(stats.duration)],
              ['Events', stats.eventCount.toLocaleString()],
              ['File Size', formatFileSize(stats.fileSizeBytes)],
              ['Checkpoints', stats.checkpointCount.toString()],
              ['Chunks', stats.chunkCount.toString()],
              ['Language', language],
            ].map(([label, value]) => (
              <div key={label} className="stat-card">
                <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', textTransform: 'capitalize' }}>{value}</div>
              </div>
            ))}
          </div>
          {savedRecording && (
            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#21262d', borderRadius: '6px', fontSize: '12px', color: '#8b949e', fontFamily: 'monospace' }}>
              💾 Saved: <code style={{ color: '#58a6ff' }}>codetube_recording_{savedRecording.metadata.recordingId}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
