import { test, expect } from '@playwright/test';

// Wizard "Nueva cita" (Fase 6 T24 + Fase 7 T28): client search →
// registralo/share link → agenda (5-day strip, future hours today) →
// simplified success + detail editor (strip/grid/M3 dropdowns, no native
// date/time/select controls).

type Client = { id: string; name: string; phone: string };
type Appointment = {
  id: string;
  date: string;
  time: string;
  client: string;
  phone: string;
  service: string;
  barber: string;
  status: string;
};

const CLIENTS: Client[] = [
  { id: 'c1', name: 'Martín López', phone: '+54 9 11 5555-0001' },
  { id: 'c2', name: 'Marta Gómez', phone: '+54 9 11 5555-0012' },
  { id: 'c3', name: 'Pedro Díaz', phone: '+54 9 11 5555-0013' },
];

function dayKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/Webbyss/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('admin');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/hola, admin/i)).toBeVisible();
}

/** Seed localStorage after login (fresh context per test) and open the wizard. */
async function openWizard(
  page: import('@playwright/test').Page,
  seed: { clients?: Client[] | null; appointments?: Appointment[] | null } = {},
) {
  await login(page);
  await page.evaluate((data) => {
    if (data.clients) {
      localStorage.setItem('webbys_admin_clients', JSON.stringify(data.clients));
    }
    if (data.appointments) {
      localStorage.setItem(
        'webbys_admin_appointments',
        JSON.stringify(data.appointments),
      );
    }
  }, seed);
  await page.goto('/Webbyss/admin/nueva-cita');
}

/** Pick the first search result and advance to step 2. */
async function pickClientAndContinue(page: import('@playwright/test').Page) {
  await page.locator('#client-query').click();
  await page.locator('#client-results .search-item').first().click();
  await page.locator('#continue-btn').click();
}

/** Step 2 → save at `date`/`time` → expand the success detail editor. */
async function saveAndOpenDetails(
  page: import('@playwright/test').Page,
  date: string,
  time: string,
) {
  await page.locator(`.date-chip[data-key="${date}"]`).click();
  await page.locator(`#time-grid .time-chip[data-time="${time}"]`).click();
  await page.locator('#save-btn').click();
  await page.getByRole('button', { name: /ver detalles/i }).click();
  await expect(page.locator('#details-panel')).toBeVisible();
}

test('step 1 visible, step 2 hidden on load and Continuar disabled', async ({ page }) => {
  // No clients key: the store seeds from the (empty) appointments + 3 demo clients.
  await openWizard(page, { appointments: [] });

  await expect(page.locator('#step-1')).toBeVisible();
  await expect(page.locator('#step-2')).toBeHidden();
  await expect(page.locator('#success')).toBeHidden();
  await expect(page.locator('#continue-btn')).toBeDisabled();

  await page.locator('#client-query').click();
  await expect(page.locator('#client-results .search-item')).toHaveCount(3);
});

test('(a) chip card is absent without a selection and shows once one is picked', async ({
  page,
}) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });

  // No selection → the chip card (and its "Cambiar") is not there at all.
  await expect(page.locator('#selected-client')).toBeHidden();
  await expect(page.locator('#change-client-btn')).toBeHidden();

  // The search keeps its own card in the meantime.
  await expect(page.locator('#client-search')).toBeVisible();

  // With a selection the card appears below the search, "Nombre · teléfono".
  await page.locator('#client-query').click();
  await page.locator('#client-results .search-item').first().click();
  await expect(page.locator('#selected-client')).toBeVisible();
  await expect(page.locator('#selected-client')).toContainText('Martín López');
  await expect(page.locator('#selected-client')).toContainText('+54 9 11 5555-0001');
  await expect(page.locator('#change-client-btn')).toBeVisible();

  // It is a separate card, not a child of the search card.
  const isChild = await page.evaluate(
    () => !!document.querySelector('#client-search')?.contains(document.querySelector('#selected-client')),
  );
  expect(isChild).toBe(false);
});

