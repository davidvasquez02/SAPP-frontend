# Handoff — SAPP Frontend

## Current Status
- SAPP login calls the backend (`POST /sapp/auth/login`) and returns the typed DTO, mapping it + JWT payload claims into `AuthSession`.
- JWT payload decoding (base64url only, no signature validation) lives in `src/utils/jwt.ts` and is used to populate username, roles, `iat`, and `exp`.
- Auth sessions store `accessToken` (JWT), `issuedAt`, and `expiresAt`; protected routes log out when the token is expired.
- Added API base URL config (`src/api/config.ts`) using `VITE_API_BASE_URL` with a localhost default.
- Added API response typing (`src/api/types.ts`) and login DTOs/mappers (`src/api/authTypes.ts`, `src/api/authMappers.ts`).
- Updated aspirante login to capture número de inscripción, tipo de documento, and número de documento before starting the session.
- Added tipos de documento DTOs/service (`src/api/tipoDocumentoIdentificacionTypes.ts`, `src/api/tipoDocumentoIdentificacionService.ts`) to fetch `/sapp/tipoDocumentoIdentificacion` for the aspirante login combo.
- Replaced the aspirante mock auth flow with a real `/sapp/aspirante/consultaInfo` GET in `src/api/aspiranteAuthService.ts`, mapping the response into `AuthSession` via `src/api/aspiranteAuthMappers.ts`.
- Aspirante session now normalizes `numeroInscripcionUis` to a string and persists backend fields (nombre, director, grupoInvestigacion, telefono, fechaRegistro).
- Aspirante layout header shows nombre, inscripción, grupo, director, teléfono, documento, and email from the persisted aspirante session.
- Added document checklist DTOs + service (`src/api/documentChecklistTypes.ts`, `src/api/documentChecklistService.ts`) and wired the aspirante documents page to fetch `/sapp/document?codigoTipoTramite=1002&tramiteId=...` using `session.user.inscripcionAdmisionId`, mapping `documentoCargado` + `documentoUploadedResponse` into UI status/filename.
- Implemented a checklist UI for aspirante document upload with per-document status, file selection, and progress tracking (`src/pages/AspiranteDocumentos`).
- Added the `DocumentUploadCard` component for rendering each document requirement (`src/components/DocumentUploadCard`).
- Added UI types for document upload items (`src/pages/AspiranteDocumentos/types.ts`).
- Added a real document upload service (`src/api/documentUploadService.ts`) that posts to `/sapp/document` with base64 content + SHA-256 checksum.
- Added base64 + SHA-256 helpers for uploads (`src/utils/fileToBase64.ts`, `src/utils/sha256.ts`).
- Aspirante document uploads now update UI status to UPLOADED/ERROR and refresh the checklist after a successful upload.
- AuthContext restores sessions from localStorage on load (`src/context/Auth/AuthStorage.ts`).
- Session includes a `kind` discriminator (`SAPP` vs `ASPIRANTE`) and union user types.
- Protected routes rely on `isAuthenticated` and token expiration checks (no loading state).
- Home page renders a “Mi cuenta” panel that displays username, role codes, and token expiration (to validate JWT decoding).
- Aspirante-only routes live under `/aspirante/*` with their own layout and guard.
- Routing is centralized in `src/app/routes/index.tsx` with module route helpers that export route elements.
- Router/Auth providers wrap the app in `src/main.tsx`.
- Protected app shell lives in `src/components/Layout`, paired with the persistent sidebar in `src/components/Sidebar`.
- Module pages rely on the sidebar for navigation; the module-level top nav was removed from `src/components/ModuleLayout`.
- Home greets the signed-in user by `nombreCompleto || username` and prompts selection from the menu.
- Solicitudes, Matrícula, and Créditos pages render “En construcción” placeholders.
- Login page lives in `src/pages/Login` and redirects to `/` after successful login by default.
- The “Soy aspirante” checkbox routes directly to `/login/aspirante` (no intermediate continue button).
- Added a shared `request<T>` helper in `src/api/httpClient.ts` for authenticated fetch requests with consistent error handling.
- Added a `skipAuth` option to the shared `request<T>` helper so public endpoints can avoid sending Authorization headers (used for convocatorias/inscripciones fetch).
- Added stub API services for Solicitudes, Matrícula, and Créditos in `src/api/*Service.ts`.
- Added top-level barrel exports in `src/components/index.ts` and `src/pages/index.ts` for standardized imports.
- Added role guard utilities (`src/auth/roleGuards.ts`) plus a protected “Admisiones” route with a placeholder page and sidebar visibility limited to Coordinación/Secretaría roles.
- Implemented the Admisiones home selector UI with mock convocatorias, including current vs previous selection and parameterized navigation to convocatoria detail placeholders.
- Expanded Admisiones convocatorias to include programa metadata (id/nivel/nombre) and split the selector into two program-specific sections with independent current/previous lists.
- Simplified the convocatoria detail page to a placeholder (“En construcción”) that optionally displayed program name + periodo from the mock list.
- Replaced the convocatoria detail placeholder with a real inscripciones fetch from `/sapp/inscripcionAdmision/convocatoria/:convocatoriaId`, including loading/error/empty states and row navigation to a new inscripcion detail placeholder route.
- Added inscripcion detail navigation cards and protected placeholder pages for documentos cargados, hoja de vida, examen de conocimiento, and entrevistas.
- Implemented the coordinador/secretaría “Documentos cargados” screen to call the real `/sapp/document` checklist endpoint using `tramiteId = inscripcionId`, render load status + metadata, and capture validation decisions in local UI state.
- Added a shared documentos module (`src/modules/documentos`) with checklist DTOs, a reusable `getDocumentosByTramite` service, and a stubbed `guardarValidacionDocumentos` function for the upcoming backend endpoint.
- Centralized `codigoTipoTramite=1002` in `src/modules/documentos/constants.ts` and reused it in the aspirante checklist fetch.

