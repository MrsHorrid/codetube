"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFork = exports.updateFork = exports.getForkByShareToken = exports.getForkById = exports.getUserForks = exports.createFork = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const createFork = async (userId, tutorialId, input) => {
    // Verify tutorial exists
    const tutorial = await prisma_1.default.tutorial.findUnique({
        where: { id: tutorialId },
    });
    if (!tutorial) {
        throw new Error('Tutorial not found');
    }
    // Verify checkpoint exists if provided
    if (input.checkpointId) {
        const checkpoint = await prisma_1.default.checkpoint.findUnique({
            where: { id: input.checkpointId },
        });
        if (!checkpoint) {
            throw new Error('Checkpoint not found');
        }
    }
    // Generate storage key and share token
    const forkId = crypto_1.default.randomUUID();
    const storageKey = `forks/${userId}/${forkId}.zip`;
    const shareToken = crypto_1.default.randomBytes(32).toString('hex');
    const fork = await prisma_1.default.viewerFork.create({
        data: {
            id: forkId,
            userId,
            tutorialId,
            checkpointId: input.checkpointId,
            name: input.name || 'My Fork',
            notes: input.notes,
            storageKey,
            storageBucket: 'codetube',
            sizeBytes: 0,
            shareToken,
            isPublic: false,
            status: 'active',
        },
    });
    // Update tutorial fork count
    await prisma_1.default.tutorial.update({
        where: { id: tutorialId },
        data: { forkCount: { increment: 1 } },
    });
    return {
        fork,
        uploadUrl: `/api/forks/${fork.id}/upload`,
        uploadExpiresAt: new Date(Date.now() + 3600 * 1000),
    };
};
exports.createFork = createFork;
const getUserForks = async (userId) => {
    return await prisma_1.default.viewerFork.findMany({
        where: { userId },
        include: {
            tutorial: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnailUrl: true,
                },
            },
            checkpoint: {
                select: {
                    id: true,
                    label: true,
                    timestampMs: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getUserForks = getUserForks;
const getForkById = async (id, userId) => {
    const fork = await prisma_1.default.viewerFork.findUnique({
        where: { id },
        include: {
            tutorial: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
            checkpoint: {
                select: {
                    id: true,
                    label: true,
                    timestampMs: true,
                },
            },
        },
    });
    if (!fork)
        return null;
    // If fork is not public, verify ownership
    if (!fork.isPublic && fork.userId !== userId) {
        throw new Error('Unauthorized');
    }
    return {
        fork: {
            id: fork.id,
            name: fork.name,
            notes: fork.notes,
            isPublic: fork.isPublic,
            status: fork.status,
            createdAt: fork.createdAt,
            tutorial: fork.tutorial,
            checkpoint: fork.checkpoint,
        },
        downloadUrl: `/api/forks/${fork.id}/download`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
    };
};
exports.getForkById = getForkById;
const getForkByShareToken = async (token) => {
    const fork = await prisma_1.default.viewerFork.findUnique({
        where: { shareToken: token },
        include: {
            tutorial: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
            checkpoint: {
                select: {
                    id: true,
                    label: true,
                    timestampMs: true,
                },
            },
        },
    });
    if (!fork || !fork.isPublic) {
        throw new Error('Fork not found');
    }
    return {
        fork: {
            id: fork.id,
            name: fork.name,
            notes: fork.notes,
            isPublic: fork.isPublic,
            createdAt: fork.createdAt,
            tutorial: fork.tutorial,
            checkpoint: fork.checkpoint,
        },
        downloadUrl: `/api/forks/${fork.id}/download`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
    };
};
exports.getForkByShareToken = getForkByShareToken;
const updateFork = async (id, userId, input) => {
    const fork = await prisma_1.default.viewerFork.findFirst({
        where: { id, userId },
    });
    if (!fork) {
        throw new Error('Fork not found or unauthorized');
    }
    const updateData = {};
    if (input.name !== undefined)
        updateData.name = input.name;
    if (input.notes !== undefined)
        updateData.notes = input.notes;
    if (input.isPublic !== undefined)
        updateData.isPublic = input.isPublic;
    return await prisma_1.default.viewerFork.update({
        where: { id },
        data: updateData,
        include: {
            tutorial: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                },
            },
        },
    });
};
exports.updateFork = updateFork;
const deleteFork = async (id, userId) => {
    const fork = await prisma_1.default.viewerFork.findFirst({
        where: { id, userId },
    });
    if (!fork) {
        throw new Error('Fork not found or unauthorized');
    }
    await prisma_1.default.viewerFork.delete({
        where: { id },
    });
    // Decrement tutorial fork count
    await prisma_1.default.tutorial.update({
        where: { id: fork.tutorialId },
        data: { forkCount: { decrement: 1 } },
    });
    return true;
};
exports.deleteFork = deleteFork;
//# sourceMappingURL=forkService.js.map