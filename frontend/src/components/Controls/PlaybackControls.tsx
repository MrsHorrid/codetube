import React from 'react';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge,
} from 'lucide-react';
import type { EngineState } from '@/hooks/usePlaybackEngine';
import type { Checkpoint } from '@/types/codetube';

interface Props {
  state: EngineState;
  checkpoints: Checkpoint[];
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeek: (ms: number) => void;
  onSpeedChange: (speed: number) => void;
  onNextCheckpoint: () => void;
  onPreviousCheckpoint: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export const PlaybackControls: React.FC<Props> = ({
  state, checkpoints, onPlay, onPause, onResume, onStop,
  onSeek, onSpeedChange, onNextCheckpoint, onPreviousCheckpoint,
}) => {
  const progress = state.totalDuration > 0
    ? (state.currentTime / state.totalDuration) * 100
    : 0;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value) / 100;
    onSeek(pct * state.totalDuration);
  };

  const handlePlayPause = () => {
    if (!state.isPlaying) {
      onPlay();
    } else if (state.isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const isActuallyPlaying = state.isPlaying && !state.isPaused;

  return (
    <div className="ct-controls">
      {/* Timeline */}
      <div className="ct-timeline">
        <div className="ct-track">
          <div className="ct-progress" style={{ width: `${progress}%` }} />

          {/* Checkpoint dots */}
          {checkpoints.map((cp) => {
            const pct = state.totalDuration > 0
              ? (cp.timestamp / state.totalDuration) * 100
              : 0;
            return (
              <button
                key={cp.id}
                className="ct-checkpoint-dot"
                style={{ left: `${pct}%` }}
                onClick={() => onSeek(cp.timestamp)}
                title={cp.label}
              />
            );
          })}

          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleScrub}
            className="ct-scrubber"
            title="Seek"
          />
        </div>

        <div className="ct-times">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.totalDuration)}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="ct-buttons">
        <button className="ct-btn" onClick={onPreviousCheckpoint} title="Previous checkpoint">
          <SkipBack size={18} />
        </button>

        <button className="ct-btn" onClick={onStop} title="Reset to start">
          <RotateCcw size={18} />
        </button>

        <button className="ct-btn ct-btn--play" onClick={handlePlayPause} title={isActuallyPlaying ? 'Pause' : 'Play'}>
          {isActuallyPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>

        <button className="ct-btn" onClick={onNextCheckpoint} title="Next checkpoint">
          <SkipForward size={18} />
        </button>

        {/* Speed */}
        <div className="ct-speed">
          <Gauge size={14} />
          <select
            value={state.speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="ct-speed-select"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </div>

        {state.isComplete && (
          <span className="ct-complete-badge">✓ Complete</span>
        )}
      </div>
    </div>
  );
};
