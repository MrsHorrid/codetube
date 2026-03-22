export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        hasNext?: boolean;
    };
}
export interface TokenPayload {
    userId: string;
    username: string;
    email: string;
    isCreator: boolean;
}
export interface WebSocketMessage {
    type: string;
    payload?: unknown;
}
export declare const DifficultyLevel: {
    readonly BEGINNER: "beginner";
    readonly INTERMEDIATE: "intermediate";
    readonly ADVANCED: "advanced";
    readonly EXPERT: "expert";
};
export declare const TutorialStatus: {
    readonly DRAFT: "draft";
    readonly PROCESSING: "processing";
    readonly PUBLISHED: "published";
    readonly ARCHIVED: "archived";
};
export declare const ForkStatus: {
    readonly ACTIVE: "active";
    readonly ARCHIVED: "archived";
};
export declare const CommentType: {
    readonly COMMENT: "comment";
    readonly REVIEW: "review";
};
//# sourceMappingURL=index.d.ts.map