test('results panel lists rows only and offers "¿No lo encuentras? Registralo"', async ({
  page,
}) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });

  await page.locator('#client-query').click();
  await expect(page.locator('#client-results .search-item')).toHaveCount(3);

  // No inline add form anymore: neither the trigger nor the form exist.
  await expect(page.locator('#add-client-btn')).toHaveCount(0);
  await expect(page.locator('#add-client-form')).toHaveCount(0);

  // Footer entry point to the dedicated add-client flow.
  await expect(page.getByRole('button', { name: /no lo encuentras/i })).toBeVisible();

  // Rows still carry name + phone only.
  await expect(page.locator('#client-results .search-item').first()).toContainText(
    'Martín López',
  );
  await expect(page.locator('#client-results .search-item').first()).toContainText(
    '+54 9 11 5555-0001',
  );
});

test('search filters results and picking a client reveals step 2 with that name', async ({
  page,
}) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });

  const query = page.locator('#client-query');
  await query.click();
  // Focus with an empty query lists every client.
  await expect(page.locator('#client-results .search-item')).toHaveCount(3);

  await query.fill('mart');
  await expect(page.locator('#client-results .search-item')).toHaveCount(2);
  await expect(page.locator('#client-results')).toContainText('Martín López');
  await expect(page.locator('#client-results')).not.toContainText('Pedro Díaz');

  // Escape closes the results panel.
  await query.press('Escape');
  await expect(page.locator('#client-results')).toBeHidden();

  await query.fill('pedro');
  await page.locator('#client-results .search-item').first().click();
  await expect(page.locator('#client-results')).toBeHidden();
  await expect(page.locator('#selected-client')).toContainText('Pedro Díaz');
  await expect(page.locator('#continue-btn')).toBeEnabled();

  await page.locator('#continue-btn').click();
  await expect(page.locator('#step-1')).toBeHidden();
  await expect(page.locator('#step-2')).toBeVisible();
  await expect(page.locator('#step-2')).toContainText('Pedro Díaz');
});

test('"Registralo" opens the name+phone form and hands over the share link', async ({
  page,
}) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.locator('#client-query').click();
  await page.getByRole('button', { name: /no lo encuentras/i }).click();

  // Dedicated view: only nombre + teléfono + back link.
  await expect(page.locator('#view-add')).toBeVisible();
  await expect(page.locator('#client-search')).toBeHidden();
  await expect(page.locator('#new-client-name')).toBeVisible();
  await expect(page.locator('#new-client-phone')).toBeVisible();
  await expect(page.getByRole('button', { name: /volver a buscar/i })).toBeVisible();

  // Empty save → inline validation.
  await page.locator('#save-client-btn').click();
  await expect(page.locator('#error-cliente')).toBeVisible();
  await expect(page.locator('#error-telefono')).toBeVisible();

  // Back to search, then re-enter the form and save.
  await page.getByRole('button', { name: /volver a buscar/i }).click();
  await expect(page.locator('#view-search')).toBeVisible();
  await page.getByRole('button', { name: /no lo encuentras/i }).click();

  await page.locator('#new-client-name').fill('Nuevo Cliente');
  await page.locator('#new-client-phone').fill('+54 9 11 0000-0099');
  await page.locator('#save-client-btn').click();

  // Confirmation view: readonly share link + copy + continue.
  await expect(page.locator('#view-confirm')).toBeVisible();
  await expect(page.locator('#share-link')).toHaveValue(
    /\/Webbyss\/registro\?nombre=Nuevo%20Cliente&tel=%2B54/,
  );
  await expect(page.locator('#share-link')).toHaveAttribute('readonly', '');

  await page.locator('#copy-btn').click();
  await expect(page.locator('#copy-btn')).toContainText('Copiado');

  await page.locator('#continue-agenda-btn').click();
  await expect(page.locator('#step-2')).toBeVisible();
  await expect(page.locator('#step-2')).toContainText('Nuevo Cliente');
  await expect(page.locator('#selected-client')).toContainText('Nuevo Cliente');
  await expect(page.locator('#continue-btn')).toBeEnabled();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('webbys_admin_clients') || '[]'),
  );
  expect(stored).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'Nuevo Cliente', phone: '+54 9 11 0000-0099' }),
    ]),
  );
});

