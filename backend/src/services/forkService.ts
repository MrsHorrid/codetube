import prisma from '../models/prisma';
import crypto from 'crypto';

export interface CreateForkInput {
  checkpointId?: string;
  name?: string;
  notes?: string;
}

export interface UpdateForkInput {
  name?: string;
  notes?: string;
  isPublic?: boolean;
}

export const createFork = async (userId: string, tutorialId: string, input: CreateForkInput) => {
  // Verify tutorial exists
  const tutorial = await prisma.tutorial.findUnique({
    where: { id: tutorialId },
  });

  if (!tutorial) {
    throw new Error('Tutorial not found');
  }

  // Verify checkpoint exists if provided
  if (input.checkpointId) {
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: input.checkpointId },
    });
    if (!checkpoint) {
      throw new Error('Checkpoint not found');
    }
  }

  // Generate storage key and share token
  const forkId = crypto.randomUUID();
  const storageKey = `forks/${userId}/${forkId}.zip`;
  const shareToken = crypto.randomBytes(32).toString('hex');

  const fork = await prisma.viewerFork.create({
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
  await prisma.tutorial.update({
    where: { id: tutorialId },
    data: { forkCount: { increment: 1 } },
  });

  return {
    fork,
    uploadUrl: `/api/forks/${fork.id}/upload`,
    uploadExpiresAt: new Date(Date.now() + 3600 * 1000),
  };
};

export const getUserForks = async (userId: string) => {
  return await prisma.viewerFork.findMany({
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

export const getForkById = async (id: string, userId?: string) => {
  const fork = await prisma.viewerFork.findUnique({
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

  if (!fork) return null;

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

export const getForkByShareToken = async (token: string) => {
  const fork = await prisma.viewerFork.findUnique({
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

export const updateFork = async (id: string, userId: string, input: UpdateForkInput) => {
  const fork = await prisma.viewerFork.findFirst({
    where: { id, userId },
  });

  if (!fork) {
    throw new Error('Fork not found or unauthorized');
  }

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

  return await prisma.viewerFork.update({
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

export const deleteFork = async (id: string, userId: string) => {
  const fork = await prisma.viewerFork.findFirst({
    where: { id, userId },
  });

  if (!fork) {
    throw new Error('Fork not found or unauthorized');
  }

  await prisma.viewerFork.delete({
    where: { id },
  });

  // Decrement tutorial fork count
  await prisma.tutorial.update({
    where: { id: fork.tutorialId },
    data: { forkCount: { decrement: 1 } },
  });

  return true;
};
