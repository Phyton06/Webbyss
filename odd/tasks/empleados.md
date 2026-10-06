# Empleados Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.
> Read this file before touching any source.

**Goal:** Employee management module (admin / barbero / asistente) as a **contact list**,
not a table: grouped rows with avatar + name + phone + role chip, tapping a row opens a
full detail screen. Ships with the admin bottom navigation.

**Why this shape:** Decision taken after researching accessible mobile patterns. Responsive
tables that stack rows with `display:block` destroy table semantics for screen readers
(Adrian Roselli), and with three roles there is nothing worth comparing across columns at
375 px. The contact-list pattern is what `agenda.astro` already does successfully with
`.agenda-item` + `.pill`.

**Architecture:** Three static Astro pages under `src/pages/admin/` (list, detail, form),
one shared store module mirroring `src/scripts/clients.js`, one shared bottom-nav
component. Detail and form screens are single pages reading `?id=` from the query string —
Astro is static, so per-id routes would need a build-time list that does not exist while
data lives in `localStorage`. No backend, no new dependencies.

**Tech Stack:** Astro 7 (static), vanilla JS/CSS on existing tokens, Playwright e2e.

## Global Constraints

- **NO git commit, NO git add, NO push** — user tests locally first (explicit user
  instruction recorded in `odd/tasks/admin-home.md`; it overrides the normal work-unit
  commit step).
- Base path `/Webbyss` — every internal link must be prefixed (e.g.
  `/Webbyss/admin/empleados`).
- **No hex color values outside `src/styles/tokens.css`.** Identity: Playfair Display
  headings, Atkinson body, gold accent, light/dark via `prefers-color-scheme`.
- Mobile-first (375 px base), graceful widening.
- sessionStorage guard: `webbys_admin === '1'` (same gate as the other admin pages).
- localStorage key `webbys_admin_employees`, seed when absent.
- Mock data and deferred decisions carry `// ponytail:` comments.
- Form inputs must have associated `<label>` elements (e2e uses `getByLabel`).
- UI copy in Spanish; code and comments in English.
- Every interactive target ≥ 44 × 44 px (WCAG 2.5.5; existing rows sit near 40 px).
- No new npm dependencies.

## Approved Design (screens A + B)

**A — list (`/Webbyss/admin/empleados`)**
- `topbar`: brand + `Admin` chip + search icon button.
- Search field filtering by name or phone, `type="search"` with a real `<label>`.
- Rows grouped by role in this order: `Administración`, `Barberos`, `Asistentes`.
  Group headings are `<h2>` inside a `<ul>`/`<li>` structure that stays valid.
- Row = avatar (initials) + name + phone + role chip + chevron. Entire row is one
  `<button>` or `<a>` so keyboard and screen-reader users get one target, not three.
- FAB `+` linking to `/Webbyss/admin/nuevo-empleado`.
- Bottom navigation (shared component).

**B — detail (`/Webbyss/admin/empleado?id=<id>`)**
- Back control labelled with the section name (`Personal`), not a bare chevron.
- Big avatar, name, role chip.
- Quick actions are **icon-only** (no text labels) — two communication actions:
  - `Llamar` → `tel:` link, phone icon.
  - `WhatsApp` → `https://wa.me/<digits>`, WhatsApp icon.
  - Each is a single `<a>` with an `aria-label` naming the action (icon-only controls
    must still be announced) and a ≥44 px target.
- `Contacto` card: teléfono, email, ingreso.
- `Trabajo` card: rol, estado, horario.
- Record-mutation block at the **end** of the screen, below the cards:
  - `Editar` → `/Webbyss/admin/nuevo-empleado?id=<id>` — full-width secondary button.
  - `Desactivar` (renamed from `Dar de baja`) — full-width `danger-btn`, visually
    separated with breathing room from `Editar`.
  - **Never hard-delete** (undo-friendly CRUD); sets `status: 'Baja'`.
  - Rationale: the top row stays purely communication; both mutations live together at
    the bottom where the thumb reaches them. Spacing + danger styling is what prevents
    a mis-tap on `Desactivar`.
