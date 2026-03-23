"use strict";
/**
 * AI Curriculum Engine
 *
 * Generates structured course curricula on-demand using an LLM.
 * Supports topic + skill level + voice persona as inputs.
 * Produces a lesson-by-lesson outline with progressive difficulty.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCurriculum = generateCurriculum;
function getLLMConfig() {
    const provider = process.env.AI_PROVIDER || 'mock';
    return {
        provider,
        apiKey: process.env.AI_API_KEY,
        model: process.env.AI_MODEL || (provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022'),
        baseUrl: process.env.AI_BASE_URL,
    };
}
async function callLLM(prompt, systemPrompt) {
    const config = getLLMConfig();
    if (config.provider === 'mock') {
        return mockLLMResponse(prompt);
    }
    if (config.provider === 'openai') {
        if (!config.apiKey) {
            throw new Error('AI_PROVIDER is set to "openai" but AI_API_KEY is missing. ' +
                'Add your OpenAI API key to .env, or set AI_PROVIDER="mock" to run without a key.');
        }
        const url = config.baseUrl || 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            }),
        });
        if (!res.ok)
            throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
        const data = (await res.json());
        return data.choices[0].message.content;
    }
    if (config.provider === 'anthropic') {
        if (!config.apiKey) {
            throw new Error('AI_PROVIDER is set to "anthropic" but AI_API_KEY is missing. ' +
                'Add your Anthropic API key to .env, or set AI_PROVIDER="mock" to run without a key.');
        }
        const url = config.baseUrl || 'https://api.anthropic.com/v1/messages';
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey || '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: config.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }],
            }),
        });
        if (!res.ok)
            throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
        const data = (await res.json());
        return data.content[0].text;
    }
    throw new Error(`Unknown LLM provider: ${config.provider}`);
}
// ─── Prompt Templates ─────────────────────────────────────────
const CURRICULUM_SYSTEM_PROMPT = `You are an expert coding educator and curriculum designer.
You create well-structured, progressive coding courses that are engaging and practical.
Always respond with valid JSON. Structure your response exactly as specified.`;
function buildCurriculumPrompt(topic, level, voice, maxLessons) {
    const voiceDescriptions = {
        chill: 'relaxed and approachable tone',
        energetic: 'high-energy, enthusiastic tone',
        british: 'formal British academic tone',
        'sarcastic-australian': 'dry wit with Australian sarcasm',
        'calm-mentor': 'patient, mentoring tone',
        'enthusiastic-teacher': 'passionate about teaching',
        'no-nonsense': 'direct and to-the-point',
    };
    const levelDescriptions = {
        beginner: 'assumes no prior knowledge, explains everything from scratch',
        intermediate: 'assumes basic programming knowledge, focuses on practical application',
        advanced: 'assumes solid experience, deep-dives into internals and patterns',
        expert: 'peer-level discussion, cutting-edge techniques and trade-offs',
    };
    return `Design a coding course curriculum with the following specifications:

TOPIC: ${topic}
SKILL LEVEL: ${level} (${levelDescriptions[level]})
INSTRUCTOR VOICE: ${voiceDescriptions[voice]}
MAX LESSONS: ${maxLessons}

Requirements:
- Progressive difficulty: each lesson builds on the previous
- Practical focus: hands-on coding, not just theory
- Clear objectives: each lesson has a specific, measurable goal
- Balanced mix: theory, hands-on, challenges, and review lessons
- For ${level} level: ${levelDescriptions[level]}

Respond with this exact JSON structure:
{
  "title": "Course title",
  "description": "Course description (2-3 sentences)",
  "prerequisites": ["prerequisite 1", "prerequisite 2"],
  "outcomes": ["what learner will be able to do 1", "..."],
  "lessons": [
    {
      "index": 0,
      "title": "Lesson title",
      "objective": "By the end of this lesson, you will...",
      "concepts": ["concept1", "concept2"],
      "prerequisites": ["previous lesson concepts needed"],
      "estimatedDurationSec": 600,
      "difficulty": "${level}",
      "type": "theory|hands-on|challenge|review"
    }
  ]
}`;
}
// ─── Progressive Difficulty Algorithm ─────────────────────────
function applyProgressiveDifficulty(lessons, baseLevel) {
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const baseIndex = levelOrder.indexOf(baseLevel);
    return lessons.map((lesson, i) => {
        const ratio = i / Math.max(lessons.length - 1, 1);
        // Progress up at most 1 level over the course
        const levelBoost = Math.floor(ratio * 1);
        const adjustedLevelIndex = Math.min(baseIndex + levelBoost, levelOrder.length - 1);
        // Duration increases with complexity
        const durationMultiplier = 1 + ratio * 0.5;
        const baseDuration = lesson.estimatedDurationSec || 600;
        return {
            ...lesson,
            difficulty: levelOrder[adjustedLevelIndex],
            estimatedDurationSec: Math.round(baseDuration * durationMultiplier),
            // Ensure prerequisites chain properly
            prerequisites: i === 0 ? lesson.prerequisites : [lessons[i - 1].title, ...lesson.prerequisites],
        };
    });
}
// ─── Mock Response (for testing without API key) ──────────────
function mockLLMResponse(prompt) {
    // Extract topic from prompt
    const topicMatch = prompt.match(/TOPIC: (.+)/);
    const topic = topicMatch ? topicMatch[1] : 'Programming';
    const levelMatch = prompt.match(/SKILL LEVEL: (\w+)/);
    const level = levelMatch ? levelMatch[1] : 'intermediate';
    return JSON.stringify({
        title: `${topic}: A Practical ${level.charAt(0).toUpperCase() + level.slice(1)} Guide`,
        description: `Master ${topic} from the ground up with hands-on projects and real-world examples. This ${level}-level course takes you from core concepts to production-ready code.`,
        prerequisites: level === 'beginner' ? ['Basic computer skills'] : [`Familiarity with ${topic} basics`, 'Programming experience'],
        outcomes: [
            `Understand core ${topic} concepts`,
            `Build real projects using ${topic}`,
            `Debug and troubleshoot common issues`,
            `Apply best practices in production`,
        ],
        lessons: [
            {
                index: 0,
                title: `Introduction to ${topic}`,
                objective: `Understand what ${topic} is, why it matters, and set up your development environment`,
                concepts: ['overview', 'installation', 'tooling', 'hello world'],
                prerequisites: [],
                estimatedDurationSec: 480,
                difficulty: level,
                type: 'theory',
            },
            {
                index: 1,
                title: `Core Concepts & Syntax`,
                objective: `Master the fundamental syntax and core concepts of ${topic}`,
                concepts: ['syntax', 'data types', 'variables', 'control flow'],
                prerequisites: [`Introduction to ${topic}`],
                estimatedDurationSec: 720,
                difficulty: level,
                type: 'hands-on',
            },
            {
                index: 2,
                title: `Functions & Modularity`,
                objective: `Write reusable, modular code using functions and modules`,
                concepts: ['functions', 'parameters', 'return values', 'modules'],
                prerequisites: ['Core Concepts & Syntax'],
                estimatedDurationSec: 600,
                difficulty: level,
                type: 'hands-on',
            },
            {
                index: 3,
                title: `Working with Data`,
                objective: `Manipulate and transform data using built-in data structures`,
                concepts: ['arrays', 'objects', 'maps', 'iteration patterns'],
                prerequisites: ['Functions & Modularity'],
                estimatedDurationSec: 720,
                difficulty: level,
                type: 'hands-on',
            },
            {
                index: 4,
                title: `Error Handling & Debugging`,
                objective: `Write robust code with proper error handling and debugging techniques`,
                concepts: ['try/catch', 'error types', 'debugging tools', 'logging'],
                prerequisites: ['Working with Data'],
                estimatedDurationSec: 540,
                difficulty: level,
                type: 'hands-on',
            },
            {
                index: 5,
                title: `Mini Project: Build Something Real`,
                objective: `Apply all concepts by building a small but complete ${topic} project`,
                concepts: ['project structure', 'integration', 'best practices'],
                prerequisites: ['Error Handling & Debugging'],
                estimatedDurationSec: 1200,
                difficulty: level,
                type: 'challenge',
            },
            {
                index: 6,
                title: `Advanced Patterns`,
                objective: `Level up with advanced patterns and idioms used in production code`,
                concepts: ['design patterns', 'performance', 'idiomatic code'],
                prerequisites: ['Mini Project: Build Something Real'],
                estimatedDurationSec: 900,
                difficulty: level,
                type: 'hands-on',
            },
            {
                index: 7,
                title: `Review & Next Steps`,
                objective: `Consolidate learning and chart your path forward`,
                concepts: ['review', 'community resources', 'next topics'],
                prerequisites: ['Advanced Patterns'],
                estimatedDurationSec: 360,
                difficulty: level,
                type: 'review',
            },
        ],
    });
}
// ─── Main Export ──────────────────────────────────────────────
async function generateCurriculum(topic, level, voice, maxLessons = 8) {
    const prompt = buildCurriculumPrompt(topic, level, voice, maxLessons);
    const raw = await callLLM(prompt, CURRICULUM_SYSTEM_PROMPT);
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error(`Failed to parse curriculum JSON: ${raw.slice(0, 200)}`);
    }
    // Apply progressive difficulty
    const progressiveLessons = applyProgressiveDifficulty(parsed.lessons.slice(0, maxLessons), level);
    const totalDuration = progressiveLessons.reduce((sum, l) => sum + l.estimatedDurationSec, 0);
    return {
        topic,
        level,
        title: parsed.title,
        description: parsed.description,
        totalLessons: progressiveLessons.length,
        estimatedTotalDurationSec: totalDuration,
        prerequisites: parsed.prerequisites || [],
        outcomes: parsed.outcomes || [],
        lessons: progressiveLessons,
    };
}
//# sourceMappingURL=curriculumEngine.js.map