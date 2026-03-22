import { test, expect, login, gotoPage } from './helpers';

const PAGES = [
  { link: 'Command Editor', heading: /command/i },
  { link: 'Commands',       heading: /commands/i },
  { link: 'Automation',     heading: /automation|scheduled/i },
  { link: 'Expenses',       heading: /expenses/i },
  { link: 'API Keys',       heading: /api key|secret/i },
  { link: 'Analytics',      heading: /analytics/i },
  { link: 'Knowledge Base', heading: /knowledge base/i },
  { link: 'Command Logs',   heading: /logs/i },
  { link: 'Settings',       heading: /settings/i },
] as const;

test.describe('Sidebar Navigation', () => {
  for (const { link, heading } of PAGES) {
    test(`navigates to "${link}" page`, async ({ page }) => {
      await login(page);
      await gotoPage(page, link);
      // Any heading matching the pattern
      await expect(
        page.getByRole('heading').filter({ hasText: heading }).first()
          .or(page.locator('h1, h2, h3').filter({ hasText: heading }).first())
      ).toBeVisible({ timeout: 10_000 });
    });
  }
});
