# Admin Home Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. The spec
> `docs/superpowers/specs/2026-10-02-admin-home-design.md` is the contract — read it first.

**Goal:** Demo-gated admin entry: `/admin/login`, home dashboard (KPIs + agenda + CTA),
and `/admin/nueva-cita` appointment screen that generates the client registration link.

**Architecture:** Three static Astro pages under `src/pages/admin/`, client-side session
guard via `sessionStorage.webbys_admin`, appointments in
`localStorage.webbys_admin_appointments`, link generated from `location.origin` + base
path + query params. No backend, no new dependencies.

**Tech Stack:** Astro 7 (static), vanilla JS/CSS on existing tokens, Playwright e2e.

## Global Constraints

- **NO git commit, NO git add, NO push** — user tests locally first (explicit user
  instruction; overrides the normal work-unit commit step).
- Base path `/Webbyss` — every internal link and redirect must be prefixed
  (e.g. `/Webbyss/admin/login`).
- No hex color values outside `src/styles/tokens.css`. Identity: Playfair Display
  headings, Atkinson body, gold CTA, light/dark via `prefers-color-scheme`.
- Mobile-first (375 px base), graceful widening.
- Credentials: `admin@barber.com` / `admin` (hardcoded const) with
  `// ponytail: demo gate only — replace with Supabase auth when backend lands`.
- Mock data carries `// ponytail:` comments (mock KPIs, seed appointments).
- localStorage schema: `{ id, date, time, client, phone, service, barber, status }`,
  key `webbys_admin_appointments`; seed 3 appointments for today when the key is absent.
- sessionStorage: key `webbys_admin`, value `"1"`.
- Mock barbers: Carlos, Diego, Miguel. Services: Corte, Corte + Barba, Barba, Cejas.
  Time slots: 30-min from 09:00 to 19:00. Status pills: Pendiente, Confirmada,
  Completada.
- Form inputs must have associated `<label>` elements (e2e uses `getByLabel`).
- UI copy in Spanish; code/comments in English.

## File Structure

- Create: `tests/e2e/admin.spec.ts` — 2 tests (wrong password, success flow)
- Create: `src/pages/admin/login.astro` — auth form + session set + redirect
- Create: `src/pages/admin/index.astro` — guard, header, KPIs, agenda, CTA (reads localStorage)
- Create: `src/pages/admin/nueva-cita.astro` — guard, form, localStorage write, link generation

No existing files are modified (Playwright `testDir: './tests/e2e'` and Astro file
routing pick the new files up automatically).

---

### Task 1: Failing e2e tests (RED)

**Files:**
- Create: `tests/e2e/admin.spec.ts`

- [x] **Step 1: Write the failing tests**

```ts
import { test, expect } from '@playwright/test';

test('admin login with wrong password shows inline error', async ({ page }) => {
  await page.goto('/Webbyss/admin/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('wrong-pass');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/credenciales inválidas/i)).toBeVisible();
});

test('admin login success shows home greeting and CTA', async ({ page }) => {
  await page.goto('/Webbyss/admin/login');
  await page.getByLabel(/correo/i).fill('admin@barber.com');
  await page.getByLabel(/contraseña/i).fill('admin');
  await page.getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page.getByText(/hola, admin/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /nueva cita/i })).toBeVisible();
});
```

- [x] **Step 2: Run to verify RED**

Run: `npm run build && npx playwright test tests/e2e/admin.spec.ts`
Expected: FAIL (routes do not exist yet — 404/timeout). Record observed output.

### Task 2: Admin login page

**Files:**
- Create: `src/pages/admin/login.astro`

**Produces:** sessionStorage flag `webbys_admin`, redirect to `/Webbyss/admin/`,
inline error copy `Credenciales inválidas`.

- [x] **Step 1: Implement the page** — card layout mirroring `src/pages/login.astro`
  patterns (read it first for style), email + password labels, client-side credential
  check, `sessionStorage.setItem('webbys_admin', '1')` then redirect; already-authed
  visitors redirect straight to home; ponytail demo-gate comment.
- [x] **Step 2: Run tests**

Run: `npx playwright test tests/e2e/admin.spec.ts`
Expected: wrong-password test PASS; success test still FAIL (home missing).

### Task 3: Admin home

**Files:**
- Create: `src/pages/admin/index.astro`

**Produces:** guard redirect to `/Webbyss/admin/login`; greeting `Hola, Admin`; KPI
grid (Citas hoy computed, other three mock); agenda from localStorage + 3-item seed
filtered to today sorted by time; CTA link `/Webbyss/admin/nueva-cita`.

