import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RecordingCapture } from '@/components/RecordingCapture';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { RecordingFile } from '@/types/recording';
import { generateTestRecording, verifyRecording } from '@/utils/testRecording';

type Tab = 'record' | 'playback' | 'test';

export function StudioPage() {
  const [tab, setTab] = useState<Tab>('record');
  const [savedRecording, setSavedRecording] = useState<RecordingFile | null>(null);
  const [testRecording] = useState<RecordingFile>(() => generateTestRecording());
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const handleRecordingSaved = (rec: RecordingFile) => {
    setSavedRecording(rec);
  };

  const handleVerifyTest = () => {
    setVerifyResult(verifyRecording(testRecording));
  };

  const handleVerifySaved = () => {
    if (!savedRecording) return;
    setVerifyResult(verifyRecording(savedRecording));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '16px' }}>
      {/* Top nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '16px',
          padding: '12px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          <span style={{ color: 'var(--accent-red)', fontSize: '22px' }}>⏺</span>
          CodeTube
        </Link>

        <span
          style={{
            padding: '4px 10px',
            background: 'rgba(255,71,87,0.15)',
            border: '1px solid rgba(255,71,87,0.3)',
            borderRadius: '4px',
            color: 'var(--accent-red)',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Studio
        </span>

        {/* Tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {(['record', 'playback', 'test'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                background: tab === t ? 'var(--bg-tertiary)' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: tab === t ? 600 : 400,
                textTransform: 'capitalize',
              }}
            >
              {t === 'record' ? '🔴 Record' : t === 'playback' ? '▶ Playback' : '🧪 Test'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {tab === 'record' && (
          <RecordingCapture onSaved={handleRecordingSaved} />
        )}

        {tab === 'playback' && (
          <div>
            {savedRecording ? (
              <div>
                <div
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Playing back your last recording
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleVerifySaved}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Verify Recording
                    </button>
                  </div>
                </div>
                {verifyResult && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: verifyResult.valid
                        ? 'rgba(63,185,80,0.1)'
                        : 'rgba(255,71,87,0.1)',
                      border: `1px solid ${verifyResult.valid ? 'rgba(63,185,80,0.3)' : 'rgba(255,71,87,0.3)'}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: verifyResult.valid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {verifyResult.valid ? '✓ Recording is valid' : '✗ Recording has issues'}
                    </div>
                    {verifyResult.errors.map((e, i) => (
                      <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        • {e}
                      </div>
                    ))}
                  </div>
                )}
                <RecordingPlayer recording={savedRecording} />
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  No recording yet
                </div>
                <div style={{ fontSize: '14px' }}>
                  Go to the{' '}
                  <button
                    onClick={() => setTab('record')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-blue)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '14px',
                    }}
                  >
                    Record tab
                  </button>{' '}
                  to create a recording first.
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'test' && (
          <div>
            {/* Test recording info */}
            <div
              style={{
                marginBottom: '12px',
                padding: '14px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  🧪 Pre-generated 30-second Test Recording
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {testRecording.metadata.eventCount} events · {testRecording.checkpoints.length} checkpoints · {testRecording.chunks.length} chunks
                  {' · '}{testRecording.metadata.language}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleVerifyTest}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  🔍 Verify Test Recording
                </button>
              </div>
            </div>

            {/* Verification result */}
            {verifyResult && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: verifyResult.valid
                    ? 'rgba(63,185,80,0.08)'
                    : 'rgba(255,71,87,0.08)',
                  border: `1px solid ${verifyResult.valid ? 'rgba(63,185,80,0.3)' : 'rgba(255,71,87,0.3)'}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: '6px',
                    color: verifyResult.valid ? 'var(--accent-green)' : 'var(--accent-red)',
                    fontSize: '15px',
                  }}
                >
                  {verifyResult.valid ? '✓ All checks passed!' : '✗ Some checks failed'}
                </div>
                {verifyResult.errors.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '13px',
                      color: e.includes('warning') ? 'var(--accent-yellow)' : 'var(--text-secondary)',
                      padding: '2px 0',
                    }}
                  >
                    {e.includes('warning') ? '⚠' : '•'} {e}
                  </div>
                ))}
              </div>
            )}

            {/* Player */}
            <RecordingPlayer recording={testRecording} />
          </div>
        )}
      </div>
    </div>
  );
}
