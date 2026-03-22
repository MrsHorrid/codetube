/**
 * Generates a synthetic 30-second test recording
 * that demonstrates all event types and can be used to
 * verify the recording → playback pipeline.
 */

import {
  RecordingFile,
  RecordingEvent,
  KeyboardEvent as KbdEvent,
  CursorEvent as CurEvent,
  ContentEvent as CntEvent,
  FileEvent as FilEvent,
  SystemEvent as SysEvent,
  RecordingCheckpoint,
} from '@/types/recording';

let _id = 0;
function id(): string {
  return `test_${Date.now()}_${(++_id).toString(36)}`;
}

const INITIAL_CODE = `// CodeTube Demo Recording
// Watch as this code gets written live!

`;

// The code that will be "typed" during the recording
const TYPING_STEPS: Array<{
  time: number;       // ms timestamp
  insert?: string;    // text to insert
  line: number;       // position
  col: number;
  deleteLen?: number; // for delete ops
}> = [
  // Step 1: Start typing function declaration
  { time: 1000, line: 4, col: 1, insert: 'function greet(name: string): string {' },
  { time: 1800, line: 4, col: 39, insert: '\n' },
  { time: 2100, line: 5, col: 1, insert: '  return `Hello, ${name}!`;' },
  { time: 3200, line: 5, col: 29, insert: '\n' },
  { time: 3500, line: 6, col: 1, insert: '}' },
  { time: 4000, line: 6, col: 2, insert: '\n\n' },

  // Step 2: Add usage example
  { time: 5000, line: 8, col: 1, insert: '// Usage examples' },
  { time: 5800, line: 8, col: 18, insert: '\n' },
  { time: 6200, line: 9, col: 1, insert: 'console.log(greet("Alice")); // Hello, Alice!' },
  { time: 7100, line: 9, col: 46, insert: '\n' },
  { time: 7500, line: 10, col: 1, insert: 'console.log(greet("Bob"));   // Hello, Bob!' },
  { time: 8400, line: 10, col: 44, insert: '\n\n' },

  // Step 3: Add a class
  { time: 9500, line: 12, col: 1, insert: 'class Counter {' },
  { time: 10200, line: 12, col: 16, insert: '\n' },
  { time: 10500, line: 13, col: 1, insert: '  private count = 0;' },
  { time: 11300, line: 13, col: 22, insert: '\n\n' },
  { time: 11800, line: 15, col: 1, insert: '  increment() {' },
  { time: 12500, line: 15, col: 17, insert: '\n' },
  { time: 12800, line: 16, col: 1, insert: '    this.count++;' },
  { time: 13600, line: 16, col: 18, insert: '\n' },
  { time: 14000, line: 17, col: 1, insert: '  }' },
  { time: 14500, line: 17, col: 4, insert: '\n\n' },

  // Step 4: Add getter  
  { time: 15500, line: 19, col: 1, insert: '  get value() {' },
  { time: 16200, line: 19, col: 17, insert: '\n' },
  { time: 16500, line: 20, col: 1, insert: '    return this.count;' },
  { time: 17300, line: 20, col: 23, insert: '\n' },
  { time: 17700, line: 21, col: 1, insert: '  }' },
  { time: 18200, line: 21, col: 4, insert: '\n' },
  { time: 18600, line: 22, col: 1, insert: '}' },
  { time: 19200, line: 22, col: 2, insert: '\n\n' },

  // Step 5: Usage of class
  { time: 20000, line: 24, col: 1, insert: 'const counter = new Counter();' },
  { time: 21000, line: 24, col: 31, insert: '\n' },
  { time: 21400, line: 25, col: 1, insert: 'counter.increment();' },
  { time: 22200, line: 25, col: 21, insert: '\n' },
  { time: 22600, line: 26, col: 1, insert: 'counter.increment();' },
  { time: 23400, line: 26, col: 21, insert: '\n' },
  { time: 23800, line: 27, col: 1, insert: 'console.log(counter.value); // 2' },
  { time: 24800, line: 27, col: 34, insert: '\n' },

  // Final touches
  { time: 26000, line: 28, col: 1, insert: '\nexport { greet, Counter };' },
];

function buildCodeAtTime(targetMs: number): string {
  let code = INITIAL_CODE;
  for (const step of TYPING_STEPS) {
    if (step.time > targetMs) break;
    if (step.insert) {
      code += step.insert;
    }
  }
  return code;
}

