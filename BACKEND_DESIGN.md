# CodeTube — Backend Design
> Interactive Coding Tutorial Platform

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema (SQL DDL)](#database-schema)
3. [REST API Specification](#rest-api-specification)
4. [WebSocket Events](#websocket-events)
5. [Storage Strategy](#storage-strategy)
6. [Design Decisions](#design-decisions)

---

## Architecture Overview

```
┌──────────────┐     HTTP/WS      ┌──────────────────┐
│   Client     │ ◄─────────────► │   API Gateway     │
│  (Browser)   │                  │  (REST + WS)      │
└──────────────┘                  └────────┬─────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
           ┌────────▼──────┐    ┌──────────▼──────┐   ┌──────────▼──────┐
           │  Auth Service  │    │  Recording Store │   │  Blob Storage   │
           │  (JWT/OAuth)   │    │  (Chunked Data)  │   │  (S3/R2 CDN)    │
           └───────────────┘    └─────────────────┘   └─────────────────┘
                    │
           ┌────────▼──────┐
           │  PostgreSQL DB │
           │  (Main Store)  │
           └───────────────┘
```

**Tech stack assumptions:**
- PostgreSQL 15+ (main relational DB)
- Redis (sessions, playback sync pub/sub)
- S3-compatible object storage (compressed recording blobs)
- Node.js / Express or Fastify API server
- WebSocket via `ws` or Socket.IO

---

## Database Schema

### Extensions & Enums

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE tutorial_status  AS ENUM ('draft', 'processing', 'published', 'archived');
CREATE TYPE fork_status      AS ENUM ('active', 'archived');
CREATE TYPE comment_type     AS ENUM ('comment', 'review');
```

---

### 1. Users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT         NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    bio             TEXT,
    is_creator      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    is_admin        BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Creator-specific
    creator_slug    VARCHAR(50)  UNIQUE,           -- e.g. @theprimeagen
    website_url     TEXT,
    github_username VARCHAR(50),
    twitter_handle  VARCHAR(50),

    -- Stats (denormalized for perf)
    subscriber_count   INTEGER NOT NULL DEFAULT 0,
    tutorial_count     INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ           -- soft delete
);

CREATE INDEX idx_users_username   ON users(username);
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_creator    ON users(is_creator) WHERE is_creator = TRUE;
CREATE INDEX idx_users_deleted    ON users(deleted_at) WHERE deleted_at IS NULL;
```

---

### 2. Tutorials

```sql
CREATE TABLE tutorials (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content metadata
    title           VARCHAR(255)     NOT NULL,
    slug            VARCHAR(255)     NOT NULL UNIQUE,   -- URL-safe
    description     TEXT,
    language        VARCHAR(50)      NOT NULL,          -- e.g. 'rust', 'typescript'
    framework       VARCHAR(50),                        -- e.g. 'react', 'actix'
    difficulty      difficulty_level NOT NULL DEFAULT 'intermediate',
    tags            TEXT[]           NOT NULL DEFAULT '{}',
    thumbnail_url   TEXT,

    -- Status & visibility
    status          tutorial_status NOT NULL DEFAULT 'draft',
    is_free         BOOLEAN         NOT NULL DEFAULT TRUE,
    price_cents     INTEGER                  DEFAULT NULL,  -- if paid

    -- Stats (denormalized)
    view_count      BIGINT  NOT NULL DEFAULT 0,
    fork_count      INTEGER NOT NULL DEFAULT 0,
    like_count      INTEGER NOT NULL DEFAULT 0,
    comment_count   INTEGER NOT NULL DEFAULT 0,
    avg_rating      NUMERIC(3,2),                       -- 0.00–5.00

    -- Duration in seconds (sum of all recordings)
    total_duration_sec INTEGER,

    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tutorials_creator    ON tutorials(creator_id);
CREATE INDEX idx_tutorials_language   ON tutorials(language);
CREATE INDEX idx_tutorials_difficulty ON tutorials(difficulty);
CREATE INDEX idx_tutorials_status     ON tutorials(status);
CREATE INDEX idx_tutorials_tags       ON tutorials USING GIN(tags);
CREATE INDEX idx_tutorials_slug       ON tutorials(slug);
```

---

### 3. Recordings

> The core payload. Keystroke/editor-event data is compressed (e.g. gzipped JSON or custom binary) and stored in blob storage. The DB row stores metadata + a reference to the blob.

```sql
CREATE TABLE recordings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutorial_id     UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    creator_id      UUID NOT NULL REFERENCES users(id),

    -- Ordering within a tutorial (multi-part support)
    part_index      SMALLINT NOT NULL DEFAULT 0,
    title           VARCHAR(255),                      -- e.g. "Part 1: Setup"

    -- Blob reference
    storage_key     TEXT NOT NULL UNIQUE,              -- S3 object key
    storage_bucket  VARCHAR(100) NOT NULL,
    size_bytes      BIGINT NOT NULL,
    checksum_sha256 CHAR(64) NOT NULL,
    compression     VARCHAR(20) NOT NULL DEFAULT 'gzip', -- gzip | zstd | none
    encoding        VARCHAR(20) NOT NULL DEFAULT 'json',  -- json | msgpack | binary

    -- Playback metadata
    duration_sec    INTEGER NOT NULL,
    event_count     INTEGER NOT NULL,                  -- total keystroke events
    editor          VARCHAR(50),                       -- 'vscode', 'neovim', 'custom'
    terminal_cols   SMALLINT,
    terminal_rows   SMALLINT,

    -- Processing state
    is_processed    BOOLEAN NOT NULL DEFAULT FALSE,
    processing_error TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recordings_tutorial  ON recordings(tutorial_id, part_index);
CREATE INDEX idx_recordings_creator   ON recordings(creator_id);
```

---

### 4. Checkpoints

> Saved editor states at key moments (e.g. "after setting up project", "before the bug"). Allows viewers to jump to any point without replaying from the start.

```sql
CREATE TABLE checkpoints (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id    UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    tutorial_id     UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,

    -- Position in the recording
    timestamp_ms    INTEGER NOT NULL,              -- ms offset in the recording
    event_index     INTEGER NOT NULL,              -- index into event array

    label           VARCHAR(255) NOT NULL,         -- "Project initialized"
    description     TEXT,
    is_auto         BOOLEAN NOT NULL DEFAULT FALSE, -- system-generated vs. creator-set

    -- Snapshot of editor state at this point (lightweight JSON)
    -- Contains: open files, cursor positions, terminal state
    state_snapshot  JSONB NOT NULL DEFAULT '{}',

    -- Optional: full file tree diff from last checkpoint (for fork/resume)
    file_snapshot_key TEXT,                        -- S3 key if we store full files

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_recording ON checkpoints(recording_id, timestamp_ms);
CREATE INDEX idx_checkpoints_tutorial  ON checkpoints(tutorial_id);
```

---

### 5. ViewerProgress

> Tracks where each viewer left off (per tutorial, not per recording).

```sql
CREATE TABLE viewer_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutorial_id     UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,

    -- Last watched position
    recording_id    UUID REFERENCES recordings(id),
    timestamp_ms    INTEGER NOT NULL DEFAULT 0,
    event_index     INTEGER NOT NULL DEFAULT 0,
    last_checkpoint_id UUID REFERENCES checkpoints(id),

    -- Completion
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    watch_time_sec  INTEGER NOT NULL DEFAULT 0,    -- total watch time (for analytics)

    -- Playback preferences
    playback_speed  NUMERIC(3,1) NOT NULL DEFAULT 1.0,  -- 0.5x–4.0x

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, tutorial_id)
);

CREATE INDEX idx_viewer_progress_user     ON viewer_progress(user_id);
CREATE INDEX idx_viewer_progress_tutorial ON viewer_progress(tutorial_id);
```

---

### 6. ViewerForks

> When a viewer edits code during playback, we save their version. Forks are tied to a checkpoint (the state they branched from).

```sql
CREATE TABLE viewer_forks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutorial_id     UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    checkpoint_id   UUID REFERENCES checkpoints(id),

    -- Name / description
    name            VARCHAR(255) NOT NULL DEFAULT 'My Fork',
    notes           TEXT,
    status          fork_status NOT NULL DEFAULT 'active',

    -- The actual forked file state (stored in blob storage)
    storage_key     TEXT NOT NULL UNIQUE,           -- S3 key
    storage_bucket  VARCHAR(100) NOT NULL,
    size_bytes      BIGINT NOT NULL DEFAULT 0,

    -- Optional: user's own keystroke recording on top of fork
    user_recording_key TEXT,

    -- Sharing
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    share_token     VARCHAR(64) UNIQUE,             -- for shareable links

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_forks_user     ON viewer_forks(user_id);
CREATE INDEX idx_forks_tutorial ON viewer_forks(tutorial_id);
CREATE INDEX idx_forks_share    ON viewer_forks(share_token) WHERE share_token IS NOT NULL;
```

---

### 7. Comments & Reviews

```sql
CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutorial_id     UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,  -- threaded replies

    type            comment_type NOT NULL DEFAULT 'comment',
    body            TEXT NOT NULL,

    -- For reviews only
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),

    -- Timestamp anchor (link comment to a moment in the tutorial)
    timestamp_ms    INTEGER,                        -- NULL = general comment
    recording_id    UUID REFERENCES recordings(id),

    -- Moderation
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
    like_count      INTEGER NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_comments_tutorial  ON comments(tutorial_id, created_at DESC);
CREATE INDEX idx_comments_parent    ON comments(parent_id);
CREATE INDEX idx_comments_author    ON comments(author_id);
CREATE INDEX idx_comments_timestamp ON comments(tutorial_id, timestamp_ms) WHERE timestamp_ms IS NOT NULL;
```

---

### 8. Subscriptions

```sql
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    notify_new_tutorial BOOLEAN NOT NULL DEFAULT TRUE,
    notify_comments     BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(subscriber_id, creator_id),
    CHECK (subscriber_id <> creator_id)
);

CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator    ON subscriptions(creator_id);
```

---

### Supporting Tables

```sql
-- Tutorial likes (deduplicated)
CREATE TABLE tutorial_likes (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tutorial_id)
);

-- Comment likes
CREATE TABLE comment_likes (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id)
);

-- Notifications
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,       -- 'new_tutorial', 'new_comment', 'reply', 'like'
    payload     JSONB NOT NULL DEFAULT '{}',
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- Analytics events (append-only, time-series friendly)
CREATE TABLE analytics_events (
    id          BIGSERIAL PRIMARY KEY,
    event_type  VARCHAR(50) NOT NULL,      -- 'view', 'play', 'pause', 'fork', 'complete'
    tutorial_id UUID REFERENCES tutorials(id),
    user_id     UUID REFERENCES users(id), -- NULL = anonymous
    session_id  VARCHAR(64),
    payload     JSONB NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_tutorial ON analytics_events(tutorial_id, occurred_at DESC);
CREATE INDEX idx_analytics_type     ON analytics_events(event_type, occurred_at DESC);
```

---

## REST API Specification

### Base URL
```
https://api.codetube.io/api/v1
```

### Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### 🔐 Auth Endpoints

#### `POST /auth/register`
```json
// Request
{
  "username": "devshilat",
  "email": "shilat@example.com",
  "password": "strongpassword123",
  "display_name": "Shilat"
}

// Response 201
{
  "user": { "id": "uuid", "username": "devshilat", "email": "..." },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

#### `POST /auth/login`
```json
// Request
{ "email": "shilat@example.com", "password": "strongpassword123" }

// Response 200
{
  "user": { "id": "uuid", "username": "devshilat", "is_creator": false },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

#### `POST /auth/refresh`
```json
// Request
{ "refresh_token": "eyJ..." }
// Response 200
{ "access_token": "eyJ..." }
```

---

### 📹 Recording APIs

#### `POST /recordings` — Upload new recording
> Creator only. Returns a pre-signed upload URL for the blob.

```json
// Request (multipart/form-data OR JSON for metadata + presigned)
{
  "tutorial_id": "uuid",
  "part_index": 0,
  "title": "Part 1: Scaffolding",
  "duration_sec": 342,
  "event_count": 15820,
  "size_bytes": 284621,
  "checksum_sha256": "abc123...",
  "compression": "zstd",
  "encoding": "msgpack",
  "editor": "vscode",
  "terminal_cols": 220,
  "terminal_rows": 50
}

// Response 201
{
  "recording": {
    "id": "uuid",
    "tutorial_id": "uuid",
    "part_index": 0,
    "is_processed": false
  },
  "upload_url": "https://storage.codetube.io/presigned?token=...",  // PUT here
  "upload_expires_at": "2026-03-22T22:30:00Z"
}
```

After the client PUTs the blob to `upload_url`, it calls `POST /recordings/:id/confirm`.

#### `POST /recordings/:id/confirm` — Mark upload complete
```json
// Response 200
{
  "recording": { "id": "uuid", "is_processed": true },
  "checkpoints_generated": 5
}
```

---

#### `GET /recordings/:id` — Get recording metadata + download info

```json
// Response 200
{
  "recording": {
    "id": "uuid",
    "tutorial_id": "uuid",
    "part_index": 0,
    "title": "Part 1: Scaffolding",
    "duration_sec": 342,
    "event_count": 15820,
    "editor": "vscode"
  },
  "download": {
    "strategy": "chunked",          // "direct" | "chunked"
    "chunk_size_bytes": 131072,     // 128KB chunks
    "total_chunks": 3,
    "base_url": "https://cdn.codetube.io/recordings/uuid/",
    "manifest_url": "https://cdn.codetube.io/recordings/uuid/manifest.json"
  }
}
```

#### `GET /recordings/:id/stream` — Redirect to CDN or return signed URL
```
// Response 302 → CDN signed URL
// OR
// Response 200 with chunked transfer (for small recordings)
Content-Type: application/octet-stream
Transfer-Encoding: chunked
X-Recording-Duration: 342
X-Recording-Events: 15820
```

---

#### `GET /recordings/:id/checkpoints` — List checkpoints

```json
// Response 200
{
  "checkpoints": [
    {
      "id": "uuid",
      "timestamp_ms": 0,
      "event_index": 0,
      "label": "Start",
      "description": "Empty project directory",
      "is_auto": false
    },
    {
      "id": "uuid",
      "timestamp_ms": 45000,
      "event_index": 2340,
      "label": "npm init complete",
      "description": "Dependencies installed",
      "is_auto": false,
      "state_snapshot": {
        "open_files": ["package.json"],
        "cursor": { "file": "package.json", "line": 1, "col": 1 }
      }
    }
  ]
}
```

#### `POST /recordings/:id/checkpoints` — Creator adds checkpoint

```json
// Request
{
  "timestamp_ms": 45000,
  "event_index": 2340,
  "label": "npm init complete",
  "description": "All deps installed and ready",
  "state_snapshot": { "open_files": ["package.json"] }
}

// Response 201
{ "checkpoint": { "id": "uuid", ... } }
```

---

### 📚 Tutorial APIs

#### `POST /tutorials` — Create tutorial (draft)
```json
// Request
{
  "title": "Build a REST API in Rust",
  "description": "From zero to production-ready Axum API",
  "language": "rust",
  "framework": "axum",
  "difficulty": "intermediate",
  "tags": ["rust", "axum", "backend", "api"],
  "is_free": true
}

// Response 201
{ "tutorial": { "id": "uuid", "slug": "build-a-rest-api-in-rust", "status": "draft" } }
```

#### `PATCH /tutorials/:id` — Edit metadata
```json
// Request (partial update)
{ "title": "Build a Production REST API in Rust", "difficulty": "advanced" }
// Response 200
{ "tutorial": { ... } }
```

#### `POST /tutorials/:id/publish` — Publish tutorial
```json
// Response 200
{ "tutorial": { "id": "uuid", "status": "published", "published_at": "..." } }
```

#### `GET /tutorials` — Browse tutorials
```
GET /tutorials?language=rust&difficulty=intermediate&tag=axum&sort=popular&page=1&limit=20
```
```json
// Response 200
{
  "tutorials": [ { "id": "uuid", "title": "...", "creator": { ... }, "stats": { ... } } ],
  "pagination": { "page": 1, "limit": 20, "total": 143, "has_next": true }
}
```

#### `GET /tutorials/:id` — Full tutorial detail
```json
{
  "tutorial": {
    "id": "uuid",
    "title": "Build a REST API in Rust",
    "description": "...",
    "language": "rust",
    "difficulty": "intermediate",
    "tags": ["rust", "axum"],
    "total_duration_sec": 3420,
    "view_count": 15820,
    "avg_rating": 4.7,
    "status": "published"
  },
  "creator": {
    "id": "uuid",
    "username": "theprimeagen",
    "display_name": "ThePrimeagen",
    "avatar_url": "...",
    "subscriber_count": 48200
  },
  "recordings": [
    { "id": "uuid", "part_index": 0, "title": "Part 1", "duration_sec": 1140 },
    { "id": "uuid", "part_index": 1, "title": "Part 2", "duration_sec": 2280 }
  ],
  "viewer_progress": {          // null if not authenticated
    "timestamp_ms": 120000,
    "is_completed": false,
    "last_checkpoint_id": "uuid"
  }
}
```

---

### 👤 User / Progress APIs

#### `GET /me/progress` — All tutorials in progress
```json
{
  "progress": [
    {
      "tutorial": { "id": "uuid", "title": "...", "thumbnail_url": "..." },
      "recording_id": "uuid",
      "timestamp_ms": 120000,
      "is_completed": false,
      "updated_at": "2026-03-22T19:00:00Z"
    }
  ]
}
```

#### `PUT /tutorials/:id/progress` — Update progress (called during playback)
```json
// Request
{
  "recording_id": "uuid",
  "timestamp_ms": 135200,
  "event_index": 6734,
  "last_checkpoint_id": "uuid",
  "playback_speed": 1.5
}
// Response 200
{ "ok": true }
```

#### `POST /tutorials/:id/progress/complete` — Mark tutorial complete
```json
// Response 200
{ "completed_at": "2026-03-22T21:00:00Z", "watch_time_sec": 3420 }
```

---

### 🍴 Fork APIs

#### `POST /tutorials/:id/forks` — Create a fork (from a checkpoint)
```json
// Request
{
  "checkpoint_id": "uuid",       // branch point
  "name": "My experiment with error handling",
  "notes": "Trying a different approach"
}

// Response 201
{
  "fork": { "id": "uuid", "name": "...", "status": "active" },
  "upload_url": "https://storage.codetube.io/presigned?token=...",
  "upload_expires_at": "2026-03-22T22:30:00Z"
}
```

#### `GET /me/forks` — List my forks
```json
{
  "forks": [
    {
      "id": "uuid",
      "tutorial": { "id": "uuid", "title": "..." },
      "checkpoint": { "id": "uuid", "label": "npm init complete" },
      "name": "My experiment",
      "is_public": false,
      "created_at": "..."
    }
  ]
}
```

#### `GET /forks/:id` — Load a fork (get download URL)
```json
{
  "fork": { "id": "uuid", "name": "...", "is_public": false },
  "download_url": "https://cdn.codetube.io/forks/uuid?token=...",
  "expires_at": "2026-03-22T22:00:00Z"
}
```

#### `PATCH /forks/:id` — Update fork (rename, share toggle)
```json
// Request
{ "name": "Better error handling approach", "is_public": true }
// Response 200
{ "fork": { ..., "share_token": "tok_abc123", "share_url": "https://codetube.io/fork/tok_abc123" } }
```

---

### 💬 Comments APIs

#### `GET /tutorials/:id/comments`
```
GET /tutorials/:id/comments?sort=top&page=1&limit=20&timestamp_ms=45000
```
```json
{
  "comments": [
    {
      "id": "uuid",
      "author": { "username": "devshilat", "avatar_url": "..." },
      "body": "Great explanation of the borrow checker!",
      "type": "comment",
      "timestamp_ms": 45200,
      "like_count": 12,
      "reply_count": 3,
      "is_pinned": false,
      "created_at": "..."
    }
  ]
}
```

#### `POST /tutorials/:id/comments`
```json
// Request
{
  "body": "This is exactly what I needed!",
  "type": "comment",
  "timestamp_ms": 45200,
  "recording_id": "uuid",
  "parent_id": null
}
// Response 201
{ "comment": { "id": "uuid", ... } }
```

#### `POST /tutorials/:id/reviews`
```json
// Request
{ "rating": 5, "body": "Best Rust tutorial I've found. Very clear progression." }
// Response 201
{ "review": { "id": "uuid", "rating": 5, ... } }
```

---

### 👥 Subscriptions APIs

#### `POST /creators/:id/subscribe`
```json
// Response 201
{ "subscription": { "creator_id": "uuid", "notify_new_tutorial": true } }
```

#### `DELETE /creators/:id/subscribe`
```json
// Response 204 No Content
```

#### `GET /me/subscriptions`
```json
{
  "subscriptions": [
    {
      "creator": { "id": "uuid", "username": "theprimeagen", "tutorial_count": 24 },
      "notify_new_tutorial": true,
      "subscribed_at": "..."
    }
  ]
}
```

---

### 📊 Creator Analytics APIs

#### `GET /creator/analytics/overview`
```json
{
  "period": "30d",
  "total_views": 48200,
  "total_watch_time_sec": 5820400,
  "new_subscribers": 342,
  "total_subscribers": 15820,
  "top_tutorials": [
    { "id": "uuid", "title": "...", "views": 12400, "completions": 3210 }
  ]
}
```

#### `GET /creator/analytics/tutorials/:id`
```json
{
  "tutorial_id": "uuid",
  "period": "30d",
  "views": 3420,
  "unique_viewers": 2810,
  "completions": 890,
  "completion_rate": 0.317,
  "avg_watch_time_sec": 1840,
  "forks": 142,
  "ratings": { "avg": 4.7, "count": 234 },
  "drop_off_curve": [
    { "timestamp_ms": 0,     "viewer_pct": 1.0 },
    { "timestamp_ms": 60000, "viewer_pct": 0.91 },
    { "timestamp_ms": 120000,"viewer_pct": 0.82 }
  ],
  "checkpoint_reach_rates": [
    { "checkpoint_id": "uuid", "label": "npm init", "reach_pct": 0.78 }
  ]
}
```

---

## WebSocket Events

### Decision: Hybrid Approach
- **Chunked HTTP download** for the recording data itself (CDN-friendly, cacheable)
- **WebSocket** for live sync features: collaborative watching, timed comments, real-time playback state

### Connection
```
WS wss://api.codetube.io/ws
```

#### Handshake
```json
// Client → Server (after connect)
{ "type": "auth", "token": "eyJ..." }

// Server → Client
{ "type": "auth_ok", "user_id": "uuid", "session_id": "sess_abc123" }
```

---

### Playback Session Events

#### Join a tutorial playback session
```json
// Client → Server
{
  "type": "session.join",
  "tutorial_id": "uuid",
  "recording_id": "uuid"
}

// Server → Client
{
  "type": "session.joined",
  "session_id": "sess_uuid",
  "active_viewers": 42
}
```

#### Sync playback state (throttled, every 5s)
```json
// Client → Server
{
  "type": "playback.sync",
  "recording_id": "uuid",
  "timestamp_ms": 135200,
  "event_index": 6734,
  "action": "playing"   // "playing" | "paused" | "seeking"
}

// Server → Client (acknowledge + persist)
{ "type": "playback.synced", "timestamp_ms": 135200 }
```

#### Timed comment notification
```json
// Server → Client (broadcast to viewers at timestamp)
{
  "type": "comment.timed",
  "comment": {
    "id": "uuid",
    "body": "Notice the lifetime annotation here!",
    "author": { "username": "creator_user" },
    "timestamp_ms": 135200
  }
}
```

#### Live viewer count
```json
// Server → Client (periodic)
{
  "type": "session.viewers",
  "tutorial_id": "uuid",
  "count": 43
}
```

#### Error
```json
// Server → Client
{
  "type": "error",
  "code": "NOT_AUTHORIZED",
  "message": "This tutorial requires a subscription."
}
```

### Leave session
```json
// Client → Server
{ "type": "session.leave", "tutorial_id": "uuid" }
```

---

## Storage Strategy

### Recording Blob Format
```
recordings/{tutorial_id}/{recording_id}.bin.zst

Content: zstd-compressed MessagePack array of events

Event schema (per item):
{
  "t":  <uint32>,   // timestamp offset in ms from recording start
  "k":  <uint8>,    // event kind: 0=keystroke, 1=file_open, 2=cursor, 3=terminal, 4=paste
  "d":  <any>       // event-specific data (e.g. key char, file path, cursor pos)
}
```

### Chunked Delivery Manifest
```json
// https://cdn.codetube.io/recordings/{id}/manifest.json
{
  "recording_id": "uuid",
  "total_events": 15820,
  "duration_ms": 342000,
  "chunks": [
    { "index": 0, "start_event": 0,     "end_event": 5273,  "start_ms": 0,      "end_ms": 114000, "url": "..." },
    { "index": 1, "start_event": 5274,  "end_event": 10546, "start_ms": 114000, "end_ms": 228000, "url": "..." },
    { "index": 2, "start_event": 10547, "end_event": 15820, "start_ms": 228000, "end_ms": 342000, "url": "..." }
  ]
}
```

**Why chunked?**
- Viewers seeking to checkpoint 2 only need to download chunk 1+
- CDN caches chunks individually
- Client can buffer ahead (preload next chunk while playing current)
- Reduces time-to-first-frame significantly vs. full download

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Playback delivery | Chunked HTTP + manifest | CDN-cacheable, supports seeking, no server load during playback |
| WebSocket use | Live sync only (not data) | Avoid overloading WS with bulk data; use it for events/state |
| Recording format | zstd + MessagePack | 3-5x better compression vs gzip+JSON; faster encode/decode |
| Progress persistence | DB + WS sync every 5s | Balance between freshness and write load |
| Fork storage | S3 blob per fork | File trees can be large; don't pollute DB rows |
| Soft deletes | `deleted_at` on users/tutorials/comments | Enables undo, audit trails, and GDPR compliance |
| Denormalized counts | `subscriber_count`, `view_count` etc. | Avoid expensive COUNT() on hot paths; update via triggers or background jobs |
| Analytics events | Append-only table | Optimized for time-series queries; can migrate to ClickHouse at scale |

---

*Generated for CodeTube — v1.0 — 2026-03-22*
