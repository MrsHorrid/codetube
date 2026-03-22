/**
 * AI Generation Job Queue
 *
 * Manages async course generation jobs.
 * Uses an in-memory store for development; can be extended to Redis/BullMQ.
 *
 * Job lifecycle:
 *   queued → generating-curriculum → generating-lessons → synthesizing-audio → assembling → completed
 *                                                                                          ↘ failed
 */

import { randomUUID as uuidv4 } from 'crypto';
import {
  GenerationJob,
  JobStatus,
  SkillLevel,
  VoicePersona,
  Curriculum,
  GeneratedLesson,
} from '../../types/ai';
import { generateCurriculum } from './curriculumEngine';
import { generateAllLessons } from './lessonGenerator';
import { synthesizeNarration, buildAudioEvents } from './voiceSynthesis';

// ─── In-Memory Job Store ──────────────────────────────────────
// In production, swap this for Redis + BullMQ

const jobs = new Map<string, GenerationJob>();
const courseJobs = new Map<string, string>(); // courseId → jobId

// ─── Job Management ───────────────────────────────────────────

function createJob(topic: string, level: SkillLevel, voice: VoicePersona): GenerationJob {
  const id = uuidv4();
  const courseId = `course-${uuidv4().slice(0, 8)}`;

  const job: GenerationJob = {
    id,
    courseId,
    topic,
    level,
    voice,
    status: 'queued',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobs.set(id, job);
  courseJobs.set(courseId, id);
  return job;
}

function updateJob(id: string, updates: Partial<GenerationJob>): GenerationJob | null {
  const job = jobs.get(id);
  if (!job) return null;

  const updated: GenerationJob = {
    ...job,
    ...updates,
    updatedAt: new Date(),
  };
  jobs.set(id, updated);
  return updated;
}

export function getJob(id: string): GenerationJob | null {
  return jobs.get(id) || null;
}

export function getJobByCourseId(courseId: string): GenerationJob | null {
  const jobId = courseJobs.get(courseId);
  if (!jobId) return null;
  return getJob(jobId);
}

export function listJobs(limit = 20): GenerationJob[] {
  return Array.from(jobs.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// ─── Job Processor ────────────────────────────────────────────

async function processJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  console.log(`[JobQueue] Starting job ${jobId}: "${job.topic}" (${job.level}, ${job.voice})`);

  try {
    // Phase 1: Generate curriculum
    updateJob(jobId, { status: 'generating-curriculum', progress: 5 });
    console.log(`[JobQueue] ${jobId}: Generating curriculum...`);
    const curriculum = await generateCurriculum(job.topic, job.level, job.voice);
    updateJob(jobId, { curriculum, progress: 20 });

    // Phase 2: Generate lesson content
    updateJob(jobId, { status: 'generating-lessons', progress: 25 });
    console.log(`[JobQueue] ${jobId}: Generating ${curriculum.lessons.length} lessons...`);

    const lessons: GeneratedLesson[] = await generateAllLessons(
      curriculum,
      job.voice,
      (lessonIndex, total) => {
        const lessonProgress = 25 + Math.round((lessonIndex / total) * 40);
        updateJob(jobId, { progress: lessonProgress });
        console.log(`[JobQueue] ${jobId}: Lesson ${lessonIndex}/${total} complete`);
      }
    );
    updateJob(jobId, { lessons, progress: 65 });

    // Phase 3: Synthesize audio (if Fish Audio is configured)
    updateJob(jobId, { status: 'synthesizing-audio', progress: 70 });
    console.log(`[JobQueue] ${jobId}: Synthesizing voice narration...`);

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const synthesized = await synthesizeNarration(
        lesson.narrationSegments,
        job.voice,
        `${job.courseId}/lesson-${i}`
      );

      // Build audio events and merge into recording events
      const audioEvents = buildAudioEvents(synthesized);
      const existingNonAudio = lesson.recordingEvents.filter((e) => e.type !== 'AUDIO');
      lesson.recordingEvents = [...audioEvents, ...existingNonAudio].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      const audioProgress = 70 + Math.round(((i + 1) / lessons.length) * 15);
      updateJob(jobId, { lessons: [...lessons], progress: audioProgress });
    }

    // Phase 4: Assemble final course
    updateJob(jobId, { status: 'assembling', progress: 90 });
    console.log(`[JobQueue] ${jobId}: Assembling final course...`);

    // Brief pause to simulate final assembly (indexing, DB writes, etc.)
    await new Promise((r) => setTimeout(r, 500));

    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      lessons,
    });

    console.log(`[JobQueue] ${jobId}: ✓ Completed! Course ${job.courseId} ready.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[JobQueue] ${jobId}: ✗ Failed: ${message}`);
    updateJob(jobId, {
      status: 'failed',
      error: message,
    });
  }
}

// ─── Queue Interface ──────────────────────────────────────────

/**
 * Enqueue a new course generation job.
 * Returns immediately with the job; processing runs in the background.
 */
export async function enqueueGenerationJob(
  topic: string,
  level: SkillLevel,
  voice: VoicePersona
): Promise<GenerationJob> {
  const job = createJob(topic, level, voice);

  // Process asynchronously (non-blocking)
  setImmediate(() => {
    processJob(job.id).catch((err) => {
      console.error(`[JobQueue] Unhandled error in job ${job.id}:`, err);
    });
  });

  return job;
}

/**
 * Estimate time for a course generation job.
 */
export function estimateGenerationTime(numLessons = 8): string {
  const provider = process.env.AI_PROVIDER || 'mock';

  if (provider === 'mock') return '< 5 seconds';

  const fishEnabled = Boolean(process.env.FISH_AUDIO_API_KEY);
  const curriculumTime = 10; // seconds
  const lessonTime = 15; // seconds per lesson (LLM call)
  const audioTime = fishEnabled ? 20 : 0; // seconds per lesson

  const total = curriculumTime + numLessons * (lessonTime + audioTime);
  const minMin = Math.floor(total / 60);
  const maxMin = Math.ceil((total * 1.5) / 60);

  if (minMin < 1) return `under 1 minute`;
  if (minMin === maxMin) return `~${minMin} minutes`;
  return `${minMin}-${maxMin} minutes`;
}
