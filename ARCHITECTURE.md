# CodeTube Technical Architecture Document

## Overview

CodeTube is a free YouTube-like platform for interactive coding tutorials where creators record coding sessions as keystrokes and cursor movements (not video), and viewers watch an interactive playback in a Monaco editor that they can pause and modify at any time.

---

## 1. System Architecture

### 1.1 High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CODETUBE PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                      │
│  │   Creator    │────▶│  Recording   │────▶│   Upload     │                      │
│  │   Client     │     │   Engine     │     │   Service    │                      │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                      │
│         │                                          │                             │
│         │         ┌────────────────────────────────┘                             │
│         │         │                                                              │
│         │    ┌────▼──────────────────┐                                          │
│         │    │     Object Storage    │  (S3/MinIO - Raw recordings)             │
│         │    └────┬──────────────────┘                                          │
│         │         │                                                              │
│         │    ┌────▼──────────────────┐                                          │
│         │    │   Recording Processor │  (Compression, indexing, validation)     │
│         │    └────┬──────────────────┘                                          │
│         │         │                                                              │
│         │    ┌────▼──────────────────┐                                          │
│         │    │   Metadata Database   │  (PostgreSQL - Tutorial metadata)        │
│         │    └───────────────────────┘                                          │
│         │                                                                       │
│         ▼                                                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                      │
│  │    Viewer    │◀────│   Playback   │◀────│   Stream     │                      │
│  │    Client    │     │    Engine    │     │   Service    │                      │
│  └──────────────┘     └──────────────┘     └──────────────┘                      │
│         │                                            ▲                          │
│         │         ┌──────────────────────────────────┘                          │
│         │         │                                                             │
│         │    ┌────▼──────────────────┐                                          │
│         └───▶│   State/Fork Store    │  (Redis + PostgreSQL - User states)      │
│              └───────────────────────┘                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Creator    │  │   Viewer    │  │   Admin Dashboard   │  │
│  │   Web App   │  │   Web App   │  │                     │  │
│  │  (React)    │  │  (React)    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      API GATEWAY LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Kong/     │  │   Rate      │  │   Auth Middleware   │  │
│  │   Nginx     │  │   Limiting  │  │   (JWT/OAuth)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Recording  │  │   Playback  │  │   User/Auth         │  │
│  │   Service   │  │   Service   │  │   Service           │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────┤  │
│  │  Upload     │  │   State     │  │   Analytics         │  │
│  │   Service   │  │   Service   │  │   Service           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Redis    │  │   Object Storage    │  │
│  │  (Primary)  │  │   (Cache)   │  │   (S3/MinIO)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Elasticsearch│  │   Kafka/    │  │   CDN               │  │
│  │   (Search)  │  │   RabbitMQ  │  │   (CloudFront)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Tech Stack Recommendations

#### Frontend
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React 18+ | Industry standard, excellent ecosystem |
| Editor | Monaco Editor | VS Code editor, native TypeScript support |
| State Management | Zustand + TanStack Query | Lightweight, excellent caching |
| UI Components | shadcn/ui + Radix | Accessible, customizable |
| Styling | Tailwind CSS | Utility-first, rapid development |
| Build Tool | Vite | Fast HMR, optimized builds |
| WebSocket | Socket.io | Real-time collaboration features |

#### Backend
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| API Framework | Node.js + Fastify | High performance, low overhead |
| Alternative | Go (Gin/Echo) | For high-throughput services |
| Authentication | Auth0/Clerk | Managed auth, social login support |
| Real-time | Socket.io Server | Bidirectional event-based |
| Message Queue | Redis/RabbitMQ | Async processing, job queues |

#### Database & Storage
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary DB | PostgreSQL 15+ | User data, metadata, relationships |
| Cache | Redis 7+ | Session state, real-time data |
| Search | Elasticsearch | Full-text search for tutorials |
| Object Storage | AWS S3 / MinIO | Recording files, assets |
| CDN | CloudFront/Cloudflare | Global content delivery |

#### Infrastructure
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container Orchestration | Kubernetes | Scalable deployment |
| API Gateway | Kong / Nginx | Routing, rate limiting |
| Monitoring | Prometheus + Grafana | Metrics and alerting |
| Logging | ELK Stack / Loki | Centralized logging |
| CI/CD | GitHub Actions | Automated deployment |

---

## 2. Recording System

### 2.1 Event Capture Architecture

The recording system captures granular editor events and compresses them efficiently for storage.

```
┌─────────────────────────────────────────────────────────────────┐
│                     RECORDING PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Monaco    │───▶│   Event     │───▶│   Event Buffer      │  │
│  │   Editor    │    │   Listeners │    │   (Ring Buffer)     │  │
│  │   Hooks     │    │             │    │                     │  │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘  │
│         │                                         │              │
│         │    Event Types:                         │              │
│         │    • keyboard (keystroke)               │              │
│         │    • cursor (position, selection)       │              │
│         │    • content (insert, delete, replace)  │              │
│         │    • file (open, close, switch)         │              │
│         │    • annotation (comments, highlights)  │              │
│         │                                         ▼              │
│         │                              ┌─────────────────────┐  │
│         │                              │   Diff Engine       │  │
│         │                              │   (Delta compression)│  │
│         │                              └──────────┬──────────┘  │
│         │                                         │              │
│         │                              ┌──────────▼──────────┐  │
│         └─────────────────────────────▶│   Recording Builder │  │
│                                        │   (Chunk assembly)  │  │
│                                        └──────────┬──────────┘  │
│                                                   │              │
│                                        ┌──────────▼──────────┐  │
│                                        │   Compression       │  │
│                                        │   (gzip/brotli)     │  │
│                                        └──────────┬──────────┘  │
│                                                   │              │
│                                        ┌──────────▼──────────┐  │
│                                        │   Upload Queue      │  │
│                                        │   (Background)      │  │
│                                        └─────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Event Types & Schema

#### Core Event Structure

```typescript
// Base event - all events extend this
interface BaseEvent {
  id: string;                    // Unique event ID (ULID)
  type: EventType;               // Event category
  timestamp: number;             // Milliseconds since recording start
  sessionId: string;             // Recording session identifier
}

