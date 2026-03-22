import React from 'react';
import { MonitorPlay, Eye, PencilLine } from 'lucide-react';
import type { EditorMode } from '@/types/codetube';

interface Props {
  mode: EditorMode;
  onFollowInstructor: () => void;
  onExplore: () => void;
  onEdit: () => void;
}

export const ModeSwitcher: React.FC<Props> = ({
  mode, onFollowInstructor, onExplore, onEdit,
}) => {
  return (
    <div className="ct-mode-switcher">
      <button
        className={`ct-mode-btn ${mode === 'FOLLOWING' ? 'active' : ''}`}
        onClick={onFollowInstructor}
        title="Follow instructor (read-only playback)"
      >
        <MonitorPlay size={14} />
        Follow
        {mode === 'FOLLOWING' && <span className="ct-live-dot" />}
      </button>

      <button
        className={`ct-mode-btn ${mode === 'EXPLORING' ? 'active' : ''}`}
        onClick={onExplore}
        title="Explore the code (paused, read-only)"
      >
        <Eye size={14} />
        Explore
      </button>

      <button
        className={`ct-mode-btn ${mode === 'EDITING' ? 'active' : ''}`}
        onClick={onEdit}
        title="Edit the code freely"
      >
        <PencilLine size={14} />
        Edit
      </button>
    </div>
  );
};
