# Admin Dashboard — Build Checkpoint

## Status: COMPLETE

All 8 pages and 8 API routes implemented. Build succeeds with `npm run build`.

## Requirements Coverage

| REQ | Description | Status | File(s) |
|---|---|---|---|
| REQ-179 | Admin auth: single password, 8hr session | Done | `middleware.ts`, `app/api/auth/route.ts`, `app/login/page.tsx` |
| REQ-180 | Economy Config editor with audit log | Done | `app/economy/page.tsx`, `app/api/economy-config/route.ts`, `app/api/economy-config/audit/route.ts` |
| REQ-181 | Batch generation trigger with progress | Done | `components/GenerateBatchModal.tsx`, `app/api/generate-batch/route.ts` |
| REQ-182 | Card review gallery with approve/reject | Done | `components/CardGrid.tsx`, `app/cards/page.tsx`, `app/api/generation-jobs/route.ts` |
| REQ-185 | PostHog analytics embed | Done | `app/analytics/page.tsx` |
| REQ-186 | Season management (create/activate/deactivate) | Done | `app/seasons/page.tsx`, `app/api/season/route.ts` |
| REQ-165 | Balance validation button | Done | `app/validate/page.tsx`, `app/api/validate-balance/route.ts` |

## Pages Built

| Page | Route | Type | Description |
|---|---|---|---|
| Login | `/login` | Client | Single password auth, 8hr session cookie |
| Dashboard | `/` | Server | Metrics overview, pending actions, quick links |
| Cards | `/cards` | Client | Card review gallery with tabs, batch modal, approve/reject |
| Economy | `/economy` | Client | Economy config table editor, audit log panel |
| Seasons | `/seasons` | Client | Season CRUD, activate/deactivate |
| Analytics | `/analytics` | Client | PostHog iframe embed with tabs |
| Validate | `/validate` | Client | Balance validation runner with results table |
| Settings | `/settings` | Server | API key status, DB stats, system info, external links |
| Evolution | `/evolution` | Server | Evolution job overview (lightweight) |

## API Routes Built

| Route | Method | Description |
|---|---|---|
| `/api/auth` | POST/DELETE | Login (set cookie) / Logout (clear cookie) |
| `/api/health` | GET | Railway health check |
| `/api/economy-config` | GET/PUT | Read/write economy_config table |
| `/api/economy-config/audit` | GET | Economy change audit log |
| `/api/generate-batch` | POST | Create batch generation jobs |
| `/api/generation-jobs` | GET/POST | List jobs / Approve or reject |
| `/api/season` | GET/POST | List seasons / Create, activate, deactivate |
| `/api/validate-balance` | POST | Proxy to game server validate-balance |
| `/api/factions` | GET | List factions for dropdowns |

## Components Built

| Component | File | Description |
|---|---|---|
| Sidebar | `components/Sidebar.tsx` | Navigation with SVG icons, mobile hamburger |
| StatCard | `components/StatCard.tsx` | Metric display with delta indicator |
| CardGrid | `components/CardGrid.tsx` | Card review grid, detail modal, bulk approve |
| GenerateBatchModal | `components/GenerateBatchModal.tsx` | Batch generation wizard |

## Lib Files

| File | Description |
|---|---|
| `lib/supabase.ts` | Lazy-initialized Supabase client with service role |
| `lib/game-server.ts` | HTTP client for Railway game server admin API |
| `lib/auth.ts` | Session validation helper |

## Tech Stack

- Next.js 14 with App Router
- TypeScript (strict mode)
- Tailwind CSS v3 with dark mode
- Supabase JS client (service role)
- Server Components by default, Client Components where interactivity needed

## Build Verification

```
npm run build  -- Passes
npm run dev    -- Launches on port 3002
```

## Commits

1. `build(admin): add auth system, Tailwind CSS, sidebar layout, and lib clients`
2. `build(admin): add dashboard home, StatCard, and all API routes`
3. `build(admin): add card review gallery, batch modal, and factions API`
4. `build(admin): add economy editor, seasons, analytics, and validate pages`
5. `build(admin): add settings page, evolution overview, update env config`

## Notes

- Auth uses httpOnly cookie with base64-encoded timestamp:secret token (not JWT library to minimize dependencies)
- Supabase client uses Proxy pattern for lazy initialization to avoid build-time errors
- All admin actions write to `admin_audit_log` table
- Middleware guards all routes except `/login`, `/api/health`, `/api/auth`
- PostHog embed shows helpful fallback when API key is not configured
- Validate page gracefully handles the game server's `not_implemented` response