enum EventType {
  KEYBOARD = 'kbd',              // Raw keystrokes
  CURSOR = 'cur',                // Cursor position/selection
  CONTENT = 'cnt',               // Content changes
  FILE = 'fil',                  // File operations
  ANNOTATION = 'ann',            // Instructor annotations
  SYSTEM = 'sys',                // System events (pauses, etc.)
}
```

#### Detailed Event Schemas

```typescript
// 1. Keyboard Event - Capture raw input
interface KeyboardEvent extends BaseEvent {
  type: EventType.KEYBOARD;
  key: string;                   // Key pressed (e.g., 'a', 'Enter', 'Backspace')
  code: string;                  // Physical key code (e.g., 'KeyA')
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
}

// 2. Cursor Event - Position and selection
interface CursorEvent extends BaseEvent {
  type: EventType.CURSOR;
  fileId: string;                // Which file
  position: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// 3. Content Event - Document changes (using operational transform)
interface ContentEvent extends BaseEvent {
  type: EventType.CONTENT;
  fileId: string;
  operation: 'insert' | 'delete' | 'replace';
  position: {
    line: number;
    column: number;
  };
  content?: string;              // For insert/replace
  length?: number;               // For delete (number of characters)
  checksum: string;              // Hash of resulting state (verify integrity)
}

// 4. File Event - File lifecycle
interface FileEvent extends BaseEvent {
  type: EventType.FILE;
  action: 'create' | 'open' | 'close' | 'delete' | 'rename' | 'switch';
  fileId: string;
  metadata?: {
    name: string;
    path: string;
    language: string;
    initialContent?: string;     // For create action
  };
}

// 5. Annotation Event - Instructor notes/highlights
interface AnnotationEvent extends BaseEvent {
  type: EventType.ANNOTATION;
  annotationType: 'highlight' | 'comment' | 'error' | 'warning' | 'tip';
  fileId: string;
  range: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  content: string;               // Annotation text
  style?: {
    color?: string;
    icon?: string;
  };
}

// 6. System Event - Control flow
interface SystemEvent extends BaseEvent {
  type: EventType.SYSTEM;
  action: 'pause' | 'resume' | 'checkpoint' | 'checkpoint-restore';
  data?: {
    checkpointId?: string;
    checkpointName?: string;
    duration?: number;           // Pause duration in ms
  };
}
```

### 2.3 Recording File Format

```typescript
// Main recording file structure
interface RecordingFile {
  // Header - metadata about the recording
  header: {
    version: string;             // Format version (e.g., "1.0.0")
    recordingId: string;         // Unique recording identifier
    createdAt: string;           // ISO 8601 timestamp
    creator: {
      userId: string;
      username: string;
    };
    tutorial: {
      title: string;
      description: string;
      language: string;          // Primary language
      tags: string[];
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedDuration: number; // In seconds
    };
    settings: {
      editorTheme: string;
      fontSize: number;
      tabSize: number;
    };
  };

  // Initial state - starting file tree
  initialState: {
    files: FileSnapshot[];
    activeFileId: string;
  };

  // Event stream - compressed chunks
  events: {
    totalCount: number;
    duration: number;            // Total recording duration (ms)
    chunks: EventChunk[];        // Compressed event chunks
  };

  // Checkpoints - recovery points
  checkpoints: Checkpoint[];

  // Index for seeking
  index: SeekIndex;
}

interface FileSnapshot {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;               // Full initial content
  checksum: string;
}

interface EventChunk {
  id: string;
  startTime: number;             // Relative to recording start
  endTime: number;
  eventCount: number;
  compression: 'gzip' | 'brotli' | 'none';
  size: number;                  // Compressed size in bytes
  data: string;                  // Base64-encoded compressed data
  checksum: string;
}

interface Checkpoint {
  id: string;
  name: string;
  timestamp: number;
  description?: string;
  fileStates: Map<string, string>; // fileId -> content hash
}

interface SeekIndex {
  // Time-based index for fast seeking
  timeIndex: Array<{
    timestamp: number;
    chunkId: string;
    offset: number;
  }>;
  
  // File change index
  fileIndex: Map<string, Array<{
    timestamp: number;
    chunkId: string;
  }>>;
}
```

### 2.4 Compression & Optimization Strategy

```typescript
// Recording compression pipeline
class RecordingCompressor {
  
  // 1. Delta Encoding - Only store changes
  compressEvents(events: BaseEvent[]): CompressedEvents {
    const deltas: DeltaEvent[] = [];
    let lastCursor: CursorEvent | null = null;
    
    for (const event of events) {
      switch (event.type) {
        case EventType.CURSOR:
          // Only store if position changed significantly
          if (this.shouldStoreCursor(lastCursor, event)) {
            deltas.push(this.createCursorDelta(lastCursor, event));
            lastCursor = event;
          }
          break;
          
        case EventType.CONTENT:
          // Use operational transform - store only the diff
          deltas.push(this.compressContentEvent(event));
          break;
          
        case EventType.KEYBOARD:
          // Aggregate rapid keystrokes into batches
          deltas.push(...this.batchKeystrokes(event));
          break;
          
        default:
          deltas.push(event as DeltaEvent);
      }
    }
    
    return { deltas, originalCount: events.length };
  }
  
  // 2. Intelligent sampling for cursor events
  private shouldStoreCursor(last: CursorEvent | null, current: CursorEvent): boolean {
    if (!last) return true;
    
    const timeDiff = current.timestamp - last.timestamp;
    const lineDiff = Math.abs(current.position.line - last.position.line);
    
    // Store if:
    // - More than 100ms passed
    // - Line changed
    // - Selection changed
    return timeDiff > 100 || lineDiff > 0 || 
           JSON.stringify(last.selection) !== JSON.stringify(current.selection);
  }
  