- Missing or unknown `id` → visible message + link back to the list, not a blank page.

**C — form (`/Webbyss/admin/nuevo-empleado`)**
- One page serving both alta and edición, chosen by `?id`:
  - no `?id` → **alta with exactly three fields: Nombre, Teléfono, Rol** (select over
    `ROLES`). Submits `appendEmployee`, then shows the completion link instead of
    redirecting to the list.
  - `?id=…` → **edición** keeps the full field set (Nombre, Teléfono, Correo, Rol,
    Fecha de ingreso, Horario), prefilled, submits `updateEmployee`, returns to detail.
  - unknown `?id` → visible message + link back, same fallback as the detail screen.
- **Alta result screen:** shows the generated completion URL with a copy button
  (`navigator.clipboard`, with a select-all fallback) plus a link to open it directly.
  The URL is built exactly as the shared form already expects:
  `/Webbyss/registro?nombre=…&tel=…&rol=…&empleado=<id>` — `nombre`/`tel`/`rol` are
  URL-encoded, `empleado` carries the new record's id.
- High-contrast warning copy that the link must be sent to the person so they can
  finish. `// ponytail: link carries data in the query; no backend to claim it yet`.
- `// ponytail: single form page for alta + edición; split only when the two flows diverge`.

**D — completion (`/Webbyss/registro`, employee mode)**
- `src/pages/registro.astro` already accepts `?nombre=&tel=` (pre-fills them `readOnly`)
  — this task adds an **employee mode** triggered by the `empleado` query param, without
  changing the existing client-registration behaviour.
- Employee mode shows: Nombre (ro), Teléfono (ro), Rol (ro), **Horario de trabajo
  (editable, new field)**, Correo, Contraseña — same visual style as the client form.
- Every input keeps its `<label>`; the new horario field is labelled `Horario de
  trabajo`.
- On submit in employee mode: call `updateEmployee(empleadoId, { schedule, email })`.
  Do **not** also call `appendRegistered` — that would create a duplicate client record.
  `// ponytail: completion writes to this browser's localStorage; no backend sync yet`.
- If `empleado` is present but unknown in the store, show a visible message rather than
  failing silently.
- Without `empleado`, the page behaves exactly as today (client registration).

## Store Contract (`src/scripts/employees.js`)

Mirror the shape of `src/scripts/clients.js`:

- `STORAGE_KEY = 'webbys_admin_employees'`
- `ROLES = ['admin', 'barbero', 'asistente']`
- Role → section label map: `admin → Administración`, `barbero → Barberos`,
  `asistente → Asistentes`
- Record: `{ id, name, phone, email, role, status, startDate, schedule }`
  - `status`: `'Activo' | 'Baja'`
  - `schedule`: free string, demo value `'Mar a Sáb · 9–19 h'`
- `readEmployees()` — raw read, never seeds, returns `[]` on missing/invalid.
- `seedEmployees()` — seed-on-first-write, **5 demo employees**: 1 admin + 3 barberos
  (`Carlos`, `Diego`, `Miguel`) + 1 asistente, only while the key is absent. The three
  barber names are mandatory (appointments join on first name), which is why the count
  lands at 5 rather than the original 1+2+2 split. Demo phone numbers must reuse the
  `+54 9 11 5555-00xx` range already used by `clients.js`.
- `appendEmployee(data)`, `updateEmployee(id, patch)`, `deactivateEmployee(id)`
  (sets `status: 'Baja'`, does not remove the record).
- `escapeHtml` reuse — import from `appointments.js` rather than reimplementing.
- Employee avatar color derived from role using existing `--color-barber-*` /
  `--color-gold-*` tokens, never a raw hex.
- Appointments reference barbers by first name (`Carlos`, `Diego`, `Miguel`). The seeded
  barbers must keep those exact first names so both stores stay joinable.
  `// ponytail: join on first name until Supabase gives both stores real ids`.

## Bottom Navigation (`src/components/BottomNav.astro`)