test('/Webbyss/registro prefills from query params and completes the registration', async ({
  page,
}) => {
  const nombre = 'Juan Pérez';
  const tel = '+54 9 11 5555-0042';

  await page.goto(
    `/Webbyss/registro?nombre=${encodeURIComponent(nombre)}&tel=${encodeURIComponent(tel)}`,
  );

  // Prefilled and locked: only email + contraseña are the client's to fill.
  await expect(page.locator('#reg-nombre')).toHaveValue(nombre);
  await expect(page.locator('#reg-tel')).toHaveValue(tel);
  await expect(page.locator('#reg-nombre')).toHaveAttribute('readonly', '');
  await expect(page.locator('#reg-tel')).toHaveAttribute('readonly', '');

  await page.locator('#reg-email').fill('juan@example.com');
  await page.locator('#reg-password').fill('secreto123');
  await page.locator('#registro-form button[type="submit"]').click();

  await expect(page.locator('#registro-ok')).toBeVisible();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('webbys_registered_clients') || '[]'),
  );
  expect(stored).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        nombre,
        tel,
        email: 'juan@example.com',
      }),
    ]),
  );

  // Without query params the form is empty AND editable.
  await page.goto('/Webbyss/registro');
  await expect(page.locator('#reg-nombre')).toHaveValue('');
  await expect(page.locator('#reg-tel')).toHaveValue('');
  await expect(page.locator('#reg-nombre')).not.toHaveAttribute('readonly', '');
  await expect(page.locator('#reg-tel')).not.toHaveAttribute('readonly', '');
});

test('(b) date strip shows 5 future days and pages 5-by-5 with ‹ ›', async ({ page }) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await pickClientAndContinue(page);

  const today = dayKey(0);
  const keys = () =>
    page
      .locator('#date-strip .date-chip')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.key));

  // Page 1: exactly 5 days, starting today, never past.
  await expect(page.locator('#date-strip .date-chip')).toHaveCount(5);
  let visible = await keys();
  expect(visible[0]).toBe(today);
  expect(visible.every((key) => key! >= today)).toBe(true);
  // Fase 8: both arrows are always rendered; the edge one is disabled.
  await expect(page.locator('#date-prev')).toBeVisible();
  await expect(page.locator('#date-prev')).toBeDisabled();
  await expect(page.locator('#date-next')).toBeEnabled();

  // Page 2: next 5 days.
  await page.locator('#date-next').click();
  await expect(page.locator('#date-strip .date-chip')).toHaveCount(5);
  visible = await keys();
  expect(visible[0]).toBe(dayKey(5));
  expect(visible.every((key) => key! >= today)).toBe(true);
  await expect(page.locator('#date-prev')).toBeEnabled();

  // Page 3 (last): tail of the 14-day horizon → 4 days, ‹ enabled, › disabled.
  await page.locator('#date-next').click();
  await expect(page.locator('#date-strip .date-chip')).toHaveCount(4);
  visible = await keys();
  expect(visible[0]).toBe(dayKey(10));
  await expect(page.locator('#date-next')).toBeVisible();
  await expect(page.locator('#date-next')).toBeDisabled();
  await expect(page.locator('#date-prev')).toBeEnabled();

  // Back again.
  await page.locator('#date-prev').click();
  await expect(page.locator('#date-strip .date-chip')).toHaveCount(5);
  expect((await keys())[0]).toBe(dayKey(5));
});

test('today only offers hours after the current time', async ({ page }) => {
  // Playwright 1.63 ships page.clock (stable since 1.45): freeze the page at
  // 10:15 today so the "future hours" rule is deterministic.
  const frozen = new Date();
  frozen.setHours(10, 15, 0, 0);
  await page.clock.install({ time: frozen });

  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await pickClientAndContinue(page);

  // Default date is today.
  await expect(page.locator('.date-chip.is-selected')).toHaveAttribute(
    'data-key',
    dayKey(0),
  );

  // Slots at or before 10:15 are gone…
  for (const past of ['09:00', '09:30', '10:00']) {
    await expect(page.locator(`#time-grid .time-chip[data-time="${past}"]`)).toHaveCount(0);
  }
  // …the next slot after "now" is offered.
  await expect(page.locator('#time-grid .time-chip[data-time="10:30"]')).toHaveCount(1);

  // Tomorrow keeps the full grid (unchanged rule).
  await page.locator(`.date-chip[data-key="${dayKey(1)}"]`).click();
  await expect(page.locator('#time-grid .time-chip[data-time="09:00"]')).toHaveCount(1);
});

