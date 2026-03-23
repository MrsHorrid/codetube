/**
 * Lesson Generator
 *
 * Takes a CurriculumLesson outline and generates full lesson content:
 * - Code examples with line-by-line explanations
 * - Narration text segments for each section
 * - Checkpoint positions and exercise prompts
 * - Converts everything into CodeTube recording format (RecordingEvent[])
 */

import {
  CurriculumLesson,
  GeneratedLesson,
  CodeExample,
  ExercisePrompt,
  NarrationSegment,
  RecordingEvent,
  AudioEvent,
  CheckpointEvent,
  VoicePersona,
  SkillLevel,
} from '../../types/ai';

// ─── LLM helpers (reuse provider from curriculumEngine) ───────

const LESSON_SYSTEM_PROMPT = `You are an expert coding instructor who creates detailed, engaging lesson content.
You write clear code examples with thorough explanations and practical exercises.
Always respond with valid JSON exactly as specified.`;

async function callLessonLLM(prompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || 'mock';

  if (provider === 'mock') {
    return mockLessonResponse(prompt);
  }

  if (provider === 'openai') {
    if (!process.env.AI_API_KEY) {
      throw new Error(
        'AI_PROVIDER is set to "openai" but AI_API_KEY is missing. ' +
        'Add your OpenAI API key to .env, or set AI_PROVIDER="mock" to run without a key.'
      );
    }
    const res = await fetch(process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: LESSON_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
  }

  if (provider === 'anthropic') {
    if (!process.env.AI_API_KEY) {
      throw new Error(
        'AI_PROVIDER is set to "anthropic" but AI_API_KEY is missing. ' +
        'Add your Anthropic API key to .env, or set AI_PROVIDER="mock" to run without a key.'
      );
    }
    const res = await fetch(process.env.AI_BASE_URL || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AI_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        system: LESSON_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = (await res.json()) as { content: Array<{ text: string }> };
    return data.content[0].text;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// ─── Prompt Template ──────────────────────────────────────────

function buildLessonPrompt(lesson: CurriculumLesson, topic: string, voice: VoicePersona): string {
  const voiceStyle: Record<VoicePersona, string> = {
    chill: 'casual, friendly, use "hey", "cool", "nice"',
    energetic: 'excited, use "BOOM!", "let\'s GO!", exclamation points',
    british: 'formal, polite, "quite", "rather", "indeed"',
    'sarcastic-australian': 'dry Australian humour, light sarcasm, "mate", "no worries"',
    'calm-mentor': 'patient, reassuring, step-by-step',
    'enthusiastic-teacher': 'passionate, lots of encouragement',
    'no-nonsense': 'direct, no filler words, concise',
  };

  return `Generate complete lesson content for:

COURSE TOPIC: ${topic}
LESSON ${lesson.index + 1}: ${lesson.title}
OBJECTIVE: ${lesson.objective}
CONCEPTS TO COVER: ${lesson.concepts.join(', ')}
DIFFICULTY: ${lesson.difficulty}
LESSON TYPE: ${lesson.type}
NARRATION VOICE STYLE: ${voiceStyle[voice]}

Create engaging, ${lesson.difficulty}-level content. Each code example must be runnable.

Respond with this exact JSON:
{
  "codeExamples": [
    {
      "filename": "example.ts",
      "language": "typescript",
      "code": "// full runnable code here",
      "explanation": "Step-by-step explanation of what this code does"
    }
  ],
  "narrationSegments": [
    {
      "text": "What the instructor says at this point",
      "startTimestampMs": 0,
      "endTimestampMs": 30000
    }
  ],
  "exercises": [
    {
      "title": "Exercise title",
      "description": "What the learner should build or modify",
      "starterCode": "// starter code",
      "hints": ["hint 1", "hint 2"],
      "solution": "// solution code"
    }
  ],
  "checkpoints": [
    {
      "timestampMs": 120000,
      "label": "Checkpoint name",
      "description": "What the learner should verify at this point",
      "hasExercise": true
    }
  ]
}`;
}

// ─── Recording Event Assembler ────────────────────────────────

function buildTypeEvents(code: string, startMs: number, language: string): RecordingEvent[] {
  const events: RecordingEvent[] = [];
  let cursor = startMs;
  const lines = code.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    // Simulate typing each line character by character
    const lineDelay = 40 + Math.random() * 60; // 40-100ms per char
    for (let col = 0; col < line.length; col++) {
      events.push({
        type: 'TYPE',
        timestamp: cursor,
        data: {
          char: line[col],
          cursor: { line: lineIndex, col },
          language,
        },
      });
      cursor += lineDelay;
    }
    // Enter key at end of line
    events.push({
      type: 'TYPE',
      timestamp: cursor,
      data: { char: '\n', cursor: { line: lineIndex, col: line.length }, language },
    });
    cursor += 200; // pause between lines
  }

  return events;
}

function assembleRecordingEvents(
  codeExamples: CodeExample[],
  narrationSegments: NarrationSegment[],
  checkpoints: GeneratedLesson['checkpoints'],
  audioUrls: Map<number, string>
): RecordingEvent[] {
  const events: RecordingEvent[] = [];

  // Interleave: narration → code typing → checkpoints
  let currentMs = 0;

  for (let i = 0; i < Math.max(codeExamples.length, narrationSegments.length); i++) {
    // Add narration audio event if available
    if (narrationSegments[i]) {
      const seg = narrationSegments[i];
      const adjustedStart = currentMs;
      const duration = seg.endTimestampMs - seg.startTimestampMs;

      const audioEvent: AudioEvent = {
        type: 'AUDIO',
        timestamp: adjustedStart,
        data: {
          url: audioUrls.get(i) || `/api/audio/lesson-${i}.mp3`,
          text: seg.text,
          persona: 'chill', // will be set by voice synthesis
          durationMs: duration,
        },
      };
      events.push(audioEvent);
      currentMs += duration;
    }

    // Add code typing events if available
    if (codeExamples[i]) {
      const typeEvents = buildTypeEvents(codeExamples[i].code, currentMs, codeExamples[i].language);
      events.push(...typeEvents);
      if (typeEvents.length > 0) {
        currentMs = typeEvents[typeEvents.length - 1].timestamp + 1000;
      }
    }

    // Add checkpoint after each major section
    const checkpoint = checkpoints[i];
    if (checkpoint) {
      const cpEvent: CheckpointEvent = {
        type: 'CHECKPOINT',
        timestamp: currentMs,
        data: {
          label: checkpoint.label,
          description: checkpoint.description,
          exercisePrompt: checkpoint.exercisePrompt,
        },
      };
      events.push(cpEvent);
      currentMs += 2000; // brief pause at checkpoint
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

// ─── Mock Lesson Response ─────────────────────────────────────

function mockLessonResponse(prompt: string): string {
  const lessonMatch = prompt.match(/LESSON \d+: (.+)/);
  const lessonTitle = lessonMatch ? lessonMatch[1] : 'Lesson';
  const topicMatch = prompt.match(/COURSE TOPIC: (.+)/);
  const topic = topicMatch ? topicMatch[1] : 'Programming';

  return JSON.stringify({
    codeExamples: [
      {
        filename: 'main.ts',
        language: 'typescript',
        code: `// ${lessonTitle} - ${topic}\n// Example 1: Getting started\n\nfunction greet(name: string): string {\n  return \`Hello, \${name}! Welcome to ${topic}.\`;\n}\n\nconsole.log(greet("World"));\n// Output: Hello, World! Welcome to ${topic}.`,
        explanation: `This example demonstrates the basic structure of a ${topic} program. We define a typed function 'greet' that takes a string parameter and returns a greeting. The backtick template literal allows embedding expressions inside strings using \${}.`,
      },
      {
        filename: 'advanced.ts',
        language: 'typescript',
        code: `// Example 2: Building on the basics\n\ninterface Config {\n  name: string;\n  verbose: boolean;\n}\n\nclass App {\n  constructor(private config: Config) {}\n\n  run(): void {\n    if (this.config.verbose) {\n      console.log(\`Starting \${this.config.name}...\`);\n    }\n    // Your code here\n  }\n}\n\nconst app = new App({ name: "${topic} App", verbose: true });\napp.run();`,
        explanation: `Here we introduce interfaces and classes — core OOP concepts. The Config interface defines the shape of our configuration object. The App class uses a constructor with TypeScript's shorthand property declaration (private config: Config) to automatically create and assign a class property.`,
      },
    ],
    narrationSegments: [
      {
        text: `Alright, welcome to ${lessonTitle}. In this lesson we're going to get hands-on with ${topic}. By the end you'll have a solid understanding of the core concepts, and you'll have written some real code.`,
        startTimestampMs: 0,
        endTimestampMs: 12000,
      },
      {
        text: `Let's start simple. Here's your first ${topic} program. Don't worry if it looks unfamiliar — we'll break down every single line.`,
        startTimestampMs: 12000,
        endTimestampMs: 22000,
      },
      {
        text: `Now let's level it up a notch. We'll add some structure using interfaces and classes. This is how real ${topic} code looks in production.`,
        startTimestampMs: 45000,
        endTimestampMs: 57000,
      },
      {
        text: `Excellent work! You've just built a working ${topic} structure. Take a moment to experiment — change the values, break things intentionally, and see what happens. That's how you really learn.`,
        startTimestampMs: 90000,
        endTimestampMs: 104000,
      },
    ],
    exercises: [
      {
        title: `Extend the ${lessonTitle} Example`,
        description: `Modify the App class to accept an array of tasks and add a method 'addTask(task: string)' that appends to the list. Then print all tasks when run() is called.`,
        starterCode: `// Extend this:\nclass App {\n  constructor(private config: Config) {}\n  // Add your tasks array and addTask method here\n  run(): void {\n    // Print all tasks\n  }\n}`,
        hints: [
          'Add a private tasks: string[] = [] property to the class',
          'The addTask method should push to this.tasks',
          'Use forEach or a for loop in run() to print each task',
        ],
        solution: `class App {\n  private tasks: string[] = [];\n  constructor(private config: Config) {}\n  addTask(task: string): void { this.tasks.push(task); }\n  run(): void {\n    if (this.config.verbose) console.log(\`Starting \${this.config.name}...\`);\n    this.tasks.forEach((t, i) => console.log(\`\${i + 1}. \${t}\`));\n  }\n}`,
      },
    ],
    checkpoints: [
      {
        timestampMs: 25000,
        label: 'First Code Check',
        description: 'Make sure your greet function returns the correct string when called with your name',
        hasExercise: false,
      },
      {
        timestampMs: 95000,
        label: 'Class Exercise',
        description: 'Complete the exercise: extend App with task management',
        hasExercise: true,
      },
    ],
  });
}

// ─── Main Export ──────────────────────────────────────────────

export async function generateLesson(
  lesson: CurriculumLesson,
  topic: string,
  voice: VoicePersona,
  audioUrls: Map<number, string> = new Map()
): Promise<GeneratedLesson> {
  const prompt = buildLessonPrompt(lesson, topic, voice);
  const raw = await callLessonLLM(prompt);

  let parsed: {
    codeExamples: CodeExample[];
    narrationSegments: NarrationSegment[];
    exercises: ExercisePrompt[];
    checkpoints: Array<{
      timestampMs: number;
      label: string;
      description: string;
      hasExercise: boolean;
    }>;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse lesson JSON for "${lesson.title}"`);
  }

  // Build checkpoint objects with exercise prompts
  const checkpointsWithExercises = parsed.checkpoints.map((cp, i) => ({
    timestampMs: cp.timestampMs,
    label: cp.label,
    description: cp.description,
    exercisePrompt: cp.hasExercise && parsed.exercises[i] ? parsed.exercises[i] : undefined,
  }));

  // Assemble CodeTube recording events
  const recordingEvents = assembleRecordingEvents(
    parsed.codeExamples,
    parsed.narrationSegments,
    checkpointsWithExercises,
    audioUrls
  );

  const durationMs =
    recordingEvents.length > 0
      ? recordingEvents[recordingEvents.length - 1].timestamp + 5000
      : lesson.estimatedDurationSec * 1000;

  return {
    lessonIndex: lesson.index,
    title: lesson.title,
    objective: lesson.objective,
    codeExamples: parsed.codeExamples,
    narrationSegments: parsed.narrationSegments,
    checkpoints: checkpointsWithExercises,
    exercises: parsed.exercises,
    recordingEvents,
    durationSec: Math.ceil(durationMs / 1000),
  };
}

/**
 * Batch generate all lessons for a curriculum.
 * Processes sequentially to avoid rate limits.
 */
export async function generateAllLessons(
  curriculum: import('../../types/ai').Curriculum,
  voice: VoicePersona,
  onProgress?: (lessonIndex: number, total: number) => void
): Promise<GeneratedLesson[]> {
  const lessons: GeneratedLesson[] = [];

  for (const lessonOutline of curriculum.lessons) {
    const lesson = await generateLesson(lessonOutline, curriculum.topic, voice);
    lessons.push(lesson);
    onProgress?.(lessonOutline.index + 1, curriculum.totalLessons);
  }

  return lessons;
}
