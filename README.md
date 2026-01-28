# SAPP Frontend

## Purpose & Scope
This repository hosts the React frontend for SAPP (Sistema de Apoyo para la Gestión de Solicitudes de Posgrados) at EISI–UIS. The UI centralizes workflows such as admisiones, matrícula académica/financiera, solicitudes, exámenes de candidatura, trabajos de grado, and notificaciones.

## Architecture (Brief)
- **Routing:** React Router v7 with protected routes (`src/app/routes/index.tsx` + `src/app/routes/protectedRoute.tsx`) and aspirante-only routes (`src/app/routes/aspiranteOnlyRoute.tsx`).
- **Auth state:** Context-based session management with localStorage persistence (`src/context/Auth` + `src/context/Auth/AuthStorage.ts`) and session kind support (`SAPP` vs `ASPIRANTE`).
- **Auth service:** `src/api/authService.ts` performs real login against the backend (`/sapp/auth/login`) using the shared API response envelope and maps the response into the local auth session.
- **Auth DTOs/mappers:** `src/api/authTypes.ts` + `src/api/authMappers.ts` define backend DTOs and the mapping into `AuthSession`.
- **API config/types:** `src/api/config.ts` defines `API_BASE_URL` (from `VITE_API_BASE_URL`), and `src/api/types.ts` defines the standard `{ ok, message, data }` envelope.
- **HTTP client:** `src/api/httpClient.ts` wraps `fetch`, attaching the auth token and standardizing error handling for module services.
- **UI composition:** Page-level views in `src/pages` (Home/Solicitudes/Matrícula/Créditos), shared layout/components in `src/components`, global styles in `src/styles` (login screen in `src/pages/Login`).
- **Barrel exports:** Top-level `src/components/index.ts` and `src/pages/index.ts` centralize exports for cleaner imports.
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

### Environment Variables
```env
# .env.local
VITE_API_BASE_URL=http://localhost:8080
```

### Seeds / Mock Data
There are no seed scripts. The SAPP login now calls the backend directly:
- Endpoint: `POST ${VITE_API_BASE_URL || "http://localhost:8080"}/sapp/auth/login`
- Response envelope: `{ ok, message, data }`
- The frontend maps the response into an `AuthSession` and keeps a placeholder token (`accessToken: "NO_TOKEN"`) until the backend returns one.
- Aspirante login remains mocked in `src/api/aspiranteService.ts`:
  - Empty number -> `Número de aspirante requerido`; less than 4 chars -> `Número de aspirante inválido`.
  - Returns `kind: "ASPIRANTE"`, `accessToken: "mock-aspirante-token"` and a demo aspirante user.

## Recent Decisions (Changelog-lite)
- Integrated real SAPP login against `/sapp/auth/login` using the standard `{ ok, message, data }` response envelope and mapped it to `AuthSession`.
- Added API base URL config (`VITE_API_BASE_URL`) with a localhost default and shared API response typing.
- Persist the auth session in localStorage via `AuthStorage` so reloads restore the session automatically.
- Use `rolldown-vite@7.2.5` as the Vite engine via npm alias.
- Centralize routing in `src/app/routes/index.tsx` with module route files and a `ProtectedRoute` wrapper.
- Move router/auth providers to `src/main.tsx` and introduce `Layout` for the protected app shell.
- Export module routes as route elements (not components) so React Router v7 `Routes` accepts them without rendering errors.
- Added the shared `Sidebar` component to drive navigation and logout across protected routes.
- Removed the duplicated module-level top navigation so the sidebar is the single source of navigation.
- Standardized the page folders under `src/pages/Home`, `src/pages/Solicitudes`, `src/pages/Matricula`, and `src/pages/Creditos`.
- Added top-level barrel exports for components and pages to standardize imports.
- Updated the Home page to greet the signed-in user by `nombreCompleto || username` and prompt to select a menu option.
- Added “En construcción” placeholders to Solicitudes, Matrícula, and Créditos module pages.
- Standardized the login page location to `src/pages/Login` and default redirect to `/` after login.
- Added aspirante authentication: session kind (`SAPP` vs `ASPIRANTE`), mock aspirante login, and `/aspirante/*` protected routes with their own layout and placeholder documents page.
- Added a shared `request<T>` helper in `src/api/httpClient.ts` to centralize auth headers and HTTP error messaging.
- Stubbed module API services in `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, and `src/api/creditosService.ts` for future integration.
- Renamed the Trámites module to Solicitudes across routes, pages, and service stubs.
- Updated the login page so selecting “Soy aspirante” immediately routes to `/login/aspirante` instead of showing a continue button.
