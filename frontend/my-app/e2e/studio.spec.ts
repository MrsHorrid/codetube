import { test, expect } from '@playwright/test';

/**
 * Studio and Recording E2E Tests
 *
 * Tests content creation flows:
 * 1. Recording capture
 * 2. Tutorial creation
 * 3. Checkpoint management
 * 4. Publishing workflow
 */

test.describe('Studio - Content Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('input[name="email"]', 'creator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  test.describe('Recording Studio', () => {
    test('should start recording session', async ({ page }) => {
      await page.goto('/studio');

      // Create new recording
      await page.click('text=New Recording');

      // Configure recording settings
      await page.fill('input[name="title"]', 'React Hooks Tutorial');
      await page.selectOption('select[name="language"]', 'typescript');
      await page.fill('textarea[name="description"]', 'Learn React Hooks from scratch');

      // Start recording
      await page.click('[data-testid="start-recording-button"]');

      // Recording indicator should be visible
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="recording-timer"]')).toBeVisible();
    });

    test('should capture typing events during recording', async ({ page }) => {
      await page.goto('/studio/recording-session');

      // Start recording
      await page.click('[data-testid="start-recording-button"]');

      // Type in editor
      const editor = page.locator('[data-testid="recording-editor"]');
      await editor.fill('const [count, setCount] = useState(0);');

      // Events should be captured
      await expect(page.locator('[data-testid="event-count"]')).toContainText('events captured');

      // Pause recording
      await page.click('[data-testid="pause-recording-button"]');
      await expect(page.locator('[data-testid="recording-paused"]')).toBeVisible();
    });

    test('should create checkpoints during recording', async ({ page }) => {
      await page.goto('/studio/recording-session');

      // Start recording
      await page.click('[data-testid="start-recording-button"]');

      // Type some code
      await page.fill('[data-testid="recording-editor"]', 'function App() {');

      // Create checkpoint
      await page.click('[data-testid="add-checkpoint-button"]');
      await page.fill('input[name="checkpointLabel"]', 'Initial Setup');
      await page.click('button:text("Save Checkpoint")');

      // Checkpoint should appear in list
      await expect(page.locator('[data-testid="checkpoint-item"]:has-text("Initial Setup")')).toBeVisible();

      // Continue typing
      await page.fill('[data-testid="recording-editor"]', 'function App() {\n  return \u003cdiv\u003eHello\u003c/div\u003e;\n}');

      // Add another checkpoint
      await page.click('[data-testid="add-checkpoint-button"]');
      await page.fill('input[name="checkpointLabel"]', 'Component Complete');
      await page.click('button:text("Save Checkpoint")');

      // Both checkpoints should be visible
      await expect(page.locator('[data-testid="checkpoint-item"]')).toHaveCount(2);
    });

    test('should stop and save recording', async ({ page }) => {
      await page.goto('/studio/recording-session');

      // Start and record
      await page.click('[data-testid="start-recording-button"]');
      await page.fill('[data-testid="recording-editor"]', 'const greeting = "Hello";');

      // Stop recording
      await page.click('[data-testid="stop-recording-button"]');

      // Save dialog should appear
      await expect(page.locator('[data-testid="save-recording-dialog"]')).toBeVisible();

      // Confirm save
      await page.click('button:text("Save Recording")');

      // Should redirect to tutorial creation with recording attached
      await page.waitForURL('**/studio/create-tutorial?recordingId=*');
    });

    test('should discard recording', async ({ page }) => {
      await page.goto('/studio/recording-session');

      // Start recording
      await page.click('[data-testid="start-recording-button"]');
      await page.fill('[data-testid="recording-editor"]', 'test code');

      // Discard
      await page.click('[data-testid="discard-recording-button"]');

      // Confirm dialog
      await page.click('button:text("Discard")');

      // Should return to studio home
      await page.waitForURL('**/studio');
    });
  });

  test.describe('Tutorial Creation', () => {
    test('should create tutorial from recording', async ({ page }) => {
      await page.goto('/studio/create-tutorial?recordingId=test-rec-123');

      // Recording should be pre-selected
      await expect(page.locator('[data-testid="selected-recording"]')).toBeVisible();

      // Fill tutorial details
      await page.fill('input[name="title"]', 'Complete React Tutorial');
      await page.fill('textarea[name="description"]', 'A comprehensive guide to React');
      await page.selectOption('select[name="difficulty"]', 'intermediate');

      // Add tags
      await page.fill('[data-testid="tag-input"]', 'react');
      await page.press('[data-testid="tag-input"]', 'Enter');
      await page.fill('[data-testid="tag-input"]', 'javascript');
      await page.press('[data-testid="tag-input"]', 'Enter');

      // Verify tags added
      await expect(page.locator('[data-testid="tag-item"]')).toHaveCount(2);

      // Create tutorial
      await page.click('button:text("Create Tutorial")');

      // Should redirect to tutorial page
      await page.waitForURL('**/tutorial/**');
      await expect(page.locator('text=Complete React Tutorial')).toBeVisible();
    });

    test('should preview recording before publishing', async ({ page }) => {
      await page.goto('/studio/create-tutorial?recordingId=test-rec-123');

      // Fill required fields
      await page.fill('input[name="title"]', 'Test Tutorial');

      // Click preview
      await page.click('button:text("Preview")');

      // Preview modal should open with player
      await expect(page.locator('[data-testid="preview-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="tutorial-player"]')).toBeVisible();

      // Test playback in preview
      await page.click('[data-testid="play-button"]');
      await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

      // Close preview
      await page.click('[data-testid="close-preview-button"]');
      await expect(page.locator('[data-testid="preview-modal"]')).not.toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/studio/create-tutorial?recordingId=test-rec-123');

      // Try to create without title
      await page.click('button:text("Create Tutorial")');

      // Should show validation errors
      await expect(page.locator('text=Title is required')).toBeVisible();

      // Fill title and try again
      await page.fill('input[name="title"]', 'Valid Title');
      await page.click('button:text("Create Tutorial")');

      // Should proceed
      await page.waitForURL('**/tutorial/**');
    });
  });

  test.describe('Checkpoint Management', () => {
    test('should edit checkpoint details', async ({ page }) => {
      await page.goto('/studio/edit-checkpoints?recordingId=test-rec-123');

      // Checkpoints should be listed
      await expect(page.locator('[data-testid="checkpoint-list"]')).toBeVisible();

      // Edit first checkpoint
      await page.click('[data-testid="edit-checkpoint-button"]:first-child');

      // Update details
      await page.fill('input[name="checkpointLabel"]', 'Updated Label');
      await page.fill('textarea[name="checkpointDescription"]', 'This checkpoint marks...');

      // Save
      await page.click('button:text("Save Changes")');

      // Changes should be reflected
      await expect(page.locator('text=Updated Label')).toBeVisible();
      await expect(page.locator('text=This checkpoint marks...')).toBeVisible();
    });

    test('should reorder checkpoints', async ({ page }) => {
      await page.goto('/studio/edit-checkpoints?recordingId=test-rec-123');

      // Get initial order
      const firstCheckpoint = await page.locator('[data-testid="checkpoint-item"]:first-child').textContent();

      // Drag to reorder (simplified - using move buttons if available)
      await page.click('[data-testid="move-down-button"]:first-child');

      // Order should have changed
      const newFirstCheckpoint = await page.locator('[data-testid="checkpoint-item"]:first-child').textContent();
      expect(newFirstCheckpoint).not.toEqual(firstCheckpoint);
    });

    test('should delete checkpoint', async ({ page }) => {
      await page.goto('/studio/edit-checkpoints?recordingId=test-rec-123');

      // Get initial count
      const initialCount = await page.locator('[data-testid="checkpoint-item"]').count();

      // Delete first checkpoint
      await page.click('[data-testid="delete-checkpoint-button"]:first-child');

      // Confirm deletion
      await page.click('button:text("Delete")');

      // Count should decrease
      await expect(page.locator('[data-testid="checkpoint-item"]')).toHaveCount(initialCount - 1);
    });
  });

  test.describe('Publishing Workflow', () => {
    test('should publish tutorial', async ({ page }) => {
      await page.goto('/studio/tutorials');

      // Find draft tutorial
      await page.click('[data-testid="draft-tutorial"]:first-child');

      // Click publish
      await page.click('button:text("Publish")');

      // Confirm dialog
      await expect(page.locator('[data-testid="publish-confirm-dialog"]')).toBeVisible();
      await page.click('button:text("Publish Now")');

      // Should show success
      await expect(page.locator('text=Tutorial published successfully')).toBeVisible();

      // Status should change to published
      await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Published');
    });

    test('should schedule tutorial for later', async ({ page }) => {
      await page.goto('/studio/tutorials');

      await page.click('[data-testid="draft-tutorial"]:first-child');

      // Open publish options
      await page.click('button:text("Publish")');

      // Select schedule option
      await page.click('text=Schedule for later');

      // Set date and time
      await page.fill('input[type="datetime-local"]', '2025-12-31T12:00');

      // Schedule
      await page.click('button:text("Schedule")');

      // Should show scheduled status
      await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Scheduled');
    });

    test('should unpublish tutorial', async ({ page }) => {
      await page.goto('/studio/tutorials');

      // Find published tutorial
      await page.click('[data-testid="published-tutorial"]:first-child');

      // Unpublish
      await page.click('button:text("Unpublish")');

      // Confirm
      await page.click('button:text("Unpublish")');

      // Status should change to draft
      await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Draft');
    });
  });

  test.describe('AI Course Generation', () => {
    test('should generate course with AI', async ({ page }) => {
      await page.goto('/studio/generate');

      // Fill generation form
      await page.fill('input[name="topic"]', 'Advanced TypeScript Patterns');
      await page.selectOption('select[name="level"]', 'advanced');
      await page.selectOption('select[name="voice"]', 'enthusiastic-teacher');
      await page.fill('input[name="maxLessons"]', '5');

      // Start generation
      await page.click('button:text("Generate Course")');

      // Should show progress
      await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();

      // Wait for completion
      await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });

      // Should show generated lessons
      await expect(page.locator('[data-testid="generated-lesson"]')).toHaveCount(5);
    });

    test('should customize generated lesson', async ({ page }) => {
      await page.goto('/studio/generate/results?jobId=test-job-123');

      // Wait for results
      await page.waitForSelector('[data-testid="lesson-item"]', { timeout: 30000 });

      // Click on a lesson to edit
      await page.click('[data-testid="edit-lesson-button"]:first-child');

      // Edit lesson details
      await page.fill('input[name="lessonTitle"]', 'Custom Lesson Title');
      await page.fill('textarea[name="lessonObjective"]', 'Custom objective');

      // Save changes
      await page.click('button:text("Save Changes")');

      // Changes should be saved
      await expect(page.locator('text=Custom Lesson Title')).toBeVisible();
    });

    test('should publish generated course', async ({ page }) => {
      await page.goto('/studio/generate/results?jobId=test-job-123');

      // Wait for generation to complete
      await page.waitForSelector('[data-testid="publish-course-button"]', { timeout: 60000 });

      // Click publish
      await page.click('[data-testid="publish-course-button"]');

      // Should show success and redirect
      await expect(page.locator('text=Course published successfully')).toBeVisible();
      await page.waitForURL('**/tutorial/**');
    });
  });
});
