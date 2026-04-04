# SAPP Frontend

## Purpose & Scope
This repository hosts the React frontend for SAPP (Sistema de Apoyo para la Gestión de Solicitudes de Posgrados) at EISI–UIS. The UI centralizes workflows such as admisiones, matrícula académica/financiera, solicitudes, exámenes de candidatura, trabajos de grado, and notificaciones.

## Architecture (Brief)
- **Routing:** React Router v7 with protected routes (`src/app/routes/index.tsx` + `src/app/routes/protectedRoute.tsx`) and aspirante-only routes (`src/app/routes/aspiranteOnlyRoute.tsx`).
- **Auth state:** Context-based session management with localStorage persistence (`src/context/Auth`) and session kind support (`SAPP` vs `ASPIRANTE`), including token-expiration checks in protected routes.
- **Session store:** A non-React session store (`src/modules/auth/session/sessionStore.ts`) keeps the token accessible for API clients and handles save/clear/get operations.
- **Auth service:** `src/api/authService.ts` performs real login against the backend (`/sapp/auth/login`) using the shared API response envelope and returns the typed DTO.
- **JWT utilities:** `src/utils/jwt.ts` provides base64url decoding and payload parsing (no signature validation) to extract username, roles, and timestamps from JWTs.
- **Auth DTOs/mappers:** `src/api/authTypes.ts` + `src/api/authMappers.ts` define backend DTOs and map the login response + JWT payload (string roles) into `AuthSession`, including optional `data.estudiante` when backend authenticates an `ESTUDIANTE`.
- **Aspirante auth:** `src/api/aspiranteAuthService.ts` fetches `/sapp/aspirante/consultaInfo` and maps the aspirante info into an `AuthSession` via `src/api/aspiranteAuthMappers.ts`.
- **API config/types:** `src/api/config.ts` defines `API_BASE_URL` (from `VITE_API_BASE_URL`), and `src/api/types.ts` defines the standard `{ ok, message, data }` envelope.
- **HTTP client:** `src/shared/http/httpClient.ts` wraps `fetch`, automatically attaching the Bearer token from the session store (unless `auth: false` is passed) and handling 401/403 logout redirects.
- **Document checklist API:** `src/api/documentChecklistTypes.ts` + `src/api/documentChecklistService.ts` define DTOs (including uploaded metadata) and a GET client for `/sapp/document?codigoTipoTramite=1002&tramiteId=...`.
- **Documentos module (coordinación/secretaría):** `src/modules/documentos` defines shared checklist DTOs, the GET checklist service, and the approval/rejection service for `/sapp/document` using `PUT` and the standard `{ ok, message, data }` envelope.
- **Inscripción documentos (coordinador):** `src/pages/InscripcionDocumentos` renders the real checklist for a given inscripción (tramiteId = inscripcionId), showing load + backend validation badges (`estadoDocumento`), rejection reasons (`observacionesDocumento`), approve/reject actions that refresh the checklist, and a “Continuar evaluación” gate when all required docs are approved.
- **Base64 file utilities:** `src/shared/files/base64FileUtils.ts` normalizes base64 payloads and supports blob creation, tab opening, and download handling for document previews.
- **Tipos de documento API:** `src/api/tipoDocumentoIdentificacionTypes.ts` + `src/api/tipoDocumentoIdentificacionService.ts` provide DTOs and a GET client for `/sapp/tipoDocumentoIdentificacion`.
- **Aspirante document upload UI:** checklist-style cards in `src/pages/AspiranteDocumentos` backed by the real upload service (`src/api/documentUploadService.ts`) plus base64/checksum utilities (`src/utils/fileToBase64.ts`, `src/utils/sha256.ts`).
- **Admisiones API:** `src/modules/admisiones/api` centralizes DTOs + service calls for convocatorias (`/sapp/convocatoriaAdmision`) and inscripciones, backed by the shared HTTP client wrapper.
- **Aspirante creation flow:** `CreateAspiranteModal` posts `/sapp/aspirante`, stores the returned `aspiranteId` + `inscripcionAdmisionId`, and then uploads selected documents **sequentially** via `POST /sapp/document` using base64 + SHA-256 helpers. The modal now loads trámite documents from backend (`GET /sapp/tramite/document?tipoTramiteId=1`) using `httpClient`, filters by `ADMISION_COORDINACION`, computes required items from backend `obligatorio`, preserves sequential uploads/retry behavior, and renders backend-driven loading/error/empty states with retry when the request fails.
- **UI composition:** Page-level views in `src/pages` (Home/Solicitudes/Matrícula/Créditos), shared layout/components in `src/components`, global styles in `src/styles` (login screen in `src/pages/Login`).
- **Global theming:** `src/styles/globals.css` centraliza tokens de identidad visual UIS (compatibles con Beer.css) para `body.light` / `body.dark`, y los layouts/login consumen variables semánticas para mantener consistencia institucional.
- **Role-based UI guard:** `src/auth/roleGuards.ts` + `src/modules/auth/roles/roleUtils.ts` centralize role checks for sidebar/menu visibility and protected routes (string roles, normalized to uppercase).
- **Solicitudes module (mock-ready):** `src/modules/solicitudes` now includes typed DTOs, role-targeted UI components (student form + coordinator cards), and async mock services that preserve the `{ ok, message, data }` envelope contract for future API replacement.
- **Barrel exports:** Top-level `src/components/index.ts` and `src/pages/index.ts` centralize exports for cleaner imports.
- **App shell:** `src/components/Layout` wraps protected routes with a persistent sidebar (`src/components/Sidebar`); `src/main.tsx` provides router + auth providers. Module pages render a header with user info and logout actions via `src/components/ModuleLayout`.
- **Admisiones module:** `src/modules/admisiones` defines convocatoria DTOs/services and program helpers; `src/pages/AdmisionesHome` renders program-specific selectors sourced from the backend, and `src/pages/ConvocatoriaDetalle` fetches real inscripciones for the selected convocatoria.
- **Evaluación de admisión:** `src/modules/admisiones/api/evaluacionAdmisionService.ts` consume `/sapp/evaluacionAdmision/info`, `src/modules/admisiones/components/EvaluacionEtapaSection` renderiza tablas editables por etapa, y las páginas de hoja de vida/examen/entrevista usan la misma base con validación de puntajes.
- **Gating de evaluación por etapa:** `src/modules/admisiones/api/evaluacionAdmisionAvailabilityService.ts` consulta disponibilidad por etapa con caché en memoria, `InscripcionAdmisionDetallePage` deshabilita las ventanas según disponibilidad y `RequireEvaluacionEnabled` protege accesos directos por URL.

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

