"use strict";
/**
 * AI Course Generation API Routes
 *
 * POST /api/generate-course        - Queue a new course generation job
 * GET  /api/generate-course/jobs          - List all jobs
 * GET  /api/generate-course/jobs/:jobId   - Get job status & result
 * GET  /api/generate-course/courses/:courseId - Get completed course
 * POST /api/generate-course/remedial      - Generate a remedial lesson
 * POST /api/generate-course/adapt         - Get adapted curriculum for a user
 *
 * Personalization:
 * GET  /api/generate-course/learner/:userId         - Get learner profile
 * POST /api/generate-course/learner/:userId/progress - Record lesson progress
 * GET  /api/generate-course/learner/:userId/analytics - Get learner analytics
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const jobQueue_1 = require("../services/ai/jobQueue");
const personalizationEngine_1 = require("../services/ai/personalizationEngine");
const router = (0, express_1.Router)();
// ─── Validation Schemas ───────────────────────────────────────
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const VOICE_PERSONAS = [
    'chill',
    'energetic',
    'british',
    'sarcastic-australian',
    'calm-mentor',
    'enthusiastic-teacher',
    'no-nonsense',
];
const generateCourseSchema = zod_1.z.object({
    topic: zod_1.z.string().min(2).max(200),
    level: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    voice: zod_1.z.enum(['chill', 'energetic', 'british', 'sarcastic-australian', 'calm-mentor', 'enthusiastic-teacher', 'no-nonsense']).default('chill'),
    maxLessons: zod_1.z.number().int().min(1).max(20).optional().default(8),
    userId: zod_1.z.string().optional(),
});
const progressSchema = zod_1.z.object({
    lessonId: zod_1.z.string(),
    lessonIndex: zod_1.z.number().int().min(0),
    lessonConcepts: zod_1.z.array(zod_1.z.string()),
    timeTakenSec: zod_1.z.number().int().min(0),
    struggledConcepts: zod_1.z.array(zod_1.z.string()).optional().default([]),
    completedExercise: zod_1.z.boolean().optional().default(false),
});
const remedialSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    struggleConcept: zod_1.z.string(),
    parentTopic: zod_1.z.string(),
    voice: zod_1.z.enum(['chill', 'energetic', 'british', 'sarcastic-australian', 'calm-mentor', 'enthusiastic-teacher', 'no-nonsense']).optional().default('chill'),
});
// ─── Helpers ──────────────────────────────────────────────────
function jobToStatusResponse(job) {
    return {
        jobId: job.id,
        courseId: job.courseId,
        status: job.status,
        progress: job.progress,
        topic: job.topic,
        level: job.level,
        voice: job.voice,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        error: job.error,
        curriculum: job.curriculum,
    };
}
// ─── Routes ───────────────────────────────────────────────────
/**
 * POST /api/generate-course
 * Queue a new on-demand course generation.
 */
