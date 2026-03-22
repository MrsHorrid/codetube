"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentType = exports.ForkStatus = exports.TutorialStatus = exports.DifficultyLevel = void 0;
// Enums (as const for type safety)
exports.DifficultyLevel = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert',
};
exports.TutorialStatus = {
    DRAFT: 'draft',
    PROCESSING: 'processing',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
};
exports.ForkStatus = {
    ACTIVE: 'active',
    ARCHIVED: 'archived',
};
exports.CommentType = {
    COMMENT: 'comment',
    REVIEW: 'review',
};
//# sourceMappingURL=index.js.map