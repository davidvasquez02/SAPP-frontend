# SAPP Frontend

## Purpose & Scope
This repository hosts the React frontend for SAPP (Sistema de Apoyo para la Gestión de Trámites de Posgrados) at EISI–UIS. The UI centralizes workflows such as admisiones, matrícula académica/financiera, solicitudes, exámenes de candidatura, trabajos de grado, and notificaciones.

## Architecture (Brief)
- **Routing:** React Router v7 with protected routes (`src/app/routes/index.tsx` + `src/app/routes/protectedRoute.tsx`).
- **Auth state:** Context-based session management with localStorage persistence (`src/context/Auth` + `src/context/Auth/AuthStorage.ts`).
- **Mock auth service:** `src/api/authService.ts` provides a simple login flow for UI development.
- **HTTP client:** `src/api/httpClient.ts` wraps `fetch`, attaching the auth token and standardizing error handling.
- **UI composition:** Page-level views in `src/pages` (Home/Trámites/Matrícula/Créditos), shared layout/components in `src/components`, global styles in `src/styles` (login screen in `src/pages/Login`).
- **App shell:** `src/components/Layout` wraps protected routes with a persistent sidebar (`src/components/Sidebar`); `src/main.tsx` provides router + auth providers. Module pages render a header with user info and logout actions via `src/components/ModuleLayout`.

## Tech Stack (Exact Versions)
- **React:** 19.2.0
- **React DOM:** 19.2.0
- **React Router DOM:** 7.9.2
- **TypeScript:** 5.9.3
- **Vite:** rolldown-vite 7.2.5 (npm alias)
- **@vitejs/plugin-react-swc:** 4.2.2
- **ESLint:** 9.39.1

> Full dependency list: see `package.json`.

## How to Run
```bash
npm install
npm run dev
```

Other useful commands:
```bash
npm run build
npm run preview
npm run lint
```

### Seeds / Mock Data
There are no seed scripts. Authentication is mocked in `src/api/authService.ts`:
- Provide any non-empty username/password (otherwise it throws `Credenciales inválidas`).
- Returns a fixed demo session with `accessToken: "mock-token"` and a demo user (`roles: ["ESTUDIANTE"]`, `programa: "MAESTRIA"`).

## Recent Decisions (Changelog-lite)
- Replaced the old `loginMock` helper with `authService.login` for mock auth.
- Persist the auth session in localStorage via `AuthStorage` so reloads restore the session automatically.
- Keep mocked authentication to enable UI flow without backend integration.
- Use `rolldown-vite@7.2.5` as the Vite engine via npm alias.
- Centralize routing in `src/app/routes/index.tsx` with module route files and a `ProtectedRoute` wrapper.
- Move router/auth providers to `src/main.tsx` and introduce `Layout` for the protected app shell.
- Export module routes as route elements (not components) so React Router v7 `Routes` accepts them without rendering errors.
- Added the shared `Sidebar` component to drive navigation and logout across protected routes.
- Removed the duplicated module-level top navigation so the sidebar is the single source of navigation.
- Standardized the page folders under `src/pages/Home`, `src/pages/Tramites`, `src/pages/Matricula`, and `src/pages/Creditos`.
- Updated the Home page to greet the signed-in user by `nombreCompleto || username` and prompt to select a menu option.
- Added “En construcción” placeholders to Trámites, Matrícula, and Créditos module pages.
- Standardized the login page location to `src/pages/Login` and default redirect to `/` after login.
- Added a shared `request<T>` helper in `src/api/httpClient.ts` to centralize auth headers and HTTP error messaging.
- Stubbed module API services in `src/api/tramitesService.ts`, `src/api/matriculaService.ts`, and `src/api/creditosService.ts` for future integration.
