"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJob = getJob;
exports.getJobByCourseId = getJobByCourseId;
exports.listJobs = listJobs;
exports.enqueueGenerationJob = enqueueGenerationJob;
exports.estimateGenerationTime = estimateGenerationTime;
const crypto_1 = require("crypto");
const curriculumEngine_1 = require("./curriculumEngine");
const lessonGenerator_1 = require("./lessonGenerator");
const voiceSynthesis_1 = require("./voiceSynthesis");
// ─── In-Memory Job Store ──────────────────────────────────────
// ⚠️  WARNING: In-memory only — all jobs are LOST on server restart.
// In production, swap this for Redis + BullMQ for persistence, retries,
// and horizontal scaling across multiple server instances.
const jobs = new Map();
const courseJobs = new Map(); // courseId → jobId
// Job processing timeout (default 10 min for real LLMs, 30s for mock)
const JOB_TIMEOUT_MS = parseInt(process.env.JOB_TIMEOUT_MS || '0', 10) ||
    (process.env.AI_PROVIDER === 'mock' ? 30_000 : 10 * 60_000);
// ─── Job Management ───────────────────────────────────────────
function createJob(topic, level, voice) {
    const id = (0, crypto_1.randomUUID)();
    const courseId = `course-${(0, crypto_1.randomUUID)().slice(0, 8)}`;
    const job = {
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
function updateJob(id, updates) {
    const job = jobs.get(id);
    if (!job)
        return null;
    const updated = {
        ...job,
        ...updates,
        updatedAt: new Date(),
    };
    jobs.set(id, updated);
    return updated;
}
function getJob(id) {
    return jobs.get(id) || null;
}
function getJobByCourseId(courseId) {
    const jobId = courseJobs.get(courseId);
    if (!jobId)
        return null;
    return getJob(jobId);
}
function listJobs(limit = 20) {
    return Array.from(jobs.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
}
// ─── Job Processor ────────────────────────────────────────────
async function processJobWithTimeout(jobId) {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Job timed out after ${JOB_TIMEOUT_MS / 1000}s. ` +
        'If using a real LLM, check your API key and network. ' +
        'Increase JOB_TIMEOUT_MS env var if needed.')), JOB_TIMEOUT_MS));
    return Promise.race([processJob(jobId), timeoutPromise]);
}
async function processJob(jobId) {
    const job = jobs.get(jobId);
    if (!job)
        return;
    console.log(`[JobQueue] Starting job ${jobId}: "${job.topic}" (${job.level}, ${job.voice})`);
    try {
        // Phase 1: Generate curriculum
        updateJob(jobId, { status: 'generating-curriculum', progress: 5 });
        console.log(`[JobQueue] ${jobId}: Generating curriculum...`);
        const curriculum = await (0, curriculumEngine_1.generateCurriculum)(job.topic, job.level, job.voice);
        updateJob(jobId, { curriculum, progress: 20 });
        // Phase 2: Generate lesson content
        updateJob(jobId, { status: 'generating-lessons', progress: 25 });
        console.log(`[JobQueue] ${jobId}: Generating ${curriculum.lessons.length} lessons...`);
        const lessons = await (0, lessonGenerator_1.generateAllLessons)(curriculum, job.voice, (lessonIndex, total) => {
            const lessonProgress = 25 + Math.round((lessonIndex / total) * 40);
            updateJob(jobId, { progress: lessonProgress });
            console.log(`[JobQueue] ${jobId}: Lesson ${lessonIndex}/${total} complete`);
        });
        updateJob(jobId, { lessons, progress: 65 });
        // Phase 3: Synthesize audio (if Fish Audio is configured)
        updateJob(jobId, { status: 'synthesizing-audio', progress: 70 });
        console.log(`[JobQueue] ${jobId}: Synthesizing voice narration...`);
        for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            const synthesized = await (0, voiceSynthesis_1.synthesizeNarration)(lesson.narrationSegments, job.voice, `${job.courseId}/lesson-${i}`);
            // Build audio events and merge into recording events
            const audioEvents = (0, voiceSynthesis_1.buildAudioEvents)(synthesized);
            const existingNonAudio = lesson.recordingEvents.filter((e) => e.type !== 'AUDIO');
            lesson.recordingEvents = [...audioEvents, ...existingNonAudio].sort((a, b) => a.timestamp - b.timestamp);
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[JobQueue] ${jobId}: ✗ Failed: ${message}`);
        updateJob(jobId, {
            status: 'failed',
            error: message,
        });
    }
}
// ─── Queue Interface ──────────────────────────────────────────
// Log a startup warning so operators know the queue is ephemeral
(function warnInMemoryQueue() {
    const provider = process.env.AI_PROVIDER || 'mock';
    console.warn('[JobQueue] ⚠️  Using IN-MEMORY job store — all queued jobs will be lost on restart. ' +
        `AI provider: "${provider}". ` +
        (provider === 'mock'
            ? 'Running in mock mode — no API key required.'
            : 'To upgrade: install BullMQ + Redis and replace the in-memory store.'));
})();
/**
 * Enqueue a new course generation job.
 * Returns immediately with the job; processing runs in the background.
 */
async function enqueueGenerationJob(topic, level, voice) {
    const job = createJob(topic, level, voice);
    // Process asynchronously (non-blocking) with timeout guard
    setImmediate(() => {
        processJobWithTimeout(job.id).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[JobQueue] Unhandled error in job ${job.id}:`, message);
            // Ensure job is marked failed even if processJob itself didn't catch it
            const current = jobs.get(job.id);
            if (current && current.status !== 'completed' && current.status !== 'failed') {
                updateJob(job.id, { status: 'failed', error: message });
            }
        });
    });
    return job;
}
/**
 * Estimate time for a course generation job.
 */
function estimateGenerationTime(numLessons = 8) {
    const provider = process.env.AI_PROVIDER || 'mock';
    if (provider === 'mock')
        return '< 5 seconds';
    const fishEnabled = Boolean(process.env.FISH_AUDIO_API_KEY);
    const curriculumTime = 10; // seconds
    const lessonTime = 15; // seconds per lesson (LLM call)
    const audioTime = fishEnabled ? 20 : 0; // seconds per lesson
    const total = curriculumTime + numLessons * (lessonTime + audioTime);
    const minMin = Math.floor(total / 60);
    const maxMin = Math.ceil((total * 1.5) / 60);
    if (minMin < 1)
        return `under 1 minute`;
    if (minMin === maxMin)
        return `~${minMin} minutes`;
    return `${minMin}-${maxMin} minutes`;
}
//# sourceMappingURL=jobQueue.js.map