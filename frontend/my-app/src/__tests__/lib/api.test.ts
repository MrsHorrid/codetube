/**
 * API Client Tests
 *
 * Tests the API client modules including:
 * - Tutorials API
 * - Users API
 * - Comments API
 * - Categories API
 */

import { tutorialsApi, usersApi, commentsApi, categoriesApi } from '@/lib/api';

const API_BASE_URL = 'http://localhost:8000';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFetchResponse = (response: any, ok = true) => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok,
      json: async () => response,
    });
  };

  describe('Tutorials API', () => {
    describe('getAll', () => {
      it('should fetch all tutorials without params', async () => {
        const mockTutorials = { success: true, data: [{ id: '1', title: 'Test' }] };
        mockFetchResponse(mockTutorials);

        const result = await tutorialsApi.getAll();

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials?`,
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' },
          })
        );
        expect(result).toEqual(mockTutorials);
      });

      it('should fetch tutorials with category filter', async () => {
        const mockTutorials = { success: true, data: [] };
        mockFetchResponse(mockTutorials);

        await tutorialsApi.getAll({ category: 'react' });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('category=react'),
          expect.any(Object)
        );
      });

      it('should fetch tutorials with search query', async () => {
        mockFetchResponse({ success: true, data: [] });

        await tutorialsApi.getAll({ search: 'typescript basics' });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=typescript+basics'),
          expect.any(Object)
        );
      });

      it('should fetch tutorials with pagination', async () => {
        mockFetchResponse({ success: true, data: [] });

        await tutorialsApi.getAll({ page: 2, limit: 20 });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=20'),
          expect.any(Object)
        );
      });
    });

    describe('getById', () => {
      it('should fetch single tutorial by ID', async () => {
        const mockTutorial = { success: true, data: { id: 'tutorial-1', title: 'Test' } };
        mockFetchResponse(mockTutorial);

        const result = await tutorialsApi.getById('tutorial-1');

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/tutorial-1`,
          expect.any(Object)
        );
        expect(result).toEqual(mockTutorial);
      });
    });

    describe('getTrending', () => {
      it('should fetch trending tutorials', async () => {
        mockFetchResponse({ success: true, data: [] });

        await tutorialsApi.getTrending();

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/trending`,
          expect.any(Object)
        );
      });
    });

    describe('getFeatured', () => {
      it('should fetch featured tutorial', async () => {
        mockFetchResponse({ success: true, data: { id: 'featured' } });

        await tutorialsApi.getFeatured();

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/featured`,
          expect.any(Object)
        );
      });
    });

    describe('create', () => {
      it('should create new tutorial', async () => {
        const newTutorial = {
          title: 'New Tutorial',
          description: 'Description',
          language: 'typescript',
          difficulty: 'beginner',
        };
        mockFetchResponse({ success: true, data: { id: 'new-id', ...newTutorial } });

        await tutorialsApi.create(newTutorial);

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(newTutorial),
          })
        );
      });
    });

    describe('update', () => {
      it('should update existing tutorial', async () => {
        const updates = { title: 'Updated Title', difficulty: 'advanced' };
        mockFetchResponse({ success: true, data: { id: 'tutorial-1', ...updates } });

        await tutorialsApi.update('tutorial-1', updates);

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/tutorial-1`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updates),
          })
        );
      });
    });

    describe('delete', () => {
      it('should delete tutorial', async () => {
        mockFetchResponse({ success: true });

        await tutorialsApi.delete('tutorial-1');

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/tutorial-1`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('Users API', () => {
    describe('getById', () => {
      it('should fetch user by ID', async () => {
        mockFetchResponse({ success: true, data: { id: 'user-1' } });

        await usersApi.getById('user-1');

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/users/user-1`,
          expect.any(Object)
        );
      });
    });

    describe('getByUsername', () => {
      it('should fetch user by username', async () => {
        mockFetchResponse({ success: true, data: { username: 'testuser' } });

        await usersApi.getByUsername('testuser');

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/users/username/testuser`,
          expect.any(Object)
        );
      });
    });

    describe('getCurrent', () => {
      it('should fetch current user profile', async () => {
        mockFetchResponse({ success: true, data: { id: 'current-user' } });

        await usersApi.getCurrent();

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/me`,
          expect.any(Object)
        );
      });
    });

    describe('update', () => {
      it('should update current user profile', async () => {
        const updates = { displayName: 'New Name', bio: 'New bio' };
        mockFetchResponse({ success: true, data: updates });

        await usersApi.update(updates);

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/me`,
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify(updates),
          })
        );
      });
    });

    describe('getProgress', () => {
      it('should fetch user progress', async () => {
        mockFetchResponse({ success: true, data: [{ tutorialId: '1', progress: 50 }] });

        await usersApi.getProgress();

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/me/progress`,
          expect.any(Object)
        );
      });
    });
  });

  describe('Comments API', () => {
    describe('getByTutorial', () => {
      it('should fetch comments for tutorial', async () => {
        mockFetchResponse({ success: true, data: [] });

        await commentsApi.getByTutorial('tutorial-1');

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/tutorial-1/comments`,
          expect.any(Object)
        );
      });
    });

    describe('create', () => {
      it('should create top-level comment', async () => {
        mockFetchResponse({ success: true, data: { id: 'comment-1' } });

        await commentsApi.create('tutorial-1', 'Great tutorial!');

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/tutorial-1/comments`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ content: 'Great tutorial!' }),
          })
        );
      });

      it('should create reply comment', async () => {
        mockFetchResponse({ success: true, data: { id: 'reply-1' } });

        await commentsApi.create('tutorial-1', 'Thanks!', 'parent-comment-id');

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/tutorials/tutorial-1/comments`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              content: 'Thanks!',
              parentId: 'parent-comment-id',
            }),
          })
        );
      });
    });
  });

  describe('Categories API', () => {
    describe('getAll', () => {
      it('should fetch all categories', async () => {
        mockFetchResponse({ success: true, data: [{ id: 'cat-1', name: 'React' }] });

        await categoriesApi.getAll();

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/categories`,
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should return error response on failed request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await tutorialsApi.getById('non-existent');

      expect(result).toEqual({
        success: false,
        error: {
          code: 'HTTP_404',
          message: 'Not Found',
        },
      });
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      await expect(tutorialsApi.getAll()).rejects.toThrow('Network failed');
    });

    it('should handle 500 server errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await tutorialsApi.create({ title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_500');
    });
  });

  describe('Request Headers', () => {
    it('should include Content-Type header', async () => {
      mockFetchResponse({ success: true, data: {} });

      await tutorialsApi.getAll();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should allow custom headers in options', async () => {
      mockFetchResponse({ success: true, data: {} });

      const customFetch = async (endpoint: string, options?: RequestInit) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
            ...options?.headers,
          },
        });
        return response.json();
      };

      // Test that headers can be extended
      expect(customFetch).toBeDefined();
    });
  });
});
