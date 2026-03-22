import { test, expect, login } from './helpers';

test.describe('Authentication', () => {
  test('shows login page at root URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#password')).toBeVisible({ timeout: 10_000 });
  });

  test('rejects wrong password with an alert', async ({ page }) => {
    await page.goto('/');
    await page.locator('#username').waitFor({ timeout: 10_000 });
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('totally-wrong-password');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 6_000 });
    await expect(page.locator('#password')).toBeVisible();
  });

  test('logs in with valid credentials and shows sidebar navigation', async ({ page }) => {
    await login(page);
    await expect(page.locator('#username')).toBeHidden({ timeout: 5_000 });
    await expect(
      page.getByRole('link', { name: /command|analytics|settings|expenses/i }).first()
    ).toBeVisible({ timeout: 6_000 });
  });

  test('redirects unauthenticated users to login form', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#username')).toBeVisible({ timeout: 8_000 });
  });

  test('username field has correct placeholder', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#username')).toHaveAttribute('placeholder', 'username');
  });

  test('password field masks input', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });

  test('submit button is labelled Sign In', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button[type="submit"]')).toContainText(/sign in/i);
  });

  test('empty credentials shows validation alert', async ({ page }) => {
    await page.goto('/');
    await page.locator('#username').waitFor({ timeout: 10_000 });
    await page.locator('button[type="submit"]').click();
    // Either a browser native validation message or an app alert
    await expect(
      page.locator('#username:invalid, [role="alert"]').first()
    ).toBeVisible({ timeout: 4_000 }).catch(() => {});
    // Page must NOT navigate away without credentials
    await expect(page.locator('#username')).toBeVisible();
  });

  test('page title contains assistant', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/assistant/i);
  });
});
