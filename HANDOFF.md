# Update — 2026-04-21 (configuración + matrícula UX)

## Current Status

- April 21, 2026 (latest): en `/matricula/:matriculaId` (coordinación/admin) se homologó la fuente de documentos con la vista de detalle por estudiante; ahora ambas rutas consumen el mismo servicio `getDocumentosMatriculaAcademica` (wrapper de `GET /sapp/document?codigoTipoTramite=1003&tramiteId={matriculaId}`), para garantizar paridad de documentos/estados mostrados.
- April 21, 2026 (latest): en `/admisiones/convocatoria/:convocatoriaId` se eliminó la carga de foto por documento ANX-4 en segundo request; ahora cada card usa directamente `inscripcion.foto` (base64 + mimeType) del endpoint de inscripciones.
- April 21, 2026 (latest): en `/coordinacion/estudiantes/:estudianteId` se agregaron pestañas **Matrículas**, **Admisión** y **Solicitudes**; cada una consulta listados por estudiante y carga documentos asociados con `GET /sapp/document` por trámite.
- ✅ Hotfix aplicado en `/admisiones/configuracion/fechas`: se corrigió un loop de consumo infinito de `GET /api/sapp/periodoAcademico` causado por una dependencia circular entre `useEffect` y `applyPeriodoValues`.
- ✅ La inicialización del formulario en carga de periodos ahora se resuelve dentro del primer fetch (config local o defaults por semestre), evitando retriggers del request.
- ✅ Nuevo módulo de configuración creado en `/configuracion` con vista inicial orientada a escalabilidad: primero periodos académicos y luego convocatorias.
- ✅ Sidebar actualizado: entrada **Configuración** al final, visible para roles `ADMIN` y `COORDINACION`.
- ✅ Listado de matrículas (coordinador/admin) actualizado: se eliminó la columna `ID` y se alineó el estilo de tabla con el patrón visual institucional del resto de pantallas.

## Paths / Artifacts

- Nueva página: `src/pages/ConfiguracionModule/ConfiguracionModulePage.tsx`
- Estilos nueva página: `src/pages/ConfiguracionModule/ConfiguracionModulePage.css`
- Export página: `src/pages/ConfiguracionModule/index.ts`
- Rutas: `src/app/routes/index.tsx`
- Sidebar: `src/components/Sidebar/Sidebar.tsx`
- Matrícula listado/estilos: `src/pages/Matricula/MatriculaPage.tsx`, `src/pages/Matricula/MatriculaPage.css`
- Hotfix loop periodos: `src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx`

## Next Steps

1. QA manual en `/matricula/:matriculaId` (rol `COORDINADOR/ADMIN`): validar carga de checklist de documentos, acciones Ver/Descargar, aprobación/rechazo con observaciones y habilitación del botón **Aprobar matrícula** únicamente con obligatorios aprobados.
1. QA manual en navegador de `/configuracion`, `/admisiones/configuracion/fechas`, `/admisiones/convocatorias` con roles `COORDINACION` y `ADMIN` verificando explícitamente que `GET /api/sapp/periodoAcademico` se ejecute una vez por carga de pantalla.
2. Validar con producto si en el módulo de configuración se desean tabs o paginación al agregar nuevos bloques futuros.
3. Si se requiere, mover las rutas de configuración antiguas bajo prefijo único (`/configuracion/...`) manteniendo redirects.

## Recent Tests + Logs

- `npx eslint src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx README.md HANDOFF.md` → validación rápida de lint sobre archivos tocados por el hotfix de loop.
- `npm run build` → esperado como validación principal de compilación tras cambios de rutas/páginas/estilos y fix de ciclo de requests.
- Nota: en este entorno no se tomó screenshot automático (no hay herramienta de browser_container disponible).

---

# Handoff — SAPP Frontend

## Current Status

