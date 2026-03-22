"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Test database setup
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: 'file:./test.db',
        },
    },
});
exports.prisma = prisma;
// Global setup
global.beforeAll(async () => {
    // Clean test database
    await prisma.$executeRawUnsafe(`DELETE FROM viewer_progress;`);
    await prisma.$executeRawUnsafe(`DELETE FROM viewer_forks;`);
    await prisma.$executeRawUnsafe(`DELETE FROM checkpoints;`);
    await prisma.$executeRawUnsafe(`DELETE FROM recordings;`);
    await prisma.$executeRawUnsafe(`DELETE FROM comments;`);
    await prisma.$executeRawUnsafe(`DELETE FROM subscriptions;`);
    await prisma.$executeRawUnsafe(`DELETE FROM tutorial_likes;`);
    await prisma.$executeRawUnsafe(`DELETE FROM comment_likes;`);
    await prisma.$executeRawUnsafe(`DELETE FROM notifications;`);
    await prisma.$executeRawUnsafe(`DELETE FROM analytics_events;`);
    await prisma.$executeRawUnsafe(`DELETE FROM tutorials;`);
    await prisma.$executeRawUnsafe(`DELETE FROM users;`);
});
global.afterAll(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=setup.js.map