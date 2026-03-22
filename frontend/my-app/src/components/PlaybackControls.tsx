// components/PlaybackControls.tsx
'use client';

import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  FastForward,
  Bookmark,
  Maximize2,
  Settings2
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalDuration: number;
  speed: number;
  checkpoints?: Array<{ id: string; timestamp: number; label: string }>;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onNextCheckpoint?: () => void;
  onPreviousCheckpoint?: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PlaybackControls({
  isPlaying,
  isPaused,
  currentTime,
  totalDuration,
  speed,
  checkpoints = [],
  onPlay,
  onPause,
  onResume,
  onStop,
  onSeek,
  onSpeedChange,
  onNextCheckpoint,
  onPreviousCheckpoint,
}: PlaybackControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    timeout = setTimeout(() => setIsVisible(false), 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * totalDuration;
    onSeek(newTime);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (isPaused) {
        onResume();
      } else {
        onPause();
      }
    } else {
      onPlay();
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-overlay transition-transform duration-300 z-40 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        {/* Timeline */}
        <div className="relative mb-3">
          <div className="h-2 bg-elevated rounded-full overflow-hidden">
            {/* Progress */}
            <div
              className="h-full bg-gradient-to-r from-brand to-brand/70 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Checkpoint markers */}
          {checkpoints.map((cp) => {
            const cpProgress = (cp.timestamp / totalDuration) * 100;
            return (
              <button
                key={cp.id}
                onClick={() => onSeek(cp.timestamp)}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 -ml-1.5 group"
                style={{ left: `${cpProgress}%` }}
                title={cp.label}
              >
                <div className="w-full h-full bg-amber rounded-sm rotate-45 group-hover:scale-125 transition-transform" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-elevated rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {cp.label}
                </div>
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
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onPreviousCheckpoint}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Previous checkpoint (Shift+←)"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={onStop}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Reset to start (R)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 flex items-center justify-center bg-brand text-white rounded-full hover:bg-brand/90 transition-colors shadow-brand"
            >
              {isPlaying && !isPaused ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
              )}
            </button>
            
            <button
              onClick={onNextCheckpoint}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Next checkpoint (Shift+→)"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          
          {/* Time display */}
          <div className="font-mono text-sm text-text-secondary tabular-nums">
            <span className="text-text-primary">{formatDuration(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatDuration(totalDuration)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Speed control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1 px-3 py-1.5 bg-elevated rounded-lg text-sm text-text-secondary hover:bg-overlay transition-colors"
              >
                <FastForward className="w-4 h-4" />
                {speed.toFixed(2)}x
              </button>
              
              {showSpeedMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSpeedMenu(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 bg-surface rounded-lg border border-overlay shadow-lg py-1 z-50">
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onSpeedChange(s);
                          setShowSpeedMenu(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm text-left hover:bg-elevated transition-colors ${
                          speed === s ? 'text-brand' : 'text-text-secondary'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
