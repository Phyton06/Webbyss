# Unified Login — spec aprobada (Fase única, ODD)

**Objetivo:** UN solo login en `/Webbyss/login/` con 4 tipos de usuario demo y routing automático por rol. Eliminar `/Webbyss/admin/login`.

**Decisiones aprobadas por el usuario:**
- Un solo login (el público `/Webbyss/login/`, donde estaba el usuario).
- 4 roles: **admin, barbero, asistente, cliente** con credenciales demo.
- Post-login por rol: admin → `/Webbyss/admin/`; barbero/asistente/cliente → home `/Webbyss/` (opción a).
- **Home NO se diferencia por rol en esta iteración** (opción b) — solo routing; home por rol es trabajo futuro.
- Los guards del panel admin NO cambian su validación (`sessionStorage.webbys_admin === '1'`); solo cambia la URL a la que redirigen sin sesión.

## Diseño

**Credenciales demo** (mismo patrón que el gate existente):
| Rol | Email | Contraseña |
|---|---|---|
| admin | `admin@barber.com` | `admin` |
| barbero | `barbero@barber.com` | `barbero` |
| asistente | `asistente@barber.com` | `asistente` |
| cliente | `cliente@barber.com` | `cliente` |

**Sesión** (en `src/pages/login.astro` al submit):
- Rol correcto → `sessionStorage.webbys_role = rol` y, si es admin, también `sessionStorage.webbys_admin = '1'` (clave existente → guards intactos).
- Credenciales inválidas → elemento de error nuevo en el form (`hidden` → visible), sin navegación.
- Ya hay sesión con rol → al cargar `/Webbyss/login`, redirigir según rol (admin→panel, resto→home); evita loop.
- Sin sesión → al cargar `/Webbyss/admin/`, `/Webbyss/admin/agenda`, `/Webbyss/admin/nueva-cita`: redirect a `/Webbyss/login` (hoy apuntan a `/Webbyss/admin/login` — 3 guards, una línea cada uno).
- "Recordarme" y botones sociales: decorativos, sin cambios (ponytail).

**Eliminación:** `src/pages/admin/login.astro` se borra (queda 14 pages en build — actualizar expectativa 15→14). Buscar TODAS las referencias a `admin/login` en src/ y tests/ y actualizarlas.

## Tasks (TDD — RED primero)

- [x] **U1: e2e RED** — tests en `tests/e2e/login.spec.ts` (o archivo nuevo si choca): (1) admin vía `/Webbyss/login` → `/Webbyss/admin/`, sesión admin+rol; (2) cada rol no-admin → home con `webbys_role` seteado y SIN `webbys_admin`; (3) credenciales malas → error visible, sin salir del login; (4) `/Webbyss/admin/` sin sesión → redirect a `/Webbyss/login`. Mantener verdes los 6 tests existentes de login.spec (ajustar solo si contradicen la spec). RED observado.
- [x] **U2: login.astro** — script del gate unificado + markup/estilo del error.
- [x] **U3: guards + borrado** — 3 redirects → `/Webbyss/login`; borrar `admin/login.astro`; actualizar `admin.spec.ts` (helper de login) y cualquier referencia suelta.
- [x] **U4: GREEN + verificación** — `npm run build` → **14 pages**; `npx playwright test` → suite completa en verde; `git diff --cached` = 0; reporte `<command>: <observed result>`.

**Route declaration:** delegated direct — 4+ superficies no triviales → un solo writer `gentle-ai-worker`, veto git.

**Delivery:** commits en pausa (veto del usuario hasta prueba local).
