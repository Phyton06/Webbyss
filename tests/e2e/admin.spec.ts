import { test, expect } from '@playwright/test';

test('admin login with wrong password shows inline error', async ({ page }) => {
  await page.goto('/Webbyss/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('wrong-pass');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/credenciales inválidas/i)).toBeVisible();
});

test('admin login success shows home greeting and CTA', async ({ page }) => {
  await page.goto('/Webbyss/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('admin');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/hola, admin/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /nueva cita/i })).toBeVisible();
});

async function login(page: import('@playwright/test').Page) {
  await page.goto('/Webbyss/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('admin');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/hola, admin/i)).toBeVisible();
}

test('home shows per-barber upcoming sections, Pendientes KPI and full-agenda CTA', async ({
  page,
}) => {
  await login(page);
  await expect(page.getByRole('heading', { name: /pr[oó]ximas citas/i })).toBeVisible();

  // Revision 4 delta 4: every barber section always holds at least one card
  // (the relative-date seed guarantees upcoming appointments for all 3).
  for (const barber of ['Carlos', 'Diego', 'Miguel']) {
    const section = page.getByRole('region', { name: barber, exact: true });
    await expect(section).toBeVisible();
    await expect(section.getByRole('listitem').first()).toBeVisible();
  }

  await expect(page.getByText('Pendientes', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Walk-ins');
  await expect(page.getByRole('link', { name: /ver agenda completa/i })).toBeVisible();

  // Revisions 3/4: the global empty state is gone for good.
  await expect(page.getByText('Sin más citas hoy')).toHaveCount(0);
});

test('full-agenda link opens calendar with barber dropdown and estado select', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('link', { name: /ver agenda completa/i }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/agenda\/?$/);

  // Month calendar: Spanish month heading + prev/next controls.
  const monthName = new Date().toLocaleDateString('es-AR', { month: 'long' });
  await expect(page.getByRole('heading', { name: new RegExp(monthName, 'i') })).toBeVisible();
  await expect(page.getByRole('button', { name: /mes anterior/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /mes siguiente/i })).toBeVisible();

  // M3 exposed-dropdown (Revision 6): panels float over the page —
  // opening them must NOT push the day agenda down.
  // (page-absolute y: boundingBox is viewport-relative and scroll-shifts)
  const agendaY = () =>
    page
      .locator('#view-date')
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const agendaYBefore = await agendaY();

  // Barberos = dropdown checklist (Revision 4 delta 1a): trigger + panel.
  const barberTrigger = page.getByRole('button', { name: /^Barberos/ });
  await expect(barberTrigger).toBeVisible();
  await expect(barberTrigger).toHaveAttribute('aria-expanded', 'false');
  await barberTrigger.click();
  await expect(barberTrigger).toHaveAttribute('aria-expanded', 'true');
  expect(await agendaY()).toBe(await agendaYBefore);

  const panel = page.getByRole('group', { name: 'Barberos' });
  for (const name of ['Todos', 'Carlos', 'Diego', 'Miguel']) {
    await expect(panel.getByRole('checkbox', { name, exact: true })).toBeVisible();
  }

  // Real checkboxes: Carlos starts checked, can be unchecked and re-checked.
  const todos = panel.getByRole('checkbox', { name: 'Todos', exact: true });
  const carlos = panel.getByRole('checkbox', { name: 'Carlos', exact: true });
  const diego = panel.getByRole('checkbox', { name: 'Diego', exact: true });
  const miguel = panel.getByRole('checkbox', { name: 'Miguel', exact: true });
  await expect(carlos).toBeChecked();
  await carlos.uncheck();
  await expect(carlos).not.toBeChecked();
  await carlos.check();
  await expect(carlos).toBeChecked();

  // Multi-select semantics: never 0 barbers (last one is guarded) …
  await carlos.uncheck();
  await diego.uncheck();
  await expect(miguel).toBeChecked();
  await miguel.click(); // guarded: stays checked instead of emptying the set
  await expect(miguel).toBeChecked();
  await expect(todos).not.toBeChecked();
  // … trigger label follows the selection (rule: first name + "+ n") …
  await expect(barberTrigger).toContainText('Miguel');
  // … and checking Todos checks all three again.
  await todos.check();
  await expect(carlos).toBeChecked();
  await expect(diego).toBeChecked();
  await expect(miguel).toBeChecked();
  await expect(barberTrigger).toContainText('Todos');

  // Estado = styled single-select dropdown (custom panel; the native select's
  // open popup is OS-rendered and cannot be themed — Revision 5).
  const estadoTrigger = page.getByRole('button', { name: /^Estado/ });
  await expect(estadoTrigger).toBeVisible();
  await expect(estadoTrigger).toHaveAttribute('aria-expanded', 'false');
  await estadoTrigger.click();
  await expect(estadoTrigger).toHaveAttribute('aria-expanded', 'true');
  expect(await agendaY()).toBe(await agendaYBefore);
  const estadoPanel = page.getByRole('group', { name: 'Estado' });
  for (const name of ['Todos', 'Pendiente', 'Confirmada', 'Atendido', 'Cancelado', 'Disponible']) {
    await expect(estadoPanel.getByRole('radio', { name, exact: true })).toBeVisible();
  }
  // Todos starts checked; choosing Disponible switches to free slots only.
  await expect(estadoPanel.getByRole('radio', { name: 'Todos', exact: true })).toBeChecked();
  await estadoPanel.getByRole('radio', { name: 'Disponible', exact: true }).check();
  await expect(estadoTrigger).toContainText('Disponible');
  // Unified rendering (Revision 7): free slots are day-block cards in the
  // SAME timeline as appointments; the old chip block is gone for good.
  await expect(page.locator('#day-body .day-block', { hasText: 'Libre' }).first()).toBeVisible();
  await expect(page.locator('#free-slots')).toHaveCount(0);
  await expect(page.locator('.free-chip')).toHaveCount(0);
  // Single-select dropdowns close on pick — reopen, then back to Todos.
  await expect(estadoTrigger).toHaveAttribute('aria-expanded', 'false');
  await estadoTrigger.click();
  await estadoPanel.getByRole('radio', { name: 'Todos', exact: true }).check();
  await expect(page.locator('.day-block').first()).toBeVisible();

  // Revision 4 delta 1: the filter-chip groups/buttons are gone for good.
  await expect(page.getByRole('group', { name: 'Filtros de estado' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Todos', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pendiente', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Atendido', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cancelado', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Disponible', exact: true })).toHaveCount(0);

  // Revision 3 delta 2: the Día|Semana|Mes toggle and week strip are gone.
  await expect(page.getByText('Semana', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Día', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Semana', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mes', exact: true })).toHaveCount(0);
});