- April 21, 2026 (latest): en `/matricula/:matriculaId` (coordinación/admin) se homologó la fuente de documentos con la vista de detalle por estudiante; ahora ambas rutas consumen el mismo servicio `getDocumentosMatriculaAcademica` (wrapper de `GET /sapp/document?codigoTipoTramite=1003&tramiteId={matriculaId}`), para garantizar paridad de documentos/estados mostrados.
- April 21, 2026 (latest): se implementó el módulo **Configuración de fechas — Admisiones** en `/admisiones/configuracion/fechas` con guard de roles (`ADMIN`, `COORDINADOR`). La pantalla carga periodos reales por `GET /api/sapp/periodoAcademico`, permite guardar fechas con `POST /api/sapp/periodoAcademicoFecha` (`tipoTramiteId=2`) y mantiene una tabla local editable/persistente en `localStorage` (`SAPP_CONFIG_FECHAS_ADMISIONES`) al no existir endpoint GET de configuraciones guardadas.
- April 21, 2026 (latest): `/matricula` ahora tiene vista de gestión para `COORDINADOR/ADMIN` consumiendo `GET /sapp/matriculaAcademica`, con filtros de programa/periodo/estado + búsqueda libre (nombre/código/programa), tabla de resultados y panel de detalle por matrícula (incluye asignaturas). Se conservaron intactos los flujos de `ESTUDIANTE` (validación vigente + creación).
- April 20, 2026 (latest): en la etapa `HOJA_DE_VIDA` del detalle de inscripción de admisiones (coordinación), el visor PDF lateral ahora consume el endpoint específico `GET /sapp/document?tramiteId={inscripcionId}&codigoTipoDocumentoTramite=ANX-2&codigoTipoTramite=1001`. Se eliminó la heurística por texto para identificar “hoja de vida” y se toma directamente el primer documento retornado con base64 para `ANX-2`.
- April 20, 2026 (latest): en **Coordinación > Estudiantes** (`/coordinacion/estudiantes`) se actualizó el card UI para renderizar foto desde el nuevo contrato de `GET /sapp/estudiantes/consulta` (`data[].estudiante.foto`). El mapeo frontend transforma `mimeType + contenidoBase64` a `data:{mime};base64,...` (`fotoUrl`) y el card muestra placeholder “Sin foto” cuando el backend responde `foto: null`.
- April 20, 2026 (latest): en `InscripcionAdmisionDetallePage` se agregó el bloque final **Finalizar inscripción** (visible para `ADMIN/COORDINADOR`), con confirmación de acción y validación previa de completitud de calificaciones por etapa (`HOJA_DE_VIDA`, `EXAMEN_DE_CONOCIMIENTOS`, `ENTREVISTA`) usando `GET /sapp/evaluacionAdmision/info?inscripcionId={id}&etapa={etapa}`. Si la validación pasa, ejecuta en secuencia `PUT /sapp/evaluacionAdmision/calcularPuntajes/{id}` y luego `PUT /sapp/evaluacionAdmision/finalizarEvaluacion/{id}`; al terminar invalida caché (`evaluacionAdmisionAvailabilityCache`), recarga estado de evaluación + detalle de inscripción y muestra mensaje de éxito/errores por etapa en UI.
- April 20, 2026 (latest): en `ENTREVISTAS` (detalle de inscripción de admisiones), el flujo de `PROFESOR/DOCENTE` ahora replica el patrón de coordinación para captura masiva: se rastrean filas modificadas por `id` mientras el usuario edita `puntajeAspirante`/`observaciones` y se habilita un botón único al final **Enviar calificaciones** que hace `POST /sapp/evaluacionAdmision/registroPuntaje` con solo los cambios.
- April 20, 2026 (latest): solicitudes ahora consume `GET /sapp/estadosSolicitud` como fuente única del catálogo de estados (filtros coordinación, selector en detalle y labels de badges). Se agregó cache en runtime con fallback al catálogo local (8 siglas oficiales) para evitar ruptura visual si falla la carga del endpoint.
- April 20, 2026 (latest): `/admisiones` para `PROFESOR/DOCENTE` dejó de usar asignaciones mock y ahora consulta endpoints reales bajo `/api/sapp`: `GET /api/sapp/convocatoriaAdmision` (filtra `vigente=true`) + `GET /api/sapp/inscripcionAdmision/convocatoria/{id}` por cada convocatoria activa. La UI separa dos listas/cards por programa (MISI y DCC), muestra datos clave del aspirante y navega directo a `/admisiones/convocatoria/{convocatoriaId}/inscripcion/{inscripcionId}/entrevistas`.
- April 20, 2026 (latest): fix puntual para el detalle de inscripción en admisiones cuando se inicia evaluación desde la misma pantalla (`/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/*`). Además del polling ya existente, ahora el `Outlet` se remonta con `componentReloadVersion` al detectar `STARTED`, forzando recarga de componentes hijos y eliminación del estado visual bloqueado/mensaje stale sin refresh manual.
- April 20, 2026 (latest): fix para admisiones (secretaría/coordinación) en el CTA de **Continuar/Iniciar evaluación**. Se detectó condición de carrera: después de `POST /sapp/evaluacionAdmision/iniciarEvaluacion/{inscripcionId}`, la pantalla podía navegar/recargar antes de que `GET /sapp/evaluacionAdmision/info` devolviera `STARTED`, dejando UI gris con mensaje persistente “No se ha iniciado proceso de evaluación.”. Se implementó polling corto (5 intentos, 500ms) en `InscripcionDocumentosPage` e `InscripcionAdmisionDetallePage` antes de habilitar navegación/estado final.
- April 20, 2026 (latest): ajuste de flujo de estados en admisiones. En `AspiranteDocumentosPage`, al completar el último documento obligatorio se llama `PUT /sapp/inscripcionAdmision/cambioEstadoPorVal/{inscripcionId}` (estado destino: **POR VALIDAR DOCUMENTOS**). En `InscripcionAdmisionDetallePage`, al abrir **Documentos cargados** se mantiene `PUT /sapp/inscripcionAdmision/cambioEstadoVal/{inscripcionId}`, pero solo si el estado actual normaliza a `POR_VALIDAR_DOCUMENTOS`.
- April 20, 2026 (latest): en `ConvocatoriaDetallePage` (`/admisiones/convocatoria/:convocatoriaId`) la grilla de aspirantes dejó de usar fotos mock remotas y ahora carga la foto real por cada aspirante consultando `GET /sapp/document?codigoTipoTramite=1002&tramiteId={aspiranteId}` y filtrando `codigoTipoDocumentoTramite = ANX-4`. Se agregó servicio genérico reutilizable (`src/modules/documentos/api/documentoFotoService.ts`) para resolver imágenes por tipo/código/trámite y, cuando no existe foto, se usa placeholder local de perfil vacío (`getMockStudentPhotoUrl`).
- April 20, 2026 (latest): en `InscripcionDocumentosPage` (`/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/documentos`) el refresh tras **Aprobar/Rechazar** ahora es silencioso y no bloqueante: se eliminó el popup de éxito y la tabla ya no se reemplaza temporalmente por “Cargando documentos...”; la lista visible se mantiene hasta recibir la nueva respuesta, evitando el parpadeo de estado vacío.
- April 20, 2026 (latest): se ajustó `DocumentUploadCard` para previsualización de foto (`previewAsImage`) en `/aspirante/documentos`: la imagen ahora queda alineada a la izquierda y el recuadro punteado ya no ocupa todo el ancho de la tarjeta, sino que se ajusta al contenido de la imagen.
- April 20, 2026 (latest): en `CreateAspiranteModal` (coordinación), se removió el campo **Foto de perfil**. El flujo de creación de admitido ya no pide foto en esa etapa y mantiene el registro + carga secuencial de documentos del trámite de coordinación.
- April 20, 2026 (latest): en `/aspirante/documentos`, cuando el checklist trae `codigoTipoDocumentoTramite = ANX-4` (`Foto`, trámite `ADMISION_ASPIRANTE`), la tarjeta ahora usa selector `image/*` y muestra previsualización inline de la imagen (seleccionada o ya cargada).
- April 17, 2026 (latest): se implementó rol `PROFESOR` con alias `DOCENTE` en utilitarios de rol, guards y sidebar. Profesor ya navega a `Solicitudes` (vista coordinación en solo lectura) y `Admisiones` (flujo dedicado `Mis entrevistas` con asignaciones mock por `username/userId`).
- April 17, 2026 (latest): en detalle de inscripción de admisiones, `PROFESOR/DOCENTE` queda restringido solo a `ENTREVISTAS`; accesos directos a `/documentos`, `/hoja-vida` y `/examen` ahora redirigen automáticamente a `/entrevistas`.
- April 17, 2026 (latest): evaluación de entrevista ahora filtra aspectos por evaluador para profesor (match tolerante por nombre normalizado desde sesión), muestra mensaje explícito cuando no hay aspectos asignados, y guarda notas reales con `POST /sapp/evaluacionAdmision/registroPuntaje` + recarga de datos tras guardar.
- April 17, 2026 (latest): `SolicitudDetallePage` (ESTUDIANTE) corrige la regla de edición de documentos para usar estado **normalizado** (`normalizeEstadoSolicitud`) y habilitar reemplazo/carga en la lista actual para `ENVIADA`, `EN_REVISION`, `DEVUELTA` y `RECHAZADA` (evita falsos bloqueos cuando backend retorna `EN REVISION` con espacios).
- April 17, 2026 (latest): `SolicitudDetallePage` (ESTUDIANTE) eliminó la duplicidad de secciones de documentos y ahora deja una sola experiencia unificada basada en `SolicitudDocumentosEditor` (sin tabla extra de `DocumentosAdjuntos` en esa vista).
- April 17, 2026 (latest): `SolicitudDocumentosEditor` para ESTUDIANTE ahora permite guardar reemplazos directamente en la misma sección con botón `Guardar documentos` (subida real a backend vía `POST /sapp/document`), manteniendo formato visual consistente con otros flujos de documentos.
- April 17, 2026 (latest): `SolicitudDocumentosEditor` dejó de depender del store mock local y ahora consulta checklist real (`getChecklistDocumentos`) + reemplaza archivos con `uploadDocument` (`POST /sapp/document`), calculando `checksum` SHA-256 y refrescando el checklist/documentos al guardar.
- Solicitudes (estudiante) quedó ajustado para crear solicitud y, en el mismo submit, subir documentos secuencialmente al endpoint `/sapp/document` usando `tramiteId = solicitud.id`, `usuarioCargaId = session.user.id` y `aspiranteCargaId = null`; si falla algún archivo se reporta error parcial manteniendo la solicitud creada.
- April 17, 2026 (latest): en los listados de `/solicitudes` se ajustó la columna **Estado** para evitar badges desbordados con etiquetas largas. Ahora el badge en tabla usa ancho fijo en desktop (`9.5rem`) y ajuste de texto (multilínea) con `overflow-wrap`; en mobile conserva ancho fluido para no romper el layout tipo tarjeta.
- April 17, 2026 (latest): fix de contrato en creación de solicitudes de estudiante. `getTiposSolicitud` ahora normaliza el payload para soportar backend con `tramiteId` (además de `tipoTramiteId`), y completa `tipoTramiteId` antes de llamar `GET /sapp/tramite/document?tipoTramiteId=...`. Con esto se elimina el mensaje de error de falta de `tipoTramiteId` al elegir tipo.
- April 17, 2026 (latest): en `SolicitudEstudianteForm` (`/solicitudes`, rol ESTUDIANTE) se reemplazó la carga mock de requisitos por consulta real `GET /sapp/tramite/document?tipoTramiteId={tipoTramiteId}` tomando `tipoTramiteId` directamente del tipo seleccionado (`GET /sapp/tipoSolicitud`). La UI de documentos ahora reutiliza `DocumentUploadCard`, igualando el look & feel de la pantalla de carga de documentos del aspirante.
- April 17, 2026 (latest): se alineó todo el módulo de `solicitudes` al catálogo oficial de estados backend (IDs 1..8). `StatusBadge`, filtros de coordinación y selector de cambio de estado en detalle ahora usan un único catálogo (`ENVIADA`, `EN_REVISION`, `APROBADA`, `RECHAZADA`, `DEVUELTA`, `PFIR_DIR_TG`, `PFIR_COOR_POS`, `PFIR_CAR_CONT`). Además, el formulario de creación aclara que el estado inicial es **ENVIADA A COMITE ASESOR DE POSGRADOS**.
- April 16, 2026 (latest): fix de estabilidad en `/solicitudes` (COORDINADOR) para evitar `TypeError: Cannot read properties of undefined (reading 'trim')` cuando `tipoSolicitud.codigoNombre` llega nulo/undefined desde backend; se robusteció `formatTipoSolicitudLabel` y el `<select>` usa fallback visible `Sin tipo de solicitud`.
- April 16, 2026 (latest): `/solicitudes` en vista COORDINADOR ahora ordena por `fechaRegistro` descendente y pagina localmente en bloques de 10 filas; se agregó paginador (Anterior/Siguiente + indicador de página) y se reinicia a página 1 cuando cambian filtros o se recarga lista.
- April 16, 2026 (latest): en listado/filtro de tipo de solicitud para coordinación se removió el prefijo de código en UI (ej. `1002 - ...` → solo nombre legible), manteniendo el `tipoSolicitudId` como valor interno del filtro.
- April 17, 2026 (latest): `SolicitudDetallePage` (COORDINADOR/ADMIN) actualizó la carga de documentos adjuntos al nuevo contrato de detalle: ahora toma `data.tipoTramiteCodigo` y consulta `GET /sapp/document?tramiteId={solicitudId}&codigoTipoTramite={tipoTramiteCodigo}`; ya no depende de `tipoSolicitudCodigo`/`codigoTipoTramiteId`.
- April 15, 2026 (latest): en evaluación de **Hoja de vida** (`/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/hoja-vida`) se eliminó la columna Acción/Editar por fila; los campos `observaciones` y `puntajeAspirante` ahora están siempre habilitados, se rastrean cambios por `id` en frontend y el botón final **Actualizar** envía únicamente filas modificadas al endpoint real `PUT /sapp/evaluacionAdmision/registroPuntaje`.
- April 15, 2026 (latest): sidebar de la app actualizado con iconografía por opción (Solicitudes, Matrícula, Créditos, Estudiantes, Admisiones) y CTA de salida con icono, mejorando escaneo visual de navegación.
- April 15, 2026 (latest): sidebar desktop ahora inicia colapsado (84px) y se expande automáticamente con `:hover` / `:focus-within`; el contenido principal usa margen fijo colapsado para ganar espacio útil en pantalla.
- Coordinación > Estudiantes list endpoint integration is active in frontend service layer (`/sapp/estudiantes/consulta`). Program selector already uses `/sapp/programaAcademico`; both are now backend-driven for the list screen.
- April 9, 2026 (latest): `/matricula` ahora revalida elegibilidad inmediatamente antes de confirmar (`GET /sapp/matriculaAcademica/vigente/estudiante/{estudianteId}`) para bloquear condiciones de carrera/estado stale. También se robusteció el parser del contrato para soportar `data` como `boolean`, string (`"true"`/`"false"`), objeto único o arreglo.
- April 9, 2026 (latest): `/matricula` ahora valida primero `GET /sapp/matriculaAcademica/vigente/estudiante/{estudianteId}` para decidir si el estudiante puede confirmar matrícula. Reglas aplicadas en UI: `data[]` => matrícula existente (bloquea creación), `data=false` => no hay periodo vigente (bloquea creación), `data=true` => habilita creación.
- April 9, 2026 (latest): `/matricula` para rol `ESTUDIANTE` ya consume asignaturas reales desde `GET /sapp/asignaturas?programaId=1` (antes mock), mantiene selector sin duplicados y ahora exige `grupo` por materia seleccionada antes de confirmar.
- April 9, 2026 (latest): confirmación de matrícula en frontend integrada a `POST /sapp/matriculaAcademica` con payload `{ estudianteId, periodoId, asignaturas: [{ asignaturaId, grupo }] }`; al completar, se reconsulta `GET /sapp/matriculaAcademica/vigente/estudiante/{estudianteId}` para sincronizar periodo académico vigente en UI.
- April 9, 2026 (latest): en `SolicitudDetallePage` (coordinador/admin), el cambio de estado ahora usa endpoint unificado `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=...` con `siglaEstado` del catálogo oficial (IDs 1..8). Se removió el contrato de endpoints separados y se alineó la opción visible “EN REVISION” en el selector.
- April 9, 2026 (latest): en **Estudiantes (coordinación)** el combo de programas ya no usa catálogo mock local; ahora consume `GET /sapp/programaAcademico` con contrato `{ ok, message, data[] }` (`id`, `nombre`, `codigoNombre`), mapea `nombre` corto (`MISI`/`DCC`) a nombre largo institucional y filtra estrictamente dos programas permitidos para coordinación. El listado/detalle de estudiantes continúa mock por ahora.
- Student cards en Admisiones (coordinación) ahora muestran correctamente campos largos (correo/teléfono) sin superposición visual y el estado se presenta legible con espacios en lugar de `_`.
- April 9, 2026 (latest): fixed Admisiones student cards in coordinación so long field values (email/phone) no longer overlap between columns (`min-width:0` + wrapping styles), and normalized estado display by replacing underscores with spaces.
- April 8, 2026 (latest): `/aspirante/documentos` now maps backend document validation state directly from `documentoUploadedResponse.estadoDocumento`. Rows in `RECHAZADO` display rejection notes (`observacionesDocumento`) and are treated as pending until the aspirante uploads a replacement; `APROBADO` shows an approved state chip.
- April 8, 2026 (latest): fixed visual misalignment in `/solicitudes` table for **Observaciones** column. The line-clamp styling was moved from the `<td>` to an inner `<span>` so the cell keeps native `table-cell` behavior; column width is now fixed to 260px on desktop, which keeps observation content blocks uniform and row separators aligned across all columns.
- April 8, 2026 (latest): fixed admin/coordinator solicitudes table layout on missing description text. `SolicitudesTable` now normalizes empty textual fields and shows explicit fallbacks (`Sin descripción.` / `Sin observaciones.`), preventing row desalignment when backend returns blank strings; the **ID** column was also removed from the table per UX decision.
- April 8, 2026 (latest): fixed investigación save trigger in `/aspirante/documentos` by normalizing aspirante id from session (`Number(session.user.id)`) before validation. This prevents false client-side validation failures when `id` arrives as string and guarantees `PUT /sapp/aspirante` is fired after clicking **Agregar información** with valid selections.
- April 8, 2026 (latest): `/aspirante/documentos` investigación card now persists data with backend. Clicking **Agregar información** executes `PUT /sapp/aspirante` with `{ id, grupoInvestigacionId, directorId }` using new `updateAspiranteInvestigacion` service; button shows `Guardando información...`, and combos stay disabled only after successful save.
- April 8, 2026 (latest): investigación card in `/aspirante/documentos` now loads catalog data from backend endpoints (`GET /sapp/gruposInvestigacion` and `GET /sapp/gruposInvestigacionDocentes?grupoId={id}&query=`) instead of static frontend mocks; docentes list refreshes when `grupoId` changes.
- April 8, 2026 (latest): in `/aspirante/documentos`, a new card **“Información de investigación”** was added below the document checklist with two select combos: **Grupo de investigación** and **Director del grupo de investigación**. The UI follows existing SAPP visual tokens and supports light/dark themes.
- April 8, 2026 (latest): aspirante document upload flow now triggers backend state transition automatically when the user uploads the **last required document**. In `AspiranteDocumentosPage`, after a successful `POST /sapp/document`, frontend checks required-doc completion transition (`incomplete -> complete`) and fires `PUT /sapp/inscripcionAdmision/cambioEstadoPorVal/{inscripcionId}` in background (no UI feedback/toast). Initial checklist load no longer triggers this event.
- April 7, 2026 (latest): aspirante upload cards now display the selected filename directly in the status chip (replacing “Listo para subir”) and expose a new “Ver documento” action after successful upload to open the stored base64 file in a new tab.
- April 7, 2026 (latest): aspirante document upload screen (`/aspirante/documentos`) was visually aligned with the institutional SAPP style system. The page header and cards now use semantic theme tokens (`--surface`, `--outline`, `--primary`, etc.), rounded card containers, softer shadows, and pill-style actions compatible with light/dark modes.
- April 7, 2026 (latest): adjusted inscripción-detail state transition in secretaría/coordinación flow. When opening **Documentos cargados**, frontend now calls `PUT /sapp/inscripcionAdmision/cambioEstadoVal/{inscripcionId}` (endpoint swap from `cambioEstadoPorVal`) and only triggers it when previous estado normalizes to `POR_VALIDAR_DOCUMENTOS`.
- April 6, 2026 (latest): Admisiones evaluación UI (Hoja de vida y Examen) was upgraded for COORDINADOR with full-width responsive layout. `EvaluacionEtapaSection` removed the `Evaluador` column, reordered table columns to keep `Nota` as the final emphasized field (right aligned / stronger weight), and upgraded `Consideraciones` rendering to full callout blocks with JSON pretty-print fallback when payload looks like JSON text.
- April 6, 2026 (latest): Hoja de vida now includes inline PDF preview in `EvaluacionEtapaPage` by loading checklist docs from `GET /sapp/document?codigoTipoTramite=1002&tramiteId={inscripcionId}` (through shared `getDocumentosByTramite`), locating a probable HV document via name/code heuristics (`HOJA DE VIDA`, `HOJA`, `HV`), and rendering `iframe` preview + `Abrir`/`Descargar`. If no file matches or file has no base64 payload, the page shows a clear fallback message.
- April 6, 2026 (latest): inscripción detalle now detects _real_ Documentos window opens via transition tracking (`prevActiveRef`) and executes `PUT /sapp/inscripcionAdmision/cambioEstadoPorVal/{inscripcionId}` only on first successful open per inscripción (`didCambioEstadoValRef` keyed by id). If PUT fails, the flag is not set and the next open retries. Added DEV-only logs (`[INSCRIPCION_ESTADO]`) for open detection, skip reasons (`not_en_construccion` / `already_triggered`), call start, success, and error.
- April 6, 2026 (latest): refactored `InscripcionDocumentosPage` validation table layout and behavior to match UX contract: `Validación` column always renders `Aprobar/Rechazar`, active filled button reflects backend status (`APROBADO` or `RECHAZADO`), rejection reason is hidden by default and only appears when entering reject mode, and `Acciones` now only shows horizontal `Ver/Descargar`. Approve/reject actions call `PUT /sapp/document` and re-fetch only `loadDocumentos()` (no route reload).
- ✅ Admisiones detalle de inscripción ahora dispara `PUT /sapp/inscripcionAdmision/cambioEstadoPorVal/{inscripcionId}` al expandir “Documentos cargados” solo cuando el estado está en `EN CONSTRUCCION`/`EN_CONSTRUCCION`, con guard frontend para evitar llamadas repetidas en abrir/cerrar.
- ✅ La actualización de estado se ejecuta en paralelo (no bloquea la carga de documentos) y muestra feedback inline: “Actualizando estado...” o warning no intrusivo si falla.
- ✅ Después de PUT exitoso, el frontend refresca el estado de inscripción recargando el registro desde `GET /sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` + filtro por `inscripcionId`.
- April 6, 2026 (latest): optimized COORDINACIÓN/SECRETARÍA document review in `InscripcionDocumentosPage` to avoid full tab/route reloads after approve/reject. The page now uses local `loadDocumentos()` re-fetch only, sorts checklist rows by `codigoTipoDocumentoTramite`, derives UI state (`PENDIENTE/POR_REVISAR/APROBADO/RECHAZADO`) from backend fields, renders horizontal action clusters (`Ver/Descargar` + `Aprobar/Rechazar`), marks active decision buttons from backend status, and keeps decision actions disabled/gray when `documentoCargado=false`. Reject now uses inline motivo capture + explicit confirm.
- April 6, 2026 (latest): fixed the coordinator flow in `InscripcionDocumentosPage` where “Continuar evaluación” still used a simulated alert. It now calls `POST /sapp/evaluacionAdmision/iniciarEvaluacion/{inscripcionId}` through `iniciarEvaluacion`, invalidates availability cache, and only then navigates to `/hoja-vida`; button shows `Iniciando evaluación...` and is disabled while request is in progress.
- April 6, 2026 (latest): Admisiones inscripción detalle now gates evaluation by a new status probe (`GET /sapp/evaluacionAdmision/info?inscripcionId={id}` without etapa): if `ok:false` + `data:null`, Documentos shows a new CTA “Iniciar proceso de evaluación”; clicking it calls `POST /sapp/evaluacionAdmision/iniciarEvaluacion/{inscripcionId}`, invalidates the 30s availability cache, re-probes status, hides the CTA, and enables Hoja de vida/Examen/Entrevistas without manual refresh. Route guard now also blocks direct stage URLs unless status is STARTED.
- April 6, 2026 (latest): fixed Admisiones convocatoria UX: when no open convocatoria exists for a programa, the most recent closed one is no longer shown as “vigente” and now appears under “Convocatorias anteriores”; in `ConvocatoriaDetalle`, aspirante creation is blocked when the selected convocatoria is closed after resolving its state from `GET /sapp/convocatoriaAdmision`.
- April 6, 2026 (latest): updated Admisiones convocatoria state handling so “VIGENTE/CERRADA” is derived from `fechaInicio` + `fechaFin` in frontend (`isConvocatoriaVigente`) instead of trusting only backend `vigente`; passed `cupos` through navigation state to convocatoria detail and blocked “Crear aspirante” when `inscripciones.length >= cupos` with visible alert/error messaging.
- April 6, 2026 (latest): updated admisión student cards to render additional identity/contact fields when present in API payload (`cedula|numeroDocumento`, `correo|emailPersonal`, `telefono`, `posicionAdmision|posicion_admision`) while preserving graceful fallback (`—`) if backend does not send them yet.
- Branding update completed on April 6, 2026: all visible instances of "SAPP Posgrados" were renamed to "SAPP" in shared UI shells and login; login now includes the full expanded name "Sistema de apoyo a procesos de posgrado" as context text.
- April 4, 2026: reemplazado el flujo mock de periodos en creación de convocatoria por servicios reales `GET /sapp/periodoAcademico` + `POST /sapp/periodoAcademicoFecha`, con helper `ensurePeriodoForAdmision` (match por `anioPeriodo`, fallback `periodoId=max+1`) y feedback de progreso en modal.
- April 4, 2026: `CreateConvocatoriaModal` now executes a 2-step create flow in one submit action: (A) real `POST /sapp/convocatoriaAdmision` with mandatory `periodoId`, then (B) mock professor assignment using `assignProfesoresToConvocatoria({ convocatoriaId, profesoresId })`; includes fallback ID resolution via refreshed GET when POST does not return `data.id`, plus in-modal retry state for partial failures.
- April 4, 2026: added mock catalogs/services for Admisiones convocatoria creation: `fetchPeriodos()` (`periodos.mock.ts`) and `fetchProfesores()` (`profesores.mock.ts`), consumed only through service boundaries to ease future replacement by real endpoints.
- April 4, 2026: `/matricula` no longer renders a generic placeholder for students; it now loads a mock convocatoria via `fetchMatriculaConvocatoria()` and conditionally renders (a) closed-state panel when `isOpen=false`, or (b) full mock enrollment flow when `isOpen=true`: search+dropdown subject picker, selected subjects table with remove action, required-documents checklist table with estado badges and mock upload filename capture, plus guarded `Confirmar matrícula` button (`disabled` until at least one subject is selected).
- April 4, 2026: updated `src/modules/solicitudes/components/SolicitudesFiltersBar/SolicitudesFiltersBar.css` so filter controls align left-to-right instead of center/spread, reducing empty gaps; layout now uses desktop grid (`filters + actions`) with responsive single-column fallback at <=900px and stacked actions at <=560px.
- April 3, 2026: coordinator `/solicitudes` now includes backend filters (`estadoId`, `tipoSolicitudId`) with a reusable `SolicitudesFiltersBar`; changing filters triggers `GET /sapp/solicitudesAcademicas` with only defined query params, and “Limpiar filtros” resets to unfiltered list.
- April 3, 2026: `SolicitudesCoordinadorView` now loads tipos from `GET /sapp/tipoSolicitud` for the tipo combo, keeps loading/error/empty states, and shows the filtered-empty message “No hay resultados con los filtros seleccionados.”.
- April 2, 2026: backend contract update applied: `EN ESTUDIO` keeps URL id (`PUT /sapp/solicitudesAcademicas/cambioEstadoEnEstudio/{id}`) while `APROBADA`/`RECHAZADA` now send batch body `{ solicitudesId: [id] }` without id in URL.
- April 2, 2026: replaced the coordinator detalle estado mock with real backend transitions using `PUT /sapp/solicitudesAcademicas/cambioEstadoEnEstudio/{id}`, `.../cambioEstadoAprobada` (body batch), and `.../cambioEstadoRechazada` (body batch) via `src/modules/solicitudes/api/solicitudCambioEstadoService.ts`.
- April 2, 2026: `SolicitudDetallePage` now shows coordinator-only estado selector/actions (`EN ESTUDIO`, `APROBADA`, `RECHAZADA`) with loading disable, backend error surface, and forced detail re-fetch after every successful PUT plus a dedicated partial-success message when refresh fails.
- April 2, 2026: detail “Volver” navigation now sends refresh state and coordinator list re-fetch depends on route location updates to ensure `/solicitudes` reflects the latest estado after returning from detail.
- April 2, 2026: verified/fixed Solicitudes estado badge regression where all chips appeared green; `StatusBadge.css` now uses stronger variant selectors and explicit rgba colors per estado, preventing override by generic/global styles.
- April 2, 2026: `normalizeEstadoSolicitud` now supports common backend variants (`EN_ESTUDIO`, `APROBADO`, `RECHAZADO`) before rendering the badge, keeping colors consistent in table/card/detail views.
- Solicitudes status badges are now centralized with `StatusBadge` + `normalizeEstadoSolicitud`, applied in table/detail/card views with differentiated colors for REGISTRADA, EN ESTUDIO, APROBADA, RECHAZADA, and UNKNOWN fallback.
- ✅ Added ESTUDIANTE-side mock document replacement flow in `SolicitudDetallePage`: edit mode now renders required docs by `tipoSolicitudId`, supports replace/remove, commits selected files as base64 on save, and persists by `solicitudId` in localStorage (`sapp:solicitudes:docs:{id}`).
- ✅ Added reusable `SolicitudDocumentosEditor` for both edit mode and read-only mode (outside edit), including required-doc warning (`Faltan documentos obligatorios por adjuntar.`) without blocking save by default.
- ✅ Added persistent mock store `solicitudDocumentosStore.mock.ts` with in-memory cache + localStorage helpers (`load/save/upsert/remove/get`).
- Solicitudes module now consumes real backend APIs for tipos/list/create and role-based listings; mock services remain only for non-covered flows (e.g., edit-by-student and documentos adjuntos mock data).
- ✅ Student solicitudes listing now uses only `GET /sapp/solicitudesAcademicas/estudiante?estudianteId=...` (fallback without `/sapp` removed).
- ✅ `SolicitudesEstudianteView` now resolves student identity strictly from `session.user.estudiante?.id`; when missing, UI shows `No hay estudianteId en sesión` and skips API calls.
- ✅ `SolicitudDetallePage` now loads detail with `GET /sapp/solicitudesAcademicas/{solicitudId}` via `getSolicitudAcademicaById`, and shows `ID inválido` when route param is not numeric.

