# CodeTube — Hacker News Launch Post

---

## 🎯 Title Options (pick one)

**Option A (clearest):**
> Show HN: CodeTube – YouTube for coding tutorials where playback happens inside a real VS Code editor

**Option B (the twist):**
> Show HN: CodeTube – A coding tutorial platform that records keystrokes instead of video (open source)

**Option C (problem-first):**
> Show HN: I built an open source Scrimba alternative that stores tutorials as keystroke streams, not video

**Recommended: Option A** — immediately clear what it is, no jargon gating.

---

## 📝 Full Post Body

---

Hey HN,

I've been frustrated with coding tutorial platforms for a while. The problem isn't the content — it's the format. You're watching a video of someone typing code, and you have no way to interact with it. You pause, Alt-Tab to your editor, type the thing, come back, realize you missed something, scrub back, repeat.

Scrimba solved this really elegantly — they record coding tutorials as interactive editor sessions. But it's proprietary, costs money, and the editor experience lags behind what devs actually use day-to-day.

So I built **CodeTube**: an open source platform where coding tutorials are recorded as keystroke/event streams and played back inside a Monaco Editor (the engine behind VS Code).

---

### How it works

**Recording:**
Instead of capturing screen pixels, the recording client captures editor events:
- Keystroke events: `{ type: "kbd", key: "a", timestamp: 1234 }`  
- Cursor/selection events  
- Content delta events (operational-transform style)
- File open/close/switch events
- Instructor annotations (inline comments, highlights)

These are delta-compressed and brotli-encoded into 500-event chunks. A 30-minute tutorial ends up around 600KB vs. hundreds of MB for screen recording.

**Playback:**
The playback engine runs a requestAnimationFrame loop and dispatches events to Monaco. The result is a smooth, character-by-character replay of the coding session — cursor movements, file switches, annotations — all inside a real Monaco editor instance.

**The interesting part — branching:**
When a viewer starts editing mid-playback, the engine creates a "branch" — a fork of the tutorial state at that exact timestamp. The viewer can edit freely, then click "Reset to Instructor" to restore the instructor's code at the current playback position without losing their changes.

This is a three-way merge scenario: base state (checkpoint), instructor state (events applied up to now), and viewer state (user changes). The viewer can selectively keep or discard their changes.

---

### Why this is technically interesting

1. **The seek problem**: Seeking to timestamp T means: find the nearest checkpoint before T, restore from that snapshot, then fast-forward events to T. Checkpoints are full editor snapshots stored inline in the recording file. This makes seeks O(distance from last checkpoint) rather than O(recording length).

2. **Delta encoding**: Cursor events are sampled (only stored if >100ms passed OR line changed). Content events store only the diff, not the full document. This gives ~25x compression over naive storage.

3. **The branching model**: Immutable instructor event stream + mutable viewer layer on top. The viewer's changes are tracked as `TextOperation` objects timestamped to their position in the recording. This lets you compute "what is the instructor's code right now" independently of what the viewer has edited.

4. **Format portability**: The recording format (`.ctrec`) is a JSON envelope with brotli-compressed chunks, so recordings are portable and playable without a server.

---

### What's built so far

- Full backend (Node.js + Express + TypeScript + Prisma)
- REST API: auth, tutorials, recordings (with chunked upload), progress tracking, branches/forks
- WebSocket server for real-time session presence
- Complete DB schema (PostgreSQL, SQLite for dev)
- Recording file format spec
- Frontend architecture: React + Monaco + Zustand
- Playback engine design (implementation in progress)

The backend has 80%+ test coverage on the core routes.

---

### What's different from Scrimba

| Feature | Scrimba | CodeTube |
|---|---|---|
| Cost | $30/month for Pro | Free (open source) |
| Editor | Custom built | Monaco (VS Code engine) |
| Recording format | Video-based | Keystroke event stream |
| Storage per tutorial | ~100s MB | ~0.5-2MB |
| Branching | No | Yes, with merge |
| Self-hostable | No | Yes |
| Open source | No | MIT |

---

### What I'd love feedback on

1. The branching UX — does "fork the tutorial at a timestamp and edit freely" feel natural, or is it too confusing?
2. The recording format — any obvious improvements to the event schema?
3. Is there a better approach to the seek/checkpoint problem?
4. Would you use this? What's missing?

Repo: [github.com/your-username/codetube]

Thanks for reading — excited to hear your thoughts.

---

## Notes for posting
- Submit between 9am-12pm EST on a weekday (Mon-Wed performs best on HN)
- Don't post on a Friday
- Have the GitHub repo polished before posting (README, screenshots/GIF, LICENSE)
- Add a live demo link if possible — even a read-only demo of one tutorial
- Monitor the thread for 4-6 hours and respond to every comment
