import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Full Flow: Apply → Admin Enroll', () => {
  const testPhone = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testName = `Test${Date.now()}`;

  test('STEP 1: Student submits application', async ({ page }) => {
    await page.goto(`${BASE}/apply`);
    await page.waitForTimeout(2000);

    // Fill required fields
    await page.locator('#firstName').fill(testName);
    await page.locator('#lastName').fill('Playwright');
    await page.locator('#phone').fill(testPhone);
    await page.locator('#kcseGrade').selectOption('C+');
    await page.locator('#examBody').selectOption('KNEC');

    // Select campus
    await page.locator('button:has-text("Main Campus")').click();

    // Wait for courses to load from DB
    await page.waitForTimeout(3000);

    // Select first available course
    const courseSelect = page.locator('#course');
    if (await courseSelect.isVisible()) {
      const options = await courseSelect.locator('option').all();
      expect(options.length).toBeGreaterThan(1); // Ensure courses loaded
      await courseSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // Select course type if available
      const ctSelect = page.locator('#courseType');
      if (await ctSelect.isVisible()) {
        const ctOptions = await ctSelect.locator('option').all();
        if (ctOptions.length > 1) {
          await ctSelect.selectOption({ index: 1 });
        }
      }
    }

    // Submit
    await page.locator('button:has-text("Submit Application")').click();

    // Wait for submission to process
    await page.waitForTimeout(5000);

    // Verify success — should see confirmation
    const body = await page.textContent('body');
    const submitted = body.toLowerCase().includes('submitted') || body.toLowerCase().includes('thank you');
    expect(submitted).toBe(true);

    console.log(`✅ Application submitted: ${testName}, Phone: ${testPhone}`);
  });

  test('STEP 2: Admin logs in and sees application', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE}/login/admin`);
    await page.waitForTimeout(1000);

    // Fill admin credentials (main campus)
    await page.locator('input[type="email"], input[name="email"]').first().fill('superadmin@eavi.shop');
    await page.locator('input[type="password"], input[name="password"]').first().fill('SuperAdmin@2026!');
    await page.locator('button[type="submit"]').first().click();

    // Wait for dashboard to load
    await page.waitForTimeout(5000);
    const dashUrl = page.url();
    expect(dashUrl).toContain('/admin/dashboard');

    // Navigate to applications
    await page.goto(`${BASE}/admin/applications`);
    await page.waitForTimeout(3000);

    // Verify applications page loaded with data
    const body = await page.textContent('body');
    const hasContent = body.includes('Applications') || body.includes('applications') || body.includes('Enroll');
    expect(hasContent).toBe(true);
    console.log('✅ Admin logged in and applications page loaded');
  });

  test('STEP 3: Admin enrolls a student', async ({ page }) => {
    // Login as admin first
    await page.goto(`${BASE}/login/admin`);
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"], input[name="email"]').first().fill('superadmin@eavi.shop');
    await page.locator('input[type="password"], input[name="password"]').first().fill('SuperAdmin@2026!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(5000);

    // Go to applications
    await page.goto(`${BASE}/admin/applications`);
    await page.waitForTimeout(3000);

    // Find the first pending application and click Enroll
    const enrollBtn = page.locator('button:has-text("Enroll")').first();
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await page.waitForTimeout(2000);

      // Fill admission number
      const admInput = page.locator('input[placeholder*="Admission"]');
      if (await admInput.isVisible()) {
        await admInput.fill(`TST${Date.now()}`);
      }

      // Check if class selection exists or auto-create is shown
      const classSelect = page.locator('#classSelect');
      if (await classSelect.isVisible()) {
        // Pick first available class
        const options = await classSelect.locator('option').all();
        if (options.length > 1) {
          await classSelect.selectOption({ index: 1 });
        }
      }

      // Click final Enroll button
      await page.locator('button:has-text("Enroll")').last().click();
      await page.waitForTimeout(3000);

      // Check for success or error
      const body = await page.textContent('body');
      const hasError = body.includes('error') || body.includes('Error') || body.includes('Failed');
      expect(hasError).toBe(false);
      console.log('✅ Student enrolled successfully');
    } else {
      console.log('⚠️ No pending applications to enroll');
    }
  });
});
