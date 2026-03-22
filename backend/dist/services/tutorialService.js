"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTutorials = exports.updateTutorial = exports.getTutorialBySlug = exports.getTutorialById = exports.createTutorial = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
const types_1 = require("../types");
const createTutorial = async (creatorId, input) => {
    const slug = generateSlug(input.title);
    const tutorial = await prisma_1.default.tutorial.create({
        data: {
            title: input.title,
            slug,
            description: input.description,
            language: input.language,
            framework: input.framework,
            difficulty: input.difficulty || types_1.DifficultyLevel.INTERMEDIATE,
            tags: input.tags?.join(',') || '',
            isFree: input.isFree ?? true,
            creatorId,
            status: types_1.TutorialStatus.DRAFT,
        },
    });
    // Update creator's tutorial count
    await prisma_1.default.user.update({
        where: { id: creatorId },
        data: { tutorialCount: { increment: 1 } },
    });
    return tutorial;
};
exports.createTutorial = createTutorial;
const getTutorialById = async (id, userId) => {
    const tutorial = await prisma_1.default.tutorial.findUnique({
        where: { id },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    subscriberCount: true,
                },
            },
            recordings: {
                orderBy: { partIndex: 'asc' },
                select: {
                    id: true,
                    partIndex: true,
                    title: true,
                    durationSec: true,
                    isProcessed: true,
                },
            },
        },
    });
    if (!tutorial)
        return null;
    let viewerProgress = null;
    if (userId) {
        viewerProgress = await prisma_1.default.viewerProgress.findUnique({
            where: {
                userId_tutorialId: {
                    userId,
                    tutorialId: id,
                },
            },
        });
    }
    return {
        ...tutorial,
        tags: tutorial.tags ? tutorial.tags.split(',').filter(Boolean) : [],
        viewerProgress,
    };
};
exports.getTutorialById = getTutorialById;
const getTutorialBySlug = async (slug, userId) => {
    const tutorial = await prisma_1.default.tutorial.findUnique({
        where: { slug },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    subscriberCount: true,
                },
            },
            recordings: {
                orderBy: { partIndex: 'asc' },
                select: {
                    id: true,
                    partIndex: true,
                    title: true,
                    durationSec: true,
                    isProcessed: true,
                },
            },
        },
    });
    if (!tutorial)
        return null;
    let viewerProgress = null;
    if (userId) {
        viewerProgress = await prisma_1.default.viewerProgress.findUnique({
            where: {
                userId_tutorialId: {
                    userId,
                    tutorialId: tutorial.id,
                },
            },
        });
    }
    return {
        ...tutorial,
        tags: tutorial.tags ? tutorial.tags.split(',').filter(Boolean) : [],
        viewerProgress,
    };
};
exports.getTutorialBySlug = getTutorialBySlug;
const updateTutorial = async (id, creatorId, input) => {
    const tutorial = await prisma_1.default.tutorial.findFirst({
        where: { id, creatorId },
    });
    if (!tutorial) {
        throw new Error('Tutorial not found or unauthorized');
    }
    const updateData = {};
    if (input.title) {
        updateData.title = input.title;
        updateData.slug = generateSlug(input.title);
    }
    if (input.description !== undefined)
        updateData.description = input.description;
    if (input.language)
        updateData.language = input.language;
    if (input.framework !== undefined)
        updateData.framework = input.framework;
    if (input.difficulty)
        updateData.difficulty = input.difficulty;
    if (input.tags)
        updateData.tags = input.tags.join(',');
    if (input.isFree !== undefined)
        updateData.isFree = input.isFree;
    if (input.status) {
        updateData.status = input.status;
        if (input.status === types_1.TutorialStatus.PUBLISHED && !tutorial.publishedAt) {
            updateData.publishedAt = new Date();
        }
    }
    return await prisma_1.default.tutorial.update({
        where: { id },
        data: updateData,
    });
};
exports.updateTutorial = updateTutorial;
const listTutorials = async (options) => {
    const { language, difficulty, tag, status, sort = 'newest', page = 1, limit = 20 } = options;
    const where = {
        status: status || types_1.TutorialStatus.PUBLISHED,
        deletedAt: null,
    };
    if (language)
        where.language = language;
    if (difficulty)
        where.difficulty = difficulty;
    if (tag)
        where.tags = { contains: tag };
    let orderBy = { createdAt: 'desc' };
    if (sort === 'popular')
        orderBy = { viewCount: 'desc' };
    if (sort === 'rating')
        orderBy = { avgRating: 'desc' };
    const [tutorials, total] = await Promise.all([
        prisma_1.default.tutorial.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        avatarUrl: true,
                    },
                },
            },
        }),
        prisma_1.default.tutorial.count({ where }),
    ]);
    return {
        tutorials: tutorials.map((t) => ({
            ...t,
            tags: t.tags ? t.tags.split(',').filter(Boolean) : [],
        })),
        pagination: {
            page,
            limit,
            total,
            hasNext: page * limit < total,
        },
    };
};
exports.listTutorials = listTutorials;
const generateSlug = (title) => {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${base}-${Date.now().toString(36)}`;
};
//# sourceMappingURL=tutorialService.js.map