- ✅ Student solicitudes mock now guarantees at least one visible row for `estudianteId=2` by injecting a fallback seed (`id=10`, estado `REGISTRADA`) in the shared in-memory store when missing.
- ✅ `SolicitudDetallePage` now supports ESTUDIANTE inline editing (mock) for `tipoSolicitudId` + `observaciones`, with `Guardar cambios` / `Cancelar` and success feedback `Cambios guardados (mock)`.
- ✅ Student edit permissions are restricted by estado: edit action is available only for `REGISTRADA` and `EN ESTUDIO`; no student edit action for `APROBADA` / `RECHAZADA`.
- ✅ Added student update path in solicitudes mocks/services: `updateSolicitudEstudianteMock` (store) + `updateSolicitudEstudiante` (async service) with tipo derivation (`tipoSolicitudCodigo` and `tipoSolicitud`) from catálogo.
- ✅ List/detail sync confirmed by design: student list reads from the same store and re-fetches on navigation key changes, so edits in detail are reflected when returning to `/solicitudes`.
- ✅ Solicitud detalle now includes a coordinator/admin-only “Documentos adjuntos” section sourced from mocks by `solicitudId`, with loading/error/empty states and retry support.
- ✅ Added mock documentos store + service for solicitudes (`solicitudDocumentosById` for IDs 1,2,3,4 + `fetchSolicitudDocumentos` with 150ms delay) to emulate backend retrieval without breaking existing mock flows.
- ✅ Added `DocumentosAdjuntos` component with `Ver` (PDF open in new tab) and `Descargar` (all mime types) actions reusing `src/shared/files/base64FileUtils.ts`; actions are disabled when file payload is incomplete.
- ✅ Solicitudes now includes detail navigation from both role-based tables to `/solicitudes/:solicitudId`, with row click + Enter key accessibility.
- ✅ Added shared in-memory solicitudes store (`src/modules/solicitudes/mock/solicitudesStore.mock.ts`) used by coordinator list, student list, and detalle APIs so state stays synchronized.
- ✅ Added `SolicitudDetallePage` with loading/error/data states, read-only solicitud info, and coordinator-only mock status updates (`EN ESTUDIO`, `APROBADA`, `RECHAZADA`).
- ✅ Corrected theme usage across login/layout/cards/forms/tables: global text uses `--text-primary`/`--text-secondary`, while `--on-primary` is only used on primary surfaces (e.g., green buttons).
- ✅ Implemented a global institutional visual baseline aligned with the UIS palette and login reference: centralized theme tokens in `src/styles/globals.css`, with Beer.css-compatible variables for `body.light` and `body.dark`.
- ✅ `src/main.tsx` now sets initial theme class (`light`/`dark`) from `localStorage` (`sapp-theme`) and falls back to `light` by default to avoid inverted first render in modo claro.
- ✅ Refreshed key shell surfaces (`Layout`, `ModuleLayout`, `AspiranteLayout`, `Sidebar`) and both login screens to consume semantic theme tokens (rounded cards, soft shadows, minimal fields, pill primary actions).
- ✅ Fixed infinite-loop requests in `CreateAspiranteModal`: trámite documentos are fetched once per modal-open cycle (using an open-transition guard) so the screen waits for a single response before rendering documents.
- ✅ Latest update: `CreateAspiranteModal` now relies on backend trámite documents only; hardcoded fallback requirements were removed, and the modal fetches `/sapp/tramite/document?tipoTramiteId=1`, filters `ADMISION_COORDINACION`, and maps to `DocumentUploadItem` via `src/modules/admisiones/api/tramiteDocumentoMappers.ts`.
- ✅ Implemented `/solicitudes` as a role-based module: `COORDINADOR`/`ADMIN` users see a responsive card grid (4 mock records), `ESTUDIANTE` users see a validated form with dynamic document requirements by `tipoSolicitudId`, and other roles receive a no-permission message.
- ✅ Added resilient UX states for trámite documents in the modal: `isLoadingDocs`, `docsError` with retry, and explicit empty-state messaging when no `ADMISION_COORDINACION` docs are configured.
- ✅ Sequential upload now consumes dynamic backend `tipoDocumentoTramiteId` values, so changes in backend configuration are reflected without frontend code edits.
- ✅ Fixed TypeScript auth/document compile blockers on March 31, 2026: `AspiranteDocumentosPage` now safely reads `inscripcionAdmisionId` from an `AspiranteUser`-typed session user, and both login pages switched `FormEvent` to type-only imports required by `verbatimModuleSyntax`.
- Added evaluación availability gating for Hoja de Vida/Examen/Entrevistas: availability probe with cache, disabled accordion windows with “Disponible cuando se inicie la evaluación.”, and route guard to redirect when stages are unavailable.
- Inscripción documentos now shows load status and backend validation status (`estadoDocumento`) with rejection reasons (`observacionesDocumento`); approve/reject refreshes the checklist and enables “Continuar evaluación” once all required docs are approved.
- Fixed `DocumentUploadCard` to pass through the optional `onRemoveFile` handler, preventing a runtime reference error when removing files.
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
- Updated the “Crear aspirante” modal to post `/sapp/aspirante`, store `aspiranteId` + `inscripcionAdmisionId`, and sequentially upload selected documentos via `POST /sapp/document` with base64 + SHA-256 (retrying failed uploads without recreating the aspirante).
- The modal now uses a temporary admisión aspirante document template to render requirements before `tramiteId` exists, keeping the modal open on partial failures and showing an upload summary.
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