## Open Challenges
- Confirm JWT payload contract fields with backend (e.g., `rolesUsuario`, `nombreUsuario`, `idUsuario`) and whether timestamps are always present.
- Confirm backend response for uploaded document metadata (filename, version, dates) to extend UI details if needed.
- Define environment variables and API base URL for production/staging.
- Add automated tests (unit/integration) and CI checks.
- Replace stub module services with real API calls once endpoints are available.
- Replace the Admisiones mock data with real service integration once the backend endpoint is defined.
- Validate the inscripcion detail API contract when it becomes available (currently placeholder UI only).
- Define the data contracts and endpoints for documentos validation (coordinación/secretaría) once available.
- Define the data contracts for documentos/hoja de vida/examen/entrevistas once those features are scoped.

## Next Steps
1. Validate JWT claims with real backend tokens (roles/username/id) and adjust the mapper if the payload schema changes.
2. Align aspirante document response metadata (e.g., version/estado) for richer UI display if needed.
3. Add `.env.local` (or equivalent) for API base URLs.
4. Add test scaffolding (Vitest + React Testing Library) and baseline coverage.
5. Wire module pages to the new service stubs once backend endpoints are defined.
6. Validate the `/sapp/document` upload flow with real backend data (errors, size limits, and metadata display).
7. Replace the Admisiones convocatorias mock list with real data once the endpoint is defined.
8. Define the inscripcion detail endpoint contract and replace the placeholder detail page.
9. Wire the inscripcion documentos validation payload to the backend endpoint once delivered.
10. Implement the remaining inscripcion child features (hoja de vida, examen, entrevistas) once backend endpoints are available.