test('free hours follow barber occupancy and a full day shows the empty state', async ({
  page,
}) => {
  const tomorrow = dayKey(1);
  const fullDay = dayKey(3);

  const appointments: Appointment[] = [
    {
      id: 'a1',
      date: tomorrow,
      time: '10:00',
      client: 'Ocupado Uno',
      phone: '+54 9 11 0000-0098',
      service: 'Corte',
      barber: 'Carlos',
      status: 'Pendiente',
    },
    // Diego booked solid on fullDay: every 30-min slot 09:00–19:00.
    ...Array.from({ length: 21 }, (_, index) => {
      const hour = 9 + Math.floor(index / 2);
      const minute = index % 2 === 0 ? '00' : '30';
      return {
        id: `full-${index}`,
        date: fullDay,
        time: `${String(hour).padStart(2, '0')}:${minute}`,
        client: 'Ocupado Todos',
        phone: '+54 9 11 0000-0097',
        service: 'Corte',
        barber: 'Diego',
        status: 'Confirmada',
      };
    }),
  ];

  await openWizard(page, { clients: CLIENTS, appointments });
  await pickClientAndContinue(page);

  // Tomorrow, default barber Carlos: 10:00 is taken, so the slot is absent.
  await page.locator(`.date-chip[data-key="${tomorrow}"]`).click();
  await expect(page.locator('.date-chip.is-selected')).toHaveAttribute('data-key', tomorrow);
  await expect(page.locator('#time-grid .time-chip[data-time="10:00"]')).toHaveCount(0);
  await expect(page.locator('#time-grid .time-chip[data-time="11:00"]')).toHaveCount(1);

  // Same day, other barber: the 10:00 slot comes back.
  await page.locator('#barber-trigger').click();
  await page
    .locator('#barber-panel')
    .getByRole('radio', { name: 'Diego', exact: true })
    .check();
  await expect(page.locator('#barber-trigger')).toContainText('Diego');
  await expect(page.locator('#time-grid .time-chip[data-time="10:00"]')).toHaveCount(1);

  // Fully booked day for Diego → empty state, no chips. Scoped to the
  // step-2 grid: the detail editor renders the same component (same copy).
  await page.locator(`.date-chip[data-key="${fullDay}"]`).click();
  await expect(page.locator('#time-empty')).toBeVisible();
  await expect(page.locator('#time-grid .time-chip')).toHaveCount(0);
});