- Confirmar con backend el código de tipo trámite para documentos de matrícula (`CODIGO_TIPO_TRAMITE_MATRICULA_ACADEMICA=1003`) y el endpoint de aprobación final (`PUT /sapp/matriculaAcademica/aprobar/{id}`) para asegurar compatibilidad en todos los ambientes.
- Ejecutar QA manual del nuevo módulo `/admisiones/configuracion/fechas` con usuarios reales `ADMIN/COORDINADOR`: validar carga de periodos (`GET /api/sapp/periodoAcademico`), guardado (`POST /api/sapp/periodoAcademicoFecha`) y persistencia local tras refresh.
- Ejecutar QA manual en `/matricula` con `COORDINADOR/ADMIN` para validar que el backend entregue valores consistentes de `programaAcademico`, `periodoAcademico` y `estado` (los filtros dependen de coincidencia exacta de estos strings).
- QA manual pendiente para perfil `PROFESOR/DOCENTE`: validar que sidebar solo expone `Solicitudes` + `Admisiones`, que `/admisiones` lista asignaciones mock propias y que la redirección forzada a `/entrevistas` funciona para deep-links a otras etapas de inscripción.
- Confirmar con backend la regla definitiva de matching `evaluador` vs usuario autenticado (actualmente se usa nombre completo normalizado de `persona` en sesión).
- Validar manualmente en navegador `/solicitudes/:id` (rol ESTUDIANTE) que la sección única de documentos no duplique registros, y que `Reemplazar` + `Guardar documentos` refresque correctamente el archivo cargado/fecha sin necesidad de recargar página.
- Verificar contrato backend de `POST /sapp/solicitudesAcademicas`: idealmente debe retornar `id` de la solicitud creada de forma determinística. Hoy el frontend tiene fallback por diff en listado cuando `data.id` no viene informado.
- Validar manualmente en navegador `/solicitudes` (coordinación) que la paginación de 10 elementos se mantenga correcta al aplicar/quitar filtros (`estado`, `tipo`) y al volver desde detalle (refresh por `location.state`).
- Confirmar con backend si el endpoint `/sapp/document` seguirá aceptando `codigoTipoTramiteId` como alias legado o si se debe migrar el resto de clientes a `codigoTipoTramite` exclusivamente.
- Validar manualmente en navegador `/matricula` con los 3 escenarios del backend para `GET /sapp/matriculaAcademica/vigente/estudiante/{id}`: (1) `data[]`, (2) `data=false`, (3) `data=true`, confirmando habilitación/bloqueo del botón `Confirmar matrícula` y mensaje visible en UI.
- Validación manual pendiente en navegador para detalle coordinador `/solicitudes/:id`: confirmar que todas las siglas válidas (`ENVIADA`, `EN_REVISION`, `APROBADA`, `RECHAZADA`, `DEVUELTA`, `PFIR_DIR_TG`, `PFIR_COOR_POS`, `PFIR_CAR_CONT`) disparan `PUT /sapp/solicitudesAcademicas/cambioEstado/{id}?siglaEstado=...` con query param correcto y que el badge recargado refleje el estado final.
- Validar con backend el shape final de `GET /sapp/programaAcademico` (campos `id/codigo/nombre`) para eliminar fallback defensivo de mapeo en frontend y estabilizar el contrato tipado.
- Validar manualmente en navegador el flujo aspirante de documento **RECHAZADO**: debe mostrarse observación, permitir “Subir nuevamente”, y reflejar estado actualizado tras refrescar checklist.
- Validar manualmente en QA que el endpoint canónico de hoja de vida (`codigoTipoDocumentoTramite=ANX-2`, `codigoTipoTramite=1001`) siempre retorna `base64DocumentoContenido` para inscripciones con archivo cargado, y acordar fallback explícito si backend responde arreglo vacío.
- Verificar con backend si existe endpoint de detalle directo por inscripción (ej. `GET /sapp/inscripcionAdmision/{id}`) para evitar recargar la lista completa de la convocatoria al refrescar el estado.
- Confirmar contrato exacto de respuesta de `cambioEstadoVal` (si retorna `data.estado` definitivo) para evitar roundtrip adicional cuando sea posible.
- Confirm with backend the canonical date format/timezone for `convocatoriaAdmision.fechaInicio` and `fechaFin` to avoid edge-case mismatches around day boundaries when frontend computes vigencia.
- Decide whether cupo validation should also be enforced server-side with a specific error code/message when `POST /sapp/aspirante` exceeds `convocatoria.cupos` (frontend now blocks known overflow only when `cupos` is available in navigation state).
- Replace remaining mock services `fetchProfesores` and `assignProfesoresToConvocatoria` with real endpoints once backend contracts are available; periodo académico ya usa APIs reales.
- Validate with backend the expected `POST /sapp/convocatoriaAdmision` behavior when creating convocatorias for programas not yet present in historical data (the UI currently derives selectable programs from existing convocatorias returned by GET).
- Confirm and align real backend contracts for matrícula (`convocatoria vigente`, `catálogo de materias por estudiante/plan`, and `documentos requeridos + estados`) so `src/modules/matricula/services/matriculaMockService.ts` can be swapped without changing UI component contracts.
- Confirm `/sapp/evaluacionAdmision/info` contract for “empty data” vs `ok=false` to ensure availability gating matches backend semantics.
- Confirm JWT payload contract fields with backend (e.g., `rolesUsuario`, `nombreUsuario`, `idUsuario`) and whether timestamps are always present.
- Confirm backend response for uploaded document metadata (filename, version, dates) to extend UI details if needed.
- Confirm whether `/sapp/document` may return additional validation states beyond `POR_REVISAR/APROBADO/RECHAZADO` and how they should map in the UI.
- Define environment variables and API base URL for production/staging.
- Add automated tests (unit/integration) and CI checks.
- Replace stub module services with real API calls once endpoints are available.
- Confirm the convocatoria admisión response contract (fields, `vigente` rules) with the backend team.
- Validate the inscripcion detail API contract when it becomes available (currently placeholder UI only).
- Confirm the backend response and state transitions for `/sapp/document` approve/reject, especially error messaging and allowed document states.
- Define the data contracts for documentos/hoja de vida/examen/entrevistas once those features are scoped.
- Confirm save/update endpoint for evaluación de admisión and decide payload + response contract.
- Validar manualmente en navegador que, en `/admisiones/convocatoria/:convocatoriaId`, las tarjetas de aspirante muestran foto ANX-4 cuando existe y placeholder vacío cuando no existe (incluyendo errores de red por aspirante).
- Confirm whether entrevista “resumen” entries (codigo `ENTREV`) should be editable and define the desired backend payload.
- Confirm `programaAcademico` string patterns beyond DCC/MISI to keep `programaId` resolution accurate for new programs.
- Confirm the backend contracts for `/sapp/tramite/document?tipoTramiteId=1` and the intended upload flow for aspirante documents + profile image.
- Confirm whether the backend expects **all** documents in the admisión checklist to be required or if optional uploads should be reintroduced.
- Replace the frontend document template with a backend requirements endpoint for `codigoTipoTramite=1002` once available, and verify the correct `tipoDocumentoTramiteId` values for uploads.

