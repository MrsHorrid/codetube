# CodeTube AI Generation System

CodeTube has been pivoted from a creator-driven platform to a fully **AI-generated curriculum platform**. No human creators needed — users get on-demand coding courses generated from scratch using LLMs, with voice narration via Fish Audio.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    POST /api/generate-course                 │
│         { topic, level, voice, maxLessons?, userId? }        │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Job Queue     │  (in-memory → Redis/BullMQ)
                    │   Async proc.   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐
   │  Curriculum  │   │   Lesson     │   │   Voice     │
   │   Engine     │   │  Generator   │   │  Synthesis  │
   │  (LLM call)  │   │  (LLM call)  │   │ (Fish Audio)│
   └──────┬───────┘   └──────┬───────┘   └──────┬──────┘
          │                  │                  │
          └──────────────────▼──────────────────┘
                    ┌────────▼────────┐
                    │   Recording     │
                    │   Events []     │  ← CodeTube format
                    │  TYPE/AUDIO/    │
                    │  CHECKPOINT...  │
                    └─────────────────┘
```

---

## Components

### 1. AI Curriculum Engine (`src/services/ai/curriculumEngine.ts`)

Generates a structured course outline from a topic + skill level + voice persona.

**Input:**
```typescript
generateCurriculum(topic: string, level: SkillLevel, voice: VoicePersona, maxLessons?: number)
```

**Output:** `Curriculum` object with:
- Course title, description, prerequisites, outcomes
- Lesson-by-lesson outline with objectives, concepts, difficulty
- Progressive difficulty algorithm (duration and level increase across lessons)

**LLM Providers (configurable via `.env`):**
| Provider | `AI_PROVIDER` value | Notes |
|----------|--------------------|----|
| Mock (no API key) | `mock` | Great for development/testing |
| OpenAI | `openai` | Set `AI_API_KEY`, uses `gpt-4o` by default |
| Anthropic | `anthropic` | Set `AI_API_KEY`, uses Claude Sonnet |

**Progressive Difficulty Algorithm:**
- Lessons start at the base level (e.g., `intermediate`)
- Duration increases by up to 50% from first to last lesson
- Each lesson's prerequisites chain to the previous lesson
- Final lesson(s) may advance to the next skill tier

---

### 2. Lesson Generator (`src/services/ai/lessonGenerator.ts`)

Takes a `CurriculumLesson` outline and generates complete lesson content.

**Generates:**
- **Code examples** — runnable code with line-by-line explanations
- **Narration segments** — text segments with timestamps for voice synthesis
- **Exercise prompts** — with starter code, hints, and solutions
- **Checkpoints** — positioned at key moments for progress tracking

**CodeTube Recording Format:**
Each lesson is converted to an array of `RecordingEvent[]`:
```typescript
// Code being typed
{ type: 'TYPE', timestamp: 1200, data: { char: 'c', cursor: {line: 0, col: 0} } }

// Audio narration (new!)
{ type: 'AUDIO', timestamp: 0, data: {
    url: '/api/audio/lesson-0/segment-0.mp3',
    text: 'Welcome to this lesson...',
    persona: 'chill',
    durationMs: 8000
} }

// Checkpoint for exercise
{ type: 'CHECKPOINT', timestamp: 45000, data: {
    label: 'First Code Check',
    description: 'Verify your greet function works',
    exercisePrompt: { title: '...', description: '...', hints: [...] }
} }
```

---

### 3. Voice Synthesis Pipeline (`src/services/ai/voiceSynthesis.ts`)

Integrates with **Fish Audio API** for text-to-speech narration.

**Voice Personas:**
| Persona ID | Style |
|------------|-------|
| `chill` | Relaxed, casual. "hey", "cool", "nice" |
| `energetic` | High-energy. "BOOM!", "let's GO!" |
| `british` | Formal British academic. "quite", "rather" |
| `sarcastic-australian` | Dry wit. "mate", "no worries", "crikey" |
| `calm-mentor` | Patient, reassuring, step-by-step |
| `enthusiastic-teacher` | Passionate, lots of encouragement |
| `no-nonsense` | Direct, concise, no filler |

**Setup Fish Audio:**
1. Get API key at [fish.audio](https://fish.audio)
2. Browse voices, get the `reference_id` for each persona
3. Set in `.env`:
```env
FISH_AUDIO_API_KEY="your-key"
FISH_VOICE_CHILL="reference-id-here"
FISH_VOICE_ENERGETIC="reference-id-here"
# ... etc
```

**Without API key:** Mock mode returns placeholder URLs (`/api/audio/mock/{persona}/{hash}.mp3`) with realistic duration estimates.

---

### 4. Job Queue (`src/services/ai/jobQueue.ts`)

Manages async course generation. Returns immediately with a job ID; processing happens in the background.

**Job Lifecycle:**
```
queued → generating-curriculum → generating-lessons → synthesizing-audio → assembling → completed
                                                                                       ↘ failed
