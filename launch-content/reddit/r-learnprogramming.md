# Reddit Post — r/learnprogramming

**Subreddit:** r/learnprogramming  
**Flair:** Resource  

---

## Title

```
I built a coding tutorial platform where you can pause the video and edit the code yourself — and it snaps back when you resume. Open source and free.
```

---

## Post Body

```
I've been learning from coding tutorials for years, and the part that always annoyed me most is this:

You're watching a tutorial, the instructor writes some code, and you want to try a variation. So you pause, open your own editor, try the thing, realize it broke, and now you've lost your place in the tutorial and have no idea what the codebase looks like at this point.

I built **CodeTube** to fix this.

**How it works:**
- Tutorials are recorded as keystroke/event streams instead of video
- Playback happens inside a Monaco editor (same engine as VS Code)
- At any point, you can pause and edit the code directly
- Your edits create a "branch" — your own fork of the codebase at that moment
- Hit "Reset to Instructor" to restore the tutorial code without losing your edits

**The branching part is what I'm most excited about:**
You don't have to choose between following along and experimenting. Both live side-by-side. The instructor's code is always one click away.

**What else it has:**
- Checkpoints — instructor-defined jump points so you can navigate to "step 4: adding the database layer" and start from there
- Small file sizes — 30min tutorial ≈ 600KB (it's just keystroke data, not video)
- Free, no ads, no Pro tier. Open source (MIT)

**What it's NOT (yet):**
- It doesn't run your code. It's not a full IDE/sandbox — just the editor
- Mobile isn't great yet
- Content library is small (just launching)

If you've been frustrated with the "pause and Alt-Tab" loop of learning from video tutorials, I'd love for you to try it and tell me what's missing.

GitHub: [github.com/your-username/codetube]

Happy to answer any questions — especially if you're a learner who's tried Scrimba and has opinions 👇
```

---

## Notes
- Don't post as pure self-promotion — lead with the learner problem
- Respond to all comments within 1-2 hours
- If anyone mentions Scrimba, engage genuinely — acknowledge it, explain differences
- Good time to post: Tuesday-Thursday, 10am-2pm EST
