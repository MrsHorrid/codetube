import request from 'supertest';
import app from '../app';

describe('Progress and Fork Endpoints', () => {
  let accessToken: string;
  let tutorialId: string;
  let recordingId: string;
  let checkpointId: string;

  const testUser = {
    username: 'progressuser',
    email: 'progress@example.com',
    password: 'password123',
  };

  const testTutorial = {
    title: 'Progress Test Tutorial',
    description: 'Testing progress tracking',
    language: 'python',
    difficulty: 'beginner',
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

    // Create recording
    const recordingRes = await request(app)
      .post('/api/recordings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tutorialId,
        durationSec: 600,
        eventCount: 2000,
        sizeBytes: 2048000,
        checksumSha256: 'b'.repeat(64),
        title: 'Test Recording',
      });
    
    recordingId = recordingRes.body.data.recording.id;

    // Confirm upload to generate checkpoints
    await request(app)
      .post(`/api/recordings/${recordingId}/confirm`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Get checkpoint
    const checkpointsRes = await request(app)
      .get(`/api/recordings/${recordingId}/checkpoints`);
    
    checkpointId = checkpointsRes.body.data.checkpoints[0]?.id;
  });

  describe('PUT /api/tutorials/:id/progress', () => {
    it('should update progress', async () => {
      const res = await request(app)
        .put(`/api/tutorials/${tutorialId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          recordingId,
          timestampMs: 30000,
          eventIndex: 100,
          playbackSpeed: 1.5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress.tutorialId).toBe(tutorialId);
      expect(res.body.data.progress.timestampMs).toBe(30000);
      expect(res.body.data.progress.playbackSpeed).toBe(1.5);
    });

    it('should update progress with checkpoint', async () => {
      const res = await request(app)
        .put(`/api/tutorials/${tutorialId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          recordingId,
          timestampMs: 60000,
          eventIndex: 200,
          lastCheckpointId: checkpointId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress.lastCheckpointId).toBe(checkpointId);
    });
  });

  describe('POST /api/tutorials/:id/progress/complete', () => {
    it('should mark tutorial as complete', async () => {
      const res = await request(app)
        .post(`/api/tutorials/${tutorialId}/progress/complete`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completedAt).toBeDefined();
      expect(res.body.data.watchTimeSec).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/me/progress', () => {
    it('should get user progress', async () => {
      const res = await request(app)
        .get('/api/me/progress')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.progress)).toBe(true);
      expect(res.body.data.progress.length).toBeGreaterThan(0);
      expect(res.body.data.progress[0]).toHaveProperty('tutorial');
      expect(res.body.data.progress[0]).toHaveProperty('timestampMs');
    });
  });

  describe('POST /api/tutorials/:id/forks', () => {
    it('should create a fork', async () => {
      const res = await request(app)
        .post(`/api/tutorials/${tutorialId}/forks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checkpointId,
          name: 'My Test Fork',
          notes: 'Testing fork creation',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fork).toHaveProperty('id');
      expect(res.body.data.fork.name).toBe('My Test Fork');
      expect(res.body.data.fork.status).toBe('active');
      expect(res.body.data).toHaveProperty('uploadUrl');
    });

    it('should create fork without checkpoint', async () => {
      const res = await request(app)
        .post(`/api/tutorials/${tutorialId}/forks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Another Fork',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fork.name).toBe('Another Fork');
    });
  });

  describe('GET /api/me/forks', () => {
    it('should get user forks', async () => {
      const res = await request(app)
        .get('/api/me/forks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.forks)).toBe(true);
      expect(res.body.data.forks.length).toBeGreaterThan(0);
      expect(res.body.data.forks[0]).toHaveProperty('tutorial');
      expect(res.body.data.forks[0]).toHaveProperty('checkpoint');
    });
  });
});
