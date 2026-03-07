import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('unauthenticated user is redirected to login from dashboard', async ({
    page
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page has correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Days Since/);
  });

  test('can navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: 'Login' })
    ).toBeVisible();

    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByRole('heading', { name: 'Create an account' })
    ).toBeVisible();

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole('heading', { name: 'Login' })
    ).toBeVisible();
  });
});
