# Update 2026-09-03 — Tipo de documento y cohorte única en estudiantes

## Estado actual y decisión
- El mapper de `GET /sapp/estudiantes/consulta` acepta el tipo documental en `data[].tipoDocumento` o `data[].tipoDocumentoIdentificacion`, como lo entrega la proyección superior observada, y solo después recurre a `data[].persona.tipoDocumento`. El número conserva su resolución superior existente.
- Tanto las tarjetas del listado como el perfil usan el mismo `EstudianteCoordinacion`, por lo que ya no deben presentar `N/A 213214` cuando alguno de esos campos superiores contiene el tipo.
- En el perfil se retiró la primera fila **Cohorte**, ubicada sobre **Correo institucional**. La cohorte permanece una sola vez como **Cohorte de ingreso** en la cuadrícula académica.

## Contrato y salida esperada
- Entrada tolerada: `{ tipoDocumento?: string, tipoDocumentoIdentificacion?: string, numeroDocumento, persona: { tipoDocumento?: string, ... }, ... }` dentro de `ApiResponse.data[]`.
- Prioridad del tipo: `tipoDocumento` → `tipoDocumentoIdentificacion` → `persona.tipoDocumento` → `N/A`. Para `{ tipoDocumento: "CC", numeroDocumento: "213214" }`, listado y detalle muestran `CC 213214`.
- Paths: `src/modules/estudiantes/services/estudiantesMockService.ts` y `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`.

## Retos, próximos pasos y entorno
1. Confirmar con Network y sesión institucional cuál de los dos nombres superiores usa definitivamente el backend; la tolerancia actual permite ambos sin acoplar la UI a una sola variante.
2. Validar visualmente listado y detalle con un registro real. No crear venv/conda/poetry ni otro árbol npm: reutilizar `/workspace/SAPP-frontend/node_modules`.
3. No hay seeds/datasets ni runner Vitest; los datos provienen del backend. Versiones: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3 y Vite/Rolldown 7.2.5.

## Pruebas de esta actualización
- `npx eslint src/modules/estudiantes/services/estudiantesMockService.ts src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS (`tsc -b && vite build`); no se registraron errores de TypeScript ni de empaquetado.
- `git diff --check` (2026-09-03): PASS.
- Captura pendiente por limitación del entorno: la vista protegida necesita sesión institucional y datos del backend para reproducir el registro reportado.

---
# Update 2026-09-03 — Cierre de sesión desde el sidebar

## Estado actual y decisiones
- Se restituyó el botón **Cerrar sesión** únicamente en el pie del sidebar. En escritorio permanece pegado a la parte inferior; en el layout móvil aparece después de la navegación.
- `AuthContext` vuelve a exponer `logout()`. La acción limpia el caché y las claves de sesión conocidas, vacía `localStorage` y `sessionStorage`, intenta expirar las cookies visibles para JavaScript en las rutas y variantes de dominio aplicables, actualiza el estado React y ejecuta `window.location.reload()`.
- La recarga, en vez de una navegación a un login interno, permite que el Gateway intercepte la nueva carga y redirija al proveedor de identidad. No se añadieron rutas de login, dependencias, variables de entorno, seeds ni datasets.

## Paths, contrato y salida esperada
- Contexto y contrato: `src/context/Auth/AuthContext.tsx` y `src/context/Auth/types.ts`.
- Presentación: `src/components/Sidebar/Sidebar.tsx` y `src/components/Sidebar/Sidebar.css`.
- Entrada: clic en **Cerrar sesión**. Salida: se eliminan datos locales del origen y cookies no `HttpOnly`, y la página se recarga de inmediato.
- Restricción web: JavaScript no puede borrar cookies marcadas `HttpOnly`. Si la sesión institucional del Gateway reside en una cookie `HttpOnly`, el Gateway debe invalidarla mediante su endpoint/cabecera de cierre de sesión; integrar ese contrato cuando backend confirme su URL y método.

## Retos y próximos pasos
1. Validar el flujo completo desplegado frente al Gateway/IDP, en particular si la cookie institucional es `HttpOnly` y requiere una llamada de invalidación del lado servidor.
2. Agregar una prueba de interacción cuando el repositorio incorpore Vitest/React Testing Library; actualmente no existe script de tests.
3. Validar visualmente escritorio, móvil y ambos temas con una sesión institucional real.

## Entorno y pruebas de esta actualización
- Raíz única `/workspace/SAPP-frontend`; usar Node.js/npm y reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0.
- No existen artifacts ni datasets nuevos; `dist/` es generado y no debe versionarse.
- `npx eslint src/components/Sidebar/Sidebar.tsx src/context/Auth/AuthContext.tsx src/context/Auth/types.ts` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 242 módulos. Se mantiene el warning no bloqueante del chunk JS mayor a 500 kB.
- `npm run lint` (2026-09-03): FAIL por 11 errores y un warning preexistentes en módulos no modificados (`creditosService`, `matriculaService`, `solicitudesService`, rutas de admisiones, mocks y vistas de solicitudes); el lint dirigido de esta actualización sí pasa.
- `git diff --check` (2026-09-03): PASS.
- Captura pendiente por limitación del entorno: no hay Chromium, Chrome ni Firefox instalado, y la vista protegida requiere sesión/backend institucional.

---

# Update 2026-09-03 — Encabezado descriptivo del detalle de solicitudes

## Estado actual y decisión
- La pantalla compartida `/solicitudes/:solicitudId` presenta ahora `Solicitud {id} — {tipoSolicitud}` en un único `h2`.
- Se eliminaron del encabezado el símbolo `#`, el campo técnico `tipoSolicitudCodigo` y el párrafo separado que repetía el nombre descriptivo. El resultado esperado para la solicitud 47 es **Solicitud 47 — RENOVACION CREDITO CONDONABLE**.
- El cambio no depende del rol: estudiantes, coordinación y administración reciben el mismo encabezado cuando sus permisos les permiten acceder a esta pantalla.

## Paths, contrato y salida esperada
- UI: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`.
- Ruta protegida compartida: `src/app/routes/solicitudesRoutes.tsx`.
- Fuente de datos sin cambios: `getSolicitudAcademicaById()` entrega `id`, `tipoSolicitud` y `tipoSolicitudCodigo`; el encabezado consume únicamente `id` y el nombre descriptivo `tipoSolicitud`.
- No se agregaron dependencias, variables de entorno, seeds, datasets, migraciones ni contratos HTTP.

## Retos y próximos pasos
1. Validar el texto con sesiones institucionales de cada rol autorizado y con nombres largos de tipos de solicitud.
2. Incorporar una prueba de componente cuando el repositorio disponga de Vitest/React Testing Library; actualmente no hay runner de tests configurado.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`. Reutilizar Node.js/npm y `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Las versiones exactas continúan documentadas en `README.md` y bloqueadas en `package-lock.json`.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 241 módulos y generaron `dist/assets/index-BLymDgBm.js` en 639 ms. Vite advirtió de forma no bloqueante que el chunk JS supera 500 kB.
- `git diff --check` (2026-09-03): PASS.
- Captura pendiente por limitación del entorno: no hay Chromium, Chrome ni Firefox instalado, y la ruta protegida requiere sesión/backend institucional.

---

# Update 2026-09-03 — Contrato real del listado y detalle de estudiantes

## Estado actual y decisión
- `src/modules/estudiantes/services/estudiantesMockService.ts` tipa y normaliza el payload observado de coordinación. Los correos y el número de documento llegan en el nivel superior, no dentro de `persona`; se mantienen fallbacks para tolerar el contrato anterior.
- La proyección conserva `persona.id`, `persona.idpId`, `estudiante.fechaEgreso`, `fechaIngreso` nullable y `cohorte` tanto string (`2026-1`) como numérica. El listado recibe así código, nombre, documento, correo, programa, estado y cohorte correctos.
- Una navegación desde el listado sigue pasando el estudiante en `location.state`. Al recargar o entrar directamente a `/coordinacion/estudiantes/:estudianteId`, `getEstudianteById` ya no consulta `estudiantes.mock.ts`: ejecuta `GET /sapp/estudiantes/consulta?estudianteId={id}` y selecciona el registro por `estudiante.id`.
- El encabezado del detalle muestra por separado correo institucional y correo personal, además de los datos académicos ya existentes. No se agregaron paquetes, seeds ni datasets.

## Contrato y salida esperada
- Entrada: `{ correoInstitucional, correoPersonal, nombreCompleto, numeroDocumento, persona: { id, idpId }, estudiante: { id, idAspirante, codigoEstudianteUis, cohorte, estado, fechaIngreso, fechaEgreso }, programaId, programaCodigoNombre }` dentro de `ApiResponse.data[]`.
- Listado: una respuesta con `numeroDocumento: "1005324324"`, `correoInstitucional: "ana2248061test@uis.edu.co"` y `cohorte: "2026-1"` debe mostrar esos valores, sin reemplazarlos por `N/A`, correo ausente o `Sin cohorte`.
- Detalle: el mismo registro debe mostrar ambos correos, documento, programa, cohorte, estado y fechas; un valor de fecha `null` se representa como `—`.
- Paths principales: `src/modules/estudiantes/services/estudiantesMockService.ts`, `src/modules/estudiantes/types.ts`, `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`; fixture actualizado en `src/modules/estudiantes/mock/estudiantes.mock.ts`.

## Retos y próximos pasos
1. Confirmar con backend autenticado que el filtro `estudianteId` del endpoint de consulta está habilitado y devuelve una lista, incluso con un único resultado. Si el backend define un endpoint dedicado, cambiar solo `getEstudianteById` y reutilizar el mapper existente.
2. Validar visualmente listado, navegación y recarga directa con el payload real. No hay navegador/sesión institucional disponibles en este contenedor.
3. Incorporar pruebas del mapper cuando el repositorio agregue Vitest; hoy no existe runner de tests unitarios.

## Entorno
- Raíz única `/workspace/SAPP-frontend`; usar npm y reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0. No se modificaron dependencias.
- `npx eslint src/modules/estudiantes/services/estudiantesMockService.ts src/modules/estudiantes/types.ts src/modules/estudiantes/mock/estudiantes.mock.ts src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 241 módulos y generaron `dist/assets/index-8f10ieLX.js` en 665 ms. Vite advirtió que el chunk JS supera 500 kB.
- `git diff --check` (2026-09-03): PASS.

---

# Update 2026-09-03 — Orden de descarga de fotos de estudiantes

## Estado actual y decisión
- En `/coordinacion/estudiantes`, la respuesta de estudiantes se ordena por `cohorte` descendente y luego por `nombreCompleto` antes de guardarse en estado y antes de construir la cola de fotos. La descarga progresiva queda así programada en el mismo orden por semestre que el listado visible.
- Se conserva el máximo de cuatro tareas concurrentes. Cada tarea consulta primero `getInscripcionByAspirante(idAspirante)` y después la foto `ANX-4`; un error individual mantiene el placeholder y no detiene las demás descargas.
- El filtro visible reutiliza exactamente el mismo comparador, evitando que el orden de presentación y el de la cola diverjan. No se modificaron estilos, contratos, dependencias, seeds ni datasets.

## Paths, contratos y salida esperada
- Implementación: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`.
- Estudiantes: `GET ${VITE_API_URL || '/api/sapp'}/sapp/estudiantes/consulta?programaId={id}&egresados=false`; `data[].estudiante.cohorte` determina el semestre y `idAspirante` permite resolver la inscripción.
- Foto: inscripción por aspirante y luego documento con `codigoTipoTramite: 1002`, `codigoTipoDocumentoTramite: 'ANX-4'` y `tramiteId: inscripcion.id`.
- Salida esperada: para cohortes `20262`, `20261` y `20252`, las tarjetas y la programación de sus fotos comienzan en ese orden; dentro de una misma cohorte se usa el nombre ascendente.

## Retos y próximos pasos
1. Validar mediante la pestaña Network y un backend autenticado que las primeras solicitudes pertenecen a los primeros estudiantes del listado; la concurrencia permite que las respuestas finalicen en distinto orden.
2. Agregar una prueba del comparador y de la cola cuando el repositorio incorpore Vitest. Actualmente no hay runner de tests.
3. Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; este proyecto usa npm, no venv, conda ni poetry, y no debe crearse otro entorno.

## Entorno y pruebas de esta actualización
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0; plugin React SWC 4.2.2.
- `npx eslint src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 242 módulos y generaron `dist/assets/index-DAWMGqcG.css` e `index-BNa1qg7t.js` en 859 ms. Vite advirtió que el chunk JS supera 500 kB.
- `git diff --check` (2026-09-03): PASS.

---

# Update 2026-09-03 — Estado real y estilos de documentos de matrícula

## Estado actual y decisiones
- En el detalle de coordinación `/matricula/:matriculaId`, **Estado** ya no se calcula únicamente desde `documentoCargado`. Se muestra el valor normalizado de `documentoUploadedResponse.estadoDocumento` (por ejemplo `APROBADO` o `RECHAZADO`), con fallback `EN_REVISION` si hay archivo sin estado y `PENDIENTE` si no está cargado.
- La columna documental **Validación** fue reemplazada por **Fecha de revisión** y muestra `documentoUploadedResponse.fechaRevisionDocumento`. Los controles de aprobar/rechazar permanecen operativos, pero ahora están agrupados en **Acciones** con **Ver/Descargar**; en matrículas `FINALIZADA` siguen ocultos según la decisión anterior.
- La vista del estudiante también mapea su columna **Fecha de revisión** desde `fechaRevisionDocumento`, corrigiendo el uso previo de `fechaCargaDocumento`.
- El listado de coordinación se alineó visualmente con el estudiantil: contenedor con borde y sombra suave, filas separadas, badges semánticos, botones pill y etiquetas de columna en la versión móvil. Los estilos consumen tokens globales y contemplan temas claro/oscuro.

## Paths y contrato esperado
- Coordinación: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx` y su CSS hermano.
- Estudiante: mapper en `src/pages/Matricula/MatriculaPage.tsx`; tabla compartida en `src/modules/matricula/components/DocumentosRequeridosTable`.
- Entrada: `GET /sapp/document?codigoTipoTramite={codigoMatricula}&tramiteId={matriculaId}` → `{ message, data: DocumentoTramiteItemDto[] }`. Para un documento cargado se esperan `documentoUploadedResponse.estadoDocumento` y `fechaRevisionDocumento`; el caso reportado para matrícula `183` contiene `estadoDocumento: "APROBADO"` y `fechaRevisionDocumento: "2026-09-02 11:19:12"`.
- Salida esperada: esa fila presenta badge `APROBADO` y la fecha de revisión formateada, no el texto genérico `Cargado`. Un documento todavía no revisado presenta `EN_REVISION` y fecha `—`.

## Retos y próximos pasos
1. Validar `/matricula/183` con una sesión real `COORDINADOR` y comparar estados/fechas con la respuesta de red.
2. Validar visualmente las dos vistas en claro, oscuro y ancho móvil. El contenedor actual no incluye navegador ni la sesión institucional, por lo que no se generó captura.
3. Agregar pruebas de componente cuando se incorpore Vitest/Testing Library; actualmente el repositorio no tiene runner de tests ni seeds/datasets.

## Entorno y pruebas de esta actualización
- Usar exclusivamente `/workspace/SAPP-frontend` con npm y el `node_modules` existente; no crear venv, conda, poetry, entornos Python ni un segundo árbol de dependencias.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0. No se agregaron paquetes.
- `npx eslint src/modules/documentos/api/types.ts src/pages/Matricula/MatriculaPage.tsx src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 242 módulos y generaron `dist/assets/index-DAWMGqcG.css` e `index-CcNiQirt.js` en 871 ms. Vite advirtió que el chunk JS supera 500 kB.
- `git diff --check` (2026-09-03): PASS.

---

# Update 2026-09-02 — Detalle de matrícula finalizada y nombre de archivo

## Estado actual y decisión
- En `/matricula/:matriculaId`, una matrícula cuyo estado normalizado es `FINALIZADA` ya no presenta botones **Aprobar/Rechazar** en documentos ni asignaturas, ni el botón para guardar la validación de asignaturas. Las acciones de consulta **Ver/Descargar** se conservan.
- Cada documento cargado muestra `documentoUploadedResponse.nombreArchivoDocumento` bajo su tipo documental. El mismo valor continúa usándose para abrir y descargar; solo se recurre a `documento_{tipo}.pdf` si el API no entrega nombre.

## Paths, contrato y salida esperada
- Implementación: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx`.
- Entrada relevante del checklist: `documentoCargado: true` y `documentoUploadedResponse.nombreArchivoDocumento`, por ejemplo `0002_20260902_Pago_Liquidacion_Matricula_2026-2.pdf`.
- Salida esperada: el nombre se ve en la columna **Documento** y una matrícula finalizada queda en modo de consulta, sin controles que sugieran nuevas decisiones.

## Retos, próximos pasos y entorno
1. Verificar el resultado con la matrícula institucional `183` y los roles `COORDINADOR`/`ADMIN`; la ruta requiere sesión y backend reales.
2. No crear entornos adicionales: reutilizar `/workspace/SAPP-frontend/node_modules`; este frontend usa npm, no venv, conda ni poetry. No se agregaron paquetes, seeds o datasets.
- `npx eslint src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx` (2026-09-02): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run lint` (2026-09-02): FAIL por 11 errores y 1 warning preexistentes fuera de esta pantalla (principalmente `no-explicit-any`, `set-state-in-effect` y utilidades mock con parámetros sin uso); el archivo modificado sí supera ESLint aislado.
- `npm run build` (2026-09-02): PASS; 242 módulos transformados, assets `index-wdrRG1Ts.css` e `index-DuoItnsL.js`, 744 ms. Vite advirtió que el chunk JS supera 500 kB.
- `git diff --check` (2026-09-02): PASS.
- Screenshot pendiente: no se dispone de la sesión institucional necesaria para abrir `/matricula/183` con sus datos reales.

---

# Update 2026-09-02 — Aprobación automática de documentos de matrícula

## Estado actual y decisión
- En `/matricula/:matriculaId`, para `COORDINADOR`/`ADMIN`, ya no existe el botón manual **Aprobar documentos**.
- Después de aprobar individualmente el último documento obligatorio, la recarga del checklist hace que la pantalla ejecute automáticamente `aprobarMatriculaAcademica(matricula.id)`. El mismo comportamiento se aplica al abrir una matrícula pendiente cuyos documentos obligatorios ya estaban aprobados.
- La transición automática exige al menos un documento obligatorio y que todos estén cargados en estado `APROBADO`. Un `ref` por matrícula evita duplicar el `PUT` por renderizados o por React Strict Mode; durante la transición se bloquean las validaciones documentales concurrentes.
- Si el `PUT` automático falla, se muestra el error normalizado y no se reintenta en bucle dentro del mismo montaje. Recargar la pantalla permite un nuevo intento.

## Paths, contrato y salida esperada
- Lógica y UI: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx`.
- Checklist: `GET /sapp/document?codigoTipoTramite={codigoMatricula}&tramiteId={matriculaId}` mediante `getDocumentosMatriculaAcademica`; el cliente HTTP antepone/normaliza la base configurada.
- Aprobación documental individual: `PUT /sapp/document` mediante `aprobarRechazarDocumento`, con `{ documentoId, aprobado: true, observaciones: null }`.
- Transición automática: `PUT /sapp/matriculaAcademica/{matriculaId}`, envelope esperado `{ ok, message, data }`.
- Salida: al aprobar el último obligatorio se ejecuta una sola transición, se refrescan matrícula/documentos y aparece el mensaje `Todos los documentos obligatorios fueron aprobados. La matrícula avanzó correctamente.`

## Retos y próximos pasos
1. Validar con backend y sesión institucional que la transición cambie el estado de la matrícula (normalmente a `RADICADA`) y que sea idempotente ante una matrícula que ya tenga todos sus soportes aprobados.
2. Confirmar con dominio si documentos opcionales cargados deben aprobarse también antes de avanzar; el criterio conserva la regla anterior del botón: únicamente todos los **obligatorios**.
3. Agregar una prueba de componente para último documento, carga inicial ya aprobada, lista sin obligatorios, error del POST y protección contra solicitudes duplicadas cuando se incorpore Vitest.

## Entorno y pruebas de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entorno Python ni otro árbol npm.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. No se agregaron paquetes, seeds ni datasets.
- `npx eslint src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx` (2026-09-02): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-02): PASS; 242 módulos transformados, assets `index-wdrRG1Ts.css` e `index-DjkTXSLa.js`, 726 ms. Vite advirtió que el chunk JS supera 500 kB.
- `git diff --check` (2026-09-02): PASS.
- Screenshot pendiente por limitación de entorno: no hay Chromium, Chrome, Firefox, Playwright ni Puppeteer instalados, y la ruta necesita sesión/backend institucional.

---

# Update 2026-09-02 — Perfil contextual y firma

## Estado actual
- El avatar de todos los encabezados `ModuleLayout` es un enlace accesible a la ruta protegida `/perfil`.
- El contrato real de login ya está tipado para `estudiante.codigoEstudianteUis`, `cohorte`, `estado`, `fechaIngreso`, `idAspirante`, `programaCodigoNombre` y `programaId`. El perfil usa esos campos y completa correo personal, teléfono y código desde `attributes` cuando la proyección de persona/estudiante no los trae.
- `PerfilPage` muestra identidad de la sesión y bloques condicionales: coordinación (`COORDINADOR`/`ADMIN`) ve programa, unidad, estado y último ingreso; estudiante (rol `ESTUDIANTE` o DTO `estudiante`) ve código, programa, cohorte y estado. Los valores ausentes se rotulan como pendientes/provisionales.
- Se puede elegir una firma PNG/JPG de hasta 2 MB, verla antes de guardar y pulsar **Actualizar firma**. El mock persiste por usuario en `localStorage` bajo `SAPP_FIRMA_PERFIL:{userId}`.

## Paths, contratos y salida esperada
- Ruta/export: `src/app/routes/index.tsx`, `src/pages/index.ts`.
- Página/estilos: `src/pages/Perfil/PerfilPage.tsx`, `src/pages/Perfil/PerfilPage.css`.
- Persistencia sustituible: `src/modules/perfil/services/firmaPerfilService.ts`; contrato `{ nombreArchivo, mimeType, contenidoBase64 }`.
- Acceso: `src/components/ModuleLayout/ModuleLayout.tsx` y `.css`.
- Al seleccionar el avatar se abre `/perfil`; solo aparecen bloques relevantes para el rol y una firma se persiste únicamente después de pulsar el botón.

## Retos y próximos pasos
1. Definir endpoints autenticados `GET/PUT /api/v1/perfil/firma` (o contrato documental equivalente) y reemplazar el mock local.
2. Confirmar con un login de coordinación si su proyección incluye un programa específico y fecha de último ingreso; los campos del estudiante ya coinciden con el contrato real suministrado.
3. Agregar Vitest/React Testing Library para roles, formato/tamaño, previsualización y persistencia; validar visualmente con sesiones reales.
4. La firma local no es una firma digital ni almacenamiento definitivo; no usarla como evidencia de autenticidad.

## Entorno y resultados recientes
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entorno Python ni otro árbol npm.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npm run build` (2026-09-02, ajuste al contrato real de login): PASS; 237 módulos, assets `index-ZvyW5o5r.css` y `index-C6wN6vlE.js`, 979 ms.
- `npx eslint src/api/authTypes.ts src/pages/Perfil/PerfilPage.tsx` (2026-09-02): PASS; solo warning npm conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-09-02): PASS. La validación visual requiere un navegador y sesiones reales del gateway.

