/**
 * Auth Store Tests
 *
 * Tests Zustand auth store including:
 * - Authentication state management
 * - Login/logout flow
 * - User data persistence
 * - Loading states
 */

import { act } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/codetube';

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (config: any) => (set: any, get: any, api: any) => config(set, get, api),
}));

const mockUser: User = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.png',
  bio: 'Test bio',
  location: 'Test City',
  website: 'https://example.com',
  joinedAt: '2024-01-01T00:00:00Z',
  stats: {
    learners: 100,
    tutorials: 5,
    forks: 10,
    streak: 7,
  },
  social: {
    github: 'testuser',
    twitter: '@testuser',
    linkedin: 'testuser',
  },
};

describe('Auth Store', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should set user and update authentication status', () => {
      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear user and set unauthenticated when null', () => {
      // First set a user
      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      // Then clear
      act(() => {
        useAuthStore.getState().setUser(null);
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should authenticate user and set loading to false', () => {
      act(() => {
        useAuthStore.getState().login(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should replace existing user data on login', () => {
      const anotherUser: User = {
        ...mockUser,
        id: 'user-2',
        username: 'anotheruser',
        email: 'another@example.com',
      };

      act(() => {
        useAuthStore.getState().login(mockUser);
        useAuthStore.getState().login(anotherUser);
      });

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user-2');
      expect(state.user?.username).toBe('anotheruser');
    });
  });

  describe('logout', () => {
    it('should clear user and set unauthenticated', () => {
      // First login
      act(() => {
        useAuthStore.getState().login(mockUser);
      });

      // Then logout
      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should handle logout when already logged out', () => {
      // Should not throw
      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      act(() => {
        useAuthStore.getState().setLoading(false);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);

      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      expect(useAuthStore.getState().isLoading).toBe(true);
    });

    it('should not affect other state', () => {
      act(() => {
        useAuthStore.getState().login(mockUser);
      });

      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('Authentication Flow', () => {
    it('should handle complete login/logout cycle', () => {
      const store = useAuthStore.getState();

      // Initial state
      expect(store.isAuthenticated).toBe(false);

      // Login
      act(() => {
        store.login(mockUser);
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Logout
      act(() => {
        useAuthStore.getState().logout();
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should handle session restoration', () => {
      // Simulate restoring session
      act(() => {
        useAuthStore.getState().setUser(mockUser);
        useAuthStore.getState().setLoading(false);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('User Data Access', () => {
    beforeEach(() => {
      act(() => {
        useAuthStore.getState().login(mockUser);
      });
    });

    it('should provide access to user stats', () => {
      const { user } = useAuthStore.getState();
      expect(user?.stats).toEqual({
        learners: 100,
        tutorials: 5,
        forks: 10,
        streak: 7,
      });
    });

    it('should provide access to social links', () => {
      const { user } = useAuthStore.getState();
      expect(user?.social).toEqual({
        github: 'testuser',
        twitter: '@testuser',
        linkedin: 'testuser',
      });
    });

    it('should provide access to profile data', () => {
      const { user } = useAuthStore.getState();
      expect(user?.bio).toBe('Test bio');
      expect(user?.location).toBe('Test City');
      expect(user?.website).toBe('https://example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with minimal data', () => {
      const minimalUser: User = {
        id: 'minimal-user',
        username: 'minimal',
        displayName: 'Minimal User',
        email: 'minimal@example.com',
        joinedAt: new Date().toISOString(),
        stats: {
          learners: 0,
          tutorials: 0,
          forks: 0,
          streak: 0,
        },
      };

      act(() => {
        useAuthStore.getState().login(minimalUser);
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.bio).toBeUndefined();
      expect(state.user?.social).toBeUndefined();
    });

    it('should handle rapid login/logout cycles', () => {
      const store = useAuthStore.getState();

      act(() => {
        store.login(mockUser);
        store.logout();
        store.login(mockUser);
        store.logout();
        store.login(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('should handle setting user while loading', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setUser(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(true); // Loading state unchanged
    });
  });
});
