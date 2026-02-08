# Handoff — SAPP Frontend

## Current Status
- SAPP login calls the backend (`POST /sapp/auth/login`) and returns the typed DTO, mapping it + JWT payload claims into `AuthSession`.
- JWT payload decoding (base64url only, no signature validation) lives in `src/utils/jwt.ts` and is used to populate username, roles, `iat`, and `exp`.
- SAPP login roles are now treated as `string[]` (response `data.roles` preferred, JWT roles fallback) and normalized to uppercase before storing in session.
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
- AuthContext restores sessions from localStorage on load via the session store (`src/modules/auth/session/sessionStore.ts`).
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
- Added a centralized session store (`src/modules/auth/session/sessionStore.ts`) so non-React modules can read/save/clear the JWT.
- Added a shared HTTP client wrapper (`src/shared/http/httpClient.ts`) that auto-injects Bearer tokens, skips auth for public endpoints, and logs out on 401/403.
- Added stub API services for Solicitudes, Matrícula, and Créditos in `src/api/*Service.ts`.
- Added top-level barrel exports in `src/components/index.ts` and `src/pages/index.ts` for standardized imports.
- Added role guard utilities (`src/auth/roleGuards.ts`) plus a protected “Admisiones” route with a placeholder page and sidebar visibility limited to Coordinación/Secretaría roles.
- Added `src/modules/auth/roles/roleUtils.ts` to normalize and compare role strings; Admisiones visibility now also allows `ADMIN`.
- Implemented the Admisiones home selector UI with mock convocatorias, including current vs previous selection and parameterized navigation to convocatoria detail placeholders.
- Expanded Admisiones convocatorias to include programa metadata (id/nivel/nombre) and split the selector into two program-specific sections with independent current/previous lists.
- Replaced the Admisiones home mock convocatorias with the real `/sapp/convocatoriaAdmision` service, added loading/error/empty states, and rendered “vigente vs anteriores” selectors per programa using the shared HTTP client (Bearer token).
- Added helpers for long-form program names and periodo parsing (`programNames`, `periodo`) to support program section titles and sorting.
- Simplified the convocatoria detail page to a placeholder (“En construcción”) that optionally displayed program name + periodo from the mock list.
- Replaced the convocatoria detail placeholder with a real inscripciones fetch from `/sapp/inscripcionAdmision/convocatoria/:convocatoriaId`, including loading/error/empty states and row navigation to a new inscripcion detail placeholder route.
- Replaced the convocatoria inscripciones table with a responsive grid of student cards that show a large mock photo, key metadata (estado, programa, periodo, puntaje, fecha), and accessible click/keyboard navigation to the inscripción detail.
- Updated the convocatoria detail grid so aspirante cards keep a consistent 4-column layout on wide screens with responsive breakpoints for smaller devices.
- Added a DEV-only mock photo helper (`getMockStudentPhotoUrl`) that returns stable placeholder URLs per aspirante until the backend provides a real photo field or base64 payload.
- Admisiones headers now use navigation state or fetched data to render contextual titles (Convocatoria - periodo, Inscripción - nombre) with safe fallbacks on refresh.
- Added a “Crear aspirante” modal in Convocatoria detalle that loads tipos de documento and admisión documentos on demand, validates inputs, and **mocks** submission by logging the full payload (form + profile image metadata + attached documents) to the console.
- Updated the “Crear aspirante” modal so **all** listed documents are required (checkbox removed); validation now blocks submission until every file is attached.
- Convocatoria detalle now resolves `programaId` from navigation state (preferred) or inscripciones (`programaAcademico` string mapper for DCC/MISI) to avoid prompting the user.
- Added inscripcion detail navigation cards and protected placeholder pages for documentos cargados, hoja de vida, examen de conocimiento, and entrevistas.
- Replaced the inscripción detail cards with accordion windows tied to nested routes; child pages now render inside the accordion body while preserving deep links.
- Added the reusable `InscripcionAccordionWindow` component for accordion-style windows in Admisiones.
- Implemented the coordinador/secretaría “Documentos cargados” screen to call the real `/sapp/document` checklist endpoint using `tramiteId = inscripcionId`, render load status + metadata, and capture per-document approve/reject decisions with required rejection notes.
- Added a shared documentos module (`src/modules/documentos`) with checklist DTOs, a reusable `getDocumentosByTramite` service, and a dedicated approve/reject service that uses `PUT /sapp/document`.
- Centralized `codigoTipoTramite=1002` in `src/modules/documentos/constants.ts` and reused it in the aspirante checklist fetch.
- Added base64 file utilities (`src/shared/files/base64FileUtils.ts`) for normalizing base64 content, generating blobs, opening documents in a new tab, and triggering downloads.
- Added “Ver” and “Descargar” actions on the inscripcion documentos table to open/download the uploaded document using the base64 payload returned by `documentoUploadedResponse`.
- Added evaluación de admisión types + service for `/sapp/evaluacionAdmision/info` and implemented hoja de vida, examen de conocimientos, y entrevista screens with editable rows, validation, and mock save handling.
- Updated entrevista evaluations to render grouped by entrevistador (sorted A–Z), with a read-only resumen section for the consolidated `ENTREV` item and shared draft/edit state across groups.