  // 3. Chunking strategy
  createChunks(events: DeltaEvent[], chunkSize: number = 500): EventChunk[] {
    const chunks: EventChunk[] = [];
    
    for (let i = 0; i < events.length; i += chunkSize) {
      const chunkEvents = events.slice(i, i + chunkSize);
      const jsonData = JSON.stringify(chunkEvents);
      const compressed = brotliCompress(jsonData);
      
      chunks.push({
        id: generateULID(),
        startTime: chunkEvents[0].timestamp,
        endTime: chunkEvents[chunkEvents.length - 1].timestamp,
        eventCount: chunkEvents.length,
        compression: 'brotli',
        size: compressed.length,
        data: base64Encode(compressed),
        checksum: hash(compressed),
      });
    }
    
    return chunks;
  }
}
```

### 2.5 Estimated Storage Sizes

| Scenario | Raw Events | Compressed | With Delta | Notes |
|----------|-----------|------------|------------|-------|
| 10 min typing | ~5 MB | ~800 KB | ~200 KB | Aggressive cursor sampling |
| 30 min tutorial | ~15 MB | ~2.4 MB | ~600 KB | Average coding speed |
| 1 hour tutorial | ~30 MB | ~4.8 MB | ~1.2 MB | With pauses and explanations |
| With checkpoints | +10% | +10% | +10% | Full state snapshots |

---

## 3. Playback Engine

### 3.1 Playback Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PLAYBACK ENGINE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Playback Controller                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │   State      │  │   Timing     │  │   Event Scheduler    │   │  │
│  │  │   Manager    │  │   Engine     │  │                      │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │  │
│  └────────┬─────────────────┬──────────────────┬────────────────────┘  │
│           │                 │                  │                        │
│           ▼                 ▼                  ▼                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Event Processors                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │  │
│  │  │ Keyboard │  │  Cursor  │  │ Content  │  │    File/Annotation│ │  │
│  │  │ Handler  │  │ Handler  │  │ Handler  │  │      Handler      │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────┬────────┘ │  │
│  └───────┼─────────────┼─────────────┼──────────────────┼──────────┘  │
│           │             │             │                  │             │
│           └─────────────┴─────────────┴──────────────────┘             │
│                                    │                                    │
│                                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Monaco Editor Adapter                        │  │
│  │                    (Virtual Document Model)                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Playback State Machine

```typescript
enum PlaybackState {
  IDLE = 'idle',           // No recording loaded
  LOADING = 'loading',     // Fetching recording data
  READY = 'ready',         // Ready to play
  PLAYING = 'playing',     // Actively replaying
  PAUSED = 'paused',       // Paused by user
  PAUSED_EDIT = 'paused_edit', // Paused, user editing
  SEEKING = 'seeking',     // Jumping to timestamp
  BUFFERING = 'buffering', // Loading more data
  ENDED = 'ended',         // Recording finished
}

interface PlaybackController {
  state: PlaybackState;
  currentTime: number;      // Current position in ms
  duration: number;         // Total duration in ms
  speed: number;            // Playback speed (0.5x - 3x)
  
  // Core controls
  play(): void;
  pause(): void;
  seek(timestamp: number): void;
  setSpeed(speed: number): void;
  
  // Branching controls
  startEditing(): void;     // User starts editing (creates branch)
  resetToInstructor(): void; // Discard changes, return to instructor state
  saveCheckpoint(name: string): void; // Save current state as checkpoint
}
```

### 3.3 Smooth Playback Implementation

```typescript
class PlaybackEngine {
  private eventQueue: PriorityQueue<ScheduledEvent>;
  private currentState: EditorState;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  
  // Main playback loop
  private playbackLoop = (timestamp: number): void => {
    if (this.state !== PlaybackState.PLAYING) return;
    
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Advance playback time
    this.currentTime += deltaTime * this.speed;
    
    // Process all events up to current time
    this.processPendingEvents();
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.playbackLoop);
  };
  
  private processPendingEvents(): void {
    while (!this.eventQueue.isEmpty()) {
      const nextEvent = this.eventQueue.peek();
      
      if (nextEvent.scheduledTime > this.currentTime) {
        break; // Not time yet
      }
      
      this.eventQueue.dequeue();
      this.executeEvent(nextEvent.event);
    }
    
    // Check if we've reached the end
    if (this.eventQueue.isEmpty() && this.currentTime >= this.duration) {
      this.transitionTo(PlaybackState.ENDED);
    }
  }
  
  private executeEvent(event: BaseEvent): void {
    switch (event.type) {
      case EventType.KEYBOARD:
        // Visual feedback only (keystroke sound, key highlight)
        this.ui.showKeystroke(event.key);
        break;
        
      case EventType.CURSOR:
        // Update cursor position with smooth animation
        this.editor.setCursorPosition(event.position, {
          animate: true,
          duration: 50, // Fast animation
        });
        if (event.selection) {
          this.editor.setSelection(event.selection);
        }
        break;
        
      case EventType.CONTENT:
        // Apply content change
        this.applyContentChange(event);
        break;
        
      case EventType.FILE:
        this.handleFileEvent(event);
        break;
        
      case EventType.ANNOTATION:
        this.ui.showAnnotation(event);
        break;
        
      case EventType.SYSTEM:
        this.handleSystemEvent(event);
        break;
    }
  }
  
  // Apply content changes with visual typing effect
  private applyContentChange(event: ContentEvent): void {
    const model = this.editor.getModel(event.fileId);
    
    switch (event.operation) {
      case 'insert':
        // Type character by character for visual effect
        this.typeCharacters(model, event.position, event.content!);
        break;
        
      case 'delete':
        model.deleteRange(event.position, event.length!);
        break;
        
      case 'replace':
        model.replaceRange(event.position, event.length!, event.content!);
        break;
    }
  }
  