No seed step is required for this frontend; it consumes backend data directly via the configured API base URL.

### Environment Variables
```env
# .env.local
VITE_API_BASE_URL=http://localhost:8080
```

### Seeds / Mock Data
There are no seed scripts. The SAPP login calls the backend directly:
- Endpoint: `POST ${VITE_API_BASE_URL || "http://localhost:8080"}/sapp/auth/login`
- Response envelope: `{ ok, message, data }`
- The frontend maps the response into an `AuthSession`, stores the JWT as `accessToken`, and decodes the payload for username, roles, and `iat/exp`.

The aspirante login now also calls the backend directly:
- Endpoint: `GET ${VITE_API_BASE_URL || "http://localhost:8080"}/sapp/aspirante/consultaInfo?numeroInscripcion=...&tipoDocumentoId=...&numeroDocumento=...`
- Response envelope: `{ ok, message, data }`
- The frontend maps the aspirante response into an `AuthSession` with `kind: "ASPIRANTE"` and `accessToken: "NO_TOKEN"`.

Mock data for the Admisiones module still lives in:
- `src/modules/admisiones/mock/convocatorias.mock.ts` (legacy mock list; the home selector now uses the real `/sapp/convocatoriaAdmision` service).

## Recent Decisions (Changelog-lite)
- April 4, 2026: applied a global visual polish pass focused on consistency and responsive behavior: unified semantic tokens (radius/shadows/alerts), standardized form control sizing/focus states, harmonized layout spacing in `Layout`/`ModuleLayout`, improved mobile sidebar behavior, and converted Solicitudes table into card-like rows on <=768px to avoid horizontal overflow while preserving desktop table density.
- April 3, 2026: coordinator `/solicitudes` now supports backend-driven filtering with `estadoId` and `tipoSolicitudId`; the view loads tipos from `GET /sapp/tipoSolicitud`, renders a new reusable `SolicitudesFiltersBar`, and requests `GET /sapp/solicitudesAcademicas` with query params only when selected (no `undefined` params). Student view remains unchanged.
- April 2, 2026: adjusted Solicitudes estado-change API contract: `EN ESTUDIO` keeps `PUT /cambioEstadoEnEstudio/{id}` without body, while `APROBADA`/`RECHAZADA` now use batch body `{ solicitudesId: [id] }` on `PUT /cambioEstadoAprobada` and `PUT /cambioEstadoRechazada`; detail page now always re-fetches `GET /sapp/solicitudesAcademicas/{id}` after successful estado update and shows a dedicated refresh error if reload fails.
- April 2, 2026: implemented real coordinator/admin estado transitions in `SolicitudDetallePage` via new PUT service `cambiarEstadoSolicitud` (`EN ESTUDIO` / `APROBADA` / `RECHAZADA`), with loading/error/success UX and detail fallback refresh (`GET /sapp/solicitudesAcademicas/{id}`) when PUT returns `data: null`.
- April 2, 2026: replaced the detail estado text chip with shared `StatusBadge` to preserve consistent color semantics in solicitud detail.
- April 2, 2026: strengthened coordinator list refresh on return navigation by re-fetching in `SolicitudesCoordinadorView` when route location changes (including navigation state).
- April 2, 2026: fixed solicitudes status badge colors so each estado is visually distinct (REGISTRADA azul, EN ESTUDIO ámbar, APROBADA verde, RECHAZADA rojo), and increased CSS specificity to prevent global framework styles from forcing all badges to green.
- April 2, 2026: expanded `normalizeEstadoSolicitud` to accept backend variants (`EN_ESTUDIO`, `APROBADO`, `RECHAZADO`) so color mapping remains correct even when siglas arrive with underscores or masculine labels.
- Standardized solicitud status rendering with a new `StatusBadge` component + `normalizeEstadoSolicitud` utility so REGISTRADA/EN ESTUDIO/APROBADA/RECHAZADA/UNKNOWN colors are consistent across table, detail, and card views.
- Added ESTUDIANTE document editing in `SolicitudDetallePage` (mock-only): required docs are now rendered by `tipoSolicitudId`, students can replace/remove files in edit mode, and docs persist per `solicitudId` in localStorage via `sapp:solicitudes:docs:{id}`.
- Added reusable `SolicitudDocumentosEditor` with read-only and editable modes, required-doc warning (non-blocking by default), and `Ver/Descargar` actions using shared base64 utilities.
- Added new solicitud-document contracts and store helpers: `SolicitudDocumentoRequirement` / `SolicitudDocumentoAdjunto` / `SolicitudDocumentoDraft`, plus CRUD helpers in `solicitudDocumentosStore.mock.ts` for load/save/upsert/remove/get.
- Integrated real Solicitudes API clients using the shared `httpClient` wrapper: `GET /sapp/tipoSolicitud`, `GET /sapp/solicitudesAcademicas`, `GET /sapp/solicitudesAcademicas/estudiante?estudianteId=...`, and `POST /sapp/solicitudesAcademicas`, all honoring the standard `{ ok, message, data }` envelope.
- Migrated `/solicitudes` role views (coordinador + estudiante) from mock listing to backend data and kept loading/error/empty states with row-click navigation to detail.
- Updated student solicitud creation flow to load real tipos on form mode, submit `estudianteId` from `session.user.estudiante.id`, and refresh the list after a successful POST.
- Updated student solicitudes listing to always call `GET /sapp/solicitudesAcademicas/estudiante?estudianteId=...` (removed non-`/sapp` fallback path).
- Added `getSolicitudAcademicaById(solicitudId)` service that calls `GET /sapp/solicitudesAcademicas/{id}` and throws `Solicitud no encontrada` when the envelope has `data: null`.
- Updated `SolicitudDetallePage` to load detail directly by route param (`/solicitudes/:solicitudId`) through `GET /sapp/solicitudesAcademicas/{id}` and show `ID inválido` on malformed params.
- Temporarily disabled coordinator state-change action in detail until a real update endpoint is available (read-only detail + existing documentos section remain).
- Extended SAPP login contracts to persist `data.estudiante` in session (`session.user.estudiante`) with safe typing (`id: number` + additional unknown keys) so downstream modules can consume `estudiante.id` without using `any`.
- Added `getEstudianteIdFromSession(session)` as the official resolver for student-scoped operations, avoiding fallback to `session.user.id` when backend identity differs from `estudiante.id`.
- Updated the student solicitudes flow to read `estudianteId` only from `session.user.estudiante.id`; when absent, UI now shows “No hay estudianteId en sesión” and skips data operations requiring `estudianteId`.
- Added a DEV-only “Estudiante ID (debug)” field in Home → Mi cuenta to validate login persistence safely without exposing sensitive data.
- Updated solicitudes mock seed to guarantee a visible ESTUDIANTE row in `/solicitudes` (added fallback seed `id=10`, `estudianteId=2`, estado `REGISTRADA`) so the student table never renders empty in the default mock flow.
- Added ESTUDIANTE edit flow in `SolicitudDetallePage`: editable fields are now limited to `tipoSolicitudId` and `observaciones`, with inline form actions (`Editar solicitud`, `Guardar cambios`, `Cancelar`) and mock persistence.
- Enforced edit-state guard for estudiantes: edit UI is enabled only when `estadoSigla` is `REGISTRADA` or `EN ESTUDIO`; for `APROBADA`/`RECHAZADA`, no edit action is shown.
- Added `updateSolicitudEstudianteMock` + async service `updateSolicitudEstudiante` to update `tipoSolicitudId`, `tipoSolicitudCodigo`, `tipoSolicitud`, and `observaciones` while preserving the rest of the solicitud payload.
- Confirmed list/detail synchronization via shared in-memory solicitudes store; after saving from detail, returning to `/solicitudes` reflects updates through `fetchSolicitudesEstudiante()` re-fetch keyed by `location.key`.
- Extended `SolicitudDetallePage` (mock flow) with a coordinator/admin-only “Documentos adjuntos” section that loads document lists by `solicitudId`, includes loading/error/empty states, and keeps state change controls intact.
- Added mock document contracts/services for solicitudes: `SolicitudDocumentoAdjuntoDto`, `solicitudDocumentosById` seeded for IDs `1..4`, and async `fetchSolicitudDocumentos()` with 150ms delay to emulate backend behavior.
- Added reusable `DocumentosAdjuntos` UI for solicitud detail with accessible actions to `Ver` (PDF-only open in new tab) and `Descargar` (all mime types), reusing shared base64 utilities in `src/shared/files/base64FileUtils.ts`.
- Extended the `/solicitudes` mock module with click-through row navigation (`/solicitudes/:solicitudId`), a dedicated detail page, and coordinator-only state transitions (`EN ESTUDIO`, `APROBADA`, `RECHAZADA`) backed by a shared in-memory store so list/detail remain synchronized after updates.
- Fixed TypeScript compilation blockers for auth/document pages: `AspiranteDocumentosPage` now casts `session.user` to `AspiranteUser` after the `session.kind === "ASPIRANTE"` guard before reading `inscripcionAdmisionId`, and both login pages now use `import type { FormEvent }` to comply with `verbatimModuleSyntax`.
- Fixed the theme baseline to avoid inverted light mode: default startup theme is now `light` (unless `sapp-theme` is already set), `body.light`/`body.dark` tokens were normalized to the UIS palette, and base text remains on `--text-primary` while `--on-primary` is reserved for text over primary surfaces (buttons).
- Adopted a global institutional design baseline using UIS palette tokens with dual theme support (`body.light`/`body.dark`) and Beer.css-compatible CSS variables (`--primary`, `--on-primary`, `--outline`, `--surface`, `--surface-container-low`, `--inverse-primary`).
- Refreshed login and aspirante login visuals to match the institutional reference style: rounded cards, soft shadows, clean typography hierarchy, minimal inputs, and pill-shaped primary buttons.
- Updated shared shell/layout/sidebar surfaces and action styles to consume theme variables instead of hardcoded colors for consistent light/dark behavior.
- Fixed an infinite request loop in `CreateAspiranteModal` when loading trámite documentos: the fetch now runs once per modal open, waits for the response, and no longer retriggers on each documentos-state update.
- Se agregó un “probe” de disponibilidad por etapa para Hoja de Vida/Examen/Entrevistas, deshabilitando visualmente las ventanas cuando no hay evaluación y bloqueando navegación directa con un guard de ruta.
- Inscripción documentos now derives validation from backend `estadoDocumento` (Por revisar/Aprobado/Rechazado), shows rejection reasons, refreshes the checklist after approve/reject, and gates “Continuar evaluación” on required docs being approved.
- Fixed `DocumentUploadCard` to wire the optional `onRemoveFile` handler correctly, avoiding runtime errors when removing selected files.
- Require all documents in the “Crear aspirante” modal: removed the optional-selection checkbox and validated that every listed file is attached before allowing submission.
- Fixed the convocatoria aspirante card grid to use a consistent 4-column layout on wide screens with responsive fallbacks for tablet and mobile widths.
- Replaced the convocatoria inscripciones table with a responsive card grid that highlights aspirante photos (mocked), quick metadata, and click-through navigation to the inscripción detail view.
- Added a mock photo utility for aspirantes to provide stable placeholder images (DEV-only) until the backend delivers real photo URLs/base64 payloads.
- Updated Admisiones convocatoria/inscripción headers to derive titles from navigation state or loaded data (with safe fallbacks) and passed periodo/nombre state through routing for instant titles on navigation.
- Replaced the inscripción detail navigation cards with accordion-style windows that render child routes inline, keeping deep links and refresh behavior intact.
- Added a reusable `InscripcionAccordionWindow` component and embedded the documentos/hoja de vida/examen/entrevistas views inside the accordion bodies.
- Integrated real SAPP login against `/sapp/auth/login` using the standard `{ ok, message, data }` response envelope and mapped it to `AuthSession`.
- Added API base URL config (`VITE_API_BASE_URL`) with a localhost default and shared API response typing.
- Persist the auth session in localStorage via `AuthStorage` so reloads restore the session automatically.
- Updated SAPP login to persist JWT `accessToken`, decode payload claims (username, roles, iat/exp), and map them into `AuthSession`.
- Adapted SAPP login to the new backend roles format (`roles: string[]`), preferring roles from the login response and falling back to JWT roles when missing.
- Normalized role checks to compare uppercase string roles and extended the Admisiones guard to allow `ADMIN` alongside Coordinación/Secretaría.
- Added JWT payload typings and a base64url decoder utility to extract claims without signature verification.
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
- Added a centralized session store (`src/modules/auth/session/sessionStore.ts`) to read/save/clear the JWT without React hooks.
- Added a shared HTTP client wrapper (`src/shared/http/httpClient.ts`) that auto-injects Bearer tokens when available, skips auth for public endpoints, and logs out on 401/403.
- Stubbed module API services in `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, and `src/api/creditosService.ts` for future integration.
- Renamed the Trámites module to Solicitudes across routes, pages, and service stubs.
- Updated the login page so selecting “Soy aspirante” immediately routes to `/login/aspirante` instead of showing a continue button.
- Updated the aspirante login screen to capture número de inscripción, tipo de documento (loaded from `/sapp/tipoDocumentoIdentificacion`), and número de documento before starting the session.
- Replaced the aspirante mock login with a real `/sapp/aspirante/consultaInfo` GET and mapped the response into the aspirante session stored in localStorage.
- Normalize aspirante `numeroInscripcionUis` to a string in session storage to keep rendering/routes consistent.
- Extend aspirante session data to include nombre, director, grupo de investigación, teléfono, y fecha de registro as returned by the backend.
- Show the expanded aspirante session metadata (nombre, inscripción, grupo, director, teléfono, email) in the aspirante layout header.
- Added a “Mi cuenta” panel on Home to visualize username, roles, and token expiration for debugging JWT claims.
- Added role-based guards for Coordinación/Secretaría and a protected “Admisiones” module route with a placeholder page plus conditional sidebar navigation.
- Implemented the Admisiones home selector with mock convocatorias, plus a convocatoria detail placeholder and parameterized routes for `/admisiones/convocatoria/:convocatoriaId`.
- Split the Admisiones selector into two program sections with program-specific current/previous convocatorias and updated the placeholder detail view to show the new program-period metadata.
- Wired Convocatoria detalle to the real `/sapp/inscripcionAdmision/convocatoria/:convocatoriaId` endpoint and added a placeholder route for inscripcion detail.
- Added inscripcion detail navigation cards and protected placeholder child routes for documentos, hoja de vida, examen de conocimiento, and entrevistas.
- Implemented the evaluación de admisión screens for hoja de vida, examen de conocimientos, y entrevista with editable row drafts, inline validation, and mock save handling backed by `/sapp/evaluacionAdmision/info`.
- Implemented “Documentos cargados” for coordinación/secretaría using the real `/sapp/document` checklist endpoint and added UI-only validation controls plus a stubbed save service.
- Replaced the coordinador/secretaría validation UI with per-document approve/reject actions, required rejection notes, and `/sapp/document` PUT integration with per-item loading plus refresh on success.
- Centralized `codigoTipoTramite=1002` in a shared documentos constant and reused it in the aspirante checklist fetch.
- Added “Ver/Descargar” actions on inscripción documentos to open/download base64 PDFs without extra endpoints, using shared base64-to-Blob utilities.
- Grouped entrevista evaluation items by entrevistador with a summary section for consolidated results, keeping row-level editing intact.
- Replaced the Admisiones home mock convocatorias with the real `/sapp/convocatoriaAdmision` service, including loading/error/empty states, dynamic program sections, and a “vigente vs anteriores” selector per program.
- Added program name helpers to render the long-form program titles (Maestría/Doctorado) while keeping backend `programa` as a subtitle/badge when provided.
- Implemented the real “Crear aspirante” flow: POST `/sapp/aspirante`, then sequentially upload selected documentos via `/sapp/document` using base64 + SHA-256, with retry support for failed uploads and a success/partial summary.
- Updated “Crear aspirante” to fetch trámite documents from backend (`/sapp/tramite/document?tipoTramiteId=1`), filter only `ADMISION_COORDINACION`, derive required docs from backend `obligatorio`, and render loading/error/empty states with retry in the modal.
- Enforced backend-only trámite documents for aspirante creation (filtered by `ADMISION_COORDINACION`) and removed hardcoded fallback requirements so uploaded files always match API configuration.
- Implemented `/solicitudes` role-priority UI (COORDINADOR/ADMIN over ESTUDIANTE) with typed mocks, dynamic required-document lists per tipo de trámite, form validation for required attachments, and coordinator review cards rendered from async mock services.
- Replaced `/solicitudes` coordinator cards with a reusable table component and introduced dedicated role-based containers (`SolicitudesCoordinadorView` / `SolicitudesEstudianteView`).
- Updated the student `/solicitudes` flow to start in “Mis solicitudes” table mode, add a primary “Agregar solicitud” action, and toggle to/from the existing form with “Volver al listado”.
- Added `fetchSolicitudesEstudiante()` + `solicitudesEstudiante.mock.ts` so student listings are consumed through services (not direct mock imports), and mock form submissions prepend a new `REGISTRADA` row before returning to the list.
