export interface CreateRecordingInput {
    tutorialId: string;
    partIndex?: number;
    title?: string;
    durationSec: number;
    eventCount: number;
    sizeBytes: number;
    checksumSha256: string;
    compression?: string;
    encoding?: string;
    editor?: string;
    terminalCols?: number;
    terminalRows?: number;
}
export interface CreateCheckpointInput {
    timestampMs: number;
    eventIndex: number;
    label: string;
    description?: string;
    stateSnapshot?: Record<string, unknown>;
}
export declare const createRecording: (creatorId: string, input: CreateRecordingInput) => Promise<{
    recording: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        creatorId: string;
        partIndex: number;
        tutorialId: string;
        storageKey: string;
        storageBucket: string;
        sizeBytes: number;
        checksumSha256: string;
        compression: string;
        encoding: string;
        durationSec: number;
        eventCount: number;
        editor: string | null;
        terminalCols: number | null;
        terminalRows: number | null;
        isProcessed: boolean;
        processingError: string | null;
    };
    uploadUrl: string;
    uploadExpiresAt: Date;
}>;
export declare const getRecordingById: (id: string) => Promise<{
    recording: {
        id: string;
        tutorialId: string;
        partIndex: number;
        title: string;
        durationSec: number;
        eventCount: number;
        editor: string;
        isProcessed: boolean;
    };
    download: {
        strategy: string;
        chunkSizeBytes: number;
        totalChunks: number;
        baseUrl: string;
        manifestUrl: string;
    };
}>;
export declare const confirmRecordingUpload: (id: string, creatorId: string) => Promise<{
    recording: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        creatorId: string;
        partIndex: number;
        tutorialId: string;
        storageKey: string;
        storageBucket: string;
        sizeBytes: number;
        checksumSha256: string;
        compression: string;
        encoding: string;
        durationSec: number;
        eventCount: number;
        editor: string | null;
        terminalCols: number | null;
        terminalRows: number | null;
        isProcessed: boolean;
        processingError: string | null;
    };
    checkpointsGenerated: number;
}>;
export declare const getRecordingCheckpoints: (recordingId: string) => Promise<{
    id: string;
    createdAt: Date;
    description: string | null;
    tutorialId: string;
    recordingId: string;
    timestampMs: number;
    eventIndex: number;
    label: string;
    isAuto: boolean;
    stateSnapshot: string;
    fileSnapshotKey: string | null;
}[]>;
export declare const createCheckpoint: (recordingId: string, creatorId: string, input: CreateCheckpointInput) => Promise<{
    id: string;
    createdAt: Date;
    description: string | null;
    tutorialId: string;
    recordingId: string;
    timestampMs: number;
    eventIndex: number;
    label: string;
    isAuto: boolean;
    stateSnapshot: string;
    fileSnapshotKey: string | null;
}>;
export declare const getRecordingData: (id: string) => Promise<{
    id: string;
    data: Buffer<ArrayBuffer>;
    contentType: string;
    size: number;
}>;
//# sourceMappingURL=recordingService.d.ts.map