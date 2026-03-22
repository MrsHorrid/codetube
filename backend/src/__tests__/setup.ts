import { PrismaClient } from '@prisma/client';
import prisma from '../models/prisma';

// Global setup
global.beforeAll(async () => {
  // Clean test database using Prisma deleteMany (safer than raw SQL)
  try {
    await prisma.viewerProgress.deleteMany({});
    await prisma.viewerFork.deleteMany({});
    await prisma.checkpoint.deleteMany({});
    await prisma.recording.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.tutorialLike.deleteMany({});
    await prisma.commentLike.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.analyticsEvent.deleteMany({});
    await prisma.tutorial.deleteMany({});
    await prisma.user.deleteMany({});
  } catch {
    // Tables might not exist yet, that's okay
  }
});

global.afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