---

# Update 2026-09-02 — Previsualización y carga de múltiples documentos generados

## Estado actual y decisión
- `previsualizarSolicitudCredito` retorna siempre `PreviewSolicitudCreditoResponseDto[]`: conserva toda la colección de `data` y normaliza el contrato legado de objeto único a una lista.
- `SolicitudEstudianteForm` convierte en PDF todos los documentos HTML en paralelo y conserva los PDF que ya entrega el backend. Si hay más de uno, muestra botones selectores sobre un único `iframe`; el documento activo cambia sin abrir ventanas o visores adicionales.
- **Cargar todos los documentos generados** busca para cada resultado un requisito del listado. Hay coincidencia cuando `tipoDocumentoId === requisito.id` **o** cuando `tipoDocumentoCodigo` coincide con `requisito.codigo` sin distinguir mayúsculas/tildes. Esto cubre explícitamente `{ tipoDocumentoId: 18, tipoDocumentoCodigo: "ANX-17" }` y también los otros documentos de la respuesta.
- Todos los resultados coincidentes se convierten en `File` PDF y se asignan en una sola acción. Si la coincidencia es parcial, se cargan los encontrados y se informa cuántos faltaron; si no coincide ninguno, se muestra error y no se modifica el listado.

## Paths, contrato y salida esperada
- Transporte: `src/modules/solicitudes/api/solicitudesAcademicasService.ts`; DTO: `src/modules/solicitudes/api/types.ts`.
- Estado, conversión, selector y asociación: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`; estilos: archivo CSS hermano.
- El código del requisito se conserva desde `TramiteDocumentoDto.codigo` en `SolicitudDocumentoDraft.codigo` (`src/modules/solicitudes/types.ts`).
- Response: `{ ok, message, data: [{ tipoDocumentoId, tipoDocumentoCodigo, tipoDocumentoNombre, plantillaSigla, base64DocumentoContenido, mimeTypeDocumentoContenido }, ...] }`.
- Salida esperada: una pestaña por documento, un `iframe` PDF visible y un archivo `application/pdf` adjunto en cada card coincidente. El nombre se deriva del código o nombre documental (por ejemplo, `ANX-17` produce `anx-17.pdf`).

## Retos y próximos pasos
1. Validar con backend autenticado que los `codigo` de `GET /sapp/tramite/document?tipoTramiteId=...` sean exactamente `ANX-17`, `ANX-23`, etc.; el ID permite continuar aunque el código difiera.
2. Agregar una prueba de navegador cuando exista runner DOM/canvas. No hay Vitest ni dataset/seed en este repositorio.
3. Confirmar si backend puede duplicar un mismo tipo documental; actualmente cada resultado se asocia al primer requisito coincidente y el último resultado del mismo requisito prevalecería.

## Entorno y pruebas de esta actualización
- Raíz única `/workspace/SAPP-frontend`; usar el `node_modules` existente. No crear venv, conda, poetry ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2. No se agregaron paquetes.
- `npm run build`: PASS, 233 módulos, salida `index-Zgfrlk6K.js`, 818 ms.
- `npm run lint`: FAIL por 11 errores preexistentes y un warning fuera de los archivos modificados (entre otros, `no-explicit-any`, `set-state-in-effect` y tipos vacíos en `src/modules/solicitudes/types.ts`). Ejecutar ESLint dirigido a los archivos modificados para distinguir regresiones.
- `git diff --check`: no se alcanzó en la cadena `build && lint && git diff --check` debido al fallo conocido de lint global; debe ejecutarse por separado antes del commit.
- La captura visual queda pendiente: el flujo requiere la sesión y la respuesta del backend institucional y el contenedor no ofrece automatización de navegador configurada.

---

# Update 2026-09-02 — Previsualización HTML convertida a PDF en solicitudes

## Estado actual y decisión
- El backend `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` entrega una colección de documentos; esta sección describe la conversión HTML original. La actualización superior reemplaza la selección histórica del primer elemento por el manejo de toda la colección.
- `SolicitudEstudianteForm` decodifica la respuesta. Cuando el MIME contiene `html`, llama a `htmlToPdf`; si ya es otro MIME (incluido PDF), conserva el Blob recibido. El resultado siempre se previsualiza mediante una URL Blob y **Cargar archivo de solicitud** crea `carta-solicitud-credito-condonable.pdf` desde ese mismo Blob PDF.
- `htmlToPdf` carga el HTML en un `iframe` sandbox sin permiso para scripts, espera fuentes e imágenes, serializa/renderiza el documento, lo pagina en tamaño Letter y construye un PDF rasterizado JPEG sin librerías externas. Las URLs temporales son revocadas por el ciclo de vida del formulario.
- Corrección definitiva: las firmas del backend pueden llegar como base64 crudo en `src` (un JPEG comienza por `/9j/`). Insertar primero ese HTML en el `iframe` hacía que el navegador solicitara `https://sapp.eisi.online/9j/...` antes de que la corrección posterior alcanzara a ejecutarse, produciendo HTTP 414 y contaminando el canvas. Ahora el HTML pasa primero por `DOMParser`, todavía inerte: allí se convierten JPEG/PNG/GIF/WebP crudos a data URI y se eliminan scripts y todos los recursos externos —incluidos URLs CSS—. Solo después se asigna el HTML preparado a `srcdoc`; la conversión no hace `fetch` ni permite solicitudes remotas.

## Paths, contrato y salida esperada
- Conversor: `src/modules/solicitudes/utils/htmlToPdf.ts`.
- Integración de previsualización/carga: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`.
- Transporte y normalización de la lista: `src/modules/solicitudes/api/solicitudesAcademicasService.ts`; tipos: `src/modules/solicitudes/api/types.ts`.
- Request: `POST ${VITE_API_URL || '/api/sapp'}/sapp/solicitudesAcademicas/pdf-previsualizacion`. Response vigente: `{ ok, message, data: [{ tipoDocumentoId, tipoDocumentoCodigo, tipoDocumentoNombre, plantillaSigla, base64DocumentoContenido, mimeTypeDocumentoContenido }] }`.
- Salida esperada: el `iframe` visible muestra `application/pdf`; al cargar, el requisito **Carta solicitud crédito condonable** recibe un `File` llamado `carta-solicitud-credito-condonable.pdf`, MIME `application/pdf`, cuyos bytes comienzan con `%PDF-1.4`.

## Retos y próximos pasos
1. Validar visualmente con la respuesta real, especialmente saltos de página, firmas base64 y plantillas mayores a una hoja. El PDF es rasterizado: prioriza fidelidad visual, no selección de texto.
2. El HTML suministrado contiene placeholders de firma como `{{firma_director_tg}}`; deben ser resueltos por backend antes de generar la respuesta si se espera que aparezcan en el documento.
3. Confirmar que el ID/código del requisito de carta se mantiene estable; la carga actualmente lo localiza por `id === 18` o por nombre normalizado, lógica preexistente.
4. No se incorporó runner Vitest ni datasets/seeds. Conviene agregar una prueba de navegador del encabezado PDF y del archivo cargado cuando exista infraestructura DOM/canvas real.

## Entorno y pruebas de esta actualización
- Raíz única: `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2. No se agregaron paquetes.
- `npm run build` (2026-09-02, saneamiento previo): PASS; TypeScript y rolldown-vite transformaron 233 módulos y generaron `dist/assets/index-CA-fxli-.js` en 951 ms.
- `npx eslint src/modules/solicitudes/utils/htmlToPdf.ts` (2026-09-02, saneamiento previo): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- Actualización de rama solicitada: se ejecutó `git fetch --all --prune`, pero este checkout no tiene remotos configurados ni referencias `main`/`origin/main`; el único ref local disponible es `work`. El commit de la entrega anterior ya es el padre directo de esta corrección. En un checkout conectado, rebasar esta rama sobre `origin/main` antes de integrarla.
- Validación visual pendiente: este contenedor no incluye navegador y el flujo requiere sesión/backend institucional. Los intentos de instalar `html2pdf.js`/`html2canvas` fueron bloqueados por el registry con HTTP 403, por lo que se implementó el conversor sin dependencias.

---

# Update 2026-08-28 — Ajustes del listado y archivos de actas

## Corrección — Consulta del archivo por ID del acta
- **Ver** y **Descargar** ahora ejecutan `GET ${VITE_API_URL || '/api/sapp'}/actas/{actaId}` con `ActaDto.id`. No deben usar `documentoContenidoId` ni el endpoint genérico `/document/{id}`.
- El transporte quedó encapsulado en `getDocumentoActa` (`src/modules/actas/api.ts`); la pantalla solo entrega `acta.id`. El contrato esperado conserva `{ ok, message, data: { contenidoBase64, mimeType, nombreArchivo, ... } }`.
- No se agregaron dependencias, seeds, datasets ni variables de entorno. La validación integrada con un backend autenticado continúa pendiente.
- Pruebas de esta corrección: `npx eslint src/modules/actas/api.ts src/pages/Actas/ActasPage.tsx src/modules/actas/types.ts` PASS; `npm run build` PASS (232 módulos, assets `index-CvPyPw3E.css` e `index-BVSvXJki.js`, 1.19 s); `git diff --check` PASS. npm solo mostró el warning de entorno ya conocido `Unknown env config "http-proxy"`.

## Actualización — Eliminación de actas
- Cada fila de `/actas` incluye el botón destructivo **Eliminar**. Su confirmación nativa identifica el acta por `nombre` y `codigo` y advierte que la acción no puede deshacerse.
- Al confirmar se ejecuta `DELETE ${VITE_API_URL || '/api/sapp'}/actas/{id}`. El cliente admite la respuesta `204 No Content`; tras el éxito elimina el DTO del estado local, reajusta automáticamente la paginación existente y muestra `El acta {codigo} fue eliminada correctamente.` durante 5 segundos.
- Mientras se elimina un acta se deshabilitan las acciones de archivo y eliminación del listado para evitar operaciones concurrentes. Si el backend rechaza la solicitud, el registro se conserva y se muestra el mensaje normalizado por el cliente HTTP.
- Paths: transporte en `src/modules/actas/api.ts`; estado, confirmación y UI en `src/pages/Actas/ActasPage.tsx`; estilo destructivo basado en `--danger` en `src/pages/Actas/ActasPage.css`. No se agregaron dependencias, seeds, datasets ni variables de entorno.
- Pendiente para validación integrada: confirmar con backend real la autorización de `COORDINADOR`/`ADMIN`, la eliminación coherente del documento asociado y el status/body exacto del endpoint.
- Pruebas de esta actualización: `npx eslint src/modules/actas/api.ts src/pages/Actas/ActasPage.tsx` PASS; `npm run build` PASS (232 módulos, assets `index-CvPyPw3E.css` e `index-Cc8iae3n.js`, 699 ms); `git diff --check` PASS. No se tomó screenshot porque el contenedor no tiene Chromium, Chrome, Firefox, Playwright ni Puppeteer y la ruta necesita backend/sesión institucional.

## Estado actual y decisiones
- `/actas` ordena el listado por `nombre` ascendente (comparación española, natural e insensible a mayúsculas/tildes), luego por el año descendente extraído del sufijo `-YYYY` de `codigo` y finalmente por código. La paginación local se mantiene en 10 filas.
- Tanto las opciones del filtro **Año** como su evaluación usan el año del código/nombre institucional (`ACT-{consecutivo}-{año}`), nunca el año de `fechaCreacion`. La fecha de creación sigue visible en una columna separada.
- Se eliminó el texto de conteo “N actas encontradas”. La confirmación `El acta ... fue creada correctamente.` permanece accesible con `role=status` y se limpia automáticamente a los 5 segundos.
- Cada fila muestra botones pill **Ver** y **Descargar**, compatibles con tokens claro/oscuro. Al accionarlos, se consulta el documento por el `id` del acta mediante `/actas/{actaId}`; se abre un Blob en una pestaña o se descarga con el nombre del backend y fallback `{codigo}.pdf`. Mientras una acción está en curso se bloquean las demás y se muestra su estado.

## Paths, contratos y salida esperada
- Pantalla y lógica: `src/pages/Actas/ActasPage.tsx`; estilos: `src/pages/Actas/ActasPage.css`.
- Listado: `GET ${VITE_API_URL || '/api/sapp'}/actas` → `{ ok, message, data: ActaDto[] }`; cada DTO debe incluir `codigo`, `fechaCreacion` y `documentoContenidoId`.
- Archivo: `GET ${VITE_API_URL || '/api/sapp'}/actas/{actaId}` → `{ ok, message, data: { contenidoBase64, mimeType, nombreArchivo, ... } }`; `{actaId}` corresponde a `ActaDto.id`, no a `documentoContenidoId`.
- Salida esperada: un acta `ACT-001-2024` creada en 2026 aparece bajo el filtro **2024**, no **2026**; nombres iguales muestran primero el año más reciente; al crear se muestra la confirmación durante 5 segundos; **Ver** abre el PDF y **Descargar** lo guarda.

## Retos y próximos pasos
1. Validar con backend real el shape y nombre de archivo retornados por `GET /actas/{actaId}` para las acciones **Ver** y **Descargar**.
2. Probar con más de 10 actas, nombres repetidos y una fecha de creación cuyo año difiera del sufijo del código.
3. Validar visualmente en modos claro/oscuro y móvil con sesión `COORDINADOR` o `ADMIN`. No hay runner Vitest, datasets ni seeds nuevos.

## Entorno y pruebas recientes
- Raíz única `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- Reutilizar `node_modules` de la raíz. No crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- `npx eslint src/pages/Actas/ActasPage.tsx src/modules/actas/api.ts src/modules/actas/types.ts` (2026-08-28): PASS; solo apareció el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 232 módulos y generaron `dist/assets/index-DXwu2Mkt.css` y `dist/assets/index-BEx_EwDv.js` en 497 ms.
- `git diff --check` (2026-08-28): PASS. Screenshot pendiente porque el contenedor no dispone de navegador y la ruta requiere backend/sesión institucional.

---

# Update 2026-08-28 — Módulo de listado y carga de actas

## Estado actual y decisiones
- Existe una nueva ruta `/actas`, visible y autorizada exclusivamente para `COORDINADOR` (`ROLES.COORDINACION`) y `ADMIN`. La protección se aplica tanto en `AppRoutes` como en el ítem del sidebar.
- La pantalla lista actas ordenadas por fecha/ID descendente, permite filtro local por nombre o código, filtro por año y paginación de 10 filas. Expone estados de carga, vacío, error y confirmación.
- **Cargar acta** abre un formulario para nombre, segmento de código, año, observaciones y PDF. El código final se genera como `ACT-{segmento}-{año}`; `fechaCreacion` se calcula al enviar usando `America/Bogota`.
- El navegador convierte el archivo a base64 sin el prefijo data URI, informa MIME/tamaño y calcula SHA-256 hexadecimal mediante Web Crypto. Se restringe la selección a PDF y 15 MB para evitar cargas accidentales excesivas.

## Paths, contratos y salida esperada
- Pantalla/estilos: `src/pages/Actas/ActasPage.tsx` y `src/pages/Actas/ActasPage.css`.
- Transporte/tipos: `src/modules/actas/api.ts` y `src/modules/actas/types.ts`.
- Ruteo/export: `src/app/routes/index.tsx`, `src/pages/index.ts`; navegación: `src/components/Sidebar/Sidebar.tsx`.
- Listado: `GET ${VITE_API_URL || '/api/sapp'}/actas` → `{ ok, message, data: ActaDto[] }`.
- Creación: `POST ${VITE_API_URL || '/api/sapp'}/actas` con `{ nombre, codigo, fechaCreacion, observaciones, contenidoBase64, mimeType, tamanoBytes, checksum }`. El servicio tolera por ahora una respuesta creada directa o dentro de `{ ok, message, data }`, porque no se suministró el shape de respuesta del POST.
- Salida esperada: al crear correctamente, el formulario se limpia/cierra, aparece confirmación y el listado se consulta nuevamente. No hay descarga porque no se proporcionó endpoint para obtener `documentoContenidoId`.

## Retos y próximos pasos
1. Validar con backend real el envelope exacto del POST y confirmar si checksum debe ser SHA-256 hexadecimal; retirar la compatibilidad dual cuando el contrato sea definitivo.
2. Confirmar el límite funcional de archivo (la UI adoptó 15 MB) y si el campo `nombre` debe ser texto libre o un catálogo suministrado por backend.
3. Solicitar el endpoint de descarga/visualización para hacer accionable `documentoContenidoId`; el GET actual solo entrega metadatos.
4. Agregar pruebas de componente/servicio cuando se incorpore Vitest. No hay seeds, datasets, migraciones ni dependencias nuevas.

## Entorno y pruebas recientes
- Raíz única `/workspace/SAPP-frontend`; Node.js 24.15.0 y npm 11.4.2. Reutilizar el `node_modules` existente; no crear venv, conda, poetry ni otro árbol de dependencias.
- Dependencias principales instaladas: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npm run build` (2026-08-28): PASS; 232 módulos transformados, build completado en 480 ms.
- `npx eslint src/modules/actas src/pages/Actas src/app/routes/index.tsx src/components/Sidebar/Sidebar.tsx src/pages/index.ts` (2026-08-28): PASS; solo se mostró el warning conocido de npm `Unknown env config "http-proxy"`.
- `npm run lint` (2026-08-28): FAIL por 11 errores y 1 warning históricos fuera del módulo de actas (`no-explicit-any`, estados síncronos en effects, mocks/parámetros sin uso, interfaces vacías y dependencia de hook). El lint focalizado de los archivos modificados sí pasa.
- Validación HTTP y screenshot pendientes: el módulo requiere backend/sesión institucional y el contenedor no dispone de navegador automatizable.

---

# Update 2026-08-28 — Creación de estudiante condicionada por `idPersona`

## Estado actual y decisión
- En la sección **Crear estudiantes admitidos** del detalle de una convocatoria cerrada, cada fila consulta el `idPersona` que ya viene en la inscripción cargada.
- Si `idPersona` es un número, el botón aparece deshabilitado con el texto **Estudiante creado**. Solo una inscripción con `idPersona` ausente o `null` puede abrir el formulario **Crear estudiante**.
- La colección local `createdAspiranteIds` sigue bloqueando inmediatamente una segunda creación dentro de la sesión actual. Al recargar, `idPersona` entregado por backend pasa a ser la fuente persistente.

## Paths, contrato y salida esperada
- Contrato: `src/modules/admisiones/api/types.ts`, donde `InscripcionAdmisionDto.idPersona` es opcional y acepta `number | null` para tolerar registros antiguos.
- Gating de UI: `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`.
- Entrada: `GET ${VITE_API_URL || '/api/sapp'}/inscripcionAdmision/convocatoria/{convocatoriaId}`, envelope `{ ok, message, data: InscripcionAdmisionDto[] }`.
- Salida esperada: un admitido con `idPersona: 87` no puede volver a crearse; un admitido con `idPersona: null` o sin el campo mantiene disponible la acción, siempre que se cumplan los demás permisos y condiciones de convocatoria.
- No se agregaron dependencias, schemas de base de datos, datasets, seeds ni artefactos generados.

## Retos y próximos pasos
1. Validar con backend real que toda creación exitosa haga que la siguiente consulta por convocatoria devuelva `idPersona` para esa inscripción.
2. El backend debe conservar la restricción de unicidad y rechazar duplicados: el bloqueo frontend evita acciones accidentales, pero no sustituye la regla de dominio ante concurrencia o clientes alternos.
3. Agregar una prueba de componente cuando se incorpore Vitest, cubriendo `idPersona` numérico, `null`, ausente y el bloqueo inmediato posterior al POST.

## Entorno y pruebas de esta actualización
- Raíz única: `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npx eslint src/modules/admisiones/api/types.ts src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx` (2026-08-28): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 228 módulos y generaron `dist/assets/index-DDldkzx9.js` en 727 ms.
- `git diff --check` (2026-08-28): PASS.
- Screenshot automatizado pendiente: la validación requiere navegador, sesión institucional y respuesta backend de una convocatoria cerrada con ambos casos de `idPersona`.

---

# Update 2026-08-28 — Orden por período y filtros de estudiantes

## Estado actual y decisión
- `/coordinacion/estudiantes` presenta las tarjetas ordenadas por `cohorte` (período) de forma descendente y desempata alfabéticamente por `nombreCompleto`.
- Sobre los datos cargados se pueden combinar tres filtros locales: período exacto, coincidencia parcial de nombre y coincidencia parcial de código UIS. Nombre y código se normalizan para ignorar tildes y diferencias de mayúsculas/minúsculas.
- La UI informa cuántos estudiantes coinciden, ofrece **Limpiar filtros**, muestra un estado vacío específico cuando no hay coincidencias y reinicia los filtros al cambiar de programa. No se agregaron endpoints, dependencias, seeds ni datasets.

## Paths, contrato y salida esperada
- Lógica y controles: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`.
- Estilos responsive y compatibles con tokens claro/oscuro: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.css`.
- Entrada vigente: `GET ${VITE_API_URL || '/api/sapp'}/estudiantes/consulta?programaId={id}&egresados=false`, envelope `{ ok, message, data: EstudianteConsultaBackend[] }`. El período mostrado/filtrado proviene de `data[].estudiante.cohorte`, convertido a texto por el mapper existente.
- Salida esperada: sin filtros, períodos recientes primero; los tres criterios se intersectan; el carrusel recibe únicamente coincidencias y conserva la navegación/caché de detalle existente.

