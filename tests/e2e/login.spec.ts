import { test, expect } from '@playwright/test';

// Design tokens from src/pages/login.astro scoped styles
const FOCUS_BORDER = 'rgb(212, 175, 106)'; // gold #d4af6a
const CARD_BG = 'rgb(19, 26, 43)'; // card #131a2b

test.describe('Login Page', () => {
  test('renders login page correctly', async ({ page }) => {
    await page.goto('/Webbyss/login');

    // Verify hero section
    await expect(page.locator('h1')).toHaveText('BarberShop');
    await expect(page.locator('p')).toContainText('Bienvenido de nuevo');

    // Verify logo is present (resilient locator, no hardcoded src)
    await expect(page.locator('img[alt="BarberShop"]')).toBeVisible();

    // Verify the scoped stylesheet actually applied (catches "unstyled page" regressions)
    await expect(page.locator('.login-card')).toHaveCSS('background-color', CARD_BG);

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
});
