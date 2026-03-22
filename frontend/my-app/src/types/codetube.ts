// types/codetube.ts

// Position in the editor
export interface CursorPosition {
  line: number;
  column: number;
  isPlayback?: boolean;
}

// Text edit operation
export interface TextEdit {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
}

// Single edit operation from user or playback
export interface EditOperation {
  changes: Array<{
    range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
    text: string;
    rangeOffset: number;
    rangeLength: number;
  }>;
  timestamp: number;
}

// Checkpoint in the recording
export interface Checkpoint {
  id: string;
  timestamp: number;
  label: string;
  description?: string;
  codeSnapshot: string;
  cursorPosition: CursorPosition;
}

// Playback event
export interface PlaybackEvent {
  timestamp: number;
  type: 'insert' | 'delete' | 'cursor' | 'selection' | 'scroll';
  data: Record<string, any>;
}

// Recording metadata and events
export interface Recording {
  id: string;
  title: string;
  description?: string;
  language: string;
  initialCode: string;
  finalCode: string;
  duration: number;
  events: PlaybackEvent[];
  checkpoints: Checkpoint[];
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Viewer (user) state
export interface ViewerState {
  code: string;
  cursorPosition: CursorPosition;
  edits: EditOperation[];
  lastModified: number;
  isDirty: boolean;
}

// Instructor state (original recording)
export interface InstructorState {
  currentCode: string;
  cursorPosition: CursorPosition;
  currentEventIndex: number;
}

// Playback state
export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  totalDuration: number;
  speed: number;
  loop: boolean;
  currentEventIndex: number;
}

// Combined state for the session
export interface CodeTubeSession {
  recording: Recording;
  instructorState: InstructorState;
  viewerState: ViewerState;
  playback: PlaybackState;
  mode: 'following' | 'exploring' | 'editing';
}

// User interaction event
export interface UserInteractionEvent {
  type: 'focus' | 'blur' | 'edit' | 'cursor_move' | 'scroll';
  timestamp: number;
  data?: Record<string, any>;
}

// User types
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  stats: {
    learners: number;
    tutorials: number;
    forks: number;
    streak: number;
  };
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

// Tutorial types
export type TutorialDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TutorialStatus = 'draft' | 'published' | 'archived';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: TutorialDifficulty;
  duration: number;
  status: TutorialStatus;
  thumbnail?: string;
  tags: string[];
  creator: User;
  recording?: Recording;
  stats: {
    views: number;
    likes: number;
    forks: number;
    rating: number;
    ratingCount: number;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Progress types
export interface TutorialProgress {
  id: string;
  tutorialId: string;
  userId: string;
  progress: number;
  currentTime: number;
  completedAt?: string;
  startedAt: string;
  lastWatchedAt: string;
}

// Fork types
export interface Fork {
  id: string;
  originalTutorialId: string;
  forkedBy: User;
  title: string;
  description?: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  tutorialCount: number;
}

// Comment types
export interface Comment {
  id: string;
  tutorialId: string;
  userId: string;
  user: User;
  content: string;
  timestamp?: number;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'join' | 'leave' | 'cursor' | 'edit' | 'chat' | 'presence';
  payload: Record<string, any>;
  timestamp: number;
  userId: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
