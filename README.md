# SAPP Frontend — EISI UIS

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

### 2026-08-28 — Módulo de actas

- Se incorporó la ruta protegida `/actas` para los roles `COORDINADOR` y `ADMIN`, con acceso desde la navegación principal.
- El módulo consume `GET /actas`, permite buscar por nombre/código y pagina localmente los resultados en grupos de 10. Las actas se ordenan alfabéticamente por nombre y, para nombres iguales, por el año descendente incluido en el código `ACT-{consecutivo}-{año}`.
- El filtro de año y la columna **Año** se derivan del sufijo del código del acta, no de `fechaCreacion`. El conteo textual de resultados fue retirado.
- Cada fila permite **Ver** o **Descargar** el PDF. La acción consulta el contenido mediante `GET /document/{documentoContenidoId}` y usa el nombre retornado o, como fallback, `{codigo}.pdf`.
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
- Archivo de un acta: `GET /api/sapp/document/{documentoContenidoId}`; se espera el envelope `{ ok, message, data }`, con `data.contenidoBase64`, `data.mimeType` y `data.nombreArchivo` para visualizar o descargar el PDF.
- Login institucional: `GET /api/sapp/inicio`, sin body, envelope `{ ok, message, data }`. Además de los campos de identidad superiores, `data.detalle` contiene `{ aspirante, docente, estudiante, persona }`. `detalle.persona.id` alimenta `session.user.persona.id`, `detalle.estudiante?.id` alimenta `session.user.estudiante?.id` y el detalle completo queda disponible en `session.user.detalle`; no usar el `data.id` superior como sustituto de esos identificadores de dominio.

## Notas visuales de marca

- Mantener compatibilidad con tokens CSS globales y modo claro/oscuro.
- Evitar colores hardcodeados en componentes nuevos cuando exista token semántico equivalente.
- Los logos institucionales agregados en `public/brand` son SVG ligeros y no requieren imports desde TypeScript.
