<p align="center">
  <img src="https://via.placeholder.com/200x200/6366f1/ffffff?text=CT" alt="CodeTube Logo" width="120" height="120">
</p>

<h1 align="center">🎬 CodeTube</h1>

<p align="center">
  <strong>AI-generated coding courses with synced voice narration</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/codetube/stargazers"><img src="https://img.shields.io/github/stars/yourusername/codetube?style=flat-square&color=yellow" alt="Stars"></a>
  <a href="https://github.com/yourusername/codetube/network/members"><img src="https://img.shields.io/github/forks/yourusername/codetube?style=flat-square&color=blue" alt="Forks"></a>
  <a href="https://github.com/yourusername/codetube/issues"><img src="https://img.shields.io/github/issues/yourusername/codetube?style=flat-square&color=red" alt="Issues"></a>
  <a href="https://github.com/yourusername/codetube/blob/main/LICENSE"><img src="https://img.shields.io/github/license/yourusername/codetube?style=flat-square&color=green" alt="License"></a>
</p>

<p align="center">
  <strong>🚀 One-Click Deploy</strong><br>
  <a href="https://railway.app/template/your-template-id"><img src="https://railway.app/button.svg" alt="Deploy on Railway" height="30"></a>
  <a href="https://render.com/deploy?repo=https://github.com/yourusername/codetube"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="30"></a>
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/yourusername/codetube"><img src="https://vercel.com/button" alt="Deploy with Vercel" height="30"></a>
</p>

<p align="center">
  <a href="#-demo">Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🎥 Demo

<p align="center">
  <img src="https://via.placeholder.com/800x450/1e293b/cbd5e1?text=Demo+GIF+Coming+Soon" alt="CodeTube Demo" width="800">
  <br>
  <em>🚧 Interactive demo coming soon! Star the repo to get notified.</em>
</p>

> 🎬 **[Watch Demo Video](https://youtube.com/your-demo-link)** | 🚀 **[Live Demo](https://codetube-demo.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Interactive Playback** | Watch coding tutorials in a Monaco editor with full interactivity |
| 📝 **Keystroke Recording** | Records keystrokes and cursor movements (not video) for ultra-small file sizes |
| ⏸️ **Pause & Modify** | Pause at any moment and modify the code yourself |
| 🔀 **Fork Any Tutorial** | Create your own version of any tutorial at any point |
| 🎙️ **Voice Synchronization** | AI-generated voice narration perfectly synced with code changes |
| 📊 **Progress Tracking** | Track your learning progress across all tutorials |
| 🔍 **Smart Search** | Find tutorials by code patterns, topics, or voice transcript |
| 👤 **User Profiles** | Showcase your created tutorials and learning journey |

---

## 🚀 Quick Start

### Option 1: One-Click Deploy (Production in 2 minutes)

Deploy to your preferred platform:

| Platform | Button |
|----------|--------|
| **Railway** | [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id) |
| **Render** | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/codetube) |
| **Vercel** | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/codetube) |

### Option 2: Docker (Local Development)

```bash
# Clone and start with Docker
git clone https://github.com/yourusername/codetube.git && cd codetube

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate dev
```

### Option 3: Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/codetube.git && cd codetube

# 2. Start the backend (in one terminal)
cd backend && npm install && npm run dev

# 3. Start the frontend (in another terminal)
cd ../frontend && npm install && npm run dev
```

That's it! 🎉 Open [http://localhost:5173](http://localhost:5173) in your browser.

> 📖 **[Complete Deployment Guide](docs/PRODUCTION.md)** for detailed production setup instructions

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-latest-007ACC?style=flat-square)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.0+-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.0+-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.0+-DC382D?style=flat-square&logo=redis&logoColor=white)

### Infrastructure
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-real--time-010101?style=flat-square)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CODETUBE PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                      │
│  │   Creator    │────▶│  Recording   │────▶│   Upload     │                      │
│  │   Client     │     │   Engine     │     │   Service    │                      │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                      │
│         │                                          │                             │
│         │    ┌─────────────────────────────────────┘                             │
│         │    │                                                                   │
│         │    ▼                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                      │
│  │    Viewer    │◀────│   Playback   │◀────│   Stream     │                      │
│  │    Client    │     │    Engine    │     │   Service    │                      │
│  └──────────────┘     └──────────────┘     └──────────────┘                      │
│         │                                            ▲                          │
│         │         ┌──────────────────────────────────┘                          │
│         │         │                                                             │
│         ▼         ▼                                                             │
│  ┌─────────────────────────┐                                                    │
│  │   PostgreSQL + Redis    │  (State, Forks, Progress, Cache)                   │
│  └─────────────────────────┘                                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

> 📖 **[Full Architecture Documentation](docs/ARCHITECTURE.md)** | **[API Documentation](docs/API.md)**

---

## 📸 Screenshots

<p align="center">
  <img src="https://via.placeholder.com/400x250/1e293b/cbd5e1?text=Homepage" alt="Homepage" width="400">
  <img src="https://via.placeholder.com/400x250/1e293b/cbd5e1?text=Player+View" alt="Player View" width="400">
</p>
<p align="center">
  <img src="https://via.placeholder.com/400x250/1e293b/cbd5e1?text=Recorder+View" alt="Recorder View" width="400">
  <img src="https://via.placeholder.com/400x250/1e293b/cbd5e1?text=Fork+Creation" alt="Fork Creation" width="400">
</p>

---

## 🌍 Why CodeTube?

Traditional coding tutorials lock you into a passive viewing experience. **CodeTube changes the game:**

- 💾 **10x smaller** than video files (keystroke recordings vs. pixel data)
- ✏️ **Actually interactive** — pause and code along at any moment
- 🔀 **Fork anything** — create your own version when inspiration strikes
- 🤖 **AI-powered** — voice narration generated and synced automatically
- 📈 **Track progress** — know exactly where you left off

---

## 🤝 Contributing

We love contributions! Whether it's a bug fix, feature, or documentation improvement — every PR matters.

1. 🍴 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/amazing-feature`)
3. 💻 Make your changes
4. ✅ Run tests (`npm test`)
5. 📝 Commit your changes (`git commit -m 'Add amazing feature'`)
6. 🚀 Push to the branch (`git push origin feature/amazing-feature`)
7. 🔃 Open a Pull Request

> 📖 **[Contributing Guide](CONTRIBUTING.md)** | **[Code of Conduct](CODE_OF_CONDUCT.md)**

---

## 📋 Roadmap

- [x] Core playback engine with Monaco editor
- [x] Recording system for keystrokes & cursor
- [x] User authentication & profiles
- [x] Fork system for tutorial branching
- [x] Progress tracking
- [ ] AI voice generation integration
- [ ] Collaborative coding rooms
- [ ] Mobile app (React Native)
- [ ] Plugin system for custom languages
- [ ] Analytics dashboard for creators

---

## 🛡️ Security

Found a vulnerability? Please read our **[Security Policy](SECURITY.md)** to learn how to report it responsibly.

---

## 📜 License

CodeTube is open source software [licensed as MIT](LICENSE).

---

## 💖 Support

If you find CodeTube useful, please consider:

- ⭐ Starring this repository
- 🐦 Tweeting about it
- 🐛 Reporting bugs
- 🤝 Contributing code

<p align="center">
  <strong>Made with ❤️ by the CodeTube Team</strong>
</p>

<p align="center">
  <a href="https://twitter.com/codetube">Twitter</a> •
  <a href="https://discord.gg/codetube">Discord</a> •
  <a href="https://codetube.dev">Website</a>
</p>