- [x] **Step 1: Implement the page** (guard, header with date + Admin chip, greeting,
  2×2 KPI grid, agenda cards with status pills, CTA card).
- [x] **Step 2: Run tests**

Run: `npx playwright test tests/e2e/admin.spec.ts`
Expected: both tests PASS.

### Task 4: Appointment screen

**Files:**
- Create: `src/pages/admin/nueva-cita.astro`

**Produces:** same guard; form (barber/service selects, date default today, time
select, name, phone); on submit validates required fields with inline errors, appends
to localStorage with status `Pendiente`, renders success panel with readonly link
`{origin}/Webbyss/registro?nombre=…&tel=…`, WhatsApp share button
(`https://wa.me/?text=…`), copy button (`navigator.clipboard` try/catch → "¡Copiado!",
on failure keep input selectable), "Registrar otra" resets the form.

- [x] **Step 1: Implement the page**
- [x] **Step 2: Build + full suite**

Run: `npm run build && npx playwright test tests/e2e/`
Expected: build success with **14 pages**; **8/8 tests PASS** (6 existing + 2 new).

### Task 5: Verification & report

- [x] `npm run build` → success, 14 pages
- [x] `npx playwright test tests/e2e/` → 8/8
- [x] `git status --short` → only the 4 new untracked files, **nothing committed**
- [x] Report: files created, exact `<command>: <observed result>` per verification,
  any deviation from spec and why.

## Route declaration

Delegated direct (writer trigger: 4 non-trivial files, single writer). Trigger
evidence: 3 new Astro pages + 1 test file, all non-trivial.

## Delivery

Commits **on hold** per user instruction (test locally first). Delivery strategy
(chain vs single PR) to be confirmed before the first commit; forecast ~550–650
authored lines exceeds the 400-line budget.

## Progress

- [x] Task 1 — failing e2e tests (RED)
- [x] Task 2 — admin login page
- [x] Task 3 — admin home
- [x] Task 4 — appointment screen
- [x] Task 5 — verification & report

---

# Revision 2 — Agenda completa + ajustes home (approved by user 2026-10-02)

**Scope deltas vs spec v1** (spec stays the Phase 1 contract; this section is the Phase 2 contract):

