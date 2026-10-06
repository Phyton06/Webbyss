import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/Webbyss/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('admin');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/hola, admin/i)).toBeVisible();
}

test('list shows the 5 seeded employees grouped under the three role headings', async ({
  page,
}) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');

  for (const role of ['Administración', 'Barberos', 'Asistentes']) {
    await expect(
      page.getByRole('heading', { level: 2, name: role, exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(3);

  // Seeded barbers keep the exact first names the appointments store joins on.
  for (const barber of ['Carlos', 'Diego', 'Miguel']) {
    await expect(page.getByRole('link', { name: barber })).toBeVisible();
  }
  // 5 rows carry a demo phone …
  await expect(page.getByRole('link').filter({ hasText: /5555-00/ })).toHaveCount(5);
  // … and 3 of them are barbers.
  await expect(page.getByRole('link').filter({ hasText: /Barbero/ })).toHaveCount(3);
});

test('search filters the list by name and by phone', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');

  const search = page.getByLabel('Buscar personal', { exact: true });

  await search.fill('diego');
  await expect(page.getByRole('link').filter({ hasText: /5555-00/ })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Diego/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Carlos/ })).toHaveCount(0);

  await search.fill('0016');
  await expect(page.getByRole('link').filter({ hasText: /5555-00/ })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Carlos/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Diego/ })).toHaveCount(0);

  await search.fill('');
  await expect(page.getByRole('link').filter({ hasText: /5555-00/ })).toHaveCount(5);
});

test('detail shows icon-only communication actions with aria-labels', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');
  await page.getByRole('link', { name: /Carlos/ }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/empleado\?id=/);

  await expect(page.getByRole('heading', { level: 1, name: /Carlos/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '← Personal' })).toHaveAttribute(
    'href',
    '/Webbyss/admin/empleados',
  );

  // Icon-only: no visible text, the accessible name comes from aria-label.
  const llamar = page.getByRole('link', { name: /llamar/i });
  const whatsapp = page.getByRole('link', { name: /whatsapp/i });

  await expect(llamar).toHaveAttribute('href', /^tel:/);
  await expect(llamar).toHaveAttribute('aria-label', /\S/);
  await expect(llamar).toHaveText('');

  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+$/);
  await expect(whatsapp).toHaveAttribute('aria-label', /\S/);
  await expect(whatsapp).toHaveText('');

  // ≥44 × 44 px targets (WCAG 2.5.5).
  for (const action of [llamar, whatsapp]) {
    const box = (await action.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }

  await expect(page.getByText(/Teléfono/i).first()).toBeVisible();
  await expect(page.getByText(/Horario/i).first()).toBeVisible();
});

test('Desactivar sits below Editar in the bottom block and flips status', async ({
  page,
}) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');
  await page.getByRole('link', { name: /Carlos/ }).click();

  const editar = page.getByRole('link', { name: /editar/i });
  const desactivar = page.getByRole('button', { name: 'Desactivar', exact: true });

  await expect(editar).toHaveAttribute(
    'href',
    /\/Webbyss\/admin\/nuevo-empleado\?id=/,
  );
  await expect(desactivar).toBeVisible();
  // Renamed: the old label is gone.
  await expect(page.getByRole('button', { name: /dar de baja/i })).toHaveCount(0);

  // Both mutations share one block, placed right after the cards (last child).
  const structure = await editar.evaluate(() => {
    const detail = document.getElementById('detail')!;
    const editLink = detail.querySelector<HTMLAnchorElement>('a[href*="nuevo-empleado"]')!;
    const block = editLink.parentElement!;
    return {
      sameParent: block.contains(document.getElementById('deactivate')),
      followsCard: block.previousElementSibling?.classList.contains('card') ?? false,
      last: block === detail.lastElementChild,
      fullWidth: block.getBoundingClientRect().width > 300,
    };
  });
  expect(structure).toEqual({
    sameParent: true,
    followsCard: true,
    last: true,
    fullWidth: true,
  });

  // Breathing room between Editar and Desactivar (CSS gap = 16px).
  const editarBox = (await editar.boundingBox())!;
  const desactivarBox = (await desactivar.boundingBox())!;
  const gap = desactivarBox.y - (editarBox.y + editarBox.height);
  expect(gap).toBeGreaterThan(12);

  await desactivar.click();
  await expect(page.getByRole('button', { name: 'Desactivar', exact: true })).toHaveCount(0);
  await expect(page.getByText('Baja', { exact: true }).first()).toBeVisible();

  await page.goto('/Webbyss/admin/empleados');
  // Deactivated, never deleted: the record is still in the list …
  await expect(page.getByRole('link').filter({ hasText: /5555-00/ })).toHaveCount(5);
  // … and the row itself announces the new status.
  await expect(page.getByRole('link', { name: /Carlos/ })).toHaveAccessibleName(/Baja/);
});

