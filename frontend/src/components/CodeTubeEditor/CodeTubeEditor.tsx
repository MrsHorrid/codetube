import React, { useRef, useCallback, useEffect, useState } from 'react';
import { CodeEditor, CodeEditorRef } from '@/components/CodeEditor/CodeEditor';
import { PlaybackControls } from '@/components/Controls/PlaybackControls';
import { ModeSwitcher } from '@/components/Controls/ModeSwitcher';
import { usePlaybackEngine } from '@/hooks/usePlaybackEngine';
import { useEditorMode } from '@/hooks/useEditorMode';
import type { Recording, EditorMode } from '@/types/codetube';

interface Props {
  recording: Recording;
  autoPlay?: boolean;
  onCheckpointReached?: (id: string, label: string) => void;
  onPlaybackComplete?: () => void;
}

export const CodeTubeEditor: React.FC<Props> = ({
  recording,
  autoPlay = false,
  onCheckpointReached,
  onPlaybackComplete,
}) => {
  const editorRef = useRef<CodeEditorRef | null>(null);
  const [cursorInfo, setCursorInfo] = useState({ line: 1, column: 1 });
  const [checkpointToast, setCheckpointToast] = useState<string | null>(null);

  // ── Playback engine ────────────────────────────────────────────────────
  const engine = usePlaybackEngine({
    recording,
    editorRef,
    onComplete: onPlaybackComplete,
  });

  // ── Mode machine ────────────────────────────────────────────────────────
  const {
    mode,
    isReadOnly,
    enterFollowing,
    enterExploring,
    enterEditing,
    handleUserEdit,
  } = useEditorMode({
    editorRef,
    onPausePlayback: engine.pause,
  });

  // ── Auto-play on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (autoPlay) {
      // tiny delay so the editor is mounted
      const t = setTimeout(() => engine.play(), 300);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Checkpoint toasts ───────────────────────────────────────────────────
  useEffect(() => {
    const cps = recording.checkpoints;
    const nearby = cps.find(
      (cp) => Math.abs(cp.timestamp - engine.state.currentTime) < 300
    );
    if (nearby && nearby.id !== 'cp-start') {
      setCheckpointToast(nearby.label);
      onCheckpointReached?.(nearby.id, nearby.label);
      const t = setTimeout(() => setCheckpointToast(null), 2500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.state.currentEventIndex]);

  // ── "Follow Instructor" button ──────────────────────────────────────────
  const handleFollowInstructor = useCallback(() => {
    const currentCode = editorRef.current?.getValue() ?? '';
    enterFollowing(currentCode);
    if (!engine.state.isPlaying || engine.state.isPaused) {
      engine.resume();
    }
  }, [enterFollowing, engine]);

  // ── "Explore" button ────────────────────────────────────────────────────
  const handleExplore = useCallback(() => {
    enterExploring();
  }, [enterExploring]);

  // ── "Edit" button ───────────────────────────────────────────────────────
  const handleEdit = useCallback(() => {
    enterEditing();
  }, [enterEditing]);

  // ── Mode badge label ────────────────────────────────────────────────────
  const modeLabel: Record<EditorMode, string> = {
    FOLLOWING: 'Following Instructor',
    EXPLORING: 'Exploring (Paused)',
    EDITING: 'Editing Freely',
  };

  return (
    <div className="ct-container">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="ct-header">
        <div className="ct-header-left">
          <div className="ct-logo">
            <span className="ct-logo-icon">▶</span>
            <span className="ct-logo-text">CodeTube</span>
          </div>
          <div className="ct-title-info">
            <h1 className="ct-title">{recording.title}</h1>
            <span className="ct-instructor">
              by {recording.instructor.name}
            </span>
          </div>
        </div>

        <div className="ct-header-right">
          <ModeSwitcher
            mode={mode}
            onFollowInstructor={handleFollowInstructor}
            onExplore={handleExplore}
            onEdit={handleEdit}
          />
        </div>
      </div>

      {/* ── Editor Area ─────────────────────────────────────────────────── */}
      <div className="ct-editor-wrapper">
        {/* Mode overlay when FOLLOWING */}
        {mode === 'FOLLOWING' && (
          <div className="ct-following-overlay" title="Following instructor — click Explore or Edit to interact" />
        )}

        <CodeEditor
          ref={editorRef}
          language={recording.language}
          value={recording.initialCode}
          readOnly={isReadOnly}
          theme="codetube-dark"
          onCursorChange={(line, col) => setCursorInfo({ line, column: col })}
          onUserEdit={handleUserEdit}
        />

        {/* Checkpoint toast */}
        {checkpointToast && (
          <div className="ct-checkpoint-toast">
            <span className="ct-checkpoint-toast-dot">●</span>
            {checkpointToast}
          </div>
        )}
      </div>

      {/* ── Playback Controls ───────────────────────────────────────────── */}
      <PlaybackControls
        state={engine.state}
        checkpoints={recording.checkpoints}
        onPlay={engine.play}
        onPause={engine.pause}
        onResume={engine.resume}
        onStop={engine.stop}
        onSeek={engine.seek}
        onSpeedChange={engine.setSpeed}
        onNextCheckpoint={engine.jumpToNextCheckpoint}
        onPreviousCheckpoint={engine.jumpToPreviousCheckpoint}
      />

      {/* ── Status Bar ──────────────────────────────────────────────────── */}
      <div className="ct-statusbar">
        <div className="ct-statusbar-left">
          <span className={`ct-mode-badge ct-mode-badge--${mode.toLowerCase()}`}>
            {modeLabel[mode]}
          </span>
          {mode !== 'FOLLOWING' && (
            <button
              className="ct-follow-btn"
              onClick={handleFollowInstructor}
              title="Return to instructor playback"
            >
              ↩ Follow Instructor
            </button>
          )}
        </div>
        <div className="ct-statusbar-right">
          <span>{recording.language.toUpperCase()}</span>
          <span>Ln {cursorInfo.line}, Col {cursorInfo.column}</span>
          <span>{engine.state.speed}x</span>
        </div>
      </div>
    </div>
  );
};
