# CodeTube — Twitter/X Launch Thread

---

## 🧵 THREAD (10 tweets)

---

**Tweet 1 — Hook**
```
I built something wild.

Imagine YouTube for coding tutorials — but instead of watching a video, you're watching the code being written in real-time inside a VS Code editor.

And you can pause it, edit the code yourself, then hit play and keep watching.

It's called CodeTube. 🧵
```

---

**Tweet 2 — The core idea**
```
Here's the thing that makes it different:

CodeTube doesn't record video. It records *keystrokes*.

Every character you type, every cursor move, every file switch — captured as events and replayed in a Monaco editor (the same one powering VS Code).

The result? 1-hour tutorial = ~1MB. Not 1GB.
```

---

**Tweet 3 — Demo description (viewer experience)**
```
What it looks like as a viewer:

🖥️ You land on a tutorial. A Monaco editor loads — fully themed, syntax highlighted.

▶️ You hit play. The code starts appearing character by character, cursor moving across lines.

⏸️ You spot something confusing. You pause it. You start editing directly.

You own that moment.
```

---

**Tweet 4 — Demo description (the fork system)**
```
It gets better.

When you start editing during playback, CodeTube creates a *branch* — your personal fork of the tutorial at that exact moment.

Hit "Reset to Instructor" and it snaps back to where the instructor left off.

It's like git branches but for learning. The instructor's code is always there.
```

---

**Tweet 5 — Checkpoints**
```
Instructors can drop *checkpoints* throughout their recordings.

Think chapter markers — but smarter.

Click a checkpoint → instantly jump to that state of the codebase.

Want to start coding from checkpoint 3 instead of following along from the beginning? You can.
```

---

**Tweet 6 — Why I built this**
```
I got tired of:
→ Scrubbing through 2-hour videos trying to find one line of code
→ Pausing, Alt-Tabbing, copying, coming back
→ Not being able to edit the tutorial code without losing my place
→ Paying $30/month for Scrimba

So I built the open source version. Free. Forever.
```

---

**Tweet 7 — Tech stack**
```
Tech stack for the nerds:

Frontend: React + Monaco Editor + Zustand + Tailwind
Backend: Node.js + Express + TypeScript
DB: PostgreSQL (SQLite for dev) via Prisma
Real-time: WebSockets
Storage: S3/MinIO for recording files

Recording format: custom keystroke event stream, brotli-compressed
```

---

**Tweet 8 — Storage comparison**
```
The compression numbers are wild:

10min typing session:
→ Raw events: ~5MB
→ After compression: ~200KB

30min tutorial:
→ ~600KB

Scrimba encodes actual video frames.
We encode { type: "keystroke", key: "a", timestamp: 1234 }

That's it. That's the whole trick.
```

---

**Tweet 9 — CTA — Star the repo**
```
CodeTube is fully open source (MIT).

The backend is live. The recording engine is designed. The playback engine is spec'd out.

I'm building in public and I'd love your feedback, contributions, and stars.

⭐ [github.com/your-username/codetube]

What features would you want first?
```

---

**Tweet 10 — Engagement question**
```
Quick question for devs who learn from tutorials:

What's the ONE thing that annoys you most about video coding tutorials?

a) Can't edit the code
b) No way to search the codebase
c) Video quality on small screens
d) Can't skip the "in this video we'll learn" intro

👇 Drop your answer
```

---

## Notes
- Add video/GIF attachments to tweets 3, 4, 5 when demo is ready
- Pin tweet 1 as a thread starter
- Post Tuesday-Thursday 9-11am EST for max reach
- Engage with every reply in first 2 hours