- Destinations: Inicio `/Webbyss/admin/`, Agenda `/Webbyss/admin/agenda`,
  Personal `/Webbyss/admin/empleados`, Ajustes `/Webbyss/admin/` (placeholder —
  `// ponytail: no settings screen yet, points at home`).
- `<nav aria-label="Secciones del admin">`, one `<a>` per tab, icon + visible text label.
- Active tab marked with `aria-current="page"`, not colour alone.
- Applied to: `admin/index.astro`, `admin/agenda.astro`, `admin/empleados.astro`,
  `admin/empleado.astro`.
- **Not** applied to `admin/nueva-cita.astro` — it already owns a fixed `.bottom-bar`
  action strip and the two would overlap. `// ponytail: wizard keeps its own action bar`.

## File Structure

- Create: `src/scripts/employees.js`
- Create: `src/components/BottomNav.astro`
- Create: `src/pages/admin/empleados.astro`
- Create: `src/pages/admin/empleado.astro`
- Create: `src/pages/admin/nuevo-empleado.astro`
- Modify: `src/pages/registro.astro` — employee mode via `empleado` param only
- Modify: `src/pages/admin/index.astro` — import + render `BottomNav` (mechanical)
- Modify: `src/pages/admin/agenda.astro` — import + render `BottomNav` (mechanical)
- Create: `tests/e2e/empleados.spec.ts`

## Tasks

- [x] T1 — Store: `src/scripts/employees.js` with contract above + `// ponytail:` notes.
- [x] T2 — `BottomNav.astro` shared component, 4 tabs, `aria-current`, ≥44 px targets.
- [x] T3 — List page `admin/empleados.astro`: guard, search, grouped rows, FAB, nav.
- [x] T4 — Detail page `admin/empleado.astro`: `?id=` reader, cards, quick actions,
      deactivate, unknown-id fallback.
- [x] T5 — Wire `BottomNav` into `admin/index.astro` and `admin/agenda.astro`.
- [x] T6 — Playwright coverage in `tests/e2e/empleados.spec.ts`.
- [x] T7 — Form page `admin/nuevo-empleado.astro`: alta (no `?id`) + edición
      (`?id=…`), labelled inputs, `appendEmployee`/`updateEmployee`, unknown-id fallback.
- [x] **T8** — Detail screen rework: icon-only `Llamar`/`WhatsApp` with `aria-label`;
      move `Editar` into the bottom mutation block; rename `Dar de baja` → `Desactivar`.
- [x] **T9** — Alta shrinks to Nombre/Teléfono/Rol; on success render the generated
      completion URL + copy button instead of redirecting.
- [x] **T10** — `registro.astro` employee mode: `empleado` param → prefilled ro fields
      + new `Horario de trabajo` field, submits `updateEmployee`; client mode unchanged.
- [x] **T11** — Extend `tests/e2e/empleados.spec.ts` for T8–T10.

### Round 5 — replace generic controls with the app's own patterns

User feedback: the edit form uses *generic* controls where the project already has
established designs, and Horario must be selectable instead of free text.

- [x] **T12** — `admin/nuevo-empleado.astro`: replace the native `<select id="f-role">`
  with the M3 exposed dropdown already defined in `src/styles/patterns.css:225-344`
  (`.filter` / `.filter-trigger` / `.filter-panel` / `.filter-check`), copying the
  single-select behaviour from `admin/agenda.astro:340-375` (toggle, radio `change`
  commits + closes, outside tap, Escape).
- [x] **T13** — Same file: replace `<input type="date" id="f-start">` with the month
  calendar from `src/styles/patterns.css:145-212` (`.cal-head`/`.cal-nav`/`.cal-title`/
  `.cal-weekdays`/`.cal-grid`, `.is-today`/`.is-selected`/`.is-outside`), reusing the
  Monday-first render from `admin/agenda.astro:207-260`. Value kept in a hidden
  `name="startDate"` input so submit logic is unchanged. Month nav is unrestricted —
  a start date is usually in the past.