## Next Steps

1. QA manual en `/matricula/:matriculaId` (rol `COORDINADOR/ADMIN`): validar carga de checklist de documentos, acciones Ver/Descargar, aprobación/rechazo con observaciones y habilitación del botón **Aprobar matrícula** únicamente con obligatorios aprobados.
1. QA manual de seguridad y acceso: confirmar que `ESTUDIANTE` no puede entrar a `/admisiones/configuracion/fechas` y que `ADMIN/COORDINADOR` sí pueden operar el formulario completo.
2. Si backend expone un `GET /api/sapp/periodoAcademicoFecha`, reemplazar el store local temporal por fuente backend y conservar `localStorage` solo como caché opcional.
3. QA manual en `/matricula` con rol `COORDINADOR` y `ADMIN`: validar filtros combinados (programa+periodo+estado+búsqueda), conteo de registros y apertura de detalle con asignaturas por matrícula.

- QA manual dirigida (alta prioridad): reproducir el caso reportado en `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/hoja-vida` y confirmar que después de **Iniciar proceso de evaluación** desaparece el mensaje “No se ha iniciado proceso de evaluación.”, se habilitan las ventanas bloqueadas y los componentes cargan estado actualizado sin F5.
- QA manual en `/admisiones/convocatoria/:convocatoriaId`: confirmar en Network una consulta `/sapp/document?codigoTipoTramite=1002&tramiteId={aspiranteId}` por tarjeta y validar fallback visual de avatar vacío cuando `ANX-4` no viene cargado.
- Ejecutar QA manual con dos usuarios: `PROFESOR/DOCENTE` y `COORDINADOR`, verificando que el flujo coordinador no cambió y que el profesor solo puede editar `ENTREVISTAS`.
- Reemplazar `src/modules/admisiones/mock/profesorAsignaciones.mock.ts` por endpoint real de asignaciones cuando backend lo publique (mantener mismo contrato `AsignacionEntrevista`).
- QA manual dirigida del ajuste en detalle de solicitud de estudiante: confirmar eliminación de duplicado visual y flujo de actualización de documento (`Reemplazar` → `Guardar documentos` → `Ver/Descargar` archivo nuevo).
- Ejecutar validación E2E manual del flujo de coordinación en solicitudes: listar → filtrar → paginar → entrar a detalle → verificar carga de documentos por API real → volver al listado conservando re-fetch.
- Si backend exige `codigoTipoTramite` (sin sufijo `Id`) para algunos entornos, añadir fallback no disruptivo en `getSolicitudDocumentosAdjuntos` o alinear contrato único con backend antes de merge a ramas de release.

1. QA manual en `/matricula` (rol ESTUDIANTE) con backend real:
   - Caso A (`data[]`): debe cargar asignaturas de matrícula existente y dejar `Confirmar matrícula` deshabilitado.
   - Caso B (`data=false`): debe mostrar mensaje de periodo no vigente y bloquear creación.
   - Caso C (`data=true`): debe permitir confirmar y luego pasar a estado bloqueado tras crear matrícula.
1. Manual QA in browser for `/coordinacion/estudiantes`: validate network call includes `egresados=false`, cards render null-safe values, and detail navigation works from in-memory cache after selecting a card.
1. QA manual en `/solicitudes/:id` con rol COORDINADOR/ADMIN: probar transición a `EN REVISION`, `APROBADA`, `RECHAZADA`; verificar request en Network (`siglaEstado`) y recarga de detalle sin errores.
1. Completar integración real del módulo estudiantes: mantener `GET /sapp/programaAcademico` ya activo para catálogo y reemplazar mocks restantes con endpoints de estudiantes (`GET estudiantes?programaId=` + `GET estudiante/{id}`) manteniendo los contratos de `src/modules/estudiantes/types.ts`.
1. QA manual en `/aspirante/documentos`: verificar que documentos con `estadoDocumento=RECHAZADO` muestren observación y que al subir reemplazo cambien a estado en revisión/aprobado según respuesta backend.
1. QA manual en navegador para `/admisiones/convocatoria/:convId/inscripcion/:inscId/hoja-vida` y `/examen`: validar tabla full-width, ausencia de columna evaluador, nota destacada editable, y render completo de consideraciones (incluyendo JSON formateado).
1. QA manual de visor PDF en Hoja de vida: confirmar split desktop 60/40, stack móvil, acciones Abrir/Descargar, y fallback “No se encontró documento de hoja de vida para previsualizar.” cuando aplique.
1. QA manual: validar en Network/UX que hoja de vida usa `codigoTipoDocumentoTramite=ANX-2` + `codigoTipoTramite=1001` y que el mensaje fallback aparece cuando el backend no retorna archivo/base64.
1. QA manual: abrir/cerrar “Documentos cargados” varias veces con una inscripción en `EN CONSTRUCCION` y confirmar en Network que solo sale un PUT exitoso por sesión de pantalla.
1. QA manual: forzar error del PUT y validar que al volver a abrir la ventana se reintenta (flag frontend vuelve a `false` en catch).
1. Evaluar optimización: reemplazar recarga por lista completa con endpoint de detalle si backend lo habilita.
1. Manual QA in browser for `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/documentos`: validate no route/tab reload after approve/reject, per-row `Procesando...` behavior, active state painting for APROBADO/RECHAZADO, and disabled gray decisions on `documentoCargado=false`.
1. Validate rejection UX copy/product decision for inline modal/panel (current implementation is inline reason panel with `Confirmar rechazo`/`Cancelar`).
1. Validate manually in browser that convocatoria rows marked “VIGENTE” switch automatically to “CERRADA” when date range is outside the current date and that filters use the same computed logic.
1. Validate in browser (manual QA) that `Crear aspirante` remains disabled for closed convocatorias even on direct URL refresh (`/admisiones/convocatoria/:id`) and after closing a convocatoria from config.
1. Verify backend payload keys for card fields (`numeroDocumento/cedula`, `emailPersonal/correo`, `telefono`, `posicionAdmision`) and align DTO naming once contract is finalized.
1. Validate end-to-end in browser/network inspector that `POST /sapp/convocatoriaAdmision` now includes `periodoId` and that assignment mock receives the created `convocatoriaId`.
1. Define real backend contract for convocatoria-profesor assignment (expected payload/response/errors) and swap `src/modules/admisiones/services/convocatoriaProfesoresMockService.ts` with API client implementation.
1. Confirm whether program options should continue to be derived from existing convocatorias or migrate to a dedicated catálogo endpoint.
1. Validate role gating end-to-end for `/admisiones/convocatorias` with real users (`ADMIN`/`COORDINADOR` allowed, `ESTUDIANTE`/`DOCENTE` blocked) and capture evidence in QA notes.
1. Verify backend date formatting expectations for `fechaInicio`/`fechaFin` (`YYYY-MM-DD`) and confirm timezone handling in persisted values.
1. Decide whether the program selector for new convocatorias should come from a dedicated catálogo endpoint (instead of deriving from existing convocatorias).
1. Replace `src/modules/matricula/services/matriculaMockService.ts` with real API clients while keeping `MatriculaConvocatoria`, `MateriaDto`, and `DocumentoRequerido` as the boundary DTOs for UI stability.
1. Add component tests for `MateriasSelector`, `MateriasSelectedTable`, and `DocumentosRequeridosTable` (duplicate prevention, remove flow, status badge rendering, file name capture on mock upload).
1. Add an E2E/manual script for matrícula role gating (`ESTUDIANTE` sees flow, non-ESTUDIANTE sees unsupported-role message) and convocatoria-open/closed behavior.
1. Replace the student document mock store (`solicitudDocumentosStore.mock.ts`) with a backend endpoint when documentos de solicitudes académicas API is available, preserving current local contract fields.
1. Add component tests for `SolicitudDocumentosEditor` commit behavior (replace/remove), required warning visibility, and read-only rendering.
1. Validate browser UX for large files / unsupported mime previews in `Ver` action and align product decision (preview vs download-only fallback).
1. Add component/unit tests for `DocumentosAdjuntos` and for `SolicitudDetallePage` role-based visibility (coordinator/admin sees docs section, estudiante does not).
1. Validate browser behavior for “Ver” on non-PDF mime types and decide if product wants preview enabled for additional formats.
1. Replace `fetchSolicitudDocumentos` mock service with real API integration once endpoint/contract is available.
1. Add a visible theme switcher (light/dark) that updates `localStorage.sapp-theme` using the corrected light-first default behavior.
1. Propagate the new design tokens to remaining page-specific CSS files with hardcoded colors to complete global consistency.
1. Capture updated UI screenshots for docs once a browser-capable environment is available.
1. Validate accessibility contrast for primary/secondary text in both themes.
1. Validate JWT claims with real backend tokens (roles/username/id) and adjust the mapper if the payload schema changes.
1. Align aspirante document response metadata (e.g., version/estado) for richer UI display if needed.
1. Add `.env.local` (or equivalent) for API base URLs.
1. Add test scaffolding (Vitest + React Testing Library) and baseline coverage.
1. Wire module pages to the new service stubs once backend endpoints are defined.
1. Validate the `/sapp/document` upload flow with real backend data (errors, size limits, and metadata display).
1. Define the inscripcion detail endpoint contract and replace the placeholder detail page.
1. Validate `/sapp/document` approve/reject flows with real data and document validation states (including unexpected values).
1. Validate the evaluación de admisión screens with real data (hoja de vida, examen, entrevista) once backend is available.
1. Replace the evaluación de admisión mock save with the real endpoint once available, including optimistic updates and error handling rules.
1. Swap the student card mock photo helper for the real backend field once the API delivers photo URLs or base64 content.
1. Validate the `/sapp/aspirante` creation flow with real backend responses (currently mocked) and expand `programaId` inference if additional program codes appear.
1. Implement the real upload flow for aspirante profile image + document attachments once endpoints are available.
1. Reconfirm server-side validation messaging for missing admisión documents to align the frontend error copy.
1. Swap the admisión aspirante document template with a live backend checklist endpoint and validate the ID mapping.
1. Replace `src/modules/solicitudes/services/solicitudesMockService.ts` with real API clients (`GET tipos`, `GET solicitudes`, `POST solicitud`) while preserving current DTO contracts in `src/modules/solicitudes/types.ts`.

