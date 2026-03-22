// lib/api.ts
import { type ApiResponse, type Tutorial, type User, type Comment, type Category } from '@/types/codetube';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    return {
      success: false,
      error: {
        code: `HTTP_${response.status}`,
        message: response.statusText,
      },
    };
  }

  return response.json();
}

// Tutorials API
export const tutorialsApi = {
  getAll: (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    return fetchApi<Tutorial[]>(`/api/tutorials?${queryParams.toString()}`);
  },
  
  getById: (id: string) => fetchApi<Tutorial>(`/api/tutorials/${id}`),
  
  getTrending: () => fetchApi<Tutorial[]>('/api/tutorials/trending'),
  
  getFeatured: () => fetchApi<Tutorial>('/api/tutorials/featured'),
  
  getByUser: (userId: string) => fetchApi<Tutorial[]>(`/api/users/${userId}/tutorials`),
  
  create: (data: Partial<Tutorial>) => 
    fetchApi<Tutorial>('/api/tutorials', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id: string, data: Partial<Tutorial>) => 
    fetchApi<Tutorial>(`/api/tutorials/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  
  delete: (id: string) => 
    fetchApi<void>(`/api/tutorials/${id}`, { method: 'DELETE' }),
};

// Users API
export const usersApi = {
  getById: (id: string) => fetchApi<User>(`/api/users/${id}`),
  
  getByUsername: (username: string) => fetchApi<User>(`/api/users/username/${username}`),
  
  getCurrent: () => fetchApi<User>('/api/me'),
  
  update: (data: Partial<User>) => 
    fetchApi<User>('/api/me', { method: 'PATCH', body: JSON.stringify(data) }),
  
  getProgress: () => fetchApi<{ tutorialId: string; progress: number }[]>('/api/me/progress'),
};

// Comments API
export const commentsApi = {
  getByTutorial: (tutorialId: string) => 
    fetchApi<Comment[]>(`/api/tutorials/${tutorialId}/comments`),
  
  create: (tutorialId: string, content: string, parentId?: string) => 
    fetchApi<Comment>(`/api/tutorials/${tutorialId}/comments`, { 
      method: 'POST', 
      body: JSON.stringify({ content, parentId }) 
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () => fetchApi<Category[]>('/api/categories'),
};
