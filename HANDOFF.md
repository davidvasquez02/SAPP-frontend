# Handoff — SAPP Frontend

## Current Status
- SAPP login now calls the backend (`POST /sapp/auth/login`) and maps the `{ ok, message, data }` response into `AuthSession`.
- Added API base URL config (`src/api/config.ts`) using `VITE_API_BASE_URL` with a localhost default.
- Added API response typing (`src/api/types.ts`) and login DTOs/mappers (`src/api/authTypes.ts`, `src/api/authMappers.ts`).
- Updated aspirante login to capture número de inscripción, tipo de documento, and número de documento before starting the mock session.
- Added tipos de documento DTOs/service (`src/api/tipoDocumentoIdentificacionTypes.ts`, `src/api/tipoDocumentoIdentificacionService.ts`) to fetch `/sapp/tipoDocumentoIdentificacion` for the aspirante login combo.
- Replaced the aspirante mock auth flow with `src/api/aspiranteAuthService.ts` using the new 3-field params.
- Added trámite documentos DTOs + service (`src/api/tramiteDocumentTypes.ts`, `src/api/tramiteDocumentService.ts`) and wired the aspirante documents page to fetch and log `/sapp/tramite/document?tipoTramiteId=4` on entry.
- Implemented a checklist UI for aspirante document upload with per-document status, file selection, and progress tracking (`src/pages/AspiranteDocumentos`).
- Added the `DocumentUploadCard` component for rendering each document requirement (`src/components/DocumentUploadCard`).
- Added UI types for document upload items (`src/pages/AspiranteDocumentos/types.ts`).
- Added a mock upload service to simulate document submissions (`src/api/aspiranteUploadService.ts`).
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
- Backend auth does not return a token yet; the frontend uses `accessToken: "NO_TOKEN"` for session compatibility.
- Define the real aspirante document upload API contract to replace the mock service.
- Confirm backend response for uploaded document metadata (filename, status) to sync UI states.
- Define environment variables and API base URL for production/staging.
- Add automated tests (unit/integration) and CI checks.
- Replace stub module services with real API calls once endpoints are available.

## Next Steps
1. Align auth token handling once the backend returns access tokens, replacing the `NO_TOKEN` placeholder.
2. Define aspirante document submission endpoints and replace the aspirante mock flow.
3. Add `.env.local` (or equivalent) for API base URLs.
4. Add test scaffolding (Vitest + React Testing Library) and baseline coverage.
5. Wire module pages to the new service stubs once backend endpoints are defined.
6. Replace the mock aspirante upload service with a real endpoint once available.

## Key Paths / Artifacts / Datasets
- **Routing:** `src/app/routes/index.tsx`, `src/app/routes/*Routes.tsx`
- **ProtectedRoute:** `src/app/routes/protectedRoute.tsx`
- **Aspirante guard/routes:** `src/app/routes/aspiranteOnlyRoute.tsx`, `src/app/routes/aspiranteRoutes.tsx`
- **Auth context/types/storage:** `src/context/Auth/*`
- **Auth API (SAPP login):** `src/api/authService.ts`
- **Auth DTOs/mappers:** `src/api/authTypes.ts`, `src/api/authMappers.ts`
- **API config/types:** `src/api/config.ts`, `src/api/types.ts`
- **Mock aspirante API:** `src/api/aspiranteAuthService.ts`
- **Tipos documento API:** `src/api/tipoDocumentoIdentificacionTypes.ts`, `src/api/tipoDocumentoIdentificacionService.ts`
- **HTTP client:** `src/api/httpClient.ts`
- **Module service stubs:** `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, `src/api/creditosService.ts`
- **Trámite documentos DTO/service:** `src/api/tramiteDocumentTypes.ts`, `src/api/tramiteDocumentService.ts`
- **Aspirante upload mock service:** `src/api/aspiranteUploadService.ts`
- **Pages:** `src/pages/Home`, `src/pages/Solicitudes`, `src/pages/Matricula`, `src/pages/Creditos`, `src/pages/Login`, `src/pages/AspiranteLogin`, `src/pages/AspiranteDocumentos`
- **Shared components:** `src/components/*`
- **Document upload UI:** `src/components/DocumentUploadCard`, `src/pages/AspiranteDocumentos/types.ts`
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
- **SAPP login output:** `src/api/authService.ts`
  - Expects backend response envelope `{ ok, message, data }` and maps `data` into `AuthSession` with `accessToken: "NO_TOKEN"` until tokens are available.
- **Mock aspirante login output:** `src/api/aspiranteAuthService.ts`
  - Accepts `{ numeroInscripcion, tipoDocumentoId, numeroDocumento }` and returns `AuthSession` with `kind: "ASPIRANTE"`, `accessToken: "mock-aspirante-token"` plus the submitted params stored on the aspirante user.
- **Tipos documento response:** `src/api/tipoDocumentoIdentificacionService.ts`
  - Expects `{ ok, message, data: TipoDocumentoIdentificacionDto[] }` from `GET /sapp/tipoDocumentoIdentificacion` and returns the typed `data` array.
- **HTTP client request helper:** `src/api/httpClient.ts`
  - `request<T>(input, init?)` uses `fetch`, attaches `Authorization` when a session token exists, and throws on non-OK responses.
- **Trámite documentos response:** `src/api/tramiteDocumentService.ts`
  - Expects `{ ok, message, data: TramiteDocumentoDto[] }` from `GET /sapp/tramite/document?tipoTramiteId=4` and returns the typed `data` array.
- **Document upload UI model:** `src/pages/AspiranteDocumentos/types.ts`
  - `DocumentUploadItem`: `{ id, codigo, nombre, obligatorio, status, selectedFile, uploadedFileName?, errorMessage? }`
- **Mock upload response:** `src/api/aspiranteUploadService.ts`
  - `uploadAspiranteDocumento({ aspiranteId, tipoTramiteDocumentoId, file })` returns `{ ok, message }` after a 0.8–1.5s delay.

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
- **Environment variables:** `VITE_API_BASE_URL` (defaults to `http://localhost:8080` if unset).
- **Python envs (venv/conda/poetry):** Not used in this project.

### Avoiding Duplicate Environments
- Use the existing `package-lock.json` with `npm install`.
- Reuse `node_modules` if already present; avoid creating separate JS package managers unless explicitly required.
