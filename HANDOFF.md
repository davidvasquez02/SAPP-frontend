# Handoff — SAPP Frontend

## Current Status
- Auth mock flow now lives in `src/api/authService.ts` and feeds the AuthContext.
- Added an aspirante mock auth flow in `src/api/aspiranteService.ts` with its own login screen and session kind.
- AuthContext restores sessions from localStorage on load (`src/context/Auth/AuthStorage.ts`).
- Session now includes a `kind` discriminator (`SAPP` vs `ASPIRANTE`) and union user types.
- Protected routes rely on `isAuthenticated` only (no loading state).
- Aspirante-only routes live under `/aspirante/*` with their own layout and guard.
- Routing is centralized in `src/app/routes/index.tsx` with module route helpers that export route elements.
- Router/Auth providers now wrap the app in `src/main.tsx`.
- Protected app shell lives in `src/components/Layout`, now paired with the persistent sidebar in `src/components/Sidebar`.
- Module pages now rely on the sidebar for navigation; the module-level top nav was removed from `src/components/ModuleLayout`.
- Home now greets the signed-in user by `nombreCompleto || username` and prompts selection from the menu.
- Solicitudes, Matrícula, and Créditos pages render “En construcción” placeholders.
- Login page lives in `src/pages/Login` and redirects to `/` after successful login by default.
- The “Soy aspirante” checkbox now routes directly to `/login/aspirante` (no intermediate continue button).
- Added a shared `request<T>` helper in `src/api/httpClient.ts` for authenticated fetch requests with consistent error handling.
- Added stub API services for Solicitudes, Matrícula, and Créditos in `src/api/*Service.ts`.
- Added top-level barrel exports in `src/components/index.ts` and `src/pages/index.ts` for standardized imports.

## Open Challenges
- Replace the mock auth service with real backend integration once auth endpoints are available.
- Define the aspirante document upload flow and API contract once backend endpoints are available.
- Define environment variables and API base URL for production/staging.
- Add automated tests (unit/integration) and CI checks.
- Replace stub module services with real API calls once endpoints are available.

## Next Steps
1. Align frontend auth contracts with backend (`/api/v1` auth endpoints) and replace the mock service.
2. Define aspirante document submission endpoints and replace the aspirante mock flow.
3. Add `.env.local` (or equivalent) for API base URLs.
4. Add test scaffolding (Vitest + React Testing Library) and baseline coverage.
5. Wire module pages to the new service stubs once backend endpoints are defined.

## Key Paths / Artifacts / Datasets
- **Routing:** `src/app/routes/index.tsx`, `src/app/routes/*Routes.tsx`
- **ProtectedRoute:** `src/app/routes/protectedRoute.tsx`
- **Aspirante guard/routes:** `src/app/routes/aspiranteOnlyRoute.tsx`, `src/app/routes/aspiranteRoutes.tsx`
- **Auth context/types/storage:** `src/context/Auth/*`
- **Mock auth API:** `src/api/authService.ts`
- **Mock aspirante API:** `src/api/aspiranteService.ts`
- **HTTP client:** `src/api/httpClient.ts`
- **Module service stubs:** `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, `src/api/creditosService.ts`
- **Pages:** `src/pages/Home`, `src/pages/Solicitudes`, `src/pages/Matricula`, `src/pages/Creditos`, `src/pages/Login`, `src/pages/AspiranteLogin`, `src/pages/AspiranteDocumentos`
- **Shared components:** `src/components/*`
- **Barrel exports:** `src/components/index.ts`, `src/pages/index.ts`
- **Layout + Sidebar:** `src/components/Layout`, `src/components/Sidebar`
- **Aspirante layout:** `src/components/AspiranteLayout`
- **Module layout:** `src/components/ModuleLayout`
- **Assets:** `src/assets/*`
- **Datasets/Artifacts:** None bundled in repo.

## Recent Test Results + Logs
- No tests run in this update.

## Schemas / Contracts (Expected Outputs)
- **Auth session contract:** `src/context/Auth/types.ts`
  - `AuthSession`: `{ kind: "SAPP" | "ASPIRANTE", accessToken: string, user: AuthUser | AspiranteUser }`
- **Mock login output:** `src/api/authService.ts`
  - Returns `AuthSession` with `kind: "SAPP"`, `accessToken: "mock-token"` and demo user data.
- **Mock aspirante login output:** `src/api/aspiranteService.ts`
  - Returns `AuthSession` with `kind: "ASPIRANTE"`, `accessToken: "mock-aspirante-token"` and aspirante demo data.
- **HTTP client request helper:** `src/api/httpClient.ts`
  - `request<T>(input, init?)` uses `fetch`, attaches `Authorization` when a session token exists, and throws on non-OK responses.

## Environment & Package Versions
- **Runtime:** Node.js (version not captured here; use `node -v`), npm.
- **Frontend tooling:**
  - React 19.2.0
  - React DOM 19.2.0
  - React Router DOM 7.9.2
  - TypeScript 5.9.3
  - Vite (rolldown-vite) 7.2.5
  - @vitejs/plugin-react-swc 4.2.2
  - ESLint 9.39.1
- **Python envs (venv/conda/poetry):** Not used in this project.

### Avoiding Duplicate Environments
- Use the existing `package-lock.json` with `npm install`.
- Reuse `node_modules` if already present; avoid creating separate JS package managers unless explicitly required.
