# CodeTube — UI/UX Design Document
> Interactive coding tutorial platform (Scrimba-style)
> Version 1.0 | March 2026

---

## 🎨 Design System

### Color Palette

```
Background Layer System (dark-first):
  --bg-base:       #0D1117   ← GitHub dark bg (deepest layer)
  --bg-surface:    #161B22   ← Cards, panels
  --bg-elevated:   #1C2128   ← Dropdowns, modals, tooltips
  --bg-overlay:    #21262D   ← Hovered items, active rows

Editor Colors (VSCode-compatible):
  --editor-bg:     #1E1E2E   ← Monokai Pro-inspired, distinct from chrome
  --editor-line:   #2A2A3C   ← Current line highlight

Accent (brand identity):
  --brand:         #7C3AED   ← Violet — code meets creativity
  --brand-glow:    #7C3AED33 ← Glow/halo for active states
  --brand-muted:   #4C1D95   ← Hover, secondary

Semantic Colors:
  --green:         #10B981   ← Success, live state, recording
  --amber:         #F59E0B   ← Warnings, checkpoints, fork state
  --red:           #EF4444   ← Errors, stop recording
  --blue:          #3B82F6   ← Info, links

Text:
  --text-primary:  #E6EDF3   ← Main readable text
  --text-secondary:#8B949E   ← Labels, metadata
  --text-muted:    #484F58   ← Disabled, placeholders
  --text-inverse:  #0D1117   ← On light/accent backgrounds

Syntax Highlighting (Monokai-variant):
  --syn-keyword:   #FF6B9D   ← keywords (function, const, return)
  --syn-string:    #A3E635   ← strings
  --syn-number:    #FB923C   ← numbers
  --syn-comment:   #6B7280   ← comments (italic)
  --syn-function:  #60A5FA   ← function names
  --syn-variable:  #E6EDF3   ← variables
  --syn-operator:  #F9A8D4   ← operators
  --syn-type:      #FBBF24   ← types/classes
```

### Typography

```
Code Font Stack:     "JetBrains Mono", "Fira Code", "Cascadia Code", monospace
UI Font Stack:       "Inter", "Geist", -apple-system, sans-serif
Display Font Stack:  "Cal Sans", "Plus Jakarta Sans", Inter, sans-serif

Scale:
  --text-xs:    11px  (0.6875rem) — line numbers, meta chips
  --text-sm:    13px  (0.8125rem) — labels, captions, code (default)
  --text-base:  15px  (0.9375rem) — body text
  --text-lg:    17px  (1.0625rem) — card titles, nav items
  --text-xl:    20px  (1.25rem)   — section headers
  --text-2xl:   26px  (1.625rem)  — page headers
  --text-3xl:   34px  (2.125rem)  — hero text

Font Weights:
  Code text → always weight 400 (regular) or 500 (medium)
  UI labels → 500 (medium)
  Headings  → 600 (semibold) or 700 (bold)
  Numbers/Stats → 700 tabular-nums

Line Height:
  Code: 1.6 (generous for readability in editor)
  UI body: 1.5
  Headings: 1.2
```

### Spacing & Layout

```
Grid: 8px base unit
  4px  — micro gaps (icon+label)
  8px  — tight (list items)
  12px — compact
  16px — standard component padding
  24px — section gaps
  32px — large gaps
  48px — section separators
  64px — page sections

Border Radius:
  --radius-sm:  4px   (badges, tags)
  --radius-md:  8px   (buttons, inputs)
  --radius-lg:  12px  (cards)
  --radius-xl:  16px  (modals, sheets)
  --radius-full: 9999px (pills, avatars)

Shadows:
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.4)
  --shadow-md:  0 4px 12px rgba(0,0,0,0.5)
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.6)
  --shadow-brand: 0 0 20px rgba(124,58,237,0.3)  ← glow for active
```

### Iconography
- Library: **Lucide Icons** (consistent, clean, open source)
- Size: 16px inline, 20px standalone, 24px feature icons
- Stroke width: 1.5px (feels premium without being chunky)

---

## 📱 Responsive Strategy

