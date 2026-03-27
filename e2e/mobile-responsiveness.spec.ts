import { test, expect, Page } from '@playwright/test';
import path from 'path';

const MOBILE_VIEWPORTS = [
  { width: 320, height: 568, label: 'iPhone SE' },
  { width: 375, height: 667, label: 'iPhone 8' },
  { width: 390, height: 844, label: 'iPhone 14' },
  { width: 412, height: 915, label: 'Pixel 7' }
];

/**
 * Checks that no element on the page overflows beyond the viewport width,
 * which would cause content to be cut off or require horizontal scrolling.
 */
async function assertNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const overflowing: string[] = [];

    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      if (rect.right > viewportWidth + 1) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className
          ? `.${String(el.className).split(' ').slice(0, 3).join('.')}`
          : '';
        overflowing.push(
          `<${tag}${id}${cls}> right=${Math.round(rect.right)}px (viewport=${viewportWidth}px)`
        );
      }
    }

    return { overflowing, viewportWidth };
  });

  expect(
    result.overflowing,
    `Elements overflow viewport (${result.viewportWidth}px):\n${result.overflowing.join('\n')}`
  ).toHaveLength(0);
}

/**
 * Checks that the document body does not produce horizontal scroll.
 */
async function assertNoHorizontalScroll(page: Page) {
  const scrollInfo = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));

  expect(
    scrollInfo.scrollWidth,
    `Page has horizontal scroll: scrollWidth=${scrollInfo.scrollWidth} > clientWidth=${scrollInfo.clientWidth}`
  ).toBeLessThanOrEqual(scrollInfo.clientWidth + 1);
}

/**
 * Checks that key interactive elements (buttons, inputs, links) are
 * fully visible within the viewport and not clipped.
 */
async function assertInteractiveElementsVisible(page: Page) {
  const clipped = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const interactiveSelectors =
      'button, a, input, select, textarea, [role="button"], [role="tab"]';
    const elements = document.querySelectorAll(interactiveSelectors);
    const clippedElements: string[] = [];

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.height === 0 || rect.width === 0) continue;

      const isOffscreen = rect.right < 0 || rect.left > viewportWidth;
      if (isOffscreen) continue;

      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || '').trim().slice(0, 30);
        clippedElements.push(
          `<${tag}> "${text}" left=${Math.round(rect.left)} right=${Math.round(rect.right)} (viewport=${viewportWidth}px)`
        );
      }
    }

    return clippedElements;
  });

  expect(
    clipped,
    `Interactive elements clipped on mobile:\n${clipped.join('\n')}`
  ).toHaveLength(0);
}

/**
 * Checks that text content is not being truncated beyond what is expected
 * (looks for single-line containers whose content overflows).
 */
async function assertNoContentCutoff(page: Page) {
  const issues = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const problems: string[] = [];

    const textElements = document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, span, label, div'
    );

    for (const el of textElements) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      const style = window.getComputedStyle(el);
      const overflowX = style.overflowX;
      const hasOverflowHidden =
        overflowX === 'hidden' && !style.textOverflow;

      if (hasOverflowHidden && el.scrollWidth > el.clientWidth + 2) {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || '').trim().slice(0, 40);
        if (!text) continue;
        const hasEllipsis = style.textOverflow === 'ellipsis';
        const hasTruncateClass = el.classList.contains('truncate');

        if (!hasEllipsis && !hasTruncateClass) {
          problems.push(
            `<${tag}> "${text}" is clipped without ellipsis (scrollW=${el.scrollWidth}, clientW=${el.clientWidth})`
          );
        }
      }
    }

    return problems;
  });

  expect(
    issues,
    `Content cut off without ellipsis:\n${issues.join('\n')}`
  ).toHaveLength(0);
}

async function runMobileChecks(page: Page) {
  await assertNoHorizontalScroll(page);
  await assertNoHorizontalOverflow(page);
  await assertInteractiveElementsVisible(page);
  await assertNoContentCutoff(page);
}

