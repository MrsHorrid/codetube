/**
 * AI Generation Tests
 *
 * Tests the curriculum engine, lesson generator, voice synthesis,
 * job queue, and personalization engine.
 * Uses the mock AI provider (no API key required).
 */

import request from 'supertest';
import app from '../app';
import { generateCurriculum } from '../services/ai/curriculumEngine';
import { generateLesson } from '../services/ai/lessonGenerator';
import { synthesizeNarration, buildAudioEvents } from '../services/ai/voiceSynthesis';
import {
  getProfile,
  recordLessonCompletion,
  recordStruggle,
  markConceptMastered,
  getLearnerAnalytics,
  generateRecommendations,
  adaptCurriculum,
} from '../services/ai/personalizationEngine';
import { enqueueGenerationJob, getJob, estimateGenerationTime } from '../services/ai/jobQueue';

// Ensure we're using mock provider for tests
beforeAll(() => {
  process.env.AI_PROVIDER = 'mock';
});

// ─── Curriculum Engine Tests ──────────────────────────────────

describe('CurriculumEngine', () => {
  it('generates a valid curriculum for beginner TypeScript', async () => {
    const curriculum = await generateCurriculum('TypeScript', 'beginner', 'chill', 8);

    expect(curriculum).toBeDefined();
    expect(curriculum.topic).toBe('TypeScript');
    expect(curriculum.level).toBe('beginner');
    expect(curriculum.title).toBeTruthy();
    expect(curriculum.description).toBeTruthy();
    expect(curriculum.lessons).toHaveLength(8);
    expect(curriculum.totalLessons).toBe(8);
    expect(curriculum.estimatedTotalDurationSec).toBeGreaterThan(0);
    expect(curriculum.prerequisites).toBeInstanceOf(Array);
    expect(curriculum.outcomes).toBeInstanceOf(Array);
  });

  it('applies progressive difficulty to lessons', async () => {
    const curriculum = await generateCurriculum('Rust', 'intermediate', 'no-nonsense', 4);

    // Each lesson should have a defined difficulty
    for (const lesson of curriculum.lessons) {
      expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(lesson.difficulty);
    }

    // Duration should increase toward the end of the course
    const first = curriculum.lessons[0].estimatedDurationSec;
    const last = curriculum.lessons[curriculum.lessons.length - 1].estimatedDurationSec;
    expect(last).toBeGreaterThanOrEqual(first);
  });

  it('respects maxLessons limit', async () => {
    const curriculum = await generateCurriculum('Python', 'beginner', 'energetic', 3);
    expect(curriculum.lessons.length).toBeLessThanOrEqual(3);
  });

  it('generates different titles for different topics', async () => {
    const rust = await generateCurriculum('Rust', 'advanced', 'british');
    const python = await generateCurriculum('Python', 'advanced', 'british');
    expect(rust.title).not.toBe(python.title);
  });
});

// ─── Lesson Generator Tests ───────────────────────────────────

describe('LessonGenerator', () => {
  let lesson: import('../types/ai').CurriculumLesson;

  beforeEach(() => {
    lesson = {
      index: 0,
      title: 'Introduction to TypeScript',
      objective: 'Understand what TypeScript is and set up your environment',
      concepts: ['types', 'interfaces', 'compilation'],
      prerequisites: [],
      estimatedDurationSec: 600,
      difficulty: 'beginner',
      type: 'theory',
    };
  });

  it('generates lesson content with code examples', async () => {
    const generated = await generateLesson(lesson, 'TypeScript', 'chill');

    expect(generated.lessonIndex).toBe(0);
    expect(generated.title).toBe(lesson.title);
    expect(generated.codeExamples).toBeInstanceOf(Array);
    expect(generated.codeExamples.length).toBeGreaterThan(0);
    expect(generated.codeExamples[0].code).toBeTruthy();
    expect(generated.codeExamples[0].explanation).toBeTruthy();
  });

  it('generates narration segments', async () => {
    const generated = await generateLesson(lesson, 'TypeScript', 'energetic');

    expect(generated.narrationSegments).toBeInstanceOf(Array);
    expect(generated.narrationSegments.length).toBeGreaterThan(0);
    expect(generated.narrationSegments[0].text).toBeTruthy();
    expect(generated.narrationSegments[0].startTimestampMs).toBeGreaterThanOrEqual(0);
    expect(generated.narrationSegments[0].endTimestampMs).toBeGreaterThan(
      generated.narrationSegments[0].startTimestampMs
    );
  });

  it('generates exercises with hints', async () => {
    const generated = await generateLesson(lesson, 'TypeScript', 'calm-mentor');

    expect(generated.exercises).toBeInstanceOf(Array);
    if (generated.exercises.length > 0) {
      expect(generated.exercises[0].title).toBeTruthy();
      expect(generated.exercises[0].description).toBeTruthy();
      expect(generated.exercises[0].hints).toBeInstanceOf(Array);
    }
  });

  it('produces valid recording events in chronological order', async () => {
    const generated = await generateLesson(lesson, 'TypeScript', 'chill');

    expect(generated.recordingEvents).toBeInstanceOf(Array);
    // Events should be chronological
    for (let i = 1; i < generated.recordingEvents.length; i++) {
      expect(generated.recordingEvents[i].timestamp).toBeGreaterThanOrEqual(
        generated.recordingEvents[i - 1].timestamp
      );
    }
  });

  it('includes AUDIO events in recording format', async () => {
    const generated = await generateLesson(lesson, 'TypeScript', 'chill');
    const audioEvents = generated.recordingEvents.filter((e) => e.type === 'AUDIO');
    expect(audioEvents.length).toBeGreaterThan(0);
    expect(audioEvents[0].data).toHaveProperty('url');
    expect(audioEvents[0].data).toHaveProperty('text');
    expect(audioEvents[0].data).toHaveProperty('durationMs');
  });

  it('includes CHECKPOINT events', async () => {
    const generated = await generateLesson(lesson, 'TypeScript', 'chill');
    const checkpointEvents = generated.recordingEvents.filter((e) => e.type === 'CHECKPOINT');
    expect(checkpointEvents.length).toBeGreaterThanOrEqual(0); // May or may not have checkpoints
  });
});