## Open Challenges
- Confirm JWT payload contract fields with backend (e.g., `rolesUsuario`, `nombreUsuario`, `idUsuario`) and whether timestamps are always present.
- Confirm backend response for uploaded document metadata (filename, version, dates) to extend UI details if needed.
- Define environment variables and API base URL for production/staging.
- Add automated tests (unit/integration) and CI checks.
- Replace stub module services with real API calls once endpoints are available.
- Confirm the convocatoria admisión response contract (fields, `vigente` rules) with the backend team.
- Validate the inscripcion detail API contract when it becomes available (currently placeholder UI only).
- Confirm the backend response and state transitions for `/sapp/document` approve/reject, especially error messaging and allowed document states.
- Define the data contracts for documentos/hoja de vida/examen/entrevistas once those features are scoped.
- Confirm save/update endpoint for evaluación de admisión and decide payload + response contract.
- Replace the aspirante mock photo URLs with real backend-provided photo data (URL or base64).
- Confirm whether entrevista “resumen” entries (codigo `ENTREV`) should be editable and define the desired backend payload.
- Confirm `programaAcademico` string patterns beyond DCC/MISI to keep `programaId` resolution accurate for new programs.
- Confirm the backend contracts for `/sapp/tramite/document?tipoTramiteId=1` and the intended upload flow for aspirante documents + profile image.
- Confirm whether the backend expects **all** documents in the admisión checklist to be required or if optional uploads should be reintroduced.

## Next Steps
1. Validate JWT claims with real backend tokens (roles/username/id) and adjust the mapper if the payload schema changes.
2. Align aspirante document response metadata (e.g., version/estado) for richer UI display if needed.
3. Add `.env.local` (or equivalent) for API base URLs.
4. Add test scaffolding (Vitest + React Testing Library) and baseline coverage.
5. Wire module pages to the new service stubs once backend endpoints are defined.
6. Validate the `/sapp/document` upload flow with real backend data (errors, size limits, and metadata display).
7. Define the inscripcion detail endpoint contract and replace the placeholder detail page.
8. Validate `/sapp/document` approve/reject flows with real data and document states.
9. Validate the evaluación de admisión screens with real data (hoja de vida, examen, entrevista) once backend is available.
10. Replace the evaluación de admisión mock save with the real endpoint once available, including optimistic updates and error handling rules.
11. Swap the student card mock photo helper for the real backend field once the API delivers photo URLs or base64 content.
12. Validate the `/sapp/aspirante` creation flow with real backend responses (currently mocked) and expand `programaId` inference if additional program codes appear.
13. Implement the real upload flow for aspirante profile image + document attachments once endpoints are available.
14. Reconfirm server-side validation messaging for missing admisión documents to align the frontend error copy.

