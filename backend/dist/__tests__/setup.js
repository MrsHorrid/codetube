"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
exports.prisma = prisma_1.default;
// Global setup
global.beforeAll(async () => {
    // Clean test database using Prisma deleteMany (safer than raw SQL)
    try {
        await prisma_1.default.viewerProgress.deleteMany({});
        await prisma_1.default.viewerFork.deleteMany({});
        await prisma_1.default.checkpoint.deleteMany({});
        await prisma_1.default.recording.deleteMany({});
        await prisma_1.default.comment.deleteMany({});
        await prisma_1.default.subscription.deleteMany({});
        await prisma_1.default.tutorialLike.deleteMany({});
        await prisma_1.default.commentLike.deleteMany({});
        await prisma_1.default.notification.deleteMany({});
        await prisma_1.default.analyticsEvent.deleteMany({});
        await prisma_1.default.tutorial.deleteMany({});
        await prisma_1.default.user.deleteMany({});
    }
    catch {
        // Tables might not exist yet, that's okay
    }
});
global.afterAll(async () => {
    await prisma_1.default.$disconnect();
});
//# sourceMappingURL=setup.js.map