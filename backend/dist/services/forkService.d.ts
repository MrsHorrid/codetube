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
export declare const createFork: (userId: string, tutorialId: string, input: CreateForkInput) => Promise<{
    fork: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: string;
        tutorialId: string;
        storageKey: string;
        storageBucket: string;
        sizeBytes: number;
        userId: string;
        notes: string | null;
        userRecordingKey: string | null;
        isPublic: boolean;
        shareToken: string | null;
        checkpointId: string | null;
    };
    uploadUrl: string;
    uploadExpiresAt: Date;
}>;
export declare const getUserForks: (userId: string) => Promise<({
    tutorial: {
        id: string;
        title: string;
        slug: string;
        thumbnailUrl: string;
    };
    checkpoint: {
        id: string;
        timestampMs: number;
        label: string;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: string;
    tutorialId: string;
    storageKey: string;
    storageBucket: string;
    sizeBytes: number;
    userId: string;
    notes: string | null;
    userRecordingKey: string | null;
    isPublic: boolean;
    shareToken: string | null;
    checkpointId: string | null;
})[]>;
export declare const getForkById: (id: string, userId?: string) => Promise<{
    fork: {
        id: string;
        name: string;
        notes: string;
        isPublic: boolean;
        status: string;
        createdAt: Date;
        tutorial: {
            id: string;
            title: string;
            slug: string;
        };
        checkpoint: {
            id: string;
            timestampMs: number;
            label: string;
        };
    };
    downloadUrl: string;
    expiresAt: Date;
}>;
export declare const getForkByShareToken: (token: string) => Promise<{
    fork: {
        id: string;
        name: string;
        notes: string;
        isPublic: true;
        createdAt: Date;
        tutorial: {
            id: string;
            title: string;
            slug: string;
        };
        checkpoint: {
            id: string;
            timestampMs: number;
            label: string;
        };
    };
    downloadUrl: string;
    expiresAt: Date;
}>;
export declare const updateFork: (id: string, userId: string, input: UpdateForkInput) => Promise<{
    tutorial: {
        id: string;
        title: string;
        slug: string;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    status: string;
    tutorialId: string;
    storageKey: string;
    storageBucket: string;
    sizeBytes: number;
    userId: string;
    notes: string | null;
    userRecordingKey: string | null;
    isPublic: boolean;
    shareToken: string | null;
    checkpointId: string | null;
}>;
export declare const deleteFork: (id: string, userId: string) => Promise<boolean>;
//# sourceMappingURL=forkService.d.ts.map