// ---------------------------------------------------------------------------
// Unauthenticated pages – these are always accessible
// ---------------------------------------------------------------------------
test.describe('Mobile responsiveness – Login page', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`no content cut off at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await page.goto('/login');
      await expect(
        page.getByRole('heading', { name: 'Login' })
      ).toBeVisible();

      await runMobileChecks(page);
    });
  }

  test('form inputs are fully visible on smallest viewport', async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/login');

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const submitButton = page.getByRole('button', { name: 'Sign In' });

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeInViewport();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeInViewport();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeInViewport();
  });

  test('card does not overflow viewport on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: 'Login' })
    ).toBeVisible();

    const cardBounds = await page
      .locator('[class*="card"]')
      .first()
      .boundingBox();
    expect(cardBounds).not.toBeNull();
    if (cardBounds) {
      expect(cardBounds.x).toBeGreaterThanOrEqual(0);
      expect(cardBounds.x + cardBounds.width).toBeLessThanOrEqual(320 + 1);
    }
  });
});

test.describe('Mobile responsiveness – Signup page', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`no content cut off at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await page.goto('/signup');
      await expect(
        page.getByRole('heading', { name: 'Create an account' })
      ).toBeVisible();

      await runMobileChecks(page);
    });
  }

  test('all form fields visible without horizontal scroll on smallest viewport', async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/signup');

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    const nameInput = page.getByLabel('Name (Optional)');
    const submitButton = page.getByRole('button', {
      name: 'Create account'
    });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(nameInput).toBeVisible();

    await submitButton.scrollIntoViewIfNeeded();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeInViewport();
  });

  test('card does not overflow viewport on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/signup');
    await expect(
      page.getByRole('heading', { name: 'Create an account' })
    ).toBeVisible();

    const cardBounds = await page
      .locator('[class*="card"]')
      .first()
      .boundingBox();
    expect(cardBounds).not.toBeNull();
    if (cardBounds) {
      expect(cardBounds.x).toBeGreaterThanOrEqual(0);
      expect(cardBounds.x + cardBounds.width).toBeLessThanOrEqual(320 + 1);
    }
  });
});

// ---------------------------------------------------------------------------
// Authenticated pages – only run when credentials are provided
// ---------------------------------------------------------------------------
const authFile = path.join(__dirname, '../.playwright/.auth/user.json');
const hasAuth =
  !!process.env.PLAYWRIGHT_TEST_EMAIL &&
  !!process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('Mobile responsiveness – Dashboard (authenticated)', () => {
  test.use({ storageState: authFile });
  test.skip(() => !hasAuth, 'Skipped: auth credentials not provided');

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`no content cut off at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await page.goto('/');
      await expect(
        page.getByRole('tab', { name: 'All Events' })
      ).toBeVisible();

      await runMobileChecks(page);
    });
  }

  test('tab bar does not overflow on 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await expect(
      page.getByRole('tab', { name: 'All Events' })
    ).toBeVisible();

    await assertNoHorizontalScroll(page);
  });

  test('add event button is accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const addBtn = page.getByRole('link', { name: /Add Event/i });
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeInViewport();
  });

  test('mobile menu toggle is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: 'Toggle Menu' });
    await expect(menuButton).toBeVisible();
  });
});

test.describe('Mobile responsiveness – Add Event (authenticated)', () => {
  test.use({ storageState: authFile });
  test.skip(() => !hasAuth, 'Skipped: auth credentials not provided');

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`no content cut off at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await page.goto('/add');
      await expect(page.getByLabel('Event Name')).toBeVisible();

      await runMobileChecks(page);
    });
  }

  test('form buttons are visible and not clipped at 320px', async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/add');

    const cancelBtn = page.getByRole('link', { name: 'Cancel' });
    const addBtn = page.getByRole('button', { name: 'Add Event' });

    await addBtn.scrollIntoViewIfNeeded();
    await expect(cancelBtn).toBeVisible();
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeInViewport();
  });

  test('all form fields fit within viewport at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/add');

    for (const label of [
      'Event Name',
      'When did it happen?',
      'Remind me after (days)'
    ]) {
      const input = page.getByLabel(label);
      await input.scrollIntoViewIfNeeded();
      await expect(input).toBeVisible();

      const box = await input.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(
          box.x + box.width,
          `${label} exceeds viewport`
        ).toBeLessThanOrEqual(320 + 1);
      }
    }
  });
});

test.describe('Mobile responsiveness – Admin (authenticated)', () => {
  test.use({ storageState: authFile });
  test.skip(() => !hasAuth, 'Skipped: auth credentials not provided');

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`no content cut off at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await page.goto('/admin');
      await expect(
        page.getByRole('heading', { name: 'Admin Controls' })
      ).toBeVisible();

      await runMobileChecks(page);
    });
  }
});

test.describe('Mobile responsiveness – Customers (authenticated)', () => {
  test.use({ storageState: authFile });
  test.skip(() => !hasAuth, 'Skipped: auth credentials not provided');

  for (const viewport of MOBILE_VIEWPORTS) {
    test(`no content cut off at ${viewport.label} (${viewport.width}x${viewport.height})`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      await page.goto('/customers');
      await expect(
        page.getByRole('heading', { name: 'Customers' })
      ).toBeVisible();

      await runMobileChecks(page);
    });
  }
});