  // Visual typing with proper timing
  private async typeCharacters(
    model: ITextModel, 
    position: Position, 
    content: string
  ): Promise<void> {
    // For single characters, insert immediately
    if (content.length === 1) {
      model.insertText(position, content);
      return;
    }
    
    // For longer insertions, chunk them visually
    const chunks = this.chunkContent(content);
    for (const chunk of chunks) {
      model.insertText(position, chunk);
      position = this.advancePosition(position, chunk);
      
      // Small delay for visual effect (unless at high speed)
      if (this.speed <= 2) {
        await sleep(5 / this.speed);
      }
    }
  }
}
```

### 3.4 Timing Control

```typescript
interface TimingControls {
  // Speed presets
  readonly SPEED_PRESETS = {
    SLOW: 0.5,
    NORMAL: 1.0,
    FAST: 1.5,
    VERY_FAST: 2.0,
    INSTANT: Infinity, // Skip animations
  };
  
  // Adaptive speed based on content
  getAdaptiveSpeed(event: BaseEvent): number {
    switch (event.type) {
      case EventType.KEYBOARD:
        return this.speed; // Normal speed for typing
        
      case EventType.CURSOR:
        // Speed up long cursor movements
        return this.speed * 2;
        
      case EventType.CONTENT:
        if (event.operation === 'replace' && event.length! > 100) {
          // Large paste operations - show instantly
          return Infinity;
        }
        return this.speed;
        
      case EventType.SYSTEM:
        if (event.action === 'pause') {
          // Respect instructor pauses
          return 0;
        }
        return this.speed;
        
      default:
        return this.speed;
    }
  }
  
  // Smart seek - jump to meaningful points
  seekToNextCheckpoint(): void {
    const nextCheckpoint = this.findNextCheckpoint(this.currentTime);
    if (nextCheckpoint) {
      this.seek(nextCheckpoint.timestamp);
    }
  }
  
  seekToPreviousCheckpoint(): void {
    const prevCheckpoint = this.findPreviousCheckpoint(this.currentTime);
    if (prevCheckpoint) {
      this.seek(prevCheckpoint.timestamp);
    }
  }
  
  // Frame-accurate seeking
  seekToTime(targetTime: number): void {
    // 1. Find the checkpoint before target time
    const checkpoint = this.findNearestCheckpoint(targetTime);
    
    // 2. Restore to checkpoint state
    this.restoreCheckpoint(checkpoint);
    
    // 3. Fast-forward events to target time
    this.fastForward(checkpoint.timestamp, targetTime);
    
    this.currentTime = targetTime;
  }
}
```

### 3.5 State Management on Interruption

```typescript
interface InterruptionHandler {
  // Called when user starts editing during playback
  handleUserInterruption(fileId: string, changes: TextChange[]): Branch {
    // 1. Pause playback
    this.pause();
    this.transitionTo(PlaybackState.PAUSED_EDIT);
    
    // 2. Create a new branch from current state
    const branch: Branch = {
      id: generateULID(),
      parentRecordingId: this.recording.id,
      forkedAt: this.currentTime,
      originalState: this.captureState(),
      userChanges: [],
      createdAt: Date.now(),
    };
    
    // 3. Start tracking user changes
    this.startTrackingChanges(branch);
    
    return branch;
  }
  
  // Track changes for potential save/restore
  private startTrackingChanges(branch: Branch): void {
    this.editor.onDidChangeModelContent((event) => {
      branch.userChanges.push({
        timestamp: Date.now(),
        changes: event.changes,
      });
    });
  }
  
  // Reset to instructor's state
  resetToInstructor(): void {
    // 1. Discard user changes
    this.discardBranchChanges();
    
    // 2. Restore to exact instructor state at current time
    const instructorState = this.calculateInstructorState(this.currentTime);
    this.editor.restoreState(instructorState);
    
    // 3. Resume playback capability
    this.transitionTo(PlaybackState.PAUSED);
  }
}
```

---

## 4. State Management

### 4.1 State Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Global State Store                          │   │
│  │                    (Zustand + Immer)                             │   │
│  │                                                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │   Auth      │  │   Playback  │  │      UI State           │  │   │
│  │  │   State     │  │   State     │  │                         │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                           │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Document State Manager                        │   │
│  │                                                                  │   │
│  │   ┌─────────────────────────────────────────────────────────┐   │   │
│  │   │              Recording State (Immutable)                 │   │   │
│  │   │  • Original instructor events                           │   │   │
│  │   │  • Computed states at each checkpoint                   │   │   │
│  │   │  • Read-only reference                                  │   │   │
│  │   └─────────────────────────────────────────────────────────┘   │   │
│  │                              │                                   │   │
│  │                              ▼                                   │   │
│  │   ┌─────────────────────────────────────────────────────────┐   │   │
│  │   │                Viewer State (Mutable)                    │   │   │
│  │   │  • Current edited content                               │   │   │
│  │   │  • User annotations                                     │   │   │
│  │   │  • Fork history                                         │   │   │
│  │   └─────────────────────────────────────────────────────────┘   │   │
│  │                              │                                   │   │
│  │                              ▼                                   │   │
│  │   ┌─────────────────────────────────────────────────────────┐   │   │
│  │   │              Merge/Conflict Resolution                   │   │   │
│  │   │  • Three-way merge (base + instructor + viewer)         │   │   │
│  │   │  • Diff visualization                                   │   │   │
│  │   │  • Selective apply/reject                               │   │   │
│  │   └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Persistence Layer                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │   Local     │  │   Server    │  │    Export/Import        │  │   │
│  │  │   Storage   │  │   Sync      │  │                         │  │   │
│  │  │  (IndexedDB)│  │  (REST/WS)  │  │    (JSON/Gist)          │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Branching System

```typescript
// Branch data model
interface Branch {
  id: string;                    // Unique branch ID
  recordingId: string;           // Original recording
  userId: string;                // Owner of this branch
  
  // Fork information
  forkedAt: number;              // Timestamp in recording when forked
  forkedFromCheckpoint?: string; // Checkpoint ID if forked at checkpoint
  
