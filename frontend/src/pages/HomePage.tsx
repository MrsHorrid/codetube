import React from 'react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏺</div>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 800,
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, #ff4757, #ff6b7a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          CodeTube
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', margin: '0 0 40px 0', lineHeight: 1.6 }}>
          Record and share interactive coding tutorials.
          <br />
          Viewers can pause, edit, and explore your code live.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/studio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: 'var(--accent-red)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '16px',
              transition: 'background 0.15s',
            }}
          >
            🔴 Open Recording Studio
          </Link>
        </div>

        <div
          style={{
            marginTop: '60px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {[
            { icon: '⌨️', title: 'Keystroke Capture', desc: 'Records every keystroke with precise timestamps' },
            { icon: '🖱️', title: 'Cursor Tracking', desc: 'Captures cursor position and text selections' },
            { icon: '🚩', title: 'Checkpoints', desc: 'Mark important moments for easy navigation' },
          ].map((feat) => (
            <div
              key={feat.title}
              style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{feat.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>{feat.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
