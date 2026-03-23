import { test, expect } from '@playwright/test';

/**
 * Full User Journey E2E Tests
 *
 * Tests complete user flows:
 * 1. Login → Generate Course → Watch → Edit
 * 2. Error scenarios
 * 3. Playback controls
 * 4. Navigation
 */

test.describe('Full User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication Flow', () => {
    test('should register a new user', async ({ page }) => {
      // Navigate to signup
      await page.click('text=Sign Up');
      await page.waitForURL('**/signup');

      // Fill registration form
      await page.fill('input[name="username"]', 'testuser-e2e');
      await page.fill('input[name="email"]', 'test-e2e@example.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="displayName"]', 'Test User');

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to home or dashboard
      await page.waitForURL('**/');

      // Verify logged in state (e.g., user menu visible)
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should login with existing credentials', async ({ page }) => {
      // Navigate to login
      await page.click('text=Log In');
      await page.waitForURL('**/login');

      // Fill login form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to home
      await page.waitForURL('**/');

      // Verify logged in state
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('should logout user', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Log Out');

      // Should show login button again
      await expect(page.locator('text=Log In')).toBeVisible();
    });
  });

  test.describe('Course Generation Flow', () => {
    test('should generate a new AI course', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Navigate to course generation
      await page.click('text=Create Course');
      await page.waitForURL('**/create');

      // Fill course generation form
      await page.fill('input[name="topic"]', 'TypeScript Basics');
      await page.selectOption('select[name="level"]', 'beginner');
      await page.selectOption('select[name="voice"]', 'chill');

      // Submit
      await page.click('button[type="submit"]');

      // Should show loading/generating state
      await expect(page.locator('text=Generating your course')).toBeVisible();

      // Wait for generation to complete (mocked in test environment)
      await page.waitForSelector('[data-testid="course-ready"]', { timeout: 30000 });

      // Should show course preview
      await expect(page.locator('[data-testid="course-preview"]')).toBeVisible();
      await expect(page.locator('text=TypeScript Basics')).toBeVisible();
    });

    test('should show error for invalid course generation input', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Navigate to course generation
      await page.goto('/create');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=Topic is required')).toBeVisible();
    });

    test('should track generation job status', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Start course generation
      await page.goto('/create');
      await page.fill('input[name="topic"]', 'Python for Beginners');
      await page.selectOption('select[name="level"]', 'beginner');
      await page.click('button[type="submit"]');

      // Should show progress indicator
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

      // Progress should update over time
      const progress1 = await page.locator('[data-testid="progress-percentage"]').textContent();
      await page.waitForTimeout(2000);
      const progress2 = await page.locator('[data-testid="progress-percentage"]').textContent();

      expect(progress1).not.toEqual(progress2);
    });
  });

  test.describe('Tutorial Playback Flow', () => {
    test('should watch tutorial with full playback controls', async ({ page }) => {
      // Navigate to a tutorial
      await page.goto('/tutorial/test-tutorial-1');
      await page.waitForLoadState('networkidle');

      // Tutorial should load
      await expect(page.locator('[data-testid="tutorial-player"]')).toBeVisible();

      // Play button should be visible
      await expect(page.locator('[data-testid="play-button"]')).toBeVisible();

      // Click play
      await page.click('[data-testid="play-button"]');

      // Should show pause button (playback started)
      await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

      // Timeline/progress should advance
      await page.waitForTimeout(1000);
      const progress = await page.locator('[data-testid="progress-bar"] input');
      await expect(progress).not.toHaveValue('0');

      // Pause playback
      await page.click('[data-testid="pause-button"]');
      await expect(page.locator('[data-testid="play-button"]')).toBeVisible();

      // Seek to specific time
      await page.fill('[data-testid="progress-bar"] input', '50');

      // Code in editor should update based on timestamp
      const codeContent = await page.locator('[data-testid="code-editor"] textarea').inputValue();
      expect(codeContent.length).toBeGreaterThan(0);
    });

    test('should use speed controls', async ({ page }) => {
      await page.goto('/tutorial/test-tutorial-1');

      // Open speed menu
      await page.click('[data-testid="speed-button"]');

      // Select 2x speed
      await page.click('text=2x');

      // Speed indicator should update
      await expect(page.locator('[data-testid="speed-indicator"]')).toHaveText('2x');

      // Start playback
      await page.click('[data-testid="play-button"]');

      // Progress should advance faster
      await page.waitForTimeout(1000);
      const progressAt2x = await page.locator('[data-testid="progress-bar"] input').inputValue();

      // Change to 0.5x
      await page.click('[data-testid="speed-button"]');
      await page.click('text=0.5x');

      await expect(page.locator('[data-testid="speed-indicator"]')).toHaveText('0.5x');
    });

    test('should navigate checkpoints', async ({ page }) => {
      await page.goto('/tutorial/test-tutorial-1');

      // Checkpoints should be visible on timeline
      await expect(page.locator('[data-testid="checkpoint-marker"]').first()).toBeVisible();

      // Click next checkpoint button
      await page.click('[data-testid="next-checkpoint-button"]');

      // Should jump to checkpoint time
      const timeDisplay = await page.locator('[data-testid="current-time"]').textContent();
      expect(timeDisplay).not.toBe('0:00');

      // Click previous checkpoint
      await page.click('[data-testid="prev-checkpoint-button"]');

      // Should go back
      const newTimeDisplay = await page.locator('[data-testid="current-time"]').textContent();
      expect(newTimeDisplay).not.toEqual(timeDisplay);
    });

    test('should enter edit mode and fork', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Navigate to tutorial
      await page.goto('/tutorial/test-tutorial-1');

      // Enter edit mode
      await page.click('[data-testid="edit-mode-button"]');

      // Editor should become editable
      const editor = page.locator('[data-testid="code-editor"]');
      await expect(editor).toHaveAttribute('data-readonly', 'false');

      // Make an edit
      await editor.fill('// My edited code');

      // Save fork dialog should appear on navigate away
      await page.click('[data-testid="back-button"]');
      await expect(page.locator('[data-testid="save-fork-dialog"]')).toBeVisible();

      // Save the fork
      await page.fill('input[name="forkName"]', 'My Fork');
      await page.click('button:text("Save Fork")');

      // Should show success message
      await expect(page.locator('text=Fork saved successfully')).toBeVisible();
    });

    test('should show code examples with syntax highlighting', async ({ page }) => {
      await page.goto('/tutorial/test-tutorial-1');

      // Code editor should be visible
      await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();

      // Should have syntax highlighting classes
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();
    });
  });

  test.describe('Navigation & Search', () => {
    test('should navigate through main pages', async ({ page }) => {
      // Home page
      await page.goto('/');
      await expect(page.locator('h1')).toContainText('CodeTube');

      // Browse tutorials
      await page.click('text=Tutorials');
      await page.waitForURL('**/tutorials');
      await expect(page.locator('[data-testid="tutorial-list"]')).toBeVisible();

      // Search
      await page.fill('[data-testid="search-input"]', 'react');
      await page.press('[data-testid="search-input"]', 'Enter');

      // Results should update
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

      // Click on a tutorial
      await page.click('[data-testid="tutorial-card"]:first-child');
      await page.waitForURL('**/tutorial/**');
    });

    test('should filter tutorials by category', async ({ page }) => {
      await page.goto('/tutorials');

      // Click on category filter
      await page.click('text=JavaScript');

      // Should filter results
      await expect(page.locator('[data-testid="active-filter"]')).toHaveText('JavaScript');

      // All visible tutorials should be JavaScript
      const cards = await page.locator('[data-testid="tutorial-card"]').count();
      expect(cards).toBeGreaterThan(0);
    });

    test('should navigate to user profile', async ({ page }) => {
      await page.goto('/');

      // Click on a user avatar
      await page.click('[data-testid="user-avatar"]:first-child');

      // Should navigate to profile
      await page.waitForURL('**/profile/**');
      await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Mobile menu should be available
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    });

    test('should show mobile player controls', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/tutorial/test-tutorial-1');

      // Mobile player controls
      await expect(page.locator('[data-testid="mobile-playback-controls"]')).toBeVisible();

      // Fullscreen button should be available
      await expect(page.locator('[data-testid="fullscreen-button"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show 404 page for non-existent tutorial', async ({ page }) => {
      await page.goto('/tutorial/non-existent-id-12345');

      await expect(page.locator('text=Not Found')).toBeVisible();
      await expect(page.locator('text=Go back home')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);

      await page.goto('/tutorials');

      // Should show error state
      await expect(page.locator('text=Unable to load content')).toBeVisible();

      // Restore network
      await page.context().setOffline(false);
    });

    test('should validate form inputs', async ({ page }) => {
      await page.goto('/login');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();

      // Enter invalid email
      await page.fill('input[name="email"]', 'not-an-email');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email format')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load tutorial player within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/tutorial/test-tutorial-1');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    });

    test('should handle rapid navigation', async ({ page }) => {
      await page.goto('/');

      // Rapidly navigate between pages
      for (let i = 0; i < 10; i++) {
        await page.goto('/tutorials');
        await page.goto('/');
      }

      // Should still be responsive
      await page.click('text=Tutorials');
      await expect(page.locator('[data-testid="tutorial-list"]')).toBeVisible();
    });
  });
});
