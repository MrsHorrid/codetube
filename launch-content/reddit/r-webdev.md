# Reddit Post — r/webdev

**Subreddit:** r/webdev  
**Flair:** Showcase  

---

## Title

```
Show r/webdev: I built an open source coding tutorial platform that records keystrokes instead of video — playback is inside Monaco Editor
```

---

## Post Body

```
Hey r/webdev — I've been heads-down on a side project for a while and finally feel good enough about it to share.

**CodeTube** — a YouTube-style platform for coding tutorials where:

1. **Recording captures editor events, not pixels** — keystrokes, cursor positions, file switches, content deltas
2. **Playback is inside Monaco Editor** — same engine as VS Code, full syntax highlighting, multi-file support
3. **Viewers can edit mid-playback** — pause and start typing; a branch is created automatically at that timestamp
4. **Instructor's code is always recoverable** — "Reset to Instructor" does a three-way merge (checkpoint base + instructor events + viewer changes) and restores the tutorial state

---

**The tech I'm using:**

- Frontend: React 18 + Monaco Editor + Zustand + TanStack Query + shadcn/ui + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL (SQLite for dev) via Prisma
- Real-time: WebSockets (session presence, viewer counts)
- Storage: S3/MinIO for recording files
- Build: Vite

The recording format is a custom event stream — brotli-compressed 500-event chunks stored in a JSON envelope. The seek algorithm works by restoring the nearest checkpoint and fast-forwarding from there.

---

**What's interesting technically:**

The branching model is what I'm most proud of. The instructor's event stream is immutable. Viewer changes are a mutable layer on top. When you hit "Reset to Instructor," the engine:

1. Finds the nearest checkpoint before current playback time
2. Applies all instructor events from checkpoint → now
3. Merges with any viewer changes the user wants to keep

It's basically a simplified operational transform setup.

---

**Status:** Backend is complete (tested, ~80% coverage). Frontend architecture is done. Working on the playback engine now.

**Open source:** MIT, contributions welcome

GitHub: [github.com/your-username/codetube]

Would love thoughts on the architecture, especially the branching UX — is "fork the tutorial at a timestamp" intuitive, or does it need better UX framing?
```

---

## Notes
- This audience cares about the tech stack — lead with that
- Mention architecture details — webdevs will want to know how it works
- The Monaco editor angle resonates here (devs use VS Code)
- Be ready to discuss tech choices: "why Express over Fastify?" etc.
