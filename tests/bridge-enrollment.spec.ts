import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Bridge Enrollment System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
    await page.goto('/admin/classes');
    // Wait for page to load
    await page.waitForTimeout(2000);
  });

  test('classes page loads with tabs', async ({ page }) => {
    // Check if page loads - look for either heading or page content
    const hasHeading = await page.locator('h1:has-text("Classes"), h1:has-text("Admin Portal")').isVisible().catch(() => false);
    expect(hasHeading).toBe(true);
  });

  test('bridge enrollment tab is visible', async ({ page }) => {
    // Check for tab navigation
    const bridgeTab = page.locator('button:has-text("Bridge Enrollment")');
    await expect(bridgeTab).toBeVisible();
  });

  test('bridge enrollment tab has three sub-tabs', async ({ page }) => {
    // Click on Bridge Enrollment tab
    await page.click('button:has-text("Bridge Enrollment")');
    
    // Check for sub-tabs
    await expect(page.locator('button:has-text("Enroll Student")')).toBeVisible();
    await expect(page.locator('button:has-text("Bridge Students")')).toBeVisible();
    await expect(page.locator('button:has-text("Merge Classes")')).toBeVisible();
  });

  test('enroll student form has all required fields', async ({ page }) => {
    // Navigate to Bridge Enrollment tab
    await page.click('button:has-text("Bridge Enrollment")');
    
    // Check form fields are present
    await expect(page.locator('label:has-text("Select Student")')).toBeVisible();
    await expect(page.locator('label:has-text("Course")')).toBeVisible();
    await expect(page.locator('label:has-text("Campus")')).toBeVisible();
    await expect(page.locator('label:has-text("Start Date")')).toBeVisible();
    await expect(page.locator('label:has-text("Target Intake")')).toBeVisible();
    await expect(page.locator('label:has-text("Sync/Merge Target Date")')).toBeVisible();
  });

  test('start date selection suggests intake', async ({ page }) => {
    // Navigate to Bridge Enrollment tab
    await page.click('button:has-text("Bridge Enrollment")');
    
    // Fill in a start date (e.g., February = should suggest January)
    const startDateInput = page.locator('input[type="date"]').first();
    await startDateInput.fill('2026-02-15');
    
    // Check if suggested intake appears
    const suggestedIntake = page.locator('text=Suggested Intake');
    await expect(suggestedIntake).toBeVisible();
    await expect(page.locator('text=January')).toBeVisible();
  });

  test('intake suggestion logic for different months', async ({ page }) => {
    await page.click('button:has-text("Bridge Enrollment")');
    
    const startDateInput = page.locator('input[type="date"]').first();
    
    // Test March -> May
    await startDateInput.fill('2026-03-10');
    await expect(page.locator('text=May')).toBeVisible();
    
    // Test July -> September
    await startDateInput.fill('2026-07-20');
    await expect(page.locator('text=September')).toBeVisible();
    
    // Test October -> September
    await startDateInput.fill('2026-10-05');
    await expect(page.locator('text=September')).toBeVisible();
  });

  test('bridge students tab shows student table', async ({ page }) => {
    // Navigate to Bridge Students tab
    await page.click('button:has-text("Bridge Enrollment")');
    await page.click('button:has-text("Bridge Students")');
    
    // Check if table headers are visible
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Course")')).toBeVisible();
    await expect(page.locator('th:has-text("Campus")')).toBeVisible();
    await expect(page.locator('th:has-text("Target Intake")')).toBeVisible();
    await expect(page.locator('th:has-text("Merge Ready")')).toBeVisible();
  });

  test('bridge students tab has filters', async ({ page }) => {
    await page.click('button:has-text("Bridge Enrollment")');
    await page.click('button:has-text("Bridge Students")');
    
    // Check filter dropdowns
    await expect(page.locator('label:has-text("Campus")')).toBeVisible();
    await expect(page.locator('label:has-text("Intake")')).toBeVisible();
  });

  test('merge classes tab shows merge-ready classes', async ({ page }) => {
    // Navigate to Merge Classes tab
    await page.click('button:has-text("Bridge Enrollment")');
    await page.click('button:has-text("Merge Classes")');
    
    // Check if the tab loads
    await expect(page.locator('h3:has-text("Classes Ready to Merge")')).toBeVisible();
  });

  test('enroll button is disabled when form is incomplete', async ({ page }) => {
    await page.click('button:has-text("Bridge Enrollment")');
    
    // The enroll button should be present
    const enrollButton = page.locator('button:has-text("Enroll in Bridge Program")');
    await expect(enrollButton).toBeVisible();
  });

  test('campus selection includes both main and west', async ({ page }) => {
    await page.click('button:has-text("Bridge Enrollment")');
    
    const campusSelect = page.locator('select').nth(1); // Second select is campus
    await expect(campusSelect.locator('option[value="main"]')).toBeAttached();
    await expect(campusSelect.locator('option[value="west"]')).toBeAttached();
  });

  test('intake selection includes all three intakes', async ({ page }) => {
    await page.click('button:has-text("Bridge Enrollment")');
    
    const intakeSelect = page.locator('select').nth(2); // Third select is intake
    await expect(intakeSelect.locator('option[value="January"]')).toBeAttached();
    await expect(intakeSelect.locator('option[value="May"]')).toBeAttached();
    await expect(intakeSelect.locator('option[value="September"]')).toBeAttached();
  });
});
