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
      { width: 320, height: 480 }, // tiny phone
      { width: 320, height: 568 }, // iPhone SE 1st gen
      { width: 360, height: 640 }, // small Android
      { width: 640, height: 360 }, // landscape phone
      { width: 1920, height: 500 }, // short desktop window
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

// Unified login gate (odd/tasks/unified-login.md): one login, role-based redirect.
test.describe('Unified login gate', () => {
  async function signIn(
    page: import('@playwright/test').Page,
    email: string,
    password: string,
  ) {
    await page.goto('/Webbyss/login');
    await page.getByLabel(/correo/i).fill(email);
    await page.getByLabel(/contraseña/i).fill(password);
    await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  }

  function session(page: import('@playwright/test').Page) {
    return page.evaluate(() => ({
      role: sessionStorage.getItem('webbys_role'),
      admin: sessionStorage.getItem('webbys_admin'),
    }));
  }

  test('admin credentials land on the admin panel with admin + role session', async ({
    page,
  }) => {
    await signIn(page, 'admin@barber.com', 'admin');
    await expect(page).toHaveURL(/\/Webbyss\/admin\/?$/);
    expect(await session(page)).toEqual({ role: 'admin', admin: '1' });
  });

  for (const [email, password, role] of [
    ['barbero@barber.com', 'barbero', 'barbero'],
    ['asistente@barber.com', 'asistente', 'asistente'],
    ['cliente@barber.com', 'cliente', 'cliente'],
  ]) {
    test(`${role} credentials land on about with role session and no admin flag`, async ({
      page,
    }) => {
      await signIn(page, email, password);
      await expect(page).toHaveURL(/\/Webbyss\/about\/?$/);
      expect(await session(page)).toEqual({ role, admin: null });
    });
  }

  test('wrong password shows inline error and stays on the login page', async ({ page }) => {
    await signIn(page, 'admin@barber.com', 'wrong-pass');
    await expect(page.getByText(/credenciales inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/Webbyss\/login\/?$/);
    expect(await session(page)).toEqual({ role: null, admin: null });
  });

  test('unauthenticated visit to the admin panel redirects to the unified login', async ({
    page,
  }) => {
    await page.goto('/Webbyss/admin/');
    await expect(page).toHaveURL(/\/Webbyss\/login\/?$/);
  });
});
