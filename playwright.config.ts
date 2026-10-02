import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:4321',
    headless: true,
  },
  webServer: {
    command: 'npm run preview -- --port 4321',
    // With base: '/Webbyss' the site root returns 404, so probe a real page.
    url: 'http://localhost:4321/Webbyss/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