export function generateTestRecording(): RecordingFile {
  const DURATION = 30_000; // 30 seconds
  const events: RecordingEvent[] = [];

  // ── System start ──────────────────────────────────────────
  events.push({
    id: id(), type: 'sys', timestamp: 0, action: 'start',
  } as SysEvent);

  // ── File open ─────────────────────────────────────────────
  events.push({
    id: id(),
    type: 'fil',
    timestamp: 100,
    action: 'open',
    fileId: 'file_main',
    metadata: {
      name: 'main.ts',
      path: '/src/main.ts',
      language: 'typescript',
      initialContent: INITIAL_CODE,
    },
  } as FilEvent);

  // ── Initial cursor ────────────────────────────────────────
  events.push({
    id: id(), type: 'cur', timestamp: 200,
    fileId: 'file_main',
    position: { line: 1, column: 1 },
  } as CurEvent);

  // ── Typing steps → ContentEvents + KeyboardEvents ─────────
  let currentLine = 1;
  let currentCol = 1;

  for (const step of TYPING_STEPS) {
    if (step.time > DURATION) break;

    // Keyboard event (simulated keypresses)
    const text = step.insert ?? '';
    for (let i = 0; i < Math.min(text.length, 5); i++) {
      const charTime = step.time + i * 80;
      if (charTime > DURATION) break;
      const char = text[i] || '';
      events.push({
        id: id(),
        type: 'kbd',
        timestamp: charTime,
        key: char === '\n' ? 'Enter' : char,
        code: char === '\n' ? 'Enter' : `Key${char.toUpperCase()}`,
        modifiers: { ctrl: false, alt: false, shift: false, meta: false },
      } as KbdEvent);
    }

    // Content event (actual insertion)
    if (step.insert !== undefined) {
      events.push({
        id: id(),
        type: 'cnt',
        timestamp: step.time + 5,
        fileId: 'file_main',
        operation: 'insert',
        position: { line: step.line, column: step.col },
        content: step.insert,
        fullSnapshot: buildCodeAtTime(step.time),
      } as CntEvent);
    }

    // Cursor move after typing
    currentLine = step.line;
    currentCol = step.col + (step.insert?.length ?? 0);
    // Account for newlines
    const newlines = (step.insert ?? '').split('\n').length - 1;
    if (newlines > 0) {
      currentLine += newlines;
      currentCol = (step.insert ?? '').split('\n').pop()!.length + 1;
    }

    events.push({
      id: id(),
      type: 'cur',
      timestamp: step.time + 50,
      fileId: 'file_main',
      position: { line: currentLine, column: currentCol },
    } as CurEvent);
  }

  // ── System stop ───────────────────────────────────────────
  events.push({
    id: id(), type: 'sys', timestamp: DURATION - 100, action: 'stop',
  } as SysEvent);

  // Sort by time
  events.sort((a, b) => a.timestamp - b.timestamp);

  // ── Checkpoints ───────────────────────────────────────────
  const checkpoints: RecordingCheckpoint[] = [
    {
      id: 'chk_test_1',
      timestamp: 4500,
      label: 'greet() function done',
      code_snapshot: buildCodeAtTime(4500),
      description: 'Basic greeting function complete',
    },
    {
      id: 'chk_test_2',
      timestamp: 9000,
      label: 'Usage examples added',
      code_snapshot: buildCodeAtTime(9000),
      description: 'Added console.log examples',
    },
    {
      id: 'chk_test_3',
      timestamp: 19500,
      label: 'Counter class complete',
      code_snapshot: buildCodeAtTime(19500),
      description: 'Counter class with increment and getter',
    },
    {
      id: 'chk_test_4',
      timestamp: 25500,
      label: 'Final - all done',
      code_snapshot: buildCodeAtTime(25500),
      description: 'All code written, ready to export',
    },
  ];

  // ── Chunk events ──────────────────────────────────────────
  const CHUNK_SIZE_MS = 5000;
  const chunks: RecordingFile['chunks'] = [];
  
  for (let t = 0; t < DURATION; t += CHUNK_SIZE_MS) {
    const chunkEvents = events.filter(
      (e) => e.timestamp >= t && e.timestamp < t + CHUNK_SIZE_MS
    );
    chunks.push({
      id: `chunk_${t}`,
      timestamp: t,
      endTime: Math.min(t + CHUNK_SIZE_MS, DURATION),
      events: chunkEvents,
    });
  }

  return {
    metadata: {
      version: '1.0.0',
      recordingId: 'test_recording_001',
      createdAt: new Date().toISOString(),
      title: 'TypeScript Demo: greet & Counter',
      language: 'typescript',
      duration: DURATION,
      eventCount: events.length,
      fileCount: 1,
      initialContent: INITIAL_CODE,
      settings: {
        editorTheme: 'vs-dark',
        fontSize: 14,
        tabSize: 2,
      },
    },
    chunks,
    checkpoints,
  };
}

/**
 * Verify a recording has all required fields and events
 */
export function verifyRecording(rec: RecordingFile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rec.metadata) errors.push('Missing metadata');
  if (!rec.metadata?.title) errors.push('Missing title');
  if (!rec.metadata?.duration || rec.metadata.duration <= 0) errors.push('Invalid duration');
  if (!rec.metadata?.language) errors.push('Missing language');
  if (!Array.isArray(rec.chunks)) errors.push('Missing chunks array');
  if (!Array.isArray(rec.checkpoints)) errors.push('Missing checkpoints array');

  // Check event types present
  const allEvents = rec.chunks.flatMap((c) => c.events);
  const types = new Set(allEvents.map((e) => e.type));
  
  if (!types.has('kbd')) errors.push('No keyboard events');
  if (!types.has('cur')) errors.push('No cursor events');
  if (!types.has('cnt')) errors.push('No content events');
  if (!types.has('sys')) errors.push('No system events');

  // Check timestamps are ordered
  for (const chunk of rec.chunks) {
    let lastTs = -1;
    for (const evt of chunk.events) {
      if (evt.timestamp < lastTs) {
        errors.push(`Events out of order in chunk ${chunk.id}`);
        break;
      }
      lastTs = evt.timestamp;
    }
  }

  if (rec.checkpoints.length === 0) {
    errors.push('No checkpoints (warning - not fatal)');
  }

  return { valid: errors.filter(e => !e.includes('warning')).length === 0, errors };
}