test('success shows only the message + two actions and "Ver detalles" edits and persists', async ({
  page,
}) => {
  const tomorrow = dayKey(1);
  const appointments: Appointment[] = [
    {
      id: 'a1',
      date: tomorrow,
      time: '10:00',
      client: 'Ocupado Uno',
      phone: '+54 9 11 0000-0098',
      service: 'Corte',
      barber: 'Carlos',
      status: 'Pendiente',
    },
  ];

  await openWizard(page, { clients: CLIENTS, appointments });

  await page.locator('#client-query').fill('martín');
  await page.locator('#client-results .search-item').first().click();
  await page.locator('#continue-btn').click();

  await page.locator(`.date-chip[data-key="${tomorrow}"]`).click();
  // No default hour: saving stays disabled until one is picked.
  await expect(page.locator('#save-btn')).toBeDisabled();
  await page.locator('#time-grid .time-chip[data-time="11:00"]').click();
  await expect(page.locator('#save-btn')).toBeEnabled();

  await page.locator('#save-btn').click();

  // Success: message + exactly two actions, nothing else.
  await expect(page.locator('#success')).toBeVisible();
  await expect(page.getByText(/cita agendada correctamente/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /ver detalles/i })).toBeVisible();
  await expect(page.locator('#success a[href="/Webbyss/admin/"]')).toContainText(
    'Volver al inicio',
  );

  // Share link / WhatsApp / copy / "Registrar otra" are gone from here.
  await expect(page.locator('#success #share-link')).toHaveCount(0);
  await expect(page.locator('#success #whatsapp-btn')).toHaveCount(0);
  await expect(page.locator('#success #copy-btn')).toHaveCount(0);
  await expect(page.locator('#success #another-btn')).toHaveCount(0);

  // "Ver detalles" expands the editable panel: linked client row, the
  // shared date strip + free-hours grid, and M3 dropdowns (no native selects).
  await page.getByRole('button', { name: /ver detalles/i }).click();
  await expect(page.locator('#details-panel')).toBeVisible();
  await expect(page.locator('#detail-client-text')).toContainText('Martín López');
  await expect(page.locator('#detail-client-text')).toContainText('+54 9 11 5555-0001');
  await expect(page.locator('#detail-date-strip .date-chip.is-selected')).toHaveAttribute(
    'data-key',
    tomorrow,
  );
  await expect(
    page.locator('#detail-time-grid .time-chip.is-selected'),
  ).toHaveAttribute('data-time', '11:00');
  await expect(page.locator('#detail-service-value')).toHaveText('Corte');
  await expect(page.locator('#detail-barber-value')).toHaveText('Carlos');
  await expect(page.locator('#detail-status-value')).toHaveText('Pendiente');

  // Edit and persist: status through the M3 dropdown, hour through the grid.
  await page.locator('#detail-status-trigger').click();
  await page
    .locator('#detail-status-panel')
    .getByRole('radio', { name: 'Confirmada', exact: true })
    .check();
  await expect(page.locator('#detail-status-value')).toHaveText('Confirmada');
  // Single-select dropdowns close on pick.
  await expect(page.locator('#detail-status-panel')).toBeHidden();

  await page.locator('#detail-time-grid .time-chip[data-time="12:30"]').click();
  await expect(
    page.locator('#detail-time-grid .time-chip[data-time="12:30"]'),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#detail-save-btn').click();
  await expect(page.locator('#detail-saved')).toContainText('Datos actualizados');

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('webbys_admin_appointments') || '[]'),
  );
  expect(stored).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        client: 'Martín López',
        phone: '+54 9 11 5555-0001',
        status: 'Confirmada',
        date: tomorrow,
        time: '12:30',
        barber: 'Carlos',
        service: 'Corte',
      }),
    ]),
  );
  // The seeded appointment must survive the edit (saveAppointments, not replace).
  expect(stored).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: 'a1' })]),
  );
});

test('(c) edit panel drops native date/time/select; strip + grid edit and persist', async ({
  page,
}) => {
  const tomorrow = dayKey(1);
  const dayAfter = dayKey(2);

  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await pickClientAndContinue(page);
  await saveAndOpenDetails(page, tomorrow, '11:00');

  // ZERO native controls — in the panel and in the page as a whole.
  await expect(
    page.locator(
      '#details-panel input[type=date], #details-panel input[type=time], #details-panel select',
    ),
  ).toHaveCount(0);
  await expect(page.locator('input[type=date], input[type=time], select')).toHaveCount(0);

  // Fecha: the same paged date strip as step 2 (5 days per page).
  await expect(page.locator('#detail-date-strip .date-chip')).toHaveCount(5);
  await page.locator(`#detail-date-strip .date-chip[data-key="${dayAfter}"]`).click();
  await expect(
    page.locator('#detail-date-strip .date-chip.is-selected'),
  ).toHaveAttribute('data-key', dayAfter);

  // Hora: the same free-hours grid, filtered like step 2.
  await expect(page.locator('#detail-time-grid .time-chip[data-time="09:00"]')).toHaveCount(1);
  await page.locator('#detail-time-grid .time-chip[data-time="12:00"]').click();
  await page.locator('#detail-save-btn').click();
  await expect(page.locator('#detail-saved')).toContainText('Datos actualizados');

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('webbys_admin_appointments') || '[]'),
  );
  expect(stored).toHaveLength(1);
  expect(stored[0]).toEqual(
    expect.objectContaining({ date: dayAfter, time: '12:00', client: 'Martín López' }),
  );
});

