import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/Webbyss/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('admin');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/hola, admin/i)).toBeVisible();
}

async function createClient(
  page: import('@playwright/test').Page,
  name: string,
  phone: string,
) {
  await page.goto('/Webbyss/admin/nuevo-cliente');
  await page.getByLabel('Nombre', { exact: true }).fill(name);
  await page.getByLabel('Teléfono', { exact: true }).fill(phone);
  await page.getByRole('button', { name: 'Guardar cliente' }).click();
  // Alta never navigates on its own — it hands over the share link first.
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-cliente/);
  await expect(page.getByRole('heading', { level: 1, name: 'Cliente registrado' })).toBeVisible();
  await page.getByRole('link', { name: 'Ver la ficha del cliente' }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/cliente\?id=/);
  await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible();
}

test('list shows the seeded clients under Activos, with no Baneados group yet', async ({
  page,
}) => {
  await login(page);
  await page.goto('/Webbyss/admin/clientes');

  await expect(page.getByRole('heading', { level: 1, name: 'Clientes', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Activos', exact: true }),
  ).toBeVisible();
  // Nobody is banned on a fresh install, so the group renders nothing at all.
  await expect(
    page.getByRole('heading', { level: 2, name: 'Baneados', exact: true }),
  ).toHaveCount(0);

  // The three demo clients …
  for (const name of ['Lucía Márquez', 'Facundo Rivas', 'Camila Ortega']) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
  // … plus the roster derived from the appointments store.
  await expect(page.getByRole('link', { name: /Ezequiel Duarte/ })).toBeVisible();
  await expect(page.getByRole('link').filter({ hasText: /5555-00/ })).toHaveCount(14);
});

test('search filters the list by name and by phone', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/clientes');

  const search = page.getByLabel('Buscar cliente', { exact: true });
  const rows = page.getByRole('link').filter({ hasText: /5555-00/ });
  const total = await rows.count();
  expect(total).toBeGreaterThan(3);

  await search.fill('lucía');
  await expect(rows).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Lucía Márquez/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Ezequiel/ })).toHaveCount(0);

  await search.fill('0005');
  await expect(rows).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Ezequiel Duarte/ })).toBeVisible();

  await search.fill('');
  await expect(rows).toHaveCount(total);
});

test('alta validates nombre/teléfono and hands over a shareable registration link', async ({
  page,
}) => {
  await login(page);
  await page.goto('/Webbyss/admin/nuevo-cliente');
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo cliente' })).toBeVisible();

  await page.getByRole('button', { name: 'Guardar cliente' }).click();
  await expect(page.getByText('Ingresá el nombre.')).toBeVisible();

  await page.getByLabel('Nombre', { exact: true }).fill('Cliente De Prueba');
  await page.getByRole('button', { name: 'Guardar cliente' }).click();
  await expect(page.getByText('Ingresá el teléfono.')).toBeVisible();
  await expect(page.getByText('Ingresá el nombre.')).toBeHidden();

  await page.getByLabel('Teléfono', { exact: true }).fill('+54 9 11 5555-7777');
  await page.getByRole('button', { name: 'Guardar cliente' }).click();

  // No auto-navigation: the admin's next move is sending the link, not browsing.
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-cliente/);
  await expect(page.getByRole('heading', { level: 1, name: 'Cliente registrado' })).toBeVisible();
  await expect(page.getByText('Cliente De Prueba')).toBeVisible();

  const origin = new URL(page.url()).origin;
  await expect(page.getByLabel('Link de registro', { exact: true })).toHaveValue(
    `${origin}/Webbyss/registro?nombre=Cliente%20De%20Prueba&tel=%2B54%209%2011%205555-7777`,
  );
  await expect(page.getByRole('button', { name: 'Copiar link' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir el link' })).toBeVisible();

  // The profile is one explicit click away, never followed automatically.
  await page.getByRole('link', { name: 'Ver la ficha del cliente' }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/cliente\?id=/);
  await expect(page.getByRole('heading', { level: 1, name: 'Cliente De Prueba' })).toBeVisible();
});

test('an unknown id shows a fallback message instead of a blank page', async ({ page }) => {
  await login(page);

  await page.goto('/Webbyss/admin/cliente?id=does-not-exist');
  await expect(
    page.getByRole('heading', { level: 1, name: /No encontramos ese cliente/ }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Volver a clientes/ })).toBeVisible();

  await page.goto('/Webbyss/admin/nuevo-cliente?id=does-not-exist');
  await expect(
    page.getByRole('heading', { level: 1, name: /No encontramos ese cliente/ }),
  ).toBeVisible();
});

test('Editar prefills the form and submitting updates the record', async ({ page }) => {
  await login(page);
  await createClient(page, 'Cliente Editable', '+54 9 11 5555-6666');

  await page.getByRole('link', { name: 'Editar', exact: true }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-cliente\?id=/);
  await expect(page.getByRole('heading', { level: 1, name: 'Editar cliente' })).toBeVisible();
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Cliente Editable');
  await expect(page.getByLabel('Teléfono', { exact: true })).toHaveValue('+54 9 11 5555-6666');

  await page.getByLabel('Nombre', { exact: true }).fill('Cliente Editable v2');
  await page.getByRole('button', { name: 'Guardar cliente' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Cliente Editable v2' })).toBeVisible();
});

test('banear cancels pending bookings, keeps history, and Desbanear restores the chip', async ({
  page,
}) => {
  await login(page);
  await page.goto('/Webbyss/admin/clientes');
  await page.getByRole('link', { name: /Ezequiel Duarte/ }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/cliente\?id=/);

  // The consequence is stated before the admin commits to it.
  await expect(page.getByText(/Al banear se cancelan sus citas pendientes/)).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Banear', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Desbanear' })).toBeVisible();
  await expect(page.getByText('Activo', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Baneado', { exact: true })).toBeVisible();
  await expect(page.getByText('Cancelado', { exact: true })).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Banear', exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Desbanear' }).click();
  await expect(page.getByText('Activo', { exact: true })).toBeVisible();
  // Unbanning never resurrects a cancelled booking.
  await expect(page.getByText('Cancelado', { exact: true })).toBeVisible();
});

