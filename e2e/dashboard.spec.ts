import { test, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.playwright/.auth/user.json');

/**
 * Dashboard tests require authentication. They only run when
 * PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are set so the
 * auth setup stores a valid session.
 */
test.describe('Dashboard (authenticated)', () => {
  test.use({ storageState: authFile });

  test.skip(
    () =>
      !process.env.PLAYWRIGHT_TEST_EMAIL ||
      !process.env.PLAYWRIGHT_TEST_PASSWORD,
    'Skipped: set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD to run'
  );

  test('renders dashboard with tabs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: 'All Events' })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Has reminder' })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Is overdue' })
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Private' })).toBeVisible();
  });

  test('has an add event button', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: /Add Event/i })
    ).toBeVisible();
  });

  test('navigates to add event page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Add Event/i }).click();
    await expect(page).toHaveURL(/\/add/);
    await expect(page.getByLabel('Event Name')).toBeVisible();
    await expect(page.getByLabel('When did it happen?')).toBeVisible();
  });

  test('add event form has required fields', async ({ page }) => {
    await page.goto('/add');
    await expect(page.getByLabel('Event Name')).toBeVisible();
    await expect(page.getByLabel('When did it happen?')).toBeVisible();
    await expect(page.getByLabel('Remind me after (days)')).toBeVisible();
    await expect(page.getByLabel('Private')).toBeVisible();
    await expect(page.getByLabel('Disable Resets')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add Event' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Cancel' })
    ).toBeVisible();
  });

  test('can switch between tabs', async ({ page }) => {
    await page.goto('/');

    const allTab = page.getByRole('tab', { name: 'All Events' });
    const remindersTab = page.getByRole('tab', { name: 'Has reminder' });
    const overdueTab = page.getByRole('tab', { name: 'Is overdue' });
    const privateTab = page.getByRole('tab', { name: 'Private' });

    await allTab.click();
    await expect(allTab).toHaveAttribute('data-state', 'active');

    await remindersTab.click();
    await expect(remindersTab).toHaveAttribute('data-state', 'active');

    await overdueTab.click();
    await expect(overdueTab).toHaveAttribute('data-state', 'active');

    await privateTab.click();
    await expect(privateTab).toHaveAttribute('data-state', 'active');
  });
});