```

**Current implementation:** In-memory store.  
**Production upgrade:** Replace with Redis + BullMQ for persistence, retries, and horizontal scaling.

---

### 5. Personalization Engine (`src/services/ai/personalizationEngine.ts`)

Tracks learner progress and adapts the curriculum.

**Features:**
- Track known concepts and struggle points per user
- Skip lessons where all concepts are already mastered
- Inject remedial mini-lessons (5 min, focused) for weak areas
- Generate recommendations (skip / review / remedial / advance)
- Analytics: mastery ratio, recommended next level

**Learner Profile:**
```typescript
{
  userId: "user-123",
  knownConcepts: ["variables", "functions", "closures"],
  struggleConcepts: ["async/await", "generics"],
  completedLessons: ["course-abc/lesson-0", "..."],
  averageTimePerLesson: 742, // seconds
  preferredLevel: "intermediate",
  preferredVoice: "chill"
}
```

---

## API Reference

### Generate a Course

```http
POST /api/generate-course
Content-Type: application/json

{
  "topic": "Rust for game dev",
  "level": "intermediate",
  "voice": "sarcastic-australian",
  "maxLessons": 8,
  "userId": "optional-user-id"
}
```

**Response `202 Accepted`:**
```json
{
  "success": true,
  "data": {
    "courseId": "course-a1b2c3d4",
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "estimatedTime": "< 5 seconds",
    "status": "queued",
    "lessons": []
  }
}
```

---

### Poll Job Status

```http
GET /api/generate-course/jobs/:jobId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "...",
    "courseId": "course-a1b2c3d4",
    "status": "completed",
    "progress": 100,
    "topic": "Rust for game dev",
    "level": "intermediate",
    "voice": "sarcastic-australian",
    "curriculum": { ... },
    "lessons": [
      {
        "lessonIndex": 0,
        "title": "Introduction to Rust",
        "durationSec": 480,
        "codeExamplesCount": 2,
        "checkpointsCount": 2,
        "exercisesCount": 1,
        "recordingEventsCount": 847
      }
    ]
  }
}
```

---

### Get Full Course

```http
GET /api/generate-course/courses/:courseId
```

Returns the complete course with all lessons, code examples, recording events, and audio URLs.

---

### Get Single Lesson (for Playback)

```http
GET /api/generate-course/courses/:courseId/lessons/:lessonIndex
```

Returns the full `GeneratedLesson` including `recordingEvents[]` ready for the CodeTube player.

---

### Generate Remedial Lesson

```http
POST /api/generate-course/remedial
Content-Type: application/json

{
  "userId": "user-123",
  "struggleConcept": "async/await",
  "parentTopic": "JavaScript",
  "voice": "calm-mentor"
}
```

---

### List Available Voices

```http
GET /api/generate-course/voices
```

### List Skill Levels

```http
GET /api/generate-course/levels
```

---

### Personalization API

```http
# Get learner profile
GET /api/generate-course/learner/:userId

# Get analytics and recommendations
GET /api/generate-course/learner/:userId/analytics

# Record lesson completion
POST /api/generate-course/learner/:userId/progress
{
  "lessonId": "course-abc/lesson-0",
  "lessonIndex": 0,
  "lessonConcepts": ["variables", "types"],
  "timeTakenSec": 420,
  "struggledConcepts": ["generics"]
}

# Record a concept struggle
POST /api/generate-course/learner/:userId/struggle
{ "concept": "async/await" }

# Mark concept mastered
POST /api/generate-course/learner/:userId/mastered
{ "concept": "async/await" }

# Get adapted curriculum (skips known, adds remedial)
POST /api/generate-course/adapt
{
  "courseId": "course-a1b2c3d4",
  "userId": "user-123"
}
```

---

## Configuration

Add to `.env`:

```env
# AI Provider
AI_PROVIDER="mock"          # mock | openai | anthropic
AI_API_KEY=""               # API key for chosen provider
AI_MODEL=""                 # Override default model
AI_BASE_URL=""              # Override API base URL (e.g. Azure, Ollama)

# Fish Audio
FISH_AUDIO_API_KEY=""
FISH_AUDIO_BASE_URL="https://api.fish.audio/v1"

# Voice persona reference IDs from Fish Audio
FISH_VOICE_CHILL=""
FISH_VOICE_ENERGETIC=""
FISH_VOICE_BRITISH=""
FISH_VOICE_SARCASTIC_AUSTRALIAN=""
FISH_VOICE_CALM_MENTOR=""
FISH_VOICE_ENTHUSIASTIC_TEACHER=""
FISH_VOICE_NO_NONSENSE=""

# Audio file storage
AUDIO_STORAGE_DIR="/tmp/codetube-audio"
```

---

## File Structure

```
backend/src/
├── types/
│   └── ai.ts                    # All AI-related TypeScript types
├── services/
│   └── ai/
│       ├── curriculumEngine.ts  # LLM-powered curriculum generation
│       ├── lessonGenerator.ts   # Lesson content + recording events
│       ├── voiceSynthesis.ts    # Fish Audio integration
│       ├── jobQueue.ts          # Async job management
│       └── personalizationEngine.ts # Learner tracking & adaptation
├── routes/
│   └── generate.ts              # All /api/generate-course/* endpoints
└── __tests__/
    └── ai-generation.test.ts    # 33 tests covering all components
