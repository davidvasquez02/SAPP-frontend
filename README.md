# SAPP Frontend — EISI UIS

## Estado funcional (2026-09-03)

La pantalla protegida `/perfil` se abre al seleccionar la foto del usuario en el encabezado. Presenta los datos disponibles de identidad y, según el rol, un resumen específico para coordinación o estudiante. Los campos académicos que todavía no entrega la sesión se identifican como pendientes/provisionales. Al seleccionar una firma PNG/JPG (máximo 2 MB), la pantalla la previsualiza y la envía inmediatamente a `POST /api/sapp/firmaUsuario/{usuarioSappId}`. Continúa pendiente el endpoint de consulta que permitirá mostrar la firma ya registrada al abrir el perfil.

### Stack instalado y ejecución rápida

- React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- Componentes/páginas en `src/components` y `src/pages`; módulos de dominio en `src/modules`; sesión en `src/context/Auth`; transporte en `src/shared/http`.

```bash
npm ci          # instala exactamente package-lock.json
npm run dev     # servidor Vite
npm run build   # TypeScript + producción
npm run lint    # revisión estática global
npm run preview # sirve el build
```

Se requiere Node.js 18 o superior (verificado con Node 24.15.0 y npm 11.4.2). No hay seeds ni datasets propios: la información proviene del gateway/API, salvo mocks explícitos. `VITE_API_URL` configura la API cuando corresponda; varios servicios conservan `/api/sapp` como fallback.

### Decisiones recientes (changelog-lite)

- **2026-09-03:** el detalle de matrícula de coordinación presenta en **Estado** el valor real de `documentoUploadedResponse.estadoDocumento` (por ejemplo, `APROBADO`) en lugar de reducir todo documento existente a `Cargado`. La columna **Validación** fue reemplazada por **Fecha de revisión**, obtenida de `fechaRevisionDocumento`; los controles para aprobar o rechazar siguen disponibles dentro de **Acciones**. La vista del estudiante también usa ahora la fecha de revisión real, no la fecha de carga, y ambos listados comparten el mismo tratamiento visual de tabla, estados, bordes, espaciado y botones.
- **2026-09-02:** cuando una matrícula está `FINALIZADA`, el detalle de coordinación oculta las acciones **Aprobar/Rechazar** de documentos y asignaturas, así como el guardado de validaciones. Los documentos cargados muestran el nombre original entregado por `nombreArchivoDocumento`.
- **2026-09-02:** en el detalle de matrícula de coordinación, aprobar el último documento obligatorio ejecuta automáticamente la aprobación de la matrícula (`PUT /sapp/matriculaAcademica/{id}`). Se eliminó el botón manual **Aprobar documentos** y se bloquean las demás validaciones documentales mientras finaliza la transición para evitar solicitudes concurrentes.
- **2026-09-02:** únicamente el tipo de solicitud `12` (**RENOVACION CREDITO CONDONABLE**, trámite `17`) solicita los datos adicionales de renovación y envía `actividadesCreditoCondonable`, dirección, periodo inicial, intensidad y horas a la previsualización PDF; teléfono y correo se obtienen de la sesión. Los demás tipos conservan su formulario y contrato anteriores.
- **2026-09-02:** la consulta de matrícula vigente interpreta el nuevo objeto `{ periodoId, puedeCrear }`: bloquea el formulario y muestra que no hay fechas habilitadas cuando `puedeCrear` es `false`; cuando es `true`, usa el `periodoId` entregado por esa misma validación en el POST de creación.
- **2026-09-02:** se corrigió la ruta de períodos con fechas para eliminar dos espacios que el navegador codificaba como `%20%20`; la solicitud vuelve a resolverse como `GET /api/sapp/periodoAcademico/withFechas`.

- **2026-09-02:** el selector de firma del perfil valida y previsualiza el archivo y persiste inmediatamente el data URI mediante `POST /api/sapp/firmaUsuario/{usuarioSappId}`; se retiró la persistencia provisional en `localStorage`.
- **2026-09-02:** el perfil aprovecha el contrato real de `/inicio`: código UIS, programa, cohorte, estado, fecha de ingreso, correo personal y teléfono, con fallback a `attributes` cuando corresponde.
- La firma no se incorpora a la sesión. Queda anotada como integración pendiente la consulta backend de la firma vigente para precargarla en el selector.
- Los estilos nuevos consumen tokens semánticos y se adaptan a móvil y modos claro/oscuro.