router.post('/', async (req, res, next) => {
    try {
        const body = generateCourseSchema.parse(req.body);
        const job = await (0, jobQueue_1.enqueueGenerationJob)(body.topic, body.level, body.voice);
        const estimatedTime = (0, jobQueue_1.estimateGenerationTime)(body.maxLessons);
        const response = {
            courseId: job.courseId,
            jobId: job.id,
            estimatedTime,
            status: job.status,
            lessons: job.curriculum?.lessons.map((l) => ({
                index: l.index,
                title: l.title,
                estimatedDurationSec: l.estimatedDurationSec,
            })) ?? [],
        };
        res.status(202).json({
            success: true,
            data: response,
            meta: {
                message: `Course generation queued. Poll /api/generate-course/jobs/${job.id} for status.`,
                availableVoices: VOICE_PERSONAS,
                availableLevels: SKILL_LEVELS,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/generate-course/jobs
 * List recent generation jobs.
 */
router.get('/jobs', (_req, res) => {
    const jobs = (0, jobQueue_1.listJobs)(20);
    res.json({
        success: true,
        data: jobs.map(jobToStatusResponse),
        meta: { total: jobs.length },
    });
});
/**
 * GET /api/generate-course/jobs/:jobId
 * Poll job status. Returns curriculum and lessons when complete.
 */
router.get('/jobs/:jobId', (req, res) => {
    const job = (0, jobQueue_1.getJob)(String(req.params.jobId));
    if (!job) {
        return res.status(404).json({
            success: false,
            error: { code: 'JOB_NOT_FOUND', message: `No job with id ${String(req.params.jobId)}` },
        });
    }
    const includeContent = job.status === 'completed' && req.query.content !== 'false';
    res.json({
        success: true,
        data: {
            ...jobToStatusResponse(job),
            ...(includeContent && {
                lessons: job.lessons?.map((l) => ({
                    lessonIndex: l.lessonIndex,
                    title: l.title,
                    objective: l.objective,
                    durationSec: l.durationSec,
                    codeExamplesCount: l.codeExamples.length,
                    checkpointsCount: l.checkpoints.length,
                    exercisesCount: l.exercises.length,
                    recordingEventsCount: l.recordingEvents.length,
                })),
            }),
        },
    });
});
/**
 * GET /api/generate-course/courses/:courseId
 * Get the full completed course content.
 */
router.get('/courses/:courseId', (req, res) => {
    const job = (0, jobQueue_1.getJobByCourseId)(String(req.params.courseId));
    if (!job) {
        return res.status(404).json({
            success: false,
            error: { code: 'COURSE_NOT_FOUND', message: `No course with id ${String(req.params.courseId)}` },
        });
    }
    if (job.status !== 'completed') {
        return res.status(202).json({
            success: false,
            error: {
                code: 'COURSE_NOT_READY',
                message: `Course is still generating (status: ${job.status}, progress: ${job.progress}%)`,
            },
            data: { jobId: job.id, status: job.status, progress: job.progress },
        });
    }
    res.json({
        success: true,
        data: {
            courseId: job.courseId,
            topic: job.topic,
            level: job.level,
            voice: job.voice,
            curriculum: job.curriculum,
            lessons: job.lessons,
            generatedAt: job.completedAt,
        },
    });
});
/**
 * GET /api/generate-course/courses/:courseId/lessons/:lessonIndex
 * Get a single lesson's recording events for playback.
 */
router.get('/courses/:courseId/lessons/:lessonIndex', (req, res) => {
    const job = (0, jobQueue_1.getJobByCourseId)(String(req.params.courseId));
    const lessonIndex = parseInt(String(req.params.lessonIndex), 10);
    if (!job || job.status !== 'completed') {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Course not found or not ready' },
        });
    }
    const lesson = job.lessons?.find((l) => l.lessonIndex === lessonIndex);
    if (!lesson) {
        return res.status(404).json({
            success: false,
            error: { code: 'LESSON_NOT_FOUND', message: `Lesson ${lessonIndex} not found` },
        });
    }
    res.json({
        success: true,
        data: lesson,
    });
});
// ─── Remedial Routes ──────────────────────────────────────────
/**
 * POST /api/generate-course/remedial
 * Generate a focused remedial lesson for a specific struggle concept.
 */
router.post('/remedial', async (req, res, next) => {
    try {
        const body = remedialSchema.parse(req.body);
        const lesson = await (0, personalizationEngine_1.generateRemedialLesson)(body.userId, body.struggleConcept, body.parentTopic, body.voice);
        res.json({
            success: true,
            data: lesson,
            meta: {
                message: `Remedial lesson generated for concept: ${body.struggleConcept}`,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ─── Personalization Routes ───────────────────────────────────
/**
 * GET /api/generate-course/learner/:userId
 * Get learner profile.
 */
router.get('/learner/:userId', (req, res) => {
    const profile = (0, personalizationEngine_1.getProfile)(String(req.params.userId));
    res.json({ success: true, data: profile });
});
/**
 * GET /api/generate-course/learner/:userId/analytics
 * Get learner analytics and recommendations.
 */
router.get('/learner/:userId/analytics', (req, res) => {
    const analytics = (0, personalizationEngine_1.getLearnerAnalytics)(String(req.params.userId));
    res.json({ success: true, data: analytics });
});
/**
 * POST /api/generate-course/learner/:userId/progress
 * Record lesson completion and update learner profile.
 */
router.post('/learner/:userId/progress', async (req, res, next) => {
    try {
        const body = progressSchema.parse(req.body);
        const { lessonId, lessonConcepts, timeTakenSec, struggledConcepts } = body;
        // Build a minimal CurriculumLesson for the update
        const lessonSummary = {
            index: body.lessonIndex,
            title: lessonId,
            objective: '',
            concepts: lessonConcepts,
            prerequisites: [],
            estimatedDurationSec: timeTakenSec,
            difficulty: 'intermediate',
            type: 'hands-on',
        };
        const updatedProfile = (0, personalizationEngine_1.recordLessonCompletion)(String(req.params.userId), lessonId, lessonSummary, timeTakenSec, struggledConcepts);
        res.json({
            success: true,
            data: updatedProfile,
            meta: { message: 'Progress recorded' },
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/generate-course/learner/:userId/struggle
 * Record a specific concept struggle.
 */
router.post('/learner/:userId/struggle', (req, res) => {
    const { concept } = req.body;
    if (!concept) {
        return res.status(400).json({
            success: false,
            error: { code: 'MISSING_CONCEPT', message: 'concept is required' },
        });
    }
    const profile = (0, personalizationEngine_1.recordStruggle)(String(req.params.userId), concept);
    res.json({ success: true, data: profile });
});
/**
 * POST /api/generate-course/learner/:userId/mastered
 * Mark a concept as mastered.
 */
router.post('/learner/:userId/mastered', (req, res) => {
    const { concept } = req.body;
    if (!concept) {
        return res.status(400).json({
            success: false,
            error: { code: 'MISSING_CONCEPT', message: 'concept is required' },
        });
    }
    const profile = (0, personalizationEngine_1.markConceptMastered)(String(req.params.userId), concept);
    res.json({ success: true, data: profile });
});
/**
 * POST /api/generate-course/adapt
 * Get an adapted curriculum for a learner (skips known, adds remedial).
 */
router.post('/adapt', async (req, res, next) => {
    try {
        const { courseId, userId } = req.body;
        if (!courseId || !userId) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_PARAMS', message: 'courseId and userId are required' },
            });
        }
        const job = (0, jobQueue_1.getJobByCourseId)(courseId);
        if (!job?.curriculum) {
            return res.status(404).json({
                success: false,
                error: { code: 'CURRICULUM_NOT_FOUND', message: 'Course or curriculum not found' },
            });
        }
        const { curriculum, skipped, remedialAdded } = await (0, personalizationEngine_1.adaptCurriculum)(job.curriculum, userId);
        const recommendations = (0, personalizationEngine_1.generateRecommendations)(curriculum, userId);
        res.json({
            success: true,
            data: {
                adaptedCurriculum: curriculum,
                skippedLessons: skipped,
                remedialLessonsAdded: remedialAdded,
                recommendations,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/generate-course/voices
 * List available voice personas.
 */
router.get('/voices', (_req, res) => {
    const { VOICE_PERSONA_DESCRIPTIONS } = require('../services/ai/voiceSynthesis');
    res.json({
        success: true,
        data: VOICE_PERSONAS.map((v) => ({
            id: v,
            description: VOICE_PERSONA_DESCRIPTIONS[v],
            fishAudioConfigured: Boolean(process.env[`FISH_VOICE_${v.toUpperCase().replace(/-/g, '_')}`]),
        })),
    });
});
/**
 * GET /api/generate-course/levels
 * List available skill levels.
 */
router.get('/levels', (_req, res) => {
    res.json({
        success: true,
        data: SKILL_LEVELS.map((l) => ({
            id: l,
            label: l.charAt(0).toUpperCase() + l.slice(1),
            description: {
                beginner: 'No prior knowledge assumed. Perfect for first-timers.',
                intermediate: 'Basic programming knowledge assumed. Practical focus.',
                advanced: 'Solid experience assumed. Deep dives into internals.',
                expert: 'Peer-level discussion. Cutting-edge techniques and trade-offs.',
            }[l],
        })),
    });
});
exports.default = router;
//# sourceMappingURL=generate.js.map