- [x] **T14** — Same file: `Horario` stops being free text.
  - Days: 7 toggle chips (Lun…Dom), multi-select, `aria-pressed`.
  - Hours: `Desde` / `Hasta` rows of `.time-chip` (pattern from
    `nueva-cita.astro:1398-1425`, hourly 08–20).
  - **No schema change**: selections compose back to the legacy `schedule` string
    (`'Lun a Vie · 9–18 h'`) so `empleado.astro:132`, the seeds and the free-text
    `registro.astro` flow keep working. A small parser restores selections from any
    existing string (range `A a B`, list `A, B, C`, hours `9–18` or `09:00–18:00`).
- [x] **T15** — Update `tests/e2e/empleados.spec.ts` for T12–T14 (`getByLabel('Horario')`
  no longer targets a text input) + add coverage for the three new controls.

### Round 6 — compact Horario + multiple schedules

User feedback: the `Desde`/`Hasta` block eats too much space (measured **552 px** for
`#field-schedule`, each `.time-grid` 200 px / 4 wrapped rows), and one employee may need
more than one shift (e.g. `Lun a Vie · 9–18 h; Sáb · 10–14 h`).

- [x] **T16** — Compact time selectors. Replace the two full `.time-grid` rows with two
  M3 dropdowns side by side (`.filter-trigger` reading `Desde 9 h ▾` / `Hasta 18 h ▾`,
  `.filter-panel` holding the existing hour chips). Closed state collapses to a single
  44 px row instead of 400 px of grid.
- [x] **T17** — Repeatable schedule blocks. `#schedule-blocks` renders from a `blocks`
  array; each block = day chips + the two time dropdowns + a remove button (hidden while
  it is the only block); a `+ Agregar otro horario` button appends one.
  **Still no new store field**: `composeSchedule` joins segments with `'; '` and
  `parseSchedule` splits on `';'`, so `schedule` keeps its current display-string shape
  and seeds / `registro.astro` / `empleado.astro` stay untouched.
- [x] **T18** — CSS. Block markup is now generated via `innerHTML`, so `.day-row`,
  `.day-chip` and `.pick-label` must become `:global()` (same reason as `.time-chip`).
  Add `.sched-block`, `.sched-head`, `.sched-times`, `.sched-remove`, `.add-sched`, and a
  4-column grid for the hour panel.
- [x] **T19** — Update `tests/e2e/empleados.spec.ts`: the round-5 test reaches the old
  `#from-grid` / `#to-grid` ids, so it must move to the new dropdown selectors, plus new
  coverage for adding/removing a second schedule block and for the `'; '` round-trip.

## Acceptance Criteria

- `/Webbyss/admin/empleados` grouped list renders the 5 seeded employees with role chips.
- Typing in the search field filters rows by name or phone.
- Tapping a row opens `/Webbyss/admin/empleado?id=…` with that employee's data.
- Detail quick actions are icon-only, each with a non-empty `aria-label`.
- `Llamar` is a `tel:` link; `WhatsApp` opens `wa.me` with digits only (no `+`/spaces).
- `Editar` sits in the bottom mutation block next to `Desactivar`, visually separated.
- `Desactivar` flips status to `Baja` and the list reflects it after reload; record survives.
- Visiting `/Webbyss/admin/empleado?id=nope` shows a message, not an empty screen.
- Alta asks for Nombre, Teléfono and Rol only, then shows a copiable
  `/Webbyss/registro?...&empleado=<id>` URL.
- Opening that URL prefills nombre/tel/rol read-only and exposes `Horario de trabajo`.
- Submitting it updates that employee's `schedule` (and email); client registration
  without `empleado` behaves exactly as before.
- Seeded barbers keep the exact first names `Carlos`, `Diego`, `Miguel`.
- Bottom nav present on the four target pages, absent on `nueva-cita`.
- `npm run build` passes; `npx playwright test` passes.

## Verification

Run from `subsequent-disk/`:

