export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
  };
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  isCreator: boolean;
}

export interface WebSocketMessage {
  type: string;
  payload?: unknown;
}

// Enums (as const for type safety)
export const DifficultyLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

export const TutorialStatus = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const ForkStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const;

export const CommentType = {
  COMMENT: 'comment',
  REVIEW: 'review',
} as const;
