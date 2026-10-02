import { test, expect } from '@playwright/test';

// Design tokens from src/pages/login.astro scoped styles
const FOCUS_BORDER = 'rgb(212, 175, 106)'; // gold #d4af6a
const PAGE_BG = 'rgb(0, 0, 0)'; // pure black

test.describe('Login Page', () => {
  test('renders login page correctly', async ({ page }) => {
    await page.goto('/Webbyss/login');

    // Verify hero section
    await expect(page.locator('h1')).toHaveText("Webby's BarberShop");
    await expect(page.locator('p')).toContainText('Bienvenido de nuevo');

    // Verify logo is present (resilient locator, no hardcoded src)
    await expect(page.locator(`img[alt="Webby's BarberShop"]`)).toBeVisible();

    // Verify the scoped stylesheet actually applied (catches "unstyled page" regressions)
    await expect(page.locator('.page')).toHaveCSS('background-color', PAGE_BG);

    // Verify form fields exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verify form labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Verify buttons and links
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();

    // Verify input types and attributes
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(emailInput).toHaveAttribute('placeholder', 'ejemplo@barbershop.com');

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    await expect(passwordInput).toHaveAttribute('placeholder', 'Tu contraseña');
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    await page.goto('/Webbyss/login');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Form should be accessible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('.login-card')).toBeVisible();

    // Inputs should be usable
    await page.fill('input[type="email"]', 'test@test.com');
    await expect(page.locator('input[type="email"]')).toHaveValue('test@test.com');
  });

  test('responsive design - desktop viewport', async ({ page }) => {
    await page.goto('/Webbyss/login');
    await page.setViewportSize({ width: 1440, height: 900 });

    // Layout should adjust for larger screens
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('focus-visible states', async ({ page }) => {
    await page.goto('/Webbyss/login');
    await page.focus('input[type="email"]');

    // Custom gold focus ring from the scoped styles
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveCSS('border-color', FOCUS_BORDER);
  });

  test('no scroll on short viewports', async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 568 }, // iPhone SE 1st gen
      { width: 360, height: 640 }, // small Android
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/Webbyss/login');

      const overflows = await page.evaluate(
        () => document.documentElement.scrollHeight > document.documentElement.clientHeight,
      );
      expect(overflows, `scroll on ${viewport.width}x${viewport.height}`).toBe(false);
    }
  });

  test('light theme follows device color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/Webbyss/login');

    // Light palette: white card instead of the dark #131a2b
    await expect(page.locator('.page')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    // Darkened gold for AA contrast on white
    await expect(page.locator('button[type="submit"]')).toHaveCSS(
      'background-color',
      'rgb(138, 106, 47)',
    );
  });
});