Frontend del **Sistema de Apoyo para la gestión de trámites de posgrados (SAPP)** de la Escuela de Ingeniería de Sistemas e Informática (**EISI**) de la Universidad Industrial de Santander (**UIS**).

## Propósito y alcance

SAPP centraliza y estandariza la trazabilidad de procesos académicos y administrativos de posgrado:

- admisiones y convocatorias;
- matrícula académica;
- matrícula financiera y créditos condonables;
- solicitudes estudiantiles;
- examen de candidatura;
- trabajos de grado;
- configuración de fechas y notificaciones.
- consulta y carga de actas institucionales por coordinación y administración.

Este repositorio contiene únicamente el **frontend React/TypeScript**. La lógica de dominio, persistencia y contratos principales viven en el backend Spring Boot/PostgreSQL consumido por API HTTP.

## Arquitectura breve

- **SPA React + TypeScript** servida con Vite/rolldown-vite.
- **Ruteo** centralizado en `src/app/routes` con rutas protegidas por rol. No se publican rutas de login ni un portal independiente para aspirantes.
- **Autenticación** en `src/context/Auth`: al arrancar la SPA se inicializa la sesión real desde el API Gateway/IDP y se persiste en storage compartido.
- **Cliente HTTP** encapsulado en `src/shared/http/httpClient.ts` y servicios por módulo/API.
- **Módulos de dominio UI** bajo `src/modules` y pantallas bajo `src/pages`.
- **Layout institucional** con `Sidebar`, `Layout` y `ModuleLayout`; los assets de marca institucional viven en `public/brand`.

## Stack y versiones exactas observadas

Versiones instaladas en `/workspace/SAPP-frontend` según `npm list --depth=0` el **2026-08-17**:

| Paquete | Versión |
| --- | --- |
| Node.js | 24.15.0 |
| npm | 11.4.2 |
| react | 19.2.3 |
| react-dom | 19.2.3 |
| react-router-dom | 7.11.0 |
| typescript | 5.9.3 |
| vite | npm:rolldown-vite@7.2.5 |
| @vitejs/plugin-react-swc | 4.2.2 |
| eslint | 9.39.2 |
| @eslint/js | 9.39.2 |
| typescript-eslint | 8.51.0 |
| eslint-plugin-react-hooks | 7.0.1 |
| eslint-plugin-react-refresh | 0.4.26 |
| @types/node | 24.10.4 |
| @types/react | 19.2.7 |
| @types/react-dom | 19.2.3 |
| globals | 16.5.0 |

> Nota: `package.json` mantiene rangos semver para algunos paquetes, pero las versiones anteriores son las instaladas actualmente en `node_modules`/lockfile.

## Requisitos de entorno

- Usar **Node.js + npm** en la raíz del repo.
- No usar ni crear `venv`, `conda`, `poetry` ni entornos Python duplicados para este frontend.
- Reutilizar `node_modules` de la raíz cuando exista; si falta, ejecutar `npm install`.
- `VITE_API_URL` centraliza la ruta base consumida por el cliente HTTP. El valor por defecto versionado es `/api/sapp`, para que dev/prod usen rutas relativas del frontend.
- `VITE_DEV_PROXY_TARGET` configura únicamente el proxy local de Vite. Si no se define, apunta a `http://localhost:8080`; puede cambiarse sin tocar código fuente.
- `VITE_API_BASE_URL` se mantiene como fallback transitorio para compatibilidad con ambientes antiguos, pero los nuevos ambientes deben usar `VITE_API_URL`.

Ejemplo `.env.local`:

```env
VITE_API_URL=/api/sapp
VITE_DEV_PROXY_TARGET=http://localhost:8080
```

## Cómo ejecutar

```bash
npm install
npm run dev
```

La app queda disponible por defecto en `http://localhost:5173/`.

Otros comandos útiles:

```bash
npm run build
npm run lint
npm run preview
```

## Seeds / sesión de pruebas

No hay seeds de base de datos ni usuarios quemados en este repositorio. La sesión SAPP se obtiene al cargar la SPA mediante `GET /api/sapp/inicio`, sin body. Para desarrollo se necesita un backend/gateway que capture la identidad institucional y responda el contrato descrito abajo. La sesión normalizada se guarda en `localStorage['SAPP_AUTH_SESSION']`; `NO_TOKEN` es solo un marcador local y nunca se envía como Bearer porque la autenticación se resuelve en el gateway.