## Key Paths / Artifacts / Datasets
- **Routing:** `src/app/routes/index.tsx`, `src/app/routes/*Routes.tsx`
- **ProtectedRoute:** `src/app/routes/protectedRoute.tsx`
- **Role guard helper:** `src/auth/roleGuards.ts`
- **RequireRoles wrapper:** `src/routes/RequireRoles/RequireRoles.tsx`
- **Aspirante guard/routes:** `src/app/routes/aspiranteOnlyRoute.tsx`, `src/app/routes/aspiranteRoutes.tsx`
- **Auth context/types/storage:** `src/context/Auth/*`
- **Auth API (SAPP login):** `src/api/authService.ts`
- **JWT payload + decoder:** `src/api/jwtPayloadTypes.ts`, `src/utils/jwt.ts`
- **Auth DTOs/mappers:** `src/api/authTypes.ts`, `src/api/authMappers.ts`
- **API config/types:** `src/api/config.ts`, `src/api/types.ts`
- **Aspirante consulta info API:** `src/api/aspiranteAuthService.ts`, `src/api/aspiranteConsultaTypes.ts`, `src/api/aspiranteAuthMappers.ts`
- **Tipos documento API:** `src/api/tipoDocumentoIdentificacionTypes.ts`, `src/api/tipoDocumentoIdentificacionService.ts`
- **HTTP client:** `src/api/httpClient.ts`
- **Module service stubs:** `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, `src/api/creditosService.ts`
- **Document checklist DTO/service:** `src/api/documentChecklistTypes.ts`, `src/api/documentChecklistService.ts`
- **Aspirante upload service:** `src/api/documentUploadService.ts`, `src/api/documentUploadTypes.ts`
- **Upload utilities:** `src/utils/fileToBase64.ts`, `src/utils/sha256.ts`
- **Pages:** `src/pages/Home`, `src/pages/Solicitudes`, `src/pages/Matricula`, `src/pages/Creditos`, `src/pages/Login`, `src/pages/AspiranteLogin`, `src/pages/AspiranteDocumentos`
- **Admisiones page:** `src/pages/AdmisionesPage`
- **Admisiones module:** `src/modules/admisiones/types.ts`, `src/modules/admisiones/mock/convocatorias.mock.ts`
- **Admisiones API:** `src/modules/admisiones/api/types.ts`, `src/modules/admisiones/api/inscripcionAdmisionService.ts`
- **Admisiones selector UI:** `src/pages/AdmisionesHome`
- **Convocatoria detail (real inscripciones):** `src/pages/ConvocatoriaDetalle`
- **Inscripcion detail placeholder:** `src/pages/InscripcionAdmisionDetalle`
- **Inscripcion child pages:** `src/pages/InscripcionDocumentos`, `src/pages/InscripcionHojaVida`, `src/pages/InscripcionExamen`, `src/pages/InscripcionEntrevistas`
- **Documentos module (coordinación/secretaría):** `src/modules/documentos/constants.ts`, `src/modules/documentos/api/types.ts`, `src/modules/documentos/api/documentosService.ts`, `src/modules/documentos/api/validacionDocumentosService.ts`
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
  - `AuthSession`: `{ kind: "SAPP" | "ASPIRANTE", accessToken: string, issuedAt?, expiresAt?, user: AuthUser | AspiranteUser }`
- **SAPP login output:** `src/api/authService.ts`
  - Expects backend response envelope `{ ok, message, data }` and maps `data` + decoded JWT payload into `AuthSession` (username, roles, iat/exp).
  - JWT payload contract: `src/api/jwtPayloadTypes.ts` (supports `rolesUsuario`, `nombreUsuario`/`sub`, `idUsuario`, `iat`, `exp`).
- **Aspirante consulta info output:** `src/api/aspiranteAuthService.ts`
  - Calls `GET /sapp/aspirante/consultaInfo` with `{ numeroInscripcion, tipoDocumentoId, numeroDocumento }`, expects `{ ok, message, data: AspiranteConsultaInfoDto }` (including `nombre`, `director`, `grupoInvestigacion`, `telefono`, `numeroInscripcionUis`, `fechaRegistro`), and maps the response into `AuthSession` with `kind: "ASPIRANTE"` and `accessToken: "NO_TOKEN"`. `numeroInscripcionUis` is normalized to string on write.
- **Tipos documento response:** `src/api/tipoDocumentoIdentificacionService.ts`
  - Expects `{ ok, message, data: TipoDocumentoIdentificacionDto[] }` from `GET /sapp/tipoDocumentoIdentificacion` and returns the typed `data` array.
- **HTTP client request helper:** `src/api/httpClient.ts`
  - `request<T>(input, init?)` uses `fetch`, attaches `Authorization` when a session token exists (unless `skipAuth` is set), and throws on non-OK responses.
- **Document checklist response:** `src/api/documentChecklistService.ts`
  - Expects `{ ok, message, data: DocumentChecklistItemDto[] }` from `GET /sapp/document?codigoTipoTramite=1002&tramiteId=...` and returns the typed `data` array. Each DTO includes `documentoCargado` and `documentoUploadedResponse` (with `nombreArchivoDocumento`, `versionDocumento`, etc.).
- **Documentos checklist (coordinación/secretaría):** `src/modules/documentos/api/documentosService.ts`
  - Expects `{ ok, message, data: DocumentoTramiteItemDto[] }` from `GET /sapp/document?codigoTipoTramite=1002&tramiteId=...` and returns the typed `data` array for the coordinador screen.
- **Documentos validación payload (stub):** `src/modules/documentos/api/validacionDocumentosService.ts`
  - Payload shape: `{ tramiteId, validaciones: [{ tipoDocumentoTramiteId, estado: "CORRECTO" | "INCORRECTO" }] }` with TODO endpoint integration.
- **Document upload UI model:** `src/pages/AspiranteDocumentos/types.ts`
  - `DocumentUploadItem`: `{ id, codigo, nombre, obligatorio, status, selectedFile, uploadedFileName?, errorMessage? }`
- **Document upload request/response:** `src/api/documentUploadService.ts`, `src/api/documentUploadTypes.ts`
  - `uploadDocument(req)` posts JSON to `/sapp/document` and expects `{ ok, message, data }` where `data` includes `id`, `nombreArchivo`, `tamanoBytes`, `checksum`, `version`, `estado`, etc.
- **Admisiones convocatoria mock contract:** `src/modules/admisiones/types.ts`
  - `Convocatoria`: `{ id, programaId, programaNivel, programaNombre, periodo: { anio, periodo }, fechaInicio, fechaFin, estado, cupos? }` with period formatting helper `formatoPeriodo()`.
- **Inscripcion admision response:** `src/modules/admisiones/api/types.ts`
  - `InscripcionAdmisionDto`: `{ id, aspiranteId, nombreAspirante, estado, fechaInscripcion, fechaResultado, puntajeTotal, posicion_admision, periodoAcademico, programaAcademico, observaciones }` from `GET /sapp/inscripcionAdmision/convocatoria/:convocatoriaId`.
- **Inscripcion admision service:** `src/modules/admisiones/api/inscripcionAdmisionService.ts`
  - Uses `request<ApiResponse<InscripcionAdmisionDto[]>>` and throws when `ok` is false.

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
