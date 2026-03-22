# Changelog

All notable changes to CodeTube will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2024-03-22

### 🎉 Initial Open Source Release

We're excited to announce the first public release of CodeTube! This version includes all the core features needed to create, share, and learn from interactive coding tutorials.

### ✨ Major Features

#### 🎬 Recording System
- **Keystroke Recording**: Records every keystroke and cursor movement with millisecond precision
- **Voice Synchronization**: Framework ready for AI voice narration integration
- **Compression**: Efficient compression reduces recording size by up to 90% compared to video
- **Validation**: Automatic validation and sanitization of recording data

#### 📺 Playback Engine
- **Monaco Editor Integration**: Full VS Code-like editor experience for viewers
- **Pause & Modify**: Pause at any moment and start coding yourself
- **Speed Control**: Adjust playback speed (0.5x - 2x)
- **Seek & Scrub**: Navigate to any point in the tutorial instantly
- **Syntax Highlighting**: Support for 50+ programming languages

#### 🔀 Fork System
- **One-Click Forking**: Create your own version of any tutorial instantly
- **Branch Management**: Multiple forks per tutorial with easy switching
- **Diff View**: Compare your fork with the original
- **Share Forks**: Share your modified tutorials with unique URLs

#### 👤 User Management
- **Authentication**: JWT-based auth with secure password hashing
- **User Profiles**: Showcase your created tutorials and learning stats
- **Progress Tracking**: Automatically track your progress across all tutorials
- **Favorites**: Save tutorials for later viewing

#### 🎨 Creator Tools
- **Web-Based Recorder**: Record directly from your browser
- **Voice Recording**: Sync your voice with code changes
- **Tutorial Metadata**: Add titles, descriptions, tags, and difficulty levels
- **Draft Mode**: Save work-in-progress tutorials privately

#### 🔧 Technical Features
- **REST API**: Complete API for all platform features
- **WebSocket Support**: Real-time collaboration and live sessions
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **Caching**: Redis for high-performance caching and session storage
- **Testing**: Comprehensive test suite with Jest

### 📦 Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Monaco Editor |
| Backend | Node.js 20, Express 5, TypeScript |
| Database | PostgreSQL 15, Prisma ORM |
| Cache | Redis 7 |
| Testing | Jest, Supertest |

### 🐛 Known Issues

- Voice AI integration is framework-only; actual TTS integration pending
- Mobile experience needs optimization
- Safari has minor cursor positioning issues during playback

### 📝 Notes

This is our MVP release. We're actively working on:
- AI voice generation with multiple voices
- Collaborative editing rooms
- Mobile app
- Plugin system for custom language support

---

## Contributing

See something missing? Check out our [Contributing Guide](CONTRIBUTING.md) to help shape the future of CodeTube!

---

[0.1.0]: https://github.com/yourusername/codetube/releases/tag/v0.1.0
