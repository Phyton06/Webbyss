import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('renders login page correctly', async ({ page }) => {
    await page.goto('http://localhost:4321/login');

    // Verify hero section
    await expect(page.locator('h1')).toHaveText('BarberShop');
    await expect(page.locator('p')).toContainText('Bienvenido de nuevo');

    // Verify logo is present
    await expect(page.locator('img[src="/assets/logo.jpeg"]')).toBeVisible();

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
    await page.goto('http://localhost:4321/login');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Form should be accessible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('.login-card')).toBeVisible();

    // Inputs should be usable
    await page.fill('input[type="email"]', 'test@test.com');
    await expect(page.locator('input[type="email"]')).toHaveValue('test@test.com');
  });

  test('responsive design - desktop viewport', async ({ page }) => {
    await page.goto('http://localhost:4321/login');
    await page.setViewportSize({ width: 1440, height: 900 });

    // Layout should adjust for larger screens
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('focus-visible states', async ({ page }) => {
    await page.goto('http://localhost:4321/login');
    await page.focus('input[type="email"]');

    // Should have focus styling after focusing
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveCSS('border-color', 'rgb(118, 118, 118)');
  });
});