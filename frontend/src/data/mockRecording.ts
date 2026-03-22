import type { Recording, PlaybackEvent } from '@/types/codetube';

// ─── Build events: type "Hello, World!" from scratch ────────────────────────

function buildHelloWorldEvents(): PlaybackEvent[] {
  const events: PlaybackEvent[] = [];

  // The final code we want to "type"
  const finalCode = `// Welcome to CodeTube!
// Watch as the instructor types this code live.

function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

// Call the function
const message = greet("World");
console.log(message); // Hello, World!

// Let's add a more complex example
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Print first 10 fibonacci numbers
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`;

  // Simulate character-by-character typing with realistic delays
  let currentCode = '';
  let line = 1;
  let col = 1;
  let time = 500; // start at 500ms

  for (let i = 0; i < finalCode.length; i++) {
    const char = finalCode[i];

    // Vary typing speed realistically
    let delay: number;
    if (char === '\n') {
      delay = 80 + Math.random() * 40;
    } else if (char === ' ') {
      delay = 60 + Math.random() * 30;
    } else if (char === '(' || char === ')' || char === '{' || char === '}') {
      delay = 100 + Math.random() * 60;  // slightly slower for brackets
    } else {
      delay = 40 + Math.random() * 50;
    }

    // Add a cursor event just before inserting
    events.push({
      timestamp: time,
      type: 'cursor',
      data: { line, column: col, animate: false },
    });

    // Insert the character
    events.push({
      timestamp: time + 5,
      type: 'insert',
      data: {
        text: char,
        position: { line, column: col },
      },
    });

    // Update position tracking
    currentCode += char;
    if (char === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }

    time += delay;

    // Add a small pause after completing a line (at newline)
    if (char === '\n' && Math.random() < 0.3) {
      time += 200 + Math.random() * 500; // occasional thinking pause
    }

    // Add checkpoints at key moments
  }

  return events;
}

// ─── Checkpoints ─────────────────────────────────────────────────────────────

// ─── Export ──────────────────────────────────────────────────────────────────

export const mockRecording: Recording = {
  id: 'rec-hello-world-001',
  title: 'TypeScript Hello World & Fibonacci',
  description:
    'Watch as we build a simple greeting function and then add a Fibonacci number generator. Perfect for TypeScript beginners!',
  language: 'typescript',
  initialCode: '',
  finalCode: `// Welcome to CodeTube!
// Watch as the instructor types this code live.

function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`,
  duration: 35000,  // ~35 seconds
  events: buildHelloWorldEvents(),
  checkpoints: [
    {
      id: 'cp-start',
      timestamp: 0,
      label: 'Start',
      description: 'Beginning of the tutorial',
      codeSnapshot: '',
      cursorPosition: { line: 1, column: 1 },
    },
    {
      id: 'cp-greet-fn',
      timestamp: 8000,
      label: 'greet() function',
      description: 'After adding the greet function',
      codeSnapshot: `// Welcome to CodeTube!\n// Watch as the instructor types this code live.\n\nfunction greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}`,
      cursorPosition: { line: 6, column: 1 },
    },
    {
      id: 'cp-fibonacci',
      timestamp: 22000,
      label: 'fibonacci() function',
      description: 'After adding the Fibonacci function',
      codeSnapshot: '',
      cursorPosition: { line: 14, column: 1 },
    },
    {
      id: 'cp-complete',
      timestamp: 34000,
      label: 'Complete',
      description: 'All code written!',
      codeSnapshot: '',
      cursorPosition: { line: 19, column: 1 },
    },
  ],
  createdAt: '2026-03-22T10:00:00Z',
  updatedAt: '2026-03-22T10:00:00Z',
  instructor: {
    id: 'inst-1',
    name: 'Sarah Chen',
    avatar: undefined,
  },
};