## Key Paths / Artifacts / Datasets

- **Matrícula estudiante (API real):** `src/pages/Matricula/MatriculaPage.tsx`, `src/modules/matricula/services/matriculaAcademicaService.ts`, `src/modules/matricula/components/MateriasSelectedTable/*`, `src/modules/matricula/components/MateriasSelector/*`, `src/modules/matricula/types.ts`.
- **Módulo Estudiantes coordinación (nuevo):** `src/modules/estudiantes/types.ts`, `src/modules/estudiantes/mock/estudiantes.mock.ts`, `src/modules/estudiantes/services/estudiantesMockService.ts`, `src/modules/estudiantes/components/EstudianteCard/*`, `src/pages/EstudiantesCoordinacion/*`, `src/pages/EstudianteDetalleCoordinacion/*`, y wiring en `src/app/routes/index.tsx` + `src/components/Sidebar/Sidebar.tsx`.
- **Aspirante investigación update (nuevo):** `src/api/aspiranteService.ts`, `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`.
- **Cambio de estado al expandir documentos (nuevo):** `src/modules/admisiones/api/inscripcionCambioEstadoService.ts`, `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`, `src/modules/admisiones/api/inscripcionAdmisionService.ts`, `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`.
- **Convocatoria create flow (ensure periodo + profesores mock):** `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx`, `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.css`, `src/modules/admisiones/services/ensurePeriodoService.ts`, `src/modules/admisiones/api/periodoAcademicoService.ts`, `src/modules/admisiones/api/periodoAcademicoTypes.ts`, `src/modules/admisiones/utils/periodoLabel.ts`, `src/modules/admisiones/services/profesoresMockService.ts`, `src/modules/admisiones/services/convocatoriaProfesoresMockService.ts`, `src/modules/admisiones/mock/profesores.mock.ts`.
- **Convocatorias config (nuevo):** `src/pages/ConvocatoriasAdmisionConfig/*`, `src/modules/admisiones/components/CreateConvocatoriaModal/*`, `src/modules/admisiones/api/convocatoriaAdmisionService.ts`, `src/modules/admisiones/api/convocatoriaAdmisionTypes.ts`, and route wiring in `src/app/routes/index.tsx` + `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`.
- **Matrícula module (nuevo, mock-ready):** `src/modules/matricula/types.ts`, `src/modules/matricula/mock/*`, `src/modules/matricula/services/matriculaMockService.ts`, `src/modules/matricula/components/*`, `src/pages/Matricula/MatriculaPage.tsx`.
- **Solicitudes documentos (estudiante mock persistente):** `src/modules/solicitudes/types/solicitudDocumentosTypes.ts`, `src/modules/solicitudes/mock/solicitudDocumentosStore.mock.ts`, `src/modules/solicitudes/components/SolicitudDocumentosEditor/*`
- **Solicitudes documentos adjuntos (mock):** `src/modules/solicitudes/types/documentosAdjuntos.ts`, `src/modules/solicitudes/mock/solicitudDocumentos.mock.ts`, `src/modules/solicitudes/services/solicitudDocumentosMockService.ts`, `src/modules/solicitudes/components/DocumentosAdjuntos/*`
- **Routing:** `src/app/routes/index.tsx`, `src/app/routes/*Routes.tsx`
- **ProtectedRoute:** `src/app/routes/protectedRoute.tsx`
- **Role guard helper:** `src/auth/roleGuards.ts`, `src/modules/auth/roles/roleUtils.ts`
- **RequireRoles wrapper:** `src/routes/RequireRoles/RequireRoles.tsx`
- **Aspirante guard/routes:** `src/app/routes/aspiranteOnlyRoute.tsx`, `src/app/routes/aspiranteRoutes.tsx`
- **Auth context/types/storage:** `src/context/Auth/*`, `src/modules/auth/session/sessionStore.ts`
- **Auth API (SAPP login):** `src/api/authService.ts`
- **JWT payload + decoder:** `src/api/jwtPayloadTypes.ts`, `src/utils/jwt.ts`
- **Auth DTOs/mappers:** `src/api/authTypes.ts`, `src/api/authMappers.ts`
- **Estudiante ID helper (single source):** `src/modules/solicitudes/utils/getEstudianteId.ts`
- **API config/types:** `src/api/config.ts`, `src/api/types.ts`
- **Aspirante consulta info API:** `src/api/aspiranteAuthService.ts`, `src/api/aspiranteConsultaTypes.ts`, `src/api/aspiranteAuthMappers.ts`
- **Tipos documento API:** `src/api/tipoDocumentoIdentificacionTypes.ts`, `src/api/tipoDocumentoIdentificacionService.ts`
- **HTTP client:** `src/shared/http/httpClient.ts`
- **Module service stubs:** `src/api/solicitudesService.ts`, `src/api/matriculaService.ts`, `src/api/creditosService.ts`
- **Solicitudes module (nuevo):** `src/modules/solicitudes/types.ts`, `src/modules/solicitudes/mock/*`, `src/modules/solicitudes/services/solicitudesMockService.ts`, `src/modules/solicitudes/components/SolicitudEstudianteForm`, `src/modules/solicitudes/components/SolicitudCard`, `src/modules/solicitudes/components/SolicitudesCoordinadorGrid`, `src/pages/Solicitudes/SolicitudesPage.tsx`
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
- **Documento template (admisión aspirante):** `src/modules/documentos/templates/admisionAspiranteDocumentTemplate.ts`
- **Mock photo helper:** `src/modules/admisiones/utils/mockStudentPhoto.ts`
- **Programa resolver:** `src/modules/admisiones/utils/resolveProgramaId.ts`
- **Trámite documentos (admisión):** `src/modules/admisiones/api/tramiteDocumentoService.ts`, `src/modules/admisiones/api/tramiteDocumentoTypes.ts`
- **Inscripcion detail placeholder:** `src/pages/InscripcionAdmisionDetalle`
- **Accordion window component:** `src/modules/admisiones/components/InscripcionAccordionWindow`
- **Inscripcion child pages:** `src/pages/InscripcionDocumentos`, `src/pages/InscripcionHojaVida`, `src/pages/InscripcionExamen`, `src/pages/InscripcionEntrevistas`
- **Evaluación admisión (UI):** `src/modules/admisiones/pages/EvaluacionEtapaPage`, `src/modules/admisiones/components/EvaluacionEtapaSection`
- **Evaluación admisión (API/types):** `src/modules/admisiones/api/evaluacionAdmisionService.ts`, `src/modules/admisiones/types/evaluacionAdmisionTypes.ts`
- **Evaluación admisión (estado/inicio):** `src/modules/admisiones/api/evaluacionAdmisionEstadoService.ts`, `src/modules/admisiones/api/iniciarEvaluacionService.ts`, `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`
- **Evaluación admisión availability:** `src/modules/admisiones/api/evaluacionAdmisionAvailabilityService.ts`, `src/modules/admisiones/api/evaluacionAdmisionAvailabilityCache.ts`, `src/modules/admisiones/routes/RequireEvaluacionEnabled.tsx`
- **Evaluación admisión (util):** `src/modules/admisiones/utils/groupByEtapa.ts`, `src/modules/admisiones/utils/groupByEvaluador.ts`
- **Documentos module (coordinación/secretaría):** `src/modules/documentos/constants.ts`, `src/modules/documentos/api/types.ts`, `src/modules/documentos/api/documentosService.ts`, `src/modules/documentos/api/aprobacionDocumentosService.ts`
- **Documentos UI types:** `src/modules/documentos/types/ui.ts`
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