```
Breakpoints:
  Mobile:  <768px   → VIEW-ONLY mode (no interaction with editor)
  Tablet:  768–1024px → Simplified player, touch-friendly controls
  Desktop: >1024px  → Full experience

Mobile Philosophy:
  - The editor is sacred on desktop. On mobile it becomes a "code viewer"
  - Syntax highlighted, scrollable, zoomable — but not editable
  - A prominent "Open on Desktop" CTA for interactive tutorials
  - Home/Discovery + Profile pages are fully mobile-optimized
  - Creator Studio: Desktop-only (show locked state on mobile)
```

---

## 🏠 Screen 1: Home / Discovery Page

### Layout Overview

```
┌──────────────────────────────────────────────────────────┐
│ NAVBAR                                                   │
│ [≡ CodeTube]  [Search.........................]  [▶ New] │
│               [Explore ▾] [Community] [Sign in]         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  HERO BANNER (featured tutorial of the day)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🟣 FEATURED                                     │   │
│  │                                                  │   │
│  │  [Editor Preview - animated code snippet]        │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │ const fibonacci = (n) => {                 │  │   │
│  │  │   if (n <= 1) return n;                    │  │   │
│  │  │   return fibonacci(n-1) + fibonacci(n-2);  │  │   │
│  │  │ }                    ← types itself live   │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                                                  │   │
│  │  "Dynamic Programming Masterclass"               │   │
│  │  by @sarah_codes · 2.3h · Advanced               │   │
│  │  [▶ Start Tutorial]  [Preview]                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  CATEGORIES                                              │
│  [All] [JavaScript] [Python] [React] [Rust] [Go] [+]   │
│                                                          │
│  TRENDING NOW                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ [Editor] │ │ [Editor] │ │ [Editor] │ │ [Editor] │  │
│  │ Preview  │ │ Preview  │ │ Preview  │ │ Preview  │  │
│  │          │ │          │ │          │ │          │  │
│  │ Title    │ │ Title    │ │ Title    │ │ Title    │  │
│  │ @creator │ │ @creator │ │ @creator │ │ @creator │  │
│  │ 1.2h · ⭐│ │ 45m · 🔥 │ │ 2h · NEW │ │ 30m · ✓ │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  CREATOR SPOTLIGHTS                                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ● LIVE NOW — @dan_abramov teaching React Hooks   │  │
│  │  [Avatar] Dan Abramov · 1.4k watching · [Join →] │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  YOUR PROGRESS (if logged in)                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Continue where you left off                       │  │
│  │ [Tutorial thumb] "Async/Await Deep Dive" — 67%   │  │
│  │                            [Continue ▶]          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  POPULAR THIS WEEK  [by category ▾]                     │
│  ... more tutorial cards ...                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Navbar Details

```
Left:   [≡ Hamburger] + CodeTube wordmark (violet gradient)
Center: Search bar — prominent, takes 40% width
        Placeholder: "Search tutorials, creators, topics..."
        On focus: expands slightly + drop-shadow, shows recent searches
Right:  [Explore ▾] [Community] [Create +] [Notifications 🔔] [Avatar]

Search UX:
  - Instant results as you type (debounced 200ms)
  - Results grouped: Tutorials / Creators / Topics
  - Keyboard: ↑↓ to navigate, Enter to select, Esc to close
  - Cmd+K (Mac) / Ctrl+K (Win) focuses search from anywhere
```

### Tutorial Card Component

```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │  EDITOR THUMBNAIL     │  │  ← Static syntax-highlighted preview
│  │  (code screenshot or  │  │    NOT a video thumbnail
│  │   animated preview)   │  │    Language badge top-right
│  │                  [JS] │  │
│  └───────────────────────┘  │
│                             │
│  Advanced React Patterns    │  ← Title (2 lines max, truncate)
│  @sarah_codes               │  ← Creator handle (violet, clickable)
│  2.4h · ⭐4.8 · 3.2k learns │  ← Meta row
│                             │
│  [████████░░░░░░░░░] 67%   │  ← Progress bar (if started)
│                             │
│  [▶ Continue]               │  ← CTA (changes: Start / Continue / Review)
└─────────────────────────────┘

