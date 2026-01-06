# Handoff — SAPP Frontend

## Current Status
- Documentation refreshed (README + HANDOFF).
- App runs as a React/Vite SPA with protected routes and a mocked authentication flow.
- No backend integration or real API calls are wired yet (auth is mocked).

## Open Challenges
- Replace `loginMock` with real API integration when backend endpoints are ready.
- Define environment variables and API base URL for production/staging.
- Add automated tests (unit/integration) and CI checks.

## Next Steps
1. Confirm backend auth/session contract and implement real login in `src/api`.
2. Introduce `.env.local` (or equivalent) for API base URLs.
3. Add test scaffolding (Vitest + React Testing Library) and baseline coverage.

## Key Paths / Artifacts / Datasets
- **Routing:** `src/app/routes/AppRoutes/AppRoutes.tsx`
- **Auth context/types:** `src/context/Auth/*`
- **Mock auth API:** `src/api/auth.ts`
- **Pages:** `src/pages/*`
- **Shared components:** `src/components/*`
- **Assets:** `src/assets/*`
- **Datasets/Artifacts:** None bundled in repo.

## Recent Test Results + Logs
- No tests run in this update.

## Schemas / Contracts (Expected Outputs)
- **Auth session contract:** `src/context/Auth/types.ts`
  - `AuthSession`: `{ accessToken: string, user: { id, username, roles, nombreCompleto?, programa?, email? } }`
- **Mock login output:** `src/api/auth.ts`
  - Returns `AuthSession` with `accessToken: "mock-token-<username>"` and a single role based on username.

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