- 2026-04-21: `npx eslint src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx src/modules/configFechas/api/*.ts src/modules/configFechas/storage/configFechasStorage.ts src/app/routes/index.tsx src/pages/ConvocatoriasAdmisionConfig/ConvocatoriasAdmisionConfigPage.tsx` ✅ (sin errores en los archivos tocados para el módulo de configuración de fechas).
- 2026-04-21: `npm run build` ❌ (falla por errores TypeScript preexistentes fuera del alcance en admisiones; el ajuste de matrícula compila en los archivos tocados y se validó adicionalmente con eslint dirigido).
- 2026-04-20: `npx eslint src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx src/modules/estudiantes/services/estudiantesMockService.ts src/modules/estudiantes/mock/estudiantes.mock.ts src/modules/estudiantes/types.ts` ✅ (sin errores en los archivos tocados para soporte de foto en cards de estudiantes).
- 2026-04-20: `npm run build` ❌ (falla por errores TypeScript preexistentes fuera del alcance de este ajuste en `src/modules/admisiones/api/finalizarEvaluacionService.ts` e `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`).
- 2026-04-20: `npm run build` ✅ (pasa con el ajuste de entrevistas para `PROFESOR/DOCENTE`: botón global **Enviar calificaciones** + envío batch de filas modificadas por `POST /sapp/evaluacionAdmision/registroPuntaje`).
- 2026-04-20: `npm run lint` ❌ (falla por deuda ESLint preexistente repo-wide; errores fuera del alcance en `src/api/*Service.ts`, `protectedRoute.tsx`, `AuthContext.tsx`, `RequireEvaluacionEnabled.tsx`, `SolicitudesCoordinadorView.tsx`, etc. El cambio actual no introduce reglas nuevas en esos archivos).
- 2026-04-20: `npm run lint` ❌ (deuda ESLint preexistente repo-wide; se confirma warning nuevo en archivo tocado: `react-hooks/exhaustive-deps` por objeto `sectionAvailability` recreado por render en `InscripcionAdmisionDetallePage.tsx`; no bloquea runtime fix de recarga/remount tras iniciar evaluación).
- 2026-04-20: `npm run build` ✅ (pasa tras ajustar el trigger de `cambioEstadoVal` en detalle de inscripción para estado `EN_CONSTRUCCION` al abrir Documentos).
- 2026-04-20: `npx eslint src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx` ✅ (sin errores; queda 1 warning preexistente de `react-hooks/exhaustive-deps` en el mismo archivo).
- 2026-04-20: `npm run lint` ❌ (falla por deuda ESLint preexistente del repositorio fuera del alcance de este ajuste: `no-explicit-any`, `react-hooks/purity`, `react-hooks/set-state-in-effect`, etc.).
- 2026-04-20: `npm run lint` ⚠️ (falla por errores preexistentes del repositorio fuera del alcance de este ajuste; se validó archivo tocado con `npx eslint src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`).
- `npm run build` ✅ passes on April 20, 2026 after replacing admisiones aspirante card photos with backend ANX-4 fetch (`codigoTipoTramite=1002`) and generic document-photo service helpers.
- `npm run build` ✅ passes on April 20, 2026 after left-aligning the ANX-4 photo preview and constraining the preview frame to image content width in `DocumentUploadCard`.
- `npm run build` ✅ passes on April 20, 2026 after removing profile-photo input from coordinación create-aspirante modal and adding ANX-4 image preview behavior in aspirante document upload cards.
- `npm run lint` ❌ fails on April 20, 2026 due to **pre-existing** repo-wide ESLint debt (12 errors, 2 warnings), including `no-explicit-any` stubs, `react-hooks/purity`, `react-hooks/set-state-in-effect`, and `react-refresh/only-export-components`; no new lint errors tied to this ANX-4/photo change were introduced.
- `npm run build` ✅ passes on April 17, 2026 after implementing solicitud-estudiante sequential upload flow (create solicitud -> upload each selected document with checksum/base64) and required-doc validation.
- `npm run lint` ❌ still fails on April 17, 2026 due to pre-existing repository-wide ESLint debt (unrelated to this change).
- `npm run lint` ❌ fails on April 17, 2026 after the estado-badge width/wrapping update due to **pre-existing** repo-wide ESLint debt unrelated to this UI change (e.g., `no-explicit-any` in `src/api/*Service.ts`, `react-hooks/purity` in `protectedRoute.tsx`, `react-hooks/set-state-in-effect` in Admisiones/Solicitudes, and `react-refresh/only-export-components` in `AuthContext.tsx`).
- `npm run build` ✅ passes on April 17, 2026 after adding `tramiteId -> tipoTramiteId` normalization in `getTiposSolicitud` and keeping the student request-document fetch flow stable.
- `npm run build` ✅ passes on April 17, 2026 after wiring solicitudes-estudiante document requirements to `GET /sapp/tramite/document?tipoTramiteId=...` and rendering cards with the aspirante upload style.
- `npm run build` ✅ passes on April 16, 2026 after hardening `tipoSolicitudLabel` + coordinator filter fallback for null/undefined `codigoNombre` values (`/solicitudes`).
- `npm run build` ✅ passes on April 15, 2026 after refactoring Hoja de vida evaluation editing to always-enabled fields + bulk update (`PUT /sapp/evaluacionAdmision/registroPuntaje`) with modified-row tracking.
- `npm run lint` ❌ fails on April 15, 2026 due to pre-existing repo-wide lint debt unrelated to this change (`no-explicit-any`, `react-hooks/purity`, `react-hooks/set-state-in-effect`, `react-refresh/only-export-components`, unused vars in other modules).
- `npm run build` ✅ passes on April 9, 2026 after hardening matrícula eligibility flow with pre-submit revalidation + tolerant response parsing (`data[] | object | true/false | "true"/"false"`) for `/sapp/matriculaAcademica/vigente/estudiante/{id}`.
- `npm run build` ✅ passes on April 9, 2026 after adding matrícula eligibility gating with `GET /sapp/matriculaAcademica/vigente/estudiante/{id}` (`data[]|true|false` handling) and disabling confirm action when creation is not allowed.
- `npm run build` ✅ passes on April 9, 2026 after replacing matrícula materias mock with real asignaturas endpoint, adding per-materia `grupo`, and wiring create/reload matrícula flows (`POST /sapp/matriculaAcademica` + `GET /sapp/matriculaAcademica/vigente/estudiante/{id}`).
- `npm run build` ✅ passes on April 9, 2026 after updating Solicitudes coordinator detail to unified estado endpoint (`PUT /sapp/solicitudesAcademicas/cambioEstado/{id}?siglaEstado=...`) and normalizing UI/estado badge to `EN REVISION`.
- `npm run lint` ❌ fails on April 9, 2026 due to pre-existing repo-wide lint debt unrelated to this change (`no-explicit-any`, `react-hooks/purity`, `react-hooks/set-state-in-effect`, `react-refresh/only-export-components`, and unused vars in other modules).
- `npm run build` ✅ passes on April 8, 2026 after adding backend-driven state handling in aspirante checklist (`APROBADO`/`RECHAZADO`) with re-upload requirement for rejected docs.
- `npm run build` ✅ passes on April 8, 2026 after fixing `/solicitudes` Observaciones column alignment (uniform width + aligned row separators) by moving clamp styles to inner content instead of the `<td>`.
- `npm run build` ✅ passes on April 8, 2026 after fixing admin `/solicitudes` table alignment for empty description/observations and removing the ID column in `SolicitudesTable`.
- `npm run build` ✅ passes on April 8, 2026 after wiring investigación save to real backend update (`PUT /sapp/aspirante`) with loading/error handling on “Agregar información”.
- `npm run build` ✅ passes on April 8, 2026 after wiring investigación combos to real catalog endpoints (`gruposInvestigacion` + `gruposInvestigacionDocentes`).
- `npm run build` ✅ passes on April 8, 2026 after adding the new investigación card and both combos in aspirante documentos (`/aspirante/documentos`).
- `npm run build` ✅ passes on April 7, 2026 after aspirante documentos visual integration + required-doc completion mock event logging.
- `npm run build` ✅ passes on April 7, 2026 after changing inscripción-detail documentos transition to `cambioEstadoVal` + `POR_VALIDAR_DOCUMENTOS` gate.
- `npm run build` ✅ passes on April 6, 2026 after Admisiones evaluación UI changes (full-width layout + tabla reordenada + consideraciones callout/JSON + visor PDF hoja de vida).
- `npm run lint` ⚠️ fails on April 6, 2026 due to pre-existing repo-wide ESLint errors outside this change scope (e.g., explicit `any` in `src/api/*Service.ts`, react-hooks purity/set-state-in-effect warnings in solicitudes/protected routes, and context export fast-refresh rule); no new lint errors were introduced by touched admisiones files.
- `npm run build` ✅ passes on April 6, 2026 after refactoring `cambioEstadoPorVal` trigger to run only on `DOCUMENTOS` open transition with per-inscripción once guard + DEV-only diagnostics.
- `npm run build` ✅ passes on April 6, 2026 after implementing the new documentos validation UX split (`Validación` buttons + reject-mode note + `Acciones` only Ver/Descargar) and list-only refresh behavior in `InscripcionDocumentosPage` + `ValidationButtons` component.
- `npm run build` ✅ passes on April 6, 2026 after implementing `cambioEstadoPorVal` on expand (once-only guard + non-blocking UX + refresh estado inscripción).
- `npm run build` ✅ passes on April 6, 2026 after implementing document review UX optimization in `InscripcionDocumentosPage` (no full reload, sorted checklist, immediate approve, inline reject confirm, active-state decision buttons, disabled pending decisions).
- `npm run build` ✅ passes on April 6, 2026 after replacing the simulated “Continuar evaluación” alert with the real iniciar evaluación service call in `InscripcionDocumentosPage` (including in-flight button disable state).
- `npm run build` ✅ passes on April 6, 2026 after adding evaluación start probe + CTA (`Iniciar proceso de evaluación`), new iniciar endpoint service, cache invalidation, and status-based route/window gating in inscripción detalle.
- `npm run build` ✅ passes on April 6, 2026 after admisiones fix: closed latest convocatoria moves to “Convocatorias anteriores” and `Crear aspirante` is blocked when convocatoria is closed (state resolved from convocatoria list by id).
- `npm run build` ✅ passes on April 6, 2026 after admisiones updates (computed vigencia by dates, cupo overflow guard for creating aspirantes, and extra aspirante fields in student cards).
- `npm run build` ✅ passes on April 6, 2026 after branding update (`SAPP Posgrados` → `SAPP`) and login subtitle expansion with full product meaning.
- `npm run build` ✅ passes on April 4, 2026 after implementing periodo libre (año/semestre), ensure de periodo académico por API (`GET /sapp/periodoAcademico` + `POST /sapp/periodoAcademicoFecha`), y creación de convocatoria con `periodoId` asegurado en `CreateConvocatoriaModal`.
- `npm run build` ✅ passes on April 4, 2026 after adding required `periodoId` to convocatoria creation and integrating mock professor multi-assignment flow in `CreateConvocatoriaModal`.
- `npm run build` ✅ passes on April 4, 2026 after implementing Admisiones convocatorias configuration (new `/admisiones/convocatorias` page, create modal, close action, and route/role guards).
- `npm run build` ✅ passes on April 4, 2026 after implementing the ESTUDIANTE matrícula mock module (`/matricula` with convocatoria gate + materias selector + documentos checklist + mock confirm action).
- `npm run build` ✅ passes on April 4, 2026 after global UI consistency/responsive refinements (tokens + layout spacing + mobile sidebar + mobile-friendly solicitudes table).
- `npm run lint` ❌ still fails on pre-existing repo lint debt unrelated to this visual pass (`no-explicit-any`, hooks purity/set-state-in-effect, unused vars).
- `npm run build` ✅ passes on April 3, 2026 after adding coordinator filters (`estadoId` + `tipoSolicitudId`) and wiring filtered solicitudes service calls without undefined query params.
- `npm run build` ✅ passes on April 2, 2026 after updating Solicitudes estado transitions to batch payloads for APROBADA/RECHAZADA and always reloading detalle after successful estado updates.
- `npm run build` ✅ passes on April 2, 2026 after integrating real coordinator estado PUT endpoints + detail fallback refresh path.
- `npm run build` ✅ passes on April 2, 2026 after centralizing Solicitudes status badges (`StatusBadge`) and replacing legacy single-color badges in list/detail/card views.
- `npm run build` ✅ passes on April 2, 2026 after integrating `SolicitudDocumentosEditor` + localStorage mock persistence for student document replacement in solicitud detail edit mode.
- `npm run build` ✅ passes on April 2, 2026 after enforcing Solicitudes real endpoints for student list (`/sapp/solicitudesAcademicas/estudiante?estudianteId=...`) and detail (`/sapp/solicitudesAcademicas/{id}`), plus session-based `estudianteId` validation.
- `npm run build` ✅ passes on April 2, 2026 after integrating real Solicitudes APIs (listado coordinador/estudiante + creación POST) and detail lookup by list filtering.
- `npm run build` ✅ passes on April 2, 2026 after extending login/session contracts with optional `estudiante` and wiring solicitudes/home to consume `session.user.estudiante.id`.
- Manual validation checklist for this update:
  - Caso 1 (ESTUDIANTE con `data.estudiante`): localStorage `SAPP_AUTH_SESSION` should include `user.estudiante.id`.
  - Caso 2 (COORDINADOR/DOCENTE/ADMIN sin `data.estudiante`): login/session remains valid, `user.estudiante` stays `null`.
  - Caso 3 (ASPIRANTE): no behavior changes expected (`kind: "ASPIRANTE"` contract untouched).
- Manual validation checklist for this update (pending browser walkthrough):
  - ESTUDIANTE `/solicitudes`: list should show at least one row without creating data first.
  - ESTUDIANTE `/solicitudes/:id` with estado `REGISTRADA`/`EN ESTUDIO`: “Editar solicitud” visible, save persists `tipoSolicitud` + `observaciones`.
  - ESTUDIANTE with estado `APROBADA`/`RECHAZADA`: edit action hidden.
  - COORDINADOR/ADMIN detalle: keeps “Cambiar estado” + “Documentos adjuntos”, without student edit UI.
- `npm run build` ✅ passes on April 2, 2026 after adding student edit flow and mock update service.
- Manual validation target for this update:
  - Coordinator/Admin: `/solicitudes/1` should show “Documentos adjuntos” with working `Ver`/`Descargar`.
  - Estudiante: `/solicitudes/1` should not render the documentos section.
- Solicitudes role gating manual checklist completed in code review: coordinator-priority branching, student-only form fallback, and no-permission fallback are implemented in `src/pages/Solicitudes/SolicitudesPage.tsx` (pending interactive browser verification).
- `npm run build` ✅ passes on March 31, 2026 after fixing the reported `AspiranteDocumentosPage` union property access and `FormEvent` type-only imports.
- `npm run lint` ❌ fails due to pre-existing lint debt (`no-explicit-any` in module stubs, React hooks purity/set-state-in-effect rules, and unused vars in helper/stub files).

## Environment & Package Versions

- **Node environment:** No Python venv/conda/poetry used; frontend runs with Node + npm.
- **Package manager:** npm (lockfile: `package-lock.json`).
- **Environment variables:** `VITE_API_BASE_URL` (defaults to `http://localhost:8080` if unset).
- **Core package versions (from `package.json`):**
  - react 19.2.0
  - react-dom 19.2.0
  - react-router-dom 7.9.2
  - typescript 5.9.3
  - vite (rolldown-vite) 7.2.5
  - @vitejs/plugin-react-swc 4.2.2
  - eslint 9.39.1
