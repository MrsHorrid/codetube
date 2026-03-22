export interface UpdateProgressInput {
    recordingId?: string;
    timestampMs: number;
    eventIndex: number;
    lastCheckpointId?: string;
    playbackSpeed?: number;
}
export declare const updateProgress: (userId: string, tutorialId: string, input: UpdateProgressInput) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tutorialId: string;
    userId: string;
    recordingId: string | null;
    timestampMs: number;
    eventIndex: number;
    lastCheckpointId: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    watchTimeSec: number;
    playbackSpeed: number;
}>;
export declare const markComplete: (userId: string, tutorialId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tutorialId: string;
    userId: string;
    recordingId: string | null;
    timestampMs: number;
    eventIndex: number;
    lastCheckpointId: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    watchTimeSec: number;
    playbackSpeed: number;
}>;
export declare const getUserProgress: (userId: string) => Promise<({
    tutorial: {
        id: string;
        title: string;
        slug: string;
        language: string;
        difficulty: string;
        thumbnailUrl: string;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tutorialId: string;
    userId: string;
    recordingId: string | null;
    timestampMs: number;
    eventIndex: number;
    lastCheckpointId: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    watchTimeSec: number;
    playbackSpeed: number;
})[]>;
export declare const getTutorialProgress: (userId: string, tutorialId: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tutorialId: string;
    userId: string;
    recordingId: string | null;
    timestampMs: number;
    eventIndex: number;
    lastCheckpointId: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    watchTimeSec: number;
    playbackSpeed: number;
}>;
//# sourceMappingURL=progressService.d.ts.map