## Retos y próximos pasos
1. Validar con datos reales si dominio prefiere llamar **Período** o **Cohorte** al campo backend `cohorte`, y confirmar que sus valores siempre tienen un formato ordenable numéricamente (por ejemplo, `20262`).
2. Para volúmenes que requieran paginación backend, mover filtros y orden al endpoint sin cambiar su semántica visible; actualmente operan sobre la colección completa retornada.
3. Validar visualmente en claro, oscuro y móvil con sesión institucional. No hay runner Vitest configurado; sería útil extraer y probar normalización, intersección de filtros y orden.

## Entorno y pruebas de esta actualización
- Raíz única: `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- Reutilizar `node_modules` en la raíz. No crear venv, conda, poetry, entornos Python ni un segundo árbol de dependencias.
- `npx eslint src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx` (2026-08-28): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 228 módulos y generaron `dist/assets/index-BCkaXDBj.css` y `dist/assets/index-YJoqk_0Z.js` en 665 ms.
- `git diff --check` (2026-08-28): PASS.
- Screenshot automatizado pendiente: el contenedor no dispone de Chromium, Chrome ni Firefox, y la ruta requiere backend y sesión institucional para mostrar datos reales.

---

# Update 2026-08-28 — Caché efímera listado → detalle → listado de estudiantes

## Estado actual y decisión
- `/coordinacion/estudiantes` consume, al montarse, un snapshot en memoria si la navegación inmediatamente anterior fue la apertura del detalle de un estudiante. El snapshot restaura programas, selector de maestría/doctorado, estudiantes y `fotoUrl` ya cargadas sin repetir solicitudes HTTP.
- La caché se crea exclusivamente en `onStudentClick`, justo antes de navegar a `/coordinacion/estudiantes/:estudianteId`. Al volver se consume y borra de inmediato; el estado React de la pantalla conserva los datos mientras el listado siga montado.
- Al salir del detalle hacia una ruta distinta de `/coordinacion/estudiantes`, el cleanup aplazado comprueba el nuevo `window.location.pathname` y elimina el snapshot. Una recarga completa también lo descarta porque no se persiste fuera de memoria.
- Se retiró el `Map` indefinido de estudiantes del servicio. El detalle abierto desde el listado sigue recibiendo el estudiante mediante `location.state`; una URL directa conserva únicamente el fallback mock preexistente.

## Paths, contrato y salida esperada
- Caché efímera: `src/modules/estudiantes/services/estudiantesListCache.ts`.
- Productor/consumidor del snapshot: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`.
- Limpieza al abandonar el detalle: `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`.
- Servicio sin caché permanente: `src/modules/estudiantes/services/estudiantesMockService.ts`.
- Contrato interno: `{ programas: ProgramaCoordinacion[], programTypeSeleccionado: ProgramType, estudiantes: EstudianteCoordinacion[] }`. No hay cambios en los contratos HTTP existentes.
- Salida esperada: listado → detalle → **Volver al listado** restaura inmediatamente las tarjetas y fotos; listado → detalle → cualquier otro módulo descarta los datos y una futura entrada vuelve a consultar backend.

## Retos y próximos pasos
1. Validar el recorrido con sesión institucional y Network abierto, comprobando que al volver no se repiten `/programaAcademico`, `/estudiantes/consulta`, `/inscripcionAdmision/aspirante/*` ni las consultas documentales.
2. La caché es deliberadamente de una sola navegación y no sobrevive refresh, pestañas ni aperturas directas. No convertirla en persistencia temporal sin definir invalidación y límites de memoria.
3. Si se agrega edición de estudiantes desde el detalle, invalidar explícitamente el snapshot para evitar restaurar datos anteriores a la mutación.
4. No hay runner Vitest, datasets ni seeds nuevos; conviene cubrir en el futuro consumo único, cambio a otra ruta y restauración del selector.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- Reutilizar exclusivamente `node_modules` en la raíz. No crear venv, conda, poetry ni un segundo árbol de dependencias.
- `npx eslint src/modules/estudiantes/services/estudiantesListCache.ts src/modules/estudiantes/services/estudiantesMockService.ts src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx` (2026-08-28): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 228 módulos y generaron el build en 540 ms.
- `git diff --check` (2026-08-28): PASS. La validación HTTP/visual requiere backend, sesión institucional y navegador disponibles.

---

# Update 2026-08-28 — Fotografías de estudiantes por inscripción de admisión

## Estado actual y decisiones
- `/coordinacion/estudiantes` carga el listado principal mediante `getEstudiantesByPrograma`, lo publica inmediatamente con `fotoUrl: null` y ejecuta después la carga secundaria de retratos. La ausencia de foto no bloquea ni oculta tarjetas.
- Por estudiante, la relación correcta es `estudiante.idAspirante → GET /sapp/inscripcionAdmision/aspirante/{idAspirante} → inscripcion.id`. La consulta documental usa `codigoTipoTramite: 1002`, `codigoTipoDocumentoTramite: 'ANX-4'` y `tramiteId: inscripcion.id`; nunca debe sustituirse este último por `idAspirante`.
- Hay un máximo de cuatro cadenas inscripción/documento en vuelo. Cada foto válida actualiza solo su estudiante; ausencia de aspirante, inscripción, documento o base64, así como un error individual, conserva **Sin foto** sin modificar el error general.
- El cleanup del effect invalida la tanda anterior al cambiar de programa. Las peticiones HTTP no se abortan físicamente porque el cliente actual no expone `AbortSignal`, pero sus respuestas obsoletas no actualizan estado.

## Paths, contratos y salida esperada
- Listado y coordinación asíncrona: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`.
- Mapeo inicial (incluye `idAspirante`, acepta `estudiante.foto` opcional y fuerza `fotoUrl: null`): `src/modules/estudiantes/services/estudiantesMockService.ts`.
- Consulta de inscripción: `src/modules/admisiones/api/inscripcionAdmisionService.ts`; respuesta esperada `{ ok, message, data: InscripcionAdmisionDto | null }`.
- Foto documental: `src/modules/documentos/api/documentoFotoService.ts`; ahora propaga el filtro `codigoTipoDocumentoTramite` a `GET /sapp/document?...` y retorna un data URI o `null`.
- Salida esperada: las tarjetas aparecen al terminar la consulta de estudiantes; las imágenes disponibles reemplazan progresivamente el placeholder y cualquier respuesta de un programa anterior se descarta.

## Retos y próximos pasos
1. Validar contra backend real que `/inscripcionAdmision/aspirante/{id}` conserva el envelope y devuelve una inscripción singular o `null`.
2. Para cohortes grandes, solicitar un endpoint batch que acepte aspirantes/estudiantes y devuelva las fotos asociadas; el límite de concurrencia reduce presión, pero no elimina las dos consultas por estudiante.
3. Agregar pruebas con un runner cuando se incorpore Vitest: deben cubrir actualización progresiva, errores aislados y cambio rápido de programa. No hay datasets ni seeds nuevos.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry ni un segundo árbol de dependencias.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npx eslint src/modules/estudiantes/services/estudiantesMockService.ts src/modules/admisiones/api/inscripcionAdmisionService.ts src/modules/documentos/api/documentoFotoService.ts src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx` (2026-08-28): PASS; solo apareció el warning conocido de npm `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 227 módulos y generaron el build en 1.10 s.
- `git diff --check` (2026-08-28): PASS. No se tomó screenshot porque el cambio visual es únicamente la aparición progresiva de datos reales y el entorno no dispone de backend/sesión/navegador para reproducirlo.

---

# Update 2026-08-28 — Fotografías más altas en tarjetas de aspirantes y estudiantes

## Estado actual y decisión visual
- En `/admisiones/convocatoria/:convocatoriaId`, la zona de foto de cada tarjeta de aspirante mide ahora 240 px de alto en escritorio y 220 px en pantallas de hasta 640 px.
- En `/coordinacion/estudiantes`, la tarjeta de estudiante aplica las mismas alturas. Se mantiene el ancho de cada tarjeta, el carrusel horizontal y `object-fit: cover`, por lo que la imagen conserva sus proporciones y ocupa un área vertical mayor.
- No se modificaron componentes React, contratos HTTP, rutas, schemas, datasets, seeds, variables de entorno ni dependencias.

## Paths, salida esperada y próximos pasos
- Aspirantes: `src/modules/admisiones/components/StudentCard/StudentCard.css`.
- Estudiantes: `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.css`.
- Salida esperada: ambas pantallas muestran 50 px adicionales de fotografía en escritorio y 40 px adicionales en móvil, sin ensanchar las tarjetas ni alterar sus datos.
- Validar visualmente con fotografías reales y sesión institucional en modo claro, oscuro y viewport móvil; comprobar especialmente que el encuadre `cover` resulte adecuado para retratos con distintos tamaños de origen.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`; reutilizar Node.js/npm y el `node_modules` existente. No crear venv, conda, poetry, entornos Python ni árboles de dependencias en subdirectorios.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 226 módulos y generaron `dist/assets/index-Cpk5iGGf.css` y `dist/assets/index-DLu8cAeb.js`.
- `npx eslint src/modules/admisiones/components/StudentCard/StudentCard.tsx src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx` (2026-08-28): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-08-28): PASS.
- Screenshot automatizado pendiente: el entorno no contiene Chromium, Chrome, Firefox, Playwright ni Puppeteer y las rutas requieren sesión institucional/backend.

---

# Update 2026-08-28 — Convocatoria del período actual aunque esté cerrada

## Estado actual y decisión funcional
- `/admisiones` ya no interpreta “sin convocatoria vigente” como ausencia de convocatoria del semestre. Por cada programa, selecciona primero la convocatoria cuyo `periodo` coincide con el semestre calendario actual de Colombia (enero-junio = 1, julio-diciembre = 2), incluso si `vigente` es falso o las fechas ya cerraron.
- La tarjeta muestra **ABIERTA** o **CERRADA**, mantiene visibles sus fechas y habilita **Entrar a la convocatoria** en ambos casos. Si no existe convocatoria del período actual, conserva como fallback la convocatoria abierta más reciente; si tampoco existe, presenta el estado vacío.
- La convocatoria destacada se retira del selector de anteriores, por lo que no aparece duplicada. No hubo cambios de API, DTO, seeds ni datasets.

## Paths, contrato y salida esperada
- Implementación: `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`; estilos reutilizados: `src/pages/AdmisionesHome/AdmisionesHomePage.css`.
- Entrada vigente: `GET ${VITE_API_URL || '/api/sapp'}/convocatoriaAdmision`, envelope `{ ok, message, data: ConvocatoriaAdmisionDto[] }`. Cada convocatoria mantiene `{ id, programaId, programa, periodoId, periodo, cupos, fechaInicio, fechaFin, observaciones, vigente }`.
- Ejemplo esperado en agosto de 2026: una convocatoria `periodo: '2026-2'` cerrada aparece en la tarjeta principal con badge **CERRADA** y su botón navega a `/admisiones/convocatoria/{id}`.

## Retos, próximos pasos, entorno y pruebas
- Validar visualmente con una sesión institucional y datos reales que incluyan una convocatoria cerrada del período actual. Confirmar con dominio si las fronteras calendario enero/julio deben sustituirse en el futuro por el período académico configurado por backend.
- Ruta del repo: `/workspace/SAPP-frontend`. Reutilizar Node.js/npm y el `node_modules` de la raíz; no crear venv, conda, poetry ni otro árbol de dependencias. Las versiones exactas siguen documentadas en `README.md`.
- `npx eslint src/pages/AdmisionesHome/AdmisionesHomePage.tsx` (2026-08-28): OK; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-28): OK; TypeScript y rolldown-vite transformaron 226 módulos y completaron el build en 773 ms.
- `git diff --check` (2026-08-28): OK. No existe runner Vitest configurado en este repositorio.
- No se pudo tomar screenshot automatizado porque el contenedor no dispone de Chromium, Chrome, Firefox, Playwright ni Puppeteer; queda pendiente validarlo con navegador, sesión institucional y backend.

---

# Update 2026-08-17 — IDs de las figuras de dominio retornadas por `/inicio`

## Estado actual
- El contrato TypeScript de inicio ya representa `data.detalle.aspirante`, `docente`, `estudiante` y `persona`, incluyendo sus identificadores locales.
- `mapGatewayLoginToUserSession` persiste todo el detalle en `session.user.detalle`, asigna `session.user.persona.id = detalle.persona.id` y asigna `session.user.estudiante = detalle.estudiante`. Esto restablece los procesos que leen `session.user.estudiante.id` y evita sustituirlo incorrectamente por el `id` superior de la respuesta.
- La figura `persona` normalizada combina la identidad de `detalle.persona` con los datos personales de `detalle.aspirante` cuando están disponibles. Si no hay aspirante, utiliza los atributos superiores como fallback; no inventa IDs.

## Contrato y salida esperada
- Request vigente en código: `GET ${VITE_API_URL || '/api/sapp'}/inicio`, sin body.
- Response: envelope `{ ok, message, data }`, donde `data.detalle` tiene `{ aspirante: AspiranteDetalleDto | null, docente: DocenteDetalleDto | null, estudiante: EstudianteDto | null, persona: PersonaDetalleDto }`.
- Para el ejemplo validado conceptualmente, la sesión debe producir `user.persona.id === 38`, `user.estudiante?.id === 10`, `user.detalle.aspirante?.id === 38`, `user.detalle.estudiante?.id === 10` y `user.detalle.persona.id === 38`.
- Paths principales: `src/api/authTypes.ts`, `src/api/authMappers.ts` y `src/context/Auth/types.ts`. El consumidor que requiere el ID estudiantil está, entre otros, en `src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx`.

## Retos y próximos pasos
1. Validar la respuesta contra Gateway/backend real para usuarios que sean solo persona, aspirante, docente y estudiante; las figuras no aplicables deben llegar como `null`.
2. Confirmar el shape completo de `docente`; por ahora se exige su `id` y se preservan campos adicionales sin acoplar la UI a un contrato todavía no suministrado.
3. Incorporar Vitest si el equipo desea pruebas unitarias del mapper; el repositorio todavía no incluye runner de tests y esta tanda se validó mediante TypeScript, build y ESLint focalizado.
4. No volver a derivar `estudiante.id`, `aspirante.id` o `persona.id` desde `data.id`: cada proceso debe usar la figura correspondiente dentro de `detalle`.

## Entorno y pruebas recientes
- Ruta `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- Reutilizar `node_modules` en la raíz. No crear venv, conda, poetry ni otro entorno o árbol de dependencias.
- `npm run build` (2026-08-17): OK; 223 módulos transformados, build en 647 ms. npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npx eslint src/api/authTypes.ts src/api/authMappers.ts src/context/Auth/types.ts` (2026-08-17): OK; mismo warning no bloqueante de npm.
- `git diff --check` (2026-08-17): OK.

---

# Update 2026-08-17 — Consultas de aspirantes con nombres desagregados

## Estado actual y contrato
- `src/modules/admisiones/api/aspiranteService.ts` expone `getAspirantes()`, `getAspiranteById(id)` y `getAspiranteConsultaInfo()` para `GET /aspirante`, `GET /aspirante/{id}` y `GET /aspirante/consultaInfo`, respectivamente.
- Las tres respuestas mantienen el envelope `{ ok: boolean, message: string, data: T }`. El listado usa `data: AspiranteConsultaResponseDto[]`; las consultas individual y de información usan un solo DTO.
- `AspiranteConsultaResponseDto` reemplaza el antiguo `nombre` por `nombre1: string`, `nombre2: string | null`, `apellido1: string` y `apellido2: string | null`; los demás campos conocidos se conservan.
- `getNombreCompletoAspirante(dto)` genera texto de presentación omitiendo partes nulas o vacías. No debe enviarse esa composición nuevamente al backend como `nombre`.
- La respuesta del POST continúa tipada por separado como `AspiranteCreateResponseDto`: no cambiarla sin confirmación del contrato de creación, pues esta tanda solo especificó respuestas GET.

## Retos, paths y próximos pasos
- Validar las tres consultas contra el backend/Gateway real y confirmar si `consultaInfo` devuelve exactamente un aspirante o un shape adicional. No hubo backend, dataset ni sesión institucional disponibles para una prueba HTTP end-to-end.
- Migrar futuros consumidores de consultas para que utilicen el helper de nombre completo; no añadir compatibilidad silenciosa con el campo retirado `nombre`.
- Contratos: `src/modules/admisiones/api/aspiranteCreateTypes.ts`. Transporte y helper: `src/modules/admisiones/api/aspiranteService.ts`.
- No se agregaron seeds ni artefactos. Reutilizar Node.js/npm y `node_modules` en `/workspace/SAPP-frontend`; no crear venv, conda, poetry ni dependencias paralelas.

## Entorno y pruebas
- Node.js 24.15.0, npm 11.4.2; React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npx eslint src/modules/admisiones/api/aspiranteCreateTypes.ts src/modules/admisiones/api/aspiranteService.ts` (2026-08-17): OK; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-17): OK; TypeScript y rolldown-vite transformaron 223 módulos y completaron el build en 667 ms.
- `git diff --check` (2026-08-17): OK, sin errores de whitespace.
- `npm run lint` (2026-08-17): continúa fallando por 11 errores históricos y 1 warning fuera de los archivos modificados (`no-explicit-any`, estados síncronos en effects, parámetros/mocks sin uso, interfaces vacías y una dependencia de hook). El lint dirigido de esta tanda sí pasa.

---

# Update 2026-08-17 — Creación de estudiante desde convocatoria cerrada

## Estado actual
- `ConvocatoriaDetallePage` detecta una convocatoria cerrada por `vigente === false` o por estar fuera de sus fechas. Para roles `COORDINACION`, `SECRETARIA` y `ADMIN`, muestra los aspirantes cuyo estado normalizado es `ADMITIDO`.
- La acción **Crear estudiante** abre un formulario con código UIS y correo institucional obligatorios. Tras crear, muestra el código retornado y deshabilita la acción del aspirante durante la sesión de la página.
- El correo personal no se captura ni se envía: el backend lo deriva del aspirante.

## Contrato y salida esperada
- Request del navegador: `POST ${VITE_API_URL || '/api/sapp'}/estudiantes` con `{ idAspirante: number, codigoUIS: string, emailInstitucional: string }`.
- Respuesta esperada: envelope `{ ok, message, data }`, donde `data` es `{ id: number, cohorte: string | null, estado: string, codigoEstudianteUis: string, fechaIngreso: string | null, fechaEgreso: string | null, idAspirante: number, foto: DocumentoFotoDto | null }`.
- La pantalla usa `data.idAspirante` para marcar el aspirante procesado y `data.codigoEstudianteUis` para la confirmación. Si el backend devuelve el objeto sin envelope, debe acordarse y ajustarse el servicio; el resto de APIs SAPP actualmente usa envelope.

## Paths, retos y próximos pasos
- Pantalla y gating: `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`.
- Formulario: `src/modules/admisiones/components/CreateEstudianteModal/CreateEstudianteModal.tsx` y su CSS.
- Transporte y tipos: `src/modules/admisiones/api/estudianteAdmisionService.ts` y `src/modules/admisiones/api/types.ts`.
- Validar contra backend real que el endpoint queda efectivamente bajo la base configurada (`/api/sapp/estudiantes`) y que conserva el envelope API.
- Confirmar cómo informa el backend que un aspirante ya es estudiante al recargar la página; el DTO actual de inscripciones no expone ese indicador, por lo que la prevención persistente depende de la restricción/backend.
- No se agregaron datasets ni seeds.

## Entorno y pruebas recientes
- Ruta `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- Reutilizar el `node_modules` de la raíz. No crear venv, conda, poetry ni un árbol paralelo de dependencias.
- `npx eslint src/modules/admisiones/api/types.ts src/modules/admisiones/api/estudianteAdmisionService.ts src/modules/admisiones/components/CreateEstudianteModal/CreateEstudianteModal.tsx src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`: OK (solo warning npm conocido por `http-proxy`).
- `npm run build`: OK; 223 módulos transformados y build en 723 ms.
- `git diff --check`: OK.

---

# Update 2026-08-17 — Contrato de nombres desagregados al crear aspirantes

## Estado actual
- `CreateAspiranteModal` muestra cuatro campos en lugar del antiguo campo único `nombre`: primer nombre, segundo nombre, primer apellido y segundo apellido.
- La UI exige `nombre1` y `apellido1`; `nombre2` y `apellido2` son opcionales. El foco inicial queda en primer nombre y los errores obligatorios aparecen junto a sus respectivos controles.
- El DTO y el payload de creación quedaron alineados con la delegación de usuarios al IDP externo: el frontend dejó de enviar `nombre`.

## Contrato y salida esperada
- Request: `POST ${VITE_API_URL || '/api/sapp'}/aspirante` con JSON `{ nombre1: string, nombre2: string | null, apellido1: string, apellido2: string | null, tipoDocumentoIdentificacionId, numeroDocumento, emailPersonal, numeroInscripcionUis, telefono, observaciones, programaId, convocatoriaAdmisionId }`.
- `nombre1` y `apellido1` deben contener texto no vacío. Los dos campos opcionales se recortan y se envían como `null` si el usuario no los diligencia.
- La respuesta no fue modificada por esta tanda: la UI continúa esperando el envelope exitoso con `data.id` y `data.inscripcionAdmisionId` para asociar los documentos. `AspiranteCreateResponseDto.nombre` se conserva mientras el backend aún lo entregue como nombre de presentación.
- El backend también informó el mismo cambio para `PUT /aspirante`; no existe en esta UI un formulario general de edición de datos personales. `src/api/aspiranteService.ts` contiene un PUT limitado a grupo/director de investigación y no se amplió sin un contrato completo de esa operación.

## Paths, artefactos y próximos pasos
- Formulario y validación: `src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx`.
- Contrato TypeScript: `src/modules/admisiones/api/aspiranteCreateTypes.ts`.
- Transporte POST existente: `src/modules/admisiones/api/aspiranteService.ts`.
- No se agregaron datasets, seeds ni artefactos generados. Validar el POST contra el backend/IDP real y confirmar si los opcionales deben omitirse en vez de enviarse como `null`.
- Si se incorpora edición general de aspirantes, reutilizar exactamente los cuatro campos y su validación para el PUT; no confundirlo con la actualización acotada de información de investigación.

## Entorno exacto
- Ruta: `/workspace/SAPP-frontend`; Node.js 24.15.0 y npm 11.4.2.
- Instalado: React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- Usar el `node_modules` existente en la raíz. No crear venv, conda, poetry ni un segundo entorno de dependencias.