```

---

## Running Tests

```bash
cd backend
AI_PROVIDER=mock npx jest "ai-generation" --forceExit
```

All 33 tests pass with the mock provider (no API key needed).

---

## Generating a Demo Recording

```bash
cd backend
AI_PROVIDER=mock npx ts-node --project tsconfig.json scripts/generate-demo.ts
```

This runs the full pipeline (curriculum → lessons → voice → events) in mock mode and writes the result to `backend/demo/demo-course.json`. No API keys needed. The demo works at:
- **Vite frontend:** `http://localhost:5173/demo`
- **Next.js frontend:** `http://localhost:3000/tutorial/demo`

---

## Production Upgrade Path

1. **LLM:** Set `AI_PROVIDER=openai` + `AI_API_KEY`
2. **Voice:** Configure Fish Audio keys for each persona
3. **Job Queue:** Replace in-memory store with Redis + BullMQ
4. **Audio Storage:** Replace `/tmp` with S3/R2 + CDN
5. **DB:** Add `GeneratedCourse` Prisma model for persistence
6. **Rate Limiting:** Add per-user generation limits

---

## Troubleshooting

### Mock mode: "no API key required"

The default is `AI_PROVIDER=mock` — this works out of the box with no API key. Make sure your `.env` contains:

```env
AI_PROVIDER="mock"
```

If it's not set, mock is the fallback. Run the test suite to confirm:

```bash
AI_PROVIDER=mock npx jest "ai-generation" --forceExit
```

---

### Error: "AI_PROVIDER is set to 'openai' but AI_API_KEY is missing"

You've set `AI_PROVIDER=openai` (or `anthropic`) in `.env` but forgot the key. Either:

1. Add `AI_API_KEY="sk-..."` to `.env`
2. Or switch back to mock: `AI_PROVIDER="mock"`

---

### Error: "OpenAI API error: 401"

Your API key is invalid or has no credits. Check at [platform.openai.com](https://platform.openai.com).

---

### Error: "Fish Audio API error 401"

`FISH_AUDIO_API_KEY` is invalid. Get a key at [fish.audio](https://fish.audio). Without a key, voice synthesis automatically falls back to mock mode — no audio files will be generated but the rest of the pipeline works fine.

---

### Jobs stuck in "generating-curriculum" / "generating-lessons"

**Causes:**
- Real LLM provider is timing out (network issue or API down)
- `AI_PROVIDER` is set to a real provider but key is missing (check startup logs)

**Fix:**
- Check backend logs for `[JobQueue]` messages
- The job will be auto-marked `failed` after the timeout (default: 10 min for real LLMs, 30s for mock)
- To adjust: set `JOB_TIMEOUT_MS=600000` (in ms) in `.env`

---

### Jobs lost on restart

The job queue is **in-memory** — all queued/running jobs are lost when the server restarts. This is by design for development. Completed jobs (with their lesson content) are also lost.

**Mitigation for production:**
1. Add a `GeneratedCourse` Prisma model and persist job results to the DB on completion
2. Replace the in-memory queue with Redis + BullMQ

A startup warning is logged: `[JobQueue] ⚠️ Using IN-MEMORY job store`.

---

### Audio URLs return 404

**Cause 1 – Mock mode:** Mock audio URLs (`/api/audio/mock/{persona}/{hash}.mp3`) are served by a backend endpoint that returns a tiny silent MP3. If this returns 404, the backend may not be running.

**Cause 2 – Real mode:** The audio file was not saved. Check that `AUDIO_STORAGE_DIR` is writable:
```bash
ls -la $AUDIO_STORAGE_DIR   # default: /tmp/codetube-audio
```

**Cause 3 – Production:** In production, offload audio to S3/R2/CDN. Update `voiceSynthesis.ts` to return CDN URLs instead of `/api/audio/...` local paths.

---

### AUDIO events not syncing with code events

AUDIO events are placed at the start of each narration segment. Code TYPE events follow after the audio duration elapses. The full sync is:

```
t=0         AUDIO (intro narration, ~12s)
t=12000     TYPE events (first code example)
t=~30000    AUDIO (second narration segment)
t=~42000    TYPE events (second code example)
...
```

If events feel out of sync:
1. Check `narrationSegments[i].endTimestampMs - startTimestampMs` — this is the audio duration budget
2. `synthesizeNarration` estimates duration from word count (~150 wpm) when Fish Audio isn't configured
3. With real Fish Audio, actual audio duration may differ from the estimate — use `durationMs` returned by the API

---

### TypeScript compilation errors after changes

```bash
cd backend
npx tsc --noEmit
```

All source files under `src/services/ai/` share types from `src/types/ai.ts`. If you add new event types, update both the `RecordingEventType` union and the corresponding interface.
