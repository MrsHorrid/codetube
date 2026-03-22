import request from 'supertest';
import app from '../app';

describe('Tutorial Endpoints', () => {
  let accessToken: string;
  let userId: string;
  let tutorialId: string;

  const testUser = {
    username: 'tutoruser',
    email: 'tutor@example.com',
    password: 'password123',
  };

  const testTutorial = {
    title: 'Test Tutorial',
    description: 'A test tutorial',
    language: 'typescript',
    framework: 'react',
    difficulty: 'beginner',
    tags: ['react', 'typescript'],
    isFree: true,
  };

  beforeAll(async () => {
    // Register and login
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    accessToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  describe('POST /api/tutorials', () => {
    it('should create a new tutorial', async () => {
      const res = await request(app)
        .post('/api/tutorials')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testTutorial);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tutorial).toHaveProperty('id');
      expect(res.body.data.tutorial.title).toBe(testTutorial.title);
      expect(res.body.data.tutorial.language).toBe(testTutorial.language);
      expect(res.body.data.tutorial.status).toBe('draft');
      tutorialId = res.body.data.tutorial.id;
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/tutorials')
        .send(testTutorial);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/tutorials')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '', // Empty title
          language: 'typescript',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/tutorials', () => {
    it('should list tutorials', async () => {
      const res = await request(app)
        .get('/api/tutorials');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should filter by language', async () => {
      const res = await request(app)
        .get('/api/tutorials?language=typescript');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tutorials/:id', () => {
    it('should get tutorial by ID', async () => {
      const res = await request(app)
        .get(`/api/tutorials/${tutorialId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(tutorialId);
      expect(res.body.data).toHaveProperty('creator');
      expect(res.body.data).toHaveProperty('recordings');
    });

    it('should return 404 for non-existent tutorial', async () => {
      const res = await request(app)
        .get('/api/tutorials/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/tutorials/:id', () => {
    it('should update tutorial', async () => {
      const res = await request(app)
        .patch(`/api/tutorials/${tutorialId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Title',
          difficulty: 'intermediate',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tutorial.title).toBe('Updated Title');
      expect(res.body.data.tutorial.difficulty).toBe('intermediate');
    });
  });

  describe('POST /api/tutorials/:id/publish', () => {
    it('should publish tutorial', async () => {
      const res = await request(app)
        .post(`/api/tutorials/${tutorialId}/publish`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tutorial.status).toBe('published');
      expect(res.body.data.tutorial.publishedAt).toBeDefined();
    });
  });
});
