# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bridge-enrollment.spec.ts >> Bridge Enrollment System >> intake suggestion logic for different months
- Location: tests\bridge-enrollment.spec.ts:62:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Bridge Enrollment")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "EAVI Logo" [ref=e7] [cursor=pointer]:
          - /url: /admin/dashboard
          - img "EAVI Logo" [ref=e8]
        - generic [ref=e9]:
          - heading "Classes Management" [level=1] [ref=e10]
          - paragraph [ref=e11]: West Campus
      - generic [ref=e12]:
        - button "Assign Lecturer" [ref=e13]
        - button "+ Create Class" [ref=e14]
        - link "Back to Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /admin/dashboard
    - generic [ref=e16]:
      - generic [ref=e18]:
        - combobox [ref=e19]:
          - option "All Campuses" [selected]
          - option "Main Campus"
          - option "West Campus"
        - combobox [ref=e20]:
          - option "All Intakes" [selected]
          - option "January"
          - option "February"
          - option "March"
          - option "April"
          - option "May"
          - option "June"
          - option "July"
          - option "August"
          - option "September"
          - option "October"
          - option "November"
          - option "December"
        - combobox [ref=e21]:
          - option "All Semesters" [selected]
          - option "Semester 1"
          - option "Semester 2"
          - option "Semester 3"
          - option "Semester 4"
          - option "Semester 5"
          - option "Semester 6"
        - combobox [ref=e22]:
          - option "All Courses" [selected]
        - combobox [ref=e23]:
          - option "All Status" [selected]
          - option "Active"
          - option "Inactive"
      - generic [ref=e25]: No classes found. Create a new class to get started.
  - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
    - img [ref=e32]
  - alert [ref=e35]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsAdmin } from './helpers/auth';
  3   | 
  4   | test.describe('Bridge Enrollment System', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Login as admin before each test
  7   |     await loginAsAdmin(page);
  8   |     await page.goto('/admin/classes');
  9   |     // Wait for page to load
  10  |     await page.waitForTimeout(2000);
  11  |   });
  12  | 
  13  |   test('classes page loads with tabs', async ({ page }) => {
  14  |     // Check if page loads - look for either heading or page content
  15  |     const hasHeading = await page.locator('h1:has-text("Classes"), h1:has-text("Admin Portal")').isVisible().catch(() => false);
  16  |     expect(hasHeading).toBe(true);
  17  |   });
  18  | 
  19  |   test('bridge enrollment tab is visible', async ({ page }) => {
  20  |     // Check for tab navigation
  21  |     const bridgeTab = page.locator('button:has-text("Bridge Enrollment")');
  22  |     await expect(bridgeTab).toBeVisible();
  23  |   });
  24  | 
  25  |   test('bridge enrollment tab has three sub-tabs', async ({ page }) => {
  26  |     // Click on Bridge Enrollment tab
  27  |     await page.click('button:has-text("Bridge Enrollment")');
  28  |     
  29  |     // Check for sub-tabs
  30  |     await expect(page.locator('button:has-text("Enroll Student")')).toBeVisible();
  31  |     await expect(page.locator('button:has-text("Bridge Students")')).toBeVisible();
  32  |     await expect(page.locator('button:has-text("Merge Classes")')).toBeVisible();
  33  |   });
  34  | 
  35  |   test('enroll student form has all required fields', async ({ page }) => {
  36  |     // Navigate to Bridge Enrollment tab
  37  |     await page.click('button:has-text("Bridge Enrollment")');
  38  |     
  39  |     // Check form fields are present
  40  |     await expect(page.locator('label:has-text("Select Student")')).toBeVisible();
  41  |     await expect(page.locator('label:has-text("Course")')).toBeVisible();
  42  |     await expect(page.locator('label:has-text("Campus")')).toBeVisible();
  43  |     await expect(page.locator('label:has-text("Start Date")')).toBeVisible();
  44  |     await expect(page.locator('label:has-text("Target Intake")')).toBeVisible();
  45  |     await expect(page.locator('label:has-text("Sync/Merge Target Date")')).toBeVisible();
  46  |   });
  47  | 
  48  |   test('start date selection suggests intake', async ({ page }) => {
  49  |     // Navigate to Bridge Enrollment tab
  50  |     await page.click('button:has-text("Bridge Enrollment")');
  51  |     
  52  |     // Fill in a start date (e.g., February = should suggest January)
  53  |     const startDateInput = page.locator('input[type="date"]').first();
  54  |     await startDateInput.fill('2026-02-15');
  55  |     
  56  |     // Check if suggested intake appears
  57  |     const suggestedIntake = page.locator('text=Suggested Intake');
  58  |     await expect(suggestedIntake).toBeVisible();
  59  |     await expect(page.locator('text=January')).toBeVisible();
  60  |   });
  61  | 
  62  |   test('intake suggestion logic for different months', async ({ page }) => {
> 63  |     await page.click('button:has-text("Bridge Enrollment")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  64  |     
  65  |     const startDateInput = page.locator('input[type="date"]').first();
  66  |     
  67  |     // Test March -> May
  68  |     await startDateInput.fill('2026-03-10');
  69  |     await expect(page.locator('text=May')).toBeVisible();
  70  |     
  71  |     // Test July -> September
  72  |     await startDateInput.fill('2026-07-20');
  73  |     await expect(page.locator('text=September')).toBeVisible();
  74  |     
  75  |     // Test October -> September
  76  |     await startDateInput.fill('2026-10-05');
  77  |     await expect(page.locator('text=September')).toBeVisible();
  78  |   });
  79  | 
  80  |   test('bridge students tab shows student table', async ({ page }) => {
  81  |     // Navigate to Bridge Students tab
  82  |     await page.click('button:has-text("Bridge Enrollment")');
  83  |     await page.click('button:has-text("Bridge Students")');
  84  |     
  85  |     // Check if table headers are visible
  86  |     await expect(page.locator('th:has-text("Name")')).toBeVisible();
  87  |     await expect(page.locator('th:has-text("Course")')).toBeVisible();
  88  |     await expect(page.locator('th:has-text("Campus")')).toBeVisible();
  89  |     await expect(page.locator('th:has-text("Target Intake")')).toBeVisible();
  90  |     await expect(page.locator('th:has-text("Merge Ready")')).toBeVisible();
  91  |   });
  92  | 
  93  |   test('bridge students tab has filters', async ({ page }) => {
  94  |     await page.click('button:has-text("Bridge Enrollment")');
  95  |     await page.click('button:has-text("Bridge Students")');
  96  |     
  97  |     // Check filter dropdowns
  98  |     await expect(page.locator('label:has-text("Campus")')).toBeVisible();
  99  |     await expect(page.locator('label:has-text("Intake")')).toBeVisible();
  100 |   });
  101 | 
  102 |   test('merge classes tab shows merge-ready classes', async ({ page }) => {
  103 |     // Navigate to Merge Classes tab
  104 |     await page.click('button:has-text("Bridge Enrollment")');
  105 |     await page.click('button:has-text("Merge Classes")');
  106 |     
  107 |     // Check if the tab loads
  108 |     await expect(page.locator('h3:has-text("Classes Ready to Merge")')).toBeVisible();
  109 |   });
  110 | 
  111 |   test('enroll button is disabled when form is incomplete', async ({ page }) => {
  112 |     await page.click('button:has-text("Bridge Enrollment")');
  113 |     
  114 |     // The enroll button should be present
  115 |     const enrollButton = page.locator('button:has-text("Enroll in Bridge Program")');
  116 |     await expect(enrollButton).toBeVisible();
  117 |   });
  118 | 
  119 |   test('campus selection includes both main and west', async ({ page }) => {
  120 |     await page.click('button:has-text("Bridge Enrollment")');
  121 |     
  122 |     const campusSelect = page.locator('select').nth(1); // Second select is campus
  123 |     await expect(campusSelect.locator('option[value="main"]')).toBeAttached();
  124 |     await expect(campusSelect.locator('option[value="west"]')).toBeAttached();
  125 |   });
  126 | 
  127 |   test('intake selection includes all three intakes', async ({ page }) => {
  128 |     await page.click('button:has-text("Bridge Enrollment")');
  129 |     
  130 |     const intakeSelect = page.locator('select').nth(2); // Third select is intake
  131 |     await expect(intakeSelect.locator('option[value="January"]')).toBeAttached();
  132 |     await expect(intakeSelect.locator('option[value="May"]')).toBeAttached();
  133 |     await expect(intakeSelect.locator('option[value="September"]')).toBeAttached();
  134 |   });
  135 | });
  136 | 
```