## Pruebas recientes
- `npx eslint src/modules/admisiones/api/aspiranteCreateTypes.ts src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx` (2026-08-17): OK; npm solo emitió el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-17): OK; TypeScript y rolldown-vite completaron con 220 módulos transformados y build en 691 ms.
- `git diff --check` (2026-08-17): OK, sin errores de whitespace.
- No se tomó screenshot automatizado porque el contenedor no tiene Chromium, Chrome ni Playwright instalado; la validación visual queda pendiente en un navegador con sesión y backend disponibles.

---

# Update 2026-08-17 — Diagnóstico y manejo de error al crear aspirante

## Estado actual
- La creación desde `CreateAspiranteModal` permanece en la convocatoria cuando `POST /sapp/aspirante` falla, conserva los campos y muestra el mensaje de servidor en el modal.
- `createAspirante` usa `redirectOnUnauthorized: false`; un 401/403 de esta operación ya no limpia la sesión local ni convierte el error del formulario en navegación al fallback `/`.
- El cliente HTTP ahora extrae `message` o `error` y detalles `errors` (arreglo de strings/objetos o mapa campo-mensaje). El error general se desplaza al área visible del diálogo.

## Diagnóstico, retos y próximos pasos
1. La causa directa del retorno al inicio era el manejo global de 401: limpiaba la sesión ante un rechazo de creación; como la SPA ya no tiene login interno, el guard terminaba en el fallback `/` antes de que el usuario pudiera leer el error.
2. La causa backend exacta del rechazo no puede determinarse sin la respuesta real del ambiente. Reproducir y revisar Network/logs: ahora la UI debe revelar si es 401/403, constraint de documento/email/inscripción, validación o incompatibilidad del DTO.
3. Confirmar que backend espera `convocatoriaAdmisionId` (no `convocatoriaId`) y que la respuesta exitosa incluye `data.id` y `data.inscripcionAdmisionId`; ambos son necesarios para cargar documentos.
4. Validar con rol `COORDINACION` y `ADMIN` contra Gateway real. Si responde 401/403, corregir propagación de identidad/permisos en Gateway/backend, no agregar credenciales ni roles simulados al frontend.

## Paths, contrato y salida esperada
- UI: `src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx`.
- Servicio: `src/modules/admisiones/api/aspiranteService.ts`; cliente: `src/shared/http/httpClient.ts`.
- **Supersedido por el contrato documentado arriba:** el request actual de `POST ${VITE_API_URL || '/api/sapp'}/aspirante` usa `nombre1`, `nombre2`, `apellido1` y `apellido2`; ya no envía `nombre`.
- Éxito: envelope `{ ok: true, message, data }`, con al menos `data.id` y `data.inscripcionAdmisionId`. Error: HTTP no-2xx con `message`/`error` y opcional `errors`; debe mostrarse sin cerrar el modal.
- No hay datasets/seeds nuevos. Usar Node.js/npm y el `node_modules` de `/workspace/SAPP-frontend`; no crear venv, conda, poetry ni otro entorno duplicado.

## Entorno y pruebas de esta actualización
- Node.js 24.15.0, npm 11.4.2; React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, ESLint 9.39.2.
- `npm run build`: OK; 220 módulos transformados, build en 674 ms.
- `npx eslint src/shared/http/httpClient.ts src/modules/admisiones/api/aspiranteService.ts src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx`: OK.
- `npm run lint`: sigue fallando por 11 errores históricos fuera de los archivos modificados y 1 warning (tipos `any`, estados síncronos en effects, mocks/params sin uso, interfaces vacías y dependencia de hook).
- No se tomó screenshot automatizado: el contenedor no tiene Chromium, Chrome ni Playwright instalado. El cambio visible se limita al mensaje de error ya existente, ahora persistente y anunciado como alerta.

---

# Update 2026-08-17 — Retiro de login, portal aspirante y cierre de sesión internos

## Estado actual
- La SPA ya no declara rutas para `/login`, `/login/aspirante` ni `/aspirante/*`; todas quedan cubiertas por el fallback general que navega a `/`.
- Se eliminaron los componentes `Login`, `AspiranteLogin`, `AspiranteDocumentos` y `AspiranteLayout`, junto con los guards/servicios exclusivos del login de aspirantes.
- `AuthProvider` conserva únicamente la inicialización institucional automática vía Gateway/IDP. Ya no expone `login`, `loginAspirante` ni `logout`.
- El sidebar no ofrece cierre de sesión y el cliente HTTP no redirige respuestas 401/403 a `/login`.

## Decisión funcional y contrato esperado
- La autenticación y su finalización se administran fuera de SAPP. Al montar la SPA se mantiene `GET /inicio` (a través de `loginFromGateway`) para obtener la identidad institucional existente.
- Solo se admite una sesión de tipo `SAPP`; ya no existe sesión frontend de tipo `ASPIRANTE`.
- Una URL retirada debe terminar en `/` mediante la ruta comodín, nunca renderizar un formulario de acceso ni el portal del aspirante.

## Archivos y próximos pasos
- Ruteo: `src/app/routes/index.tsx` y `src/app/routes/protectedRoute.tsx`.
- Sesión: `src/context/Auth/AuthContext.tsx`, `src/context/Auth/types.ts` y `src/shared/http/httpClient.ts`.
- Navegación: `src/components/Sidebar/Sidebar.tsx` y `Sidebar.css`.
- Validar con el Gateway real el comportamiento de una sesión institucional ausente/expirada y acordar con infraestructura la pantalla externa de acceso, sin reintroducir URLs internas.
- Entorno: usar exclusivamente Node.js/npm y el `node_modules` de `/workspace/SAPP-frontend`; no crear venv, conda, poetry ni otro árbol de dependencias.

## Pruebas recientes
- `npm run build` (2026-08-17): OK; `tsc -b` y `rolldown-vite v7.2.5` completaron con 220 módulos transformados.
- `npm run lint` (2026-08-17): falla por 11 errores históricos fuera de este cambio (`no-explicit-any`, efectos con actualizaciones síncronas, mocks con variables sin uso y tipos vacíos) y 1 warning de dependencia de hook.
- `rg -n -i "logout|log.?out|cerrar sesión|/login|/aspirante" src --glob '*.{ts,tsx,css}'` (2026-08-17): no encuentra logout, cierre de sesión ni rutas retiradas; conserva únicamente usos de “aspirante” propios del dominio de admisiones.

---

# Update 2026-08-16 — Bootstrap real de sesión Gateway/IDP

## Estado actual
- Se eliminó `src/context/Auth/mockGatewaySession.ts` y ya no existe un usuario ADMIN quemado.
- En el primer montaje, `AuthProvider` llama `POST /auth/login` sin body, transforma el DTO nuevo y persiste `SAPP_AUTH_SESSION`. `App` espera a que finalice este bootstrap antes de renderizar rutas, evitando redirecciones prematuras.
- **Supersedido por el update 2026-08-17:** ya no existe `/login`, acción de reintento en una página interna ni acceso separado de aspirantes.
- Los roles efectivos de la UI son la unión uppercase/sin duplicados de `roles` y `clientRoles`. La sesión también conserva `uuid`, `attributes` y `clientRoles` por separado.

## Retos abiertos y próximos pasos
1. Validar contra el gateway desplegado que la infraestructura enruta `/api/sapp/auth/login` al backend y propaga el token/identidad que el backend debe capturar.
2. Confirmar con infraestructura cómo se presenta el acceso externo cuando no existe identidad upstream; no reintroducir cierre de sesión dentro de SAPP.
3. Agregar tests de componente/integración cuando el repositorio incorpore Vitest: llamada única inicial, body ausente, mapeo de atributos/roles, estado de error y reintento.
4. Revisar con backend si algún `clientRole` requiere traducción a nombres internos distintos de uppercase; actualmente se combina tal como llega.

## Paths / artefactos / datasets
- Servicio y contrato DTO: `src/api/authService.ts`, `src/api/authTypes.ts`.
- Mapper hacia sesión UI: `src/api/authMappers.ts`.
- Orquestación de bootstrap: `src/context/Auth/AuthContext.tsx` y `src/context/Auth/types.ts`.
- Bloqueo de rutas durante carga: `src/app/App.tsx`.
- Manejo 401/403 sin redirect durante bootstrap: `src/shared/http/httpClient.ts`.
- Pantalla de fallo/reintento: `src/pages/Login/LoginPage.tsx`.
- No hay datasets, seeds, venv, conda ni poetry. Reutilizar exclusivamente `node_modules` de `/workspace/SAPP-frontend`.

## Contrato y salida esperada
- Request navegador: `POST ${VITE_API_URL || '/api/sapp'}/auth/login`, sin body y sin header Bearer agregado por el frontend.
- Response: `{ ok: true, message: 'Login exitoso.', data: { id: number, uuid: string, username: string, firstName: string, lastName: string, fullName: string, email: string, attributes: Record<string, string[]>, roles: string[], clientRoles: string[] } }`.
- `id` continúa siendo el id local `personas_idp`; no confundirlo con `uuid` del IDP.
- Sesión esperada: `kind: 'SAPP'`, datos básicos derivados en `persona`, `programa` desde el primer `attributes.academicProgram`, roles combinados y marcador `NO_TOKEN`. `sessionStore.getToken()` filtra ese marcador para no producir `Authorization: Bearer NO_TOKEN`.

## Entorno exacto y resultados
- Ruta: `/workspace/SAPP-frontend`. Node.js 24.15.0, npm 11.4.2; React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npm run build` (2026-08-16): OK; `238 modules transformed`, build en `665ms`.
- `npx eslint src/api/authTypes.ts src/api/authService.ts src/api/authMappers.ts src/shared/http/httpClient.ts src/context/Auth/types.ts src/context/Auth/AuthContext.tsx src/app/App.tsx src/pages/Login/LoginPage.tsx` (2026-08-16): OK.
- Warning conocido y no bloqueante en npm: `Unknown env config "http-proxy"`.
- No se tomó screenshot: no hay Chromium/Chrome/Playwright instalado en el contenedor; el cambio visible se limita al estado de error del login institucional.

---

# Update 2026-06-12 — Logos institucionales EISI/UIS y documentación

## Estado actual
- Se agregó el logo de **EISI** como favicon del frontend mediante `public/brand/eisi-favicon.svg`; `index.html` ahora apunta a ese asset, usa `lang="es"` y muestra el título `SAPP EISI UIS`.
- Se agregó el logo de **UIS** al header común de módulos (`ModuleLayout`), ubicado a la derecha de la foto/avatar del usuario autenticado como pidió el usuario.
- El logo UIS se sirve como asset estático en `public/brand/uis-logo.svg` y se estiliza en `ModuleLayout.css` con tamaño responsivo, fondo basado en `--surface` y sombra suave compatible con la estética institucional.
- No se cambiaron rutas, servicios, contratos HTTP, roles ni lógica de autenticación.
- `README.md` fue reescrito para mantener una vista holística y actualizada del frontend: propósito, alcance, arquitectura, stack con versiones observadas, comandos, seeds/mock y decisiones recientes.

## Archivos tocados
- `index.html`
- `public/brand/eisi-favicon.svg`
- `public/brand/uis-logo.svg`
- `src/components/ModuleLayout/ModuleLayout.tsx`
- `src/components/ModuleLayout/ModuleLayout.css`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Validar visualmente en navegador real con datos/sesión de usuario si el logo UIS queda del tamaño deseado junto al avatar en resoluciones pequeñas y pantallas amplias.
2. Si el equipo dispone de archivos oficiales vectoriales de marca UIS/EISI, reemplazar los SVG reconstruidos en `public/brand` por los assets oficiales preservando los mismos nombres o actualizando las rutas en `index.html` y `ModuleLayout`.
3. Tomar screenshot manual/automatizado cuando el ambiente local tenga navegador disponible; este cambio es perceptible visualmente.

## Próximos pasos recomendados
1. Ejecutar `npm run dev` y abrir `http://localhost:5173/` para confirmar que la pestaña usa el favicon EISI.
2. Navegar a una pantalla que use `ModuleLayout` (`/`, `/admisiones`, `/solicitudes`, `/matricula`) y verificar que el logo UIS aparece a la derecha del avatar.
3. Probar modo claro/oscuro si el tema está disponible en la sesión, confirmando que el contenedor del logo conserva contraste suficiente.
4. Confirmar con comunicaciones/identidad institucional si las proporciones de los SVG son aceptables o deben sustituirse por archivos oficiales.

## Paths / artefactos / datasets
- Favicon EISI: `public/brand/eisi-favicon.svg`.
- Logo UIS del header: `public/brand/uis-logo.svg`.
- Punto de integración del favicon: `index.html`.
- Punto de integración del header: `src/components/ModuleLayout/ModuleLayout.tsx`.
- Estilos del header/logo: `src/components/ModuleLayout/ModuleLayout.css`.
- No hay datasets nuevos ni migraciones.

## Contratos / esquemas y salidas esperadas
- Asset estático favicon: `GET /brand/eisi-favicon.svg` debe devolver SVG `image/svg+xml` servido por Vite/public.
- Asset estático logo UIS: `GET /brand/uis-logo.svg` debe devolver SVG `image/svg+xml`.
- HTML esperado: `<link rel="icon" type="image/svg+xml" href="/brand/eisi-favicon.svg" />`.
- `ModuleLayout` esperado: renderiza texto de usuario, avatar actual/fallback y luego `<img className="module-layout__uis-logo" src="/brand/uis-logo.svg" alt="Universidad Industrial de Santander" />`.

## Entorno exacto y paquetes
- Ruta de trabajo: `/workspace/SAPP-frontend`.
- Runtime observado: Node.js 24.15.0 y npm 11.4.2.
- Frontend instalado según `npm list --depth=0` (2026-06-12): React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite `npm:rolldown-vite@7.2.5`, @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.2, typescript-eslint 8.51.0.
- Sin venv/conda/poetry; no crear entornos Python ni duplicar dependencias. Usar `node_modules` de la raíz del repo.
- npm emite warning no bloqueante conocido: `Unknown env config "http-proxy"`.

## Resultados de pruebas + logs
- `npm run build` (2026-06-12): OK. Log relevante: `✓ 239 modules transformed`, `dist/index.html 0.47 kB`, `✓ built in 811ms`. npm emitió warning no bloqueante conocido `Unknown env config "http-proxy"`.
- `npx eslint src/components/ModuleLayout/ModuleLayout.tsx` (2026-06-12): OK. npm emitió warning no bloqueante conocido `Unknown env config "http-proxy"`.
- Screenshot automatizado (2026-06-12): no tomado porque el contenedor no tiene browser CLI instalado (`which chromium chromium-browser google-chrome google-chrome-stable playwright` no encontró ejecutables).

---

# Update 2026-06-06 — Rediseño visual detalle inscripción/documentos

## Estado actual
- Implementado un ajuste exclusivamente visual para `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/documentos`.
- La pantalla ahora muestra una ficha superior del aspirante con foto/placeholder, nombre, badge de estado, documento, correo, teléfono, programa, código visual de inscripción, período, fecha de inscripción y última actualización cuando el DTO ya lo trae.
- Se agregó barra resumen con estado de inscripción, programa y estado de evaluación.
- La alerta de evaluación no iniciada conserva el texto/mensaje actual, pero se presenta como alerta suave roja.
- La sección `Documentos cargados` se convirtió en una card interna con encabezado y listado moderno; cada fila mantiene las mismas acciones y handlers existentes.

## Archivos tocados
- `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`
- `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.css`
- `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`
- `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.css`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Validar manualmente con backend real que todos los campos opcionales del DTO (`foto`, `numeroDocumento`/`cedula`, `emailPersonal`/`correo`, `telefono`, `fechaResultado`) aparecen según disponibilidad en datos productivos.
2. Si el backend expone en el futuro tamaño de archivo, se puede renderizar en la columna `Archivo cargado`; este ajuste no agregó esa lógica porque el DTO actual no lo contiene.
3. Tomar captura navegada con datos reales si el ambiente local dispone de backend y navegador automatizado; en esta sesión se validó build/dev server, pero no había Playwright/Puppeteer/Chrome instalado para screenshot automatizado.

## Próximos pasos recomendados
1. Abrir `/admisiones/convocatoria/{convocatoriaId}/inscripcion/{inscripcionId}/documentos` con sesión de coordinación/secretaría y confirmar que `← Volver a Convocatoria` conserva navegación.
2. Verificar que los documentos cargan igual, que `Ver`/`Descargar` siguen disponibles solo bajo las mismas condiciones y que `Aprobar`/`Rechazar` disparan los handlers existentes.
3. Revisar móvil/tablet: cabecera apilada y tabla con scroll horizontal o cards verticales según ancho.

## Contratos / esquemas esperados
- Inscripción: `GET /sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` usado por `getInscripcionByConvocatoriaAndId`; la UI busca localmente el `inscripcionId`.
- DTO usado para cabecera: `InscripcionAdmisionDto` con `id`, `nombreAspirante`, `estado`, `fechaInscripcion`, `fechaResultado`, `periodoAcademico`, `programaAcademico`, `numeroDocumento`/`cedula`, `emailPersonal`/`correo`, `telefono`, `foto`.
- Documentos: checklist cargado por `prefetchInscripcionDocumentos(tramiteId)` y validación con `PUT /sapp/document` mediante `aprobarRechazarDocumento`; no se cambiaron payloads ni respuestas esperadas.
- Acciones de archivo: siguen usando `base64DocumentoContenido`/`contenidoBase64`, `mimeTypeDocumentoContenido`/`mimeType` y `nombreArchivoDocumento`.

## Entorno exacto y paquetes
- Runtime: Node.js + npm en la raíz `/workspace/SAPP-frontend`.
- Frontend: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2, TypeScript 5.9.3, Vite rolldown-vite 7.2.5, @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1.
- Sin venv/conda/poetry; no crear entornos Python ni copias paralelas. Usar `node_modules` de la raíz del repo.

## Resultados de pruebas + logs
- `npm run build` (2026-06-06): OK. Log relevante: `✓ 239 modules transformed` y `✓ built in 694ms`.
- `npx eslint src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx` (2026-06-06): OK; solo aparece warning npm histórico `Unknown env config "http-proxy"`.
- `npm run dev -- --host 127.0.0.1` (2026-06-06): OK; Vite listo en `http://127.0.0.1:5173/`.

---

# HANDOFF — SAPP Frontend

## Update 2026-06-06 — Rediseño visual de Admisiones (`/admisiones`)

### Estado actual
- La pantalla `/admisiones` fue rediseñada visualmente sin alterar lógica de negocio, servicios ni contratos backend.
- El layout sigue usando `ModuleLayout`, por lo que se mantiene el sidebar verde y el header superior con usuario autenticado.
- El contenido ahora muestra la descripción “Gestiona las convocatorias de maestría y doctorado.”, un contenedor principal blanco con bordes amplios, header de sección, botón secundario **Configurar fechas académicas**, grid responsive de programas y cards profesionales para Maestría/Doctorado.
- En la convocatoria vigente solo se renderizan **Fecha de inicio** y **Fecha de fin** con formato calendario sin hora. No se muestran cupos, fecha límite, resultados ni sección inferior de ayuda.

### Archivos modificados
- `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`
- `src/pages/AdmisionesHome/AdmisionesHomePage.css`
- `README.md`
- `HANDOFF.md`

### Retos abiertos
1. Validar visualmente con backend activo y datos reales que los IDs de programa `1` y `2` correspondan a `61412 - MISI` y `61204 - DCC`; si el backend usa otros IDs, ajustar `PROGRAM_META` sin tocar la lógica de convocatorias.
2. Tomar screenshot en navegador real si el entorno dispone de Chromium/Playwright. En esta sesión no se pudo automatizar porque no había browser CLI instalado y `npx playwright --version` fue bloqueado por política npm `403 Forbidden`.
3. Confirmar con usuarios `SECRETARIA` que la ausencia del botón **Configurar fechas académicas** sigue siendo el comportamiento esperado, ya que la condición previa solo permite `ADMIN`/`COORDINACION`.

### Próximos pasos recomendados
1. Levantar backend + frontend con `npm run dev` y abrir `http://localhost:5173/admisiones` con usuario `ADMIN` o `COORDINACION`.
2. Verificar que el botón **Configurar fechas académicas** navega a `/fechas`.
3. Pulsar **Entrar a la convocatoria** y confirmar que conserva la navegación a `/admisiones/convocatoria/{id}` con el estado de navegación existente.
4. Seleccionar una convocatoria anterior y confirmar que el select navega al detalle y luego limpia el valor seleccionado.
5. Revisar responsive en ancho móvil: header apilado, cards en una columna y sin overflow horizontal.

### Paths / artefactos / datasets
- Ruta UI: `/admisiones`.
- Pantalla: `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`.
- Estilos específicos: `src/pages/AdmisionesHome/AdmisionesHomePage.css`.
- Servicio existente: `src/modules/admisiones/api/convocatoriaAdmisionService.ts`.
- Tipos existentes: `src/modules/admisiones/api/convocatoriaAdmisionTypes.ts`.
- Build generado localmente en `dist/` por `npm run build` (no versionar si está ignorado).

### Contratos / esquemas esperados
- Listado de convocatorias: `GET ${VITE_API_URL || '/api/sapp'}/convocatoriaAdmision` con envelope `{ ok, message, data }`.
- Item esperado: `ConvocatoriaAdmisionDto` con `{ id, programaId, programa, periodoId, periodo, cupos, fechaInicio, fechaFin, observaciones, vigente }`.
- Fechas aceptadas por UI: strings como `YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss` o ISO parseable. Valores `null`, `undefined`, vacíos o inválidos renderizan `—`.
- Navegación esperada al detalle: `/admisiones/convocatoria/{convocatoria.id}` con `state` que conserva `programaId`, `programaNombre`, `periodoLabel`, `periodoAcademico` y `cupos`.

### Entorno exacto y paquetes
- Runtime: Node.js + npm. No usar venv/conda/poetry ni crear entornos paralelos; trabajar con `node_modules` en la raíz de `/workspace/SAPP-frontend`.
- Versiones principales desde `package.json`: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2, TypeScript 5.9.3, rolldown-vite 7.2.5 (override de `vite`), @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1, typescript-eslint 8.46.4.

### Resultados de pruebas + logs
- `npm run build` (2026-06-06): OK. Log relevante: `✓ 240 modules transformed`, `✓ built in 708ms`. npm emitió warning no bloqueante: `Unknown env config "http-proxy"`.
- `npx eslint src/pages/AdmisionesHome/AdmisionesHomePage.tsx` (2026-06-06): OK. npm emitió warning no bloqueante: `Unknown env config "http-proxy"`.
- `npm run dev -- --host 127.0.0.1` (2026-06-06): OK; Vite quedó listo en `http://127.0.0.1:5173/`.
- `npx playwright --version` (2026-06-06): falló por limitación del entorno/política npm con `403 Forbidden - GET https://registry.npmjs.org/playwright`; por eso no se adjuntó screenshot automatizado.

