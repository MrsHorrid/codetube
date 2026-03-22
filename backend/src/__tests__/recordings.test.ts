import request from 'supertest';
import app from '../app';

describe('Recording Endpoints', () => {
  let accessToken: string;
  let tutorialId: string;
  let recordingId: string;

  const testUser = {
    username: 'recorduser',
    email: 'record@example.com',
    password: 'password123',
  };

  const testTutorial = {
    title: 'Recording Test Tutorial',
    description: 'Testing recordings',
    language: 'rust',
    difficulty: 'intermediate',
  };

  const testRecording = {
    durationSec: 300,
    eventCount: 1000,
    sizeBytes: 1024000,
    checksumSha256: 'a'.repeat(64),
    compression: 'gzip',
    encoding: 'json',
    editor: 'vscode',
    terminalCols: 120,
    terminalRows: 30,
  };

  beforeAll(async () => {
    // Register and login
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    accessToken = registerRes.body.data.accessToken;

    // Create tutorial
    const tutorialRes = await request(app)
      .post('/api/tutorials')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testTutorial);
    
    tutorialId = tutorialRes.body.data.tutorial.id;
  });

  describe('POST /api/recordings', () => {
    it('should create a new recording', async () => {
      const res = await request(app)
        .post('/api/recordings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testRecording,
          tutorialId,
          title: 'Part 1: Introduction',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recording).toHaveProperty('id');
      expect(res.body.data.recording.tutorialId).toBe(tutorialId);
      expect(res.body.data).toHaveProperty('uploadUrl');
      expect(res.body.data).toHaveProperty('uploadExpiresAt');
      recordingId = res.body.data.recording.id;
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/recordings')
        .send({
          ...testRecording,
          tutorialId,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail for non-existent tutorial', async () => {
      const res = await request(app)
        .post('/api/recordings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testRecording,
          tutorialId: '00000000-0000-0000-0000-000000000000',
        });

      // Returns 400 because UUID validation fails or 404 if UUID passes but tutorial not found
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/recordings/:id', () => {
    it('should get recording metadata', async () => {
      const res = await request(app)
        .get(`/api/recordings/${recordingId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recording.id).toBe(recordingId);
      expect(res.body.data).toHaveProperty('download');
      expect(res.body.data.download).toHaveProperty('strategy');
      expect(res.body.data.download).toHaveProperty('manifestUrl');
    });

    it('should return 404 for non-existent recording', async () => {
      const res = await request(app)
        .get('/api/recordings/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/recordings/:id/confirm', () => {
    it('should confirm recording upload', async () => {
      const res = await request(app)
        .post(`/api/recordings/${recordingId}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recording.isProcessed).toBe(true);
      expect(res.body.data.checkpointsGenerated).toBeGreaterThan(0);
    });
  });

  describe('GET /api/recordings/:id/stream', () => {
    it('should stream recording data', async () => {
      const res = await request(app)
        .get(`/api/recordings/${recordingId}/stream`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/octet-stream');
    });
  });

  describe('GET /api/recordings/:id/checkpoints', () => {
    it('should list recording checkpoints', async () => {
      const res = await request(app)
        .get(`/api/recordings/${recordingId}/checkpoints`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.checkpoints)).toBe(true);
      expect(res.body.data.checkpoints.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/recordings/:id/checkpoints', () => {
    it('should create a checkpoint', async () => {
      const res = await request(app)
        .post(`/api/recordings/${recordingId}/checkpoints`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          timestampMs: 15000,
          eventIndex: 100,
          label: 'Custom Checkpoint',
          description: 'A custom checkpoint created during testing',
          stateSnapshot: { openFiles: ['test.ts'] },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.checkpoint.label).toBe('Custom Checkpoint');
      expect(res.body.data.checkpoint.isAuto).toBe(false);
    });
  });
});
