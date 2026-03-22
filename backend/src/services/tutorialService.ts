import prisma from '../models/prisma';
import { DifficultyLevel, TutorialStatus } from '../types';

export interface CreateTutorialInput {
  title: string;
  description?: string;
  language: string;
  framework?: string;
  difficulty?: string;
  tags?: string[];
  isFree?: boolean;
}

export interface UpdateTutorialInput {
  title?: string;
  description?: string;
  language?: string;
  framework?: string;
  difficulty?: string;
  tags?: string[];
  isFree?: boolean;
  status?: string;
}

export const createTutorial = async (creatorId: string, input: CreateTutorialInput) => {
  const slug = generateSlug(input.title);

  const tutorial = await prisma.tutorial.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      language: input.language,
      framework: input.framework,
      difficulty: input.difficulty || DifficultyLevel.INTERMEDIATE,
      tags: input.tags?.join(',') || '',
      isFree: input.isFree ?? true,
      creatorId,
      status: TutorialStatus.DRAFT,
    },
  });

  // Update creator's tutorial count
  await prisma.user.update({
    where: { id: creatorId },
    data: { tutorialCount: { increment: 1 } },
  });

  return tutorial;
};

export const getTutorialById = async (id: string, userId?: string) => {
  const tutorial = await prisma.tutorial.findUnique({
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

  if (!tutorial) return null;

  let viewerProgress = null;
  if (userId) {
    viewerProgress = await prisma.viewerProgress.findUnique({
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

export const getTutorialBySlug = async (slug: string, userId?: string) => {
  const tutorial = await prisma.tutorial.findUnique({
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

  if (!tutorial) return null;

  let viewerProgress = null;
  if (userId) {
    viewerProgress = await prisma.viewerProgress.findUnique({
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

export const updateTutorial = async (id: string, creatorId: string, input: UpdateTutorialInput) => {
  const tutorial = await prisma.tutorial.findFirst({
    where: { id, creatorId },
  });

  if (!tutorial) {
    throw new Error('Tutorial not found or unauthorized');
  }

  const updateData: Record<string, unknown> = {};

  if (input.title) {
    updateData.title = input.title;
    updateData.slug = generateSlug(input.title);
  }
  if (input.description !== undefined) updateData.description = input.description;
  if (input.language) updateData.language = input.language;
  if (input.framework !== undefined) updateData.framework = input.framework;
  if (input.difficulty) updateData.difficulty = input.difficulty;
  if (input.tags) updateData.tags = input.tags.join(',');
  if (input.isFree !== undefined) updateData.isFree = input.isFree;
  if (input.status) {
    updateData.status = input.status;
    if (input.status === TutorialStatus.PUBLISHED && !tutorial.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  return await prisma.tutorial.update({
    where: { id },
    data: updateData,
  });
};

export const listTutorials = async (options: {
  language?: string;
  difficulty?: string;
  tag?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  const { language, difficulty, tag, status, sort = 'newest', page = 1, limit = 20 } = options;

  const where: Record<string, unknown> = {
    status: status || TutorialStatus.PUBLISHED,
    deletedAt: null,
  };

  if (language) where.language = language;
  if (difficulty) where.difficulty = difficulty;
  if (tag) where.tags = { contains: tag };

  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (sort === 'popular') orderBy = { viewCount: 'desc' };
  if (sort === 'rating') orderBy = { avgRating: 'desc' };

  const [tutorials, total] = await Promise.all([
    prisma.tutorial.findMany({
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
    prisma.tutorial.count({ where }),
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

const generateSlug = (title: string): string => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${Date.now().toString(36)}`;
};