1. Home: KPI *Walk-ins* → **Pendientes** (today's appointments with status `Pendiente`, computed — not mock).
2. Home: *Agenda de hoy* → **Próximas citas** (today, `time >= now`, sorted asc, top 4, empty state `Sin más citas hoy`).
3. Home: new CTA link **Ver agenda completa** → `/Webbyss/admin/agenda`.
4. New screen `/admin/agenda` with sticky view toggle **Día | Semana | Mes**, barber legend, same guard.
5. `nueva-cita` restyle with user's Swiggy reference: 14-day date chip strip (horizontal scroll-snap, past days muted, selected = accent), time-slot chips 09:00–19:00 / 30 min in 3-col grid (replaces `<select>`), accent-tinted info banner, sticky bottom bar (summary + full-width gold `Guardar cita`). Keep validation / localStorage / link / wa.me / copy behavior.
6. New shared module `src/scripts/appointments.js` (read/write/today/seed helpers) imported by `index.astro`, `agenda.astro`, `nueva-cita.astro` — extract, do not triple-duplicate seed logic.

**Mobile-first rules (375 px base):**

- Día = default view: single-column timeline 09:00–19:00, hour gutter, barber-colored blocks, `ahora` line, empty state per day.
- Semana mobile = horizontally scroll-snapped day columns (~85 px each: time + client first name + color bar), sticky hour gutter; desktop ≥900 px expands to full 7-column CSS Grid with named hour lines (roccop/OGyBPG pattern: `[time] auto [lun] 1fr …`, blocks `grid-row: h09 / h19`).
- Mes = compact 7×6 grid with colored dots; tapping a day selects it and renders its appointment list below (Mantine MobileMonthView pattern).
- Week strip chips (day abbrev + date + dots per barber) visible in Día and Semana; today highlighted, past days muted.
- Legend: scrollable barber chips using the 3 barber tokens.

**Style rules:**

- Barber colors: 3 new tokens in `src/styles/tokens.css` (`--color-barber-carlos`, `--color-barber-diego`, `--color-barber-miguel`) — tokens.css remains the only hex home.
- Selected chip: `border-color: var(--color-accent)` + `background: color-mix(in srgb, var(--color-accent) 12%, transparent)` (native, no new hex).
- Muted/disabled chips: existing muted tokens + `aria-disabled`, not clickable.
- All copy Spanish; no new dependencies; keep `// ponytail:` comments on seeds/mock values.

### Phase 2 Tasks (TDD)

- [x] **T6: extend e2e (RED)** — add to `tests/e2e/admin.spec.ts`: (a) after login home shows `Próximas citas`, KPI `Pendientes`, no `Walk-ins` text, link `Ver agenda completa`; (b) click `Ver agenda completa` → `/Webbyss/admin/agenda` shows `Día|Semana|Mes` toggle + barber legend. Run `npm run build && npx playwright test tests/e2e/admin.spec.ts` → observe FAIL on new assertions (agenda 404 / old home copy).
- [x] **T7: tokens + shared store + home edits** — add 3 barber tokens; create `src/scripts/appointments.js`; refactor `index.astro` + `nueva-cita.astro` to import it (behavior unchanged); home: KPI swap, Próximas citas, `Ver agenda completa` link. Run admin tests → T6(a) PASS.
- [x] **T8: `/admin/agenda` screen** — guard, header + back link, legend, sticky toggle, week strip, Día timeline (default), Semana scroll-snap columns → ≥900 px full grid, Mes grid + selected-day list; merge seeds via shared store (no duplicate seeds). Run admin tests → T6(b) PASS + suite green.
- [x] **T9: `nueva-cita` Swiggy restyle** — date chips, time chips, info banner, sticky bottom bar; all existing behavior intact (validation, localStorage append `Pendiente`, success panel, link, wa.me, copy, `Registrar otra`, labels for e2e). Run full suite.
- [x] **T10: verification & report** — `npm run build` → **15 pages** (adds `/admin/agenda`); `npx playwright test tests/e2e/` → all green (10/10 expected); `git status --short` → only intended modified/new files, **nothing staged or committed**; report `<command>: <observed result>` per check.
  - Observed: `npm run build` → `15 page(s) built`; `npx playwright test tests/e2e/` → `10 passed`; `git status --short` → ` M src/styles/tokens.css`, `?? odd/tasks/admin-home.md`, `?? src/pages/admin/`, `?? src/scripts/`, `?? tests/e2e/admin.spec.ts`; `git diff --cached` → empty (nothing staged).

**Route declaration (Phase 2):** delegated direct — writer trigger: 6 non-trivial files (agenda.astro new, index.astro, nueva-cita.astro, tokens.css, appointments.js, admin.spec.ts), single sequential writer.

**Delivery:** commits still on hold (user instruction). Cumulative forecast ~1300 authored lines — chain strategy required before the first commit ever happens.

---

# Revision 3 — Barber selector + calendar day-by-day + status filters (approved 2026-10-02)

**Scope deltas vs Revision 2:**

1. **Home `index.astro`**: remove the global empty state `Sin más citas hoy`. Instead, group **Próximas citas per barber** (always render all 3 sections: Carlos / Diego / Miguel, each headed with barber color + count). Each section lists that barber's today appointments with `time >= now`, ascending. Barbers with no remaining appointments show a muted line `Libre el resto del día` (never the old global message).
2. **Agenda: REMOVE the `Día | Semana | Mes` toggle and the week strip entirely.** New layout top→bottom:
   a. **Month calendar** (pattern reference: `https://github.com/refinedguides/calendar` — fetch `https://raw.githubusercontent.com/refinedguides/calendar/main/script.js` + `style.css` for the behavior pattern: month grid, prev/next controls, today highlight, inactive/other-month dates muted). Use it as a behavior reference only — write original code in our tokens/style (GPL-2.0: do not copy verbatim). Spanish weekday headers (L M X J V S D), Spanish month names, locale-safe. **Default selected day = today**; tapping any day re-renders the day agenda below; other-month taps switch month + select.
   b. **Barber selector (multi-select chips)**: `Todos` + Carlos + Diego + Miguel. Any combination valid (1, 2 or 3). `Todos` active iff all 3 active; tapping `Todos` activates all 3; tapping a barber toggles it; never allow 0 selected (last active one cannot be deselected — keep it selected / aria-disabled). Active = accent style (border + color-mix background).
   c. **Status filters (chips, multi-select)**: `Todos` (default active) + `Pendiente` + `Confirmada` + `Atendido` + `Cancelado`, plus an independent `Disponible` toggle chip (off by default). Same multi-select semantics as barbers (Todos = all four statuses active). `Disponible` is orthogonal: when ON, the day agenda additionally shows free-slot chips.
   d. **Day agenda for the selected day**: timeline/list 09:00–19:00 (30-min grid) of that day, appointments filtered by active barbers AND active statuses, barber-colored cards with time/client/service/status pill; empty result → muted `Sin citas para este día`. `ahora` line only when selected day is today.
   e. **Disponible**: for each active barber, compute 30-min slots (09:00–19:00) with NO appointment of that barber that day; render them as barber-colored `Libre` chips (grouped per barber when >1 barber active). Sits below the appointments list; visible whenever the `Disponible` chip is ON (including when all status filters are Todos).
3. **Status vocabulary change (whole admin feature)**: `Completada` → **`Atendido`** (rename everywhere: seed status, pill mapping in `src/scripts/appointments.js`, pill CSS label if literal, any copy). **`Cancelado`** is a new valid status (no UI to set it yet — only seeds/filters). Keep `Pendiente` and `Confirmada`.
4. **Seeds must show filter variety** (`// ponytail:` mock): expand today's/this week's seed to cover multiple barbers and all four statuses (e.g. Completada-equivalents → Atendido, plus at least one Cancelado), so filters and Disponible are demonstrable. Still only seed when the key is absent; single source in `src/scripts/appointments.js`. New appointments from `nueva-cita` keep status `Pendiente`.
5. **e2e**: update the agenda test (b) — no more toggle/legend: assert calendar (month heading + prev/next), `Todos` + barber names as selector chips, filter chips `Pendiente`/`Atendido`/`Cancelado`/`Disponible`, and absence of the old toggle labels (`Semana` text gone). Home test (a): assert per-barber sections exist and `Sin más citas hoy` is absent. Keep total suite green.

### Phase 3 Tasks (TDD)

- [x] **T11: e2e RED** — rewrite/extend `tests/e2e/admin.spec.ts` assertions per delta 5; run `npm run build && npx playwright test tests/e2e/admin.spec.ts` → observe FAIL (current agenda has toggle, home has old empty state).
- [x] **T12: home per-barber sections + status rename + seed variety** — `index.astro` delta 1; `appointments.js` deltas 3+4 (`Completada`→`Atendido`, add `Cancelado`, richer seed, pill map update; check `index.astro`/`agenda.astro` for literal `Completada`). Run admin tests → home test PASS.
- [x] **T13: agenda rework** — remove toggle/week strip; add calendar + multi-select barber chips + status/Disponible filters + filtered day agenda + per-barber free slots per delta 2. Run admin tests → agenda test PASS + full suite green.
- [x] **T14: verification & report** — `npm run build` → 15 pages; `npx playwright test tests/e2e/` → all green (10 expected); `git status --short` → only intended files, nothing staged; grep `Completada` under `src/` → zero hits; report `<command>: <observed result>`.

**Route declaration (Phase 3):** delegated direct — 4 non-trivial files (admin.spec.ts, index.astro, appointments.js, agenda.astro), single sequential writer.

**Delivery:** commits still on hold (user veto). Cumulative authorship growing (~2600 changed lines reported by assess) — chain strategy mandatory before the first commit.

---

# Revision 4 — Dropdowns + always-populated demo data (approved 2026-10-02)

**Scope deltas vs Revision 3:**

1. **Agenda — REMOVE all filter chips/buttons.** Replace with:
   a. **Barberos = dropdown checklist**: a trigger button labeled with current selection (e.g. `Barberos: Todos` / `Barberos: Carlos + 1` — label rule: `Todos` when all 3, otherwise first name + `+ n` if more than one) opening a panel with 4 checkboxes: `Todos`, `Carlos`, `Diego`, `Miguel`. Semantics preserved from Rev 3: `Todos` checked iff all 3 barbers checked; checking `Todos` checks the 3; checking a barber unchecks `Todos` when not all remain; never allow 0 barbers (last checked barber's checkbox stays checked / guard in change handler). Accessible: trigger `aria-expanded`, panel associated, each checkbox a real `<input type="checkbox">` with label. Native `<details>/<summary>` is fine if accessibility + styling hold; otherwise button + panel with JS.
   b. **Estado = normal native `<select>`** with options: `Todos` (default), `Pendiente`, `Confirmada`, `Atendido`, `Cancelado`, `Disponible`. Single-select. `Disponible` selected → day agenda shows ONLY the free-slot chips (per active barber, as in Rev 3); any other value → only the matching appointments (all statuses when `Todos`). Labeled `<label>Estado</label>`.
   c. Day agenda, calendar, `ahora` line, empty state `Sin citas para este día` — unchanged from Rev 3.
2. **Home — `Próximas citas` must never look empty in demo**: change the range from *today ≥ now* to **all upcoming from now, across days** (today ≥ now, then tomorrow, then the rest of the week; ascending; top 4 per barber section). Each card shows the date context when it is not today (`Hoy · 16:00` / `Mañana · 09:00` / `Sáb 04 · 11:00` — Spanish short day format). When a barber truly has nothing ahead, muted line `Sin citas próximas` (replaces `Libre el resto del día`).
3. **Seeds — every barber demonstrably busy, multi-day, with an overlap** (`// ponytail:` mock, single source `src/scripts/appointments.js`, only when key absent, all 4 statuses, 3 barbers):
   - Each of the 3 barbers has **at least one upcoming appointment** (time ≥ now-ish — use relative day math: today (only if still early enough), tomorrow and +2 days are all safe) so home sections all show cards.
   - At least one **same-time overlap**: on a fixed future day (e.g. tomorrow), all three barbers have an appointment at the **same time slot** (e.g. 16:00), so multi-barber day view shows parallel citas.
   - Several days populated (today/tomorrow/+2…), not a single-day cluster.
   - Relative dates via JS `Date` math at seed time (repeatable demo, not hardcoded dates).
4. **e2e updates (RED first)**: agenda test now asserts two `combobox` roles (barberos trigger or the status `select` — use accessible names `Barberos` and `Estado`), the `Estado` select containing option `Disponible`, checkboxes `Carlos`/`Diego`/`Miguel` reachable after opening the barber dropdown, and absence of the old chip groups (no button with name `Todos` filter semantics — assert `getByRole('button', { name: 'Todos' })` count 0 outside dropdown panel if applicable, or simply that no element with class `.chip`/`.filter-chip` exists — prefer role-based assertions). Home test: per-barber sections still asserted; keep absence of `Sin más citas hoy`; add assertion that each barber section contains at least one appointment card (guaranteed by seed rule 3).

### Phase 4 Tasks (TDD)

- [x] **T15: e2e RED** — update `tests/e2e/admin.spec.ts` per delta 4; run `npm run build && npx playwright test tests/e2e/admin.spec.ts` → observe FAIL (current UI has chips, not dropdowns; home cards may be date-limited).
- [x] **T16: seeds + home upcoming range** — `appointments.js` delta 3 (relative multi-day seed, all barbers, same-time overlap); `index.astro` delta 2 (upcoming range, date context lines, `Sin citas próximas` copy). Run admin tests → home test PASS.
- [x] **T17: agenda dropdowns** — delta 1 (barber checklist dropdown + native Estado select incl. `Disponible`; Disponible → only free slots; statuses → filtered cards). Run admin tests → agenda test PASS + full suite green.
- [x] **T18: verification & report** — `npm run build` → 15 pages; `npx playwright test tests/e2e/` → all green (10 expected); `grep -rn "chip" src/pages/admin` → zero filter-chip remnants (or report what remains and why); `git status --porcelain -uall` only intended surfaces, `git diff --cached` empty; report `<command>: <observed result>`.

**Route declaration (Phase 4):** delegated direct — 4 non-trivial files (admin.spec.ts, appointments.js, index.astro, agenda.astro), single sequential writer.

**Post-Phase 4 deltas (same feature, verified):**
- [x] **Estado = custom dropdown (M3 exposed-dropdown)** — native `<select>` replaced by trigger + panel (same `.filter-*` furniture), radios with label rules; native popup was OS-rendered and unstyleable (documented discovery).
- [x] **Floating panels (Revision 6 delta 1)** — `.filter { position: relative }`, `.filter-panel` absolute (`top: calc(100% + 6px)`, `z-index: 30`, `max-height: min(60vh, 320px)`), `menu-in` 0.14s; outside-tap + Escape (with refocus) close; single-select closes on pick; layout test asserts `#view-date` absolute y is stable when opening each panel (RED → GREEN).
- [x] **Disponible unification** — free slots are now `.day-block` cards in the day timeline (time + `Libre` + barber); `#free-slots`, `renderFreeSlots()`, `.free-*` CSS removed; `blockHtml` guards status/meta; `renderDay()` unified (`Sin huecos libres` vs `Sin citas para este día`).
- [x] **Shared pattern registry** — `src/styles/patterns.css` created with documented markup contracts for both patterns (dropdowns + calendar); styles moved verbatim from agenda.astro (de-`global()`ed); registered via `@import './patterns.css';` in `src/styles/global.css`. agenda.astro style block 999 → 728 lines.
- Verification per delta: `npm run build` → 15 pages; `npx playwright test` → 10 passed; `git diff --cached` → 0 lines; `git status -uall` → 9 intended surfaces (+patterns.css = 10).

**Delivery:** commits still on hold (user veto).

---

## Fase 5 — Wizard "Nueva cita" (2 pasos) — spec aprobada por el usuario

**Objetivo:** reemplazar el formulario mono-pantalla de `nueva-cita.astro` por un wizard de 2 pasos: (1) seleccionar/agregar cliente con buscador, (2) fecha + barbero único + servicio → grilla de **solo horas libres** de ese barbero ese día.

**Aprobaciones del usuario:** barbero **único** (opción a); enfoque **A** (wizard 2 pasos en la misma página); diseño completo aprobado ("sí, hazlo").

### Diseño

**Datos — `src/scripts/clients.js` (nuevo)**
- Store `localStorage.webbys_admin_clients` = `[{ id, name, phone }]`; sembrado solo si la key no existe: nombres+teléfonos únicos de las citas existentes (`readAppointments()`) + 3 extras demo.
- API: `readClients()`, `appendClient({name, phone})`, `searchClients(query)` (parcial, case-insensitive), `seedClients()` al estilo de los seeds de appointments (solo si key ausente).

**Paso 1 — Cliente**
- `input[type=search]` con label; resultados en panel `.search-results` (patrón nuevo en patterns.css) mientras escribe (parcial, insensible a mayúsculas); foco vacío → lista completa. Cada resultado muestra nombre + teléfono.
- Panel incluye siempre **"+ Agregar nuevo cliente"** → campos inline nombre/teléfono con `.field-error`; guarda y selecciona.
- Seleccionado → chip nombre+teléfono + **"Cambiar"**. Teclado: Tab/Enter sobre resultados, Escape cierra. **"Continuar"** solo activo con cliente elegido.

**Paso 2 — Cita**
- Header: cliente elegido + "Cambiar" (vuelve al paso 1).
- Fecha: tira de 14 días actual (reutilizar `renderDateStrip/selectDate`).
- Barbero y Servicio: dropdowns M3 single-select (mismo patrón `.filter-*` de Estado ya registrado).
- Horas libres: slots 09:00–19:00 c/30min **menos ocupados** del barbero+fecha elegidos (misma lógica que vista Disponible de agenda; `Cancelado` ocupa el slot — consistente con agenda). Recalcula al cambiar fecha/barbero/servicio. Vacío → `Sin horas libres este día`.
- Sin hora preseleccionada; **"Guardar cita" deshabilitado hasta elegir hora**. Resumen sticky `Servicio · Barbero · fecha · hora`.

**Guardado:** igual que hoy (`appendAppointment`, `status: 'Pendiente'`), cliente del paso 1; pantalla de éxito + link + WhatsApp sin cambios.

**patterns.css — 4.º patrón `SEARCH / COMBOBOX`:** `.search` (wrapper relative) + `.search-input` + `.search-results` (panel absolute, misma motion 0.2s emphasized; reglas de transición/`[hidden]`/`@starting-style` compartidas con `.filter-panel` por selector de grupo) + `.search-item` + `+ Agregar nuevo` row. Doc en el header del archivo.

**Fuera de scope (YAGNI):** duraciones de servicio, editar/eliminar citas, multi-barbero, auth en clientes.

### Tasks (TDD — RED primero)

- [x] **T19: e2e RED** — crear `tests/e2e/nueva-cita.spec.ts`: (1) paso 1 visible / paso 2 oculto; (2) búsqueda filtra y elegir cliente muestra paso 2 con su nombre; (3) "+ Agregar nuevo" guarda y selecciona; (4) disponibilidad: cita sembrada para Carlos mañana 10:00 → sin 10:00 para Carlos, sí para otro barbero; día sin huecos → `Sin horas libres este día`; (5) flujo completo → éxito + cita persistida. `npm run build && npx playwright test tests/e2e/nueva-cita.spec.ts` → observar FAIL.
- [x] **T20: clients.js** — store + seeds (solo si key ausente) al patrón de `appointments.js`.
- [x] **T21: patterns.css 4.º patrón** — SEARCH/COMBOBOX con motion compartida; doc en header.
- [x] **T22: nueva-cita.astro wizard** — markup 2 pasos + JS (estado cliente/fecha/barbero/servicio/hora, cálculo de horas libres, M3 dropdowns, guardado).
- [x] **T23: GREEN + verificación** — `npm run build` → 15 pages; `npx playwright test` → suite completa en verde; `git diff --cached` = 0; `git status -uall` solo superficies esperadas (nueva-cita.astro, clients.js, patterns.css, nueva-cita.spec.ts, appointments.js si hace falta import); reporte `<command>: <observed result>`.

**Route declaration (Fase 5):** delegated direct — un solo writer `gentle-ai-worker` (2 lanzamientos: T19–T21 completo, T22–T23 completo), veto git. **Commits en pausa (veto usuario).** Verificación Fase 5: RED 5 failed (locator `#client-query`), build `15 page(s)`, suite `15 passed (4.7s)`, staged 0, spot check padre idéntico. Desviaciones: patterns.css T21 incompleto (faltaban `.search` wrapper/rows — añadidos), rango horas 09:00–19:00 inclusivo con regla `[t,t+30)` de agenda, fix Escape preventDefault en `input[type=search]`.

**Delivery:** commits en pausa (veto del usuario). Líneas acumuladas ~3000+ → estrategia de chain obligatoria antes del primer commit.

---

## Fase 6 — UX de la cita (wizard + registro de cliente) — spec aprobada por el usuario

**Aprobaciones:** diseño completo por secciones ("sí"); registro de cliente con página propia `/Webbyss/registro` (opción a, creada AHORA); panel de edición en la misma página (opción a).

### Diseño

1. **Buscador (paso 1):** panel SOLO resultados (nombre + teléfono); sin form inline; pie con **"¿No lo encuentras? Registralo"**. Chip seleccionado conserva su "Cambiar".
2. **Alta de cliente:** "Registralo" → formulario dedicado **solo Nombre + Teléfono** (+ "← Volver a buscar"). Guardar → pantalla: **link** `${origin}/Webbyss/registro?nombre=…&tel=…` en input readonly + **"Copiar link"** (clipboard) + **"Continuar con la agenda de la cita"** → cliente seleccionado → paso 2. Sin WhatsApp acá.
3. **Página nueva `src/pages/registro.astro`** (pública, sin auth): nombre/teléfono **precargados desde query params** (readonly) + **email y contraseña** → `localStorage` demo (nuevo key `webbys_registered_clients` o merge en clients con flag; decidir lo más corto) → mensaje de éxito. Sin params → campos vacíos editables.
4. **Fechas:** tira de **6 días** desde hoy (sin pasados), paginación **‹ › de 6 en 6** dentro del horizonte existente de 14 días; ‹ oculto en página 1, › en la última.
5. **Horas:** si fecha = hoy → solo slots **> hora actual** (`hhmm()` de appointments.js); días futuros → sin cambio.
6. **Éxito:** solo **"✓ Cita agendada correctamente"** + **"Ver detalles"** + **"Volver al inicio"** (→ `/Webbyss/admin/`). Eliminar de esta pantalla link/WhatsApp/copiar/"Registrar otra". "Ver detalles" despliega panel con datos + form editable (cliente, teléfono, fecha, hora, servicio, barbero, estado) → `saveAppointments` + feedback "Datos actualizados".

### Tasks (TDD — RED primero)

- [x] **T24: e2e RED** — reescribir/extender `tests/e2e/nueva-cita.spec.ts`: (1) panel sin form inline y con "¿No lo encuentras? Registralo"; (2) registralo → alta → link+copiar+continuar → paso 2 con cliente; (3) `/Webbyss/registro?nombre=X&tel=Y` precarga y completa registro con email+contraseña → éxito + key en localStorage (página nueva → al inicio 404, RED); (4) tira: 6 visibles, sin pasado, ‹/› pagina 6+6; (5) hoy: con hora congelada (`page.clock`, si la versión de Playwright lo soporta; si no, reportar y usar enfoque alternativo robusto) no aparecen horas previas; (6) éxito: solo mensaje + 2 botones, "Ver detalles" edita y persiste. Observar FAIL.
- [x] **T25: `src/pages/registro.astro`** — página pública de completar registro (query params, localStorage, éxito).
- [x] **T26: `nueva-cita.astro`** — flujo cliente (panel/registralo/confirmación link), tira 6+paginación, horas futuras hoy, éxito simplificado, panel detalles editable.
- [x] **T27: GREEN + verificación** — `npm run build` → **15 pages** (nueva registro); `npx playwright test` → suite completa verde; `git diff --cached` = 0; `git status -uall` solo superficies esperadas; reporte `<command>: <observed result>`.

**Route declaration (Fase 6):** delegated direct — 3+ superficies no triviales → un solo writer `gentle-ai-worker`, veto git.

**Delivery:** commits en pausa (veto del usuario). Build vuelve a 15 pages.

---

## Fase 7 — Pulido de componentes del wizard — spec aprobada por el usuario

**Aprobación:** diseño completo ("sí"). Causa raíz del "diseño general": gap de la spec Fase 6 (no exigió componentes del sistema).

1. **Paso 1 — tarjetas separadas:** buscador en su tarjeta sola; chip **"Nombre · teléfono [Cambiar]"** en **tarjeta propia debajo**, visible SOLO con cliente seleccionado. Bug a fixear: el `hidden` del chip lo pisa el CSS (`display:flex` en `.client-chip`) → forzar `[hidden] { display:none !important; }` (o quitar display del selector). Sin selección → el chip no aparece.
2. **Tira de fechas: 5 en 5** (`PAGE_DAYS` 6→5), ‹ › igual, horizonte 14 → páginas 5/5/4.
3. **Ver detalles (panel de edición):**
   - Cliente+teléfono → fila enlazada **"Nombre · teléfono"** + botón **"Cambiar"** → despliega el mismo buscador (nombre o teléfono) del paso 1; al elegir, actualiza `client`/`phone` de la cita en edición.
   - **FECHA/HORA:** eliminar `<input type=date>` y `<input type=time>`; reusar la **date-strip** y la **grilla de horas libres** del paso 2 (mismos estilos/estados; horas pasadas y ocupadas filtradas).
   - **SERVICIO/BARBERO/ESTADO:** migrar de `<select>` nativos al **patrón M3 exposed dropdown** de `src/styles/patterns.css` (mismos selectores que agenda).
4. **TDD (RED primero)** en `tests/e2e/nueva-cita.spec.ts`:
   - (a) sin cliente seleccionado no existe el chip/Cambiar en paso 1; con selección, tarjeta visible;
   - (b) tira muestra 5 días, ‹ › pagina de 5 en 5;
   - (c) panel de edición: `locator('input[type=date], input[type=time], select')` cuenta 0; fecha/hora editables vía strip+grilla (persisten con "Guardar cambios");
   - (d) "Cambiar" en edición abre buscador y cambiar cliente actualiza los datos persistidos;
   - (e) dropdowns M3 en edición (trigger+panel, no `<select>`).

### Tasks
- [x] **T28: e2e RED** — casos (a)–(e); observar FAIL.
- [x] **T29: implementación** — `nueva-cita.astro` + CSS (chip/hidden, PAGE_DAYS=5, strip+grilla en edición, dropdowns M3, fila cliente enlazada).
- [x] **T30: GREEN + verificación** — `npm run build` → 15 pages; `npx playwright test` → suite completa verde; `git diff --cached` = 0; `git status -uall` solo superficies; reporte `<command>: <observed result>`.

**Route declaration (Fase 7):** delegated direct — componente complejo en 1 archivo + tests → un solo writer `gentle-ai-worker`, veto git.

---

## Fase 8 — Ajustes finos de strip y orden del detalle — spec aprobada (órdenes directas del usuario)

1. **Chips de días más chicos** en ambos strips (paso 2 y edición): 5 chips + ‹ › caben sin scroll lateral en la card (`scrollWidth <= clientWidth`).
2. **‹ siempre visible**: en la primera página aparece **bloqueado** (disabled/no-op, visual atenuado) en vez de oculto, para que el tamaño cuadre. Igual ‹› en la última página (bloqueado, simétrico).
3. **Orden en "Ver detalles":** SERVICIO, BARBERO, ESTADO **antes** de FECHA y HORA.

### Tasks
- [x] **T31: e2e RED** — (i) strip sin scroll lateral (scrollWidth<=clientWidth) en paso 2 y edición; (ii) ‹ presente en página 1 con disabled y click no mueve; ‹› disabled en última página; (iii) orden DOM: triggers de servicio/barbero/estado antes de fecha/hora en panel de edición. Observar FAIL.
- [x] **T32: implementación + GREEN** — CSS chips (flex-basis/gap/máx), botones ‹ › siempre render + estado disabled, reorden de campos en el panel de detalle; `npm run build` → 15 pages; `npx playwright test` → suite completa verde; staged 0.

**Route (Fase 8):** delegated direct — 2 superficies (astro + spec) → un writer `gentle-ai-worker`, veto git.
