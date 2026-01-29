# SAPP Frontend

## Purpose & Scope
This repository hosts the React frontend for SAPP (Sistema de Apoyo para la Gestión de Solicitudes de Posgrados) at EISI–UIS. The UI centralizes workflows such as admisiones, matrícula académica/financiera, solicitudes, exámenes de candidatura, trabajos de grado, and notificaciones.

## Architecture (Brief)
- **Routing:** React Router v7 with protected routes (`src/app/routes/index.tsx` + `src/app/routes/protectedRoute.tsx`) and aspirante-only routes (`src/app/routes/aspiranteOnlyRoute.tsx`).
- **Auth state:** Context-based session management with localStorage persistence (`src/context/Auth` + `src/context/Auth/AuthStorage.ts`) and session kind support (`SAPP` vs `ASPIRANTE`).
- **Auth service:** `src/api/authService.ts` performs real login against the backend (`/sapp/auth/login`) using the shared API response envelope and maps the response into the local auth session.
- **Aspirante auth:** `src/api/aspiranteAuthService.ts` fetches `/sapp/aspirante/consultaInfo` and maps the aspirante info into an `AuthSession` via `src/api/aspiranteAuthMappers.ts`.
- **Auth DTOs/mappers:** `src/api/authTypes.ts` + `src/api/authMappers.ts` define backend DTOs and the mapping into `AuthSession`.
- **API config/types:** `src/api/config.ts` defines `API_BASE_URL` (from `VITE_API_BASE_URL`), and `src/api/types.ts` defines the standard `{ ok, message, data }` envelope.
- **HTTP client:** `src/api/httpClient.ts` wraps `fetch`, attaching the auth token and standardizing error handling for module services.
- **Document checklist API:** `src/api/documentChecklistTypes.ts` + `src/api/documentChecklistService.ts` define DTOs (including uploaded metadata) and a GET client for `/sapp/document?codigoTipoTramite=1002&tramiteId=...`.
- **Tipos de documento API:** `src/api/tipoDocumentoIdentificacionTypes.ts` + `src/api/tipoDocumentoIdentificacionService.ts` provide DTOs and a GET client for `/sapp/tipoDocumentoIdentificacion`.
- **Aspirante document upload UI:** checklist-style cards in `src/pages/AspiranteDocumentos` backed by the real upload service (`src/api/documentUploadService.ts`) plus base64/checksum utilities (`src/utils/fileToBase64.ts`, `src/utils/sha256.ts`).
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
There are no seed scripts. The SAPP login calls the backend directly:
- Endpoint: `POST ${VITE_API_BASE_URL || "http://localhost:8080"}/sapp/auth/login`
- Response envelope: `{ ok, message, data }`
- The frontend maps the response into an `AuthSession` and keeps a placeholder token (`accessToken: "NO_TOKEN"`) until the backend returns one.

The aspirante login now also calls the backend directly:
- Endpoint: `GET ${VITE_API_BASE_URL || "http://localhost:8080"}/sapp/aspirante/consultaInfo?numeroInscripcion=...&tipoDocumentoId=...&numeroDocumento=...`
- Response envelope: `{ ok, message, data }`
- The frontend maps the aspirante response into an `AuthSession` with `kind: "ASPIRANTE"` and `accessToken: "NO_TOKEN"`.

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
- Added aspirante authentication: session kind (`SAPP` vs `ASPIRANTE`) and `/aspirante/*` protected routes with their own layout and placeholder documents page.
- Switched the aspirante documents checklist to `/sapp/document` with `codigoTipoTramite=1002` and `tramiteId` from `session.user.inscripcionAdmisionId`, mapping `documentoCargado` + `documentoUploadedResponse` into UI status and filename.
- Implemented a checklist-style aspirante document upload UI with per-document status, file selection, and progress tracking.
- Added `DocumentUploadCard` component styles and the checklist-driven aspirante upload UI.
- Replaced the aspirante mock upload with a real `POST /sapp/document` integration that sends base64 content + SHA-256 checksum, updates the UI status, and refreshes the checklist after a successful upload.
- Added a shared `request<T>` helper in `src/api/httpClient.ts` to centralize auth headers and HTTP error messaging.
- Stubbed module API services in `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, and `src/api/creditosService.ts` for future integration.
- Renamed the Trámites module to Solicitudes across routes, pages, and service stubs.
- Updated the login page so selecting “Soy aspirante” immediately routes to `/login/aspirante` instead of showing a continue button.
- Updated the aspirante login screen to capture número de inscripción, tipo de documento (loaded from `/sapp/tipoDocumentoIdentificacion`), and número de documento before starting the session.
- Replaced the aspirante mock login with a real `/sapp/aspirante/consultaInfo` GET and mapped the response into the aspirante session stored in localStorage.
- Normalize aspirante `numeroInscripcionUis` to a string in session storage to keep rendering/routes consistent.
- Extend aspirante session data to include nombre, director, grupo de investigación, teléfono, y fecha de registro as returned by the backend.
- Show the expanded aspirante session metadata (nombre, inscripción, grupo, director, teléfono, email) in the aspirante layout header.