## Decisiones recientes / changelog-lite

### 2026-09-03 — Estado y fecha reales de documentos de matrícula

- En `/matricula/:matriculaId`, la columna **Estado** consume directamente `documentoUploadedResponse.estadoDocumento`; solo usa `EN_REVISION` como fallback para un archivo cargado sin estado y `PENDIENTE` cuando aún no existe archivo.
- La antigua columna **Validación** se sustituyó por **Fecha de revisión**, alimentada por `documentoUploadedResponse.fechaRevisionDocumento`. Aprobar/rechazar no desaparece del flujo: sus controles se agruparon con **Ver** y **Descargar** en **Acciones**.
- La tabla documental del estudiante dejó de mostrar `fechaCargaDocumento` bajo el rótulo de revisión y ahora usa el mismo campo `fechaRevisionDocumento`. El listado de coordinación adoptó el contenedor, separadores, badges y adaptación móvil del listado estudiantil.
- No se agregaron dependencias, variables de entorno, seeds ni datasets.

### 2026-09-02 — Informes a dependencias para coordinación

- Se incorporó la ruta protegida `/coordinacion/reportes`, disponible para coordinación y administración, con informes de admisión, matrícula y créditos condonables.
- Los selectores consumen los servicios de programas, convocatorias, períodos y actas. En admisión, el programa filtra las convocatorias; en matrícula y créditos, se preselecciona el período vigente por fechas o, como fallback, el más reciente.
- La generación está encapsulada en `informesMockService.ts`. Su request usa IDs numéricos y discrimina el proceso; debe sustituirse por el endpoint definitivo sin llevar lógica HTTP a la pantalla.
- No se agregaron dependencias, variables de entorno, seeds ni datasets.

### 2026-09-02 — Datos de previsualización para renovación de crédito condonable

- El tratamiento especial está delimitado por `tipoSolicitudId: 12` (**RENOVACION CREDITO CONDONABLE**, asociado al trámite `17`); no se infiere a partir del nombre y no altera los demás tipos de solicitud.
- El formulario reutiliza la modalidad y ciudad de expedición del flujo de crédito condonable, reemplaza visualmente los motivos por una lista dinámica de actividades y agrega dirección, periodo académico inicial en formato `AAAA-P`, intensidad horaria semanal y horas del semestre.
- Para este tipo, `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` recibe `actividadesCreditoCondonable` y no `motivos`; también recibe los campos adicionales, mientras `telefonoEstudiante` y `correoEstudiante` provienen de la sesión SAPP (con preferencia por correo institucional).
- No se agregaron dependencias, variables de entorno, seeds ni datasets.

### 2026-09-02 — Disponibilidad y período de creación de matrícula

- `GET /api/sapp/matriculaAcademica/vigente/estudiante/{estudianteId}` puede responder, cuando no existe matrícula vigente, `data: { periodoId, puedeCrear }`.
- Si `puedeCrear` es `false`, la pantalla de estudiante no carga ni presenta materias, documentos o la acción de confirmación; en su lugar informa que no hay fechas de matrícula habilitadas actualmente.
- Si `puedeCrear` es `true`, el frontend conserva el `periodoId` de la validación y lo envía como `periodoId` en `POST /api/sapp/matriculaAcademica`. La validación se repite justo antes del POST para no crear con una disponibilidad o período obsoletos.
- Se mantiene compatibilidad con la respuesta que contiene una matrícula existente. La antigua respuesta booleana `true` ya no permite crear porque carece del período obligatorio; no se agregaron dependencias, seeds ni datasets.

### 2026-09-02 — Ruta de períodos con fechas sin espacios codificados

- `getPeriodosAcademicosWithFechas()` usa la ruta lógica `/sapp/periodoAcademico/withFechas`, sin espacios antes de `sapp`.
- Con la base relativa predeterminada `/api/sapp`, el cliente HTTP normaliza la llamada a `GET /api/sapp/periodoAcademico/withFechas`; ya no genera `/%20%20sapp/periodoAcademico/withFechas`.
- No cambiaron el DTO, el envelope `{ ok, message, data }`, las dependencias, los seeds ni los datasets.

### 2026-09-02 — Previsualización y carga de múltiples documentos generados