test('(d) "Cambiar" in the edit panel opens the search and a new client persists', async ({
  page,
}) => {
  const tomorrow = dayKey(1);

  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await pickClientAndContinue(page);
  await saveAndOpenDetails(page, tomorrow, '11:00');

  // Linked row "Nombre · teléfono" + "Cambiar"; the search starts closed.
  await expect(page.locator('#detail-client-text')).toContainText('Martín López');
  await expect(page.locator('#detail-search')).toBeHidden();

  await page.locator('#detail-change-btn').click();
  await expect(page.locator('#detail-search')).toBeVisible();
  await page.locator('#detail-query').click();
  await expect(page.locator('#detail-results .search-item')).toHaveCount(3);

  await page.locator('#detail-results .search-item', { hasText: 'Pedro Díaz' }).click();
  await expect(page.locator('#detail-results')).toBeHidden();
  await expect(page.locator('#detail-client-text')).toContainText('Pedro Díaz');
  await expect(page.locator('#detail-client-text')).toContainText('+54 9 11 5555-0013');

  await page.locator('#detail-save-btn').click();
  await expect(page.locator('#detail-saved')).toContainText('Datos actualizados');

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('webbys_admin_appointments') || '[]'),
  );
  expect(stored[0]).toEqual(
    expect.objectContaining({
      client: 'Pedro Díaz',
      phone: '+54 9 11 5555-0013',
      date: tomorrow,
      time: '11:00',
    }),
  );
});

test('(e) edit panel uses the M3 exposed dropdowns (trigger + panel), no <select>', async ({
  page,
}) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await pickClientAndContinue(page);
  await saveAndOpenDetails(page, dayKey(1), '11:00');

  await expect(page.locator('#details-panel select')).toHaveCount(0);

  const dropdowns: Array<[string, string[]]> = [
    ['detail-service', ['Corte', 'Corte + Barba', 'Barba', 'Cejas']],
    ['detail-barber', ['Carlos', 'Diego', 'Miguel']],
    ['detail-status', ['Pendiente', 'Confirmada', 'Atendido', 'Cancelado']],
  ];

  for (const [id, options] of dropdowns) {
    const trigger = page.locator(`#${id}-trigger`);
    const panel = page.locator(`#${id}-panel`);

    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', `${id}-panel`);
    await expect(panel).toBeHidden();

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.filter-check')).toHaveCount(options.length);
    for (const option of options) {
      await expect(panel.getByRole('radio', { name: option, exact: true })).toHaveCount(1);
    }
  }

  // Barbero options carry the shared dot (same as the agenda's filters).
  await expect(page.locator('#detail-barber-panel .dot')).toHaveCount(3);
});

/** scrollWidth/clientWidth of a strip container + page-level lateral scroll. */
async function overflowSnapshot(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const box = (el: Element | null) =>
      el ? { scroll: el.scrollWidth, client: el.clientWidth } : null;
    return {
      date: box(document.getElementById('date-strip')),
      detail: box(document.getElementById('detail-date-strip')),
      page: box(document.documentElement),
    };
  });
}

