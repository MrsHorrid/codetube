import React from 'react';
import { CodeTubeEditor } from '@/components/CodeTubeEditor/CodeTubeEditor';
import { mockRecording } from '@/data/mockRecording';

export function DemoPage() {
  return (
    <div className="app-root">
      <CodeTubeEditor
        recording={mockRecording}
        autoPlay={true}
        onCheckpointReached={(id, label) => {
          console.log('[CodeTube] Checkpoint reached:', id, label);
        }}
        onPlaybackComplete={() => {
          console.log('[CodeTube] Playback complete!');
        }}
      />
    </div>
  );
}