- La previsualización de crédito condonable conserva ahora todos los elementos de `data` retornados por `POST /sapp/solicitudesAcademicas/pdf-previsualizacion`; una respuesta histórica con un único objeto continúa normalizándose a una lista.
- El visor presenta un selector tipo pestañas cuando se generan varios documentos, permitiendo alternar entre ellos sin abrir ventanas adicionales. Cada HTML se convierte localmente a PDF y cada PDF recibido se conserva.
- **Cargar todos los documentos generados** asocia cada archivo al requisito del listado comparando primero `tipoDocumentoId` con el ID del requisito o `tipoDocumentoCodigo` con su código. Así, por ejemplo, `{ tipoDocumentoId: 18, tipoDocumentoCodigo: "ANX-17" }` funciona con cualquiera de los dos identificadores.
- Si algún documento no tiene requisito coincidente, los demás sí se cargan y la interfaz informa la carga parcial. No se agregaron dependencias ni seeds.

### 2026-09-02 — Bloqueo de recursos externos durante la conversión PDF

- Las firmas/imágenes JPEG entregadas como base64 crudo (`/9j/...`) o como data URI se normalizan a un data URI compacto antes de cargar el HTML.
- Se elimina `srcset` y cualquier atributo de recursos no permitido, y el documento aislado incorpora una política CSP que solo admite imágenes `data:` y estilos inline. Esto impide que el navegador interprete el base64 como una URL relativa (`GET /9j/...`) y evita contaminar el canvas antes de `toDataURL`.

### 2026-09-02 — Márgenes verticales en el PDF generado

- Cada página carta generada en el navegador reserva ahora `0.75 in` (`72 px` a 96 DPI) en la parte superior e inferior.
- La paginación usa únicamente el área imprimible entre esos márgenes (`912 px` por página) y recorta el HTML por tramos consecutivos, por lo que no se pierde contenido entre páginas.
- El ajuste aplica solo a la conversión de respuestas HTML; los documentos que el backend ya entrega como PDF continúan utilizándose sin modificación.

### 2026-09-02 — Conversión local de la previsualización HTML a PDF

- `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` puede retornar `data` como una lista cuyos documentos contienen `base64DocumentoContenido` y `mimeTypeDocumentoContenido: "text/html"`; el servicio conserva toda la colección generada.
- Para solicitudes de crédito condonable, el navegador decodifica ese HTML, lo renderiza en un `iframe` aislado sin scripts y genera un PDF tamaño carta paginado. La conversión no requiere dependencias ni servicios externos.
- El previsualizador recibe una URL Blob con MIME `application/pdf`. **Cargar archivo de solicitud** adjunta exactamente ese mismo Blob como `carta-solicitud-credito-condonable.pdf`, en vez de renombrar contenido HTML como si fuera PDF.
- La compatibilidad con respuestas que ya contienen PDF se mantiene: cualquier MIME distinto de HTML se usa directamente. Las URLs Blob se revocan al regenerar, reiniciar o desmontar el formulario.
- Antes de insertar el HTML en un documento activo, se normalizan las imágenes base64 sin prefijo `data:` (por ejemplo, firmas JPEG que empiezan por `/9j/`) y se eliminan recursos externos. Así, la conversión procesa únicamente el HTML recibido, no genera solicitudes como `GET /9j/...` y ningún recurso remoto puede contaminar el canvas.

### 2026-08-28 — Módulo de actas

- Se incorporó la ruta protegida `/actas` para los roles `COORDINADOR` y `ADMIN`, con acceso desde la navegación principal.
- El módulo consume `GET /actas`, permite buscar por nombre/código y pagina localmente los resultados en grupos de 10. Las actas se ordenan por código de forma descendente y, cuando el código base coincide, por el año descendente incluido en `ACT-{consecutivo}-{año}`; el orden se aplica antes de filtrar y paginar.
- El filtro de año y la columna **Año** se derivan del sufijo del código del acta, no de `fechaCreacion`. El conteo textual de resultados fue retirado.
- Cada fila permite **Ver** o **Descargar** el PDF. La acción consulta el contenido mediante `GET /actas/{actaId}` usando el `id` del acta (no `documentoContenidoId`) y usa el nombre retornado o, como fallback, `{codigo}.pdf`.
- Cada fila también permite **Eliminar**. Antes de enviar `DELETE /actas/{id}`, la interfaz solicita confirmación mostrando el nombre y el código del acta; al completarse, retira el registro del listado y presenta una confirmación temporal.
- La creación consume `POST /actas`. La interfaz arma el código `ACT-{código}-{año}`, fija `fechaCreacion` con la fecha actual en `America/Bogota`, convierte el PDF a base64 y calcula su checksum SHA-256 antes de enviarlo. Solo admite PDF de hasta 15 MB.
- La confirmación de creación se oculta automáticamente después de 5 segundos.
- No se agregaron seeds ni dependencias. El contrato y transporte están encapsulados en `src/modules/actas`; la pantalla está en `src/pages/Actas`.