  // State management
  baseState: EditorSnapshot;     // State at fork point
  userChanges: UserChange[];     // Changes made by user
  checkpoints: UserCheckpoint[]; // User-created checkpoints
  
  // Metadata
  name: string;                  // User-given name
  description?: string;
  isPublic: boolean;             // Can others view this fork?
  createdAt: number;
  updatedAt: number;
}

interface EditorSnapshot {
  timestamp: number;             // Recording timestamp
  files: Map<string, FileState>; // fileId -> content + metadata
  activeFileId: string;
  cursorPosition: Position;
}

interface UserChange {
  id: string;
  timestamp: number;             // Real-world timestamp
  recordingTimestamp: number;    // Where in recording
  fileId: string;
  operation: TextOperation;
  applied: boolean;              // Is this change currently applied?
}

interface UserCheckpoint {
  id: string;
  name: string;
  recordingTimestamp: number;    // Associated recording position
  snapshot: EditorSnapshot;
  createdAt: number;
}
```

### 4.3 Reset to Instructor Flow

```typescript
class BranchManager {
  
  // Reset viewer to instructor state at current playback position
  async resetToInstructor(
    branchId: string, 
    options: ResetOptions = {}
  ): Promise<ResetResult> {
    const branch = await this.getBranch(branchId);
    const recording = await this.getRecording(branch.recordingId);
    
    // 1. Calculate instructor state at fork point
    const instructorState = await this.computeInstructorState(
      recording, 
      branch.forkedAt
    );
    
    // 2. Determine what to do with user changes
    if (options.preserveAsCheckpoint) {
      // Save current state as a checkpoint before resetting
      await this.createCheckpoint(branch, {
        name: `Before reset at ${formatTime(branch.forkedAt)}`,
        snapshot: this.captureCurrentState(),
      });
    }
    
    // 3. Replay instructor events from fork point to current time
    const currentInstructorState = await this.computeInstructorState(
      recording,
      this.playbackController.currentTime
    );
    
    // 4. Apply to editor
    await this.editor.restoreState(currentInstructorState);
    
    // 5. Clear user changes or mark as superseded
    if (options.discardChanges) {
      await this.discardUserChanges(branch);
    } else {
      await this.stashUserChanges(branch);
    }
    
    return {
      success: true,
      newState: currentInstructorState,
      discardedChanges: options.discardChanges ? branch.userChanges.length : 0,
    };
  }
  
  // Compute what the instructor's code looks like at a given timestamp
  private async computeInstructorState(
    recording: Recording,
    timestamp: number
  ): Promise<EditorSnapshot> {
    // 1. Find nearest checkpoint before timestamp
    const checkpoint = this.findNearestCheckpoint(recording, timestamp);
    
    // 2. Start with checkpoint state
    let state = await this.loadCheckpointState(checkpoint);
    
    // 3. Apply events from checkpoint to target timestamp
    const events = await this.getEventsInRange(
      recording, 
      checkpoint.timestamp, 
      timestamp
    );
    
    for (const event of events) {
      state = this.applyEventToState(state, event);
    }
    
    return state;
  }
}
```

### 4.4 Checkpoint System

```typescript
interface CheckpointManager {
  // Instructor-defined checkpoints (in recording)
  instructorCheckpoints: InstructorCheckpoint[];
  
  // User-defined checkpoints (in branches)
  userCheckpoints: UserCheckpoint[];
  
  // Auto-checkpoints (every N seconds or significant events)
  autoCheckpoints: AutoCheckpoint[];
}

interface CheckpointOperations {
  // Create a checkpoint at current position
  createCheckpoint(name: string, description?: string): Promise<Checkpoint>;
  
  // Navigate between checkpoints
  goToPreviousCheckpoint(): void;
  goToNextCheckpoint(): void;
  
  // Fork from a checkpoint (start editing from there)
  forkFromCheckpoint(checkpointId: string): Promise<Branch>;
  
  // Compare states between checkpoints
  compareCheckpoints(
    checkpointA: string, 
    checkpointB: string
  ): DiffResult;
}

// Checkpoint rendering in UI
interface CheckpointUI {
  // Timeline view with checkpoint markers
  renderCheckpointTimeline(): void;
  
  // Show checkpoint preview on hover
  showCheckpointPreview(checkpointId: string): void;
  
