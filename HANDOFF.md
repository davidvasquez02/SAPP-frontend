# Handoff — SAPP Frontend

## Current Status
- Auth mock flow now lives in `src/api/authService.ts` and feeds the AuthContext.
- AuthContext restores sessions from localStorage on load (`src/context/Auth/AuthStorage.ts`).
- Protected routes rely on `isAuthenticated` only (no loading state).

## Open Challenges
- Replace the mock auth service with real backend integration once auth endpoints are available.
- Define environment variables and API base URL for production/staging.
- Add automated tests (unit/integration) and CI checks.

## Next Steps
1. Align frontend auth contracts with backend (`/api/v1` auth endpoints) and replace the mock service.
2. Add `.env.local` (or equivalent) for API base URLs.
3. Add test scaffolding (Vitest + React Testing Library) and baseline coverage.

## Key Paths / Artifacts / Datasets
- **Routing:** `src/app/routes/AppRoutes/AppRoutes.tsx`
- **Auth context/types/storage:** `src/context/Auth/*`
- **Mock auth API:** `src/api/authService.ts`
- **Pages:** `src/pages/*`
- **Shared components:** `src/components/*`
- **Assets:** `src/assets/*`
- **Datasets/Artifacts:** None bundled in repo.

## Recent Test Results + Logs
- No tests run in this update.

## Schemas / Contracts (Expected Outputs)
- **Auth session contract:** `src/context/Auth/types.ts`
  - `AuthSession`: `{ accessToken: string, user: { id, username, roles, nombreCompleto?, programa?, email? } }`
- **Mock login output:** `src/api/authService.ts`
  - Returns `AuthSession` with `accessToken: "mock-token"` and demo user data.

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
