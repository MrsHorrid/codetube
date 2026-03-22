# Reddit Post — r/SideProject

**Subreddit:** r/SideProject  
**Flair:** Show Off  

---

## Title

```
After months of building in the evenings: CodeTube — an open source interactive coding tutorial platform (think Scrimba, but free and MIT licensed)
```

---

## Post Body

```
Hey r/SideProject 👋

Long-time lurker, first time properly sharing something here.

**What I built:** CodeTube — a platform for coding tutorials where playback happens inside a real VS Code-style editor that viewers can actually edit.

**The core idea:**
Instead of recording video, tutorials are captured as keystroke streams and played back in Monaco Editor. Viewers can pause mid-tutorial, edit the code, fork the tutorial state, then resume. The instructor's version is always there, one click away.

**Why I built it:**
Scrimba exists and is great — but it's $30/month, closed source, and uses a custom editor. I wanted the same concept but open source, free, and built on Monaco (so it feels like the tools you actually use).

**Months of evenings later:**
- Full REST API (auth, tutorials, recordings, progress, branching)
- WebSocket server for real-time session presence
- Custom recording format (event stream, brotli compressed, ~600KB for a 30min session)
- Complete DB schema with PostgreSQL
- Frontend architecture planned out in detail
- 80%+ test coverage on core API

**What's still WIP:**
The playback engine frontend is the current focus. The recording format is designed, the backend handles storage/retrieval, now I need to wire it all up in React + Monaco.

**Stats:**
- ~3,000 lines of backend TypeScript
- Full test suite
- MIT licensed, self-hostable

**GitHub:** [github.com/your-username/codetube]

If you've been working on anything in the dev tools / education space I'd love to trade notes. And if you've used Scrimba — I'd especially love your feedback on what you loved/hated about it.

Happy Sunday building 🛠️
```

---

## Notes
- This community loves the "built it myself" angle — lead with the journey
- Mention work hours invested (evenings/weekends) — relatable to the audience
- The Scrimba comparison gives immediate context without being dismissive
- Ask a genuine question at the end — drives comments