- `npm run build`
- `npx playwright test tests/e2e/empleados.spec.ts`
- `npx playwright test` (full suite — catch regressions on the two modified pages)
- `grep -rnE '#[0-9a-fA-F]{3,8}' src/pages/admin/empleados.astro src/pages/admin/empleado.astro src/pages/admin/nuevo-empleado.astro src/pages/registro.astro src/components/BottomNav.astro src/scripts/employees.js` — expect no output.
- Client-registration regression: the existing spec covering `/Webbyss/registro` must
  still pass unchanged (employee mode must not alter it).

## Progress

- [x] T1 — Store `src/scripts/employees.js`
- [x] T2 — `src/components/BottomNav.astro`
- [x] T3 — List page `admin/empleados.astro`
- [x] T4 — Detail page `admin/empleado.astro`
- [x] T5 — Wire `BottomNav` into `admin/index.astro` and `admin/agenda.astro`
- [x] T6 — `tests/e2e/empleados.spec.ts`
- [x] T7 — Form page `admin/nuevo-empleado.astro`
- [x] T8 — Detail: icon-only actions, `Editar` moved down, `Desactivar`
- [x] T9 — Alta: nombre/teléfono/rol + generated completion URL
- [x] T10 — `registro.astro` employee mode
- [x] T11 — Extended e2e coverage
- [x] T12 — Role field → M3 exposed dropdown (`.filter*`)
- [x] T13 — Fecha de ingreso → month calendar (`.cal*`)
- [x] T14 — Horario → day chips + hour grids, composed back to the legacy string
- [x] T15 — e2e updated for the new controls + new coverage test
- [x] T16 — Desde/Hasta → two compact M3 dropdowns on one 44 px row
- [x] T17 — Repeatable schedule blocks with add/remove (`'; '` segments)
- [x] T18 — `:global()` conversion for the generated block markup + new block CSS
- [x] T19 — e2e selectors moved to the new controls + multi-schedule test

**Verification evidence** (recorded this session, from `subsequent-disk/`):

- RED (spec written first, before any implementation):
  `npx playwright test tests/e2e/empleados.spec.ts`: 8 failed — pages/nav absent
  against the stale `dist/`.
- `npm run build`: OK — "18 page(s) built", "build Complete!"
- `npx playwright test tests/e2e/empleados.spec.ts`: 8 passed (4.7s)
- `npx playwright test`: 41 passed (16.2s) — full suite, no regressions on the
  two modified pages (`index.astro`, `agenda.astro`).
- `grep -rnE '#[0-9a-fA-F]{3,8}' src/pages/admin/empleados.astro src/pages/admin/empleado.astro src/pages/admin/nuevo-empleado.astro src/components/BottomNav.astro src/scripts/employees.js`
  — no output (grep exit 1, no matches).

**Verification evidence — independent reviewer (this session):** `gentle-ai review assess`
returned `risk: high` / `unassessable` (untracked files), and RDD is **off** (global), so
the gate was writer self-verification + an independent `gentle-ai-verify` run. Verdict:
**pass, 0 findings** — scope matched the allow-list exactly (`index.astro`/`agenda.astro`
diffs are 3 lines each: import + render), no-hex grep exit 1, store contract correct,
all 8 tests carry real assertions (41 `expect` calls, zero tautological), unknown-`?id`
form branch attaches no submit listener so it cannot create a record.

**Verification evidence — round 2 (T8–T11, this session, from `subsequent-disk/`):**