## Key Paths / Artifacts / Datasets
- **Routing:** `src/app/routes/index.tsx`, `src/app/routes/*Routes.tsx`
- **ProtectedRoute:** `src/app/routes/protectedRoute.tsx`
- **Role guard helper:** `src/auth/roleGuards.ts`, `src/modules/auth/roles/roleUtils.ts`
- **RequireRoles wrapper:** `src/routes/RequireRoles/RequireRoles.tsx`
- **Aspirante guard/routes:** `src/app/routes/aspiranteOnlyRoute.tsx`, `src/app/routes/aspiranteRoutes.tsx`
- **Auth context/types/storage:** `src/context/Auth/*`, `src/modules/auth/session/sessionStore.ts`
- **Auth API (SAPP login):** `src/api/authService.ts`
- **JWT payload + decoder:** `src/api/jwtPayloadTypes.ts`, `src/utils/jwt.ts`
- **Auth DTOs/mappers:** `src/api/authTypes.ts`, `src/api/authMappers.ts`
- **API config/types:** `src/api/config.ts`, `src/api/types.ts`
- **Aspirante consulta info API:** `src/api/aspiranteAuthService.ts`, `src/api/aspiranteConsultaTypes.ts`, `src/api/aspiranteAuthMappers.ts`
- **Tipos documento API:** `src/api/tipoDocumentoIdentificacionTypes.ts`, `src/api/tipoDocumentoIdentificacionService.ts`
- **HTTP client:** `src/shared/http/httpClient.ts`
- **Module service stubs:** `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, `src/api/creditosService.ts`
- **Document checklist DTO/service:** `src/api/documentChecklistTypes.ts`, `src/api/documentChecklistService.ts`
- **Aspirante upload service:** `src/api/documentUploadService.ts`, `src/api/documentUploadTypes.ts`
- **Upload utilities:** `src/utils/fileToBase64.ts`, `src/utils/sha256.ts`
- **Pages:** `src/pages/Home`, `src/pages/Solicitudes`, `src/pages/Matricula`, `src/pages/Creditos`, `src/pages/Login`, `src/pages/AspiranteLogin`, `src/pages/AspiranteDocumentos`
- **Admisiones page:** `src/pages/AdmisionesPage`
- **Admisiones module:** `src/modules/admisiones/types.ts`, `src/modules/admisiones/mock/convocatorias.mock.ts`
- **Admisiones API:** `src/modules/admisiones/api/types.ts`, `src/modules/admisiones/api/inscripcionAdmisionService.ts`
- **Admisiones convocatorias API:** `src/modules/admisiones/api/convocatoriaAdmisionTypes.ts`, `src/modules/admisiones/api/convocatoriaAdmisionService.ts`
- **Admisiones selector UI:** `src/pages/AdmisionesHome`
  - Program names helper: `src/modules/admisiones/utils/programNames.ts`
  - Periodo parsing helper: `src/modules/admisiones/utils/periodo.ts`
- **Convocatoria detail (real inscripciones):** `src/pages/ConvocatoriaDetalle`
- **Student cards (Admisiones):** `src/modules/admisiones/components/StudentCard`
- **Create aspirante modal:** `src/modules/admisiones/components/CreateAspiranteModal`
- **Mock photo helper:** `src/modules/admisiones/utils/mockStudentPhoto.ts`
- **Programa resolver:** `src/modules/admisiones/utils/resolveProgramaId.ts`
- **Trámite documentos (admisión):** `src/modules/admisiones/api/tramiteDocumentoService.ts`, `src/modules/admisiones/api/tramiteDocumentoTypes.ts`
- **Inscripcion detail placeholder:** `src/pages/InscripcionAdmisionDetalle`
- **Accordion window component:** `src/modules/admisiones/components/InscripcionAccordionWindow`
- **Inscripcion child pages:** `src/pages/InscripcionDocumentos`, `src/pages/InscripcionHojaVida`, `src/pages/InscripcionExamen`, `src/pages/InscripcionEntrevistas`
- **Evaluación admisión (UI):** `src/modules/admisiones/pages/EvaluacionEtapaPage`, `src/modules/admisiones/components/EvaluacionEtapaSection`
- **Evaluación admisión (API/types):** `src/modules/admisiones/api/evaluacionAdmisionService.ts`, `src/modules/admisiones/types/evaluacionAdmisionTypes.ts`
- **Evaluación admisión (util):** `src/modules/admisiones/utils/groupByEtapa.ts`, `src/modules/admisiones/utils/groupByEvaluador.ts`
- **Documentos module (coordinación/secretaría):** `src/modules/documentos/constants.ts`, `src/modules/documentos/api/types.ts`, `src/modules/documentos/api/documentosService.ts`, `src/modules/documentos/api/aprobacionDocumentosService.ts`
- **Document view/download utilities:** `src/shared/files/base64FileUtils.ts`
- **Document view/download UI:** `src/pages/InscripcionDocumentos`
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
  - `data.roles` is now `string[]`; the mapper prefers response roles and falls back to JWT payload roles.
  - JWT payload contract: `src/api/jwtPayloadTypes.ts` (supports `rolesUsuario`/`roles`, `nombreUsuario`/`sub`, `idUsuario`, `iat`, `exp`).
- **Aspirante consulta info output:** `src/api/aspiranteAuthService.ts`
  - Calls `GET /sapp/aspirante/consultaInfo` with `{ numeroInscripcion, tipoDocumentoId, numeroDocumento }`, expects `{ ok, message, data: AspiranteConsultaInfoDto }` (including `nombre`, `director`, `grupoInvestigacion`, `telefono`, `numeroInscripcionUis`, `fechaRegistro`), and maps the response into `AuthSession` with `kind: "ASPIRANTE"` and `accessToken: "NO_TOKEN"`. `numeroInscripcionUis` is normalized to string on write.
- **Tipos documento response:** `src/api/tipoDocumentoIdentificacionService.ts`
  - Expects `{ ok, message, data: TipoDocumentoIdentificacionDto[] }` from `GET /sapp/tipoDocumentoIdentificacion` and returns the typed `data` array.
- **HTTP client wrapper:** `src/shared/http/httpClient.ts`
  - `http<T>(path, options?)` uses `fetch`, attaches `Authorization` when a session token exists (unless `auth: false`), and logs out + redirects on 401/403.
- **Document checklist response:** `src/api/documentChecklistService.ts`
  - Expects `{ ok, message, data: DocumentChecklistItemDto[] }` from `GET /sapp/document?codigoTipoTramite=1002&tramiteId=...` and returns the typed `data` array. Each DTO includes `documentoCargado` and `documentoUploadedResponse` (with `nombreArchivoDocumento`, `versionDocumento`, etc.).
- **Documentos checklist (coordinación/secretaría):** `src/modules/documentos/api/documentosService.ts`
  - Expects `{ ok, message, data: DocumentoTramiteItemDto[] }` from `GET /sapp/document?codigoTipoTramite=1002&tramiteId=...` and returns the typed `data` array for the coordinador screen.
- **Documentos base64 fields:** `DocumentoUploadedResponseDto`
  - The frontend now expects `base64DocumentoContenido` or `contenidoBase64`, plus `mimeTypeDocumentoContenido` or `mimeType`, to open/download the uploaded document without additional endpoints.
- **Documentos aprobación/rechazo:** `src/modules/documentos/api/aprobacionDocumentosService.ts`
  - Sends `{ documentoId, aprobado, observaciones }` to `PUT /sapp/document` and expects `{ ok, message, data }`. Throws when `ok` is `false` to surface the backend `message` in the UI.
- **Document upload UI model:** `src/pages/AspiranteDocumentos/types.ts`
  - `DocumentUploadItem`: `{ id, codigo, nombre, obligatorio, status, selectedFile, uploadedFileName?, errorMessage? }`
- **Document upload request/response:** `src/api/documentUploadService.ts`, `src/api/documentUploadTypes.ts`
  - `uploadDocument(req)` posts JSON to `/sapp/document` and expects `{ ok, message, data }` where `data` includes `id`, `nombreArchivo`, `tamanoBytes`, `checksum`, `version`, `estado`, etc.
- **Admisiones convocatoria mock contract:** `src/modules/admisiones/types.ts`
  - `Convocatoria`: `{ id, programaId, programaNivel, programaNombre, periodo: { anio, periodo }, fechaInicio, fechaFin, estado, cupos? }` with period formatting helper `formatoPeriodo()`.
- **Convocatoria admisión response:** `src/modules/admisiones/api/convocatoriaAdmisionService.ts`
  - Calls `GET /sapp/convocatoriaAdmision`, expects `{ ok, message, data: ConvocatoriaAdmisionDto[] }`, throws when `ok` is `false`, and returns `data ?? []`.
  - `ConvocatoriaAdmisionDto` includes `{ id, programaId, programa, periodoId, periodo, vigente, cupos, fechaInicio, fechaFin, observaciones }`.
- **Inscripcion admision response:** `src/modules/admisiones/api/types.ts`
  - `InscripcionAdmisionDto`: `{ id, aspiranteId, nombreAspirante, estado, fechaInscripcion, fechaResultado, puntajeTotal, posicion_admision, periodoAcademico, programaAcademico, observaciones }` from `GET /sapp/inscripcionAdmision/convocatoria/:convocatoriaId`.
- **Inscripcion admision service:** `src/modules/admisiones/api/inscripcionAdmisionService.ts`
  - Uses `httpGet<ApiResponse<InscripcionAdmisionDto[]>>` and throws when `ok` is false.
- **Aspirante create request/response:** `src/modules/admisiones/api/aspiranteCreateTypes.ts`
  - `AspiranteCreateRequestDto` matches `/sapp/aspirante` body (no `programaId` in UI input; resolved from convocatoria).
  - `AspiranteCreateResponseDto` returns `{ id, inscripcionAdmisionId, nombre, numeroDocumento, numeroInscripcionUis, emailPersonal, telefono, observaciones, tipoDocumentoIdentificacion, fechaRegistro, director, grupoInvestigacion }`.
- **Aspirante create service:** `src/modules/admisiones/api/aspiranteService.ts`
  - Posts to `/sapp/aspirante`, expects `{ ok, message, data }`, throws on `ok: false`, returns `data`.
- **Trámite documentos (admisión) response:** `src/modules/admisiones/api/tramiteDocumentoService.ts`
  - Calls `GET /sapp/tramite/document?tipoTramiteId=1` and filters results to `tipoTramite.nombre === "ADMISION_COORDINACION"`.
- **Mock aspirante photo helper:** `src/modules/admisiones/utils/mockStudentPhoto.ts`
  - DEV-only helper that returns stable placeholder URLs per aspiranteId (modulo selection). Swap with backend `fotoUrl` or `fotoBase64` when available (e.g., `data:image/jpeg;base64,${base64}`).
- **Evaluación admisión response:** `src/modules/admisiones/api/evaluacionAdmisionService.ts`
  - Calls `GET /sapp/evaluacionAdmision/info?inscripcionId=...&etapa=...`, expects `{ ok, message, data: EvaluacionAdmisionItem[] }`, throws when `ok` is `false`, and returns `data ?? []`.
- **Evaluación admisión DTO:** `src/modules/admisiones/types/evaluacionAdmisionTypes.ts`
  - `EvaluacionAdmisionItem`: `{ id, inscripcionId, etapaEvaluacion, aspecto, codigo, consideraciones, evaluador, fechaRegistro, observaciones, ponderacionId, puntajeAspirante, puntajeMax }`.

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