Hover state:
  - Card lifts (transform: translateY(-4px))
  - Editor preview animates (code types itself for 1–2s)
  - Shadow intensifies with violet glow
  - "Preview" button appears overlay on thumbnail
```

### Category Tabs

```
[All] [JavaScript] [Python] [React] [TypeScript] [Rust] [Go] [SQL] [+More]

Active tab: filled violet pill
Inactive: ghost / text only
Overflow: scrollable horizontally on mobile, "More" dropdown on desktop
Each category has a language icon (devicons)
```

### Creator Spotlight

```
Two variants:

1. LIVE CREATOR BANNER (top priority, pulsing green dot):
   ┌─────────────────────────────────────────────────────┐
   │  🟢 LIVE  @dan_abramov is teaching right now        │
   │  ████████████████░░░░░░░░░░  1,423 watching         │
   │  "React Server Components from scratch"             │
   │                              [Join Live →]          │
   └─────────────────────────────────────────────────────┘

2. FEATURED CREATORS ROW (horizontal scroll):
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  [Ava]   │ │  [Ava]   │ │  [Ava]   │
   │  @handle │ │  @handle │ │  @handle │
   │ 48 tuts  │ │ 12 tuts  │ │ 89 tuts  │
   │ [Follow] │ │ [Follow] │ │[Following│
   └──────────┘ └──────────┘ └──────────┘
```

---

## ▶️ Screen 2: Tutorial Player Page (CORE EXPERIENCE)

### Philosophy
The code editor IS the content. Everything else gets out of the way.
Think: a video player where the "video" is Monaco editor.

### Full Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [← Back] CodeTube                    [Fork] [Share] [≡ More]  │  ← Thin top bar (48px)
├─────────────────────────────────────┬──────────────────────────┤
│                                     │                          │
│                                     │  LESSON SIDEBAR          │
│   MONACO EDITOR  (main stage)       │  ─────────────────────   │
│                                     │  ▸ 1. Introduction       │
│   ┌─────────────────────────────┐   │  ▸ 2. Setup              │
│   │ 1  const greet = (name) => {│   │  ● 3. Arrow Functions ←  │  ← current
│   │ 2    return `Hello ${name}` │   │  ○ 4. Closures           │
│   │ 3  }                        │   │  ○ 5. Higher Order Fns   │
│   │ 4                           │   │  ○ 6. Quiz & Challenge   │
│   │ 5  // Try calling greet()   │   │  ─────────────────────   │
│   │ 6  greet("World")           │   │                          │
│   │ 7                           │   │  INSTRUCTOR NOTES        │
│   │ ~  [cursor blinks here]     │   │  "Today we'll explore    │
│   │                             │   │  arrow functions and     │
│   └─────────────────────────────┘   │  how they differ from    │
│                                     │  regular functions..."   │
│                                     │                          │
│                                     │  [▶ Show Output]         │
│                                     │                          │
├─────────────────────────────────────┴──────────────────────────┤
│  FLOATING CONTROLS (bottom, auto-hides on idle)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [⏮] [⏪] [⏸] [⏩] [⏭]   ─────●────────────  1:24/8:42  │  │
│  │                                                  [1.0x ▾] │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Playback Controls (Floating Bar)

```
Controls bar appears at bottom, semi-transparent (blur backdrop):
bg: rgba(13,17,23,0.85) + backdrop-filter: blur(12px)
border-top: 1px solid rgba(255,255,255,0.06)

┌──────────────────────────────────────────────────────────────┐
│  [⏮ Skip to start] [⏪ -10s] [⏸ Pause] [⏩ +10s] [⏭ Next]  │
│                                                              │
│  Timeline:                                                   │
│  ──●──◆────────────◆──────────────◆────────────────  8:42  │
│     ↑               ↑              ↑                         │
│  current         checkpoint     checkpoint                   │
│  position        (hover: "Variables intro")                  │
│                                                              │
│  Left:  [⏮] [⏪] [⏸] [⏩] [⏭]                              │
│  Right: [Speed: 1.0x ▾] [Quality ▾] [Fullscreen ⛶]         │
└──────────────────────────────────────────────────────────────┘

Timeline details:
  - Filled portion: --brand (#7C3AED)
  - Unfilled: --bg-overlay
  - Hover: shows timestamp tooltip + code preview popover
  - Checkpoint markers: amber diamonds ◆ (clickable, skip to checkpoint)
  - Drag: scrubbing updates editor in real-time

Speed options: 0.5x / 0.75x / 1.0x / 1.25x / 1.5x / 2.0x
Auto-hide: controls fade out after 3s of no mouse movement
Re-appear: on any mouse move, touch, or keypress
```

### State Indicators (CRITICAL UX)

#### Playback State Badge (top-left of editor)

```
LIVE state (recording in progress / live session):
  ┌──────────────────────┐
  │  🟢 LIVE             │
  └──────────────────────┘
  Green pulsing dot + "LIVE" text
  bg: rgba(16,185,129,0.15), border: 1px solid #10B981
  The dot pulses with CSS animation (scale 1→1.4→1, 2s loop)

PLAYBACK state (watching tutorial):
  ┌──────────────────────┐
  │  ▶ PLAYBACK          │
  └──────────────────────┘
  Static, neutral — this is the default, not intrusive

PAUSED state:
  ┌──────────────────────┐
  │  ⏸ PAUSED · 3:42    │
  └──────────────────────┘
  Slightly dimmer, shows current timestamp

FORKED / YOUR EDITS state:
  ┌──────────────────────────────────────────────┐
  │  ✏️ YOUR EDITS  [Follow Instructor ↩]        │
  └──────────────────────────────────────────────┘
  Amber (#F59E0B) accent
  bg: rgba(245,158,11,0.12), border: 1px solid #F59E0B
  Appears immediately when user modifies ANY code
  "Follow Instructor ↩" button resets to instructor's version
```

#### Fork State — Full Detail

```
When user modifies code, THREE things happen simultaneously:

1. State badge changes (top-left) → shows amber "YOUR EDITS" badge

2. Gutter indicator:
   Modified lines get amber left-border (like git diff in VSCode):
   │● 6  greet("Universe")   ← amber dot + border
   Original line was: greet("World")

3. Bottom status bar adds:
   "⚠ 2 lines edited from instructor's version"
   [Diff View] [Reset All] [Keep & Fork]

"Follow Instructor ↩" behavior:
  - Click → confirmation toast: "Reset to instructor's code? Your edits will be lost."
  - [Reset] [Cancel]
  - On reset: editor animates back to instructor version (150ms fade)
  - State badge returns to PLAYBACK state

"Keep & Fork" behavior:
  - Saves user's version as a permanent fork
  - Creates new tutorial entry in their profile under "My Forks"
  - User can continue editing as their own version
  - Option to publish fork as a new tutorial
```

### Checkpoint System

```
On the timeline, instructors can mark key moments as CHECKPOINTS:
  ◆ = checkpoint marker (amber diamond)

Hover on checkpoint:
  ┌──────────────────────────────┐
  │  ◆ Checkpoint 2 · 3:42      │
  │  "Variables and Scope"       │
  │  [Jump here]                 │
  └──────────────────────────────┘

Sidebar also shows checkpoints in lesson list:
  ◆ Variables and Scope  3:42
  ◆ Hoisting Explained   6:15
  ◆ Quiz time!           8:00

Clicking jumps editor to that exact code state
```

### Editor Chrome (Minimal)

```
Tab bar (like VSCode):
  [script.js ×] [utils.js] [index.html]
  Minimal — same style as VSCode tabs
  Language icon on each tab

File is the "video" — filenames are tutorial-authored

Status bar (bottom of editor, 22px tall):
  Left:  Ln 6, Col 12  |  JavaScript  |  UTF-8
  Right: [▶ Run]  |  Output ▾  (secondary actions)

Line numbers: shown (helps learners follow along)
Minimap: HIDDEN by default (distracting, saves space)
Word wrap: tutorial author controls this setting
```

### Output / Console Panel

```
Collapsible panel below editor (default: closed)
Toggle with [▶ Show Output] button in sidebar or Ctrl+` 

┌─────────────────────────────────────────┐
│ OUTPUT  ✓ No errors          [Clear] [×]│
├─────────────────────────────────────────┤
│ > Hello, World!                         │
│ > Function returned: 42                 │
│                                         │
│ [CONSOLE] [PROBLEMS] [TERMINAL]         │
└─────────────────────────────────────────┘
```

### Keyboard Shortcuts

```
Global (works anywhere on page):
  Space          → Play / Pause
  ←              → Skip back 10 seconds
  →              → Skip forward 10 seconds
  Shift+←        → Previous checkpoint
  Shift+→        → Next checkpoint
  F              → Fullscreen (editor only, hides sidebar)
  Escape         → Exit fullscreen / close modals
  Ctrl+K / Cmd+K → Focus search
  R              → Reset to instructor (with confirmation)
  0-9            → Jump to 0%–90% of tutorial

Editor-specific (when editor is focused):
  Ctrl+` → Toggle output panel
  Ctrl+Z → Undo (editor undo, NOT tutorial undo)
  Ctrl+Enter → Run code

Shown in: ? Help overlay (press ? to open)
```

### Sidebar — Lesson List

```
Fixed right panel, 280px wide (collapsible):

┌─────────────────────────────────────┐
│ React Hooks Masterclass             │
│ @sarah_codes · 2.4h total           │
├─────────────────────────────────────┤
│ LESSONS                             │
│                                     │
│  ✅ 1. Introduction          (5m)  │  ← completed (green check)
│  ✅ 2. useState Basics       (12m) │
│  ● 3. useEffect Deep Dive   (18m) │  ← current (violet dot)
│  ○ 4. Custom Hooks          (15m) │  ← not started
│  ◆ 5. Challenge: Build Hook (20m) │  ← checkpoint/quiz
│  ○ 6. Performance & Memo    (22m) │
│                                     │
│ Progress: ██████░░░░░░  38%         │
├─────────────────────────────────────┤
│ RESOURCES                           │
│  📎 starter-code.zip                │
│  📚 MDN: useEffect docs             │
│  💬 Discussion (42 comments)        │
└─────────────────────────────────────┘
```

### Mobile Player (View-Only Mode)

```
┌─────────────────────────────┐
│ ← Back      CodeTube        │
├─────────────────────────────┤
│                             │
│  SYNTAX HIGHLIGHTED CODE    │
│  (read-only, scrollable)    │
│                             │
│  const greet = (name) => { │
│    return `Hello ${name}`  │
│  }                          │
│                             │
├─────────────────────────────┤
│ ⏮  ⏪  ⏸  ⏩  ⏭   1.0x  │
│ ──●────────────────  3:42  │
├─────────────────────────────┤
│ 📝 Instructor Notes        │
│ Variables and scope...      │
├─────────────────────────────┤
│  💻 Full experience on desktop │
│     [Copy link] [Share]       │
└─────────────────────────────┘

Mobile UX decisions:
  - Editor is NOT editable on mobile (Monaco not ideal for touch)
  - Code is rendered as syntax-highlighted HTML instead
  - Pinch-to-zoom works on code
  - Playback still works fully
  - "Full experience on desktop" banner persists (not intrusive)
```

---

## 🎬 Screen 3: Creator Studio

### Overview Layout

```
┌───────────────────────────────────────────────────────────────┐
│ Creator Studio                          [Preview] [Publish →] │
├───────────┬───────────────────────────────────┬───────────────┤
│           │                                   │               │
│  LEFT     │  MONACO EDITOR                    │  RIGHT        │
│  PANEL    │  (recording area)                 │  PANEL        │
│           │                                   │               │
│ [New]     │  ┌───────────────────────────┐   │ Recording     │
│ [Open ▾]  │  │ 1  // Your code here...  │   │ Controls      │
│           │  │ 2                         │   │               │
│ Files     │  │ 3                         │   │ [🔴 REC]      │
│ ─────── │  │ ~                         │   │               │
│ script.js │  └───────────────────────────┘   │ 0:00:00       │
│ utils.js  │                                   │               │
│           │  RECORDING TOOLBAR                │ [◆ Checkpoint]│
│           │  [🔴 Start Recording]             │               │
│           │  [⏸ Pause] [⏹ Stop]             │ Checkpoints   │
│           │  [◆ Mark Checkpoint]              │ ─────────── │
│           │  [↩ Undo Last Take]              │ None yet...   │
│           │                                   │               │
│ SETTINGS  │                                   │ [+ Add note]  │
│ ─────── │                                   │               │
│ Language  │                                   │               │
│ Theme     │                                   │ Waveform      │
│ Font Size │                                   │ ▁▃▅▇▅▃▁▂▄▆  │
│ Word Wrap │                                   │ (voice audio) │
└───────────┴───────────────────────────────────┴───────────────┘
```

### Recording States

```
PRE-RECORDING (idle):
  Large centered CTA if no tutorial started:
  ┌──────────────────────────────────┐
  │                                  │
  │  Start your tutorial             │
  │  Write your code, then hit record│
  │                                  │
  │  [🔴 Start Recording]           │
  │                                  │
  │  💡 Tip: Set up your code first, │
  │  then record your explanation    │
  └──────────────────────────────────┘

RECORDING (active):
  Red pulsing indicator in top bar:
  ● REC  0:02:34

  Editor gets subtle red border (1px solid rgba(239,68,68,0.4))
  Recording toolbar becomes:
  [⏸ Pause Recording] [◆ Checkpoint] [⏹ Stop & Save]

PAUSED:
  Amber border on editor
  [⏺ Resume] [◆ Checkpoint] [⏹ Stop & Save]

POST-RECORDING (review):
  Full preview player opens:
  → User watches back their recording
  → Can trim start/end
  → Can re-record specific segments
  → Add title, description, thumbnail, tags
```

### Checkpoint Marking UI

```
While recording, press [◆ Checkpoint] or Ctrl+M:

  → Checkpoint marker appears on recording timeline (amber ◆)
  → Sidebar shows: "+ Checkpoint at 2:34"
  → Quick label input appears:
    ┌────────────────────────────────────────┐
    │ ◆ Label this checkpoint (optional)     │
    │ [Variables and scope____________] [OK] │
    └────────────────────────────────────────┘
  → Press Enter or click OK to confirm, Esc to dismiss (keeps checkpoint)
```

### Pre-Publish Review Screen

```
┌──────────────────────────────────────────────────────────┐
│ Review Before Publishing                                 │
├────────────────────────────┬─────────────────────────────┤
│  PREVIEW PLAYER            │  TUTORIAL INFO              │
│                            │                             │
│  [Full player experience   │  Title:                     │
│   exactly as learners      │  [React Hooks Masterclass_] │
│   will see it]             │                             │
│                            │  Description:               │
│                            │  [____________________]     │
│                            │  [____________________]     │
│                            │                             │
│                            │  Tags:                      │
│                            │  [react] [hooks] [+ Add]   │
│                            │                             │
│                            │  Difficulty:                │
│                            │  ○ Beginner  ● Intermediate │
│                            │  ○ Advanced                 │
│                            │                             │
│                            │  Thumbnail:                 │
│                            │  [Auto-generated ✓]         │
│                            │  [Upload custom]            │
│                            │                             │
│                            │  Visibility:                │
│                            │  ● Public  ○ Unlisted       │
│                            │  ○ Private                  │
│                            │                             │
│                            │  [← Back] [Publish Now →]  │
└────────────────────────────┴─────────────────────────────┘
```

### Analytics Dashboard

```
Tab within Creator Studio: [Studio] [Analytics] [My Tutorials]

┌──────────────────────────────────────────────────────────┐
│ Analytics                        [Last 7d ▾] [Export]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  STATS ROW                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  1,234   │ │  89%     │ │  4.8 ⭐  │ │  342     │   │
│  │  Learners│ │Completion│ │  Rating  │ │   Forks  │   │
│  │  +12%↑   │ │  +3% ↑  │ │          │ │  +28 ↑   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  ENGAGEMENT CHART                                        │
│  (Where do learners drop off?)                           │
│  100% ┤█████████████▄▂▁░░░░░░░░░░░░░                   │
│   75% ┤                                                  │
│   50% ┤                                                  │
│   25% ┤                       ← Drop at checkpoint 3    │
│    0% └──────────────────────────────────────────        │
│        0        2:00        4:00      6:00     8:42      │
│                                                          │
│  TOP TUTORIALS                                           │
│  1. React Hooks Masterclass     1,234 learners  4.8★    │
│  2. Arrow Functions Deep Dive     892 learners  4.9★    │
│  3. Async/Await Explained         445 learners  4.7★    │
│                                                          │
│  RECENT COMMENTS                                         │
│  @user123: "The checkpoint at 3:42 was so helpful!"     │
│  @dev_jane: "Can you do one on custom hooks?"            │
│  [View all comments →]                                   │
└──────────────────────────────────────────────────────────┘
```

---

## 👤 Screen 4: User Profile

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ [← Back]                              [Edit Profile ⚙]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  PROFILE HEADER                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  [Avatar]  Sarah Chen                             │   │
│  │  ●●●●●     @sarah_codes                           │   │
│  │            "Making complex things simple."         │   │
│  │            📍 San Francisco  🌐 sarah.dev          │   │
│  │                                                    │   │
│  │  1,234 Learners · 48 Tutorials · 892 Forks        │   │
│  │                                                    │   │
│  │  Joined March 2024 · 🔥 42-day streak             │   │
│  │                                                    │   │
│  │  [Follow] [Message] [···]                         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [Tutorials] [Completed] [My Forks] [Certificates]      │  ← Tabs
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TAB: COMPLETED TUTORIALS                                │
│                                                          │
│  PROGRESS OVERVIEW                                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ████████████████░░░░  12/20 tutorials           │    │
│  │  JavaScript: ████████ 8  React: ████ 4           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ✅ React Hooks Masterclass      Completed Mar 10       │
│  ✅ Async/Await Deep Dive        Completed Mar 8        │
│  🔄 Advanced TypeScript          In progress · 45%      │
│  🔄 Node.js Fundamentals         In progress · 12%      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TAB: MY FORKS                                           │
│                                                          │
│  Tutorials where you edited the code:                    │
│                                                          │
│  [Fork Card]  React Hooks Masterclass                    │
│               Forked from @sarah_codes · Mar 10          │
│               "My version with TypeScript types"         │
│               [View Fork] [Publish as Tutorial]          │
│                                                          │
│  [Fork Card]  Fibonacci Challenge                        │
│               Forked from @dan_abramov · Mar 5           │
│               "Iterative solution instead of recursive"  │
│               [View Fork] [Publish as Tutorial]          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TAB: CERTIFICATES                                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🏆 JavaScript Fundamentals Track                 │   │
│  │     6/6 tutorials completed · March 2024         │   │
│  │     [View Certificate] [Share to LinkedIn]       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🔒 React Mastery Track (locked)                  │   │
│  │     4/8 tutorials complete                        │   │
│  │     [Continue Track →]                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Streak & Gamification

```
Profile header includes:
  🔥 42-day streak  (animated flame)
  
Milestone badges displayed in profile:
  [🌟 First Tutorial] [💯 10 Tutorials] [🏆 First Fork Published]
  [⚡ Speed Learner]  [👨‍🏫 First Creation] [🌍 100 Learners]

Activity heatmap (like GitHub contributions):
  Mon ░░▒▓█░▒░░░▒▓░▒
  Tue ░▒▓█████▒░░░░▒░
  ... (last 90 days)
  ● = completed a tutorial
  Darker = more time spent
```

---

## 🔄 Key UX Flows & Interactions

### Flow 1: First Time User Watching Tutorial

```
1. Landing on tutorial page → 3s animated preview auto-plays (no audio)
2. Press [▶ Start Tutorial] or Space
3. Playback begins — code types itself, cursor blinks naturally
4. User gets curious, clicks on code
5. → Editor becomes editable, cursor appears
6. User types something
7. → Amber "YOUR EDITS" badge appears instantly (no delay)
8. → Modified lines get amber gutter highlight
9. User watches tutorial continue (their changes persist)
10. Instructor writes different code → user's diverged view is highlighted
11. User clicks [Follow Instructor ↩]
12. → Confirmation: "Reset editor to instructor's code?"
13. [Reset] → smooth fade, editor snaps back to instructor's state
14. → Playback continues seamlessly
```

### Flow 2: Creating First Tutorial

```
1. Click [Create +] in navbar → routed to Creator Studio
2. Onboarding overlay (first time only):
   "Set up your code first, then hit record when ready"
   [Got it, let's go!]
3. User writes their code (no recording yet)
4. When ready: [🔴 Start Recording]
5. 3-second countdown: 3... 2... 1... GO!
6. Red border appears on editor, recording timer starts
7. User modifies code, explains as they go
8. Presses [◆ Checkpoint] at key moments
9. When done: [⏹ Stop]
10. Review screen opens: watch back, trim, annotate
11. Fill in metadata: title, tags, difficulty
12. [Publish Now] → success toast, redirected to tutorial page
```

### Flow 3: Mobile View

```
1. User opens tutorial link on mobile
2. Instead of Monaco: syntax-highlighted code (Prism.js)
3. Touch to scroll, pinch to zoom
4. Bottom bar: playback controls (touch-friendly, 48px height)
5. Sticky banner: "Edit this code on desktop for the full experience"
6. [Copy Link] copies shareable URL
7. Everything else (sidebar, notes, progress) works normally
```

---

## 🎯 Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Live vs Playback indicator | Badge top-left of editor, color-coded | Always visible without covering code |
| Fork/edit state | Amber badge + gutter highlights | Mirrors git diff UX devs already know |
| Mobile strategy | View-only (syntax highlighted, no Monaco) | Monaco touch UX is poor; don't break the experience |
| Control bar | Auto-hiding floating bar | Maximizes editor real estate |
| Checkpoints | Amber diamonds on timeline + sidebar list | Two ways to discover = better discoverability |
| Creator studio layout | 3-column (files, editor, controls) | Mirrors IDE layout creators already know |
| Forked tutorial publishing | One-click from profile | Lowers barrier to becoming a creator |
| Color for brand | Violet (#7C3AED) | Between "code" (blue) and "creative" (purple) |
| Font for UI | Inter | Industry standard, legible at all sizes |
| Font for code | JetBrains Mono | Best ligature support, designed for code |

---

## 📋 Component Library Checklist

### Atoms
- [ ] Button (primary, secondary, ghost, danger, icon-only)
- [ ] Badge (language, status, difficulty)
- [ ] Input (text, search, textarea)
- [ ] Toggle / Switch
- [ ] Tooltip
- [ ] Avatar (with online indicator)
- [ ] Progress bar (linear, circular)
- [ ] Spinner / Loading states

### Molecules
- [ ] Tutorial Card
- [ ] Creator Card
- [ ] Checkpoint marker (timeline + sidebar variants)
- [ ] State badge (LIVE / PLAYBACK / PAUSED / YOUR EDITS)
- [ ] Playback control bar
- [ ] Search with results dropdown
- [ ] Lesson list item

### Organisms
- [ ] Navbar
- [ ] Editor chrome (tabs + status bar)
- [ ] Lesson sidebar
- [ ] Tutorial player (editor + controls + sidebar)
- [ ] Recording toolbar
- [ ] Analytics dashboard
- [ ] Profile header

---

## 🚀 Tech Stack Alignment

```
Editor:        Monaco Editor (same as VSCode)
Syntax preview: Shiki (for thumbnails and mobile view)
Animations:    Framer Motion (editor transitions, card hovers)
Icons:         Lucide React
UI framework:  React + Next.js
Styling:       Tailwind CSS + CSS variables for theming
Fonts:         Inter (UI) + JetBrains Mono (code) via Google Fonts / Fontsource
State:         Zustand for playback state, React Query for data
```

---

*Document version 1.0 — CodeTube UI/UX Design*
*Created: March 2026*
