'use client';

import React, { useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { CodeEditor, CodeEditorRef } from '@/components/CodeEditor/CodeEditor';
import { Mic, MicOff, Video, VideoOff, Circle, Square, Pause, Bookmark, FileText, Plus, Play, Settings } from 'lucide-react';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export default function StudioPage(): React.JSX.Element {
  const editorRef = useRef<CodeEditorRef>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [activeTab, setActiveTab] = useState('files');
  const [files] = useState([
    { id: '1', name: 'App.tsx', language: 'typescript', isOpen: true },
    { id: '2', name: 'utils.ts', language: 'typescript', isOpen: false },
  ]);
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string; timestamp: number; label: string }>>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const initialCode = `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Count: {count}</h1>
      <button onClick={() => setCount(c => c + 1)} className="px-4 py-2 bg-blue-500 text-white rounded">
        Increment
      </button>
    </div>
  );
}`;

  const handleStartRecording = () => {
    setRecordingState('recording');
  };

  const handlePauseRecording = () => {
    setRecordingState('paused');
  };

  const handleResumeRecording = () => {
    setRecordingState('recording');
  };

  const handleStopRecording = () => {
    setRecordingState('stopped');
    setShowPublishModal(true);
  };

  const handleAddCheckpoint = () => {
    const newCheckpoint = {
      id: Date.now().toString(),
      timestamp: recordingTime,
      label: `Checkpoint ${checkpoints.length + 1}`,
    };
    setCheckpoints([...checkpoints, newCheckpoint]);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    return `${hours.toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-surface border-r border-overlay flex flex-col">
          <div className="flex border-b border-overlay">
            {['files', 'settings', 'checkpoints'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === tab ? 'text-brand border-b-2 border-brand' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'files' && (
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-brand/10 text-brand rounded-lg text-sm">
                  <Plus className="w-4 h-4" />
                  New File
                </button>
                <div className="mt-4 space-y-1">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                        file.isOpen ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:bg-elevated'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-secondary uppercase">Language</label>
                  <select className="w-full mt-1 px-3 py-2 bg-elevated rounded text-sm text-text-primary border border-transparent focus:border-brand focus:outline-none">
                    <option>TypeScript</option>
                    <option>JavaScript</option>
                    <option>Python</option>
                  </select>
                </div>
              </div>
            )}
            
            {activeTab === 'checkpoints' && (
              <div className="space-y-2">
                {checkpoints.length === 0 ? (
                  <p className="text-text-secondary text-sm text-center py-8">No checkpoints yet</p>
                ) : (
                  checkpoints.map((cp) => (
                    <div key={cp.id} className="flex items-center gap-2 px-3 py-2 bg-elevated rounded-lg">
                      <Bookmark className="w-4 h-4 text-amber" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{cp.label}</p>
                        <p className="text-xs text-text-secondary">{formatTime(cp.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-overlay">
            <div className="flex items-center gap-4">
              {recordingState === 'idle' && (
                <button onClick={handleStartRecording} className="flex items-center gap-2 px-4 py-2 bg-red text-white rounded-lg font-medium hover:bg-red/90">
                  <Circle className="w-4 h-4 animate-pulse" fill="currentColor" />
                  Start Recording
                </button>
              )}
              
              {recordingState === 'recording' && (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-red/10 text-red rounded-lg">
                    <Circle className="w-3 h-3 animate-pulse" fill="currentColor" />
                    <span className="font-mono">{formatTime(recordingTime)}</span>
                  </div>
                  <button onClick={handlePauseRecording} className="flex items-center gap-2 px-4 py-2 bg-elevated text-text-primary rounded-lg">
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                  <button onClick={handleAddCheckpoint} className="flex items-center gap-2 px-4 py-2 bg-elevated text-text-primary rounded-lg">
                    <Bookmark className="w-4 h-4 text-amber" />
                    Checkpoint
                  </button>
                  <button onClick={handleStopRecording} className="flex items-center gap-2 px-4 py-2 bg-elevated text-text-primary rounded-lg">
                    <Square className="w-4 h-4" fill="currentColor" />
                    Stop
                  </button>
                </>
              )}
              
              {recordingState === 'paused' && (
                <>
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber/10 text-amber rounded-lg">
                    <Pause className="w-4 h-4" />
                    <span className="font-mono">{formatTime(recordingTime)}</span>
                  </div>
                  <button onClick={handleResumeRecording} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg">
                    <Play className="w-4 h-4" fill="currentColor" />
                    Resume
                  </button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMicOn(!isMicOn)} className={`p-2 rounded-lg ${isMicOn ? 'bg-elevated' : 'bg-red/10 text-red'}`}>
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <CodeEditor ref={editorRef} language="typescript" value={initialCode} theme="codetube-dark" height="100%" />
          </div>
        </div>
        
        {/* Right Panel */}
        <div className="w-80 bg-surface border-l border-overlay flex flex-col">
          <div className="p-4 border-b border-overlay">
            <h3 className="font-semibold text-text-primary">Instructor Notes</h3>
          </div>
          <div className="flex-1 p-4">
            <textarea placeholder="Add your instructor notes here..." className="w-full h-full bg-transparent text-text-primary placeholder:text-text-muted resize-none focus:outline-none" />
          </div>
        </div>
        
        {/* Publish Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-xl p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-bold text-text-primary mb-4">Publish Tutorial</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Title</label>
                  <input type="text" className="w-full px-3 py-2 bg-elevated rounded-lg text-text-primary border border-transparent focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Description</label>
                  <textarea rows={3} className="w-full px-3 py-2 bg-elevated rounded-lg text-text-primary border border-transparent focus:border-brand focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-text-secondary">Cancel</button>
                <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 bg-brand text-white rounded-lg">Publish</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
