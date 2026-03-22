# CodeTube — Product Hunt Launch

---

## 🏷️ Tagline Options (60 chars max)

| Option | Chars | Notes |
|--------|-------|-------|
| `Interactive coding tutorials inside a real VS Code editor` | 58 ✅ | Clear and specific |
| `Learn to code by editing the tutorial, not just watching` | 57 ✅ | Benefit-first |
| `The open source Scrimba — tutorials as keystrokes, not video` | 61 ❌ | 1 over |
| `YouTube for code — watch, pause, fork, edit. Free forever.` | 58 ✅ | Energy + free angle |

**Recommended:** `Interactive coding tutorials inside a real VS Code editor`

---

## 📋 Short Description (under 260 chars)

```
CodeTube is a free, open source platform for interactive coding tutorials. Creators record their sessions as keystroke streams (not video). Viewers watch playback inside a Monaco editor — and can pause, fork, and edit the code at any point.
```

---

## 📖 Long Description

```
CodeTube is what happens when you ask: "What if YouTube for coding tutorials meant the tutorials were actually interactive?"

Instead of recording video, CodeTube captures your coding session as a stream of editor events — keystrokes, cursor movements, file switches, and annotations. These are replayed in a Monaco Editor (the same engine that powers VS Code), so what you watch IS a real code editor.

Here's what makes it special:

**Watch like a video.** Hit play and watch code appear character by character, with cursor movements, multi-file navigation, and inline annotations exactly as the instructor intended.

**Edit like it's your project.** At any point, pause and start typing. CodeTube branches the tutorial state at that exact moment — you get your own fork of the codebase to experiment with.

**Reset without losing your work.** Hit "Reset to Instructor" and the editor snaps back to the instructor's code at the current playback position. Your changes are preserved in your branch.

**Jump to checkpoints.** Instructors drop checkpoints throughout their tutorials — think chapter markers but smarter. Jump directly to "checkpoint 4: adding authentication" and the editor loads that exact state of the codebase.

**Tiny file sizes.** A 30-minute tutorial is ~600KB, not hundreds of MB. Recording keystrokes instead of pixels is simply more efficient.

**100% open source.** MIT licensed. Self-hostable. No lock-in.

CodeTube is the platform I wished existed when I was learning to code — where tutorials feel like pair programming, not passive watching.
```

---

## ✨ Key Features List

- 🎥 **Keystroke-based recording** — capture tutorials as editor events, not video frames
- 🖥️ **Monaco Editor playback** — watch and interact in the same editor as VS Code
- 🍴 **Tutorial branching** — fork a tutorial at any timestamp and edit freely
- ↩️ **Reset to instructor** — one click to restore the instructor's code at current position
- 📍 **Checkpoints** — instructor-defined jump points with full editor state snapshots
- ⚡ **Ultra-small file sizes** — 30min tutorial ≈ 600KB (not hundreds of MB)
- 🔍 **Seek by state** — jump to any point; the engine reconstructs exact editor state
- 🌐 **Open source** — MIT, self-hostable, no lock-in
- 🆓 **Free** — no paywalls, no Pro tier gating core features
- 📦 **Portable format** — `.ctrec` files are self-contained and playable offline

---

## 👤 Maker Story

```
I've been a developer for [X] years, and I've spent an embarrassing amount of time watching coding tutorial videos on 2x speed.

The ritual is always the same: play, pause, Alt-Tab to editor, type the thing I just watched, Alt-Tab back, realize I missed something, scrub back 15 seconds, repeat.

When I discovered Scrimba, I thought "this is it — this is how tutorials should work." Interactive, editor-first, you can actually touch the code. But $30/month locked a lot of good content behind a paywall, the editor wasn't Monaco, and there was no way to self-host it.

I wanted the same experience, but open. So I built CodeTube.

The core idea is almost embarrassingly simple: record what the user is *doing in the editor* rather than what's *on the screen*. Keystrokes, cursor moves, file changes. Compress them well. Replay them in Monaco.

The result is tutorials that are fully interactive, crazy small in file size, and feel like actual pair programming sessions — not lectures.

CodeTube is MIT licensed and free to use. I'm building it in public and I'd love to hear from developers, instructors, and learners who want to make it better.
```

---

## 💬 First Comment Template

```
Hey Product Hunt! 👋

Thanks for hunting CodeTube. I'm the maker — happy to answer any questions here.

A few things I'd especially love your feedback on:

1. **The branching UX** — when you pause and start editing, CodeTube forks the tutorial state at that timestamp. Does that feel intuitive, or does it need clearer explanation?

2. **For instructors**: what would make you want to create on this platform vs. just recording a YouTube video?

3. **For learners**: what's the biggest pain point with current coding tutorial formats that you'd want CodeTube to solve?

The backend is live and the recording format spec is finalized. Frontend playback is the current focus.

If you want to contribute or follow the build:
→ GitHub: [github.com/your-username/codetube]

Every star, comment, and upvote helps. Thank you 🙏
```

---

## 📅 Launch Checklist
- [ ] Upload a demo GIF/video showing playback + fork in action
- [ ] Add screenshots (tutorial browser, editor view, checkpoint timeline)
- [ ] Set launch date for a Tuesday or Wednesday
- [ ] Line up 5-10 upvotes from supporters in first 30 min (critical for ranking)
- [ ] Have team member "hunt" the product (can't hunt your own)
- [ ] Respond to every comment within 2 hours on launch day