---

## Update 2026-06-05 (Coordinación > Estudiantes: tablero horizontal tipo Trello)

### Estado actual
- Implementado el rediseño de `/coordinacion/estudiantes`: ya no hay combo/select de programa ni textos redundantes tipo “Programa seleccionado”.
- La selección de programa se hace únicamente con el nuevo componente `ProgramTypeToggle`, un segmented control de botones reales **Maestría** / **Doctorado** con `aria-pressed`; el estado local usa `ProgramType` y por defecto inicia en `doctorado`.
- La pantalla mapea los programas reales cargados desde `GET /sapp/programaAcademico` hacia `maestria`/`doctorado` por nombre/código (`MISI` / `DCC`) y conserva la consulta existente de estudiantes con `GET /sapp/estudiantes/consulta?programaId={id}&egresados=false`.
- El listado ahora usa `StudentHorizontalBoard` con `useRef`, scroll horizontal (`scrollBy({ behavior: 'smooth' })`), botones accesibles izquierda/derecha y guía “Desliza horizontalmente para ver más estudiantes”.
- `EstudianteCard` quedó con ancho fijo (`flex: 0 0 290px`), foto superior de altura fija, placeholder profesional “Sin foto”, badge de estado, metadatos (código, documento, correo, cohorte) y footer fijo “Ver perfil”.
- Si el programa seleccionado no existe en catálogo o no retorna estudiantes, se muestra el estado vacío: “No hay estudiantes registrados para este programa”.

### Archivos modificados
- `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`
- `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.css`
- `src/modules/estudiantes/components/ProgramTypeToggle/ProgramTypeToggle.tsx`
- `src/modules/estudiantes/components/ProgramTypeToggle/ProgramTypeToggle.css`
- `src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx`
- `src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.css`
- `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx`
- `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.css`
- `README.md`
- `HANDOFF.md`

### Retos abiertos
1. Validar manualmente con backend activo que ambos programas (`MISI`/`DCC`) llegan en `GET /sapp/programaAcademico`; si el backend cambia códigos/nombres, actualizar `getProgramaType`.
2. Tomar captura visual en navegador real si el entorno dispone de Chromium/Playwright; en esta sesión no había browser CLI instalado para screenshot automatizado.
3. Revisar si el equipo quiere cambiar el programa activo inicial de `doctorado` a `maestria` según datos reales o preferencia de coordinación.

### Próximos pasos recomendados
1. Levantar backend + frontend y abrir `http://localhost:5173/coordinacion/estudiantes` con usuario `COORDINACION`/`ADMIN`.
2. Verificar en Network que al pulsar **Maestría** y **Doctorado** se conserva el endpoint `GET /sapp/estudiantes/consulta?programaId={id}&egresados=false` con el `programaId` correspondiente.
3. Probar scroll lateral con trackpad, rueda/barra y botones de flecha; comprobar responsive móvil (tarjeta `84vw`) y modo claro/oscuro.
4. Resolver o separar los errores históricos de `npm run lint` antes de exigir lint global como gate de CI.

### Paths / artefactos / datasets
- Ruta UI: `/coordinacion/estudiantes`.
- Servicio de programas y estudiantes: `src/modules/estudiantes/services/estudiantesMockService.ts`.
- Tipos UI: `src/modules/estudiantes/types.ts` (`ProgramaCoordinacion`, `EstudianteCoordinacion`).
- Mock de detalle fallback: `src/modules/estudiantes/mock/estudiantes.mock.ts` (no se usa como fuente principal del listado).
- Build generado localmente en `dist/` por `npm run build` (no versionar si está ignorado).

### Contratos / esquemas esperados
- Programas: `GET ${VITE_API_URL || '/api/sapp'}/programaAcademico` con envelope `{ ok, message, data }`; cada item esperado incluye `{ id, nombre, codigoNombre }`.
- Estudiantes por programa: `GET ${VITE_API_URL || '/api/sapp'}/estudiantes/consulta?programaId={id}&egresados=false` con envelope `{ ok, message, data }`.
- Item estudiante esperado: `data[].estudiante` con `{ id, idAspirante, codigoEstudianteUis, cohorte, estado, fechaIngreso, foto }`, `data[].persona` con documento/correo, `nombreCompleto`, `programaId`, `programaCodigoNombre`.
- Foto: si `foto.contenidoBase64` existe, se normaliza a `data:${mimeType || 'image/jpeg'};base64,...`; si no existe, UI muestra “Sin foto”.

### Entorno exacto y paquetes
- Runtime: Node.js + npm, sin venv/conda/poetry. No crear entornos Python ni duplicar dependencias; usar `node_modules` en la raíz de `/workspace/SAPP-frontend`.
- Versiones principales desde `package.json`: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2, TypeScript 5.9.3, rolldown-vite 7.2.5 (override de `vite`), @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1, typescript-eslint 8.46.4.

### Resultados de pruebas + logs
- `npm run build` (2026-06-05): OK. Log relevante: `✓ 241 modules transformed`, `✓ built in 649ms`. npm emitió warning no bloqueante: `Unknown env config "http-proxy"`.
- `npm run lint` (2026-06-05): falla por issues históricos fuera de este ajuste (`no-explicit-any` en servicios legacy, reglas React hooks/purity y variables sin uso en módulos existentes). No se observaron errores específicos de los archivos nuevos/modificados en el log.

---

## Previous handoff entries

## Update 2026-06-05 (mock ADMIN para pruebas con API Gateway)

### Estado actual
- Se implementó un mock temporal de autenticación para pruebas de integración con API Gateway.
- Al cargar el aplicativo, `AuthProvider` fuerza una sesión `SAPP` con rol `ADMIN`, por lo que `/` inicia directamente en la pantalla de inicio y `/login` redirige al home al detectar sesión autenticada.
- El mock se persiste en `localStorage` usando la clave existente `SAPP_AUTH_SESSION`.
- El token del mock es `NO_TOKEN`; `sessionStore.getToken()` lo filtra y devuelve `null`, por lo que el cliente HTTP no adjunta un Bearer falso a las llamadas contra backend/gateway.
- El botón de cerrar sesión limpia la sesión y, mientras `ENABLE_GATEWAY_AUTH_MOCK` esté en `true`, reconstruye inmediatamente la sesión ADMIN mock para evitar volver a la pantalla de login durante estas pruebas.

### Archivos modificados
- `src/context/Auth/mockGatewaySession.ts`: nuevo artefacto con `ENABLE_GATEWAY_AUTH_MOCK = true` y la sesión ADMIN mock.
- `src/context/Auth/AuthContext.tsx`: inicializa y persiste el mock al arranque; ajusta `logout` para mantener el bypass del login mientras dure la prueba.
- `src/context/Auth/context.ts` y `src/context/Auth/useAuth.ts`: separan el objeto `AuthContext` del provider para cumplir `react-refresh/only-export-components` en el lint puntual.
- `src/context/Auth/types.ts` y `src/components/ModuleLayout/ModuleLayout.tsx`: tipado de `estudiante.foto` para el avatar de usuario.
- `src/modules/admisiones/api/evaluacionAdmisionService.ts`, `src/modules/admisiones/api/finalizarEvaluacionService.ts`, `src/modules/admisiones/services/convocatoriaProfesoresMockService.ts`, `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx` y `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`: correcciones TypeScript/lint puntuales para recuperar build verde.
- `README.md` y `HANDOFF.md`: trazabilidad, decisiones recientes, contratos y notas de entorno.

### Contratos / esquemas esperados
- Tipo usado: `AuthSession` con `kind: 'SAPP'`.
- Usuario mock: `username: 'admin-gateway-mock'`, `roles: ['ADMIN']`, `activo: true`, `persona.emailInstitucional: 'admin.gateway.mock@uis.edu.co'`.
- Persistencia: `localStorage['SAPP_AUTH_SESSION']`.
- Token: `NO_TOKEN` para no enviar `Authorization: Bearer ...` ficticio desde `src/shared/http/httpClient.ts`.

### Retos abiertos
1. Reemplazar este mock por el consumo real del API Gateway cuando esté disponible el contrato de identidad/autenticación.
2. Confirmar si el gateway entregará token Bearer, cookies/session headers o headers de identidad ya validados, para definir si `httpClient` debe adjuntar Authorization o delegar completamente en el gateway.
3. Definir mapeo final entre roles del gateway y roles internos SAPP (`ADMIN`, `COORDINADOR`, `SECRETARIA`, `PROFESOR`, `DOCENTE`, etc.).

### Próximos pasos recomendados
1. Iniciar con `npm run dev`, abrir `/` y verificar que no aparece la pantalla de login.
2. Revisar en DevTools que `SAPP_AUTH_SESSION` contiene rol `ADMIN` y token `NO_TOKEN`.
3. Validar navegación ADMIN: `/`, `/admisiones`, `/fechas`, `/coordinacion/estudiantes`, `/solicitudes`, `/matricula`.
4. Cuando llegue el contrato real del gateway, cambiar `ENABLE_GATEWAY_AUTH_MOCK` a `false` o eliminar el bypass y conectar el mapper real en `AuthProvider`.

### Entorno exacto y paquetes
- Runtime: Node.js + npm.
- Frontend: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2, TypeScript 5.9.3, Vite rolldown-vite 7.2.5, @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1.
- Sin venv/conda/poetry; no crear entornos Python ni copias paralelas. Usar `node_modules` de la raíz del repo.

### Resultados de pruebas + logs
- `npx eslint src/context/Auth/AuthContext.tsx src/context/Auth/context.ts src/context/Auth/useAuth.ts src/context/Auth/mockGatewaySession.ts src/context/Auth/types.ts src/components/ModuleLayout/ModuleLayout.tsx src/modules/admisiones/api/evaluacionAdmisionService.ts src/modules/admisiones/api/finalizarEvaluacionService.ts src/modules/admisiones/services/convocatoriaProfesoresMockService.ts src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`: OK el 2026-06-05.
- `npm run build`: OK el 2026-06-05; salida relevante: `✓ 237 modules transformed` y `✓ built in 709ms`.

---

# HANDOFF — SAPP Frontend

## Update 2026-06-02 (ajuste temporal: crear aspirante en convocatoria cerrada)

### Estado actual
- Ajuste temporal solicitado para pruebas: en `/admisiones/convocatoria/:convocatoriaId`, el botón `Crear aspirante` queda disponible aunque `convocatoriaCerrada` sea `true`. El usuario lo mencionó como “crear estudiante”, pero en esta pantalla el control afectado por la convocatoria cerrada es el botón `Crear aspirante`; el módulo `Admitir estudiante` conserva su bloqueo solo para admitidos ya convertidos.
- Se removió el bloqueo/alerta por convocatoria cerrada en `handleOpenCreateAspirante`, pero se mantienen las validaciones por `programaId`, `convocatoriaAdmisionId`, estado de carga y cupos excedidos.
- Hay comentarios `AJUSTE TEMPORAL PARA PRUEBAS (2026-06-02)` en `ConvocatoriaDetallePage` indicando que se debe revertir al finalizar pruebas.

### Archivos modificados
- `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`
- `README.md`
- `HANDOFF.md`

### Prompt sugerido para pedir la reversión
```text
Por favor revierte el ajuste temporal de pruebas del 2026-06-02 en el detalle de convocatoria: vuelve a ocultar o bloquear el botón Crear aspirante cuando convocatoriaCerrada sea true y restaura la alerta que impide abrir el modal si la convocatoria está cerrada. Mantén intactas las validaciones de programaId, convocatoriaAdmisionId, loading y cupos.
```

### Retos abiertos
1. Validar manualmente con una convocatoria cerrada que el modal de creación abre y el payload sigue enviando `convocatoriaAdmisionId` de la URL.
2. Revertir este ajuste antes de pasar a ambiente estable/productivo para respetar la regla original del proceso de admisiones.

### Próximos pasos recomendados
1. Probar `/admisiones/convocatoria/{id}` con una convocatoria cerrada y un usuario de coordinación/secretaría/admin.
2. Confirmar en Network que `POST /sapp/aspirante` conserva `{ programaId, convocatoriaAdmisionId }`.
3. Ejecutar el prompt de reversión cuando terminen las pruebas.

### Contratos / esquemas esperados
- Crear aspirante: `POST /sapp/aspirante`
- Payload esperado desde coordinación: `{ nombre, tipoDocumentoIdentificacionId, numeroDocumento, emailPersonal, numeroInscripcionUis, telefono, observaciones, programaId, convocatoriaAdmisionId }`
- No cambia el contrato backend; solo cambia el gating visual/cliente para pruebas.

### Entorno exacto y paquetes
- Runtime: Node.js + npm.
- Frontend: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2, TypeScript 5.9.3, Vite rolldown-vite 7.2.5, @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1.
- Sin venv/conda/poetry; no crear entornos Python ni copias paralelas. Usar `node_modules` de la raíz del repo.

### Resultados de pruebas + logs
- `npx eslint src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx` (2026-06-02): OK.
- `npm run build` (2026-06-02): falla por errores TypeScript preexistentes fuera de este ajuste (`ModuleLayout`, `evaluacionAdmisionService`, `finalizarEvaluacionService`, `convocatoriaProfesoresMockService`, `InscripcionAdmisionDetalle`, `InscripcionDocumentos`).

---

## Update 2026-06-02 (creación de aspirante con convocatoria de URL)

### Estado actual
- Corregido el flujo de **Crear aspirante** en `/admisiones/convocatoria/:convocatoriaId` para que el payload de `POST /sapp/aspirante` incluya explícitamente `convocatoriaAdmisionId` tomado de la URL.
- `ConvocatoriaDetallePage` parsea `convocatoriaId` con `useParams`, lo convierte a número y lo pasa al modal. El botón de creación queda deshabilitado si falta `programaId` o si el id de convocatoria de la URL no es válido.
- `CreateAspiranteModal` valida también `convocatoriaAdmisionId` antes de crear el aspirante y lo envía junto con `programaId`; después conserva el flujo existente de carga secuencial de documentos con `aspiranteId` + `inscripcionAdmisionId`.

### Archivos modificados
- `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`
- `src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx`
- `src/modules/admisiones/api/aspiranteCreateTypes.ts`
- `README.md`
- `HANDOFF.md`

### Contratos / esquemas esperados
- Crear aspirante: `POST /sapp/aspirante`
- Payload esperado desde coordinación: `{ nombre, tipoDocumentoIdentificacionId, numeroDocumento, emailPersonal, numeroInscripcionUis, telefono, observaciones, programaId, convocatoriaAdmisionId }`
- Para el caso reportado `http://localhost:5173/admisiones/convocatoria/66`, el payload debe incluir `convocatoriaAdmisionId: 66`.
- Respuesta usada por UI: `data.id` como `aspiranteId` y `data.inscripcionAdmisionId` como `tramiteId` para subir documentos.

### Retos abiertos
1. Confirmar con backend el nombre exacto del campo esperado para la convocatoria (`convocatoriaAdmisionId`). Si el DTO backend usa `convocatoriaId`, ajustar ambos lados o agregar mapeo backend compatible.
2. Probar manualmente la creación en `/admisiones/convocatoria/66` inspeccionando Network para verificar que el aspirante queda asociado a la convocatoria 66.

### Próximos pasos recomendados
1. Ejecutar `npm run build` y corregir cualquier error nuevo; si fallan errores históricos, documentar logs exactos.
2. Validar con backend/base de datos que la nueva inscripción queda asociada a la convocatoria de la URL y que el listado se refresca mostrando el aspirante en la misma pantalla.
3. Si backend rechaza propiedades desconocidas, coordinar el DTO backend antes de desplegar.

### Entorno exacto y paquetes
- Runtime: Node.js + npm.
- Frontend: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2, TypeScript 5.9.3, Vite rolldown-vite 7.2.5, @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1.
- Sin venv/conda/poetry; no crear entornos Python ni copias paralelas. Usar `node_modules` de la raíz del repo.

### Resultados de pruebas + logs
- `npx eslint src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx src/modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal.tsx src/modules/admisiones/api/aspiranteCreateTypes.ts` (2026-06-02): OK.
- `npm run build` (2026-06-02): falla por errores TypeScript preexistentes fuera de este ajuste (`ModuleLayout`, `evaluacionAdmisionService`, `finalizarEvaluacionService`, `convocatoriaProfesoresMockService`, `InscripcionAdmisionDetalle`, `InscripcionDocumentos`).
- `npm run lint` (2026-06-02): falla por issues históricos fuera de este ajuste (`no-explicit-any` en services legacy, reglas React hooks/purity, exports de context, variables sin uso); no reporta errores nuevos en `CreateAspiranteModal` ni `ConvocatoriaDetallePage`.

---

## Estado actual
- Implementado ajuste solicitado en la pantalla **/aspirante/documentos**:
  1. **Auto-carga** al seleccionar archivo (sin pulsar botón “Subir”).
  2. **Actualización inmediata del ítem** afectado y refresco del checklist sin recargar la página.
  3. **Validación previa** de tipo de archivo permitido (PDF, Word, imagen).
  4. **Layout de documentos** en grilla (2 por fila en desktop, 1 en móvil).

## Archivos tocados
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.css`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Confirmar con backend si desean restringir también por **tamaño máximo** de archivo en cliente para alinearlo con validaciones del API.
2. Confirmar si todos los tipos documentales de admisión comparten las mismas extensiones permitidas o si algunas requieren restricciones más específicas.

## Próximos pasos recomendados
1. Probar manualmente `/aspirante/documentos` con archivos válidos e inválidos para verificar mensajes inline.
2. Validar en UI que al cargar un documento el estado del card cambie a “En revisión” y se mantenga tras el refresco del checklist.
3. (Opcional) agregar pruebas unitarias al flujo de validación previa de archivo.

## Paths / artefactos clave
- Vista principal: `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`
- Estilos de grilla: `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.css`
- Componente de tarjeta: `src/components/DocumentUploadCard/DocumentUploadCard.tsx`

## Contratos/Esquemas esperados
- Upload de documento aspirante: `POST /sapp/document`
- Lectura checklist de documentos: `GET /sapp/document?codigoTipoTramite=1002&tramiteId={id}`
- Cambio de estado por validación al completar checklist: `PUT /sapp/inscripcionAdmision/cambioEstadoPorVal/{inscripcionId}`

## Entorno exacto y paquetes
- Runtime: Node.js + npm
- Frontend: React 19.2.0, TypeScript 5.9.3, Vite (rolldown-vite 7.2.5 alias)
- Sin venv/conda/poetry (no aplica en este repo)
- Para evitar entornos duplicados: usar el `node_modules` del repo y no crear entornos paralelos.

## Últimos resultados de pruebas + logs
- `npm run lint` (2026-05-19): **falla por issues históricos** no relacionados en módulos existentes (`no-explicit-any`, reglas de hooks, etc.).
- `npm run build` (2026-05-19): **pendiente de ejecución** en esta sesión.

## Comandos base
```bash
npm install
npm run dev
npm run build
npm run lint
```

---

## Update 2026-05-26 (limpieza de copia publica)

### Estado actual
- Eliminada la carpeta `SAPP-frontend-public/` y todo su contenido. Esa carpeta era una copia usada para publicar/subir un repositorio y ya no se requiere.
- El frontend activo sigue siendo la raiz del repo actual: `src/`, `public/`, `package.json`, `vite.config.ts`, etc.

### Archivos/rutas afectados
- Eliminado: `SAPP-frontend-public/`
- Actualizados para trazabilidad: `README.md`, `HANDOFF.md`

### Resultado de verificacion
- `Test-Path .\SAPP-frontend-public` devuelve `False`.
- `git status --short` muestra eliminaciones versionadas bajo `SAPP-frontend-public/` y modificaciones en `README.md`/`HANDOFF.md`.

### Notas para continuar
- No recrear `SAPP-frontend-public/`.
- No crear otro `node_modules` ni entorno paralelo dentro de copias del frontend; usar el `node_modules` existente en la raiz del repo.

---

## Update 2026-05-19 (esta sesión)

### Estado actual
- Ajustado el flujo de **/aspirante/documentos** para que la carga sea inmediata al seleccionar archivo (sin botón manual de carga en la tarjeta).
- El item de **Foto (`ANX-4`)** ahora se renderiza en fila completa en desktop (no en pares).
- Si el documento ya existe, el botón de selección se presenta como **Reemplazar foto/archivo**.

### Archivos modificados en esta sesión
- `src/components/DocumentUploadCard/DocumentUploadCard.tsx`
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.css`
- `README.md`
- `HANDOFF.md`

### Resultado de pruebas / logs recientes
- `npm run build` ejecutado el **2026-05-19**: falla por errores TypeScript preexistentes fuera del alcance de este ajuste (por ejemplo en `ModuleLayout`, `admisiones/api`, `InscripcionDocumentos`).


## Update 2026-05-19 (preselección investigación aspirante)

### Estado actual
- En `/aspirante/documentos`, cuando la sesión del aspirante trae `grupoInvestigacion` y `director` desde `consultaInfo`, la UI ahora:
  1. Preselecciona el **grupo de investigación** haciendo match contra `codigoNombre` del catálogo.
  2. Dispara la consulta de docentes del grupo seleccionado.
  3. Preselecciona el **director** en el segundo combo una vez llegan los docentes.

### Archivo modificado
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`

### Pruebas sugeridas
- Ingresar como aspirante con grupo/director ya registrados y validar que ambos combos aparezcan seleccionados sin interacción manual.
- Cambiar manualmente el grupo para comprobar que el combo de director se refresca según el nuevo grupo.

## Update 2026-05-20 (foto ANX-4 compacta en grilla)

### Estado actual
- En `/aspirante/documentos` se revierte el comportamiento de tarjeta completa para foto.
- La grilla de requisitos vuelve a **2 tarjetas por fila en desktop** (sin excepción para ANX-4).
- La foto ahora se muestra como **miniatura compacta** dentro de la fila de estado del card, con tamaño fijo para mantener altura homogénea respecto a otras tarjetas.

### Archivos modificados
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.css`
- `src/components/DocumentUploadCard/DocumentUploadCard.tsx`
- `src/components/DocumentUploadCard/DocumentUploadCard.css`

### Pruebas sugeridas
- Validar en desktop que ANX-4 se muestre en la misma grilla de 2 columnas que el resto.
- Cargar/reemplazar una foto y verificar que la miniatura permanezca alineada sin expandir la altura del card.


