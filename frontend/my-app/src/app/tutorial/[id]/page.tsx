'use client';

import React, { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { CodeEditor, CodeEditorRef } from '@/components/CodeEditor/CodeEditor';
import { PlaybackControls } from '@/components/PlaybackControls';
import { usePlaybackEngine } from '@/hooks/usePlaybackEngine';
import { useUserInteraction } from '@/hooks/useUserInteraction';
import { usePlaybackStore } from '@/stores/playbackStore';
import { ArrowLeft, Share2, GitFork, MoreHorizontal, CheckCircle2, Circle, PlayCircle, FileText, Download, MessageSquare, MonitorPlay, Pencil, Eye, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const MOCK_RECORDING = {
  id: 'rec-1',
  title: 'React Hooks Masterclass',
  description: 'Master useState, useEffect, and custom hooks with hands-on examples',
  language: 'typescript',
  initialCode: `import React from 'react';

function Counter() {
  return (
    <div>
      <h1>Count: 0</h1>
    </div>
  );
}

export default Counter;`,
  finalCode: `import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = 'Count: ' + count;
  }, [count]);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;`,
  duration: 7200000,
  events: [
    { timestamp: 5000, type: 'cursor', data: { line: 1, column: 1 } },
    { timestamp: 10000, type: 'insert', data: { text: ', { useState }', position: { line: 1, column: 26 } } },
  ],
  checkpoints: [
    { id: 'cp-1', timestamp: 0, label: 'Introduction', description: 'Getting started', codeSnapshot: '// Initial code', cursorPosition: { line: 1, column: 1 } },
    { id: 'cp-2', timestamp: 600000, label: 'useState', description: 'Understanding state', codeSnapshot: '// After useState', cursorPosition: { line: 4, column: 1 } },
  ],
  createdAt: '2024-03-01',
  updatedAt: '2024-03-01',
  instructor: { id: '1', name: 'Sarah Chen', avatar: null },
};

const LESSONS = [
  { id: '1', title: 'Introduction to Hooks', duration: 300, completed: true },
  { id: '2', title: 'useState Deep Dive', duration: 720, completed: true },
  { id: '3', title: 'useEffect Explained', duration: 1080, completed: false, current: true },
  { id: '4', title: 'Custom Hooks', duration: 900, completed: false },
];

export default function TutorialPlayerPage(): React.JSX.Element {
  const { id } = useParams();
  const editorRef = useRef<CodeEditorRef>(null);
  const playbackStore = usePlaybackStore();
  const [activeTab, setActiveTab] = useState('lessons');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { state, play, pause, resume, stop, seek, setSpeed, jumpToNextCheckpoint, jumpToPreviousCheckpoint } = usePlaybackEngine({
    recording: MOCK_RECORDING,
    editorRef,
  });

  useUserInteraction({ editorRef });

  const handleReset = () => {
    stop();
    setShowResetConfirm(false);
    playbackStore.setMode('following');
    playbackStore.setHasChanges(false);
  };

  const handleFollowInstructor = () => {
    if (playbackStore.hasChanges) {
      setShowResetConfirm(true);
    } else {
      playbackStore.setMode('following');
      if (editorRef.current) {
        editorRef.current.setValue(MOCK_RECORDING.initialCode);
      }
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-overlay">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-text-primary">{MOCK_RECORDING.title}</h1>
              <p className="text-sm text-text-secondary">by {MOCK_RECORDING.instructor.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-elevated text-text-primary rounded-lg">
              <GitFork className="w-4 h-4" />
              Fork
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-elevated text-text-primary rounded-lg">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-editor-bg border-b border-overlay">
              <div className="flex items-center gap-3">
                {playbackStore.mode === 'following' ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-sm">
                    <MonitorPlay className="w-4 h-4" />
                    Following Instructor
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1 bg-amber/10 text-amber rounded-full text-sm">
                    <Eye className="w-4 h-4" />
                    Exploring Code
                  </span>
                )}
                {playbackStore.hasChanges && <span className="text-xs text-amber">Your code differs from instructor</span>}
              </div>
              
              {playbackStore.mode !== 'following' && (
                <button onClick={handleFollowInstructor} className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary">
                  <RotateCcw className="w-4 h-4" />
                  Follow Instructor
                </button>
              )}
            </div>
            
            <div className="flex-1 relative">
              <CodeEditor ref={editorRef} language={MOCK_RECORDING.language} value={MOCK_RECORDING.initialCode} theme="codetube-dark" readOnly={playbackStore.mode === 'following'} height="100%" />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-80 bg-surface border-l border-overlay flex flex-col">
            <div className="flex border-b border-overlay">
              {['lessons', 'resources', 'comments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize ${activeTab === tab ? 'text-brand border-b-2 border-brand' : 'text-text-secondary'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'lessons' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h3 className="font-semibold text-text-primary">{MOCK_RECORDING.title}</h3>
                    <div className="mt-4">
                      <div className="h-2 bg-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: '38%' }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {LESSONS.map((lesson, index) => (
                      <button key={lesson.id} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${lesson.current ? 'bg-brand/10 border border-brand/20' : 'hover:bg-elevated'}`}>
                        <span>{lesson.completed ? <CheckCircle2 className="w-5 h-5 text-green" /> : lesson.current ? <PlayCircle className="w-5 h-5 text-brand" /> : <Circle className="w-5 h-5 text-text-muted" />}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${lesson.current ? 'text-brand' : 'text-text-primary'}`}>{index + 1}. {lesson.title}</p>
                          <p className="text-xs text-text-secondary">{Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'resources' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                    <Download className="w-5 h-5 text-brand" />
                    <span className="text-sm text-text-primary">starter-code.zip</span>
                  </div>
                </div>
              )}
              
              {activeTab === 'comments' && (
                <div className="text-center py-8 text-text-secondary">Comments will appear here</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Reset Confirmation */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Reset to instructor's code?</h3>
              <p className="text-text-secondary mb-6">Your edits will be lost.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 text-text-secondary">Cancel</button>
                <button onClick={handleReset} className="px-4 py-2 bg-brand text-white rounded-lg">Reset</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Playback Controls */}
        <PlaybackControls
          isPlaying={state.isPlaying}
          isPaused={state.isPaused}
          currentTime={state.currentTime}
          totalDuration={state.totalDuration}
          speed={state.speed}
          checkpoints={MOCK_RECORDING.checkpoints}
          onPlay={play}
          onPause={pause}
          onResume={resume}
          onStop={stop}
          onSeek={seek}
          onSpeedChange={setSpeed}
          onNextCheckpoint={jumpToNextCheckpoint}
          onPreviousCheckpoint={jumpToPreviousCheckpoint}
        />
      </div>
    </Layout>
  );
}
