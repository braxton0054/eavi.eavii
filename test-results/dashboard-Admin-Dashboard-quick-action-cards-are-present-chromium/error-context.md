# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Admin Dashboard >> quick action cards are present
- Location: tests\dashboard.spec.ts:28:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 5
Received:   1
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]: Loading...
  - button "Open Next.js Dev Tools" [ref=e9] [cursor=pointer]:
    - img [ref=e10]
  - alert [ref=e13]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsAdmin, loginAsLecturer } from './helpers/auth';
  3   | 
  4   | test.describe('Admin Dashboard', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await loginAsAdmin(page);
  7   |   });
  8   | 
  9   |   test('admin dashboard page loads', async ({ page }) => {
  10  |     await page.goto('/admin/dashboard');
  11  |     await page.waitForTimeout(2000);
  12  |     
  13  |     // Check page loads with any heading
  14  |     const heading = page.locator('h1, h2').first();
  15  |     await expect(heading).toBeVisible();
  16  |   });
  17  | 
  18  |   test('dashboard displays stats cards', async ({ page }) => {
  19  |     await page.goto('/admin/dashboard');
  20  |     await page.waitForTimeout(1000);
  21  |     
  22  |     // Look for stats sections
  23  |     const headings = page.locator('h1, h2, h3');
  24  |     const count = await headings.count();
  25  |     expect(count).toBeGreaterThan(0);
  26  |   });
  27  | 
  28  |   test('quick action cards are present', async ({ page }) => {
  29  |     await page.goto('/admin/dashboard');
  30  |     await page.waitForTimeout(1000);
  31  |     
  32  |     // Check for action buttons/cards
  33  |     const actions = page.locator('a, button');
  34  |     const count = await actions.count();
> 35  |     expect(count).toBeGreaterThan(5);
      |                   ^ Error: expect(received).toBeGreaterThan(expected)
  36  |   });
  37  | 
  38  |   test('classes link is available', async ({ page }) => {
  39  |     await page.goto('/admin/dashboard');
  40  |     await page.waitForTimeout(1000);
  41  |     
  42  |     // Check if Classes link exists - look for any link with 'classes' text
  43  |     const classesLink = page.locator('a:has-text("Classes")').first();
  44  |     const isVisible = await classesLink.isVisible().catch(() => false);
  45  |     // This test may fail if the link doesn't exist, that's ok
  46  |     console.log('Classes link visible:', isVisible);
  47  |   });
  48  | });
  49  | 
  50  | test.describe('Lecturer Dashboard', () => {
  51  |   test.beforeEach(async ({ page }) => {
  52  |     await loginAsLecturer(page);
  53  |   });
  54  | 
  55  |   test('lecturer dashboard page loads', async ({ page }) => {
  56  |     await page.goto('/lecturer/dashboard');
  57  |     await page.waitForTimeout(2000);
  58  |     
  59  |     // Check page loads with any heading
  60  |     const heading = page.locator('h1, h2').first();
  61  |     await expect(heading).toBeVisible();
  62  |   });
  63  | 
  64  |   test('lecturer dashboard has class setup functionality', async ({ page }) => {
  65  |     await page.goto('/lecturer/dashboard');
  66  |     await page.waitForTimeout(1000);
  67  |     
  68  |     // Look for class-related content or setup button
  69  |     const hasClassContent = await page.locator('text=Your Classes, text=Setup, button:has-text("Class")').first().isVisible().catch(() => false);
  70  |     // Accept either classes content or setup functionality
  71  |     expect(hasClassContent || true).toBe(true); // Skip for now
  72  |   });
  73  | 
  74  |   test('lecturer dashboard has neumorphic styling', async ({ page }) => {
  75  |     await page.goto('/lecturer/dashboard');
  76  |     await page.waitForTimeout(1000);
  77  |     
  78  |     // Check for glass-neu classes
  79  |     const neumorphicElements = page.locator('.glass-neu, .glass-neu-btn, .glass-neu-inset');
  80  |     const count = await neumorphicElements.count();
  81  |     // This will pass if styling is applied
  82  |     console.log('Neumorphic elements found:', count);
  83  |   });
  84  | });
  85  | 
  86  | test.describe('Navigation & Routing', () => {
  87  |   test('home page is accessible', async ({ page }) => {
  88  |     await page.goto('/');
  89  |     await expect(page).toHaveTitle(/EAVI/i);
  90  |   });
  91  | 
  92  |   test('apply page is accessible', async ({ page }) => {
  93  |     await page.goto('/apply');
  94  |     await expect(page).toHaveTitle(/EAVI/i);
  95  |   });
  96  | 
  97  |   test('login pages are accessible', async ({ page }) => {
  98  |     await page.goto('/login/admin');
  99  |     await expect(page).toHaveTitle(/EAVI/i);
  100 |     
  101 |     await page.goto('/login/lecturer');
  102 |     await expect(page).toHaveTitle(/EAVI/i);
  103 |     
  104 |     await page.goto('/login/student');
  105 |     await expect(page).toHaveTitle(/EAVI/i);
  106 |   });
  107 | 
  108 |   test('admin navigation links work', async ({ page }) => {
  109 |     await page.goto('/admin/dashboard');
  110 |     
  111 |     // Test various admin links
  112 |     const links = [
  113 |       '/admin/classes',
  114 |       '/admin/courses',
  115 |       '/admin/students',
  116 |       '/admin/lecturers',
  117 |     ];
  118 |     
  119 |     for (const link of links) {
  120 |       const linkElement = page.locator(`a[href="${link}"]`);
  121 |       if (await linkElement.isVisible().catch(() => false)) {
  122 |         await linkElement.click();
  123 |         await expect(page).toHaveURL(new RegExp(link));
  124 |         await page.goto('/admin/dashboard'); // Go back
  125 |       }
  126 |     }
  127 |   });
  128 | });
  129 | 
```