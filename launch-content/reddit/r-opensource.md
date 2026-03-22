# Reddit Post — r/opensource

**Subreddit:** r/opensource  
**Flair:** New Release  

---

## Title

```
CodeTube — MIT licensed interactive coding tutorial platform. Records keystrokes instead of video; playback in Monaco Editor. Looking for contributors.
```

---

## Post Body

```
Hey r/opensource,

I've been building **CodeTube** — an open source platform for interactive coding tutorials, and I'm now at a stage where I want to open it up to contributors.

---

**What it does:**

CodeTube lets developers record and share coding tutorials as *editor event streams* rather than video. Playback happens inside Monaco Editor (the VS Code engine) — so viewers are watching inside a real IDE, not a video player.

Viewers can pause and edit the code at any point, fork the tutorial state, and restore the instructor's version anytime.

---

**Why open source matters here:**

Scrimba pioneered this concept and it's genuinely excellent — but it's closed source, costs money, and you can't self-host it. If your company wants to use this format internally for onboarding, you can't. If you want to contribute improvements, you can't. If you want to understand how it works, you can't.

CodeTube is MIT. Run it yourself. Fork it. Contribute to it. The recordings are in a documented, portable format.

---

**Current state:**

✅ Backend complete (Node.js + TypeScript + Express + Prisma)
✅ REST API: auth, tutorials, recordings, progress, forks
✅ WebSocket server for session presence
✅ Custom recording format spec (`.ctrec` files)
✅ PostgreSQL schema (SQLite for dev)
✅ Test suite (~80% coverage on core routes)
🔄 Frontend playback engine (React + Monaco) — WIP

---

**Good first issues I have in mind:**

- Recording player UI components (timeline, playback controls)
- Thumbnail generation from recording snapshots
- Search/filter UI for tutorial browser
- Dark/light theme toggle
- Tutorial embed widget (iframe-embeddable player)
- CLI tool for uploading recordings from local dev

---

**Stack:**
- Frontend: React 18 + Monaco Editor + Zustand + Tailwind + shadcn/ui
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL/SQLite (Prisma)
- Storage: S3/MinIO
- Real-time: WebSockets

---

**License:** MIT
**GitHub:** [github.com/your-username/codetube]

Would love contributors, issues, feedback, or just a ⭐ if you find it interesting. Ask me anything about the architecture.
```

---

## Notes
- This audience cares most about: license, self-hostability, contributing
- Lead with the open source value prop vs Scrimba
- List specific "good first issues" — encourages actual contributors
- Mention the license early and prominently