test('an unknown id shows a fallback message instead of a blank page', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleado?id=nope');
  await expect(
    page.getByRole('heading', { level: 1, name: /no encontramos ese empleado/i }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /volver a personal/i })).toBeVisible();
});

test('alta takes only nombre/teléfono/rol and hands over a working completion URL', async ({
  page,
}) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');

  await page.getByRole('link', { name: /agregar empleado/i }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-empleado\/?$/);

  // Exactly three fields visible; the edición-only extras are not offered.
  await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Teléfono', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^rol/i })).toBeVisible();
  await expect(page.getByLabel('Correo', { exact: true })).not.toBeVisible();
  await expect(page.locator('#field-start')).not.toBeVisible();
  await expect(page.locator('#field-schedule')).not.toBeVisible();

  await page.getByLabel('Nombre', { exact: true }).fill('Paula Ruiz');
  await page.getByLabel('Teléfono', { exact: true }).fill('+54 9 11 5555-0020');
  await page.getByRole('button', { name: /^rol/i }).click();
  await page.getByRole('radio', { name: 'Asistentes' }).check();
  await page.getByRole('button', { name: /guardar empleado/i }).click();

  // No redirect: the result screen replaces the form on the same page.
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-empleado\/?$/);
  const shareUrl = await page.getByLabel('Link de registro').inputValue();
  expect(shareUrl).toMatch(/\/Webbyss\/registro\?/);
  expect(shareUrl).toContain('empleado=');
  expect(shareUrl).toContain(`nombre=${encodeURIComponent('Paula Ruiz')}`);
  expect(shareUrl).toContain(`tel=${encodeURIComponent('+54 9 11 5555-0020')}`);
  expect(shareUrl).toContain('rol=Asistente');

  // The copy control reports success (clipboard or select-all fallback).
  await page.getByRole('button', { name: /copiar link/i }).click();
  await expect(page.locator('#copy-status')).toBeVisible();

  // Opening the emitted URL lands in employee mode …
  await page.goto(shareUrl);
  const nombre = page.getByLabel('Nombre y apellido');
  const tel = page.getByLabel('Teléfono', { exact: true });
  const rol = page.getByLabel('Rol', { exact: true });
  await expect(nombre).toHaveValue('Paula Ruiz');
  await expect(nombre).not.toBeEditable();
  await expect(tel).toHaveValue('+54 9 11 5555-0020');
  await expect(tel).not.toBeEditable();
  await expect(rol).toHaveValue('Asistente');
  await expect(rol).not.toBeEditable();
  await expect(page.getByLabel('Horario de trabajo')).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();

  // … and submitting it lands schedule + email on the record.
  await page.getByLabel('Horario de trabajo').fill('Lun a Vie · 10–18 h');
  await page.getByLabel('Correo electrónico').fill('paula@barber.com');
  await page.getByLabel('Contraseña').fill('secreto123');
  await page.getByRole('button', { name: /completar registro/i }).click();
  await expect(page.locator('#registro-ok')).toBeVisible();

  await page.goto('/Webbyss/admin/empleados');
  await page.getByRole('link', { name: /Paula Ruiz/ }).click();
  await expect(page.getByText('Lun a Vie · 10–18 h')).toBeVisible();
  await expect(page.getByText('paula@barber.com')).toBeVisible();
});

test('registration without the empleado param keeps the client flow untouched', async ({
  page,
}) => {
  const nombre = 'Lucía Márquez';
  const tel = '+54 9 11 5555-0044';
  await page.goto(
    `/Webbyss/registro?nombre=${encodeURIComponent(nombre)}&tel=${encodeURIComponent(tel)}`,
  );

  await expect(page.locator('#reg-nombre')).toHaveValue(nombre);
  await expect(page.locator('#reg-nombre')).not.toBeEditable();
  await expect(page.locator('#reg-tel')).toHaveValue(tel);
  await expect(page.locator('#reg-tel')).not.toBeEditable();

  // Employee-only fields never surface on the client path.
  await expect(page.getByLabel('Rol', { exact: true })).not.toBeVisible();
  await expect(page.getByLabel('Horario de trabajo')).not.toBeVisible();

  await page.locator('#reg-email').fill('lucia@example.com');
  await page.locator('#reg-password').fill('secreto123');
  await page.locator('#registro-form button[type="submit"]').click();
  await expect(page.locator('#registro-ok')).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('webbys_registered_clients') || '[]'),
  );
  expect(stored).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ nombre, tel, email: 'lucia@example.com' }),
    ]),
  );
});