- **Avoid duplicate envs:** reuse the existing `node_modules` in this repo; only run `npm install` if dependencies are missing or lockfile changed. Do not create Python virtual environments (`venv`/`conda`/`poetry`) for this project.

## Schemas / Contracts (Expected Outputs)

- **Matrícula mock contracts (frontend boundary):** `src/modules/matricula/types.ts`, `src/modules/matricula/services/matriculaMockService.ts`
  - `fetchMatriculaConvocatoria(): Promise<MatriculaConvocatoria>` where `{ isOpen, periodoLabel, fechaInicio, fechaFin, mensaje? }`.
  - `fetchMateriasCatalogo(): Promise<MateriaDto[]>` where `MateriaDto = { id, nombre, codigo, nivel }`.
  - `fetchDocumentosRequeridos(): Promise<DocumentoRequerido[]>` where `DocumentoRequerido = { id, nombre, obligatorio, estado, fechaRevision, observaciones }` and `estado ∈ { PENDIENTE, EN_REVISION, APROBADO, RECHAZADO }`.
- **Solicitudes cambio de estado (real, actualizado):** `src/modules/solicitudes/api/solicitudCambioEstadoService.ts`
  - `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado={SIGLA}`
  - `SIGLA` habilitadas por backend (referencia): `APROBADA`, `RECHAZADA`, `DEVUELTA`, `EN_REVISION`, `ENVIADA`, `PFIR_DIR_TG`, `PFIR_COOR_POS`, `PFIR_CAR_CONT`.
  - En la UI de coordinador actualmente solo se exponen `EN_REVISION`, `APROBADA`, `RECHAZADA`.
  - Frontend usa envelope `{ ok, message, data }`, propaga `message` en error, y recarga detalle con `GET /sapp/solicitudesAcademicas/{id}` tras PUT exitoso.
- **Solicitudes documentos (nuevo contrato frontend, mock):** `src/modules/solicitudes/types/solicitudDocumentosTypes.ts`
  - `SolicitudDocumentoRequirement`: `{ id, nombre, obligatorio }`
  - `SolicitudDocumentoAdjunto`: `{ requirementId, fileName, mimeType, base64, updatedAt }`
  - `SolicitudDocumentoDraft`: `{ requirement, current, selectedFile, error? }`
- **Solicitudes documentos store (mock persistente):** `src/modules/solicitudes/mock/solicitudDocumentosStore.mock.ts`
  - localStorage key: `sapp:solicitudes:docs:${solicitudId}`
  - helpers: `loadSolicitudDocs`, `saveSolicitudDocs`, `upsertSolicitudDoc`, `removeSolicitudDoc`, `getSolicitudDoc`.
- **Solicitudes API contracts (real):** `src/modules/solicitudes/api/types.ts`, `src/modules/solicitudes/api/tipoSolicitudService.ts`, `src/modules/solicitudes/api/solicitudesAcademicasService.ts`
  - `GET /sapp/tipoSolicitud` => `{ ok, message, data: TipoSolicitudDto[] }`
  - `GET /sapp/solicitudesAcademicas` => `{ ok, message, data: SolicitudAcademicaDto[] }`
  - `GET /sapp/solicitudesAcademicas?estadoId={id}&tipoSolicitudId={id}` (params opcionales; frontend solo envía los definidos, con “Todos” = sin param).
  - `GET /sapp/solicitudesAcademicas/estudiante?estudianteId=...` (single supported endpoint for student list)
  - `GET /sapp/solicitudesAcademicas/{solicitudId}` => `{ ok, message, data: SolicitudAcademicaDto | null }` (frontend throws `Solicitud no encontrada` when `data` is null)
  - `POST /sapp/solicitudesAcademicas` with body `{ estudianteId, tipoSolicitudId, fechaResolucion: null, observaciones }` and envelope response.
- **Solicitudes documentos adjuntos (mock):** `src/modules/solicitudes/types/documentosAdjuntos.ts`
  - `SolicitudDocumentoAdjuntoDto`: `{ idDocumento, nombreArchivo, mimeType, base64Contenido, descripcion?, obligatorio? }`
- **Solicitudes documentos mock service:** `src/modules/solicitudes/services/solicitudDocumentosMockService.ts`
  - `fetchSolicitudDocumentos(solicitudId)` resolves `SolicitudDocumentoAdjuntoDto[]`, returns `[]` if id is not configured, and simulates 150ms latency.
- **Solicitudes mocks/contracts:** `src/modules/solicitudes/types.ts` uses shared `ApiResponse<T>`; mock responses in `src/modules/solicitudes/mock/*.ts` follow `{ ok, message, data }`; student payload logged on submit is `{ tipoSolicitudId, observaciones, documentos[{ id, nombre, obligatorio, fileName }] }`.
- **Auth session contract:** `src/context/Auth/types.ts`
  - `AuthSession`: `{ kind: "SAPP" | "ASPIRANTE", accessToken: string, issuedAt?, expiresAt?, user: AuthUser | AspiranteUser }`
  - `AuthUser` (SAPP) now supports `estudiante?: { id: number; [key: string]: unknown } | null`.
- **SAPP login output:** `src/api/authService.ts`
  - Expects backend response envelope `{ ok, message, data }` and maps `data` + decoded JWT payload into `AuthSession` (username, roles, iat/exp).
  - `data.roles` is now `string[]`; the mapper prefers response roles and falls back to JWT payload roles.
  - `data.estudiante?: { id: number; [key: string]: unknown } | null` is persisted to `session.user.estudiante`.
  - Student-scoped features should resolve identity via `getEstudianteIdFromSession(session)` and not via `session.user.id`.
  - JWT payload contract: `src/api/jwtPayloadTypes.ts` (supports `rolesUsuario`/`roles`, `nombreUsuario`/`sub`, `idUsuario`, `iat`, `exp`).
- **Aspirante consulta info output:** `src/api/aspiranteAuthService.ts`
  - Calls `GET /sapp/aspirante/consultaInfo` with `{ numeroInscripcion, tipoDocumentoId, numeroDocumento }`, expects `{ ok, message, data: AspiranteConsultaInfoDto }` (including `nombre`, `director`, `grupoInvestigacion`, `telefono`, `numeroInscripcionUis`, `fechaRegistro`), and maps the response into `AuthSession` with `kind: "ASPIRANTE"` and `accessToken: "NO_TOKEN"`. `numeroInscripcionUis` is normalized to string on write.
- **Tipos documento response:** `src/api/tipoDocumentoIdentificacionService.ts`
  - Expects `{ ok, message, data: TipoDocumentoIdentificacionDto[] }` from `GET /sapp/tipoDocumentoIdentificacion` and returns the typed `data` array.
- **HTTP client wrapper:** `src/shared/http/httpClient.ts`
  - `http<T>(path, options?)` uses `fetch`, attaches `Authorization` when a session token exists (unless `auth: false`), and logs out + redirects on 401/403.
- **Document checklist response:** `src/api/documentChecklistService.ts`
  - Expects `{ ok, message, data: DocumentChecklistItemDto[] }` from `GET /sapp/document?codigoTipoTramite=1002&tramiteId=...` and returns the typed `data` array. Each DTO includes `documentoCargado` and `documentoUploadedResponse` (with `nombreArchivoDocumento`, `versionDocumento`, `estadoDocumento`, `observacionesDocumento`, etc.).
- **Documentos checklist (coordinación/secretaría):** `src/modules/documentos/api/documentosService.ts`
  - Expects `{ ok, message, data: DocumentoTramiteItemDto[] }` from `GET /sapp/document?codigoTipoTramite=1002&tramiteId=...` and returns the typed `data` array for the coordinador screen.
- **Documentos validación UI model:** `src/modules/documentos/types/ui.ts`
  - `DocumentoTramiteUiItem` extends the checklist DTO with `validacionEstado: "PENDIENTE" | "POR_REVISAR" | "APROBADO" | "RECHAZADO"` and optional `validacionObservaciones`, derived from `documentoUploadedResponse`.
- **Documentos base64 fields:** `DocumentoUploadedResponseDto`
  - The frontend now expects `base64DocumentoContenido` or `contenidoBase64`, plus `mimeTypeDocumentoContenido` or `mimeType`, to open/download the uploaded document without additional endpoints.
- **Documentos aprobación/rechazo:** `src/modules/documentos/api/aprobacionDocumentosService.ts`
  - Sends `{ documentoId, aprobado, observaciones }` to `PUT /sapp/document` and expects `{ ok, message, data }`. Throws when `ok` is `false` to surface the backend `message` in the UI.
- **Document upload UI model:** `src/modules/documentos/types/documentUploadTypes.ts`
- **ANX-4 Foto UX rule (frontend):**
  - Trigger: checklist item with `codigoTipoDocumentoTramite = "ANX-4"` in aspirante documents flow.
  - Expected UI output: `DocumentUploadCard` rendered in image mode (`fileAccept = "image/*"`, button label “Seleccionar foto”, inline preview box).
  - Upload contract/output unchanged: `POST /sapp/document` with `{ tipoDocumentoTramiteId, nombreArchivo, tramiteId, aspiranteCargaId, contenidoBase64, mimeType, tamanoBytes, checksum }`, then checklist refresh via `GET /sapp/document?codigoTipoTramite=1002&tramiteId=...`.
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
  - Calls `GET /sapp/tramite/document?tipoTramiteId=1`, expects `{ ok, message, data }`, and returns typed data for UI-level filtering/mapping by `ADMISION_COORDINACION` (normalizing `tipoTramite.nombre`, `nombreTipoTramite`, or string `tipoTramite`).
- **Mock aspirante photo helper:** `src/modules/admisiones/utils/mockStudentPhoto.ts`
  - DEV-only helper that returns stable placeholder URLs per aspiranteId (modulo selection). Swap with backend `fotoUrl` or `fotoBase64` when available (e.g., `data:image/jpeg;base64,${base64}`).
- **Evaluación admisión response:** `src/modules/admisiones/api/evaluacionAdmisionService.ts`
  - Calls `GET /sapp/evaluacionAdmision/info?inscripcionId=...&etapa=...`, expects `{ ok, message, data: EvaluacionAdmisionItem[] }`, throws when `ok` is `false`, and returns `data ?? []`.
- **Evaluación admisión DTO:** `src/modules/admisiones/types/evaluacionAdmisionTypes.ts`
  - `EvaluacionAdmisionItem`: `{ id, inscripcionId, etapaEvaluacion, aspecto, codigo, consideraciones, evaluador, fechaRegistro, observaciones, ponderacionId, puntajeAspirante, puntajeMax }`.

## Update 2026-04-02 (Solicitudes UX/Table Refresh)

- Added reusable `SolicitudesTable` component for both coordinator and student modes (extra student identity columns only for coordinator mode).
- Introduced `SolicitudesCoordinadorView` and `SolicitudesEstudianteView` containers to keep `/solicitudes` role branches isolated and easier to maintain.
- Student flow now defaults to LIST view (`Mis solicitudes`), supports `Agregar solicitud` -> FORM toggle, and returns to LIST with a newly inserted mock `REGISTRADA` row after successful submit.
- Added student listing mock/service path: `src/modules/solicitudes/mock/solicitudesEstudiante.mock.ts` and `fetchSolicitudesEstudiante()` in `solicitudesMockService.ts`.
- `/solicitudes` role priority enforced as: `COORDINADOR | ADMIN` > `ESTUDIANTE` > no-permission message.

### Validation notes (manual + static)

- Build/lint were not re-run in this update window; existing repo baseline still applies (see prior section with lint debt).
- Manual code-path validation completed for role branching and LIST/FORM toggle behavior in the new containers.
