/**
 * Shared helpers for the Playwright test suite.
 * Import { test, expect, login } from './helpers' in every spec.
 */
export { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export const ADMIN_USER = process.env.ADMIN_USER     || 'admin';
export const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin_secure_2024';

/**
 * Log in via the login form and wait for the sidebar to appear.
 */
export async function login(page: Page) {
  await page.goto('/');
  await page.locator('#username').waitFor({ timeout: 10_000 });
  await page.locator('#username').fill(ADMIN_USER);
  await page.locator('#password').fill(ADMIN_PASS);
  await page.locator('button[type="submit"]').click();
  // Wait until auth succeeds — the page title or URL changes, or
  // the sidebar content (e.g. 'Command Editor' link text) appears
  await page.waitForFunction(
    () => !document.querySelector('#username'),  // login form disappears after success
    { timeout: 12_000 }
  );
}

/**
 * Navigate via sidebar link text and wait for the page to settle.
 */
export async function gotoPage(page: Page, linkText: string) {
  await page.getByRole('link', { name: linkText, exact: false }).first().click();
  await page.waitForLoadState('networkidle');
}
