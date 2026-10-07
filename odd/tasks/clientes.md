# CRUD de clientes — baneo + comentarios

## Objetivo

Un CRUD de clientes a espejo del de empleados, sobre el store de clientes que ya
existe (`src/scripts/clients.js`), con dos diferencias: en vez de horario, el cliente
se puede **banear**, y su perfil acumula **comentarios** visibles para los trabajadores.

## Problema / por qué

Hoy los clientes solo existen dentro del buscador de `nueva-cita` y como texto plano en
`agenda.astro`. No hay pantalla de cliente, no hay forma de marcar a alguien que no
quiere uno recibir, y no hay lugar para dejarle una nota al equipo
("no llega a tiempo", "ya canceló varias veces", "es agresivo").

## Decisión de producto (usuario, 2026-10-05)

**Baneo = opción 3, con el refinamiento del usuario:** al banear,

1. se **bloquea** agendarle citas;
2. sus citas **Pendiente / Confirmada** pasan a **Cancelado** (`Atendido` es historia y
   se conserva);
3. en el buscador de `nueva-cita` **aparece igual**, en **gris y no seleccionable**,
   con el mensaje **BANEADO**.

Comentarios: se guardan en el perfil y el aviso se muestra en las pantallas donde un
trabajador mira al cliente — el buscador de `nueva-cita` (último comentario) y
`agenda.astro` (badge de baneo).

## Alcance autorizado

- `src/scripts/clients.js` — extender el store existente (nuevo store no).
- `src/pages/admin/clientes.astro` — lista (nuevo).
- `src/pages/admin/cliente.astro` — detalle: estado, ban/unban, comentarios (nuevo).
- `src/pages/admin/nuevo-cliente.astro` — alta/edición (nuevo).
- `src/components/BottomNav.astro` — tab "Ajustes" (placeholder que apunta al home)
  pasa a **"Clientes"**. 5 tabs a 375px quedan apretados.
- `src/pages/admin/nueva-cita.astro` — fila baneada gris + no seleccionable + nota.
- `src/pages/admin/agenda.astro` — badge ⚠ BANEADO junto al cliente.
- `tests/e2e/clientes.spec.ts` — cobertura nueva.

Fuera de alcance: backend/Supabase, auth de trabajadores separada (no existe en la app),
borrado definitivo de clientes, edición de comentarios ya guardados (agregar/quitar
alcanza).

## Restricciones

- Español rioplatense en UI copy; código y comentarios en inglés.
- Sin hex fuera de `src/styles/tokens.css` (audit `grep -rnE '#[0-9a-fA-F]{3,8}'` + `rgb(`).
- Labels asociadas; targets táctiles ≥44px; `// ponytail:` para lo diferido.
- Sin dependencias nuevas; Astro scoped styles no alcanzan `innerHTML` → `:global(...)`.
- TDD: RED observado antes del fix cuando exista un runner determinista.
- **Ruta declarada**: inline. Trigger de delegación (2+ archivos no triviales) **disparado
  pero degradado** — el mecanismo de sub-agentes de este runtime cae con
  "OpenCode's free tier can only be used from within OpenCode" (verificado en sesión).
  Se ejecuta inline y queda registrado acá para que el inline sea observable.

## Criterios de aceptación

- Se puede listar, buscar, crear, editar, ver y banear/desbanear un cliente.
- Banear cancela sus citas Pendiente/Confirmada y deja Atendido intacto.
- Cliente baneado aparece en gris en `nueva-cita`, con el mensaje BANEADO, y no se
  puede seleccionar.
- Un comentario agregado en el perfil se ve en el perfil y su última versión se ve en
  el buscador de `nueva-cita`.
- Bottom nav llega a Clientes y marca la pestaña activa.
- `npm run build` OK; suite completa en verde; audit hex/`rgb()` limpio.

## Checklist

- [x] T1 — Store: `banned`/`bannedAt`/`notes`, `updateClient`, `addNote`, `removeNote`,
      `banClient` (cancela Pendiente/Confirmada por teléfono, fallback nombre),
      `unbanClient`. Lecturas tolerantes a registros viejos sin esos campos.
      Evidencia: `/tmp/opencode/t1-clients.mjs` → **ALL PASS (21 aserciones)**:
      normalización legacy, ban cancela Pendiente/Confirmada, Atendido y ya-Cancelado
      intactos, otro cliente intacto, fallback por nombre sin teléfono, notas
      (trim/rechazo de vacío/baja), unban limpia el flag y no revierte cancelaciones.
- [x] T2 — `clientes.astro`: búsqueda + agrupación Activos/Baneados, fila con
      nombre/teléfono/chip de estado, FAB a alta, auth guard, bottom nav.
      Evidencia: `clientes.spec.ts` tests 1 y 2 (lista con 14 filas seed,
      búsqueda por nombre y por teléfono, vacío restaura el total).
      Ruta: inline.
- [x] T3 — `cliente.astro`: estado, Banear/Desbanear, historial de citas, lista de
      comentarios con alta y baja, link a edición, fallback de id desconocido.
      Evidencia: tests 4, 6, 7, 8. Ruta: inline.
