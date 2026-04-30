import { test as base } from '@playwright/test';

// Extend the base test to include authentication
export const test = base.extend({
  page: async ({ page }, use) => {
    // Before each test, check if we need to login
    await page.context().addCookies([
      {
        name: 'test-auth',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
    ]);
    
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Helper function to login as admin
export async function loginAsAdmin(page: any) {
  await page.goto('/login/admin');
  
  // Check if already logged in (redirected to dashboard)
  const url = page.url();
  if (url.includes('/admin/dashboard')) {
    return;
  }
  
  try {
    // Wait for form to load
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    
    // Fill login form with correct credentials
    await page.fill('input[name="email"]', 'wcampus2@gmail.com');
    await page.fill('input[name="password"]', '0748022044W*');
    
    // Select West Campus button (since email is wcampus2)
    const westCampusButton = page.locator('button:has-text("West")');
    await westCampusButton.click();
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 }).catch(() => {
      console.log('Login may have failed, continuing with test...');
    });
  } catch (error) {
    console.log('Login error:', error);
  }
}

// Helper function to login as lecturer
export async function loginAsLecturer(page: any) {
  await page.goto('/login/lecturer');
  
  const url = page.url();
  if (url.includes('/lecturer/dashboard')) {
    return;
  }
  
  await page.fill('input[type="email"]', 'lecturer@eavi.ac.ke');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/\/lecturer\/dashboard/, { timeout: 10000 }).catch(() => {
    console.log('Login may have failed, continuing with test...');
  });
}
