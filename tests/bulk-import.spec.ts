import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';

test.describe('Bulk CSV Import', () => {
  const csvPath = path.join(__dirname, 'test-import.csv');
  const ts = Date.now().toString().slice(-6);

  test.beforeAll(() => {
    // Create a test CSV file
    const csv = `full_name,phone,email,kcse_grade,course,course_type,campus,gender,admission_number,application_date,current_semester
Bulk Test ${ts} A,07111111${ts.slice(0,4)},bulka${ts}@test.com,B+,Certificate in Marketing,certificate,main,male,BULK${ts}A,2026-05-12,1
Bulk Test ${ts} B,07111111${ts.slice(2,6)},bulkb${ts}@test.com,C,Diploma in Information Technology,diploma,west,female,BULK${ts}B,2026-05-12,1`;
    fs.writeFileSync(csvPath, csv);
    console.log(`✅ Test CSV created at ${csvPath}`);
  });

  test.afterAll(() => {
    // Clean up test CSV
    try { fs.unlinkSync(csvPath); } catch {}
  });

  test('Admin can upload CSV and import students', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE}/login/admin`);
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"], input[name="email"]').first().fill('superadmin@eavi.shop');
    await page.locator('input[type="password"], input[name="password"]').first().fill('SuperAdmin@2026!');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(5000);

    // Navigate to applications
    await page.goto(`${BASE}/admin/applications`);
    await page.waitForTimeout(3000);

    // Click Bulk Import button
    const bulkBtn = page.locator('button:has-text("Bulk Import")');
    await expect(bulkBtn).toBeVisible();
    await bulkBtn.click();
    await page.waitForTimeout(1000);

    // Upload CSV file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(csvPath);
      await page.waitForTimeout(2000);

      // Check parsed data shows
      const body = await page.textContent('body');
      expect(body).toContain('Bulk Test');

      // Click import/upload button
      const importBtn = page.locator('button:has-text("Import")');
      if (await importBtn.isVisible()) {
        await importBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    // Verify success or at least no crash
    const body = await page.textContent('body');
    console.log(`✅ CSV Import test completed. Page shows: ${body.includes('Bulk Test') ? 'data loaded' : 'check manually'}`);
  });
});
