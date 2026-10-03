# Feature: style-system

**Objective**: Professional frontend style foundation — three-layer design tokens so the
project can grow into the full product (backend, more pages, team) without restyling.

**Why**: Front is being shown to the interested party now; architecture must survive growth.

**Authorized edit surfaces**:
- `src/styles/tokens.css` (new)
- `src/styles/global.css`
- `src/pages/login.astro` (value→token migration only)
- `src/pages/estilos.astro` (new gallery)

**Constraints**: zero visual change on login (light+dark); no layout/zoom/compact edits;
no new dependencies, no Tailwind; raw hex ONLY in tokens.css; Spanish UI copy, English comments.

**Forecast**: ~385 authored lines → actual **788** (236 login + 45 global + 203 tokens + 349 gallery).
**Delivery**: strategy `ask-on-risk` → user chose **`feature-branch-chain`** (2026-10-02) —
tracker `feat/style-system` + 3 chained child PRs (chosen over `stacked-to-main` because the
user wants nothing to land on `main` until the chain completes).
**Route**: delegated (writer trigger: 4 non-trivial files) + parent spot check.
**RDD**: disabled globally (user decision) — ordinary checks only.

## Tasks

- [x] T1 `tokens.css`: primitives → semantics → component; dark via `prefers-color-scheme`
      plus `[data-theme]` override for a future toggle; spacing/radius/shadow scales
- [x] T2 `global.css`: consume semantic tokens (replace Bear Blog blue palette), keep base/reset
- [x] T3 `login.astro`: hardcoded values → tokens, zero visual change
- [x] T4 `estilos.astro`: live gallery (swatches, type, buttons, inputs, spacing)
- [x] T5 verify: `npm run build` 11 pages (writer + parent) · `npx playwright test tests/e2e/`
      6/6 (writer + parent) · visual parity light `#8a6a2f`/dark `#d4af6a` (parent screenshot) ·
      zoom ladder untouched (`git diff | grep zoom` = 0)

## Chain slices (feature-branch-chain)

| PR | Branch | Base | Contents | Lines |
|----|--------|------|----------|-------|
| tracker (draft) | `feat/style-system` | `master` | integration of everything | 788 |
| 1 | `feat/style-system-01-tokens` | `feat/style-system` | this doc + `tokens.css` + `global.css` | 248+33 |
| 2 | `feat/style-system-02-login` | `…-01-tokens` | `login.astro` migration | 236 |
| 3 | `feat/style-system-03-gallery` | `…-02-login` | `estilos.astro` | 349 |

## Progress

- 2026-10-02: feature doc created; branch `feat/style-system`.
- 2026-10-02: T1–T5 done (delegated to gentle-ai-worker, spot-checked by parent); 788 lines
  actual vs 385 forecast → chain strategy asked, user chose `feature-branch-chain`.