  // Quick-jump dialog
  showCheckpointNavigator(): void;
}
```

---

## 5. Database Schema

### 5.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐               │
│   │    users     │         │   creators   │         │  tutorials   │               │
│   ├──────────────┤         ├──────────────┤         ├──────────────┤               │
│   │ id (PK)      │◀───────│ user_id (PK) │◀────────│ creator_id   │               │
│   │ email        │         │ bio          │         │ id (PK)      │               │
│   │ username     │         │ avatar_url   │         │ title        │               │
│   │ display_name │         │ social_links │         │ description  │               │
│   │ avatar_url   │         │ verified     │         │ language     │               │
│   │ created_at   │         │ created_at   │         │ difficulty   │               │
│   └──────────────┘         └──────────────┘         │ tags[]       │               │
│          │                                          │ status       │               │
│          │                                          │ created_at   │               │
│          │                                          └──────┬───────┘               │
│          │                                                 │                        │
│          │                                                 │                        │
│          │                                          ┌──────▼───────┐               │
│          │                                          │  recordings  │               │
│          │                                          ├──────────────┤               │
│          │                                          │ id (PK)      │               │
│          │                                          │ tutorial_id  │               │
│          │                                          │ version      │               │
│          │                                          │ storage_key  │               │
│          │                                          │ metadata     │◀──────────────┤
│          │                                          │ duration     │               │
│          │                                          │ event_count  │               │
│          │                                          │ size_bytes   │               │
│          │                                          │ created_at   │               │
│          │                                          └──────┬───────┘               │
│          │                                                 │                        │
│          │                                                 │                        │
│          │                                          ┌──────▼───────┐               │
│          │                                          │ checkpoints  │               │
│          │                                          ├──────────────┤               │
│          │                                          │ id (PK)      │               │
│          │                                          │ recording_id │               │
│          │                                          │ name         │               │
│          │                                          │ timestamp    │               │
│          │                                          │ description  │               │
│          │                                          └──────────────┘               │
│          │                                                                         │
│          │         ┌──────────────┐         ┌──────────────┐                       │
│          └────────▶│   branches   │◀────────│  progress    │                       │
│                    ├──────────────┤         ├──────────────┤                       │
│                    │ id (PK)      │         │ id (PK)      │                       │
│                    │ user_id      │         │ user_id      │                       │
│                    │ recording_id │         │ recording_id │                       │
│                    │ forked_at    │         │ branch_id    │                       │
│                    │ name         │         │ position_ms  │                       │
│                    │ is_public    │         │ completed    │                       │
│                    │ state_json   │         │ last_accessed│                       │
│                    │ created_at   │         │ updated_at   │                       │
│                    └──────────────┘         └──────────────┘                       │
│                                                                                      │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐               │
│   │   comments   │         │    likes     │         │  analytics   │               │
│   ├──────────────┤         ├──────────────┤         ├──────────────┤               │
│   │ id (PK)      │         │ id (PK)      │         │ id (PK)      │               │
│   │ tutorial_id  │         │ tutorial_id  │         │ tutorial_id  │               │
│   │ user_id      │         │ user_id      │         │ date         │               │
│   │ content      │         │ created_at   │         │ views        │               │
│   │ timestamp_ms │         └──────────────┘         │ completions  │               │
│   │ created_at   │                                  │ avg_watch_time│              │
│   └──────────────┘                                  └──────────────┘               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 PostgreSQL Schema Definition

```sql
-- Users table (authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    password_hash VARCHAR(255), -- null for OAuth-only users
    email_verified BOOLEAN DEFAULT FALSE,
    auth_provider VARCHAR(20) DEFAULT 'email', -- email, google, github, etc.
    auth_provider_id VARCHAR(255), -- external ID from OAuth
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creators profile
CREATE TABLE creators (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url TEXT,
    website_url TEXT,
    github_url TEXT,
    twitter_url TEXT,
    youtube_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    subscriber_count INTEGER DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutorials
CREATE TABLE tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creators(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    language VARCHAR(50) NOT NULL, -- javascript, python, etc.
    difficulty difficulty_level DEFAULT 'beginner',
    tags TEXT[], -- Array of tags
    estimated_duration INTEGER, -- in seconds
    status tutorial_status DEFAULT 'draft',
    view_count BIGINT DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE tutorial_status AS ENUM ('draft', 'published', 'archived', 'deleted');

-- Recordings (versions of a tutorial)
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    storage_key TEXT NOT NULL, -- S3/MinIO path
    storage_size_bytes BIGINT NOT NULL,
    duration_ms INTEGER NOT NULL,
    event_count INTEGER NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}', -- Format version, settings, etc.
    checksum VARCHAR(64) NOT NULL, -- SHA-256 for integrity
    is_latest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tutorial_id, version)
);

-- Checkpoints within recordings
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    timestamp_ms INTEGER NOT NULL, -- Position in recording
    description TEXT,
    state_hash VARCHAR(64), -- Hash of code state at checkpoint
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User branches (forks)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    forked_at_ms INTEGER NOT NULL, -- Timestamp in recording where forked
    forked_from_checkpoint_id UUID REFERENCES checkpoints(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    state_json JSONB NOT NULL DEFAULT '{}', -- Serialized branch state
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recording_id, name)
);

-- User progress on tutorials
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    position_ms INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, recording_id)
);

-- User-created checkpoints in their branches
CREATE TABLE user_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    recording_timestamp_ms INTEGER NOT NULL,
    state_snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on tutorials
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
    content TEXT NOT NULL,
    timestamp_ms INTEGER, -- Optional: comment at specific point in video
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tutorial_id, user_id)
);

-- Analytics (daily aggregates)
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    total_watch_time_ms BIGINT DEFAULT 0,
    avg_watch_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tutorial_id, date)
);

-- Indexes for performance
CREATE INDEX idx_tutorials_creator ON tutorials(creator_id);
CREATE INDEX idx_tutorials_status ON tutorials(status) WHERE status = 'published';
CREATE INDEX idx_tutorials_language ON tutorials(language);
CREATE INDEX idx_tutorials_tags ON tutorials USING GIN(tags);
CREATE INDEX idx_recordings_tutorial ON recordings(tutorial_id);
CREATE INDEX idx_checkpoints_recording ON checkpoints(recording_id);
CREATE INDEX idx_branches_user ON branches(user_id);
CREATE INDEX idx_branches_recording ON branches(recording_id);
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_comments_tutorial ON comments(tutorial_id);
CREATE INDEX idx_analytics_tutorial_date ON analytics_daily(tutorial_id, date);
```

### 5.3 Redis Schema (Cache & Real-time)

```
# Session management
session:{sessionId} -> {
  userId: string,
  token: string,
  expiresAt: timestamp
}

# Active playback sessions (TTL: 1 hour)
playback:{userId}:{recordingId} -> {
  position: number,
  state: 'playing' | 'paused',
  branchId?: string,
  lastActivity: timestamp
}

# Recording metadata cache (TTL: 24 hours)
recording:meta:{recordingId} -> JSON

# Chunk cache for playback (TTL: 1 hour)
recording:chunk:{recordingId}:{chunkId} -> binary

# Real-time collaboration (if implemented)
collab:room:{roomId} -> Set of active user IDs
collab:cursor:{roomId}:{userId} -> { line, column, fileId }

# Rate limiting
ratelimit:upload:{userId} -> counter (TTL: 1 hour)
ratelimit:api:{userId} -> counter (TTL: 1 minute)

# Popular tutorials (for recommendations)
trending:tutorials -> Sorted Set (score = view count)
trending:{language} -> Sorted Set
```

---

## 6. API Design

### 6.1 API Overview

```
Base URL: https://api.codetube.io/v1

