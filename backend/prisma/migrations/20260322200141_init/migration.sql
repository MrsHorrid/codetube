-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "is_creator" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "creator_slug" TEXT,
    "website_url" TEXT,
    "github_username" TEXT,
    "twitter_handle" TEXT,
    "subscriber_count" INTEGER NOT NULL DEFAULT 0,
    "tutorial_count" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutorials" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL,
    "framework" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "tags" TEXT NOT NULL DEFAULT '',
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "price_cents" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "fork_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION,
    "total_duration_sec" INTEGER,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tutorials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL,
    "tutorial_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "part_index" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "storage_key" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    "compression" TEXT NOT NULL DEFAULT 'gzip',
    "encoding" TEXT NOT NULL DEFAULT 'json',
    "duration_sec" INTEGER NOT NULL,
    "event_count" INTEGER NOT NULL,
    "editor" TEXT,
    "terminal_cols" INTEGER,
    "terminal_rows" INTEGER,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "tutorial_id" TEXT NOT NULL,
    "timestamp_ms" INTEGER NOT NULL,
    "event_index" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_auto" BOOLEAN NOT NULL DEFAULT false,
    "state_snapshot" TEXT NOT NULL DEFAULT '{}',
    "file_snapshot_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewer_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tutorial_id" TEXT NOT NULL,
    "recording_id" TEXT,
    "timestamp_ms" INTEGER NOT NULL DEFAULT 0,
    "event_index" INTEGER NOT NULL DEFAULT 0,
    "last_checkpoint_id" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "watch_time_sec" INTEGER NOT NULL DEFAULT 0,
    "playback_speed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewer_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewer_forks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tutorial_id" TEXT NOT NULL,
    "checkpoint_id" TEXT,
    "name" TEXT NOT NULL DEFAULT 'My Fork',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "storage_key" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "user_recording_key" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewer_forks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "tutorial_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'comment',
    "body" TEXT NOT NULL,
    "rating" INTEGER,
    "timestamp_ms" INTEGER,
    "recording_id" TEXT,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "subscriber_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "notify_new_tutorial" BOOLEAN NOT NULL DEFAULT true,
    "notify_comments" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutorial_likes" (
    "userId" TEXT NOT NULL,
    "tutorial_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutorial_likes_pkey" PRIMARY KEY ("userId","tutorial_id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "userId" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("userId","comment_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" SERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "tutorial_id" TEXT,
    "user_id" TEXT,
    "session_id" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_creator_slug_key" ON "users"("creator_slug");
CREATE UNIQUE INDEX "tutorials_slug_key" ON "tutorials"("slug");
CREATE UNIQUE INDEX "recordings_storage_key_key" ON "recordings"("storage_key");
CREATE UNIQUE INDEX "viewer_progress_user_id_tutorial_id_key" ON "viewer_progress"("user_id", "tutorial_id");
CREATE UNIQUE INDEX "viewer_forks_storage_key_key" ON "viewer_forks"("storage_key");
CREATE UNIQUE INDEX "viewer_forks_share_token_key" ON "viewer_forks"("share_token");
CREATE UNIQUE INDEX "subscriptions_subscriber_id_creator_id_key" ON "subscriptions"("subscriber_id", "creator_id");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_is_creator_idx" ON "users"("is_creator");
CREATE INDEX "tutorials_creator_id_idx" ON "tutorials"("creator_id");
CREATE INDEX "tutorials_language_idx" ON "tutorials"("language");
CREATE INDEX "tutorials_difficulty_idx" ON "tutorials"("difficulty");
CREATE INDEX "tutorials_status_idx" ON "tutorials"("status");
CREATE INDEX "tutorials_slug_idx" ON "tutorials"("slug");
CREATE INDEX "recordings_tutorial_id_part_index_idx" ON "recordings"("tutorial_id", "part_index");
CREATE INDEX "recordings_creator_id_idx" ON "recordings"("creator_id");
CREATE INDEX "checkpoints_recording_id_timestamp_ms_idx" ON "checkpoints"("recording_id", "timestamp_ms");
CREATE INDEX "checkpoints_tutorial_id_idx" ON "checkpoints"("tutorial_id");
CREATE INDEX "viewer_progress_user_id_idx" ON "viewer_progress"("user_id");
CREATE INDEX "viewer_progress_tutorial_id_idx" ON "viewer_progress"("tutorial_id");
CREATE INDEX "viewer_forks_user_id_idx" ON "viewer_forks"("user_id");
CREATE INDEX "viewer_forks_tutorial_id_idx" ON "viewer_forks"("tutorial_id");
CREATE INDEX "viewer_forks_share_token_idx" ON "viewer_forks"("share_token");
CREATE INDEX "comments_tutorial_id_created_at_idx" ON "comments"("tutorial_id", "created_at");
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");
CREATE INDEX "comments_tutorial_id_timestamp_ms_idx" ON "comments"("tutorial_id", "timestamp_ms");
CREATE INDEX "subscriptions_subscriber_id_idx" ON "subscriptions"("subscriber_id");
CREATE INDEX "subscriptions_creator_id_idx" ON "subscriptions"("creator_id");
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");
CREATE INDEX "analytics_events_tutorial_id_occurred_at_idx" ON "analytics_events"("tutorial_id", "occurred_at");
CREATE INDEX "analytics_events_event_type_occurred_at_idx" ON "analytics_events"("event_type", "occurred_at");

-- AddForeignKey
ALTER TABLE "tutorials" ADD CONSTRAINT "tutorials_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_tutorial_id_fkey" FOREIGN KEY ("tutorial_id") REFERENCES "tutorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_tutorial_id_fkey" FOREIGN KEY ("tutorial_id") REFERENCES "tutorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewer_progress" ADD CONSTRAINT "viewer_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewer_progress" ADD CONSTRAINT "viewer_progress_tutorial_id_fkey" FOREIGN KEY ("tutorial_id") REFERENCES "tutorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewer_progress" ADD CONSTRAINT "viewer_progress_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viewer_forks" ADD CONSTRAINT "viewer_forks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewer_forks" ADD CONSTRAINT "viewer_forks_tutorial_id_fkey" FOREIGN KEY ("tutorial_id") REFERENCES "tutorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewer_forks" ADD CONSTRAINT "viewer_forks_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_tutorial_id_fkey" FOREIGN KEY ("tutorial_id") REFERENCES "tutorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutorial_likes" ADD CONSTRAINT "tutorial_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tutorial_likes" ADD CONSTRAINT "tutorial_likes_tutorial_id_fkey" FOREIGN KEY ("tutorial_id") REFERENCES "tutorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