## Update 2026-05-20 (alineación fina de tarjetas con foto)

### Estado actual
- Se aplicó ajuste de alineación para que la tarjeta de **Foto (ANX-4)** no incremente la altura respecto a otras tarjetas.
- La miniatura se redujo a `2.5rem` y se forzó truncado (`ellipsis`) del nombre de archivo para evitar saltos de línea que desalinean filas.

### Archivos modificados
- `src/components/DocumentUploadCard/DocumentUploadCard.css`
- `SAPP-frontend-public/src/components/DocumentUploadCard/DocumentUploadCard.css`

### Validación visual esperada
- Desktop: tarjetas de la misma fila con alturas más homogéneas incluso con ANX-4 cargada.
- El nombre del archivo no debe romperse a múltiples líneas en la fila de estado.



## Update 2026-05-22 (mockup UI detalles inscripción aspirante)

### Estado actual
- Se ajustó la composición visual de la pantalla `/aspirante/documentos` con foco en el mockup compartido:
  1. Cabecera tipo ficha con avatar, nombre, badge de estado, metadatos y bloque lateral de fecha.
  2. Ajustes de espaciado y densidad visual en el bloque de “Carga de documentos del aspirante”.
  3. Corrección menor de sintaxis en `AspiranteDocumentosPage.tsx` (paréntesis sobrante en `useMemo`).

### Archivos modificados
- `src/components/AspiranteLayout/AspiranteLayout.tsx`
- `src/components/AspiranteLayout/AspiranteLayout.css`
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.css`
- `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`
- `README.md`
- `HANDOFF.md`

### Resultados de pruebas (esta sesión)
- `npm run build` (2026-05-22): falla por errores TypeScript preexistentes fuera del alcance de este ajuste visual (ModuleLayout/admisiones/inscripción documentos).

### Notas de entorno
- No crear nuevos entornos virtuales; usar `node_modules` del repo actual.
- Stack vigente para esta sesión: npm + Vite + React 19 + TypeScript 5.9.


## Update 2026-05-22 (ajuste header detalles inscripción aspirante)

### Estado actual
- En `/aspirante/documentos` se aplicó el ajuste visual solicitado en cabecera de detalle:
  1. Botón **Cerrar sesión** movido fuera del aside de fecha y ubicado arriba a la derecha.
  2. Tarjeta **Fecha de inscripción** compactada para que no crezca verticalmente.
  3. Reducción de separación vertical entre bloques de metadatos (inscripción, documento, grupo, director, etc.) para un layout más junto.

### Archivos modificados
- `src/components/AspiranteLayout/AspiranteLayout.tsx`
- `src/components/AspiranteLayout/AspiranteLayout.css`
- `README.md`
- `HANDOFF.md`

### Pruebas ejecutadas
- `npm run build` (2026-05-22): falla por errores TypeScript preexistentes fuera del alcance de este ajuste visual.


## Update 2026-05-26 (admitir aspirantes -> estudiante)

### Estado actual
- En `ConvocatoriaDetalle` se incorporo la seccion **Admitir aspirantes** con lista de aspirantes en estado `ADMITIDO`.
- La seccion solo aparece si la convocatoria esta cerrada o si existe al menos un admitido.
- Desde la tabla se puede seleccionar un aspirante admitido, diligenciar `codigoEstudiante` y `correoInstitucional`, y confirmar admision para llamar `POST /api/v1/estudiantes` (mock).
- Al responder OK, el aspirante queda marcado como `CONVERTIDO` en UI y se deshabilita reintento de conversion sobre ese registro.

### Archivos modificados
- `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`
- `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.css`
- `src/modules/admisiones/api/estudianteAdmisionService.ts`
- `src/modules/admisiones/api/types.ts`
- `README.md`
- `HANDOFF.md`

### Contrato/endpoint
- `POST /api/v1/estudiantes`
- Payload UI: `{ aspiranteId, programaId, periodoAcademico, codigoEstudiante, correoInstitucional }`
- Response esperada: `{ estudianteId, estado, fechaCreacion }`

### Resultado de pruebas
- `npm run build` (2026-05-26): falla por errores TypeScript preexistentes fuera de este ajuste (ModuleLayout/admisiones services/inscripcion documentos).

---

## Update 2026-06-05 — Rediseño `/coordinacion/estudiantes/:estudianteId`

### Estado actual
- Implementado el rediseño visual de la pantalla de detalle del estudiante como perfil académico tipo dashboard.
- Se conserva `ModuleLayout`, por lo que siguen intactos el sidebar SAPP y el header superior con usuario autenticado.
- El flujo desde el listado ahora navega con estado de React Router: `state: { estudiante }`, permitiendo pintar el perfil antes de completar consultas adicionales.
- El detalle no depende únicamente del state: si se recarga la URL o se accede directamente, usa `getEstudianteById(estudianteId)` como fallback.

### Archivos tocados
- `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`
- `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.css`
- `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`
- `src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx`
- `src/modules/estudiantes/services/estudiantesMockService.ts`
- `src/modules/estudiantes/types.ts`
- `README.md`
- `HANDOFF.md`

### Componentes / estructura esperada
- `StudentProfileHeader`: card principal con foto, nombre, código UIS, programa/sigla, estado, cohorte, correo y documento.
- `StudentAcademicStats`: grid de mini cards para documento, estado, fecha ingreso, fecha egreso, promedio, créditos aprobados, créditos pendientes y cohorte.
- `StudentDetailTabs`: tabs visuales Matrículas / Admisión / Solicitudes.
- `AdmissionSummaryCard`: resumen del proceso de admisión con estado, fechas y puntaje.
- `DocumentCard` + `DocumentGrid`: cards responsivas de documentos con badge de estado y acciones Ver/Descargar.

### Contratos / esquemas esperados
- Listado estudiantes coordinación: `GET /sapp/estudiantes/consulta?programaId={id}&egresados=false`.
- La respuesta de estudiante puede incluir `estudiante.foto.contenidoBase64`; el detalle renderiza `data:image/png;base64,{contenidoBase64}` cuando está presente.
- Detalle complementario:
  - Matrículas: `getMatriculasByEstudiante(estudianteId)`.
  - Admisión: `getAdmisionesByAspirante(idAspirante)` y documentos de trámite `codigoTipoTramite=1002`.
  - Solicitudes: `getSolicitudesByEstudiante(estudianteId)`.
- Documento esperado: `documentoCargado`, `documentoUploadedResponse.nombreArchivoDocumento`, `base64DocumentoContenido`/`contenidoBase64`, `mimeTypeDocumentoContenido`/`mimeType`; si no hay base64, las acciones se ocultan y se muestra pendiente.

### Retos abiertos
1. Validar manualmente con backend real que `estudiante.foto.contenidoBase64` llega también al acceder desde cache/listado y que los documentos de admisión entregan base64 para habilitar Ver/Descargar.
2. Confirmar si el backend expondrá `fechaEgreso`; el frontend ya muestra “—” cuando no llega.
3. Si se requiere una sigla de programa distinta de `DCC`/`MISI`, ajustar `getProgramaDisplay` o añadir campo explícito desde backend.

### Próximos pasos recomendados
1. Levantar backend + frontend y abrir `http://localhost:5173/coordinacion/estudiantes` con rol `COORDINACION` o `ADMIN`.
2. Entrar a “Ver perfil” y confirmar que el encabezado se pinta inmediatamente con `navigate state`.
3. Recargar `http://localhost:5173/coordinacion/estudiantes/{id}` y confirmar fallback por servicio.
4. Revisar tab **Admisión**: resumen arriba y documentos en grilla, sin bullets.
5. Probar botones **Ver** y **Descargar** con un documento cargado.

### Entorno exacto y paquetes
- Runtime: Node.js + npm en la raíz `/workspace/SAPP-frontend`.
- Frontend: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2, TypeScript 5.9.3, Vite rolldown-vite 7.2.5, @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1.
- Sin venv/conda/poetry; no crear entornos Python ni copias paralelas. Usar `node_modules` y `package-lock.json` del repo.

### Resultados recientes de pruebas + logs
- `npx tsc --noEmit --pretty false` (2026-06-05): OK; solo advertencia npm `Unknown env config "http-proxy"`.
- `npm run build` (2026-06-05): OK; build generado con `rolldown-vite v7.2.5`, 241 módulos transformados, assets `dist/assets/index-C0xBaWQF.css` y `dist/assets/index-DMMnH4gn.js`.
- `npm run lint` (2026-06-05): falla por 12 errores históricos no relacionados en `src/api/*Service.ts`, `src/app/routes/protectedRoute.tsx`, `src/modules/admisiones/*`, `src/modules/documentos/*`, `src/modules/solicitudes/*`; no se observaron errores nuevos en los archivos del rediseño.

---

## Update 2026-06-05 — Detalle coordinación estudiante con endpoint documental único

### Estado actual
- Implementado ajuste en `/coordinacion/estudiantes/:id` para que las secciones documentales de **Admisión** y **Matrículas** se construyan desde `GET /sapp/document/by-estudiante/{codigoEstudianteUis}`.
- Eliminada la precarga de contenido base64 en la entrada a la pantalla: `GET /sapp/document/{documentoId}` se ejecuta únicamente en botones **Ver** y **Descargar**.
- La consulta principal de documentos se protege con `loadedDocumentsCodeRef` para evitar disparos repetidos por renders cuando el código UIS no cambia.
- El modelo `EstudianteCoordinacion` ahora conserva opcionalmente `codigoEstudianteUis`, y el mapper de estudiantes lo llena desde la respuesta backend.

### Archivos tocados
- `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`
- `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.css`
- `src/modules/documentos/api/documentosService.ts`
- `src/modules/estudiantes/types.ts`
- `src/modules/estudiantes/services/estudiantesMockService.ts`
- `README.md`
- `HANDOFF.md`

### Contratos / schemas esperados
- Metadata por estudiante:
  - `GET /sapp/document/by-estudiante/{codigoEstudianteUis}`
  - Envelope: `{ ok: boolean, message: string, data: DocumentosEstudianteGrupoDto[] }`
  - Grupo: `{ tipoTramite: string | null, periodo: string | null, tramiteId: number | null, documentos: DocumentoEstudianteMetadataDto[] }`
  - Documento metadata: `{ id, estado, fechaCarga, mimeType, nombreArchivo, secuencia, tamanoBytes, tipoDocumento, tipoDocumentoTramiteId, version }`
- Documento completo bajo demanda:
  - `GET /sapp/document/{documentoId}`
  - Envelope: `{ ok: boolean, message: string, data: DocumentoCompletoDto }`
  - Campos usados por UI: `contenidoBase64`, `mimeType`, `nombreArchivo`, `id`.

### Reglas de transformación implementadas
- Admisión:
  1. Filtrar `ADMISION_ASPIRANTE` y `ADMISION_COORDINACION`.
  2. Mostrar primero aspirante y luego coordinación.
  3. Ordenar internamente por `tipoDocumentoTramiteId`, `secuencia`, `id`.
- Matrículas:
  1. Filtrar `MATRICULA` y `MATRICULA_PRIMERA_VEZ`.
  2. Agrupar por `periodo`; `null` usa clave interna `__SIN_PERIODO__` y se pinta como “Matrícula sin periodo”.
  3. Ordenar periodos por formato `YYYY-N`, de menor a mayor; null al final.
  4. Ordenar documentos del periodo por `tipoDocumentoTramiteId`, `secuencia`, `id`.

### Retos abiertos
1. Validar manualmente contra backend real que `/sapp/document/by-estudiante/{codigoEstudianteUis}` no devuelve `contenidoBase64` y que los campos de metadata coinciden exactamente con los tipos frontend.
2. Confirmar si el tab **Solicitudes** debe recuperar datos por un endpoint agregado similar o permanecer sin recarga documental para evitar múltiples llamados.
3. Si se requiere conservar información no documental de solicitudes, crear un servicio liviano que no cargue documentos ni contenido base64.

### Próximos pasos recomendados
1. Probar navegación desde el listado de estudiantes para confirmar que `navigate state` trae `codigoEstudianteUis` o, como mínimo, `codigo` UIS normalizado.
2. Probar recarga directa en `/coordinacion/estudiantes/:id` y verificar en Network: una llamada a `/sapp/document/by-estudiante/{codigo}` después de resolver estudiante.
3. Probar botones **Ver** y **Descargar** con PDF e imagen; ambos deben llamar `/sapp/document/{documentoId}` solo al click.
4. Si el navegador bloquea `window.open`, considerar visor modal/iframe para PDF.

### Entorno exacto y paquetes
- Runtime: Node.js + npm desde la raíz `/workspace/SAPP-frontend`.
- React `^19.2.0`, React DOM `^19.2.0`, React Router DOM `^7.9.2`.
- TypeScript `~5.9.3`, ESLint `^9.39.1`, `@vitejs/plugin-react-swc` `^4.2.2`.
- Vite: override `vite -> npm:rolldown-vite@7.2.5`.
- Sin venv/conda/poetry; no crear entornos Python ni copias paralelas. Usar `node_modules` existente del repo.

### Resultados recientes de pruebas + logs
- `npx eslint src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx src/modules/documentos/api/documentosService.ts src/modules/estudiantes/types.ts src/modules/estudiantes/services/estudiantesMockService.ts` (2026-06-05): OK; npm imprimió warning no bloqueante `Unknown env config "http-proxy"`.
- `npm run build` (2026-06-05): OK; `tsc -b && vite build` completó y generó `dist/`.
- Intento de screenshot (2026-06-05): no se pudo generar porque el paquete `playwright` no está instalado en el repo (`ERR_MODULE_NOT_FOUND`). No instalar dependencias solo para esto sin acordarlo con el equipo.
- `npm run lint` (2026-06-05): falla por issues históricos fuera de este ajuste (`no-explicit-any` en `src/api/*Service.ts`, reglas `react-hooks/purity` / `set-state-in-effect`, variables sin uso y `no-empty-object-type`). No reportó errores nuevos en los archivos tocados del detalle de estudiante.

---

## Update 2026-06-05 — Carga de documentos pendientes en `/coordinacion/estudiantes/:estudianteId`

### Estado actual
- Implementado ajuste solicitado para la pantalla `http://localhost:5173/coordinacion/estudiantes/27` y equivalentes.
- En las cards documentales de **Matrículas** y **Admisión**, si el documento viene pendiente (`id: null`, sin `nombreArchivo`) pero el item trae `tipoDocumentoTramiteId` y el grupo documental trae `tramiteId`, se habilita el botón **Cargar documento**.
- Al seleccionar archivo, la UI sube inmediatamente el documento con `POST /sapp/document`, muestra loading por card y refresca `GET /sapp/document/by-estudiante/{codigoEstudianteUis}` para reemplazar el estado pendiente por la metadata actualizada.
- Si falta `tramiteId`, `tipoDocumentoTramiteId` o `usuarioCargaId`, se muestra error inline y no se intenta subir.

### Archivos tocados
- `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`
- `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.css`
- `src/modules/documentos/api/documentosService.ts`
- `README.md`
- `HANDOFF.md`

### Contratos / esquemas esperados
- Consulta metadata: `GET /sapp/document/by-estudiante/{codigoEstudianteUis}`.
- Grupo documental esperado: `{ tipoTramite: string | null, periodo: string | null, tramiteId: number | null, documentos: DocumentoEstudianteMetadataDto[] }`.
- Documento pendiente esperado dentro del grupo:
  ```json
  {
    "documentoCargado": false,
    "estado": null,
    "fechaCarga": null,
    "id": null,
    "mimeType": null,
    "nombreArchivo": null,
    "obligatorio": true,
    "secuencia": null,
    "tamanoBytes": null,
    "tipoDocumento": "Pago_Poliza",
    "tipoDocumentoTramiteId": 16,
    "version": null
  }
  ```
- Carga: `POST /sapp/document` con payload del servicio compartido `uploadDocument`:
  - `tipoDocumentoTramiteId`: del documento pendiente.
  - `tramiteId`: del grupo que contiene el documento.
  - `usuarioCargaId`: `Number(session.user.id)` cuando la sesión es `SAPP`.
  - `aspiranteCargaId`: `null`.
  - `contenidoBase64`, `mimeType`, `tamanoBytes`, `checksum`: derivados del archivo seleccionado.
- Salida esperada: backend responde `{ ok: true, message, data }`; el frontend no confía en el response para pintar la card y vuelve a consultar el checklist por estudiante.

### Resultados recientes de pruebas + logs
- `npx tsc --noEmit --pretty false` (2026-06-05): OK; solo advertencia npm `Unknown env config "http-proxy"`.
- `npm run build` (2026-06-05): OK; build generado con `rolldown-vite v7.2.5`, 240 módulos transformados, assets `dist/assets/index-D7grqMCP.css` y `dist/assets/index-4Nip-cwe.js`.
- `npm run lint` (2026-06-05): falla por 12 errores históricos no relacionados y 1 warning en archivos fuera del ajuste (`src/api/*Service.ts`, `protectedRoute.tsx`, admisiones, solicitudes, etc.). No aparecieron errores nuevos en `EstudianteDetalleCoordinacionPage` ni `documentosService.ts`.
- Intento de screenshot (2026-06-05): `npm run dev -- --host 127.0.0.1` levantó Vite, pero el script de captura con Playwright falló porque `playwright` no está instalado en el repo (`ERR_MODULE_NOT_FOUND`).

### Retos abiertos
1. Validar manualmente con backend real que todos los grupos devueltos por `GET /sapp/document/by-estudiante/{codigoEstudianteUis}` incluyen `tramiteId`; sin ese dato la UI no puede asociar un documento pendiente al trámite correcto.
2. Confirmar con backend si Coordinación/Admin puede cargar documentos de matrícula/admisión con `usuarioCargaId` y `aspiranteCargaId: null` para todos los tipos de trámite.
3. Si se requiere restringir extensiones por tipo documental, mover el `accept` actual de la card a configuración por `tipoDocumentoTramiteId`.