Authentication: JWT Bearer Token
  Authorization: Bearer <token>

Rate Limiting:
  - Authenticated: 1000 requests/hour
  - Upload: 10 uploads/hour
  - Playback: No limit (WebSocket)
```

### 6.2 Authentication Endpoints

```yaml
# Authentication
POST /auth/register
  Request:
    email: string
    username: string
    password: string
    displayName?: string
  Response:
    user: User
    token: string
    refreshToken: string

POST /auth/login
  Request:
    email: string
    password: string
  Response:
    user: User
    token: string
    refreshToken: string

POST /auth/oauth/{provider}
  Path: provider = google | github | discord
  Request:
    code: string  # OAuth authorization code
  Response:
    user: User
    token: string
    refreshToken: string

POST /auth/refresh
  Request:
    refreshToken: string
  Response:
    token: string
    refreshToken: string

POST /auth/logout
  Response: 204 No Content
```

### 6.3 Recording Endpoints

```yaml
# Recording Management
POST /recordings
  Description: Create a new recording entry (before upload)
  Request:
    tutorialId: string
    metadata:
      duration: number
      eventCount: number
      fileCount: number
      settings:
        theme: string
        fontSize: number
        tabSize: number
  Response:
    recordingId: string
    uploadUrl: string  # Presigned S3 URL
    chunks: 
      - chunkId: string
        uploadUrl: string

POST /recordings/{recordingId}/chunks/{chunkId}
  Description: Mark chunk as uploaded
  Request:
    etag: string  # S3 ETag for verification
    size: number
  Response:
    status: "uploaded" | "processing"

POST /recordings/{recordingId}/finalize
  Description: Finalize recording after all chunks uploaded
  Request:
    checksum: string
    checkpoints:
      - name: string
        timestamp: number
        description?: string
  Response:
    recording: Recording
    processingStatus: "queued" | "processing" | "complete"

GET /recordings/{recordingId}
  Response:
    id: string
    tutorialId: string
    version: number
    duration: number
    eventCount: number
    metadata: object
    chunks:
      - id: string
        startTime: number
        endTime: number
        downloadUrl: string
    checkpoints:
      - id: string
        name: string
        timestamp: number

DELETE /recordings/{recordingId}
  Auth: Creator only
  Response: 204 No Content
```

### 6.4 Playback Streaming Endpoints

```yaml
# Recording Stream
GET /recordings/{recordingId}/stream
  Description: Get streaming manifest for playback
  Response:
    format: "codetube-v1"
    header: 
      version: string
      recordingId: string
      duration: number
      initialState: object
    chunks:
      - id: string
        startTime: number
        endTime: number
        url: string
        compression: string
    checkpoints:
      - id: string
        name: string
        timestamp: number

GET /recordings/{recordingId}/chunks/{chunkId}
  Description: Download a specific chunk
  Response: binary (compressed event data)

GET /recordings/{recordingId}/state/{timestamp}
  Description: Get computed state at specific timestamp
  Response:
    timestamp: number
    files:
      - id: string
        name: string
        content: string
        language: string
    activeFileId: string
    cursorPosition: { line, column }

# WebSocket for real-time features
WS /ws/playback/{recordingId}
  Connection: JWT token in query param ?token=<jwt>
  
  Client -> Server:
    - { type: "join", branchId?: string }
    - { type: "heartbeat" }
    - { type: "seek", timestamp: number }
  
  Server -> Client:
    - { type: "state", playbackState, currentTime }
    - { type: "presence", users: [{ userId, cursor }] }  // Future: live collaboration
```

### 6.5 State Management Endpoints

```yaml
# Branches (User Forks)
POST /branches
  Description: Create a new branch from current playback position
  Request:
    recordingId: string
    forkedAt: number  # Timestamp in recording
    name: string
    description?: string
    isPublic: boolean
  Response:
    branch: Branch

GET /branches
  Query:
    recordingId?: string  # Filter by recording
    userId?: string       # Filter by user (public only unless self)
  Response:
    branches: Branch[]

GET /branches/{branchId}
  Response:
    id: string
    recordingId: string
    forkedAt: number
    name: string
    description: string
    isPublic: boolean
    state: object
    checkpoints: UserCheckpoint[]
    createdAt: string

PUT /branches/{branchId}
  Request:
    name?: string
    description?: string
    isPublic?: boolean
    state?: object  # Full state update
  Response:
    branch: Branch

POST /branches/{branchId}/checkpoints
  Request:
    name: string
    recordingTimestamp: number
    stateSnapshot: object
  Response:
    checkpoint: UserCheckpoint

POST /branches/{branchId}/reset
  Description: Reset branch to instructor state
  Request:
    targetTimestamp: number  # Where in recording to reset to
    preserveCurrent: boolean  # Save current as checkpoint first
  Response:
    success: boolean
    newState: object

DELETE /branches/{branchId}
  Response: 204 No Content
```

### 6.6 Tutorial Endpoints

```yaml
# Tutorials
GET /tutorials
  Query:
    page?: number (default: 1)
    limit?: number (default: 20, max: 100)
    language?: string
    difficulty?: beginner | intermediate | advanced
    tag?: string
    search?: string
    sort?: newest | popular | trending
    creatorId?: string
  Response:
    tutorials: Tutorial[]
    pagination:
      page: number
      limit: number
      total: number
      hasMore: boolean

POST /tutorials
  Auth: Creator only
  Request:
    title: string
    description: string
    language: string
    difficulty: string
    tags: string[]
    estimatedDuration: number
  Response:
    tutorial: Tutorial

GET /tutorials/{tutorialId}
  Response:
    id: string
    creator: Creator
    title: string
    description: string
    thumbnailUrl: string
    language: string
    difficulty: string
    tags: string[]
    estimatedDuration: number
    viewCount: number
    likeCount: number
    commentCount: number
    recordings: RecordingSummary[]
    publishedAt: string
    createdAt: string

