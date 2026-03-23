"use strict";
/**
 * Personalization Engine
 *
 * Tracks learner progress and struggle points.
 * Auto-generates remedial lessons for weak areas.
 * Recommends skipping already-known concepts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.recordLessonCompletion = recordLessonCompletion;
exports.recordStruggle = recordStruggle;
exports.markConceptMastered = markConceptMastered;
exports.generateRecommendations = generateRecommendations;
exports.generateRemedialLesson = generateRemedialLesson;
exports.getNextLessonIndex = getNextLessonIndex;
exports.getLearnerAnalytics = getLearnerAnalytics;
exports.adaptCurriculum = adaptCurriculum;
const lessonGenerator_1 = require("./lessonGenerator");
// ─── In-Memory Profile Store ──────────────────────────────────
// In production: persist to DB (Prisma) or Redis
const profiles = new Map();
// ─── Profile Management ───────────────────────────────────────
function getProfile(userId) {
    if (!profiles.has(userId)) {
        profiles.set(userId, {
            userId,
            knownConcepts: [],
            struggleConcepts: [],
            completedLessons: [],
            averageTimePerLesson: 0,
            preferredLevel: 'intermediate',
            preferredVoice: 'chill',
        });
    }
    return profiles.get(userId);
}
function updateProfile(userId, updates) {
    const profile = getProfile(userId);
    const updated = { ...profile, ...updates };
    profiles.set(userId, updated);
    return updated;
}
/**
 * Record a lesson completion event.
 * Updates known concepts, time stats, and removes from struggle list if applicable.
 */
function recordLessonCompletion(userId, lessonId, lesson, timeTakenSec, struggledConcepts = []) {
    const profile = getProfile(userId);
    // Add to completed lessons
    const completedLessons = [...new Set([...profile.completedLessons, lessonId])];
    // Add newly mastered concepts
    const newKnown = lesson.concepts.filter((c) => !struggledConcepts.includes(c));
    const knownConcepts = [...new Set([...profile.knownConcepts, ...newKnown])];
    // Track struggling concepts
    const struggleConcepts = [...new Set([...profile.struggleConcepts, ...struggledConcepts])];
    // Update average time
    const prevCount = profile.completedLessons.length;
    const newAvg = prevCount === 0
        ? timeTakenSec
        : (profile.averageTimePerLesson * prevCount + timeTakenSec) / (prevCount + 1);
    return updateProfile(userId, {
        completedLessons,
        knownConcepts,
        struggleConcepts,
        averageTimePerLesson: Math.round(newAvg),
    });
}
/**
 * Record a concept struggle event (e.g., wrong answers, repeated replays).
 */
function recordStruggle(userId, concept) {
    const profile = getProfile(userId);
    const struggleConcepts = [...new Set([...profile.struggleConcepts, concept])];
    return updateProfile(userId, { struggleConcepts });
}
/**
 * Mark a concept as mastered (e.g., passed exercise).
 */
function markConceptMastered(userId, concept) {
    const profile = getProfile(userId);
    const knownConcepts = [...new Set([...profile.knownConcepts, concept])];
    const struggleConcepts = profile.struggleConcepts.filter((c) => c !== concept);
    return updateProfile(userId, { knownConcepts, struggleConcepts });
}
// ─── Recommendation Engine ────────────────────────────────────
/**
 * Analyze a curriculum against a learner's profile and generate
 * personalization recommendations for each lesson.
 */
function generateRecommendations(curriculum, userId) {
    const profile = getProfile(userId);
    const recommendations = [];
    for (const lesson of curriculum.lessons) {
        // Check if all concepts in this lesson are already known
        const allKnown = lesson.concepts.every((c) => profile.knownConcepts.some((k) => k.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(k.toLowerCase())));
        if (allKnown && lesson.type !== 'review') {
            recommendations.push({
                type: 'skip',
                lessonIndex: lesson.index,
                reason: `You already know: ${lesson.concepts.join(', ')}`,
            });
            continue;
        }
        // Check if this lesson covers struggle concepts from previous courses
        const coveredStruggles = lesson.concepts.filter((c) => profile.struggleConcepts.some((s) => s.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.toLowerCase())));
        if (coveredStruggles.length > 0) {
            recommendations.push({
                type: 'review',
                lessonIndex: lesson.index,
                reason: `This covers concepts you previously found challenging: ${coveredStruggles.join(', ')}`,
            });
        }
    }
    return recommendations;
}
/**
 * Generate a remedial mini-lesson targeting specific struggle concepts.
 * Returns a shorter, focused GeneratedLesson.
 */
