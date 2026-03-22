import prisma from '../models/prisma';

export interface UpdateProgressInput {
  recordingId?: string;
  timestampMs: number;
  eventIndex: number;
  lastCheckpointId?: string;
  playbackSpeed?: number;
}

export const updateProgress = async (userId: string, tutorialId: string, input: UpdateProgressInput) => {
  // Verify tutorial exists
  const tutorial = await prisma.tutorial.findUnique({
    where: { id: tutorialId },
  });

  if (!tutorial) {
    throw new Error('Tutorial not found');
  }

  // Verify recording exists if provided
  if (input.recordingId) {
    const recording = await prisma.recording.findUnique({
      where: { id: input.recordingId },
    });
    if (!recording) {
      throw new Error('Recording not found');
    }
  }

  return await prisma.viewerProgress.upsert({
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

export const markComplete = async (userId: string, tutorialId: string) => {
  const progress = await prisma.viewerProgress.findUnique({
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

  return await prisma.viewerProgress.update({
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

export const getUserProgress = async (userId: string) => {
  const progress = await prisma.viewerProgress.findMany({
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

export const getTutorialProgress = async (userId: string, tutorialId: string) => {
  return await prisma.viewerProgress.findUnique({
    where: {
      userId_tutorialId: {
        userId,
        tutorialId,
      },
    },
  });
};
