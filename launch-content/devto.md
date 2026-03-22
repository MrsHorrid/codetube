# Dev.to Blog Post — CodeTube

**Title:** How I Built an AI-Powered Coding Education Platform That Records Keystrokes, Not Video

**Tags:** `opensource` `tutorial` `webdev` `javascript`

**Cover image suggestion:** Screenshot of Monaco editor with a tutorial playing, showing the timeline controls

---

---

# How I Built an Interactive Coding Education Platform That Records Keystrokes, Not Video

I got fed up with the same ritual every developer learning from tutorials knows too well.

Play. Watch instructor type. Get distracted wanting to try something. Pause. Alt-Tab. Open editor. Try to remember where the codebase was at that moment. Type some things. Break it. Come back to the tutorial. Realize you missed three important lines. Scrub backward. Watch again.

This isn't learning. It's transcription with extra steps.

When I found Scrimba I thought: *this is it*. A platform where tutorials play back inside a real editor, and you can pause and edit the code directly. The execution was elegant. But it was closed source, paywalled, and the editor wasn't the one most developers actually use day-to-day.

So I built **CodeTube** — an open source alternative that takes the same core idea and builds it on Monaco Editor (the engine behind VS Code).

This is the story of how I built it, the technical decisions I made, and what I learned.

---

## The Core Insight: Record Events, Not Pixels

The first and most important decision: **don't record video**.

Video captures pixels. 1920×1080 at 30fps, even compressed, is an enormous amount of data for something that's literally just text appearing on a screen.

What actually needs to be recorded is:
- Which keys were pressed, and when
- Where the cursor was
- Which files were open, and when they changed
- What content was in each file at any given moment

This is a fundamentally smaller data model. Here's what a keystroke event looks like:

```typescript
interface KeyboardEvent extends BaseEvent {
  type: EventType.KEYBOARD;
  key: string;           // "a", "Enter", "Backspace"
  code: string;          // "KeyA"
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
}
```

And a content change:

```typescript
interface ContentEvent extends BaseEvent {
  type: EventType.CONTENT;
  fileId: string;
  operation: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number; };
  content?: string;   // For insert/replace
  length?: number;    // For delete
  checksum: string;   // Integrity verification
}
```

The numbers are dramatic. A 30-minute tutorial captured this way ends up around **600KB** — after delta encoding and brotli compression. The equivalent screen recording would be **hundreds of megabytes**.

---

## The Recording Format

Recordings are stored as `.ctrec` files — a JSON envelope containing:

1. **Header**: Metadata about the recording (title, language, duration, creator info, editor settings)
2. **Initial state**: The starting file tree with full content
3. **Event chunks**: Arrays of compressed events, broken into 500-event chunks
4. **Checkpoints**: Full editor state snapshots at key moments
5. **Seek index**: Time-based index for fast random access

```typescript
interface RecordingFile {
  header: {
    version: string;
    recordingId: string;
    tutorial: {
      title: string;
      language: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    };
  };
  initialState: {
    files: FileSnapshot[];
    activeFileId: string;
  };
  events: {
    totalCount: number;
    duration: number;
    chunks: EventChunk[]; // Brotli-compressed
  };
  checkpoints: Checkpoint[];
  index: SeekIndex;
}
```

The chunking is key. Rather than loading the entire recording at once, the playback engine fetches chunks on demand — enabling fast startup and smooth seeking.

---

## The Seek Problem

Seeking to timestamp T in a recording is a non-trivial problem.

The naive approach — "replay all events from the start up to T" — is O(n) and becomes painfully slow for long recordings.

The solution is **checkpoints**: full snapshots of the editor state stored at regular intervals (or at instructor-defined moments). To seek to timestamp T:

1. Find the nearest checkpoint **before** T
2. Restore the editor to that checkpoint state
3. Fast-forward through events from the checkpoint to T

This gives O(distance from nearest checkpoint) seek time. If checkpoints are every 60 seconds, the worst case is replaying 60 seconds of events.

```typescript
seekToTime(targetTime: number): void {
  // 1. Find nearest checkpoint before target
  const checkpoint = this.findNearestCheckpoint(targetTime);
  
  // 2. Restore checkpoint state
  this.restoreCheckpoint(checkpoint);
  
  // 3. Fast-forward events to target
  this.fastForward(checkpoint.timestamp, targetTime);
  
  this.currentTime = targetTime;
}
```

