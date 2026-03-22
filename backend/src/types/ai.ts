// ─────────────────────────────────────────────────────────────
// AI Generation Types for CodeTube
// ─────────────────────────────────────────────────────────────

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type VoicePersona =
  | 'chill'
  | 'energetic'
  | 'british'
  | 'sarcastic-australian'
  | 'calm-mentor'
  | 'enthusiastic-teacher'
  | 'no-nonsense';

// ─── Curriculum ──────────────────────────────────────────────

export interface CurriculumLesson {
  index: number;
  title: string;
  objective: string;
  concepts: string[];
  prerequisites: string[];
  estimatedDurationSec: number;
  difficulty: SkillLevel;
  type: 'theory' | 'hands-on' | 'challenge' | 'review';
}

export interface Curriculum {
  topic: string;
  level: SkillLevel;
  title: string;
  description: string;
  totalLessons: number;
  estimatedTotalDurationSec: number;
  prerequisites: string[];
  outcomes: string[];
  lessons: CurriculumLesson[];
}

// ─── Lesson Content ──────────────────────────────────────────

export interface CodeExample {
  filename: string;
  language: string;
  code: string;
  explanation: string;
}

export interface ExercisePrompt {
  title: string;
  description: string;
  starterCode?: string;
  hints: string[];
  solution?: string;
}

export interface NarrationSegment {
  text: string;
  startTimestampMs: number;
  endTimestampMs: number;
}

// Recording event types (extending existing format)
export type RecordingEventType =
  | 'TYPE'
  | 'CURSOR'
  | 'SELECT'
  | 'SCROLL'
  | 'TERMINAL'
  | 'CHECKPOINT'
  | 'AUDIO';

export interface RecordingEvent {
  type: RecordingEventType;
  timestamp: number; // ms
  data: Record<string, unknown>;
}

export interface AudioEvent extends RecordingEvent {
  type: 'AUDIO';
  data: {
    url: string;
    text: string;
    persona: VoicePersona;
    durationMs: number;
  };
}

export interface CheckpointEvent extends RecordingEvent {
  type: 'CHECKPOINT';
  data: {
    label: string;
    description: string;
    exercisePrompt?: ExercisePrompt;
  };
}

export interface GeneratedLesson {
  lessonIndex: number;
  title: string;
  objective: string;
  codeExamples: CodeExample[];
  narrationSegments: NarrationSegment[];
  checkpoints: Array<{ timestampMs: number; label: string; description: string; exercisePrompt?: ExercisePrompt }>;
  exercises: ExercisePrompt[];
  recordingEvents: RecordingEvent[];
  durationSec: number;
}

// ─── Generation Job ──────────────────────────────────────────

export type JobStatus = 'queued' | 'generating-curriculum' | 'generating-lessons' | 'synthesizing-audio' | 'assembling' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  courseId: string;
  topic: string;
  level: SkillLevel;
  voice: VoicePersona;
  status: JobStatus;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  curriculum?: Curriculum;
  lessons?: GeneratedLesson[];
}

// ─── API Request/Response ────────────────────────────────────

export interface GenerateCourseRequest {
  topic: string;
  level: SkillLevel;
  voice: VoicePersona;
  maxLessons?: number; // default 8
  userId?: string;
}

export interface GenerateCourseResponse {
  courseId: string;
  jobId: string;
  estimatedTime: string; // human-readable e.g. "3-5 minutes"
  status: JobStatus;
  lessons: Array<{ index: number; title: string; estimatedDurationSec: number }>;
}

export interface JobStatusResponse {
  jobId: string;
  courseId: string;
  status: JobStatus;
  progress: number;
  topic: string;
  level: SkillLevel;
  voice: VoicePersona;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  curriculum?: Curriculum;
}

// ─── Personalization ─────────────────────────────────────────

export interface LearnerProfile {
  userId: string;
  knownConcepts: string[];
  struggleConcepts: string[];
  completedLessons: string[]; // lessonId
  averageTimePerLesson: number; // seconds
  preferredLevel: SkillLevel;
  preferredVoice: VoicePersona;
}

export interface PersonalizationRecommendation {
  type: 'skip' | 'remedial' | 'advance' | 'review';
  lessonIndex: number;
  reason: string;
  suggestedLesson?: Partial<CurriculumLesson>;
}