test('an unknown empleado id shows a visible message instead of failing silently', async ({
  page,
}) => {
  await page.goto(
    '/Webbyss/registro?nombre=Ana%20P%C3%A9rez&tel=%2B5491155550099&rol=Barbero&empleado=nope',
  );
  await expect(page.getByText(/no encontramos ese empleado/i)).toBeVisible();
  await expect(page.locator('#registro-form')).toBeHidden();
});

test('Editar prefills the form and submitting updates the record', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');
  await page.getByRole('link', { name: /Ana Ledesma/ }).click();
  await page.getByRole('link', { name: /Editar/ }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-empleado\?id=/);

  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Ana Ledesma');
  await page.getByLabel('Teléfono', { exact: true }).fill('+54 9 11 5555-0021');
  await page.getByRole('button', { name: /guardar empleado/i }).click();

  await expect(page).toHaveURL(/\/Webbyss\/admin\/empleado\?id=/);
  await expect(page.getByText('+54 9 11 5555-0021')).toBeVisible();
});

test('edición reuses the app patterns: dropdown, month calendar, selectable horario', async ({
  page,
}) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');
  await page.getByRole('link', { name: /Carlos Núñez/ }).click();
  await page.getByRole('link', { name: /Editar/ }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-empleado\?id=/);

  // No native controls left behind.
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.locator('input[type="date"]')).toHaveCount(0);

  // 1 — Rol: M3 exposed dropdown (same markup as admin/agenda).
  const roleTrigger = page.getByRole('button', { name: /^rol/i });
  await expect(roleTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(roleTrigger).toContainText('Barberos'); // Carlos → barbero
  await roleTrigger.click();
  await expect(roleTrigger).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('radio', { name: 'Administración' }).check();
  await expect(roleTrigger).toHaveAttribute('aria-expanded', 'false'); // single-select closes
  await expect(roleTrigger).toContainText('Administración');
  await roleTrigger.click(); // reopen for the outside-tap assertion
  await page.locator('#form-title').click();
  await expect(roleTrigger).toHaveAttribute('aria-expanded', 'false');

  // 2 — Fecha de ingreso: month calendar, prefilled from the record.
  const calTitle = page.locator('#start-title');
  await expect(calTitle).toHaveText('junio 2021');
  await expect(page.locator('#start-grid .cal-cell.is-selected')).toHaveCount(1);
  await page.getByRole('button', { name: 'Mes siguiente' }).click();
  await expect(calTitle).toHaveText('julio 2021');
  await page.getByRole('button', { name: 'Mes anterior' }).click();
  await expect(calTitle).toHaveText('junio 2021');

  // 3 — Horario: days and hours are picked, never typed ('Mar a Sáb · 9–19 h').
  await expect(page.locator('.sched-block')).toHaveCount(1);
  await expect(page.locator('.day-chip')).toHaveCount(7);
  await expect(page.locator('.day-chip[aria-pressed="true"]')).toHaveCount(5); // mar..sáb
  await expect(page.locator('[data-hour-value="0:from"]')).toHaveText('9 h');
  await expect(page.locator('[data-hour-value="0:to"]')).toHaveText('19 h');

  // Both pickers are collapsed into a single 44px row, not two 200px grids.
  await expect(page.locator('.sched-times')).toHaveCSS('height', '44px');
  await expect(page.locator('#schedule-blocks .filter-panel[hidden]')).toHaveCount(2);

  // … and the selection composes back into the legacy display string.
  await page.locator('[data-day="0:6"]').click(); // + Dom → mar..dom
  await page.locator('[data-hour-trigger="0:to"]').click();
  await expect(page.locator('#hour-panel-0-to')).toBeVisible();
  await page.locator('[data-hour="0:to:20"]').click();
  await expect(page.locator('#hour-panel-0-to')).not.toBeVisible();
  await expect(page.locator('[data-hour-value="0:to"]')).toHaveText('20 h');
  expect(await page.locator('#f-schedule').inputValue()).toBe('Mar a Dom · 9–20 h');

  await page.getByRole('button', { name: /guardar empleado/i }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/empleado\?id=/);
  await expect(page.getByText('Mar a Dom · 9–20 h')).toBeVisible();
});