### 2026-08-28 — Bloqueo de creación de aspirantes en convocatorias cerradas

- El detalle de una convocatoria continúa siendo consultable cuando está cerrada, pero la acción **Crear aspirante** queda deshabilitada y se explica el motivo en pantalla.
- El bloqueo usa tanto el indicador `vigente` del backend como el rango de fechas de la convocatoria, y se aplica también en el manejador de la acción y en la apertura del modal para evitar el alta por estados transitorios de la interfaz.
- La creación de estudiantes admitidos continúa disponible en convocatorias cerradas; esta regla solo restringe nuevos aspirantes.

### 2026-08-28 — Prevención persistente de estudiantes duplicados

- En el detalle de una convocatoria cerrada, la acción **Crear estudiante** solo queda habilitada para aspirantes admitidos cuya inscripción no contiene `idPersona`.
- Si `GET /api/sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` devuelve un `idPersona` numérico, la UI presenta **Estudiante creado** y deshabilita la acción, incluso después de recargar la página.
- La marca local posterior a un alta exitosa se conserva para dar retroalimentación inmediata, pero el contrato de `idPersona` es la fuente persistente al volver a consultar la convocatoria.

### 2026-08-28 — Orden y filtros del listado de estudiantes

- `/coordinacion/estudiantes` ordena las tarjetas primero por período/cohorte, del más reciente al más antiguo, y usa el nombre como segundo criterio estable.
- El listado permite combinar un selector de período con búsquedas parciales por nombre y código UIS. Las búsquedas ignoran mayúsculas, minúsculas y tildes, muestran el conteo de resultados y pueden limpiarse en una sola acción.
- Los filtros operan sobre la respuesta ya cargada de `GET /api/sapp/estudiantes/consulta?programaId={id}&egresados=false`; no cambian el contrato HTTP, no agregan dependencias y se reinician al cambiar entre maestría y doctorado.

### 2026-08-28 — Caché efímera al consultar el detalle de un estudiante

- El listado de `/coordinacion/estudiantes` guarda en memoria los programas, el programa seleccionado, los estudiantes y las fotos ya resueltas únicamente cuando se abre el detalle de una tarjeta.
- Al volver desde `/coordinacion/estudiantes/:estudianteId`, la pantalla consume ese snapshot una sola vez y evita repetir tanto la consulta del listado como las consultas individuales de fotografías.
- El snapshot se elimina al consumirlo o al abandonar el detalle hacia cualquier ruta distinta del listado. No se usa `localStorage`, `sessionStorage` ni una caché global de duración indefinida, por lo que una visita posterior desde otro módulo solicita datos actuales.
- No cambiaron endpoints, DTO, dependencias, seeds ni datasets.

### 2026-08-28 — Carga progresiva de fotografías de estudiantes

- El listado de coordinación muestra primero los estudiantes con `fotoUrl: null` y luego carga cada retrato de forma progresiva, manteniendo **Sin foto** ante datos o documentos ausentes y fallos individuales.
- La fotografía de admisión se resuelve con `idAspirante → GET /inscripcionAdmision/aspirante/{idAspirante} → inscripcion.id`; ese ID de inscripción, no el del aspirante, se envía como `tramiteId` al contrato documental `codigoTipoTramite=1002` y `codigoTipoDocumentoTramite=ANX-4`.
- Las consultas secundarias se limitan a cuatro estudiantes simultáneos y sus respuestas se ignoran si cambia el programa. El filtro `codigoTipoDocumentoTramite` se envía al backend para no descargar todo el checklist.
- No se agregaron dependencias, seeds ni datasets. Para volúmenes mayores sigue recomendándose un endpoint batch de backend que elimine el patrón N+1.

### 2026-08-28 — Fotografías más altas en tarjetas de aspirantes y estudiantes

- Las fotografías de las tarjetas del detalle de convocatoria y del listado de estudiantes de coordinación aumentaron de 190 px a 240 px de alto para mostrar mejor el retrato sin cambiar el ancho de las tarjetas.
- En pantallas de hasta 640 px se usa una altura de 220 px, manteniendo el carrusel horizontal y el recorte proporcional con `object-fit: cover`.
- El ajuste es exclusivamente visual: no modifica rutas, contratos HTTP, datos, seeds ni dependencias.