### Próximos pasos recomendados
1. Levantar backend + frontend y abrir `http://localhost:5173/coordinacion/estudiantes/27` con usuario `ADMIN` o `COORDINACION`.
2. En Network, confirmar que el documento pendiente `Pago_Poliza` está dentro de un grupo con `tramiteId` no nulo.
3. Pulsar **Cargar documento**, seleccionar un PDF o imagen válida y verificar `POST /sapp/document`.
4. Confirmar que después del POST se ejecuta de nuevo `GET /sapp/document/by-estudiante/{codigoEstudianteUis}` y la card muestra nombre de archivo + acciones **Ver**/**Descargar**.

### Entorno exacto y paquetes
- Runtime: Node.js + npm desde `/workspace/SAPP-frontend`.
- Frontend: React 19.2.0, React DOM 19.2.0, React Router DOM 7.9.2.
- Tooling: TypeScript 5.9.3, Vite override `rolldown-vite@7.2.5`, @vitejs/plugin-react-swc 4.2.2, ESLint 9.39.1, typescript-eslint 8.46.4.
- Sin venv/conda/poetry; no crear entornos Python ni duplicar `node_modules`. Usar `npm install` solo en la raíz del repo si faltan dependencias.

## Handoff update — 2026-06-06 — Visual detail for admission call applicants

### Current status
- Implemented the visual redesign for `/admisiones/convocatoria/:id` in `src/pages/ConvocatoriaDetalle`.
- The page now shows **Aspirantes inscritos** as the primary title, convocatoria context as chips, a four-card summary metrics row, and a horizontal applicants board with scroll buttons.
- The applicant card component used by this screen now presents a student-card-like visual treatment through `applicant-card*` classes and shows `fechaInscripcion` as date only (`YYYY-MM-DD`) with safe fallback `—`.
- The user explicitly requested not to include the **Nuevo hoy** metric, so it is intentionally absent.

### Files changed / artifacts
- `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`: layout, header hierarchy, metrics derivation, horizontal board `useRef`, scroll controls, empty state copy.
- `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.css`: page-scoped visual styles for header, chips, metrics, horizontal board, scrollbar, responsive behavior and empty state.
- `src/modules/admisiones/components/StudentCard/StudentCard.tsx`: date-only formatter and applicant-card class names; no service or navigation changes.
- `src/modules/admisiones/components/StudentCard/StudentCard.css`: visual redesign of applicant cards with fixed horizontal-card width, photo/placeholder area, badges, metadata and footer.
- `README.md` and `HANDOFF.md`: updated traceability notes for this work.

### Contracts and expected outputs
- Input DTO remains `InscripcionAdmisionDto` with fields already used by the screen: `id`, `aspiranteId`, `nombreAspirante`, `estado`, `fechaInscripcion`, `puntajeTotal`, `posicion_admision`/`posicionAdmision`, `periodoAcademico`, `programaAcademico`, `numeroDocumento`/`cedula`, `emailPersonal`/`correo`, `telefono`, and optional `foto` with base64 content.
- Convocatoria context still comes from route state (`periodoLabel`, `periodoAcademico`, `programaNombre`, `programaId`, `cupos`) with fallback to first inscription and `ConvocatoriaAdmisionDto` from `getConvocatoriasAdmision()`.
- `Crear aspirante` still opens `CreateAspiranteModal` with the current `programaId` and `convocatoriaAdmisionId`.
- `Ver inscripción` still navigates to `/admisiones/convocatoria/{convocatoriaId}/inscripcion/{inscripcion.id}` and passes the same route state.

### Recent test results / logs
- `npm run build`: PASS. Build completed with `rolldown-vite v7.2.5`, 239 transformed modules, and generated `dist/index.html`, CSS and JS assets.
- `npx eslint src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx src/modules/admisiones/components/StudentCard/StudentCard.tsx`: PASS.
- `npm run lint`: FAIL due pre-existing repository-wide lint issues outside this change, including `no-explicit-any` in `src/api/*Service.ts`, React purity/set-state-in-effect warnings/errors in protected/admisiones/solicitudes routes/components, unused vars in mocks/services, and empty object interfaces in solicitudes types.

### Environment / package versions
- Use the existing Node/npm environment in the repository; do **not** create venv/conda/poetry environments because this is a Vite frontend.
- `package.json` versions at handoff: React `^19.2.0`, React DOM `^19.2.0`, React Router DOM `^7.9.2`, TypeScript `~5.9.3`, `rolldown-vite@7.2.5` via `vite`, `@vitejs/plugin-react-swc@^4.2.2`, ESLint `^9.39.1`, `typescript-eslint@^8.46.4`.
- Commands used from repo root: `npm run build`, `npm run lint`, and targeted `npx eslint src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx src/modules/admisiones/components/StudentCard/StudentCard.tsx`.

### Open challenges / next steps
- If a browser is available in a future environment, capture a screenshot of `/admisiones/convocatoria/:id` with real/mock data because this was a perceptible visual change.
- Decide whether to expose a program code/código field in the admission DTOs if the UI must show a chip such as `61204 - DCC`; no new backend contract was introduced in this visual-only change.
- Repository-wide lint remains blocked by unrelated pre-existing issues; fix those separately before treating `npm run lint` as a full quality gate.

## Handoff 2026-06-17 — API relativa y proxy local

### Estado actual
- El cliente HTTP centralizado usa `VITE_API_URL`, con fallback transitorio a `VITE_API_BASE_URL` y default `/api/sapp`.
- Los servicios existentes pueden seguir enviando paths heredados `/sapp/...`; el cliente los normaliza para que el navegador llame `/api/sapp/...` cuando la base termina en `/sapp`.
- `vite.config.ts` define proxy local para `/api/sapp` hacia `VITE_DEV_PROXY_TARGET` (`http://localhost:8080` por defecto). Si el target es local, remueve `/api/sapp` antes de reenviar.

### Entorno
- `.env`: `VITE_API_URL=/api/sapp`.
- `.env.local`: `VITE_API_URL=/api/sapp` y `VITE_DEV_PROXY_TARGET=http://localhost:8080` para desarrollo local.
- `.env.example`: documenta ambas variables.
- No crear venv/conda/poetry; usar Node.js + npm y `node_modules` en la raíz.

### Próximos pasos
1. Validar con backend local real que llamadas del navegador a `/api/sapp/*` llegan al backend como `/*` cuando el target es localhost.
2. Confirmar con infraestructura dev/prod el ruteo externo de `/api/sapp/*` hacia el backend correspondiente.

### Pruebas recientes
- `npm run build` intentado en esta sesión: bloqueado por entorno porque faltan tipos locales `vite/client` y `node` en `node_modules`. `npm install` quedó colgado al intentar restaurar dependencias y fue detenido; no modificar lockfile por este incidente.

## Handoff 2026-08-24 — UUID de docentes evaluadores en convocatorias

### Estado actual y decisiones
- La creación de convocatorias ya no consulta `GET /sapp/docentes?query=`: usa `GET /sapp/docentes/estado?skip=0` mediante el cliente HTTP centralizado.
- `ProfesorOption` conserva `uuid`, `id` nullable, `existeEnSapp` y `nombre`. La UI identifica las opciones, la selección, la eliminación y la asignación pendiente por `uuid`, no por el ID local de SAPP.
- La asociación envía un POST independiente por docente a `/sapp/evaluadorConvocatoria` con `evaluadorUuid`; esto permite elegir docentes cuyo `id` es `null` y `existeEnSapp` es `false`.
- No hubo cambio visual perceptible: se mantuvo el selector y los chips existentes, por lo que no se requirió screenshot.

### Archivos y contratos
- `src/modules/admisiones/services/profesoresMockService.ts`: consulta y normalización del catálogo.
- `src/modules/admisiones/mock/profesores.mock.ts`: contrato compartido `ProfesorOption` y datos mock compatibles.
- `src/modules/admisiones/services/convocatoriaProfesoresMockService.ts`: payload de asociación por UUID.
- `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx`: estado del formulario, selección, reintento y envío por UUID.
- Catálogo esperado: `GET /sapp/docentes/estado?skip=0` responde `{ ok, message, data: Array<{ existeEnSapp: boolean, id: number | null, nombre: string, uuid: string }> }`.
- Asociación esperada: `POST /sapp/evaluadorConvocatoria` recibe `{ evaluadorUuid: string, convocatoriaId: number }` y responde el envelope `{ ok, message, data }`.
- Las filas del catálogo sin nombre o sin UUID válido se omiten. Un `id: null` no impide seleccionar ni asociar al docente.

### Resultados recientes
- `npm run build` (2026-08-24): PASS; TypeScript y `rolldown-vite v7.2.5` compilaron 223 módulos y generaron `dist/assets/index-CvGWTBFJ.css` y `dist/assets/index-CaVFkm13.js`.
- `node --version`: `v24.15.0`; `npm --version`: `11.4.2` (npm muestra la advertencia no bloqueante `Unknown env config "http-proxy"`).
- `npm list --depth=0`: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, rolldown-vite 7.2.5, ESLint 9.39.2 y typescript-eslint 8.51.0.

### Retos y próximos pasos
1. Validar contra backend real que el endpoint de estado incluye a todos los docentes y acepta UUID de personas que todavía no existen en SAPP.
2. Crear una convocatoria con varios docentes y confirmar en Network un POST por cada UUID seleccionado.
3. Forzar un error parcial y verificar que el botón de reintento conserva y vuelve a enviar exactamente los UUID pendientes.

### Entorno
- Usar exclusivamente Node.js/npm y el `node_modules` existente en `/workspace/SAPP-frontend`; no crear venv, conda, poetry ni otro entorno Python.
- Ejecutar instalación, si fuese necesaria, una sola vez desde la raíz con `npm install`; no crear árboles de dependencias duplicados en subdirectorios.
# Update 2026-08-25 — Rol principal visible sin el rol genérico del sistema

## Estado actual y decisión
- `ModuleLayout`, encabezado compartido por la pantalla de inicio y los módulos, ya no presenta `DEFAULT-ROLES-EISI` como rol principal.
- La selección respeta el orden de `session.user.roles`, omite el rol genérico mediante comparación case-insensitive y muestra el primer rol funcional.
- Si solo llega el rol genérico o no llega ningún rol, la salida visible es `SIN ROL ASIGNADO`; no se inventa `ESTUDIANTE` como fallback.

## Paths, contrato y salida esperada
- Implementación: `src/components/ModuleLayout/ModuleLayout.tsx`.
- Entrada: `AuthUser.roles: string[]`, unión normalizada de `roles` y `clientRoles` del contrato `GET /api/sapp/inicio`.
- Ejemplo: para `['DEFAULT-ROLES-EISI', 'COORDINACION']`, el encabezado debe mostrar `COORDINACION`; para `['DEFAULT-ROLES-EISI']`, debe mostrar `SIN ROL ASIGNADO`.
- No se modificaron contratos HTTP, rutas, datasets, seeds ni assets.

## Retos y próximos pasos
- Validar visualmente con una sesión real que contenga el rol genérico seguido de cada rol funcional relevante.
- Si negocio define prioridades diferentes al orden enviado por el backend, acordar una tabla explícita de prioridad antes de reordenar roles en frontend.

## Entorno
- Reutilizar Node.js 24.15.0, npm 11.4.2 y el `node_modules` existente en `/workspace/SAPP-frontend`; no crear venv, conda, poetry ni otro árbol de dependencias.
- Paquetes instalados relevantes: React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.

## Pruebas recientes
- `npm run build` (2026-08-25): OK; TypeScript y rolldown-vite transformaron 223 módulos y completaron el build en 743 ms.
- `npx eslint src/components/ModuleLayout/ModuleLayout.tsx` (2026-08-25): OK; npm solo emitió el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-08-25): OK.
- `npm run lint` (2026-08-25): continúa fallando por 11 errores históricos y 1 warning fuera de los archivos modificados (`no-explicit-any`, estados síncronos en effects, parámetros mock sin uso, interfaces vacías y dependencia de hook).
- No se tomó screenshot automatizado porque el contenedor no dispone de Chromium, Chrome, Playwright ni Puppeteer; queda pendiente validar la salida con una sesión real.

## Update 2026-08-25 — Componentes de evaluación después de validar documentos

### Estado actual y decisión
- Corregido el flujo de coordinación/administración en `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/documentos`.
- El botón **Continuar con evaluación** inicia la evaluación, consulta hasta cinco veces su estado y solo navega a Hoja de vida después de recibir `STARTED`.
- La página hija notifica al detalle padre mediante `onEvaluacionStarted`. El padre cambia inmediatamente su estado local a `STARTED`, precarga Hoja de vida, Examen de conocimiento y Entrevistas, incrementa la versión de montaje y habilita los acordeones inferiores sin exigir una recarga del navegador.
- Si no se observa `STARTED` tras los reintentos, la UI conserva la pantalla documental y muestra un error; ya no navega hacia componentes que el detalle aún considera deshabilitados.

### Paths y artefactos
- `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`: confirmación del estado, manejo del timeout lógico y notificación al padre antes de navegar.
- `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`: contrato del outlet y refresco compartido del estado/componentes.
- `README.md` y `HANDOFF.md`: trazabilidad de la decisión.
- No se agregaron datasets, seeds, migraciones, variables de entorno ni dependencias.

### Contratos y salida esperada
- `iniciarEvaluacion(inscripcionId)` conserva el contrato HTTP existente para iniciar el proceso.
- `getEvaluacionEstado(inscripcionId)` debe resolver `{ status: 'STARTED' | 'NOT_STARTED', message?: string }` conforme al mapper existente.
- El nuevo contrato interno de React Router es `InscripcionDetalleOutletContext.onEvaluacionStarted: () => Promise<void>`.
- Salida esperada: tras una respuesta confirmada como `STARTED`, se abre `/hoja-vida` y quedan habilitados debajo los acordeones **Hoja de vida**, **Examen de conocimiento** y **Entrevistas**.

### Pruebas recientes y logs
- `npm run build` (2026-08-25): PASS; TypeScript y rolldown-vite 7.2.5 compilaron 223 módulos y generaron `dist/assets/index-Dnch33aw.js`.
- `git diff --check` (2026-08-25, antes de actualizar documentación): PASS.
- La validación visual con el backend real sigue pendiente; la pantalla requiere sesión institucional y datos de inscripción/documentos. Este cambio no introduce estilos visuales nuevos.

### Retos y próximos pasos
1. Validar con una inscripción cuyos documentos obligatorios estén aprobados que el POST/PUT de inicio sea seguido por la consulta de estado y la apertura automática de Hoja de vida.
2. Confirmar que Examen y Entrevistas se abren inmediatamente después, sin refrescar la pestaña.
3. Probar latencia del backend superior a 2,5 segundos; si es habitual, acordar aumentar o reemplazar el polling actual (5 intentos cada 500 ms).

### Entorno exacto; evitar duplicados
- Raíz única: `/workspace/SAPP-frontend`; usar el `node_modules` existente y ejecutar npm solo desde esta ruta.
- Node.js 24.15.0 y npm 11.4.2.
- React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, `@vitejs/plugin-react-swc` 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- No crear `venv`, conda, poetry, entornos Python ni árboles `node_modules` en subdirectorios.

## Update 2026-08-26 — Edición de fechas de convocatorias

### Estado actual y decisión
- La tabla de `/admisiones/convocatorias` (componente `ConvocatoriasAdmisionConfigPage`) ofrece **Editar** para todas las convocatorias, vigentes o cerradas, además de las acciones preexistentes.
- La acción abre un diálogo independiente que precarga `fechaInicio` y `fechaFin`, valida campos obligatorios y orden cronológico, y evita envíos si el usuario no cambió nada.
- El request es parcial: se incluye únicamente cada fecha cuyo valor cambió. Tras el éxito, el diálogo se cierra, se refresca `GET /sapp/convocatoriaAdmision` y aparece feedback en el listado.

### Paths, contrato y salida esperada
- UI: `src/pages/ConvocatoriasAdmisionConfig/ConvocatoriasAdmisionConfigPage.tsx`.
- Diálogo: `src/modules/admisiones/components/EditConvocatoriaFechasModal/`.
- Servicio/tipos: `src/modules/admisiones/api/convocatoriaAdmisionService.ts` y `convocatoriaAdmisionTypes.ts`.
- Request navegador: `PUT /api/sapp/convocatoriaAdmision/fechas/{id}` (el servicio conserva la ruta normalizada `/sapp/...`) con `{ fechaInicio?: string, fechaFin?: string }`, formato `YYYY-MM-DD` y al menos una propiedad.
- Respuesta esperada: envelope `{ ok: boolean, message: string, data: ConvocatoriaAdmisionDto | null }`. Ante `ok: false`, el diálogo queda abierto y presenta `message`; ante éxito, el listado vuelve a cargar.
- No se agregaron datasets, seeds, dependencias, migraciones ni variables de entorno.

### Retos y próximos pasos
1. Confirmar contra el backend real que el método del endpoint es `PUT` y que acepta un payload parcial, tal como el ejemplo entregado con solo `fechaFin`.
2. Validar permisos para coordinación/secretaría y la regla backend al reabrir efectivamente una convocatoria cerrada mediante una nueva fecha fin.
3. Probar visualmente el diálogo en modo claro/oscuro y móvil con sesión institucional y datos reales; el contenedor no dispone de navegador automatizable.

### Entorno exacto y resultados recientes
- Raíz única `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- Reutilizar el `node_modules` existente; no crear venv, conda, poetry, entornos Python ni dependencias en subdirectorios.
- `npm run build` (2026-08-26): PASS; 226 módulos transformados, assets `index-DWphQe2z.css` e `index-fIZdI5Os.js`, build en 739 ms.
- `npx eslint src/modules/admisiones/api/convocatoriaAdmisionService.ts src/modules/admisiones/api/convocatoriaAdmisionTypes.ts src/modules/admisiones/components/EditConvocatoriaFechasModal/EditConvocatoriaFechasModal.tsx src/pages/ConvocatoriasAdmisionConfig/ConvocatoriasAdmisionConfigPage.tsx` (2026-08-26): PASS.
- `git diff --check` (2026-08-26): PASS.
- Screenshot: pendiente por limitación de ambiente; `command -v chromium chromium-browser google-chrome playwright` no encontró navegador ni Playwright CLI.
# Update 2026-08-28 — Convocatorias cerradas no admiten nuevos aspirantes

## Estado actual y decisión
- El detalle `/admisiones/convocatoria/:convocatoriaId` sigue accesible para consultar una convocatoria cerrada y para crear estudiantes a partir de aspirantes admitidos.
- **Crear aspirante** queda deshabilitado cuando la convocatoria tiene `vigente === false` o está fuera del rango inclusivo `fechaInicio`/`fechaFin`. La pantalla muestra el mensaje “La convocatoria está cerrada. No se pueden crear nuevos aspirantes.”
- La regla se protege en tres niveles de UI: estado `disabled` del botón, guarda en `handleOpenCreateAspirante` y condición `open` de `CreateAspiranteModal`. Esto evita que un estado transitorio o una apertura previa deje enviar el formulario.

## Paths, contrato y salida esperada
- Implementación: `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`.
- Cálculo temporal reutilizado: `src/modules/admisiones/utils/convocatoriaEstado.ts`.
- Contrato: `GET ${VITE_API_URL || '/api/sapp'}/convocatoriaAdmision` devuelve convocatorias con `vigente`, `fechaInicio` y `fechaFin`; no cambió ningún endpoint ni DTO.
- Salida esperada: una convocatoria cerrada permite entrar y consultar aspirantes, pero nunca abrir el modal de alta de aspirante. La sección **Crear estudiantes admitidos** conserva su comportamiento.

## Retos y próximos pasos
1. Validar la pantalla con backend y sesión institucional, incluyendo cierre por `vigente: false`, fecha vencida y convocatoria abierta.
2. La regla debe imponerse también en backend para impedir llamadas POST directas; este repositorio solo puede garantizar el bloqueo de interfaz.
3. No hay seeds, datasets, migraciones ni dependencias nuevas.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry ni otro árbol de dependencias.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 228 módulos y generaron el build en 1.38 s.
- `npx eslint src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx` (2026-08-28): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-08-28): PASS.
- Screenshot automatizado pendiente: el contenedor no dispone de Chromium, Chrome ni Firefox, y la ruta requiere backend y sesión institucional.

---
# Update 2026-08-28 — Orden descendente del listado de actas

## Estado actual y decisión
- `/actas` ordena la respuesta completa de `GET /sapp/actas` antes de aplicar filtros y paginación local.
- El criterio primario es el código base (el valor de `codigo` sin el sufijo `-{año}`), en orden descendente y con comparación numérica; para el mismo código base, el año también se ordena de forma descendente. El código completo actúa como desempate estable.
- Ejemplo de salida esperada: `ACT-010-2025`, `ACT-002-2026`, `ACT-002-2024`, `ACT-001-2026`. El nombre del acta ya no interviene en el orden.

## Paths, contrato y próximos pasos
- Implementación: `src/pages/Actas/ActasPage.tsx`, funciones `getActaYear`, `getActaCode` y `compareActas`.
- Contrato sin cambios: `ActaDto.codigo` continúa siendo un `string` con formato esperado `ACT-{consecutivo}-{año}`; la pantalla tolera códigos sin sufijo anual y los desempata por el valor completo.
- No se agregaron endpoints, schemas, dependencias, seeds, datasets ni artefactos. Queda pendiente validar con datos reales si backend admite códigos base no numéricos y agregar pruebas unitarias cuando el proyecto incorpore Vitest.

## Entorno y pruebas de esta actualización
- Raíz única: `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Versiones verificadas: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npx eslint src/pages/Actas/ActasPage.tsx` (2026-08-28): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-08-28): PASS; TypeScript y rolldown-vite transformaron 232 módulos y generaron `dist/assets/index-CvPyPw3E.css` y `dist/assets/index-Dj342yfa.js` en 842 ms.
- `git diff --check` y `npm list --depth=0` (2026-08-28): PASS. No se tomó screenshot porque el cambio solo altera el orden de datos y su validación visual requiere backend, sesión institucional y registros de actas.

---
# Update 2026-09-02 — Márgenes verticales de la previsualización PDF

## Estado actual y decisión
- La conversión HTML → PDF de solicitudes de crédito condonable conserva el tamaño carta de `816 × 1056 px` (`612 × 792 pt`) y reserva `72 px` (`0.75 in`) de margen tanto arriba como abajo de cada página.
- El contenido útil por página es de `912 px`. Cada página toma el siguiente tramo consecutivo del render HTML y lo dibuja desde `y = 72`, evitando omisiones o duplicados al paginar.
- El cambio está limitado al conversor local. Si `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` responde un MIME distinto de HTML, el Blob del backend se conserva intacto.

## Paths, contrato y salida esperada
- Conversor: `src/modules/solicitudes/utils/htmlToPdf.ts`.
- Consumidor: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`.
- Entrada relevante: documento base64 con `mimeTypeDocumentoContenido: "text/html"` dentro de la respuesta de `POST /sapp/solicitudesAcademicas/pdf-previsualizacion`.
- Salida esperada: Blob `application/pdf` tamaño carta, con una franja blanca de `0.75 in` arriba y abajo en todas las páginas y sin perder segmentos del HTML entre una página y la siguiente.

## Retos y próximos pasos
1. Validar visualmente con la plantilla real y una solicitud de dos o más páginas que encabezados, firmas y párrafos tengan el espacio esperado.
2. La rasterización aún corta el flujo en el límite del área útil; si el dominio exige mantener bloques completos unidos, será necesario introducir reglas de salto basadas en elementos antes de rasterizar.
3. No se agregaron dependencias, datasets ni seeds.

## Entorno y pruebas de esta actualización
- Raíz única: `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Node.js 24.15.0 y npm 11.4.2; las versiones exactas de paquetes instalados permanecen documentadas en `README.md`.
- `npx eslint src/modules/solicitudes/utils/htmlToPdf.ts` (2026-09-02): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-02): PASS; TypeScript y rolldown-vite transformaron 233 módulos y generaron `dist/assets/index-CvPyPw3E.css` y `dist/assets/index-nM5AwOQ1.js` en 743 ms.
- `git diff --check` (2026-09-02): PASS.
- Screenshot automatizado pendiente por limitación del entorno: no hay Chromium, Chrome, Firefox, Playwright ni Puppeteer instalados, y la reproducción completa requiere backend y sesión institucional.

---

# Update 2026-09-02 — Base64 de imágenes y canvas seguro

## Estado actual y causa corregida
- Un JPEG base64 crudo comienza normalmente por `/9j/`. Si llega en `srcset` o en otro atributo de recurso sin prefijo `data:image/jpeg;base64,`, el navegador lo resuelve como una ruta relativa y genera una solicitud enorme a `GET /9j/...`, que termina en HTTP 414.
- Si cualquier recurso externo alcanza el SVG/`foreignObject`, el canvas puede quedar marcado como no confiable y `canvas.toDataURL()` lanza `SecurityError: Tainted canvases may not be exported`.
- El sanitizador ahora compacta tanto data URI como base64 crudo, elimina `srcset` y los restantes atributos de recursos no permitidos, y añade CSP al documento aislado (`default-src 'none'; img-src data:; style-src 'unsafe-inline'`).

## Paths, contrato y salida esperada
- Implementación: `src/modules/solicitudes/utils/htmlToPdf.ts`, antes de asignar `iframe.srcdoc`.
- El contrato HTTP no cambia. Las imágenes soportadas siguen siendo JPEG, PNG, GIF y WebP embebidas en base64.
- Salida esperada: no se producen solicitudes `/9j/...`; las firmas embebidas se conservan; el canvas permanece exportable y genera el Blob `application/pdf` con los márgenes verticales existentes.

## Retos, entorno y validación
- Validar con la respuesta real que originó el 414, inspeccionando Network para confirmar que no existe ninguna petición documental adicional durante la conversión.
- No se agregaron dependencias, seeds ni datasets. Reutilizar Node.js/npm y `node_modules` de `/workspace/SAPP-frontend`; no crear entornos Python.
- `npx eslint src/modules/solicitudes/utils/htmlToPdf.ts` (2026-09-02): PASS; únicamente se mostró el warning conocido de npm `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-02): PASS; TypeScript y rolldown-vite transformaron 233 módulos y generaron `dist/assets/index-CvPyPw3E.css` y `dist/assets/index-yef4x4Uf.js` en 725 ms.
- `git diff --check` (2026-09-02): PASS.
- La validación visual/HTTP con la respuesta real continúa pendiente porque requiere backend, sesión institucional y un navegador no disponible en este contenedor.

---
# Update 2026-09-02 — Previsualización de renovación de crédito condonable

## Estado actual y decisión de alcance
- El formulario de nueva solicitud reconoce exclusivamente `tipoSolicitudId === 12` como **RENOVACION CREDITO CONDONABLE** (catálogo informado: `tramiteId: 17`). Los campos nuevos no se muestran ni se envían para otros tipos; los demás créditos condonables mantienen el flujo previo de motivos.
- Para el tipo 12 se muestran modalidad, ciudad de expedición, lista dinámica de actividades, dirección, periodo académico de inicio (`AAAA-P`), intensidad horaria semanal y horas del semestre.
- Teléfono y correo no son editables ni se duplican como estado del formulario: se leen de `session.user.persona`; el correo prioriza `emailInstitucional`, luego `user.email` y finalmente `emailPersonal`. Si falta cualquiera, se informa el problema y se bloquea la previsualización.
- No se modificó el contrato de creación de una solicitud; este ajuste corresponde únicamente a la construcción del body de previsualización PDF.

## Paths, contrato y salida esperada
- UI y validación: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`.
- Estilos responsive: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.css`.
- Lectura de sesión y adaptación del callback: `src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx`.
- DTO HTTP: `src/modules/solicitudes/api/types.ts`; transporte sin cambio: `src/modules/solicitudes/api/solicitudesAcademicasService.ts`.
- Request: `POST ${VITE_API_URL || '/api/sapp'}/sapp/solicitudesAcademicas/pdf-previsualizacion`. Para tipo 12, el body esperado contiene `estudianteId`, `tipoSolicitudId`, `observaciones`, `modalidadId`, `ciudadExpedicionDocumento`, `actividadesCreditoCondonable`, `periodoAcademicoInicioCreditoCon`, `direccionEstudiante`, `telefonoEstudiante`, `correoEstudiante`, `intensidadHorariaSemanal`, `horasSemestre` y `solicitudHomologacionesAsignaturas: []`. No debe contener `motivos`.
- La respuesta continúa siendo `{ ok, message, data: PreviewSolicitudCreditoResponseDto[] }`, con compatibilidad para el objeto único legado. La salida visual sigue siendo uno o varios PDF seleccionables y cargables como documentos de la solicitud.

## Retos y próximos pasos
1. Validar con backend y sesión institucional que el catálogo entrega ID `12`, que teléfono/correo están poblados y que el POST omite `motivos` en este caso.
2. Confirmar con producto/backend si las actividades y demás datos de renovación deberán persistirse también al crear la solicitud; por ahora solo forman parte de la previsualización, tal como se solicitó.
3. Probar límites de intensidad/horas y periodos inválidos con un runner de componentes cuando se incorpore Vitest/React Testing Library.
4. Realizar validación visual en navegador autenticado; el contenedor no dispone de Chromium/Chrome y el formulario depende del gateway, por lo que no se generó captura automatizada.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`; Node.js 24.15.0 y npm 11.4.2. Reutilizar `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Paquetes instalados: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No se añadieron paquetes, seeds, datasets, schemas ni artefactos persistentes.
- `npm run build` (2026-09-02): PASS; 237 módulos transformados, `dist/assets/index-Dwn94egS.css` y `dist/assets/index-D8nYHMcl.js`.
- `npx eslint src/modules/solicitudes/api/types.ts src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx` (2026-09-02): PASS; solo apareció el warning conocido de npm sobre `http-proxy`.
- `npm run lint` (2026-09-02): FAIL por 11 errores y 1 warning preexistentes en archivos ajenos al cambio (`src/api/*Service.ts`, rutas de admisiones/coordinación, mocks, validación de documentos y tipos de solicitudes). Los archivos modificados pasan ESLint dirigido.
- `git diff --check` (2026-09-02): PASS.

---
# Update 2026-09-02 — Persistencia de firma de UsuarioSapp

## Estado actual y decisión
- En `/perfil`, seleccionar una imagen PNG/JPEG válida de hasta 2 MB muestra su vista previa y dispara inmediatamente la persistencia; ya no se guarda la firma en `localStorage` ni se requiere una segunda confirmación.
- El servicio usa el `user.id` de la sesión, que corresponde al ID principal de `UsuarioSapp`, y mantiene el transporte fuera del componente.
- Mientras el POST está activo se deshabilita el selector y se muestra **Guardando firma…**. Un error conserva la vista previa y habilita **Reintentar carga**; un éxito muestra confirmación y conserva la imagen durante la visita actual.

## Paths, contrato y salida esperada
- UI: `src/pages/Perfil/PerfilPage.tsx`.
- Servicio y DTO: `src/modules/perfil/services/firmaPerfilService.ts`.
- Request: `POST ${VITE_API_URL || '/api/sapp'}/firmaUsuario/{usuarioSappId}` con `Content-Type: application/json` y body `{ "contenidoFirma": "data:image/jpeg;base64,/9j/..." }` (PNG conserva `data:image/png;base64,...`). La normalización del cliente permite escribir la ruta como `/sapp/firmaUsuario/{id}` sin duplicar `/api/sapp`.
- La respuesta del POST no se usa como fuente de estado; cualquier respuesta HTTP exitosa completa la carga. Los errores HTTP se presentan en la tarjeta y permiten reintentar.
- No se añadieron dependencias, seeds, datasets, migraciones ni variables de entorno.

## Pendiente crítico y próximos pasos
1. **El backend todavía debe proporcionar el servicio que indique si el usuario ya tiene firma y devuelva su contenido.** Cuando exista, integrarlo al montar `/perfil` para mostrar la firma vigente en el selector; no volver a introducir una copia en `localStorage`.
2. Confirmar con backend el envelope/respuesta exactos del POST y si reemplaza de forma idempotente una firma anterior.
3. Validar con una sesión institucional real que `user.id` coincide con el `{usuarioSappId}` esperado y probar JPEG/PNG, error de red y reemplazo de firma.
4. Añadir pruebas de componente/servicio cuando el proyecto incorpore Vitest.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`; Node.js 24.15.0 y npm 11.4.2. Reutilizar el `node_modules` de esta raíz; no crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Paquetes principales instalados: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, ESLint 9.39.2 y typescript-eslint 8.51.0. Las versiones completas están en `README.md`.
- `npx eslint src/pages/Perfil/PerfilPage.tsx src/modules/perfil/services/firmaPerfilService.ts` (2026-09-02): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-02): PASS; TypeScript y rolldown-vite transformaron 237 módulos y generaron `dist/assets/index-ZvyW5o5r.css` y `dist/assets/index-CSK9kqD1.js` en 784 ms.
- `git diff --check` (2026-09-02): PASS.
- La validación HTTP y visual con datos reales permanece pendiente porque requiere backend y sesión institucional; la pantalla no recibió cambios de estilo.

---
# Update 2026-09-02 — Corrección de la ruta de períodos con fechas

## Estado actual y causa corregida
- `getPeriodosAcademicosWithFechas()` contenía dos espacios dentro del literal `'/  sapp/periodoAcademico/withFechas'`. El navegador los codificaba como `%20%20` y el backend intentaba resolver el recurso inexistente `/%20%20sapp/periodoAcademico/withFechas`.
- El literal ahora es `/sapp/periodoAcademico/withFechas`. El normalizador del cliente elimina el segmento `/sapp` cuando la base ya termina en `/sapp`, por lo que con la configuración predeterminada la URL del navegador es `/api/sapp/periodoAcademico/withFechas` (en producción: `https://sapp.eisi.online/api/sapp/periodoAcademico/withFechas`).

## Paths, contrato y salida esperada
- Servicio corregido: `src/modules/configFechas/api/periodoAcademicoService.ts`.
- Normalización compartida sin cambios: `src/shared/http/httpClient.ts`; base predeterminada: `src/api/config.ts`.
- Request: `GET ${VITE_API_URL || VITE_API_BASE_URL || '/api/sapp'}/periodoAcademico/withFechas`.
- Respuesta esperada: `{ ok: boolean, message: string, data: PeriodoAcademicoWithFechasDto[] }`. El servicio devuelve `data ?? []` si `ok` es verdadero y lanza el mensaje del backend si `ok` es falso.
- No se agregaron schemas, migraciones, dependencias, seeds, datasets ni artefactos.

## Próximos pasos y entorno
1. Verificar en Network, con backend y sesión institucional, que la configuración de fechas solicita exactamente `/api/sapp/periodoAcademico/withFechas` y recibe el envelope esperado.
2. Si vuelven a aparecer rutas con `%20`, buscar espacios dentro de los literales de cada servicio; no compensarlos creando rutas backend alternativas.
3. Reutilizar Node.js/npm y `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol de dependencias.

## Pruebas de esta actualización
- Entorno verificado: Node.js 24.15.0 y npm 11.4.2. Paquetes principales instalados: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npm list --depth=0` (2026-09-02): PASS; confirmó un único árbol de dependencias completo. npm mostró el warning conocido `Unknown env config "http-proxy"`.
- `npx eslint src/modules/configFechas/api/periodoAcademicoService.ts` (2026-09-02): PASS; npm mostró únicamente el mismo warning de configuración.
- `npm run build` (2026-09-02): PASS; TypeScript y rolldown-vite transformaron 237 módulos y generaron `dist/assets/index-ZvyW5o5r.css` y `dist/assets/index-wiudiPYW.js` en 1.01 s.
- `git diff --check` (2026-09-02): PASS.
- La verificación HTTP en producción sigue pendiente porque requiere backend y sesión institucional. No se tomó screenshot: el cambio corrige exclusivamente la URL de red y no produce una modificación visual perceptible.

---
# Update 2026-09-03 — Consulta y título de firma de UsuarioSapp

## Estado actual y decisiones
- `/perfil` consulta al montarse `GET /api/sapp/firmaUsuario/{usuarioSappId}`. Si existe una firma, precarga tanto la imagen como `titulo`; durante la consulta bloquea el selector y muestra **Cargando firma…**.
- El servicio acepta el envelope SAPP `{ ok, message, data }` y también el DTO directo para tolerar ambos formatos del gateway. Un `data` nulo se interpreta como usuario sin firma.
- El campo **Título** es obligatorio antes de seleccionar/reemplazar la imagen. El guardado inmediato ejecuta el POST con `{ titulo, contenidoFirma }`; un fallo conserva la previsualización y permite reintentar.
- No se usa `localStorage` para la firma y no se agregaron dependencias, seeds, datasets, variables de entorno ni artefactos persistentes.

## Paths, contratos y salida esperada
- Transporte/DTO: `src/modules/perfil/services/firmaPerfilService.ts`.
- Estado y UI: `src/pages/Perfil/PerfilPage.tsx`; estilos temáticos: `src/pages/Perfil/PerfilPage.css`.
- GET: `${VITE_API_URL || VITE_API_BASE_URL || '/api/sapp'}/firmaUsuario/{usuarioSappId}`. Respuesta esperada: `{ "ok": true, "message": "...", "data": { "titulo": "PhD.", "contenidoFirma": "data:image/jpeg;base64,/9j/..." } }`; también se tolera el DTO sin envelope y `data: null`.
- POST: la misma ruta con body `{ "titulo": "PhD.", "contenidoFirma": "data:image/jpeg;base64,/9j/..." }`. PNG conserva `data:image/png;base64,...`.
- Salida esperada: al entrar se ven el título y firma existentes; al elegir otra imagen con título diligenciado, se reemplaza y aparece **La firma se actualizó correctamente.**

## Retos y próximos pasos
1. Validar con backend/sesión institucional el envelope exacto del GET y el comportamiento cuando no hay firma (idealmente `200` con `data: null`; un `404` actualmente se presenta como error de consulta).
2. Confirmar que el POST reemplaza idempotentemente la firma existente y si el backend exige una longitud o catálogo específico para `titulo` (la UI limita a 100 caracteres).
3. Agregar pruebas de componente/servicio cuando se incorpore Vitest; hoy el repositorio no incluye runner de tests.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`. Reutilizar Node.js/npm y `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npm list --depth=0` (2026-09-03): PASS; único árbol completo, con el warning conocido de npm `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; 241 módulos transformados en 771 ms. Warning no bloqueante: chunk JS de 502.29 kB supera 500 kB.

---
# Update 2026-09-02 — Disponibilidad y período de creación de matrícula

## Estado actual y decisiones
- La pantalla de matrícula del estudiante ya consume el nuevo resultado sin matrícula de `GET /api/sapp/matriculaAcademica/vigente/estudiante/{estudianteId}`: `{ ok, message, data: { periodoId, puedeCrear } }`.
- `puedeCrear: false` es autoritativo: no se cargan ni muestran el formulario de materias, documentos o botón de confirmación. Se reutiliza `MatriculaClosedState` para mostrar **No hay fechas de matrícula habilitadas actualmente** y el `message` del backend.
- `puedeCrear: true` habilita el flujo. Antes de crear se repite el GET y el POST usa directamente el `periodoId` de esa respuesta reciente, evitando el valor fijo anterior (`1`) o un período obsoleto.
- Las respuestas con matrícula existente siguen mapeándose a `EXISTS`. Un booleano histórico `true` se rechaza porque no contiene el `periodoId` obligatorio; `false` aún se interpreta como ausencia de período activo.

## Paths, contratos y salida esperada
- Transporte y normalización: `src/modules/matricula/services/matriculaAcademicaService.ts`.
- Unión discriminada: `src/modules/matricula/types.ts`; `CAN_CREATE` incluye ahora `periodoId: number`.
- Orquestación/pantalla: `src/pages/Matricula/MatriculaPage.tsx`; estado cerrado: `src/modules/matricula/components/MatriculaClosedState/MatriculaClosedState.tsx`.
- GET esperado sin matrícula: `{ "ok": true, "message": "El estudiante no tiene matricula en el periodo vigente", "data": { "periodoId": 2, "puedeCrear": true } }`.
- POST esperado al confirmar ese caso: `/api/sapp/matriculaAcademica` con `{ estudianteId, periodoId: 2, asignaturas: [{ asignaturaId }] }`.
- Con `puedeCrear: false`, la salida esperada es únicamente la pantalla informativa de fechas cerradas; no debe poder enviarse el POST.

## Retos y próximos pasos
1. Validar ambos valores de `puedeCrear` con backend y sesión real de estudiante, incluyendo un cambio de período entre la carga de pantalla y la confirmación.
2. Confirmar si backend siempre entrega un `periodoId` numérico incluso cuando `puedeCrear` es `false`; el frontend solo lo exige para el caso `true`.
3. Agregar pruebas de componente/servicio cuando se incorpore Vitest. No hay runner de tests, seeds, datasets ni dependencias nuevas.

## Entorno y pruebas recientes
- Raíz única: `/workspace/SAPP-frontend`; usar Node.js/npm y reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol de dependencias.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.
- `npx eslint src/modules/matricula/services/matriculaAcademicaService.ts src/modules/matricula/types.ts src/pages/Matricula/MatriculaPage.tsx src/modules/matricula/components/MatriculaClosedState/MatriculaClosedState.tsx` (2026-09-02): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-02): PASS; TypeScript y rolldown-vite transformaron 237 módulos y generaron `dist/assets/index-ZvyW5o5r.css` y `dist/assets/index-b8jbBVol.js` en 838 ms.
- `git diff --check` (2026-09-02): PASS. La captura automatizada queda limitada por la ausencia de navegador y porque el estado requiere sesión/backend institucional.

---
# Update 2026-09-02 — Módulo de informes a dependencias

## Estado actual y decisiones
- `/coordinacion/reportes` está protegido para `COORDINADOR` y `ADMIN` y aparece como **Reportes** en el sidebar únicamente para dichos roles.
- Permite escoger `ADMISION`, `MATRICULA` o `CREDITOS_CONDONABLES`. Todos requieren `programaId` y `actaId`; admisión requiere `convocatoriaId`, mientras matrícula y créditos requieren `periodoId`.
- Los catálogos se cargan en paralelo desde los servicios reales. Las convocatorias se filtran localmente por `programaId`. El período predeterminado contiene la fecha actual según `fechaInicio`/`fechaFin`; si ninguno coincide, se usa el período más reciente.
- La generación sigue siendo mock y devuelve una referencia `MOCK-{tipo}-{timestamp}`. No descarga un archivo todavía.

## Paths, contratos y salida esperada
- Pantalla y estilos: `src/pages/Reportes/ReportesPage.tsx`, `src/pages/Reportes/ReportesPage.css`.
- Catálogo de programas: `src/modules/reportes/api/programaAcademicoService.ts`; se reutilizan los servicios de convocatorias, períodos y actas existentes.
- Mock: `src/modules/reportes/services/informesMockService.ts` recibe `{ tipoProceso, programaId, actaId, convocatoriaId? | periodoId? }` con IDs numéricos.
- Integración: `src/app/routes/index.tsx`, `src/components/Sidebar/Sidebar.tsx` y `src/pages/index.ts`.
- Salida esperada: admisión nunca ofrece convocatorias de otro programa; matrícula y créditos abren con el período actual seleccionado; el envío completo muestra confirmación y referencia mock.

## Retos y próximos pasos
1. Sustituir `generarInforme` por el endpoint real y acordar si la respuesta será descarga PDF, job asíncrono o documento persistido.
2. Confirmar si el backend debe filtrar actas por proceso, programa o período; actualmente se muestra el catálogo completo porque no se entregó ese criterio.
3. Agregar pruebas de componente cuando exista Vitest y validar visualmente claro/oscuro, móvil y con sesión institucional.

## Entorno y pruebas de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry ni un segundo entorno/dependency tree.
- No se agregaron paquetes, variables, seeds ni datasets. Las versiones exactas continúan documentadas en `README.md` y `package-lock.json`.
- La primera ejecución de `npm run build` detectó el import de tipo `FormEvent` no marcado como `type`; se corrigió antes de la validación final.
- `npx eslint src/pages/Reportes src/modules/reportes src/app/routes/index.tsx src/components/Sidebar/Sidebar.tsx src/pages/index.ts`: PASS (solo warning conocido de npm sobre `http-proxy`).
- `npm run build`: PASS; 242 módulos transformados, con warning no bloqueante por un chunk JS mayor a 500 kB.
- `git diff --check`: PASS. Screenshot pendiente: este contenedor no dispone de Chromium, Chrome ni Firefox y la ruta protegida necesita sesión/backend institucional.

---
# Update 2026-09-03 — Presentación del documento de identidad de estudiantes

## Estado actual y decisión
- Se corrigieron las tarjetas de `/coordinacion/estudiantes` y el encabezado de `/coordinacion/estudiantes/:estudianteId`: los valores sentinela `N/A` y `NA`, sin importar mayúsculas/minúsculas ni espacios, ya no se presentan como si fueran un tipo o número de documento real.
- `src/modules/estudiantes/utils/formatDocumentoIdentidad.ts` centraliza el contrato de presentación. Une tipo y número cuando ambos son válidos, muestra solo la parte disponible y devuelve `—` cuando no hay ningún dato utilizable.
- No cambió el contrato HTTP ni el mapper: el frontend sigue tolerando los fallbacks existentes y limpia los marcadores únicamente en la capa de presentación. No se agregaron dependencias, seeds ni datasets.

## Contrato y salida esperada
- Entradas `(tipoDocumento: "N/A", numeroDocumento: "1005324324")` o `(tipoDocumento: null, numeroDocumento: "1005324324")` producen `1005324324` tanto en listado como en detalle.
- Una entrada válida `(tipoDocumento: "CC", numeroDocumento: "1005324324")` produce `CC 1005324324`; si ambas partes son vacías o marcadores `N/A`/`NA`, produce `—`.
- Paths: `src/modules/estudiantes/utils/formatDocumentoIdentidad.ts`, `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx` y `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`.

## Retos y próximos pasos
1. Validar listado y detalle con una sesión institucional y el registro reportado; la ruta protegida y sus datos dependen del backend/gateway.
2. Agregar pruebas unitarias del formateador cuando el proyecto incorpore Vitest; actualmente no existe un script de tests.

## Entorno
- Raíz única `/workspace/SAPP-frontend`; usar npm y reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npx eslint src/modules/estudiantes/utils/formatDocumentoIdentidad.ts src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 242 módulos y generaron `dist/assets/index-DsX57pki.css` e `index-CQp7aA7v.js` en 724 ms. Vite advirtió de forma no bloqueante que el chunk JS supera 500 kB.
- `git diff --check` (2026-09-03): PASS. La validación visual requiere navegador, sesión y backend institucionales.

---
# Update 2026-09-03 — Solicitudes asignadas por usuario

## Estado actual y decisiones
- `/solicitudes` muestra a `PROFESOR`/`DOCENTE`, `COORDINADOR` y `DIRECTOR` un bloque inicial **Solicitudes asignadas** y, debajo, el listado general existente con sus filtros y paginación.
- El bloque asignado consulta el ID principal `session.user.id` (`usuarios_sapp.id`). Los IDs que aparecen allí se eliminan localmente del listado general, incluso cuando este se vuelve a cargar por filtros, para no duplicar solicitudes.
- Ambos listados conservan acceso al detalle. Un error en asignadas se presenta dentro de su bloque y no impide consultar el listado general. `COORDINADOR`/`ADMIN` conserva edición; profesor/docente/director usa la vista de solo lectura.

## Paths, contrato y salida esperada
- Transporte: `src/modules/solicitudes/api/solicitudesAcademicasService.ts`.
- Orquestación, exclusión por ID y UI: `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx`; estilos temáticos en su CSS hermano.
- Resolución de sesión/roles: `src/pages/Solicitudes/SolicitudesPage.tsx`.
- Request: `GET ${VITE_API_URL || '/api/sapp'}/sapp/solicitudesAcademicas/asignadas?idUsuario={usuarios_sapp.id}`. Response: `{ ok, message, data: SolicitudAcademicaDto[] }`; cada elemento requiere al menos `id`, estudiante, código UIS, tipo, estado, fechas, programa y observaciones conforme al contrato ya usado por la tabla.
- Salida: asignadas primero; luego solicitudes generales menos la unión de IDs asignados. No hay seeds, datasets, paquetes ni variables nuevas.

## Retos y próximos pasos
1. Validar con sesiones institucionales `PROFESOR`, `COORDINADOR` y `DIRECTOR` que el gateway autoriza el endpoint y que `session.user.id` corresponde a `usuarios_sapp.id`.
2. Confirmar si `ADMIN` también debe consultar asignadas; actualmente mantiene el acceso histórico de coordinación y usa el nuevo bloque por compartir la vista.
3. Incorporar pruebas de componente/servicio cuando exista Vitest, en particular respuesta vacía, error parcial, IDs repetidos y cambios de filtros.

## Entorno
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npm run build` (2026-09-03): PASS; TypeScript y Vite transformaron 242 módulos. Warning no bloqueante por el chunk JS de 504.93 kB.
- `npm run lint` (2026-09-03): FAIL por 11 errores y un warning preexistentes; en `SolicitudesCoordinadorView` permanecen únicamente los dos errores históricos `set-state-in-effect` de las cargas anteriores.
- `git diff --check` (2026-09-03): PASS. No se tomó captura porque el contenedor no dispone de Chromium/Chrome/Firefox y la pantalla requiere sesión/backend institucionales.

---