test('banear leaves Atendido history untouched', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/clientes');
  await page.getByRole('link', { name: /Martín López/ }).click();

  await expect(page.getByText('Atendido', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Banear', exact: true }).click();

  await expect(page.getByText('Baneado', { exact: true })).toBeVisible();
  await expect(page.getByText('Atendido', { exact: true })).toBeVisible();
});

test('comments can be added and removed, empty ones are rejected', async ({ page }) => {
  await login(page);
  await createClient(page, 'Cliente Comentarios', '+54 9 11 5555-8888');
  await expect(page.getByText('Sin comentarios todavía.')).toBeVisible();

  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('Ingresá un comentario.')).toBeVisible();
  await expect(page.getByText('Sin comentarios todavía.')).toBeVisible();

  await page.getByLabel('Nuevo comentario', { exact: true }).fill('no llega a tiempo');
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('no llega a tiempo')).toBeVisible();
  await expect(page.getByText('Ingresá un comentario.')).toBeHidden();

  await page.getByRole('button', { name: /Borrar comentario/ }).click();
  await expect(page.getByText('Sin comentarios todavía.')).toBeVisible();
});

test('a banned client shows greyed out and unselectable in nueva-cita', async ({ page }) => {
  await login(page);
  await createClient(page, 'Cliente Wizard', '+54 9 11 5555-9999');

  await page.getByRole('button', { name: 'Banear', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Desbanear' })).toBeVisible();
  await page.getByLabel('Nuevo comentario', { exact: true }).fill('es agresivo');
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(page.getByText('es agresivo')).toBeVisible();

  await page.goto('/Webbyss/admin/nueva-cita');
  await page.locator('#client-query').fill('Cliente Wizard');

  const banned = page.locator('#client-rows .search-item[data-banned]').filter({
    hasText: 'Cliente Wizard',
  });
  await expect(banned).toHaveCount(1);
  await expect(banned).toBeDisabled();
  await expect(banned).toContainText('BANEADO');
  // The latest comment rides along so whoever books can read it first.
  await expect(banned).toContainText('es agresivo');

  await banned.click({ force: true });
  await expect(page.locator('#selected-client')).toBeHidden();

  // An active client is still pickable — the guard is not over-broad.
  await page.locator('#client-query').fill('Lucía');
  const active = page.locator('#client-rows .search-item:not([data-banned])').first();
  await expect(active).toBeVisible();
  await expect(active).toBeEnabled();
});

test('appointments of a banned client carry a warning flag in the agenda', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/clientes');
  await page.getByRole('link', { name: /Martín López/ }).click();
  await page.getByRole('button', { name: 'Banear', exact: true }).click();
  await expect(page.getByText('Baneado', { exact: true })).toBeVisible();

  // Martín's seeded appointment is today, and the agenda opens on today.
  await page.goto('/Webbyss/admin/agenda');
  await expect(page.getByText(/BANEADO/)).toBeVisible();
});

test('bottom nav marks Clientes on the list and on the profile', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/clientes');

  const nav = page.getByRole('navigation', { name: 'Secciones del admin' });
  await expect(
    nav.getByRole('link', { name: 'Clientes', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Ajustes', exact: true })).toHaveCount(0);

  await page.getByRole('link', { name: /Lucía Márquez/ }).click();
  await expect(
    nav.getByRole('link', { name: 'Clientes', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
});