- RED (spec extended first, before any implementation):
  `npx playwright test tests/e2e/empleados.spec.ts`: 4 failed, 6 passed —
  icon-only/`aria-label` detail actions, `Desactivar` + bottom mutation block,
  3-field alta, unknown-`empleado` message all missing against the stale `dist/`.
  (The client-flow regression test passes on old code by design — it locks
  today's behaviour.)
- `npm run build`: OK — "18 page(s) built", "build Complete!"
- `npx playwright test tests/e2e/empleados.spec.ts`: 10 passed (4.6s)
- `npx playwright test`: 43 passed (15.0s) — full suite, the existing
  `/Webbyss/registro` client-registration test (`nueva-cita.spec.ts:232`)
  passes unchanged.
- `grep -rnE '#[0-9a-fA-F]{3,8}' …` (all six files incl. `registro.astro`) —
  no output (grep exit 1, no matches).

**Verification evidence — round 3 (2 reviewer MINOR findings + watch item, this session):**

- Independent `gentle-ai-verify` verdict on round 2: `findings`, **0 BLOCKER/CRITICAL,
  2 MINOR**. Both fixed inline:
  1. `src/pages/admin/empleado.astro` — `chatIcon` reworked to bubble + handset (with
     `// ponytail:` noting it is not the official WhatsApp mark).
  2. `src/pages/registro.astro:125` — precedence now
     `ROLE_NAME[employee.role] || employee.role || rolParam` so the live record wins,
     matching nombre/tel.
- Both fixes confirmed compiled in `dist/` (`dist/_astro/empleado.*.js` contains the new
  `M21 11.5a8.4` path; `dist/_astro/registro.*.js` contains `t[_.role]||_.role||s`).
- Re-run after fixes: `npx playwright test tests/e2e/empleados.spec.ts` → **10 passed**;
  `npx playwright test` → **43 passed**; hex audit over all six files → clean;
  `grep line-through` in the new files → none.
- **Watch item closed:** at scroll-to-bottom on the detail page, `.mutations` bottom
  y=611 vs `.bottom-nav` top y=658.5 → no occlusion (`clear: true`). The nav is the last
  flow element, so sticky only covers content transiently while scrolling.
- **Non-bug investigated:** `2022-04-04` and `+54 9 11 5555-0015` looked struck through
  in screenshots. Root cause: Atkinson Hyperlegible's **slashed zero** glyph (a deliberate
  accessibility feature) plus the normal `underline` on the `tel:` link. Verified with
  computed styles (`text-decoration-line: none` on every `dd`, no pseudo-elements, no
  overlaying element) and a high-dpr crop. No fix needed.

**Verification evidence — round 4 (WhatsApp icon, this session):**

- User feedback: "el icono de whatsapp se ve mal". Root cause confirmed by rendering three
  candidates side by side at 3×: the stroke bubble + Feather-phone handset reads as a
  hook, and a stroke-only bubble is muddy at 22px. The filled brand mark is the only one
  that reads at button size.
- Fix in `src/pages/admin/empleado.astro`: `chatIcon` replaced with the filled WhatsApp
  glyph on a single `<path fill="currentColor" stroke="none">`. The element-level
  presentation attribute wins over the inherited `.quick svg { fill:none; stroke:… }`,
  so no CSS change was needed (verified: `pathFill: rgb(138,106,47)`, `pathStroke: none`).
- `npm run build`: OK — 18 pages. New bundle
  `dist/_astro/empleado.astro_astro_type_script_index_0_lang.CLBJWyK8.js` contains the
  new path + fill attrs + `aria-label`; the old path is gone.
- `npx playwright test tests/e2e/empleados.spec.ts`: **10 passed**;
  `npx playwright test`: **43 passed**; hex audit: clean.

**Verification evidence — round 5 (T12–T15, this session, from `subsequent-disk/`):**

- Controls replaced in `src/pages/admin/nuevo-empleado.astro`, all three reusing the
  shared patterns instead of generic inputs:
  - **Rol** → M3 exposed dropdown (`.filter`/`.filter-trigger`/`.filter-panel`/`.filter-check`
    from `patterns.css:225-344`), single-select behaviour copied from `agenda.astro:340-375`.
    Label lives **inside** the trigger as `.filter-name` (same as agenda/nueva-cita) so the
    accessible name carries label + value (`"ROL Barberos ▾"`), not a bare `<label for>`.
    Default role changed `admin` → `barbero` (the native `<select>` defaulted to index 0).
  - **Fecha de ingreso** → month calendar (`.cal-*`), Monday-first render, month nav
    unrestricted (a hire date is usually in the past). Value kept in a hidden
    `f-start` input — submit logic unchanged.
  - **Horario** → 7 `aria-pressed` day chips (Lun…Dom) + `Desde`/`Hasta` grids of
    `.time-chip` (08–20), both styled via `:global(...)` because Astro scoped styles
    don't reach `innerHTML`. Selections compose to the legacy display string
    (`'Mar a Sáb · 9–19 h'`) and `parseSchedule` restores them from range, list, or
    `09:00–18:00` forms — **no schema change**, so `empleado.astro`, the seeds and the
    free-text `registro.astro` flow are untouched.