### 2026-08-28 — Convocatoria cerrada del período actual visible

- La pantalla `/admisiones` destaca primero la convocatoria que corresponde al semestre calendario actual en Colombia (enero-junio: período 1; julio-diciembre: período 2), aunque sus fechas hayan terminado o su estado sea cerrado.
- La tarjeta diferencia explícitamente **ABIERTA** y **CERRADA**, conserva las fechas y permite entrar al detalle en ambos estados. Solo recurre a una convocatoria abierta de otro período cuando no existe una convocatoria para el período actual.
- La convocatoria destacada se excluye del selector de convocatorias anteriores para evitar mostrarla dos veces; el contrato HTTP de `GET /api/sapp/convocatoriaAdmision` no cambió.

### 2026-08-26 — Edición de fechas de convocatorias

- El listado de configuración de convocatorias incorpora la acción **Editar** en cada fila y abre un diálogo con las fechas actuales de inicio y fin.
- El formulario valida que ambas fechas existan y que el fin no sea anterior al inicio; el botón de guardado solo se habilita cuando existe un cambio.
- La actualización usa `PUT /api/sapp/convocatoriaAdmision/fechas/{id}` y envía únicamente los campos modificados (`fechaInicio` y/o `fechaFin`). Después de una respuesta exitosa, el listado se consulta nuevamente para reflejar el estado y las fechas calculadas por el backend.

### 2026-08-25 — Actualización inmediata de la evaluación tras validar documentos

- Al iniciar la evaluación desde **Documentos cargados**, la pantalla espera hasta confirmar que el backend reporta la evaluación como iniciada.
- Una confirmación exitosa actualiza el estado del detalle padre, precarga Hoja de vida, Examen de conocimiento y Entrevistas, y vuelve a montar sus vistas antes de abrir Hoja de vida. Así, los componentes inferiores quedan habilitados sin recargar manualmente la página.
- Si el backend acepta la solicitud pero los componentes todavía no están disponibles después de los reintentos, la navegación se detiene y se informa al usuario para evitar mostrar una sección deshabilitada o vacía.

### 2026-08-25 — Rol principal visible sin el rol genérico del sistema

- El encabezado común ahora ignora `DEFAULT-ROLES-EISI` al elegir el rol principal que se muestra junto al nombre del usuario.
- Se conserva el orden de roles entregado por la sesión y se presenta el primer rol distinto al genérico, comparándolo sin distinguir mayúsculas y minúsculas.
- Si la sesión no contiene ningún rol funcional, se muestra `SIN ROL ASIGNADO` en lugar de atribuir un rol inexistente o exponer el rol técnico.

### 2026-08-24 — Evaluadores de convocatoria identificados por UUID

- La creación de convocatorias consulta el catálogo con `GET /api/sapp/docentes/estado?skip=0` y conserva `uuid`, `id`, `nombre` y `existeEnSapp`; las entradas sin nombre o UUID utilizable no se muestran.
- La selección y los reintentos de asociación usan el UUID como identidad estable del docente, incluso cuando `id` es `null` porque la persona aún no existe en SAPP.
- Cada asociación ejecuta `POST /api/sapp/evaluadorConvocatoria` con `{ evaluadorUuid: string, convocatoriaId: number }`; se retiró el envío anterior de `evaluadorId`.

### 2026-08-17 — Detalle de identidad en la sesión institucional

- El contrato de `GET /inicio` incorpora `data.detalle` con las figuras `aspirante`, `docente`, `estudiante` y `persona`; las figuras que no aplican llegan como `null`.
- La sesión conserva el objeto `detalle` completo y toma `persona.id` y `estudiante.id` de sus respectivas figuras dentro de `detalle`, en vez de fabricar esos identificadores desde el `id` superior.
- Se mantiene compatibilidad con los procesos existentes: `user.persona` se normaliza con los datos de aspirante/persona y `user.estudiante` referencia `detalle.estudiante`, por lo que los consumidores actuales vuelven a recibir el identificador local del estudiante.

### 2026-08-17 — Consultas de aspirantes con nombres desagregados

