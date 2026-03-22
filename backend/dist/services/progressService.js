"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTutorialProgress = exports.getUserProgress = exports.markComplete = exports.updateProgress = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
const updateProgress = async (userId, tutorialId, input) => {
    // Verify tutorial exists
    const tutorial = await prisma_1.default.tutorial.findUnique({
        where: { id: tutorialId },
    });
    if (!tutorial) {
        throw new Error('Tutorial not found');
    }
    // Verify recording exists if provided
    if (input.recordingId) {
        const recording = await prisma_1.default.recording.findUnique({
            where: { id: input.recordingId },
        });
        if (!recording) {
            throw new Error('Recording not found');
        }
    }
    return await prisma_1.default.viewerProgress.upsert({
        where: {
            userId_tutorialId: {
                userId,
                tutorialId,
            },
        },
        create: {
            userId,
            tutorialId,
            recordingId: input.recordingId,
            timestampMs: input.timestampMs,
            eventIndex: input.eventIndex,
            lastCheckpointId: input.lastCheckpointId,
            playbackSpeed: input.playbackSpeed || 1.0,
            watchTimeSec: 0,
        },
        update: {
            recordingId: input.recordingId,
            timestampMs: input.timestampMs,
            eventIndex: input.eventIndex,
            lastCheckpointId: input.lastCheckpointId,
            playbackSpeed: input.playbackSpeed,
            watchTimeSec: { increment: 5 }, // Approximate, real implementation would track actual watch time
        },
    });
};
exports.updateProgress = updateProgress;
const markComplete = async (userId, tutorialId) => {
    const progress = await prisma_1.default.viewerProgress.findUnique({
        where: {
            userId_tutorialId: {
                userId,
                tutorialId,
            },
        },
    });
    if (!progress) {
        throw new Error('No progress found for this tutorial');
    }
    return await prisma_1.default.viewerProgress.update({
        where: {
            userId_tutorialId: {
                userId,
                tutorialId,
            },
        },
        data: {
            isCompleted: true,
            completedAt: new Date(),
        },
    });
};
exports.markComplete = markComplete;
const getUserProgress = async (userId) => {
    const progress = await prisma_1.default.viewerProgress.findMany({
        where: { userId },
        include: {
            tutorial: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnailUrl: true,
                    language: true,
                    difficulty: true,
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
    return progress;
};
exports.getUserProgress = getUserProgress;
const getTutorialProgress = async (userId, tutorialId) => {
    return await prisma_1.default.viewerProgress.findUnique({
        where: {
            userId_tutorialId: {
                userId,
                tutorialId,
            },
        },
    });
};
exports.getTutorialProgress = getTutorialProgress;
//# sourceMappingURL=progressService.js.map