# Admin Home & Appointment Registration — Design Spec

**Date:** 2026-10-02
**Status:** Approved (scope option A)
**Feature:** `admin-home`

## Goal

Give the shop admin a mobile-first entry point to the PWA: a demo-gated login, a home
dashboard for the day's operation, and a dedicated screen that registers an appointment
plus walk-in client data and generates a WhatsApp share link so the client can finish
their registration later.

## Scope

**In (v1):**

- `/admin/login` — demo admin login (`admin@barber.com` / `admin`)
- `/admin/` — home dashboard (session-guarded)
- `/admin/nueva-cita` — single-step appointment + client form with link generation (guarded)
- Appointment persistence in `localStorage`
- One Playwright e2e file covering login success and failure
- Visual identity strictly via existing `src/styles/tokens.css`

**Out (later features):**

- `/registro` — client registration page that consumes the generated link. The link is
  generated and shareable now; the landing page comes in the next feature.
- Real auth (Supabase) — replaces the demo gate
- Roles other than admin (barbero, asistente)
- Bottom tabbar (added when a second navigable screen exists)
- Any new runtime dependency (Framework7/Ionic patterns only, no installs)

## Design constraints

- Mobile-first, 375 px base; desktop must not break (graceful widening).
- Existing identity: Playfair Display headings, Atkinson body, gold CTA, light/dark via
  `prefers-color-scheme`, existing radii/borders/spacing from tokens.
- No hex color values outside `tokens.css`.

## Routes & components

### 1. `/admin/login.astro`

- Form: email + password fields, submit button.
- Hardcoded credential constants: `admin@barber.com` / `admin`.
- Success → `sessionStorage.setItem('webbys_admin', '1')` → redirect to `/Webbyss/admin/`.
- Failure → inline error message (no `alert`).
- Already has session → immediate redirect to home.
- Code comment at the check: demo gate only, visible in client code; replaced by
  Supabase auth when the backend lands.
- Styled consistently with the existing `/login` page (same card treatment).

### 2. `/admin/index.astro` (home)

Guard: no `sessionStorage.webbys_admin` → redirect to `/Webbyss/admin/login`.

Sections (top → bottom):

1. **Header:** brand mark + full date + "Admin" chip.
2. **Greeting:** "Hola, Admin" (display font).
3. **KPI grid 2×2:**
   - **Citas hoy** — computed from stored + seeded appointments dated today.
   - **Walk-ins / Ingresos / Ocupación** — static mock values with a
     `// ponytail: mock KPI, wire to backend when Supabase lands` comment.
4. **Agenda de hoy:** card list of appointments dated **today** (same filter as the
   KPI), sorted by time — time, client name, service, status pill
   (Pendiente / Confirmada / Completada).
5. **CTA card:** "+ Nueva cita" → links to `/Webbyss/admin/nueva-cita`. No forms on home.

**Data:** `localStorage.webbys_admin_appointments` = JSON array of
`{ id, date, time, client, phone, service, barber, status }`.
On first load (key absent) seed 3 mock appointments for today.

### 3. `/admin/nueva-cita.astro`

Same guard as home.

Single-step form, two field groups:

- **Cita:** barber select (mock: Carlos, Diego, Miguel), service select (Corte,
  Corte + Barba, Barba, Cejas), date input (default today), time select with 30-minute
  slots from 09:00 to 19:00.
- **Cliente:** name, phone (both required).

**Submit handler (client-side, no page reload):**

1. Validate required fields → inline error messages.
2. Append appointment to localStorage with status `Pendiente`.
3. Render success panel: `✓ Cita registrada`, the generated link
   `{origin}/Webbyss/registro?nombre=…&tel=…` in a readonly input, and two buttons:
   - **Compartir por WhatsApp** → `https://wa.me/?text=…` with the encoded message.
   - **Copiar link** → `navigator.clipboard` in try/catch; on success the button flips
     to "¡Copiado!"; on failure the readonly input stays selectable for manual copy.
4. "Registrar otra" link resets the form.

Code note: query-param link is demo-grade; when Supabase lands, replace with a
single-use token.

## Data flow

```
admin fills form → validate (client) → localStorage (appointment)
                                 ↘ build URL → WhatsApp / clipboard
(client opens link later → /registro consumes nombre/tel — future feature)
```

## Error handling

- Login: wrong credentials → inline error, form stays filled.
- Guards: missing session → redirect (no error page).
- Form: missing required fields → inline messages, no submit.
- Clipboard API failure → URL stays selectable in the readonly input.

## Testing

- New `tests/e2e/admin.spec.ts`:
  1. Wrong password → inline error visible.
  2. Correct credentials → home renders greeting and CTA.
- `npm run build` passes (3 new pages: 11 → 14).
- Manual check: light/dark parity on all three screens (screenshots).

## Delivery

- Branch: `feat/admin-home`, based on the style chain tip
  (`feat/style-system-03-gallery`, which holds `tokens.css`); rebase onto `master`
  after the style chain PRs #5 → #4 → #3 → #2 merge.
- Conventional commits, one work-unit per screen + tests.
- Forecast ~550–650 authored lines → over the 400-line budget → confirm delivery
  strategy (stacked chain vs single PR) at feature-doc creation.

## Open items / next features

- Feature 2: `/registro` client page (consumes `nombre` / `tel` params).
- Supabase auth replaces the demo gate; real KPI/agenda data.
