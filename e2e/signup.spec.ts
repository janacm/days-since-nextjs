import { test, expect } from '@playwright/test';

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders the signup form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Create an account' })
    ).toBeVisible();
    await expect(
      page.getByText('Sign up to get started with Days Since')
    ).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByLabel('Name (Optional)')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create account' })
    ).toBeVisible();
  });

  test('has a link to the login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: 'Sign in' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('email input requires valid email', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('password input is required and shows hint', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
    await expect(
      page.getByText('Must be at least 6 characters long')
    ).toBeVisible();
  });

  test('name field is optional', async ({ page }) => {
    const nameInput = page.getByLabel('Name (Optional)');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).not.toHaveAttribute('required', '');
  });

  test('navigates to login page when link is clicked', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