test('several schedules per employee: add, edit, round-trip, remove', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');
  await page.getByRole('link', { name: /Carlos Núñez/ }).click();
  await page.getByRole('link', { name: /Editar/ }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/nuevo-empleado\?id=/);

  // A lone block has no remove control — you can't end up with zero shifts.
  await expect(page.locator('.sched-block')).toHaveCount(1);
  await expect(page.locator('.sched-remove')).toHaveCount(0);

  await page.getByRole('button', { name: /agregar otro horario/i }).click();
  await expect(page.locator('.sched-block')).toHaveCount(2);
  await expect(page.locator('.pick-label')).toHaveText(['Horario 1', 'Horario 2']);
  await expect(page.locator('.sched-remove')).toHaveCount(2);

  // Second block: Sáb + Dom, 10–14.
  await page.locator('[data-day="1:5"]').click();
  await page.locator('[data-day="1:6"]').click();
  await page.locator('[data-hour-trigger="1:from"]').click();
  await page.locator('[data-hour="1:from:10"]').click();
  await page.locator('[data-hour-trigger="1:to"]').click();
  await page.locator('[data-hour="1:to:14"]').click();

  expect(await page.locator('#f-schedule').inputValue()).toBe(
    'Mar a Sáb · 9–19 h; Sáb, Dom · 10–14 h',
  );

  await page.getByRole('button', { name: /guardar empleado/i }).click();
  await expect(page).toHaveURL(/\/Webbyss\/admin\/empleado\?id=/);
  await expect(page.getByText('Mar a Sáb · 9–19 h; Sáb, Dom · 10–14 h')).toBeVisible();

  // Editing again rebuilds both blocks from that single stored string.
  await page.getByRole('link', { name: /Editar/ }).click();
  await expect(page.locator('.sched-block')).toHaveCount(2);
  await expect(page.locator('[data-day="1:5"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-hour-value="1:from"]')).toHaveText('10 h');

  await page.locator('[data-remove="0"]').click();
  await expect(page.locator('.sched-block')).toHaveCount(1);
  await expect(page.locator('.sched-remove')).toHaveCount(0);
  await expect(page.locator('.pick-label')).toHaveText(['Horario 1']);
  expect(await page.locator('#f-schedule').inputValue()).toBe('Sáb, Dom · 10–14 h');
});

test('Hasta only offers hours that close strictly after Desde', async ({ page }) => {
  await login(page);
  await page.goto('/Webbyss/admin/empleados');
  await page.getByRole('link', { name: /Carlos Núñez/ }).click();
  await page.getByRole('link', { name: /Editar/ }).click();
  await expect(page.locator('[data-hour-value="0:from"]')).toHaveText('9 h');

  // 9–8 and 9–9 are both invalid: the closing hour must come strictly after.
  await page.locator('[data-hour-trigger="0:to"]').click();
  await expect(page.locator('#hour-panel-0-to .time-chip[disabled]')).toHaveCount(2);
  await expect(page.locator('[data-hour="0:to:8"]')).toBeDisabled();
  await expect(page.locator('[data-hour="0:to:9"]')).toBeDisabled();
  await expect(page.locator('[data-hour="0:to:10"]')).toBeEnabled();
  await page.locator('[data-hour-trigger="0:to"]').click();

  // Moving the start forward drags the closing hour with it.
  await page.locator('[data-hour-trigger="0:from"]').click();
  await page.locator('[data-hour="0:from:19"]').click();
  await expect(page.locator('[data-hour-value="0:to"]')).toHaveText('20 h');
  expect(await page.locator('#f-schedule').inputValue()).toContain('19–20 h');

  // The last hour can never open a shift — nothing would be left to close with.
  await page.locator('[data-hour-trigger="0:from"]').click();
  await expect(page.locator('[data-hour="0:from:20"]')).toBeDisabled();
});

test('bottom nav is present on the four admin pages and absent on nueva-cita', async ({
  page,
}) => {
  await login(page);
  const nav = page.getByRole('navigation', { name: 'Secciones del admin' });

  await expect(nav).toBeVisible();
  await expect(
    nav.getByRole('link', { name: 'Inicio', exact: true }),
  ).toHaveAttribute('aria-current', 'page');

  await page.goto('/Webbyss/admin/agenda');
  await expect(
    nav.getByRole('link', { name: 'Agenda', exact: true }),
  ).toHaveAttribute('aria-current', 'page');

  await page.goto('/Webbyss/admin/empleados');
  await expect(
    nav.getByRole('link', { name: 'Personal', exact: true }),
  ).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: /Carlos/ }).click();
  await expect(nav).toBeVisible();
  await expect(
    nav.getByRole('link', { name: 'Personal', exact: true }),
  ).toHaveAttribute('aria-current', 'page');

  await page.goto('/Webbyss/admin/nueva-cita');
  await expect(page.getByRole('navigation', { name: 'Secciones del admin' })).toHaveCount(0);
});