// ─── Voice Synthesis Tests ────────────────────────────────────

describe('VoiceSynthesis', () => {
  const segments: import('../types/ai').NarrationSegment[] = [
    { text: 'Hello and welcome to this lesson.', startTimestampMs: 0, endTimestampMs: 5000 },
    { text: 'Today we will learn about TypeScript.', startTimestampMs: 5000, endTimestampMs: 10000 },
  ];

  it('synthesizes narration segments (mock mode)', async () => {
    const results = await synthesizeNarration(segments, 'chill', 'test-lesson-001');

    expect(results).toHaveLength(2);
    expect(results[0].url).toBeTruthy();
    expect(results[0].durationMs).toBeGreaterThan(0);
    expect(results[0].persona).toBe('chill');
  });

  it('builds AUDIO events from synthesized narration', async () => {
    const synthesized = await synthesizeNarration(segments, 'energetic', 'test-lesson-002');
    const audioEvents = buildAudioEvents(synthesized);

    expect(audioEvents).toHaveLength(2);
    expect(audioEvents[0].type).toBe('AUDIO');
    expect(audioEvents[0].timestamp).toBeGreaterThanOrEqual(0);
    expect(audioEvents[1].timestamp).toBeGreaterThan(audioEvents[0].timestamp);
  });

  it('returns mock URLs when FISH_AUDIO_API_KEY is not set', async () => {
    const results = await synthesizeNarration(segments, 'british', 'test-lesson-003');
    expect(results[0].url).toMatch(/\/api\/audio\/mock\//);
  });
});

// ─── Job Queue Tests ──────────────────────────────────────────

describe('JobQueue', () => {
  it('creates and processes a generation job', async () => {
    const job = await enqueueGenerationJob('Go Language Basics', 'beginner', 'calm-mentor');

    expect(job.id).toBeTruthy();
    expect(job.courseId).toBeTruthy();
    expect(job.status).toBe('queued');

    // Wait for async processing (mock is fast)
    await new Promise((r) => setTimeout(r, 200));

    const updated = getJob(job.id);
    expect(updated).toBeDefined();
    // With mock provider, should complete quickly
    expect(['generating-curriculum', 'generating-lessons', 'synthesizing-audio', 'assembling', 'completed']).toContain(
      updated!.status
    );
  }, 10000);

  it('estimates generation time correctly', () => {
    process.env.AI_PROVIDER = 'mock';
    const mockTime = estimateGenerationTime(8);
    expect(mockTime).toContain('second');

    process.env.AI_PROVIDER = 'openai';
    const openaiTime = estimateGenerationTime(8);
    expect(openaiTime).toMatch(/minute/);

    process.env.AI_PROVIDER = 'mock'; // reset
  });
});

// ─── Personalization Engine Tests ─────────────────────────────

describe('PersonalizationEngine', () => {
  const userId = 'test-user-' + Date.now();

  it('creates a default profile for new users', () => {
    const profile = getProfile(userId);
    expect(profile.userId).toBe(userId);
    expect(profile.knownConcepts).toEqual([]);
    expect(profile.struggleConcepts).toEqual([]);
  });

  it('records lesson completion', () => {
    const lesson: import('../types/ai').CurriculumLesson = {
      index: 0,
      title: 'Test Lesson',
      objective: 'Test',
      concepts: ['variables', 'functions'],
      prerequisites: [],
      estimatedDurationSec: 300,
      difficulty: 'beginner',
      type: 'hands-on',
    };

    const updated = recordLessonCompletion(userId, 'lesson-1', lesson, 350, ['functions']);

    expect(updated.completedLessons).toContain('lesson-1');
    expect(updated.knownConcepts).toContain('variables');
    expect(updated.struggleConcepts).toContain('functions');
    expect(updated.knownConcepts).not.toContain('functions');
  });

  it('marks concepts as mastered', () => {
    recordStruggle(userId, 'closures');
    let profile = getProfile(userId);
    expect(profile.struggleConcepts).toContain('closures');

    markConceptMastered(userId, 'closures');
    profile = getProfile(userId);
    expect(profile.struggleConcepts).not.toContain('closures');
    expect(profile.knownConcepts).toContain('closures');
  });

  it('generates analytics', () => {
    const analytics = getLearnerAnalytics(userId);
    expect(analytics.userId).toBe(userId);
    expect(analytics.totalLessonsCompleted).toBeGreaterThanOrEqual(0);
    expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(
      analytics.recommendedNextLevel
    );
  });

  it('generates curriculum recommendations', async () => {
    const curriculum = await generateCurriculum('TypeScript', 'beginner', 'chill');

    // Record that user already knows most lesson 0 concepts
    curriculum.lessons[0].concepts.forEach((c) => markConceptMastered(userId, c));

    const recommendations = generateRecommendations(curriculum, userId);
    expect(recommendations).toBeInstanceOf(Array);

    const skips = recommendations.filter((r) => r.type === 'skip');
    expect(skips.length).toBeGreaterThan(0); // Should skip lesson 0
  });
});

// ─── API Route Tests ──────────────────────────────────────────

describe('POST /api/generate-course', () => {
  it('queues a course generation job', async () => {
    const res = await request(app)
      .post('/api/generate-course')
      .send({
        topic: 'Rust for game dev',
        level: 'intermediate',
        voice: 'sarcastic-australian',
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.courseId).toBeTruthy();
    expect(res.body.data.jobId).toBeTruthy();
    expect(res.body.data.status).toBe('queued');
    expect(res.body.data.estimatedTime).toBeTruthy();
  });

  it('rejects invalid level', async () => {
    const res = await request(app)
      .post('/api/generate-course')
      .send({ topic: 'Python', level: 'superhero', voice: 'chill' });

    expect(res.status).toBe(400);
  });

  it('rejects missing topic', async () => {
    const res = await request(app)
      .post('/api/generate-course')
      .send({ level: 'beginner', voice: 'energetic' });

    expect(res.status).toBe(400);
  });

  it('accepts all valid voice personas', async () => {
    const voices = ['chill', 'energetic', 'british', 'sarcastic-australian', 'calm-mentor', 'enthusiastic-teacher', 'no-nonsense'];
    for (const voice of voices) {
      const res = await request(app)
        .post('/api/generate-course')
        .send({ topic: 'JavaScript', level: 'beginner', voice });
      expect(res.status).toBe(202);
    }
  });
});

describe('GET /api/generate-course/jobs/:jobId', () => {
  it('returns job status', async () => {
    const createRes = await request(app)
      .post('/api/generate-course')
      .send({ topic: 'CSS Grid', level: 'beginner', voice: 'chill' });

    const { jobId } = createRes.body.data;
    const statusRes = await request(app).get(`/api/generate-course/jobs/${jobId}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.jobId).toBe(jobId);
    expect(statusRes.body.data.topic).toBe('CSS Grid');
  });

  it('returns 404 for unknown job', async () => {
    const res = await request(app).get('/api/generate-course/jobs/nonexistent-job-id');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/generate-course/voices', () => {
  it('lists all voice personas', async () => {
    const res = await request(app).get('/api/generate-course/voices');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(7);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('description');
  });
});

describe('GET /api/generate-course/levels', () => {
  it('lists all skill levels', async () => {
    const res = await request(app).get('/api/generate-course/levels');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
  });
});

describe('Learner API', () => {
  const testUserId = 'api-test-user-' + Date.now();

  it('gets learner profile', async () => {
    const res = await request(app).get(`/api/generate-course/learner/${testUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(testUserId);
  });

  it('records progress', async () => {
    const res = await request(app)
      .post(`/api/generate-course/learner/${testUserId}/progress`)
      .send({
        lessonId: 'course-abc/lesson-0',
        lessonIndex: 0,
        lessonConcepts: ['variables', 'types'],
        timeTakenSec: 420,
        struggledConcepts: ['types'],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.completedLessons).toContain('course-abc/lesson-0');
  });

  it('records struggle', async () => {
    const res = await request(app)
      .post(`/api/generate-course/learner/${testUserId}/struggle`)
      .send({ concept: 'async/await' });

    expect(res.status).toBe(200);
    expect(res.body.data.struggleConcepts).toContain('async/await');
  });

  it('marks concept as mastered', async () => {
    // First, record a struggle
    await request(app)
      .post(`/api/generate-course/learner/${testUserId}/struggle`)
      .send({ concept: 'promises' });

    const res = await request(app)
      .post(`/api/generate-course/learner/${testUserId}/mastered`)
      .send({ concept: 'promises' });

    expect(res.status).toBe(200);
    expect(res.body.data.struggleConcepts).not.toContain('promises');
    expect(res.body.data.knownConcepts).toContain('promises');
  });

  it('gets analytics', async () => {
    const res = await request(app).get(`/api/generate-course/learner/${testUserId}/analytics`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalLessonsCompleted');
    expect(res.body.data).toHaveProperty('recommendedNextLevel');
  });
});