// 390px already fits pre-fix; 360/320 are the widths where the strip +
// ‹ › nav row pushes the card past the viewport. One test per width so
// every iteration starts from a fresh (logged-out) context.
for (const width of [360, 320]) {
  test(`(f) both date strips fit the card without lateral scroll @${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await openWizard(page, { clients: CLIENTS, appointments: [] });
    await pickClientAndContinue(page);

    let snapshot = await overflowSnapshot(page);
    // Step 2 strip: 5 chips + ‹ › stay inside the card…
    expect(snapshot.date!.scroll).toBeLessThanOrEqual(snapshot.date!.client);
    // …and the page itself never scrolls sideways.
    expect(snapshot.page!.scroll).toBeLessThanOrEqual(snapshot.page!.client);

    await saveAndOpenDetails(page, dayKey(1), '11:00');

    snapshot = await overflowSnapshot(page);
    // Same shared strip inside the "Ver detalles" panel.
    expect(snapshot.detail!.scroll).toBeLessThanOrEqual(snapshot.detail!.client);
    expect(snapshot.page!.scroll).toBeLessThanOrEqual(snapshot.page!.client);
  });
}

test('(g) ‹ is always rendered, disabled at page 1 and inert (both strips)', async ({ page }) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await pickClientAndContinue(page);

  const keysOf = (selector: string) =>
    page
      .locator(`${selector} .date-chip`)
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.key));

  // ── Step 2 strip: ‹ present on page 1, disabled, clicking changes nothing.
  const prev = page.locator('#date-prev');
  await expect(prev).toBeVisible();
  await expect(prev).toBeDisabled();
  const before = await keysOf('#date-strip');
  await prev.dispatchEvent('click');
  expect(await keysOf('#date-strip')).toEqual(before);

  // Page to the end: › turns disabled and inert, ‹ turns enabled.
  await page.locator('#date-next').click();
  await page.locator('#date-next').click();
  await expect(page.locator('#date-strip .date-chip')).toHaveCount(4);
  await expect(page.locator('#date-next')).toBeDisabled();
  await expect(page.locator('#date-prev')).toBeEnabled();
  const last = await keysOf('#date-strip');
  await page.locator('#date-next').dispatchEvent('click');
  expect(await keysOf('#date-strip')).toEqual(last);

  // Back to page 1 so tomorrow's chip is on screen for the detail flow.
  await page.locator('#date-prev').click();
  await page.locator('#date-prev').click();
  await expect(page.locator('#date-prev')).toBeDisabled();

  // ── Detail panel strip: identical contract (shared renderStrip).
  await saveAndOpenDetails(page, dayKey(1), '11:00');
  const detailPrev = page.locator('#detail-date-prev');
  await expect(detailPrev).toBeVisible();
  await expect(detailPrev).toBeDisabled();
  const detailBefore = await keysOf('#detail-date-strip');
  await detailPrev.dispatchEvent('click');
  expect(await keysOf('#detail-date-strip')).toEqual(detailBefore);

  await page.locator('#detail-date-next').click();
  await page.locator('#detail-date-next').click();
  await expect(page.locator('#detail-date-strip .date-chip')).toHaveCount(4);
  await expect(page.locator('#detail-date-next')).toBeDisabled();
  await expect(page.locator('#detail-date-prev')).toBeEnabled();
  const detailLast = await keysOf('#detail-date-strip');
  await page.locator('#detail-date-next').dispatchEvent('click');
  expect(await keysOf('#detail-date-strip')).toEqual(detailLast);
});

test('(h) "Ver detalles" orders SERVICIO/BARBERO/ESTADO before FECHA/HORA', async ({
  page,
}) => {
  await openWizard(page, { clients: CLIENTS, appointments: [] });
  await pickClientAndContinue(page);
  await saveAndOpenDetails(page, dayKey(1), '11:00');

  const order = await page.evaluate(() => {
    const fieldsets = [...document.querySelectorAll('#details-panel fieldset')];
    const byLegend = (label: string) =>
      fieldsets.find((entry) => entry.querySelector('legend')?.textContent?.trim() === label);
    const precedes = (a: Element, b: Element | undefined) =>
      !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const triggers = ['detail-service-trigger', 'detail-barber-trigger', 'detail-status-trigger']
      .map((id) => document.getElementById(id))
      .filter((el): el is Element => !!el);
    const fecha = byLegend('Fecha');
    const hora = byLegend('Hora');
    return {
      triggerCount: triggers.length,
      hasFecha: !!fecha,
      hasHora: !!hora,
      triggersBeforeFecha: triggers.every((trigger) => precedes(trigger, fecha)),
      triggersBeforeHora: triggers.every((trigger) => precedes(trigger, hora)),
    };
  });

  expect(order.triggerCount).toBe(3);
  expect(order.hasFecha).toBe(true);
  expect(order.hasHora).toBe(true);
  expect(order.triggersBeforeFecha).toBe(true);
  expect(order.triggersBeforeHora).toBe(true);
});
