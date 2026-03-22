import prisma from '../models/prisma';

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

export const createRecording = async (creatorId: string, input: CreateRecordingInput) => {
  // Verify tutorial exists and belongs to creator
  const tutorial = await prisma.tutorial.findFirst({
    where: { id: input.tutorialId, creatorId },
  });

  if (!tutorial) {
    throw new Error('Tutorial not found or unauthorized');
  }

  // Generate storage key
  const storageKey = `recordings/${input.tutorialId}/${Date.now()}.bin.${input.compression || 'gzip'}`;

  const recording = await prisma.recording.create({
    data: {
      tutorialId: input.tutorialId,
      creatorId,
      partIndex: input.partIndex || 0,
      title: input.title,
      storageKey,
      storageBucket: 'codetube',
      sizeBytes: input.sizeBytes,
      checksumSha256: input.checksumSha256,
      compression: input.compression || 'gzip',
      encoding: input.encoding || 'json',
      durationSec: input.durationSec,
      eventCount: input.eventCount,
      editor: input.editor,
      terminalCols: input.terminalCols,
      terminalRows: input.terminalRows,
      isProcessed: false,
    },
  });

  // Update tutorial duration
  const recordings = await prisma.recording.findMany({
    where: { tutorialId: input.tutorialId },
    select: { durationSec: true },
  });
  
  const totalDuration = recordings.reduce((sum, r) => sum + r.durationSec, 0) + input.durationSec;
  
  await prisma.tutorial.update({
    where: { id: input.tutorialId },
    data: { totalDurationSec: totalDuration },
  });

  return {
    recording,
    uploadUrl: `/api/recordings/${recording.id}/upload`, // Mock URL
    uploadExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
  };
};

export const getRecordingById = async (id: string) => {
  const recording = await prisma.recording.findUnique({
    where: { id },
    include: {
      tutorial: {
        select: {
          id: true,
          title: true,
          slug: true,
          creatorId: true,
        },
      },
    },
  });

  if (!recording) return null;

  return {
    recording: {
      id: recording.id,
      tutorialId: recording.tutorialId,
      partIndex: recording.partIndex,
      title: recording.title,
      durationSec: recording.durationSec,
      eventCount: recording.eventCount,
      editor: recording.editor,
      isProcessed: recording.isProcessed,
    },
    download: {
      strategy: 'chunked',
      chunkSizeBytes: 131072,
      totalChunks: Math.ceil(recording.sizeBytes / 131072),
      baseUrl: `/api/recordings/${id}/chunks/`,
      manifestUrl: `/api/recordings/${id}/manifest.json`,
    },
  };
};

export const confirmRecordingUpload = async (id: string, creatorId: string) => {
  const recording = await prisma.recording.findFirst({
    where: { id, creatorId },
  });

  if (!recording) {
    throw new Error('Recording not found or unauthorized');
  }

  // Generate some mock checkpoints
  const checkpoints = await generateCheckpoints(id, recording.tutorialId);

  const updated = await prisma.recording.update({
    where: { id },
    data: { isProcessed: true },
  });

  return {
    recording: updated,
    checkpointsGenerated: checkpoints.length,
  };
};

export const getRecordingCheckpoints = async (recordingId: string) => {
  return await prisma.checkpoint.findMany({
    where: { recordingId },
    orderBy: { timestampMs: 'asc' },
  });
};

export const createCheckpoint = async (
  recordingId: string,
  creatorId: string,
  input: CreateCheckpointInput
) => {
  const recording = await prisma.recording.findFirst({
    where: { id: recordingId, creatorId },
  });

  if (!recording) {
    throw new Error('Recording not found or unauthorized');
  }

  return await prisma.checkpoint.create({
    data: {
      recordingId,
      tutorialId: recording.tutorialId,
      timestampMs: input.timestampMs,
      eventIndex: input.eventIndex,
      label: input.label,
      description: input.description,
      stateSnapshot: JSON.stringify(input.stateSnapshot || {}),
      isAuto: false,
    },
  });
};

export const getRecordingData = async (id: string) => {
  const recording = await prisma.recording.findUnique({
    where: { id },
  });

  if (!recording) {
    throw new Error('Recording not found');
  }

  // Increment view count on the tutorial
  await prisma.tutorial.update({
    where: { id: recording.tutorialId },
    data: { viewCount: { increment: 1 } },
  });

  // Return mock data (in real app, this would stream from storage)
  return {
    id: recording.id,
    data: Buffer.from(JSON.stringify({ events: [], duration: recording.durationSec })),
    contentType: 'application/octet-stream',
    size: recording.sizeBytes,
  };
};

// Helper to generate mock checkpoints
const generateCheckpoints = async (recordingId: string, tutorialId: string) => {
  const checkpoints = [
    { timestampMs: 0, eventIndex: 0, label: 'Start', description: 'Beginning of the tutorial' },
    { timestampMs: 30000, eventIndex: 100, label: 'Setup Complete', description: 'Project initialized' },
    { timestampMs: 120000, eventIndex: 500, label: 'Core Logic', description: 'Main implementation' },
  ];

  const created = [];
  for (const cp of checkpoints) {
    const checkpoint = await prisma.checkpoint.create({
      data: {
        recordingId,
        tutorialId,
        timestampMs: cp.timestampMs,
        eventIndex: cp.eventIndex,
        label: cp.label,
        description: cp.description,
        stateSnapshot: '{}',
        isAuto: true,
      },
    });
    created.push(checkpoint);
  }

  return created;
};