async function generateRemedialLesson(userId, struggleConcept, parentTopic, voice) {
    const profile = getProfile(userId);
    // Determine appropriate level (one step below current preference for remedial)
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levelOrder.indexOf(profile.preferredLevel);
    const remedialLevel = levelOrder[Math.max(0, currentIndex - 1)];
    const remedialLesson = {
        index: 0,
        title: `Remedial: ${struggleConcept}`,
        objective: `Solidify your understanding of ${struggleConcept} with focused practice`,
        concepts: [struggleConcept],
        prerequisites: [],
        estimatedDurationSec: 300, // 5 minutes — short and focused
        difficulty: remedialLevel,
        type: 'review',
    };
    return await (0, lessonGenerator_1.generateLesson)(remedialLesson, parentTopic, voice);
}
/**
 * Get the next recommended lesson index, skipping already-known content.
 */
function getNextLessonIndex(curriculum, userId) {
    const profile = getProfile(userId);
    const recommendations = generateRecommendations(curriculum, userId);
    const skipIndices = new Set(recommendations.filter((r) => r.type === 'skip').map((r) => r.lessonIndex));
    // Find the first non-skipped, non-completed lesson
    for (const lesson of curriculum.lessons) {
        const lessonId = `${curriculum.topic}-${lesson.index}`;
        if (!skipIndices.has(lesson.index) && !profile.completedLessons.includes(lessonId)) {
            return lesson.index;
        }
    }
    // All lessons complete or skippable → go back to last lesson
    return curriculum.lessons.length - 1;
}
function getLearnerAnalytics(userId) {
    const profile = getProfile(userId);
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levelOrder.indexOf(profile.preferredLevel);
    // If known concepts >> struggle concepts, suggest leveling up
    const masteryRatio = profile.knownConcepts.length / Math.max(1, profile.knownConcepts.length + profile.struggleConcepts.length);
    let recommendedIndex = currentIndex;
    if (masteryRatio > 0.8 && currentIndex < levelOrder.length - 1) {
        recommendedIndex = currentIndex + 1;
    }
    else if (masteryRatio < 0.5 && currentIndex > 0) {
        recommendedIndex = currentIndex - 1;
    }
    return {
        userId,
        totalLessonsCompleted: profile.completedLessons.length,
        knownConceptCount: profile.knownConcepts.length,
        struggleConceptCount: profile.struggleConcepts.length,
        averageTimePerLesson: profile.averageTimePerLesson,
        strongAreas: profile.knownConcepts.slice(0, 10),
        weakAreas: profile.struggleConcepts.slice(0, 10),
        recommendedNextLevel: levelOrder[recommendedIndex],
    };
}
// ─── Adaptive Course Adjuster ─────────────────────────────────
/**
 * Returns an adjusted curriculum that skips known lessons and injects
 * remedial placeholders for weak areas.
 */
async function adaptCurriculum(curriculum, userId) {
    const recommendations = generateRecommendations(curriculum, userId);
    const profile = getProfile(userId);
    const skipIndices = new Set(recommendations.filter((r) => r.type === 'skip').map((r) => r.lessonIndex));
    // Filter out skipped lessons
    const adaptedLessons = curriculum.lessons
        .filter((l) => !skipIndices.has(l.index))
        .map((l, newIndex) => ({ ...l, index: newIndex }));
    // Check if any struggle concepts aren't covered by remaining lessons
    const remainingConcepts = new Set(adaptedLessons.flatMap((l) => l.concepts));
    const uncoveredStruggles = profile.struggleConcepts.filter((s) => !Array.from(remainingConcepts).some((c) => c.toLowerCase().includes(s.toLowerCase())));
    // Add remedial lesson stubs for uncovered struggles (at the beginning)
    const remedialAdded = [];
    for (const struggle of uncoveredStruggles.slice(0, 2)) {
        // Max 2 remedial injections
        const remedialLesson = {
            index: -1, // Will be renumbered
            title: `Remedial: ${struggle}`,
            objective: `Solidify your understanding of ${struggle}`,
            concepts: [struggle],
            prerequisites: [],
            estimatedDurationSec: 300,
            difficulty: profile.preferredLevel,
            type: 'review',
        };
        adaptedLessons.unshift(remedialLesson);
        remedialAdded.push(struggle);
    }
    // Re-index
    const reindexed = adaptedLessons.map((l, i) => ({ ...l, index: i }));
    const totalDuration = reindexed.reduce((sum, l) => sum + l.estimatedDurationSec, 0);
    return {
        curriculum: {
            ...curriculum,
            lessons: reindexed,
            totalLessons: reindexed.length,
            estimatedTotalDurationSec: totalDuration,
        },
        skipped: Array.from(skipIndices),
        remedialAdded,
    };
}
//# sourceMappingURL=personalizationEngine.js.map