- [x] T4 — `nuevo-cliente.astro`: nombre + teléfono, alta y edición con prefill.
      Evidencia: tests 3 y 5. Ruta: inline.
- [x] T5 — `BottomNav.astro`: Ajustes → Clientes + detección de pestaña activa.
      Evidencia: test 11 (`aria-current="page"` en lista y ficha). Ruta: inline.
- [x] T6 — `nueva-cita.astro`: fila baneada gris/no seleccionable + mensaje BANEADO +
      último comentario. Evidencia: test 9 (`disabled`, badge, nota, click no
      selecciona, cliente activo sigue habilitado). Ruta: inline.
- [x] T7 — `agenda.astro`: badge ⚠ BANEADO junto al nombre del cliente.
      Evidencia: test 10. Ruta: inline.
- [x] T8 — `tests/e2e/clientes.spec.ts`: **11 tests, todos verdes**.
- [x] T9 — `npm run build` → **21 páginas**; suite completa → **57/57 passed**;
      audit `grep hex`/`rgb()` sobre `src/` → **sin aportes nuevos** (los hits
      restantes son pre-existentes en `tipografías`, `login`, `InstallPrompt`,
      `blog`, `Footer`).

## Bugs encontrados por los tests (T8)

- `banChip` se borró de la definición pero seguía referenciado dentro del
  template de `cliente.astro` → `ReferenceError` al armar el `innerHTML`, la
  ficha quedaba **completamente vacía**. Fix: eliminar la interpolación.
- El buscador de `clientes.astro` hacía
  `seedClients().filter(c => searchClients(q).includes(c))` — `searchClients()`
  re-lee el store y devuelve **objetos nuevos**, así que `.includes()` (identidad)
  daba falso siempre: cualquier query devolvía **0 filas**. Fix:
  `seedClients(); const matches = searchClients(value);`
- `seedClients()` deriva su roster de las citas **en bruto**; en una primera
  visita a la lista antes de sembrar `appointments`, los 11 clientes derivados
  quedaban afuera para siempre (el seed es once). Fix: `loadAppointments()`
  antes del `seedClients()` en `clientes.astro` y `cliente.astro`.
- `aria-label` del botón de búsqueda topbar duplicaba el label del input →
  `getByLabel` ambiguo en strict mode. Fix: "Ir al buscador de clientes".

## Ajustes post-entrega (reporte del usuario, 2026-10-06)

- **Input de comentario crudo** (caja blanca nativa, label sin estilo) en la card
  Comentarios: `.field`, `.field > label`, `.field > input`, `.field-error` y
  `.note-form` en `cliente.astro` **no estaban en `:global()`** y el form se
  inyecta por `innerHTML` → Astro les agrega `data-cid` y nunca matchean.
  Fix: 10 selectores pasados a `:global(...)`. Verificado con computed styles en
  dark (`--color-field` = `rgb(20,20,20)`, label `uppercase`).
- **Alta no debe mandar al perfil**: `nuevo-cliente.astro` redirigía a
  `cliente?id=…`. Ahora muestra `#result-view` con el link de registro absoluto
  (`${location.origin}/Webbyss/registro?nombre=…&tel=…`, el mismo formato que ya
  usa `nueva-cita`), botón **Copiar link**, **Abrir el link**, y salida explícita
  a la ficha o a la lista. La edición sigue redirigiendo a la ficha.
  Evidencia: test 3 reescrito (validación + valor exacto del link + click a la
  ficha); el helper `createClient` ahora pasa por la vista de resultado.

## Ronda 2 — simplificación del resultado de alta (2026-10-06)

Sobrescribe lo anterior en tres puntos:

- **Un solo mensaje en todos lados** (alta de cliente *y* de empleado): se
  eliminó el recuadro `.result-warn` amarillo y esa frase se fusionó en
  `.result-lead`, que ahora menciona WhatsApp y el propósito del link.
- **Un solo botón de acción**: se quitó *Abrir el link* de las dos altas.
  Queda únicamente *Copiar link*.
- **Alta de cliente sin botones de salida**: se eliminaron *Ver la ficha del
  cliente* y *Volver a clientes*; `#result-view` ya no contiene ningún `<a>`.
  Ojo: `nuevo-cliente` y `nuevo-empleado` **no** renderizan `BottomNav`, así
  que la única salida real es el botón atrás del navegador.
- Tests: el helper `createClient` vuelve a la lista y entra por el teléfono;
  el test de alta y el de empleados validan que `.result-warn` y los `<a>` de
  `#result-view` no existen.
- Evidencia: `npm run build` → 21 páginas; `npx playwright test` → **57/57**.

## Progreso

- [x] T1
- [x] T2
- [x] T3
- [x] T4
- [x] T5
- [x] T6
- [x] T7
- [x] T8
- [x] T9

**Siguiente paso:** commit de unidad de trabajo **solo si el usuario lo pide**
(mensajes convencionales, sin `Co-Authored-By`).