- Los contratos frontend de `GET /aspirante`, `GET /aspirante/{id}` y `GET /aspirante/consultaInfo` consumen `nombre1`, `nombre2`, `apellido1` y `apellido2`; ya no esperan el campo único `nombre`.
- El servicio de admisiones expone consultas tipadas para el listado, el detalle por identificador y la información del aspirante actual, manteniendo el envelope `{ ok, message, data }`.
- Para presentar el nombre se dispone de un compositor que concatena únicamente las partes informadas, sin reconstruir ni persistir un campo de contrato obsoleto.

### 2026-08-17 — Creación de estudiantes al cerrar una convocatoria

- El detalle de una convocatoria cerrada muestra a coordinación, secretaría y administración una sección para crear estudiantes a partir de los aspirantes con estado `ADMITIDO`.
- Cada creación solicita los dos datos institucionales obligatorios y ejecuta `POST /estudiantes` con `{ idAspirante, codigoUIS, emailInstitucional }`; ya no se envían programa, período, correo personal ni los nombres antiguos de los campos.
- La UI consume el objeto de estudiante retornado en `data`, muestra el código UIS confirmado y bloquea una segunda creación para ese aspirante durante la sesión actual. El backend continúa siendo responsable de la unicidad definitiva.

### 2026-08-17 — Nombres de aspirante desagregados para el IDP

- El formulario de creación reemplaza el campo único **Nombre** por **Primer nombre**, **Segundo nombre**, **Primer apellido** y **Segundo apellido**.
- Primer nombre y primer apellido son obligatorios; segundo nombre y segundo apellido son opcionales.
- `POST /api/sapp/aspirante` ya no envía `nombre`: el contrato vigente usa `{ nombre1, nombre2, apellido1, apellido2, tipoDocumentoIdentificacionId, numeroDocumento, emailPersonal, numeroInscripcionUis, telefono, observaciones, programaId, convocatoriaAdmisionId }`. Los campos opcionales de nombre se normalizan a `null` cuando quedan vacíos.

### 2026-08-17 — Error al crear aspirantes sin abandonar la convocatoria

- `POST /api/sapp/aspirante` desactiva la invalidación/redirección automática ante 401/403: el modal permanece abierto, conserva los datos digitados y muestra el error devuelto por el backend.
- El cliente HTTP presenta tanto `message`/`error` como listas o mapas `errors` de validación, facilitando identificar rechazos por datos duplicados, contrato, permisos o reglas de convocatoria.
- Una falla que persista debe verificarse en Network y logs backend; el frontend ya no oculta la causa navegando al inicio.

### 2026-08-17 — Acceso gestionado fuera de la SPA

- Se retiraron el formulario/ruta de login, el login de aspirantes y el portal documental de aspirantes; `/login`, `/login/aspirante` y `/aspirante/*` ya no tienen rutas propias y caen en el fallback hacia `/`.
- Se eliminó la acción de cerrar sesión del sidebar y del contexto de autenticación. El inicio de sesión institucional continúa resolviéndose automáticamente mediante el API Gateway/IDP al montar la aplicación.
- Las respuestas HTTP 401 limpian la copia local obsoleta de la sesión, pero la SPA ya no redirige a una pantalla de login interna. Los 403 se reportan sin invalidar la sesión.

### 2026-08-16 — Sesión institucional desde API Gateway/IDP

- Se eliminó la sesión ADMIN mock y el formulario SAPP de usuario/contraseña.
- El primer montaje llama a `POST /auth/login` sin payload, bloquea el ruteo mientras inicializa y llena la sesión con la respuesta real.
- La sesión conserva `uuid`, `attributes`, roles generales y `clientRoles`; para autorización UI se usa la unión normalizada y sin duplicados de ambos arreglos.
- Un fallo de inicialización limpia cualquier sesión obsoleta; desde 2026-08-17 ya no existe una pantalla interna de login o reintento.

### 2026-06-17 — URL backend relativa y proxy local

- Se centralizó la base de API en `VITE_API_URL`, con valor default `/api/sapp`.
- Se configuró proxy local de Vite para reenviar `/api/sapp/*` a `VITE_DEV_PROXY_TARGET` y remover el prefijo cuando el target es localhost.
- Los servicios siguen usando el cliente HTTP centralizado; este normaliza rutas heredadas `/sapp/*` y rutas ya migradas `/api/sapp/*` para evitar duplicar prefijos.

### 2026-06-12 — Marca EISI/UIS