PUT /tutorials/{tutorialId}
  Auth: Creator only
  Request:
    title?: string
    description?: string
    language?: string
    difficulty?: string
    tags?: string[]
    thumbnailUrl?: string
  Response:
    tutorial: Tutorial

DELETE /tutorials/{tutorialId}
  Auth: Creator only
  Response: 204 No Content

# Tutorial Interactions
POST /tutorials/{tutorialId}/like
  Response: { liked: boolean }

DELETE /tutorials/{tutorialId}/like
  Response: 204 No Content

POST /tutorials/{tutorialId}/comments
  Request:
    content: string
    timestampMs?: number  # Optional: comment at specific point
    parentId?: string     # For replies
  Response:
    comment: Comment

GET /tutorials/{tutorialId}/comments
  Query:
    page?: number
    limit?: number
  Response:
    comments: Comment[]
    pagination: object
```

### 6.7 Progress Endpoints

```yaml
# User Progress
GET /progress
  Description: Get all user progress
  Query:
    status?: in_progress | completed
    limit?: number
  Response:
    progress: ProgressEntry[]

GET /progress/{recordingId}
  Response:
    recordingId: string
    positionMs: number
    completed: boolean
    completionPercentage: number
    branchId?: string
    lastAccessedAt: string

PUT /progress/{recordingId}
  Request:
    positionMs?: number
    completed?: boolean
    completionPercentage?: number
    branchId?: string
  Response:
    progress: ProgressEntry

# Resume watching
GET /progress/resume
  Description: Get tutorials to resume watching
  Response:
    tutorials: 
      - tutorial: Tutorial
        progress: ProgressEntry
```

### 6.8 Error Responses

```yaml
# Standard Error Format
{
  error: {
    code: string          # Machine-readable error code
    message: string       # Human-readable message
    details?: object      # Additional context
  }
}

# Common Error Codes
400 Bad Request:
  - INVALID_REQUEST: Malformed request
  - VALIDATION_ERROR: Field validation failed
  - MISSING_FIELD: Required field missing

401 Unauthorized:
  - UNAUTHORIZED: Authentication required
  - TOKEN_EXPIRED: JWT token expired
  - INVALID_TOKEN: Invalid JWT token

403 Forbidden:
  - FORBIDDEN: Insufficient permissions
  - NOT_CREATOR: User is not the creator
  - PRIVATE_BRANCH: Cannot access private branch

404 Not Found:
  - USER_NOT_FOUND
  - TUTORIAL_NOT_FOUND
  - RECORDING_NOT_FOUND
  - BRANCH_NOT_FOUND

409 Conflict:
  - DUPLICATE_USERNAME
  - DUPLICATE_EMAIL
  - BRANCH_EXISTS: Branch with name already exists

429 Too Many Requests:
  - RATE_LIMIT_EXCEEDED
  - UPLOAD_LIMIT_EXCEEDED

500 Internal Server Error:
  - INTERNAL_ERROR
  - PROCESSING_ERROR
```

---

## 7. Additional Considerations

### 7.1 Security

```yaml
# Input Validation
- All user inputs sanitized before storage
- Content Security Policy (CSP) headers
- Monaco editor in sandboxed iframe for code execution

# Code Execution
- No server-side code execution from user recordings
- Optional: Client-side WebAssembly sandbox for running code
- Isolated origins for code preview

# File Upload
- Size limits: Max 50MB per recording
- MIME type validation
- Virus scanning for uploaded assets
- S3 bucket policies: Private, presigned URLs only

# Authentication
- JWT with short expiry (15 min)
- Refresh token rotation
- OAuth state parameter validation
- PKCE for OAuth flow
```

### 7.2 Performance Optimization

```yaml
# Frontend
- Virtual scrolling for long recordings
- Lazy loading of recording chunks
- Debounced cursor event handling
- Code splitting by route

# Backend
- CDN for static assets and recordings
- Chunked transfer encoding for playback
- Redis caching for hot tutorials
- Database connection pooling

# Recording Processing
- Async processing queue for compression
- Progressive chunk upload (resume support)
- Background checksum validation
```

### 7.3 Scalability

```yaml
# Horizontal Scaling
- Stateless API servers (Kubernetes)
- Read replicas for PostgreSQL
- Redis Cluster for session/cache
- S3 for infinite storage scaling

# Database Sharding Strategy
- Shard by user_id for progress/branches
- Tutorial data remains global
- Archive old recordings to cold storage

# CDN Strategy
- Recordings cached at edge locations
- Chunk-level caching for partial content
- Cache invalidation on new version upload
```

---

## 8. Implementation Phases

### Phase 1: MVP (Months 1-3)
- [ ] Basic recording capture (keyboard + content)
- [ ] Simple playback with Monaco
- [ ] User auth and tutorial CRUD
- [ ] Basic branching (local storage only)

### Phase 2: Core Features (Months 4-6)
- [ ] Cursor movement capture/playback
- [ ] Server-side storage and sync
- [ ] Checkpoint system
- [ ] "Reset to instructor" functionality

### Phase 3: Polish (Months 7-9)
- [ ] Advanced compression
- [ ] Real-time collaboration
- [ ] Mobile-responsive player
- [ ] Comment system

### Phase 4: Scale (Months 10-12)
- [ ] Performance optimizations
- [ ] Analytics dashboard
- [ ] Recommendation engine
- [ ] API for third-party integrations

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Recording | A complete coding session captured as events |
| Event | A single action (keystroke, cursor move, etc.) |
| Chunk | A compressed segment of events |
| Checkpoint | A saved state at a specific point in time |
| Branch | A user's fork of a recording with their changes |
| Playback | The act of replaying a recording |
| Seek | Jump to a specific timestamp |

## Appendix B: References

- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation)
- [Scrimba Architecture](https://scrimba.com) (inspiration)
- [CRDTs for Collaborative Editing](https://crdt.tech/)

---

*Document Version: 1.0*
*Last Updated: 2026-03-22*
*Status: Draft for Review*