---

## The Branching Model

This is the part I'm most proud of designing.

When a viewer pauses and starts editing, they're not editing the tutorial — they're forking it. The instructor's event stream is **immutable**. The viewer's changes are a **mutable layer** on top.

```typescript
interface Branch {
  id: string;
  recordingId: string;
  userId: string;
  
  forkedAt: number;         // Timestamp in recording when forked
  baseState: EditorSnapshot; // State at fork point
  userChanges: UserChange[]; // What the viewer has edited
  
  isPublic: boolean;
}
```

When a viewer hits "Reset to Instructor," the engine:

1. Computes the instructor's state at the current playback position (checkpoint + forward events)
2. Applies that state to the editor
3. Either discards or stashes the viewer's changes

The viewer can keep both versions. This is effectively a three-way merge: the base state (checkpoint), the instructor's changes (events), and the viewer's changes (their edits).

The UX framing that clicked for me: it's like `git stash` + `git checkout` — your work isn't lost, it's just set aside while you follow along.

---

## The Playback Engine

The playback loop runs on `requestAnimationFrame`:

```typescript
private playbackLoop = (timestamp: number): void => {
  if (this.state !== PlaybackState.PLAYING) return;

  const deltaTime = timestamp - this.lastFrameTime;
  this.lastFrameTime = timestamp;
  
  this.currentTime += deltaTime * this.speed;
  
  // Process all events up to current time
  this.processPendingEvents();
  
  this.animationFrameId = requestAnimationFrame(this.playbackLoop);
};
```

Events are dispatched to Monaco through a thin adapter layer. Cursor movements use Monaco's `setCursorPosition` API. Content changes use Monaco's model edit operations — `editor.executeEdits()` — which is the same API used by VS Code extensions.

One interesting detail: for fast playback (2x, 3x), we skip animations and batch content changes to avoid saturating the Monaco diff reconciler.

---

## The Stack

**Frontend:**
- React 18 with Vite
- Monaco Editor (`@monaco-editor/react`)
- Zustand for state management
- TanStack Query for server state
- shadcn/ui + Tailwind for UI

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM (SQLite for dev, PostgreSQL for production)
- JWT authentication
- WebSockets for real-time session presence

**Storage:**
- S3/MinIO for recording files
- PostgreSQL for metadata, user data, progress

---

## Compression Details

Delta encoding reduces storage significantly:

- **Cursor events**: Only stored if >100ms has passed OR the cursor line changed OR the selection changed. This eliminates the constant stream of cursor-moved events during typing.
- **Content events**: Only the diff is stored, not the full document. A single character insertion is a few bytes.
- **Keystroke batching**: Rapid consecutive keystrokes are grouped into batches.

After delta encoding, everything goes through brotli compression, which gets another ~4x reduction on top.

---

## What I Learned

**1. The recording format needs to be designed first.**
I almost started building the UI before thinking carefully about the format. Luckily I didn't — the format decisions cascade everywhere. The seek index shape determines what queries you can make. The checkpoint granularity determines seek performance. These are hard to change later.

**2. The interesting problem is state management, not playback.**
Playback is roughly: "dispatch event to Monaco at the right time." State management — branching, seeking, resetting, merging — is where the real complexity lives. Design for that first.

**3. Open source from day one changes how you write code.**
Knowing the code will be public made me write better documentation, better TypeScript types, and better test coverage than I might have otherwise. Good constraint.

**4. SQLite for development is a superpower.**
The backend runs against SQLite locally with zero setup. Switching to PostgreSQL for production is a one-line change in the Prisma schema. More projects should do this.

---

## Where It's At Today

The backend is complete and tested. The recording format spec is finalized. The frontend architecture is designed. The playback engine is the current focus.

I'm building in public. Contributions welcome.

**GitHub:** [github.com/your-username/codetube]

If you've built something similar, have opinions on the branching UX, or want to contribute — I'd love to hear from you in the comments.

---

*What's the most frustrating thing about learning from video coding tutorials? Drop it below — it shapes what I build next.*