- `.field select` CSS removed (3 rules); no other file changed.
- RED first: extended/updated the spec before touching the page — 1 failed
  (`getByLabel('Rol')` strict-mode violation against the new trigger + panel), 9 passed.
- After implementation: `npx playwright test tests/e2e/empleados.spec.ts` → **11 passed**
  (new test `edición reuses the app patterns: dropdown, month calendar, selectable horario`
  covers no-`<select>`/no-`type=date`, dropdown open/commit/outside-tap, calendar
  prefill + month nav, day/hour prefill, and that the composed string round-trips to
  the detail page).
- `npm run build`: OK — 18 pages. Re-ran the full suite **against the fresh `dist/`**
  (Playwright's `webServer` previews `dist`, it does **not** rebuild): → **44 passed**.
  Gotcha caught by probe: the first 44/44 run was on stale `dist` and silently missed the
  last markup edit — always rebuild before trusting a green run.
- `grep -rnE '#[0-9a-fA-F]{3,8}'` + `grep -n "rgb("` on the modified file → no output.
- Computed-style probe (not screenshots) confirms the `:global()` CSS actually applied:
  `.day-chip` 46×44 r10, `.time-chip` 80×44 r10, selected states use the token colour
  (`color(srgb 0.541 0.416 0.184 / 0.12)`), `.filter-trigger` 343×44,
  calendar 35 cells with `15` selected under `junio 2021`, `schedule` prefilled
  `Mar a Sáb · 9–19 h`, no panel open initially.

- [x] **T20** — Role dropdown renders correctly. Root cause: the page's own
      `.field label` / `.field input` rules are **descendant** selectors; with Astro's
      cid attributes they hit (0,3,1) and beat `.filter-check` (0,1,0), turning every
      option into a 309×44 stacked radio. Scoped them to direct children
      (`.field > label`, `.field > input`) — the form controls are all direct children,
      the dropdown contents never are.
- [x] **T21** — `Hasta` refuses hours that do not close strictly after `Desde`.
      `isBlocked(key, hour, block)` disables `hour <= from` in the closing picker and
      the last hour in the opening picker (a shift must have something to close with);
      `renderSchedule()` normalises stale pairs on the way in and clamps the closing
      hour when the start moves. The hour handler now re-renders instead of patching
      the DOM by hand.
- [x] **T22** — `✕` remove button stopped looking like an empty white box:
      `background: var(--color-field)` + `--color-field-border` (same surface as the day
      chips), `padding: 0`, inline-flex centring, hover → accent. Still 44×44.

**Verification evidence — round 6 (T16–T19, this session, from `subsequent-disk/`):**

- **Space**: `#field-schedule` measured **552 px → 201 px** (−63 %) with one block; page
  height 1489 → 1137 px. Each `.sched-times` row is a single 44 px line (was two
  200 px / 4-row `.time-grid`s). Per block: 116 px total.
- **Compact pickers**: `Desde`/`Hasta` are now `.filter-trigger`s side by side
  (2 equal columns), each opening a floating `.sched-hours` panel. Panel is half the
  field wide (168 px), so hours lay out in **3 columns → 45×44 px chips** (4 columns
  would have been ~41 px, under the 44 px touch target); 5 rows, 270 px tall, inside
  `.filter-panel`'s 320 px `max-height`.
- **Multiple schedules**: `#schedule-blocks` renders from a `blocks` array. Each block
  has day chips, the two pickers, and a `✕` remove button that is **omitted while it is
  the only block**; blocks renumber (`Horario 1`, `Horario 2`) on every render.
  `+ Agregar otro horario` appends a block and focuses its first day chip.
- **Still no schema change**: `composeSchedule()` joins complete segments with `'; '`,
  `parseSchedule()` splits on `';'` first, so one string carries N shifts. Observed
  round-trips:
  - `'Mar a Sáb · 9–19 h; Sáb, Dom · 10–14 h'` on save → reopens as 2 blocks with
    `Sáb`/`Dom` pressed and `Desde 10 h`.
  - after removing block 1 → `'Sáb, Dom · 10–14 h'`.
  Seeds, `empleado.astro` and the free-text `registro.astro` flow are untouched.
- RED first: the round-5 spec was run against the new build before editing it →
  1 failed / 10 passed, failing exactly on the removed `#from-grid`.
- After the spec update: `npx playwright test tests/e2e/empleados.spec.ts` → **12 passed**
  (new test `several schedules per employee: add, edit, round-trip, remove`).
  Gotcha caught there: `locator('.filter-panel[hidden]')` also matches the *role*
  dropdown's closed panel → scoped to `#schedule-blocks .filter-panel[hidden]`.
- `npm run build`: OK — 18 pages. Full suite against the fresh `dist/` → **45 passed**;
  hex/`rgb(` audit on the modified file → clean.
- Computed-style probe: collapsed state confirmed (`.sched-times` height 44, both
  panels `[hidden]`), pick updates the trigger text and the composed string, add/remove
  renumber correctly, zero console errors from the schedule code.
- **Pre-existing, unrelated**: `Transition was aborted because of invalid state.
  ViewTransition opt-in disabled` fires as an uncaught pageerror on *every* bottom-nav
  link click (Inicio↔Agenda↔Personal), including pages never touched here. It comes
  from the project-wide `@view-transition { navigation: auto }` in `patterns.css:520`
  aborting under headless Chromium; navigation still completes and all 45 tests pass.
  Logged, not fixed — out of this module's scope.

**Verification evidence — round 7 (T20–T22, from the user's local review):**

- Computed-style probe before the fix: `.filter-check` was `display: block` with a
  `309×44` input — matched rules were `.filter-check { flex }` **and**
  `.field[data-astro-cid] label[data-astro-cid] { block }`; the cid-bearing rule won.
  After: `display=flex`, `input=18x18` for all three roles.
- Hours, measured against `Mar a Sáb · 9–19 h`: `to` panel blocks `[8,9]` and enables
  `10…20` ✓; set start `8` → blocks `[8]` only; set start `19` → start picker clamps
  the close to `20 h` and blocks `8…19`, field becomes `Mar a Sáb · 19–20 h` ✓;
  start picker blocks `[20]`.
- Remove button: `background rgb(244,244,245)` (= `--color-field`), `padding 0`,
  `44×44`, label centre 22 vs button centre 22 (aligned).
- `npm run build` → 18 pages; **46 passed** (new test `Hasta only offers hours that
  close strictly after Desde`); hex/`rgb(` audit clean.

**Next step:** all 22 tasks implemented and verified — user reviews locally.
**No commit, no push.**

**Scope decisions (user, this session):**
1. Option C — authorized `src/pages/admin/nuevo-empleado.astro`; seed stays at 5
   (1 admin + 3 barberos + 1 asistente).
2. Round-2 feedback: bottom-nav icons must render (fixed: `<svg>` wrapper was missing
   from `set:html`); detail quick actions become icon-only; `Editar` moves to the bottom
   mutation block next to `Desactivar` (renamed from `Dar de baja`); alta takes only
   Nombre/Teléfono/Rol and emits a completion URL; `registro.astro` gains an employee
   mode that also collects `Horario de trabajo`.

**Engram mirror:** still pending after the final attempt — `mem_save` again returned
"multiple active runtime sessions match the current project and directory" (project
resolved as `webbys2`, no authoritative session id available). The local file above is
the source of truth; re-sync when Engram accepts a write.