- Se reemplazó el favicon de Vite por el ícono EISI en `public/brand/eisi-favicon.svg` y `index.html`.
- Se agregó el logo UIS en el encabezado de módulos, a la derecha de la foto del usuario autenticado, usando `public/brand/uis-logo.svg` y estilos responsivos en `ModuleLayout`.
- Se actualizó el título del documento a `SAPP EISI UIS` y el idioma HTML a español.

### 2026-06-06 — Rediseños visuales de admisiones/documentos

- Se modernizaron pantallas de admisiones y detalle de documentos sin alterar contratos backend.
- Se mantuvieron acciones existentes de ver/descargar/aprobar/rechazar documentos.

### 2026-06-05 — Mock temporal de API Gateway

- Se habilitó una sesión mock ADMIN para pruebas de integración evitando pantalla de login.
- `NO_TOKEN` se filtra para no enviar `Authorization` ficticio.

### 2026-06-02 — Ajustes temporales de convocatoria cerrada

- Se permitió temporalmente crear aspirantes en convocatoria cerrada para pruebas.
- Revertir antes de ambientes estables/productivos si se requiere respetar el gating original.

## Contratos relevantes

- Base URL frontend: `VITE_API_URL || VITE_API_BASE_URL || /api/sapp`.
- Local: el navegador llama `/api/sapp/...` y Vite reenvía al backend definido por `VITE_DEV_PROXY_TARGET`.
- Dev/prod: el navegador llama rutas relativas `/api/sapp/...`; la infraestructura debe enrutar ese prefijo al backend.
- Prefijo backend histórico observado: rutas tipo `/sapp/...`; el cliente centralizado evita duplicar ese segmento cuando `VITE_API_URL` termina en `/sapp`.
- Programas: `GET /api/sapp/programaAcademico` desde el navegador.
- Docentes disponibles para una convocatoria: `GET /api/sapp/docentes/estado?skip=0`; cada elemento contiene `{ existeEnSapp: boolean, id: number | null, nombre: string, uuid: string }`.
- Asociación de evaluadores: `POST /api/sapp/evaluadorConvocatoria` por cada docente seleccionado, con `{ evaluadorUuid: string, convocatoriaId: number }`.
- Edición de fechas de convocatoria: `PUT /api/sapp/convocatoriaAdmision/fechas/{convocatoriaId}` con al menos uno de `{ fechaInicio?: 'YYYY-MM-DD', fechaFin?: 'YYYY-MM-DD' }`; la respuesta esperada conserva el envelope `{ ok, message, data }`.
- Aspirantes: `POST /api/sapp/aspirante` desde el navegador con nombres desagregados en `nombre1`, `nombre2`, `apellido1` y `apellido2`.
- Estudiantes desde admisiones: `POST /api/sapp/estudiantes` desde el navegador con `{ idAspirante: number, codigoUIS: string, emailInstitucional: string }`. La respuesta exitosa usa el envelope habitual y `data` contiene `{ id, cohorte, estado, codigoEstudianteUis, fechaIngreso, fechaEgreso, idAspirante, foto }`.
- Inscripciones por convocatoria: `GET /api/sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` desde el navegador. Cada elemento puede incluir `idPersona: number | null`; un valor numérico indica que el aspirante ya existe como estudiante y bloquea una nueva creación.
- Documentos: operaciones de checklist/prefetch y validación mediante servicios de documentos existentes.
- Archivo de un acta: `GET /api/sapp/actas/{actaId}`; el path usa `ActaDto.id`, no `documentoContenidoId`. Se espera el envelope `{ ok, message, data }`, con `data.contenidoBase64`, `data.mimeType` y `data.nombreArchivo` para visualizar o descargar el PDF.
- Login institucional: `GET /api/sapp/inicio`, sin body, envelope `{ ok, message, data }`. Además de los campos de identidad superiores, `data.detalle` contiene `{ aspirante, docente, estudiante, persona }`. `detalle.persona.id` alimenta `session.user.persona.id`, `detalle.estudiante?.id` alimenta `session.user.estudiante?.id` y el detalle completo queda disponible en `session.user.detalle`; no usar el `data.id` superior como sustituto de esos identificadores de dominio.

## Notas visuales de marca

- Mantener compatibilidad con tokens CSS globales y modo claro/oscuro.
- Evitar colores hardcodeados en componentes nuevos cuando exista token semántico equivalente.
- Los logos institucionales agregados en `public/brand` son SVG ligeros y no requieren imports desde TypeScript.
