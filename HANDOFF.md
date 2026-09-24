# Handoff 2026-09-24 — catálogo autoritativo de Proyectos de grado

## Estado actual, contrato y salida esperada
- Se corrigió la clasificación basada en el catálogo real de `GET /sapp/tiposSolicitud`. Maestría usa exactamente `[13, 9, 6, 7]`; doctorado usa exactamente `[13, 9, 8, 4, 5]`. El orden interno no afecta la etiqueta, que se toma del backend.
- IDs autoritativos: `9` = **GRADO**, `8` = **EXAMEN DE CANDIDATURA DOCTORAL**, `10` = **AMPLIACION DE PERMANENCIA**. Por tanto, el ID 10 no debe aparecer en ninguno de los selectores de Proyectos de grado y el ID 9 debe aparecer en ambos. No conservar compatibilidad especulativa con IDs anteriores.
- `esExamenCandidaturaDoctoral` reconoce el ID 8 o el código `CAND_DOCTORAL`, nunca el ID 9. La configuración de formulario también reserva el título sin resumen para candidatura ID 8, evitando tratar GRADO como examen.
- No cambian endpoints, DTO, payloads, permisos, schemas, paquetes, variables, seeds ni datasets. Contratos consumidos: envelope `{ ok, message, data }` de `GET /sapp/tiposSolicitud` y registros de `GET /sapp/solicitudesAcademicas`.

## Paths, entorno y continuidad
- Regla central: `src/modules/trabajos-grado/constants.ts`; formulario: `src/modules/solicitudes/utils/datosTrabajoSolicitud.ts`; integración: `src/pages/TrabajosGrado/TrabajosGradoPage.tsx`; regresiones: `tests/candidaturaDoctoral.test.ts` y `tests/datosTrabajoSolicitud.test.ts`.
- Entorno único: `/workspace/SAPP-frontend/node_modules` con Node.js 24.15.0 y npm 11.4.2. React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol. No reinstalar dependencias ni crear venv, Conda, Poetry u otro árbol npm.
- Verificación local: pruebas dirigidas 8/8 PASS, suite Node 56/56 PASS, ESLint focalizado PASS, build PASS (313 módulos; CSS 252.47 kB; JS 732.59 kB) y `git diff --check` PASS. Avisos no bloqueantes: npm `Unknown env config "http-proxy"` y chunk JavaScript mayor de 500 kB.
- No existen seeds ni datasets locales. Pendiente externo: validar ambos selectores y sus listados con una sesión institucional y el backend real; la ruta está protegida y no hay credenciales reproducibles en el repositorio.

---

# Handoff 2026-09-24 — botones de acciones y convocatoria

## Update 2026-09-24 — alineación de la flecha del submenú Matrícula

- `src/components/Sidebar/Sidebar.tsx` reemplaza el carácter tipográfico `⌄`
  por un SVG de flecha; `Sidebar.css` dimensiona el icono a 18 px,
  lo centra dentro del botón estable de 40 px y conserva la rotación al abrir.
- Salida esperada: la flecha queda centrada vertical y horizontalmente junto a
  **Matrícula**, tanto en escritorio como en el panel móvil, y apunta hacia
  arriba cuando `aria-expanded="true"`. No cambian navegación, permisos,
  contratos, variables, dependencias, seeds ni datasets.
- Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no
  crear venv, Conda, Poetry ni otro árbol npm. Entorno comprobado: Node.js
  24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript
  5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2.
- Validación local: ESLint focalizado PASS; suite Node PASS (56/56); build PASS
  (313 módulos; CSS 252.47 kB y JS 732.60 kB); `git diff --check` PASS. El lint
  global conserva 9 errores y 1 warning preexistentes fuera del alcance. npm
  muestra el warning ambiental `Unknown env config "http-proxy"` y Vite avisa
  por el chunk JavaScript mayor de 500 kB.
- Pendiente externo: comprobar visualmente el menú con una sesión institucional
  en escritorio/móvil y temas claro/oscuro. El contenedor no dispone de
  Chromium, Chrome ni Firefox y la vista protegida depende del backend.

---

## Update 2026-09-24 — moneda visible en campos de corrección

- `formatoMonedaEntrada`, en
  `src/modules/matricula-financiera/rules.ts`, presenta ahora el prefijo `$`
  junto con agrupación de miles colombiana. En el detalle de liquidación, los
  campos de ajuste y total manual muestran, por ejemplo, `$ -100` y
  `$ 30.000.000` durante la escritura. `normalizarMoneda` retira el formato y
  el contrato de `PUT /liquidaciones/{id}/ajustes` continúa recibiendo números,
  con hasta cuatro decimales, o `null` para retirar el total manual.
- Regresión: `tests/matriculaFinancieraRules.test.ts` cubre montos negativos,
  positivos, cero y vacío. No hay cambios de API, schemas, paquetes, variables,
  seeds ni datasets.
- Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no
  crear venv, Conda, Poetry ni otro árbol npm. Entorno: Node.js 24.15.0, npm
  11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2.
- Pendiente externo: comprobar el cursor y la edición de montos con sesión y
  backend institucionales, en escritorio/móvil y temas claro/oscuro.

---

## Estado, contratos y salida esperada
- En `ProcesoLiquidacionPage.tsx`, la columna **Acciones** agrupa **Ver
  detalle** y las mutaciones de `LiquidacionActions.tsx` como botones
  secundarios compactos tipo pill. La presentación usa
  `.mf-button--table`/`.mf-row-actions` y tokens semánticos existentes. El
  enlace de detalle conserva su ruta y semántica; diálogos, estados
  deshabilitados, permisos y payloads no cambiaron.
- El botón que ejecuta `convocar` muestra **Convocar** en reposo y
  **Convocando…** durante la operación. Todavía envía
  `{ incluirVigentes: true, incluirNuevos: true }`; el texto explicativo deja
  explícito el alcance. No hay nuevos endpoints, schemas, dependencias,
  variables, seeds ni datasets.
- Archivos: `src/pages/MatriculaFinanciera/{ProcesoLiquidacionPage,LiquidacionActions}.tsx`
  y `MatriculaFinancieraPage.css`. Salida esperada: ninguna acción de tabla se
  ve como enlace subrayado y todas conservan foco visible y estados disabled en
  temas claro/oscuro.

## Entorno, pruebas y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm
  ni venv, Conda o Poetry. Entorno: Node.js 24.15.0, npm 11.4.2, React/DOM
  19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y
  ESLint 9.39.2, fijado por `package-lock.json`.
- Validación: `npm run lint` PASS; suite Node PASS (56/56); build PASS (313
  módulos, CSS 252.50 kB y JS 732.52 kB); `git diff --check` PASS. Persisten el
  warning ambiental npm `Unknown env config "http-proxy"` y el aviso
  informativo por el chunk JS mayor de 500 kB.
- Pendiente: validar la tabla protegida con backend y sesión institucional en
  escritorio/móvil y temas claro/oscuro. El repositorio no incluye credenciales
  ni un backend reproducible para esa comprobación.

---

# Update 2026-09-24 — texto de confirmación de liquidación

## Estado y salida esperada
- En `src/pages/MatriculaFinanciera/LiquidacionDetallePage.tsx`, la tarjeta
  **Estado de la liquidación** muestra únicamente “Confirma únicamente después
  de registrar la liquidación en PUTTY.”; se retiró la frase adicional acerca
  de las alertas por no aportar información relevante en este contexto.
- No cambiaron las reglas: confirmar continúa sujeto a estado, total y cambios
  guardados según `LiquidacionActions`. Tampoco cambiaron API, schemas, DTO,
  permisos, dependencias, variables, seeds ni datasets.

## Entorno y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no
  crear venv, Conda, Poetry ni otro árbol npm. El proyecto usa Node.js/npm y las
  versiones exactas se encuentran en `package-lock.json`.
- Validación local: suite Node PASS (56/56), ESLint focalizado PASS, build PASS
  (313 módulos; CSS 252.50 kB y JS 732.44 kB) y `git diff --check` PASS. Avisos
  no bloqueantes: npm informa `Unknown env config "http-proxy"` y Vite advierte
  por el chunk mayor de 500 kB.
- Pendiente integrado: comprobar el texto en el detalle con una sesión de
  coordinación y backend institucional; la ruta protegida no tiene seed local.
  No se capturó imagen porque el contenedor no dispone de Chromium, Chrome ni
  Firefox.

---

# Handoff 2026-09-24 — filtro por nivel en matrícula académica

## Estado actual y salida esperada
- `src/modules/matricula/components/MateriasSelector/MateriasSelector.tsx` presenta **Materia** y **Nivel** uno al lado del otro durante la creación estudiantil. Los niveles se derivan del catálogo, se ordenan numéricamente y el valor inicial **Todos** no restringe resultados.
- `materiasFilter.ts` concentra la regla comprobable: un nivel elegido admite las materias de ese nivel y siempre las electivas (`nivel: null`); después combina la búsqueda por nombre/código y retira IDs ya seleccionados. La lista sigue señalando cada electiva y no cambia lo que se envía al registrar la matrícula.
- Salida esperada: con nivel 2 deben verse materias de nivel 2 más todas las electivas; una búsqueda debe reducir ese conjunto; una materia agregada debe desaparecer. En anchos menores de 480 px los controles se apilan. Los temas claro/oscuro consumen tokens semánticos existentes.

## Contratos, paths y continuidad
- Contrato de catálogo sin cambios: `MateriaDto` conserva `{ id, nombre, codigo, nivel }`, donde `nivel` es `number | null` y `null` identifica una electiva. No cambiaron endpoints, payloads, schemas, rutas, permisos, dependencias, variables, seeds ni datasets.
- Implementación: `src/modules/matricula/components/MateriasSelector/{MateriasSelector.tsx,MateriasSelector.css,materiasFilter.ts}`. Regresión: `tests/materiasFilter.test.ts`. Ruta protegida para validación: `/matricula/academica` con estudiante sin matrícula existente en el periodo.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no ejecutar otra instalación ni crear venv, Conda o Poetry. Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol.
- Verificación 2026-09-24: ESLint focalizado PASS; suite Node PASS (56/56); build PASS (313 módulos, CSS 252.31 kB y JS 732.48 kB); `git diff --check` PASS. Persisten el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Pendiente externo: revisar la ruta con sesión/backend institucionales en escritorio/móvil y claro/oscuro, especialmente catálogos con electivas. No se generó captura porque el contenedor no incluye Chromium, Chrome ni Firefox y la vista requiere sesión y backend no reproducibles.

---

# Handoff 2026-09-24 — evaluación de proyecto de grado visible al estudiante

## Estado actual y decisiones
- `SolicitudDetallePage` ya consultaba `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}` para estudiantes con solicitudes de trabajo de grado. Ahora, cuando existe un proceso, renderiza `ProcesoEvaluacionEstudiante` después del panel de ajustes y antes de la gestión exclusiva de coordinación.
- La vista destaca `resultadoNombre`, `resultado` o `resultadoCodigo` (en ese orden), `notaFinal` si existe, `fechaResultado` y los datos de sustentación. Acepta el contrato plano mostrado por el backend y conserva compatibilidad con el objeto anidado `sustentacion`.
- Solo se presentan jurados con `activo: true`, ordenados por `orden`; los reemplazados se omiten para no confundir al estudiante. Se muestran nombre e institución, pero deliberadamente no correo. Cada evaluación presenta momento, concepto/resultado/nota según `momentoCodigo` y observaciones, con placeholders explícitos para valores pendientes.

## Paths, contratos y salida esperada
- Implementación: `src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionEstudiante.{tsx,css}`, integración en `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` y ampliación de contrato en `src/modules/trabajos-grado/evaluacion/types.ts`.
- Contrato principal: envelope `{ ok, message, data }` de `GET /sapp/procesoEvaluacionTg/solicitud/{id}`. Se consumen `resultado`, `resultadoCodigo`, `fechaResultado`, `notaFinal`, sustentación plana o anidada y `jurados[]`; de cada jurado, `activo`, `orden`, `nombre`, `institucion`, estado y `evaluaciones[]`; de cada evaluación, momento, concepto/resultado/nota y observaciones.
- Para el ejemplo de solicitud 78, la salida esperada destaca **Aprobado**, la fecha de resultado y la sustentación presencial en sala 104 EISI; lista a fiona, rubi y michi con sus conceptos, resultados y observaciones, y omite a morgan porque fue reemplazado. El correo de ningún jurado debe aparecer.
- No hay artifacts, schemas, seeds ni datasets nuevos. Ruta a validar con sesión estudiantil: `/trabajos-grado/:nivel/solicitudes/78` (o `/solicitudes/78`, según el punto de entrada).

## Entorno, pruebas y próximos pasos
- Entorno único: `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. No ejecutar otra instalación ni crear venv, Conda o Poetry; no es un proyecto Python.
- Verificación local: suite Node PASS (53/53); ESLint focalizado PASS; build PASS (312 módulos, CSS 251.67 kB, JS 731.57 kB); `git diff --check` PASS. El build conserva el aviso informativo del chunk JS mayor de 500 kB y npm el warning ambiental `Unknown env config "http-proxy"`.
- Pendiente: validar con sesión/backend institucional el endpoint de la solicitud real y revisar claro/oscuro y móvil. No se generó captura en esta fase porque el contenedor no incluye Chromium, Chrome ni Firefox y la ruta protegida requiere sesión institucional.

---

# Handoff 2026-09-24 — grado en el catálogo de maestría

## Estado, contrato y salida esperada
- `/trabajos-grado/maestria` usa los tipos `[13, 10, 6, 7]`: envío de tema,
  grado, propuesta y defensa. Ya no incluye el ID legado `8` ni el ID vigente
  `9` de candidatura, porque ambos son exclusivos de doctorado.
- `/trabajos-grado/doctorado` usa `[13, 10, 8, 9, 4, 5]`; conserva las dos
  variantes de candidatura por compatibilidad con catálogos institucionales y
  añade **GRADO**. `esExamenCandidaturaDoctoral` reconoce IDs 8/9 y el código
  `CAND_DOCTORAL`.
- El contrato REST no cambia. `GET /sapp/tiposSolicitud` debe entregar el tipo
  `{ id: 10, ...GRADO... }`; los listados siguen llegando desde
  `GET /sapp/solicitudesAcademicas`. No hay schemas, payloads, dependencias,
  variables, seeds ni datasets nuevos.

## Paths, entorno y continuidad
- Regla: `src/modules/trabajos-grado/constants.ts`; integración existente:
  `src/pages/TrabajosGrado/TrabajosGradoPage.tsx`; regresión:
  `tests/candidaturaDoctoral.test.ts`.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm
  ni venv, Conda o Poetry. El frontend usa Node.js 24.15.0 y npm 11.4.2; las
  versiones exactas de paquetes están fijadas en `package-lock.json`.
- Verificación 2026-09-24: regresión dirigida 5/5 PASS, suite Node 51/51 PASS,
  ESLint focalizado PASS, build PASS (309 módulos; CSS 247.18 kB; JS 725.07
  kB) y `git diff --check` PASS. El lint global conserva 9 errores y 1 warning
  preexistentes fuera de los archivos tocados; también persisten los avisos no
  bloqueantes de npm por `http-proxy` y del chunk JavaScript mayor de 500 kB.
- Pendiente integrado: confirmar que el catálogo institucional conserva el ID
  10 para **GRADO** y revisar ambos niveles con sesión real. La ruta protegida
  depende del backend y de credenciales institucionales.

---

# Handoff 2026-09-24 — títulos y filtros de gestión

## Estado actual y decisiones
- En `/coordinacion/profesores`, `ModuleLayout` es la única fuente del título **Gestión profesores**. La tarjeta ya no repite un `h1`; conserva la descripción, tabs y operaciones existentes.
- La identificación anterior del tipo 8 como **GRADO** fue corregida por el handoff más reciente: 8 es candidatura doctoral legada y **GRADO** corresponde al tipo 10.
- `normalizeEstadoSolicitud` traduce la sigla `PFIR_DIR_TG` y sus etiquetas descriptivas de director al mismo estado canónico. Salida esperada: una solicitud de crédito con `estado: "POR FIRMA DIRECTOR DE TG"` y sin depender de `estadoId` hace visible la opción de catálogo `{ id: 6, sigla: "PFIR_DIR_TG", label: "POR FIRMA DIRECTOR DE TG" }` en el filtro de pendientes.
- No cambiaron endpoints, payloads, DTO, roles, schemas, migraciones, paquetes, variables, seeds ni datasets. Se reutilizan `GET /sapp/tiposSolicitud`, `GET /sapp/estadosSolicitud` y `GET /sapp/solicitudesAcademicas`.

## Paths, pruebas y continuidad
- Archivos funcionales: `src/pages/GestionProfesores/GestionProfesoresPage.tsx`, `src/modules/trabajos-grado/constants.ts` y `src/modules/solicitudes/utils/estadoSolicitud.ts`. Regresiones: `tests/candidaturaDoctoral.test.ts` y `tests/estadoSolicitud.test.ts`.
- Verificación 2026-09-24: pruebas dirigidas 10/10 PASS; suite Node 50/50 PASS; ESLint focalizado PASS; `npm run build` PASS (309 módulos, CSS 246.20 kB, JS 724.29 kB); `git diff --check` PASS. Avisos conocidos: npm `Unknown env config "http-proxy"` y chunk JS mayor de 500 kB.
- Pendiente externo: validar las tres rutas protegidas con backend y sesión institucional, en escritorio/móvil y claro/oscuro. No se generó captura porque el contenedor no incluye Chromium, Chrome ni Firefox y el repositorio no aporta una sesión/backend reproducibles.
- Entorno único: `/workspace/SAPP-frontend/node_modules` con Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. El lockfile fija versiones; no ejecutar otra instalación ni crear venv, Conda, Poetry o un segundo árbol npm.

## Siguientes pasos
1. Confirmar que el catálogo institucional mantiene el ID 8 para **GRADO**; si el backend migra a IDs no estables, clasificar por código canónico en un único helper.
2. Verificar un crédito real con cada variante de estado del director y confirmar que seleccionar el filtro conserva únicamente las filas `PFIR_DIR_TG`.
3. Revisar visualmente el espaciado de la descripción de Gestión de profesores tras retirar el encabezado duplicado.

---

# Handoff 2026-09-24 — ajustes de matrícula financiera

## Estado actual y decisiones
- `ProcesoLiquidacionPage.tsx` ya no conserva selección de filas. Convocar envía `{ incluirVigentes: true, incluirNuevos: true }`; solicitudes y recordatorios omiten cuerpo para que el backend opere sobre todo el conjunto elegible. Los filtros solo afectan la consulta visible. La matriz de `flow.ts` controla qué acciones se renderizan en cada estado; el `fieldset` las mantiene visibles y bloqueadas durante carga.
- La tabla presenta ocho columnas: Nombre, Código, Programa académico, Tipo de estudiante, Estado, Semestre, Total y Acciones. Se mantienen programa, estado, texto, solo-alertas y paginación. El filtro de programa tiene mayor ancho y el wrapper contiene el scroll horizontal móvil. `AgregarEstudiante.tsx` conserva el selector VIGENTE/NUEVO.
- `ParametrosProcesoForm.tsx` no muestra base ni proceso base. Todo guardado construye `baseSalud: 'SMMLV'`; la creación nunca agrega `procesoBaseId`. Una base histórica `MATRICULA` solo produce una advertencia: consultar no dispara PUT ni recálculo. Los porcentajes siguen editables.
- `LiquidacionDetallePage.tsx` mueve programa, tipo y periodo a **Revisión del caso**, retira ingreso/permanencia, cohorte y promoción, filtra `PROMOCION_FALTANTE` y oculta el campo de promoción. Al guardar ajustes envía `initial.promocion`, preservando el reemplazo completo exigido por el backend. Tipos y datos históricos no se eliminaron, y Excel permanece intacto.

## Contratos y salida esperada
- `POST /liquidacionMatricula/procesos/{id}/convocar`: `{ incluirVigentes: true, incluirNuevos: true }`.
- `POST .../enviarSolicitudes` y `POST .../enviarRecordatorio`: sin `liquidacionIds` y sin selección cliente.
- `POST /liquidacionMatricula/procesos`: parámetros actuales + `periodoId` + `baseSalud: 'SMMLV'`, sin `procesoBaseId`. `PUT /procesos/{id}` usa SMMLV y conserva porcentajes.
- `PUT /liquidaciones/{id}/ajustes`: reemplazo completo con semestre, promoción histórica no visible, ajuste, valor final y observaciones.
- No hay endpoints, migraciones, schemas, dependencias ni seeds nuevos. Fixture visual: `tests/fixtures/matricula-financiera/preview.html` y `preview.jsx`; usa memoria local, no valida cálculos ni seguridad backend.

## Entorno, resultados y próximos pasos
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no ejecutar otra instalación ni crear venv, Conda o Poetry. Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol.
- Verificación local: ESLint focalizado sin errores (la fixture genera solo aviso de que ESLint la ignora), suite Node 48/48 PASS, build PASS (309 módulos; CSS 246.20 kB, JS 724.17 kB) y `git diff --check` PASS. Avisos ambientales: npm `Unknown env config "http-proxy"` y chunk JS mayor de 500 kB.
- Pendiente externo: recorrer BORRADOR/ABIERTO/CERRADO/PUBLICADO con backend y sesión institucional, inspeccionar payloads reales y revisar escritorio/móvil y claro/oscuro. No hay navegador instalado ni credenciales/backend reproducibles, por lo que no se pudo generar captura autenticada.

---

# Handoff 2026-09-24 — selector compacto de informes

## Estado actual y salida esperada
- `src/pages/Reportes/ReportesPage.tsx` conserva las tres opciones de proceso,
  pero cada botón renderiza únicamente su nombre; se retiraron del modelo local
  y de la interfaz las descripciones pequeñas redundantes.
- `src/pages/Reportes/ReportesPage.css` reduce el padding de la franja
  introductoria, elimina el margen residual de su párrafo y compacta los
  botones. La opción activa conserva borde, fondo y `aria-pressed`; los estilos
  siguen usando tokens semánticos y funcionan en temas claro/oscuro.
- Salida esperada en `/coordinacion/reportes`: franja superior sensiblemente más
  baja y una fila compacta con **Admisión**, **Matrícula** y **Créditos
  condonables**, sin subtítulos. Formularios, generación y descarga de PDF no
  cambian.

## Contratos, entorno, pruebas y continuidad
- No cambiaron API, payloads, DTO, schemas, permisos, rutas, dependencias,
  variables, seeds ni datasets. Los catálogos y reportes continúan dependiendo
  del backend institucional configurado mediante las variables Vite existentes.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm ni
  venv, Conda o Poetry. Entorno comprobado: Node.js 24.15.0, npm 11.4.2,
  React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2; el lockfile fija el árbol exacto.
- Verificación 2026-09-24: ESLint focalizado PASS; suite Node PASS (48/48);
  build PASS (309 módulos, CSS 246.08 kB y JS 726.99 kB); `git diff --check`
  PASS. El lint global continúa bloqueado por 9 errores y 1 warning
  preexistentes. Persisten el warning ambiental npm `Unknown env config
  "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Pendiente externo: revisar visualmente la ruta protegida con una sesión y el
  backend institucionales en escritorio/móvil y temas claro/oscuro. No se pudo
  generar captura porque el contenedor no incluye Chromium, Chrome ni Firefox.

---

# Handoff 2026-09-24 — matrícula académica, documentos y navegación estudiantil

## Update 2026-09-24 — navegación y solicitudes del director

### Estado actual y salida esperada
- `src/app/navigationItems.ts` detecta explícitamente `DIRECTOR` mediante los
  guards normalizados y excluye del sidebar **Matrícula** y **Proyectos de
  grado**. El rol conserva **Admisiones** y **Solicitudes**. Los perfiles de
  estudiante y gestión de posgrados mantienen sus menús anteriores.
- `src/pages/Solicitudes/SolicitudesPage.tsx` entrega `assignedOnly` para el
  director. Por ello `SolicitudesCoordinadorView` carga/presenta solamente
  **Solicitudes asignadas** y omite el listado general y sus filtros. Se conserva
  la corrección anterior que eliminó el segundo encabezado “Solicitudes”.
- No cambiaron rutas protegidas, API, schemas, contratos, payloads, dependencias,
  variables, seeds ni datasets. La restricción solicitada es de navegación y
  presentación; el backend continúa siendo la autoridad de autorización.

### Entorno, pruebas y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm ni
  venv, Conda o Poetry. Entorno comprobado: Node.js 24.15.0, npm 11.4.2,
  React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol exacto.
- Verificación 2026-09-24: ESLint focalizado PASS; build PASS (309 módulos, CSS
  246.09 kB, JS 727.22 kB); suite Node PASS (48/48); `git diff --check` PASS.
  `npm run lint` continúa bloqueado por 9 errores y 1 warning preexistentes en
  servicios placeholder, admisiones, documentos y tipos/editor de solicitudes.
  Persisten el warning ambiental npm `Unknown env config "http-proxy"` y el
  aviso informativo del chunk JavaScript mayor de 500 kB.
- Pendiente externo: validar `/solicitudes` y el sidebar con una sesión real de
  director en escritorio/móvil y temas claro/oscuro. No se generó captura porque
  el contenedor no incluye Chromium, Chrome ni Firefox y tampoco existe una
  sesión institucional reproducible.

---

## Estado actual y decisiones
- `src/pages/Matricula/MatriculaPage.tsx` pagina el resultado ya filtrado en grupos de 10. El contrato de UI esperado es **Anterior · Página N de M · Siguiente**; ambos botones están deshabilitados en los extremos, los filtros vuelven a la página 1 y escritorio/móvil muestran el mismo subconjunto. Los estilos en `MatriculaPage.css` replican Solicitudes con tokens semánticos y disposición móvil de dos botones.
- `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx` retiró **Tamaño** de cada tarjeta documental y eliminó su formateador huérfano. No cambió el DTO: `tamanoBytes` puede seguir llegando del backend; simplemente ya no se presenta en esta vista.
- `src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx` reinicia `suppressClickRef` al comenzar un nuevo gesto válido. Causa corregida: tras ciertos arrastres el navegador no emitía `click`, la bandera quedaba activa y consumía el siguiente clic legítimo sobre una tarjeta. Un arrastre actual todavía activa la bandera y su clic sintético continúa bloqueado.

## Contratos, artefactos y salida esperada
- No cambiaron endpoints, schemas, payloads, rutas, permisos ni persistencia. El listado conserva `MatriculaAcademicaListadoDto[]`; la paginación es exclusivamente cliente después de programa, periodo, estado, búsqueda y orden descendente por `fechaSolicitud`.
- No hay seeds, datasets ni artifacts nuevos. Rutas principales para revisión autenticada: `/matricula`, `/coordinacion/estudiantes` y `/coordinacion/estudiantes/:id`.
- Salida esperada: 73 matrículas producen 8 páginas (10 por página, 3 en la última); filtrar recalcula el total y vuelve a página 1. Un clic sencillo en una tarjeta abre el perfil al primer intento, mientras arrastrar horizontalmente no navega. Las tarjetas documentales muestran **Fecha de carga**, pero no **Tamaño**.

## Entorno, pruebas y próximos pasos
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no ejecutar otra instalación ni crear venv, Conda o Poetry. Versiones verificadas: Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2.
- Verificación local: ESLint focalizado PASS; build PASS (309 módulos, CSS 246.09 kB, JS 727.18 kB); suite Node PASS (48/48); `git diff --check` PASS. Avisos no bloqueantes: npm reporta `Unknown env config "http-proxy"` y Vite informa un chunk JS mayor de 500 kB.
- Pendiente externo: validar las tres rutas con sesión/backend institucionales, en claro/oscuro, escritorio/móvil, incluyendo clic, arrastre y retorno al listado. No se generó captura: el contenedor no dispone de Chromium, Chrome ni Firefox y las vistas protegidas necesitan sesión y backend no incluidos.

---

# Update 2026-09-24 — paginación visual unificada en matrícula financiera

## Estado actual y salida esperada
- `Paginacion`, el componente compartido por los listados de matrícula financiera, usa ahora la clase dedicada `mf-pagination` en lugar de combinar `mf-actions` con los botones primarios/secundarios del flujo. Su presentación replica el patrón de Solicitudes: controles pill compactos, superficie y contorno semánticos, texto neutro y alineación derecha; se centra en tablet y muestra el indicador sobre dos botones del mismo ancho en móvil.
- El contrato permanece `{ pagina: number, total: number, onChange(page): void }`. La salida accesible es un `nav` llamado **Paginación de matrícula financiera**, botones no submit y un indicador `aria-live="polite"`. Si `total` es cero, la etiqueta y la deshabilitación operan contra una página mínima. No cambiaron la obtención ni el tamaño de las páginas.
- Implementación: `src/pages/MatriculaFinanciera/FinancieraUi.tsx`; estilos responsive y compatibles con tema claro/oscuro: `src/pages/MatriculaFinanciera/MatriculaFinancieraPage.css`. No hay schemas, endpoints, payloads, dependencias, variables, seeds ni datasets nuevos.

## Entorno, validación y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no ejecutar otra instalación ni crear venv, Conda o Poetry. Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol exacto.
- Verificación local 2026-09-24: ESLint focalizado PASS; suite Node PASS (48/48); build PASS (309 módulos, CSS 245.36 kB y JS 726.81 kB); `git diff --check` PASS. Persisten el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo por el chunk JavaScript mayor de 500 kB.
- Pendiente externo: revisar con sesión institucional los listados de procesos y liquidaciones en temas claro/oscuro y anchos de escritorio/móvil. La fixture aislada disponible está en `tests/fixtures/matricula-financiera/preview.html` y usa datos ficticios en memoria. No se generó captura porque el contenedor no dispone de Chromium, Chrome ni Firefox.

---

# Update 2026-09-24 — eliminación de textos redundantes en encabezados

## Estado actual, decisión y salida esperada
- `SolicitudesCoordinadorView` eliminó el `<h3>Solicitudes</h3>` del listado general porque la ruta `/solicitudes` ya presenta ese título mediante `ModuleLayout`. La región continúa identificada accesiblemente como **Listado de solicitudes** con `aria-label`; el encabezado independiente **Solicitudes asignadas** no cambió.
- `TrabajosGradoPage` eliminó el texto “En esta primera etapa se agrupan las solicitudes académicas asociadas al desarrollo del proyecto.” de los encabezados de maestría y doctorado. Permanecen el eyebrow contextual y el título del nivel.
- Salida esperada: una sola aparición visible del título **Solicitudes** en la página general y ningún texto introductorio provisional bajo **Trabajo de investigación de maestría** o **Tesis doctoral**. No cambiaron contratos, filtros, tablas, navegación, permisos ni servicios.

## Paths, entorno, pruebas y continuidad
- Implementación: `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx` y `src/pages/TrabajosGrado/TrabajosGradoPage.tsx`. No hay schemas, artifacts, dependencias, variables, seeds ni datasets nuevos.
- Verificación local 2026-09-24: ESLint focalizado PASS; `node --test --test-isolation=none tests/*.test.ts` PASS (48/48); `npm run build` PASS (309 módulos, CSS 244.73 kB y JS 726.81 kB); `git diff --check` PASS. Persisten el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Entorno único: `/workspace/SAPP-frontend/node_modules`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. No ejecutar otro `npm install` ni crear venv, Conda o Poetry; no es un proyecto Python.
- Pendiente: validar visualmente las rutas protegidas `/solicitudes`, `/trabajos-grado/maestria` y `/trabajos-grado/doctorado` con una sesión institucional, en claro/oscuro y escritorio/móvil. El repositorio no incluye credenciales ni backend reproducible.

---

# Update 2026-09-24 — estado académico sin duplicar en tarjetas

## Estado actual, decisión y salida esperada
- `EstudianteCard` conserva la insignia visual que presenta `estadoAcademico` debajo de la fotografía y elimina la fila redundante **Estado académico** del bloque de detalles. Una tarjeta activa o inactiva debe mostrar ahora **Activo** o **Inactivo** exactamente una vez.
- La cohorte continúa visible en todos los tamaños. Se retiró la regla móvil que ocultaba el último detalle porque, tras eliminar el estado duplicado, esa regla habría ocultado la cohorte. No cambiaron el mapper, el filtro por estado, la navegación, el contrato ni los servicios.
- Contrato de entrada sin cambios: `EstudianteCoordinacion.estadoAcademico` sigue siendo una cadena normalizada por el servicio y la tarjeta mantiene las etiquetas para `ACTIVO`, `INACTIVO`, `EGRESADO`, `EN_TRABAJO_DE_GRADO` y `EN_ESPERA_CANDIDATURA`. La salida esperada contiene una insignia de estado, nombre, código UIS, cohorte y la acción **Ver perfil**.

## Paths, entorno, pruebas y continuidad
- Implementación: `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx` y `EstudianteCard.css`. No hay schemas, artifacts, dependencias, variables, seeds ni datasets nuevos.
- Verificación local 2026-09-24: `npx eslint src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx` PASS; `npm run build` PASS (309 módulos, CSS 244.73 kB y JS 727.00 kB); `node --test --test-isolation=none tests/*.test.ts` PASS (48/48); `git diff --check` PASS. `npm run lint` sigue fallando por 9 errores y 1 warning preexistentes en otros archivos. Persisten además el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Pendiente: validar visualmente el listado protegido con una sesión institucional en escritorio y móvil. No se generó captura porque el contenedor no tiene Chromium, Chrome ni Firefox y la ruta requiere autenticación/backend institucionales.
- Entorno único: `/workspace/SAPP-frontend/node_modules`; Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. No ejecutar otro `npm install` ni crear venv, Conda o Poetry; no es un proyecto Python.

---

# Update 2026-09-24 — directorio explícito del banco de evaluadores

## Estado actual y decisiones
- En `ProcesoEvaluacionPanel`, escribir nombre o correo ya no dispara búsquedas automáticas. Tanto al agregar como al reemplazar aparece **Buscar en el directorio**; abrirlo consulta `GET /sapp/procesoEvaluacionTg/jurados/banco` sin query y el formulario de filtro consulta la misma ruta con `?q={texto}` únicamente al pulsar **Buscar**.
- El listado muestra todos los campos útiles del contrato. Seleccionar una fila copia `nombre`, `correo`, `institucion`, `externo` e `idioma` al `JuradoInput`, cierra el directorio y permite revisar/editar el formulario antes de la designación. Estados esperados: indicador de carga, resultado vacío, error recuperable y cantidad de resultados.
- Contrato del banco: envelope `{ ok: boolean, message: string, data: BancoJurado[] }`; cada elemento admite `{ correo, nombre, institucion?, externo?, idioma?, participaciones, ultimaParticipacion? }`. Sin filtro la URL no debe contener `?q=`; con filtro se recortan espacios y se codifica el valor. El payload y la secuencia de designación/reemplazo no cambiaron.

## Paths, pruebas y continuidad
- Implementación: `src/modules/trabajos-grado/evaluacion/{ProcesoEvaluacionPanel.tsx,ProcesoEvaluacionPanel.css,api.ts,bancoJurados.ts}`. Regresión del constructor de URL: `tests/bancoJurados.test.ts`. No hay dependencias, schemas, variables, seeds ni datasets nuevos.
- Verificación local 2026-09-24: `node --test --test-isolation=none tests/*.test.ts` PASS (48/48); ESLint focalizado PASS; `npm run build` PASS (308 módulos, CSS 244.78 kB, JS 727.14 kB); `git diff --check` PASS. Avisos no bloqueantes: npm `Unknown env config "http-proxy"` y chunk JS mayor de 500 kB.
- Pendiente: validación autenticada con backend institucional del listado sin filtro, filtro real y selección en agregar/reemplazar; revisar claro/oscuro y móvil. No se pudo capturar la vista porque este contenedor no tiene Chromium, Chrome ni Firefox y la ruta requiere sesión/backend.
- Entorno único: `/workspace/SAPP-frontend/node_modules`; Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. No ejecutar otro `npm install` ni crear venv, Conda o Poetry; no es un proyecto Python.

---

# Update 2026-09-24 — director de trabajo de grado en perfil y detalle estudiantil

## Estado actual, contrato y salida esperada
- `PerfilPage` presenta **Director de trabajo de grado** y **Correo del director** en la tarjeta académica del estudiante. `EstudianteDetalleCoordinacionPage` presenta esos mismos valores en los metadatos del perfil consultado.
- `GET /inicio` admite `data.detalle.estudiante.directorTg: { nombreCompleto: string, correo: string } | null`. `GET /sapp/estudiantes/consulta` admite el mismo objeto `directorTg` en el nivel raíz de cada registro. Los tipos y el adaptador conservan estos contratos; el mapper de autenticación mantiene completa la proyección de `detalle.estudiante`.
- Salida esperada: con director se muestran nombre y correo exactamente como llegan; con `directorTg: null` los dos `<dd>` quedan vacíos por decisión de producto. No se muestra “Sin información”, “Pendiente” ni otro placeholder para estos campos.

## Paths, entorno, pruebas y continuidad
- Implementación: `src/api/authTypes.ts`, `src/modules/estudiantes/{types.ts,services/estudiantesMockService.ts}`, `src/pages/Perfil/PerfilPage.tsx` y `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`. Los mocks existentes declaran `directorTg: null`; no hay seeds ni datasets nuevos.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm, venv, Conda ni Poetry. No es un proyecto Python. Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol exacto.
- Verificación local 2026-09-24: ESLint focalizado PASS; `node --test --test-isolation=none tests/*.test.ts` PASS (44/44); `npm run build` PASS (307 módulos, CSS 243.32 kB y JS 724.89 kB); `git diff --check` PASS. Persisten el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo por el chunk JavaScript mayor de 500 kB.
- Pendiente: validar visualmente con sesiones institucionales el perfil del estudiante y el detalle abierto por coordinación, tanto con director como con datos históricos nulos. No se generó captura porque el contenedor no dispone de Chromium, Chrome ni Firefox y las rutas requieren credenciales y backend institucionales no reproducibles en el repositorio.

---

# Update 2026-09-24 — ocultamiento de asignadas exclusivo para coordinación

## Estado actual, decisión y salida esperada
- `SolicitudesCoordinadorView` admite `hideAssignedList`. La vista continúa consultando las asignaciones para retirar sus IDs del listado general, pero no renderiza el bloque **Solicitudes asignadas** cuando la propiedad es `true`.
- `SolicitudesPage` y `TrabajosGradoPage` activan esa propiedad únicamente si la sesión contiene el rol exacto `COORDINADOR_POSGRADOS`. No se usa `canManagePosgrados` para esta decisión porque esa guarda también incluye `ADMIN_POSGRADOS` y `SECRETARIA_POSGRADOS`, cuyos comportamientos deben permanecer sin cambios.
- Salida esperada: coordinación no ve solicitudes que tenga asignadas en ninguno de los dos módulos; administración y secretaría conservan el bloque de asignadas y los docentes conservan su listado exclusivo. Estudiantes, dirección, filtros, paginación, navegación y detalle no cambian.
- Los contratos siguen siendo `GET /sapp/solicitudesAcademicas` para el universo y `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarios_sapp.id}` para las asignadas. No se modificaron payloads, DTO, backend, esquema, dependencias, variables, seeds ni datasets.

## Paths, entorno y continuidad
- Implementación: `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx`, `src/pages/Solicitudes/SolicitudesPage.tsx` y `src/pages/TrabajosGrado/TrabajosGradoPage.tsx`.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm ni venv, Conda o Poetry. No es un proyecto Python. Entorno exacto verificado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol completo.
- Verificación local 2026-09-24: ESLint focalizado PASS; `node --test --test-isolation=none tests/*.test.ts` PASS (44/44); `npm run build` PASS (307 módulos, CSS 243.32 kB y JS 724.18 kB); `git diff --check` PASS. Persisten el warning ambiental de npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Pendiente de validación institucional: iniciar sesión separadamente como coordinación, administración, secretaría y docente; comprobar ambos niveles de proyectos de grado; y simular una asignación/desasignación. El repositorio no incluye credenciales, backend reproducible ni seeds para este flujo.

---

# Implementación 2026-09-24 — continuación autorizada tras auditoría

- El usuario pidió implementar los ajustes del análisis. Se completó la interfaz de las 24 operaciones y documentos; la entrada anterior «sin implementación» es histórica. Resumen y límites: `docs/matricula-financiera-implementacion-2026-09-24.md`.
- Nuevas rutas protegidas: `/matricula/financiera/procesos/:procesoId/liquidaciones/:liquidacionId` y `/matricula/financiera/tarifas`. Código: `src/modules/matricula-financiera/` y `src/pages/MatriculaFinanciera/`. Formularios separados para parámetros, respuestas, certificados, alta y tarifas; transporte tipado y reglas probadas. Mantener los perfiles actuales de gestión y la base `/api/sapp`.
- Contratos: ajustes reemplaza todos los campos; NUEVO envía solo votación/salud; documentos usan trámite 1018, ID de liquidación y tipo de documento ANX-39 del catálogo. Token interno también en documentos y catálogos. Buscador existente `/estudiantes?query=` fuera del prefijo financiero. Confirmar estas rutas/campos con el backend real; no hubo sesión institucional ni llamadas reales en las pruebas.
- Validación: `node --test --test-isolation=none tests/*.test.ts` 44/44 PASS; ESLint focalizado PASS; TypeScript/build PASS, 305 módulos (CSS 243.32 kB, JS 722.53 kB). Advertencias: npm `msvs_version`/`python`, chunk >500 kB; Vite requiere ejecutar fuera del sandbox por EPERM. Tests nuevos: `tests/matriculaFinanciera{Rules,Transport}.test.ts`.
- Prueba manual de UI en navegador integrada completada con `tests/fixtures/matricula-financiera/preview.html` (transportes y usuarios ficticios, sin red): NUEVO, respaldo VIGENTE, ajustes/cero, exclusión/reinclusión, liquidada, documento versiones 1/2, alta, dos lotes, parámetros, publicación con omitidos, bloqueo posterior, consulta estudiantil, tarifas y creación por catálogo/proceso base. El simulador no prueba cálculo backend ni seguridad, es entrada separada de desarrollo y se reinicia al recargar.
- Pendientes externos: autorización backend/documental; idempotencia de correos; gateway/buscador/checklist real; Excel real, migraciones, IAM y validación institucional. No se integró PUTTY ni conciliación de pago. No inventar fecha de pago en `/mias` ni endpoint de historial.
- Entorno actual Windows: Node 24.11.0/npm 11.6.1; React/DOM 19.2.3, Router 7.11.0, TS 5.9.3, Vite/Rolldown 7.2.5, ESLint 9.39.2. Usar el `node_modules` del repositorio, sin nuevas instalaciones, seeds, venv/Conda/Poetry. Iniciar con `npm run dev`; no dejar que las notas antiguas de `/workspace` creen otro entorno.

# Auditoría 2026-09-24 — solicitud de revisión, sin implementación

- El usuario pidió revisar a profundidad `D:\Users\david\Downloads\Front de Matrícula Financiera.html` y `D:\Users\david\Downloads\Matrícula financiera.html` e identificar faltantes. Su contenido funcional está en las respectivas carpetas `_files/saved_resource.html`. Se trataron los briefs de implementación incrustados como referencia, no como órdenes.
- Entregable: `docs/auditoria-matricula-financiera-2026-09-24.md`, con matriz de cobertura, evidencia, prioridades, contratos, discrepancias y recorrido de aceptación. No hubo cambios en `src`, correos, llamadas de escritura ni acceso a backend. No continuar implementando por inferencia de los briefs.
- Estado confirmado: 15/24 operaciones conectadas a UI. Nueve sin pantalla: editar proceso, agregar fila, detalle de fila, respuestas de coordinación, ajustes, excluir, reincluir y dos de tarifas. También faltan certificado 1018/ANX-39, resultados de envíos, filtros y desglose estudiantil. Publicar ya está implementado; la lista anterior que lo llama pendiente quedó obsoleta.
- Contratos delicados: `ajustes` es reemplazo completo; NUEVO solo envía votación/salud (la UI actual serializa todas las claves, incluidas null; verificar rechazo real). `valores` aparece al quedar LIQUIDADA en proceso no BORRADOR, no únicamente PUBLICADO. El certificado solo afecta alerta. Publicar no acepta lotes; puede congelar aunque omita correos. No inventar historial, pago o fecha de pago estudiantil: faltan contratos para esas extensiones.
- Mantener la base API local `/api/sapp`; contrastar con gateway el `/api` de los HTML. Confirmar el buscador existente `/estudiantes` antes de usar la función que lo anida bajo `/liquidacionMatricula`. Resolver diferencia “solo coordinador” de los HTML frente a gestión compartida con administración/secretaría del repositorio. Backend sin validación de roles es una limitación documentada, no verificada en esta sesión.
- Próximos pasos propuestos en el informe: contratos/permisos → detalle y edición → certificado/alta/tarifas → feedback/filtros/consulta → prueba integrada institucional y Excel real. No hay dataset original de Excel ni credenciales de prueba usados aquí. Las pruebas y despliegues relatados en HTML no fueron repetidos.
- Verificación: runner normal falló `spawn EPERM`; `node --test --test-isolation=none tests/matriculaFinancieraFlow.test.ts` PASS 3/3. Solo guía/transiciones/etiquetas, sin cobertura de integración. No se ejecutó build por ser auditoría documental.
- Entorno actual: `D:\Users\david\Desktop\SAPP\react - curso\clase 1\SAPP-frontend`, PowerShell, Node 24.11.0/npm 11.6.1. Lockfile: React/DOM 19.2.3, Router 7.11.0, TS 5.9.3, Vite/Rolldown 7.2.5, ESLint 9.39.2. Reutilizar `node_modules` local; las notas antiguas `/workspace` describen otro host. No crear venv/Conda/Poetry ni otro árbol npm. npm advierte configuraciones antiguas `msvs_version`/`python`.

# Actualización 2026-09-24 — guía y cierre del flujo de matrícula financiera

## Estado y decisiones
- `src/modules/matricula-financiera/flow.ts` centraliza las guías por perfil, las etiquetas del resumen y la matriz de acciones: BORRADOR permite convocar/enviar/recalcular; ABIERTO agrega recordatorio/cierre; CERRADO permite reabrir/recalcular/publicar; PUBLICADO es de consulta.
- `MatriculaFinancieraPage.tsx` muestra el contexto inicial y todos los parámetros de creación. `ProcesoLiquidacionPage.tsx` completa el cierre mediante `POST /liquidacionMatricula/procesos/{id}/publicar` con `{ fechaLimitePago }`. El backend conserva la autoridad de las transiciones.
- Prueba dirigida: `tests/matriculaFinancieraFlow.test.ts`. Pendiente validar con sesión institucional los cuatro estados, la fecha límite y los temas claro/oscuro. No existen seeds; usar datos del backend. Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm.

# Update 2026-09-24 — matrícula financiera

## Estado actual y decisiones
- Se implementó la navegación jerárquica solicitada: `/matricula` es una portada con dos opciones; el flujo anterior vive en `/matricula/academica`; el nuevo flujo vive en `/matricula/financiera`. El sidebar tiene un submenú desplegable, activo por ruta y operable en móvil.
- Coordinación dispone de lista/creación de procesos y tablero `/matricula/financiera/procesos/:procesoId`, con resumen, filtros, acciones habilitadas por estado, tabla de alertas, marcar/desmarcar liquidada y Excel. El estudiante dispone de **Mi liquidación**, preguntas dinámicas (no hay textos hardcodeados), valores y estados ternarios mediante radios sin enviar `estudianteId`.
- Seguridad deliberada: lista y tablero coordinador se muestran solo para perfiles `canManagePosgrados`; el detalle también usa `RequireRoles`. El backend aún no valida estos roles, por lo que esta barrera de interfaz no debe retirarse. Todas las llamadas usan `X-Internal-Token` con el JWT de `SAPP_AUTH_SESSION`.

## Contrato, artefactos y pendientes
- Contratos y cliente: `src/modules/matricula-financiera/{types,api}.ts`; interfaz: `src/pages/MatriculaHome` y `src/pages/MatriculaFinanciera`; rutas: `src/app/routes/matriculaRoutes.tsx`; navegación: `src/app/navigationItems.ts` y `src/components/Sidebar`. Base esperada: `/api/liquidacionMatricula`; envelope `{ ok, message, data }`; Excel es blob. Dinero llega calculado por backend y nunca se calcula/redondea aquí. Fecha-hora ISO sin zona ya representa Colombia y no debe convertirse desde UTC.
- La primera entrega cubre el camino principal. Próximos pasos: completar edición de parámetros, publicación con fecha límite, formularios de respuestas/ajustes/exclusión/reinclusión, alta manual, tarifas y certificado ANX-39 (trámite 1018); mostrar el detalle de omitidos de los envíos masivos; agregar paginación cuando el backend la exponga; validar con coordinación las 24 operaciones en dev.
- Prueba integrada sugerida: periodo libre → crear → convocar → excluir → enviar → responder como estudiante → ajustar → recordar → exportar → marcar liquidada → cerrar/publicar. No reutilizar 2026-2 si ya tiene proceso (unicidad por periodo). MailPit recibe todo el correo de dev. No hay credenciales, seeds ni dataset versionado en este repositorio.
- Entorno único: `/workspace/SAPP-frontend/node_modules`, Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. No crear venv/Conda/Poetry ni ejecutar otro `npm install`; las versiones exactas están en `package-lock.json`.
- Resultado local 2026-09-24: `npm run build` PASS (296 módulos, CSS 239.32 kB, JS 684.81 kB); permanece solo el aviso de chunk >500 kB y el warning ambiental npm `Unknown env config "http-proxy"`. La captura queda pendiente porque no hay navegador instalado ni sesión institucional reproducible.

---

# Update 2026-09-24 — clasificación doctoral en proyectos de grado

## Estado actual, causa y salida esperada
- Se confirmó la causa: `getNivelTrabajoGrado` solo buscaba la sigla histórica `DCC`, por lo que el nombre vigente `347 - DOCTORADO EN CIENCIAS DE LA COMPUTACION` caía en el fallback de maestría. La función ahora delega en el resolvedor canónico `resolveTipoPrograma`, que reconoce nombres oficiales, códigos UIS (`302`/`347`), tildes y siglas legadas.
- `TrabajosGradoPage` usa este resultado para redirigir al estudiante y elegir el catálogo. Un estudiante doctoral navega a `/trabajos-grado/doctorado` y recibe `[13, 8, 9, 4, 5]`; maestría conserva `[13, 6, 7]`. Un valor ausente o desconocido mantiene por compatibilidad el fallback a maestría.
- No se modificaron endpoints, DTO, payloads, permisos, schemas ni base de datos. El contrato de sesión sigue leyendo `session.user.estudiante?.programaCodigoNombre` con respaldo en `session.user.programa`.

## Paths, entorno, pruebas y continuidad
- Resolución compartida: `src/shared/domain/programaAcademico.ts`; integración: `src/modules/trabajos-grado/constants.ts` y `src/pages/TrabajosGrado/TrabajosGradoPage.tsx`; regresión: `tests/candidaturaDoctoral.test.ts`.
- Verificación local 2026-09-24: pruebas dirigidas PASS (7/7), suite Node completa PASS (29/29), ESLint focalizado PASS, `npm run build` PASS (287 módulos; CSS 233.01 kB y JS 670.15 kB) y `git diff --check` PASS. Persisten el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JS mayor de 500 kB.
- Pendiente: validar con backend y una sesión institucional doctoral que no aparezcan los tipos 6 y 7. Confirmar después si el ID legado 8 puede retirarse y reconsiderar el fallback si se incorpora un tercer nivel académico.
- No hay seeds ni datasets para este flujo. Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.

---

# Update 2026-09-24 — histórico y selección documental al designar jurados

## Estado actual, causa y decisiones
- `ProcesoEvaluacionPanel` muestra **Histórico de cambios** en vez de **Línea de tiempo**. El contrato de lectura no cambió: `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/historial`, con envelope `{ ok, message, data }` y la lista `HistorialProcesoEvaluacion[]` descrita en la actualización anterior.
- Se retiró del formulario de creación el checkbox **Enviar invitación al guardar**. Una designación nueva siempre manda `enviarInvitaciones: true`; el usuario no puede desactivarlo. Los reemplazos ya invitaban obligatoriamente y no cambiaron.
- La selección visual usaba correctamente `SolicitudDocumentoAdjuntoDto.idDocumento`, pero la única escritura era el `documentoEvaluarId` incluido en la designación. Ante el caso observado (selección `1191`, asignación final `1192`), el flujo ahora llama primero a `PUT /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/documento-evaluar/{documentoId}` y solo después a `POST /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/jurados`. Ambas operaciones reciben exactamente el ID seleccionado; la primera impide que la creación/invitación dependa del fallback del backend al documento más reciente.
- Salida esperada: al seleccionar el documento `1191`, la primera URL termina en `/documento-evaluar/1191`, el POST contiene `documentoEvaluarId: 1191` y `enviarInvitaciones: true`, y la recarga del proceso retorna `documentoEvaluarId: 1191` con su nombre correspondiente.

## Paths, entorno, pruebas y continuidad
- Implementación: `src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx`; texto de error del histórico: `src/modules/trabajos-grado/evaluacion/api.ts`. No hay nuevos schemas, dependencias, seeds, fixtures ni datasets.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. No es un proyecto Python. Entorno comprobado: Node.js 24.15.0 y npm 11.4.2; React/React DOM, React Router DOM, TypeScript, Vite/Rolldown y ESLint se resuelven con las versiones exactas de `package-lock.json`.
- Verificación local 2026-09-24: `npx eslint src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx src/modules/trabajos-grado/evaluacion/api.ts` PASS, `npm run build` PASS, `node --test tests/*.test.ts` PASS (28/28) y `git diff --check` PASS. El lint global continúa fallando por 9 errores preexistentes fuera de estos archivos. npm mantiene el warning ambiental conocido `Unknown env config "http-proxy"`; el build mantiene el aviso informativo por el chunk JavaScript mayor de 500 kB.
- Pendiente: validar con backend y sesión institucional el caso concreto `1191`/`1192`, inspeccionando en red que el PUT finalice antes del POST y comprobando el archivo recibido en el correo. También revisar el nuevo encabezado en claro/oscuro y móvil. La ruta protegida no dispone de credenciales ni backend reproducible dentro del repositorio.

---

# Update 2026-09-23 — historial real en la línea de tiempo de trabajos de grado

## Estado actual, contrato y salida esperada
- `ProcesoEvaluacionPanel` obtiene la línea de tiempo mediante `GET
  /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/historial`, en paralelo con
  el proceso y sus catálogos. Ya no usa `historial` del DTO general ni fabrica
  una entrada a partir del estado actual. La consulta se repite después de
  jurados, invitaciones, correcciones, recordatorios, sustentación o resultado.
- El envelope esperado es `{ ok: true, message: string, data:
  HistorialProcesoEvaluacion[] }`. Cada elemento contiene
  `estadoAnteriorSigla`, `estadoAnterior`, `estadoNuevoSigla`, `estadoNuevo`,
  `fecha`, `origen`, `responsable`, `detalle` y
  `minutosEnEstadoAnterior`; los últimos tres valores de negocio pueden ser
  `null`. La UI muestra estado nuevo, fecha en `America/Bogota`, origen y los
  campos opcionales presentes. Para un arreglo vacío muestra **No hay cambios
  de estado registrados.**
- Implementación y contrato: `src/modules/trabajos-grado/evaluacion/{api.ts,types.ts,ProcesoEvaluacionPanel.tsx}`;
  presentación: `ProcesoEvaluacionPanel.css`. No cambiaron endpoints de
  escritura, permisos, schema, paquetes, variables, seeds ni datasets.

## Entorno, resultados y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda,
  Poetry ni otro árbol npm. No es un proyecto Python. Entorno: Node.js 24.15.0,
  npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol exacto.
- Verificación local 2026-09-23: ESLint focalizado PASS; `npm run build` PASS
  (286 módulos; CSS 233.01 kB y JS 670.02 kB); `git diff --check` PASS. Persisten
  el warning ambiental npm `Unknown env config "http-proxy"` y el aviso
  informativo del chunk JavaScript mayor de 500 kB.
- Pendiente: validar con backend y sesión institucional la solicitud `67`, el
  orden cronológico retornado por el backend y el refresco tras una transición.
  También revisar la presentación en claro/oscuro y móvil. La ruta protegida no
  cuenta con credenciales ni datos reproducibles dentro del repositorio.

---

# Update 2026-09-23 — contrato general de programas académicos

## Estado actual, decisiones y salida esperada
- Se auditó el frontend ante el cambio del catálogo: id `1` es ahora `{ nombre: "MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA", nivel: "MAESTRIA", codigo_uis: "302", codigo_idp: "302:MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA" }`; id `2` es `{ nombre: "DOCTORADO EN CIENCIAS DE LA COMPUTACION", nivel: "DOCTORADO", codigo_uis: "347", codigo_idp: "347:DOCTORADO EN CIENCIAS DE LA COMPUTACION" }`.
- `src/shared/domain/programaAcademico.ts` es la fuente canónica para clasificar y mostrar programas. Reconoce id, nivel, código UIS, nombre y código IDP en camelCase/snake_case y conserva únicamente compatibilidad de lectura con `MISI`, `DCC`, `61412` y `61204`. La salida visible canónica es `302 - MAESTRÍA...` o `347 - DOCTORADO...`.
- Se adaptaron el catálogo de reportes, creación de convocatorias, cards de admisiones, selector/listado/detalle de estudiantes y selector de matrícula. Los procesos siguen enviando IDs (`1`/`2`); no se sustituyeron siglas incluidas en códigos de dominio como `PROP_TESIS_DCC`, `DEF_TI_MISI` ni códigos de asignatura.
- Contrato de entrada de `GET /sapp/programaAcademico`: arreglo dentro del envelope habitual `{ ok, message, data }`; cada elemento requiere `id` y `nombre`, y admite `nivel`, `codigoUis|codigo_uis`, `cantidadSemestres|cantidad_semestres`, `puntajeMinimoAdmision|puntaje_minimo_admision`, `codigoIdp|codigo_idp` y el legado opcional `codigoNombre`.

## Paths, entorno, pruebas y continuidad
- Implementación central: `src/shared/domain/programaAcademico.ts`; regresión: `tests/programaAcademico.test.ts`. Consumidores principales: `src/modules/estudiantes/services/estudiantesMockService.ts`, `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx`, `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`, `src/pages/Reportes/ReportesPage.tsx`, `src/pages/Matricula/MatriculaPage.tsx` y `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni un segundo árbol npm. No hay seeds nuevos. Entorno exacto: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; consultar `package-lock.json` para el árbol completo.
- Verificación local 2026-09-23: `node --test tests/programaAcademico.test.ts` PASS (3/3), ESLint focalizado PASS y build PASS (286 módulos; `index-BAvKq9XY.css` 232.60 kB e `index-Ckey4Lg-.js` 668.59 kB). Solo persisten el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Reto abierto: verificar con backend real si Jackson publica exclusivamente camelCase o conserva snake_case; la interfaz acepta ambas. Validar visualmente todas las rutas protegidas con sesión institucional y confirmar que ningún payload usa el antiguo código UIS como identificador.
- Próximos pasos: probar `GET /sapp/programaAcademico`, crear una convocatoria por cada programa, filtrar estudiantes/matrículas/reportes y revisar un detalle estudiantil. No hay credenciales ni backend reproducible en el repositorio.

---

# Update 2026-09-23 — firma ligada a la persona actualmente asignada

## Estado actual, contrato y salida esperada
- Se corrigió el caso real de la solicitud académica `72`: el crédito condonable devuelve `solicitudCreditoCondonable.personaAsignadaId: 65`, la sesión del director devuelve `detalle.persona.id: 65` y el estado es `PFIR_CAR_CONT`. El detalle muestra ahora **Firmar todos los documentos** porque compara esos identificadores de persona y no exige `DOCENTE_POSGRADOS` ni un rol de gestión específico.
- La regla general es estado firmable **y** asignación vigente. Si `personaAsignadaId` está presente, prevalece sobre cualquier resultado anterior del listado: igualdad con `session.user.persona.id` habilita la acción y desigualdad la oculta. Si el detalle de otro trámite no expone responsable, el fallback es la pertenencia a `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarios_sapp.id}`.
- Contrato incorporado al DTO: `solicitudCreditoCondonable` puede ser `null` o contener `{ id, modalidadId, modalidadNombre, personaAsignadaId, personaAsignadaNombre, solicitudAcademicaId }`. No cambió la firma: `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` sin body. Tras éxito se descarta la asignación anterior y se vuelven a consultar detalle y adjuntos; la salida esperada es que el botón desaparezca cuando el backend reasigna el trámite.

## Paths, entorno, pruebas y continuidad
- Implementación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`; contrato: `src/modules/solicitudes/api/types.ts`; reglas puras: `src/modules/solicitudes/utils/firmaSolicitud.ts`; regresión: `tests/firmaSolicitud.test.ts`. No existen seeds ni datasets para este flujo.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. No es un proyecto Python. Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` conserva las versiones exactas.
- Verificación local 2026-09-23: prueba dirigida PASS (7/7), ESLint focalizado PASS, build PASS (285 módulos; `index-BAvKq9XY.css` 232.60 kB e `index-Crf2ogxd.js` 668.53 kB) y `git diff --check` PASS. Persisten solo el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Pendiente: validar con backend y sesión institucional que el director `persona.id=65` firma la solicitud `72`, el backend cambia estado/asignación y la respuesta recargada oculta el botón. También validar un trámite no crédito cuyo detalle no incluya responsable para confirmar el fallback al listado asignado. La ruta protegida no dispone de sesión reproducible localmente.

---

# Update 2026-09-23 — agendamiento con conceptos o ajustes recibidos

## Estado actual y contrato
- El panel de coordinación habilita la tarjeta y el botón **Programar sustentación** cuando `estadoSolicitud` es `CONCEPTOS_REC` o `AJUSTES_RECIB`. La regla tolera además las formas descriptivas con espacios y conserva `EN_AJUSTES` por compatibilidad con el flujo anterior.
- La regla está aislada en `src/modules/trabajos-grado/evaluacion/estadoProcesoEvaluacion.ts` y la consume `ProcesoEvaluacionPanel.tsx`. Al abrir el formulario, la mutación continúa usando `POST /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/sustentacion` con `fechaSustentacion`, `modalidadCodigo`, `lugar`, `enlace` y `notificarJurados`.
- No cambiaron DTO, endpoint, permisos, esquema, dependencias, variables, seeds ni datasets. El backend continúa validando la transición académica.

## Pruebas, entorno y continuidad
- La regresión `tests/estadoProcesoEvaluacion.test.ts` verifica las siglas y nombres descriptivos de conceptos/ajustes recibidos, la compatibilidad con `EN_AJUSTES` y el bloqueo de estados no agendables.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. Las versiones exactas permanecen registradas en `package-lock.json` y la aplicación se ejecuta con `npm run dev` sin seeds.
- Verificación local 2026-09-23: prueba dirigida PASS (2/2), ESLint focalizado PASS, build PASS (285 módulos; `index-BAvKq9XY.css` 232.60 kB e `index-D8oZUkhF.js` 668.32 kB) y `git diff --check` PASS. Persisten únicamente el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo por el chunk JavaScript mayor de 500 kB. No se generó captura porque el contenedor no tiene Chromium, Chrome ni Firefox y la ruta protegida requiere una sesión institucional.
- Pendiente: validar en una sesión real de coordinación una solicitud doctoral en `AJUSTES_RECIB` y otra en `CONCEPTOS_REC`, incluido el envío del formulario. La ruta es protegida y requiere backend y autenticación institucional.

---

# Update 2026-09-23 — cierre de la firma docente después de reasignar

## Estado actual, causa y decisión
- Se corrigió la regresión posterior a la habilitación de firma para `DOCENTE_POSGRADOS`: después de un `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` exitoso, el detalle recargaba el nuevo estado pero conservaba en memoria `isAssignedToCurrentUser=true`. Como el siguiente estado podía ser también firmable (por ejemplo, `PFIR_COOR_POS`), el botón seguía visible aunque el backend ya hubiera asignado el trámite a otra persona.
- Una firma exitosa consume ahora inmediatamente la asignación local del docente antes de recargar el detalle y los adjuntos. Por tanto, aunque el siguiente estado admita firma para otro rol, `puedeFirmarDocumentosSolicitud` recibe `estaAsignadaAlUsuario=false` y oculta la acción. Gestión de posgrados conserva su regla previa.
- No cambiaron endpoints ni DTO: firma mediante `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` sin body; detalle mediante `GET /sapp/solicitudesAcademicas/{id}`; documentos mediante la consulta existente por trámite. El backend sigue obligado a validar autorización/asignación.

## Paths, pruebas y continuación
- Implementación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`. Regla y regresión: `src/modules/solicitudes/utils/firmaSolicitud.ts` y `tests/firmaSolicitud.test.ts`.
- Validación local 2026-09-23: prueba dirigida PASS (5/5), ESLint focalizado PASS, build PASS (284 módulos; `index-Ch9v6k1n.css` 231.65 kB e `index-Cl4WuzZh.js` 668.40 kB) y `git diff --check` PASS. Persisten únicamente el warning ambiental npm `Unknown env config "http-proxy"` y el aviso informativo por el chunk JavaScript mayor de 500 kB.
- Pendiente: validar con una sesión institucional `DOCENTE_POSGRADOS` que, tras firmar un crédito en `PFIR_CAR_CONT`, el backend lo mueve al responsable siguiente y el botón desaparece sin recargar manualmente la página.
- No existen seeds o datasets para este flujo. Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. El entorno permanece en Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2.

---

# Update 2026-09-23 — acciones intuitivas en el proceso de evaluación

## Estado actual y decisiones
- En `ProcesoEvaluacionPanel`, la creación de jurados se inicia con **Agregar
  evaluador**, ubicado en la cabecera de la tabla **Jurados evaluadores**. El
  formulario conserva la selección obligatoria del documento y la fecha límite.
- Se ocultó el selector independiente **Definir documento**; no se eliminó el
  servicio API porque continúa siendo utilizado por la carga de correcciones del
  estudiante. **Enviar a ajustes** ahora se muestra como **Enviar a
  correcciones**, sin cambiar su mutación ni transición de backend.
- Para `CONCEPTOS_REC` y `EN_AJUSTES`, una tarjeta semántica destacada comunica
  **Conceptos completos**, explica que ya se puede programar la sustentación y
  contiene el CTA correspondiente. Usa únicamente tokens del tema y reorganiza
  el CTA a ancho completo en móvil.

## Contratos, paths y próximos pasos
- Implementación: `src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx`
  y `.css`. No cambiaron DTO, endpoints, schema, paquetes, variables, seeds ni
  datasets. La designación conserva `documentoEvaluarId` dentro del payload de
  `POST /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/jurados`; correcciones
  conserva la operación `enviarAAjustes` existente.
- Verificación 2026-09-23: ESLint focalizado PASS; build PASS (284 módulos,
  `index-BAvKq9XY.css` 232.60 kB e `index-s05zH_eG.js` 668.02 kB), con el aviso
  informativo conocido por chunk mayor de 500 kB; `git diff --check` PASS.
- Pendiente validar con sesión institucional los estados `JUR_POR_DESIG`,
  `CONCEPTOS_REC` y `EN_AJUSTES`, además de claro/oscuro y móvil. No se generó
  captura porque el contenedor no tiene Chromium, Chrome ni Firefox y la ruta
  protegida requiere backend, datos y autenticación institucionales.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear
  venv, Conda, Poetry ni otro árbol npm. Node.js 24.15.0, npm 11.4.2,
  React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2.

---

# Update 2026-09-23 — firma docente de créditos condonables asignados

## Estado actual y causa corregida
- La causa estaba en `SolicitudDetallePage`: `canSignAllDocuments` exigía `canManagePosgrados`, aunque `SolicitudesPage` sí permite que `DOCENTE_POSGRADOS` consulte sus trámites mediante el listado **Solicitudes asignadas**. Por ello el backend entregaba la asignación, pero la interfaz ocultaba el botón.
- El detalle consulta ahora `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarioSappId}` para docentes y habilita **Firmar todos los documentos** solo si el ID abierto está incluido y el estado admite firma. `firmaSolicitud.ts` centraliza esta regla y reconoce `PFIR_DIR_TG`, `PFIR_COOR_POS`, `PFIR_CAR_CONT` y nombres que contienen `POR FIRMA`. Gestión de posgrados conserva el acceso previo.
- La mutación no cambió: `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}`, respuesta esperada `{ ok, message, data? }`. Tras el éxito se vuelven a consultar el detalle y los adjuntos. El backend debe seguir comprobando autorización y asignación.

## Paths, validación y próximos pasos
- Implementación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` y `src/modules/solicitudes/utils/firmaSolicitud.ts`. Cobertura: `tests/firmaSolicitud.test.ts` (docente asignado, solicitud ajena, estado no firmable, sigla y gestión).
- Validación local 2026-09-23: test dirigido PASS (4/4), ESLint focalizado PASS, build PASS (284 módulos; `index-Ch9v6k1n.css` 231.65 kB e `index-NzlJh6WO.js` 668.39 kB) y `git diff --check` PASS. Persiste el warning informativo del chunk mayor de 500 kB y el warning ambiental npm `Unknown env config "http-proxy"`.
- Pendiente: validar con una sesión institucional `DOCENTE_POSGRADOS` un crédito asignado en `PFIR_CAR_CONT`, ejecutar la firma y confirmar el nuevo estado/documentos. No hubo captura: la corrección no puede representarse sin backend, datos y sesión institucional disponibles.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. No existen seeds ni datasets para este flujo.

---

# Update 2026-09-23 — título y resumen visibles en el detalle de trabajo de grado

## Estado actual y contrato
- `SolicitudDetallePage` presenta **Título** y **Resumen** inmediatamente antes de
  **Observaciones** para estudiantes y coordinación cuando alguno de esos datos
  está disponible. Primero usa `SolicitudAcademicaDto.tituloTrabajo` y
  `resumenTrabajo`; para los códigos con proceso de evaluación usa como respaldo
  `ProcesoEvaluacionTg.titulo` y `resumen`.
- El respaldo consume el endpoint autenticado existente `GET
  /sapp/procesoEvaluacionTg/solicitud/{solicitudId}`, cuya envoltura esperada es
  `{ "ok": true, "message": string, "data": { "titulo": string,
  "resumen": string | null, ... } }`. Un 404 previo a la creación del proceso
  se ignora de forma deliberada y no reemplaza ni bloquea el detalle académico.
- No cambiaron la creación (`tituloTrabajo`/`resumenTrabajo`), las transiciones,
  los permisos, los endpoints, el schema, las dependencias, variables, seeds o
  datasets. Queda pendiente validar con sesiones institucionales de ambos roles
  un trámite que solo exponga esos valores mediante el DTO del proceso.

## Paths, entorno y resultados
- Implementación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`.
  Contratos reutilizados: `src/modules/solicitudes/api/types.ts` y
  `src/modules/trabajos-grado/evaluacion/{api,types}.ts`.
- Verificación local 2026-09-23: ESLint focalizado PASS; `npm run build` PASS
  (283 módulos, `index-Ch9v6k1n.css` 231.65 kB e `index-Bj4f55CP.js` 667.87
  kB); `git diff --check` PASS. Persisten solo el warning ambiental npm
  `Unknown env config "http-proxy"` y el aviso informativo del chunk mayor de
  500 kB. Las pruebas Node dirigidas pasan (6/6). `npm run lint` conserva 9
  errores y 1 warning preexistentes en servicios placeholder, admisiones,
  validación documental y tipos/editor de solicitudes; el archivo modificado
  pasa ESLint de forma aislada.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear
  venv, Conda, Poetry ni otro árbol npm. Node.js 24.15.0, npm 11.4.2,
  React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2. No existe seed para este flujo.

---

# Update 2026-09-23 — estados de proyectos de grado en solicitudes

## Estado actual y decisiones

- `src/modules/solicitudes/utils/estadoSolicitud.ts` reconoce los estados 12 a
  20: `JUR_POR_DESIG`, `JUR_INVITADO`, `EN_EVALUACION`, `CONCEPTOS_REC`,
  `EN_AJUSTES`, `SUST_PROGRAMADA`, `SUSTENTADA`, `APLAZADA` y `NO_APROBADA`.
  El catálogo fallback conserva los IDs y nombres de negocio acordados.
- El catálogo remoto de `GET /sapp/estadosSolicitud` deja de descartar esas
  siglas. Todos sus nombres se recortan y convierten a mayúsculas en español;
  por ello filtros, tarjetas, tablas y detalle comparten exactamente la misma
  presentación. `StatusBadge` asigna las variantes visuales semánticas
  existentes sin introducir colores nuevos.
- El encabezado y la línea de tiempo de `ProcesoEvaluacionPanel` también
  presentan el nombre del estado en mayúsculas, usando el código como fallback.
  No cambiaron transiciones, permisos, endpoints, DTO, schemas, seeds,
  datasets, paquetes ni variables de entorno.

## Contrato, pruebas y próximos pasos

- Contrato esperado de cada estado: `{ "id": 12..20, "nombre": string,
  "sigla": string }` dentro de la envoltura usual de
  `GET /sapp/estadosSolicitud`. La salida visible esperada incluye, por
  ejemplo, `EN EVALUACIÓN`, `EN AJUSTES DEL ESTUDIANTE` y `SUSTENTACIÓN
  PROGRAMADA` en mayúsculas.
- Se agregó `tests/estadoSolicitud.test.ts`, que cubre los nueve IDs/siglas,
  sus nombres fallback y la normalización del catálogo remoto. Verificaciones
  del 2026-09-23: test dirigido PASS (2/2), lint dirigido PASS, build PASS (283
  módulos; `index-CagCtW9j.css` 231.16 kB e `index-CXCuEgEZ.js` 665.87 kB) y
  `git diff --check` PASS. El build conserva el aviso informativo del chunk
  mayor de 500 kB; npm conserva el warning ambiental `Unknown env config
  "http-proxy"`.
- Pendiente validar con sesión institucional los filtros/listados y detalles de
  estudiante y coordinación, además del proceso de evaluación en temas claro y
  oscuro. No hubo captura local: las rutas requieren autenticación y datos del
  backend, y el contenedor no dispone de Chromium, Chrome ni Firefox.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear
  venv, Conda, Poetry, entornos Python ni otro árbol npm. El proyecto usa Node
  24.15.0 y npm 11.4.2; el resto de versiones exactas permanece fijado por
  `package-lock.json` y resumido en `README.md`.

---

# Update 2026-09-23 — etiqueta contextual al aprobar proyectos de grado

## Estado actual, contrato y salida esperada
- `SolicitudDetallePage` calcula la etiqueta de su botón de aprobación mediante
  `getAprobacionTrabajoGradoLabel`, definido en
  `src/modules/trabajos-grado/constants.ts`. La regla se aplica únicamente a los
  IDs incluidos en `TIPOS_TRABAJO_GRADO_IDS`.
- Una solicitud de proyecto en estado enviado a Comité muestra **Aprobar y enviar
  a consejo académico**; si el estado contiene Consejo muestra **Aprobar y
  asignar jurados**. Otros trámites conservan **Aprobar**. La normalización admite
  siglas y nombres descriptivos, con o sin tilde.
- Solo cambió el texto visible. `handleApproveClick`, la selección obligatoria de
  acta, el destino `APROBADA`, los parámetros y las llamadas HTTP no cambiaron.
  El backend continúa siendo la autoridad de las transiciones.

## Paths, pruebas y próximos pasos
- Implementación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` y
  `src/modules/trabajos-grado/constants.ts`. Cobertura dirigida:
  `tests/trabajoGradoApprovalLabel.test.ts`.
- Pendiente verificar las dos etiquetas con una sesión real de coordinación y
  datos en `ENVIADA_COMITE`/`ENVIADA` y `ENVIADA_CONSEJO`, además de confirmar el
  resultado de cada transición contra el backend institucional.
- Verificación local 2026-09-23: `node --test
  tests/estadoSolicitud.test.ts tests/trabajoGradoApprovalLabel.test.ts` PASS
  (6/6); ESLint focalizado PASS; `npm run build` PASS (283 módulos,
  `index-Ch9v6k1n.css` 231.65 kB e `index-Cs3olfrj.js` 667.10 kB), con el aviso
  informativo conocido por el chunk mayor de 500 kB; `git diff --check` PASS.
  No se tomó captura: Chromium, Chrome y Firefox no están instalados y la ruta
  protegida necesita backend y sesión institucional.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear
  venv, Conda, Poetry ni otro árbol npm. El proyecto no tiene seeds ni datasets
  para este flujo. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React
  Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC
  4.2.2 y ESLint 9.39.2.

---

# Update 2026-09-23 — títulos académicos y examen doctoral al crear solicitudes

## Estado actual y contrato

- `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx` separa los tipos de maestría 6/7 de los tipos doctorales 4/5. El control se presenta respectivamente como **Título del trabajo de investigación** y **Título de la tesis**; en ambos grupos el título y el resumen siguen siendo obligatorios.
- El tipo 9 (**Examen doctoral**) presenta la sección **Información del examen doctoral** con un único control obligatorio, **Título del trabajo**. Su payload esperado es `{ "estudianteId": 10, "tipoSolicitudId": 9, "tituloTrabajo": "..." }` más los campos generales existentes; `resumenTrabajo` se omite incluso si quedó un valor local de una selección anterior.
- La validación diferencia título y resumen, y el payload incluye cada propiedad solo cuando corresponde. No se cambiaron DTO, endpoints, dependencias, variables, seeds ni datasets.

## Validación pendiente y entorno

- Ejecutar una prueba autenticada de los tipos 4, 5, 6, 7 y 9 contra `POST /sapp/solicitudesAcademicas` y confirmar persistencia en el detalle. También falta validar visualmente los textos en claro/oscuro y móvil/escritorio porque el contenedor no dispone de navegador ni sesión/backend institucional.
- Verificaciones locales del 2026-09-23: ESLint focalizado PASS; build PASS con 283 módulos, `index-CagCtW9j.css` (231.16 kB) e `index-B8Sy5Gag.js` (666.24 kB); `git diff --check` PASS. Persisten únicamente el warning ambiental de npm `Unknown env config "http-proxy"` y el aviso informativo del chunk JavaScript mayor de 500 kB.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entornos Python ni otro árbol npm. El proyecto usa Node 24.15.0 y npm 11.4.2; las versiones instaladas están fijadas por `package-lock.json`.

---

# Update 2026-09-23 — creación de solicitudes de proyectos de grado

## Estado actual y decisiones

- El formulario compartido `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx` detecta los tipos 4, 5, 6 y 7 y muestra dos controles obligatorios: **Título del trabajo** y **Resumen del trabajo**. La validación impide enviar cualquiera vacío; el payload recorta espacios y los omite para los demás tipos.
- `SolicitudesEstudianteView.tsx` reenvía ambos valores al contrato ya tipado `CreateSolicitudRequestDto`, de modo que `POST /sapp/solicitudesAcademicas` recibe `{ estudianteId, tipoSolicitudId, tituloTrabajo, resumenTrabajo, ... }`.
- `TrabajosGradoPage.tsx` dejó de aplicar `contextualizarTipoTrabajoGrado`. El catálogo conserva ahora el `nombre` retornado por `GET /sapp/tipoSolicitud`; además, el selector prioriza explícitamente `nombre` sobre `codigoNombre`. Para el ID 13 la salida esperada es el nombre exacto del backend, por ejemplo `ENVIO DE TEMA DE TRABAJO DE INVESTIGACION/TESIS`, sin sustitución según maestría/doctorado.
- Se mantienen la clasificación por programa del tipo 13, los tipos permitidos por nivel, documentos, rutas, permisos y resto del flujo. No se añadieron endpoints, paquetes, schemas, variables, seeds ni datasets.

## Contrato y próximos pasos

- Entrada relevante de catálogo: `{ "id": 13, "nombre": "ENVIO DE TEMA DE TRABAJO DE INVESTIGACION/TESIS", "tramiteId": 19 }`. `tipoSolicitudService` sigue normalizando `tramiteId` hacia `tipoTramiteId` solo para consultar documentos y no altera el nombre.
- Payload esperado para 4/5/6/7: `{ "estudianteId": 10, "tipoSolicitudId": 5, "tituloTrabajo": "...", "resumenTrabajo": "..." }`, además de los campos generales existentes (`fechaResolucion`, `observaciones` y los opcionales aplicables).
- Pendiente: prueba autenticada contra backend para cada uno de los cuatro IDs, verificación de persistencia en el detalle y captura en claro/oscuro y móvil/escritorio. El contenedor no tiene navegador ni sesión/backend institucional, por lo que no fue posible hacer la validación visual solicitada.

## Entorno y resultados

- Reutilizar únicamente `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entorno Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2, typescript-eslint 8.51.0 y Lucide 0.468.0-local.
- `npx eslint src/pages/TrabajosGrado/TrabajosGradoPage.tsx src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx`: PASS; solo warning ambiental npm `Unknown env config "http-proxy"`.
- `npm run build`: PASS; 281 módulos, `dist/assets/index-DhxWK-Ve.css` (230.07 kB) e `index-Ds21m2NR.js` (661.11 kB). Persiste el warning informativo del chunk mayor de 500 kB. `git diff --check`: PASS. No existe script automatizado `test`.

---

---

# Update 2026-09-22 — proceso privado de evaluación de trabajos de grado

## Estado actual y decisiones
- `SolicitudDetallePage` monta `ProcesoEvaluacionPanel` únicamente para coordinación, cuando el código es uno de los cinco trámites evaluables y la solicitud ya dejó Comité/Consejo. `TEMA_T` nunca monta el proceso. El botón Volver conserva ahora el nivel de `/trabajos-grado/:nivel`.
- `src/modules/trabajos-grado/evaluacion/api.ts` contiene los 12 contratos privados bajo `/sapp/procesoEvaluacionTg`; `types.ts` declara proceso, jurados, evaluaciones, catálogos y payloads. Se usa el cliente compartido, que ya adjunta JWT Bearer y extrae `message` de errores JSON.
- El panel implementa resumen, barra contextual, designación de un jurado por llamada (el endpoint permite sumar jurados), banco con debounce, historial activo/inactivo, reenvío/reemplazo/retiro, recordatorios, documento, ajustes, sustentación, resultado y línea de tiempo. Catálogos no están hardcodeados; `ES`/`EN` sí son el contrato de idioma.
- `SolicitudAcademicaDto` y `CreateSolicitudRequestDto` admiten `tituloTrabajo` y `resumenTrabajo`. La elegibilidad por código está centralizada en `src/modules/trabajos-grado/constants.ts`; los IDs históricos siguen temporalmente para filtrar los listados existentes hasta que esos componentes migren por completo al código.

## Contratos y salida esperada
- Respuesta común: `{ ok: boolean, message: string, data: T }`. Mutaciones de jurados, documento, ajustes, sustentación y resultado deben devolver el proceso completo actualizado; el panel repinta directamente con `data`.
- Se asumieron los nombres de campos documentados en el brief: `estadoInvitacion`, `evaluaciones`, `documentos`, `historial`, `sustentacion`, `resultadoCodigo` y `notaFinal`. Antes de integración real, contrastar `types.ts` con los ejemplos completos de Bruno y ajustar nombres/nulabilidad si el DTO backend difiere.
- `VITE_API_URL=/api/sapp`; Vite dirige esa ruta a `VITE_DEV_PROXY_TARGET=http://localhost:8080`. No agregar `/sapp_public` a este repositorio. No hay cambios de schema, migraciones, seeds o datasets.

## Retos y siguientes pasos
1. Validar contra Bruno el GET del proceso en todos los estados y confirmar que el backend devuelve `documentos` e `historial`; el panel tiene fallback de línea de tiempo al estado actual.
2. Confirmar con backend el cálculo oficial de plazos hábiles. Los defaults actuales son sugerencias de calendario (21/28/60 días), editables; no modelan festivos colombianos.
3. Probar los 400 y todas las mutaciones en un ambiente no productivo, especialmente acta inexistente, correo duplicado, modalidad incompleta y restricciones desde `SUST_PROGRAMADA`.
4. Hacer revisión visual autenticada a 320/375/402/440 px y escritorio, claro/oscuro. La modificación es perceptible, pero el contenedor no dispone de navegador ni backend/sesión, por lo que no hay captura.

## Entorno y verificación
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entorno Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2.
- `npm run build`: PASS; 281 módulos, `index-DhxWK-Ve.css` (230.07 kB) e `index-DULI6bCU.js` (660.33 kB). Persiste el warning informativo por chunk mayor de 500 kB.
- `npx eslint src/modules/trabajos-grado/evaluacion src/modules/trabajos-grado/constants.ts src/pages/SolicitudDetalle/SolicitudDetallePage.tsx src/modules/solicitudes/api/types.ts`: PASS; solo warning ambiental conocido de npm por `http-proxy`.

---

# Update 2026-09-22 — módulo inicial de Proyectos de grado

## Estado actual y alcance
- Existe un nuevo acceso **Proyectos de grado** y las rutas `/trabajos-grado/maestria` y `/trabajos-grado/doctorado`. Estudiantes ven solo el nivel inferido de `programaCodigoNombre`; coordinación puede alternar ambos.
- La clasificación está centralizada en `src/modules/trabajos-grado/constants.ts`: maestría usa tipos 13, 6 y 7; doctorado usa 13, 8, 4 y 5. El tipo 13 conserva su ID y el nombre exacto entregado por el backend.
- Las vistas reutilizables de solicitudes aceptan inclusión/exclusión de tipos, transformación de etiquetas y una ruta de detalle configurable. El módulo general excluye los seis tipos trasladados; no hubo cambios de API, payload, schema, seeds ni datasets.
- El detalle sigue usando `SolicitudDetallePage` y los endpoints `/sapp/solicitudesAcademicas`. Las futuras funciones de expediente, informes, evaluadores, calificación y defensa no forman parte de este incremento.

## Validación y siguientes pasos
- `npm run build`: PASS; 278 módulos, con el aviso informativo habitual por el chunk mayor de 500 kB.
- `npm run lint`: conserva errores preexistentes fuera del cambio. El lint focalizado de los archivos modificados pasa después de estabilizar la carga estudiantil con `useCallback`.
- Pendiente validar con sesión real ambos roles, los seis tipos y programas cuyo nombre institucional identifique maestría o doctorado. Si el backend expone el nivel explícitamente, reemplazar la inferencia textual por ese campo.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. El proyecto conserva las versiones documentadas en este archivo y `package-lock.json`.

---

# Update 2026-09-23 — asignación de la nueva versión del documento en evaluación

## Estado actual y contrato
- `AjustesEstudiantePanel` ya no se limita a cargar una nueva versión. Tras el
  éxito de `POST /sapp/document`, toma exclusivamente
  `DocumentUploadResponseDto.id` y ejecuta `PUT
  /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/documento-evaluar/{id}`
  mediante el servicio existente `definirDocumentoEvaluar`.
- La llamada de asignación es exclusiva de la corrección estudiantil solicitada
  por observaciones: la UI de carga solo se muestra con `enAjustes === true` y
  `handleUpload` vuelve a exigir esa condición antes de iniciar las dos
  mutaciones. No afecta la carga inicial, otros estados ni las acciones de
  coordinación.
- Las operaciones son secuenciales: solo después de cargar y asignar se limpia
  el archivo, se informa éxito y se refrescan en paralelo el proceso, la
  solicitud, el checklist y los adjuntos. Si falla la segunda llamada, se
  conserva el archivo seleccionado y se muestra el mensaje del backend; no se
  afirma que el cambio quedó completo.
- El ID no se infiere del checklist ni del proceso anterior. Debe ser el ID de
  la respuesta de carga, pues representa el nuevo registro/versionado que los
  jurados evaluarán. La respuesta esperada de la asignación mantiene
  `{ ok: boolean, message: string, data: ProcesoEvaluacionTg }`.

## Paths, retos y próximos pasos
- Implementación: `src/modules/trabajos-grado/evaluacion/AjustesEstudiantePanel.tsx`.
  Servicios reutilizados: `src/api/documentUploadService.ts` y
  `src/modules/trabajos-grado/evaluacion/api.ts`.
- Probar con backend autenticado que una carga nueva retorna un `id`
  distinto y que el `GET` posterior expone ese mismo valor en
  `documentoEvaluarId`. También verificar el comportamiento si el documento se
  guarda pero la asignación falla: hoy el usuario puede reintentar y generar
  otra versión porque el backend no ofrece una transacción conjunta.
- No se agregaron dependencias, variables, seeds ni datasets. Reutilizar
  `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni un
  segundo árbol npm. Las versiones exactas y comandos están en `README.md` y
  `package-lock.json`.
- Verificación 2026-09-23: `npx eslint
  src/modules/trabajos-grado/evaluacion/AjustesEstudiantePanel.tsx` PASS;
  `npm run build` PASS (283 módulos, `index-CagCtW9j.css` 231.16 kB e
  `index-BSplSaVc.js` 665.92 kB), con el aviso informativo conocido por el chunk
  JavaScript mayor de 500 kB; `git diff --check` PASS. La secuencia HTTP real
  queda pendiente de sesión y backend institucionales.

# Update 2026-09-23 — recarga estudiantil del documento en evaluación

## Estado, contrato y decisiones
- En el detalle, estudiantes con solicitudes tipo 4, 5, 6, 7 u 8 consultan
  siempre `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}` mediante
  `getProcesoEvaluacion`. La respuesta usa la envoltura `{ ok, message, data }`;
  se consumen `documentoEvaluarId`, `documentoEvaluarNombre` y
  `jurados[].evaluaciones[].observaciones`.
- Si el DTO de la solicitud indica `estadoId: 16` o `estadoSigla: EN_AJUSTES`,
  `AjustesEstudiantePanel` presenta los conceptos, pide un nuevo archivo con el
  nombre retornado y relaciona `documentoEvaluarId` con el documento cargado del
  checklist. La carga conserva el contrato existente de `POST /sapp/document`
  (tipo documental, trámite, usuario, Base64, MIME, tamaño y SHA-256).
- Después de una carga exitosa se vuelven a consultar proceso, solicitud,
  checklist y adjuntos. Fuera de `EN_AJUSTES` la consulta se conserva, pero no
  se expone el formulario. Coordinación mantiene su panel sin cambios.

## Paths, resultados y siguientes pasos
- Implementación: `src/modules/trabajos-grado/evaluacion/AjustesEstudiantePanel.tsx`
  y `.css`; integración en `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`;
  contrato tolerante a aliases del backend en `evaluacion/types.ts`.
- Pendiente probar con backend autenticado que el checklist contiene un
  `documentoUploadedResponse.idDocumento` igual a `documentoEvaluarId` y que la
  nueva versión hace avanzar el flujo. Si backend exige un endpoint específico
  de reemplazo por ID de documento, debe acordarse y sustituirse solamente la
  mutación; no inferir IDs.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm,
  venv, Conda ni Poetry. No existen seeds para este flujo. Versiones exactas en
  `package-lock.json` y resumen en `README.md`.
- Verificación: `npm run build` PASS (283 módulos, CSS 231.17 kB y JS 664.76
  kB; solo aviso conocido de chunk); ESLint focalizado PASS; `git diff
  --check` PASS. `npm run lint` conserva 9 errores y 1 warning preexistentes en
  servicios placeholder, admisiones, validación documental y tipos/editor de
  solicitudes. No se tomó captura: no hay Chromium, Chrome ni Firefox en el
  contenedor, y el flujo requiere backend y sesión estudiantil.

---

# Update 2026-09-21 — orden unificado de los módulos principales

## Estado actual y decisión
- `src/app/navigationItems.ts` es la fuente compartida por el sidebar y las
  tarjetas de la pantalla de Inicio. Su orden es ahora: **Admisiones, Matrícula,
  Solicitudes, Créditos condonables, Estudiantes, Informes a dependencias,
  Actas, Fechas y Gestión profesores**.
- El filtrado existente por roles se conserva. Si un usuario no puede ver un
  módulo, este se omite y los restantes mantienen el orden relativo definido;
  no se duplicó la configuración en `Sidebar.tsx` ni en `HomePage.tsx`.
- No cambiaron rutas, iconos, etiquetas, permisos, contratos HTTP, estilos,
  dependencias, variables de entorno, schemas, seeds ni datasets.

## Salida esperada, entorno y siguientes pasos
- Coordinación debe ver los nueve accesos en el orden indicado tanto en el menú
  lateral como en Inicio. Otros roles deben ver solamente su subconjunto
  autorizado, en ese mismo orden relativo.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda,
  Poetry, entornos Python ni otro árbol npm. Este proyecto usa Node.js/npm y no
  tiene script `test`. Las versiones exactas están en `package-lock.json` y
  resumidas en `README.md`.
- Pendiente: comprobación visual autenticada con los distintos roles en
  escritorio y móvil. El contenedor no dispone de Chromium, Chrome ni Firefox y
  las rutas requieren una sesión institucional, por lo que no se generó captura.
- `npx eslint src/app/navigationItems.ts`: PASS (solo el warning ambiental de
  npm por `http-proxy`). `npm run build`: PASS, 273 módulos y artefactos
  `dist/assets/index-BAnVHByW.css` (224.30 kB) e `index-DaC1sGKb.js`
  (638.83 kB); persiste el aviso informativo por el chunk superior a 500 kB.
  `git diff --check`: PASS. `npm run lint`: FAIL por 9 errores y 1 warning
  preexistentes fuera de `navigationItems.ts`.

---
# Update 2026-09-21 — seguimiento de matrícula del estudiante

## Estado actual y decisiones
- Rutas confirmadas en `src/app/routes/matriculaRoutes.tsx`: `/matricula` → `MatriculaPage` (estudiante o listado según rol), `/matricula/:matriculaId` → `MatriculaDetalleCoordinacionPage` (gestión). No se creó una ruta estudiantil nueva ni se reutilizó el endpoint autorizado a coordinación.
- El estudiante consume `GET /sapp/matriculaAcademica/vigente/estudiante/{estudianteId}` y los documentos mediante `getDocumentosMatriculaAcademica(matricula.id)`. Estado general, fecha/observación general y asignaturas proceden del primer contrato; documento, obligatoriedad, revisión/observación y contenido proceden del segundo. Errores documentales se muestran aparte y no producen un contador `0/0`.
- `selectStudentMatricula` evita `data[0]`: admite `periodoId` y, al no recibirlo, escoge de forma estable la fecha de solicitud más reciente y luego el mayor ID. Limitación pendiente: la pantalla hoy no recibe un período/ID desde URL; el endpoint denominado `vigente` es el único contexto estudiantil disponible. Confirmar con backend si puede devolver más de una vigente y si debe exponer explícitamente el período objetivo.
- El resumen muestra etiqueta del estado del backend, número, programa si está en el DTO, período, solicitud, revisión neutral (`—`) y observación general. No muestra usuario revisor. Materias se relacionan por `asignaturaId` con catálogo y conservan aparte `matriculaAsignaturaId`; si el catálogo no contiene una materia, ya no se elimina: usa nombre/código del contrato y nivel neutral.
- `FINALIZADA`, `RADICADA` y `PENDIENTE_DOCUMENTOS` son los únicos estados generales confirmados en el código. Las demás etiquetas son neutrales. Estados de materias confirmados: `MATRICULADA`, `APROBADA`, `NO_MATRICULADA`, `RECHAZADA`, `PENDIENTE`. La carga estudiantil solo permanece disponible en `PENDIENTE_DOCUMENTOS`; estados desconocidos se bloquean de forma conservadora. Coordinación mantiene aprobación/rechazo y guardado existentes, pero ahora comparte etiquetas y muestra **Observaciones de la matrícula**.

## Paths, fixture, contrato y salida esperada
- Render/estilos estudiante: `src/pages/Matricula/MatriculaPage.tsx` y `.css`; tabla responsive de materias: `src/modules/matricula/components/MateriasSelectedTable/`; documentos: `src/modules/matricula/components/DocumentosRequeridosTable/`. Coordinación: `src/pages/MatriculaDetalleCoordinacion/`.
- Tipos/consulta: `src/modules/matricula/types.ts` y `services/matriculaAcademicaService.ts`. Presentación, fecha sin conversión de zona y selección: `src/modules/matricula/utils/matriculaPresentation.ts`.
- Fixture y prueba: `tests/fixtures/matricula/student-matriculas.json`, `tests/matriculaPresentation.test.ts`. Es dato sintético no usado por producción y cubre dos matrículas, dos estados de materia, grupo nulo, observaciones, fecha ausente y estado desconocido. No hay seeds ni datasets adicionales.
- Respuesta esperada: `data: MatriculaAcademicaVigenteDto[]`; cada registro conserva `id`, estudiante/programa/período, `estado`, `fechaSolicitud`, `fechaRevision`, `observaciones` y `asignaturas[{ id, matriculaId, asignaturaId, asignaturaCodigo, asignaturaNombre, estado, grupo, observaciones }]`. `id` de la fila y `asignaturaId` no se intercambian. Los documentos no forman parte de este JSON.

## Verificación, retos y siguientes pasos
- `node --experimental-strip-types --test tests/matriculaPresentation.test.ts`: PASS, 4/4. `npx eslint ...`: PASS (solo warning ambiental npm `Unknown env config "http-proxy"`). `npm run build`: PASS, 273 módulos; `index-DhFeTLOW.css` 224.43 kB e `index-DQeieq-z.js` 638.82 kB; warning no bloqueante por chunk >500 kB. `git diff --check`: PASS.
- Pendiente en entorno no productivo: verificar respuestas vacías y múltiples del endpoint real, fallos independientes de ambas consultas, catálogo documental completo y asociación por matrícula; recorrer Cargar/Ver/Descargar y todas las restricciones sin subir archivos reales.
- Pendiente visual: escritorio y 320/375/402/440 CSS px, ambos temas, textos largos, foco/teclado y `scrollWidth <= clientWidth`. No hay Chromium/Chrome/Firefox, backend ni sesión institucional en el contenedor, por lo que no hubo captura.
- Entorno único: `/workspace/SAPP-frontend/node_modules`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No crear venv, Conda, Poetry, entorno Python ni otro árbol npm.

---
# Update 2026-09-21 — consistencia de colores de estados en responsive

## Estado actual y decisión

- Se corrigió la diferencia mostrada en `/creditos-condonables`: la regla móvil de `CreditosCondonablesCoordinacionPage.css` sobrescribía `color`, `background` y `border-color` de cualquier `StatusBadge` con un único estilo verde. La regla responsive conserva ahora únicamente layout y tipografía, de modo que no compite con los modificadores semánticos compartidos.
- `src/modules/solicitudes/components/StatusBadge/StatusBadge.tsx` normaliza los ocho estados del contrato. `StatusBadge.css` sigue siendo la única fuente cromática: `ENVIADA` usa el tono institucional; `EN_REVISION`, `PFIR_DIR_TG`, `PFIR_COOR_POS` y `PFIR_CAR_CONT` usan ámbar; `APROBADA`, verde; `RECHAZADA`, rojo; `DEVUELTA` y `UNKNOWN`, neutral. Esto cubre solicitudes ordinarias y créditos condonables, tabla, tarjetas y detalle, sin cambiar labels ni datos.
- Salida esperada: a más de 768 CSS px se conserva la tabla de escritorio; a 768 px o menos las tarjetas permiten badges multilínea, pero cada estado mantiene el mismo texto, fondo y borde que en escritorio. Debe funcionar en `body.light` y `body.dark` y el significado nunca depende solo del color porque la etiqueta completa permanece visible.

## Paths, contratos y trabajo pendiente

- Componente y paleta: `src/modules/solicitudes/components/StatusBadge/StatusBadge.tsx` y `.css`. Corrección responsive: `src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.css`. La vista consume `SolicitudAcademicaDto.estadoSigla || estado`; el catálogo y aliases viven en `src/modules/solicitudes/utils/estadoSolicitud.ts`.
- No cambiaron `GET /sapp/solicitudesAcademicas`, DTO, filtros, normalización, estados de dominio, endpoints, permisos, navegación, paquetes, variables, schemas, seeds ni datasets.
- Pendiente con navegador/backend/sesión institucional: capturar y comparar los ocho estados a 320/375/402/440 px y escritorio en ambos temas, revisar contraste y textos largos. El contenedor no dispone de Chromium, Chrome ni Firefox, por lo que no fue posible producir la captura solicitada localmente.

## Entorno y verificación

- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entornos Python ni un segundo árbol npm. Node.js 24.15.0 y npm 11.4.2; React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No existe script `test`.
- `npm run build`: PASS; 272 módulos, `index-CtLOhbNR.css` (222.36 kB) e `index-C7FRZ1pi.js` (635.45 kB), con el warning informativo conocido del chunk mayor de 500 kB. `git diff --check`: PASS. La comprobación Node del selector móvil: PASS; confirma que no declara `color`, `background` ni `border-color`.

---

# Update 2026-09-21 — creación y detalle responsive de homologaciones

## Estado actual y decisiones

- Se completó la adaptación móvil del tipo `HOMOLOG` tanto en `SolicitudEstudianteForm` como en `SolicitudDetallePage`, sin cambiar su presentación de escritorio. El formulario apila origen/destino hasta 640 CSS px y el detalle convierte cada fila en una tarjeta hasta 768 CSS px. Cada tarjeta conserva inequívocamente una pareja, el orden recibido y textos completos con ajuste de línea.
- La creación ya tenía IDs `crypto.randomUUID()` por pareja y las mutaciones por `rowId`; se preservó este modelo. Eliminar la pareja intermedia filtra solo ese UUID y React no reutiliza estado posicional. Los controles recibieron IDs derivados del UUID, errores accesibles por pareja y un resumen móvil del nombre/código seleccionado. El estado React y los inputs de archivo son los mismos a cualquier ancho, por lo que no se desmontan al alternar móvil/escritorio.
- No cambió la serialización: catálogo externo → `{ asignatura_origen_id, asignatura_destino_id }`; alta manual → `{ nombreAsignaturaExterna, codigoAsignaturaExterna? , asignatura_destino_id }`. Tampoco cambiaron validaciones de completitud/cantidad, endpoints, DTO, adjuntos, permisos o flujo de acta/aprobación. El estudiante continúa sin controles de aprobación; la guarda existente de rol/estado en el detalle permanece intacta.
- `DocumentosAdjuntos` conserva su tabla en escritorio y usa tarjetas móviles con nombre/descripcion completos y botones Ver/Descargar de al menos 44 px. Todos los estilos nuevos consumen tokens semánticos (`--surface`, `--surface-container-low`, `--outline`, `--primary`, `--on-primary`, `--text-*`) y no bloquean overflow horizontal en `body`.

## Paths, contratos y salida esperada

- Creación y estado/payload: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`; responsive: su `.css` adyacente.
- Detalle `HOMOLOG`: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` y `.css`. Adjuntos compartidos: `src/modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos.tsx` y `.css`.
- Catálogos sin cambios: `GET /sapp/homologaciones/asignaturas-externas/activas` para origen y `GET /sapp/asignaturas?programaId=1` para destino. Envío sin cambios a `POST /sapp/solicitudesAcademicas` dentro de `solicitudHomologacionesAsignaturas`.
- Detalle esperado: `solicitudHomologacionesAsignaturas: [{ id, asignaturaOrigenNombre, asignaturaOrigenCodigo, asignaturaDestinoNombre, asignaturaDestinoCodigo }]`. El bloque de acta sigue usando `actaId`, `actaCodigo`, `actaNombre`, `actaFechaCreacion` y `actaTipoConsejo` cuando aplican.
- Salida móvil esperada a 320/375/402/440 CSS px: margen/padding interior reducido, ninguna tabla de homologaciones/documentos provoca scroll horizontal, cada pareja se conserva unida, controles táctiles de 44 px y controles de texto a 16 px. A más de los breakpoints se conserva la tabla y grilla anteriores.

## Verificación reciente, límites y próximos pasos

- `npx eslint src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx src/pages/SolicitudDetalle/SolicitudDetallePage.tsx src/modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos.tsx`: PASS; solo warning ambiental de npm por `http-proxy`.
- `npm run build`: PASS; 272 módulos y artefactos `dist/assets/index-r9VGzlr2.css` (222.51 kB) e `index-DHsrY2pe.js` (635.45 kB). Persiste el warning informativo de chunk mayor a 500 kB. `git diff --check`: PASS.
- `npm run lint`: FAIL por los 9 errores y 1 warning preexistentes fuera de esta superficie (tres servicios API con `any`, guard y mock de admisiones, validación documental, editor y tipos de solicitudes); el lint focalizado anterior confirma que este cambio no añade hallazgos.
- No existe script `test`. La estabilidad de UUID, el filtrado por ID y el mapeo del payload fueron revisados estáticamente; no se envió una solicitud real.
- Pendiente validación manual autenticada con mocks/backend de pruebas: 1 y 3 parejas; borrar la intermedia; nombres/códigos largos; errores; móvil → escritorio → móvil; adjuntos; con/sin acta; roles estudiante/coordinación; estados editables/no editables; temas claro/oscuro y anchos 320/375/402/440. También comparar escritorio con el padre del commit de este cambio.
- No se tomó captura: el contenedor no tiene Chromium, Chrome ni Firefox en `PATH`, y las rutas protegidas necesitan backend, sesión y datos institucionales. No agregar dependencias únicamente para capturas.

## Entorno exacto

- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm, venv, Conda ni Poetry. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2, typescript-eslint 8.51.0 y Lucide 0.468.0-local. Sin paquetes, variables, schemas, seeds o datasets nuevos.

---

# Update 2026-09-21 — detalle de matrícula responsive (coordinación y estudiante)

## Estado actual y decisiones por rol
- **Coordinación:** `/matricula/:matriculaId` usa `MatriculaDetalleCoordinacionPage`. Escritorio permanece igual. En móvil, el resumen conserva matrícula, estudiante, código UIS, período, estado y ambas fechas; los documentos pasan de la grilla de seis columnas a tarjetas hasta 960 px y las asignaturas pasan de tabla a tarjetas hasta 768 px. Ver/Descargar y Aprobar/Rechazar quedan en grupos etiquetados distintos. El rechazo conserva motivo obligatorio y el estado local ante fallo; la validación documental sigue siendo inmediata y la de asignaturas sigue siendo conjunta.
- **Estudiante:** su implementación real es la rama de rol de `MatriculaPage` en `/matricula`; no existe `/matricula/:id` estudiantil. Hasta 768 px, `DocumentosRequeridosTable` y `MateriasSelectedTable` convierten sus propias filas en tarjetas sin duplicar DOM/estado. Mantiene exactamente Cargar, Ver, Descargar, selección/eliminación de materias y Confirmar según `EXISTS`, `CAN_CREATE`, `NO_ACTIVE_PERIOD`, documento y `FINALIZADA`; no se añadieron controles de gestión.
- Se conservaron IDs estables (`documento.id`/tipo e `asignatura.id`), estado de archivos seleccionados, decisiones y observaciones durante resize. Se quitaron los `min-width` efectivos solo dentro de breakpoints y se permitió ajuste de nombres/observaciones; no se aplicó `overflow-x: hidden` global.

## Paths, contratos y salida esperada
- Coordinación: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx` y `.css`. Servicios sin cambios: listado/detalle documental, aprobación o rechazo inmediato de documento, notificación al completar obligatorios, validación conjunta de asignaturas y aprobación automática vigente.
- Estudiante: `src/pages/Matricula/MatriculaPage.tsx`; componentes responsive `src/modules/matricula/components/DocumentosRequeridosTable`, `MateriasSelectedTable` y `MateriasSelector`. El archivo se conserva en `DocumentoRequerido.selectedFile`; la carga sigue usando Base64 + checksum y el visor/descarga usan el contenido autenticado ya recuperado, sin token en URL.
- Salida esperada: escritorio conserva columnas y acciones anteriores. En 320/375/402/440 px no debe existir overflow de página; etiquetas solo aparecen en tarjetas, textos largos ajustan línea, acciones tienen 44 px y las observaciones ocupan todo el ancho. Móvil → escritorio → móvil no remonta componentes ni borra borradores.

## Verificación reciente, limitaciones y próximos pasos
- `npx eslint src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx src/pages/Matricula/MatriculaPage.tsx src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.tsx src/modules/matricula/components/MateriasSelectedTable/MateriasSelectedTable.tsx src/modules/matricula/components/MateriasSelector/MateriasSelector.tsx`: PASS (solo warning ambiental de npm por `http-proxy`).
- `npm run lint`: PASS para el repositorio completo (solo el mismo warning ambiental de npm).
- `npm run build`: PASS; 272 módulos, `dist/assets/index-KHN1TpiC.css` (218.26 kB) e `index-CTXBbwem.js` (633.70 kB); warning informativo por chunk superior a 500 kB. `git diff --check`: PASS. No hay script `test`.
- Pendiente: inspección autenticada en 320/375/402/440 px, tablet, landscape y escritorio, claro/oscuro; cubrir documentos ausentes/pendientes/aprobados/rechazados, nombres y observaciones extensos, varias asignaturas y resize con borradores. No ejecutar mutaciones sobre matrículas reales. No se obtuvo captura: el contenedor no incluye Chromium/Chrome/Firefox y no hay backend/sesión institucional.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entorno Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2; React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No hay seeds ni datasets nuevos.

---

# Update 2026-09-21 — selector móvil de programa en `/fechas`

## Estado actual y decisiones
- La tarjeta **Convocatorias de admisión** de `src/pages/FechasModule/FechasModulePage.tsx` muestra, exclusivamente hasta 780 CSS px, dos pestañas de igual ancho para **Maestría** y **Doctorado**. El selector está después del título y **Crear convocatoria**, antes de Período/Vigente. Se reutilizó el patrón accesible de Créditos condonables.
- Las pestañas se derivan de los nombres/códigos institucionales y conservan el `programaId` real recibido por `GET /sapp/convocatoriaAdmision`; no dependen del orden del arreglo ni de IDs fijos. Maestría es la selección inicial si está disponible. La selección vive fuera del estado de viewport, por lo que se recupera tras móvil → escritorio → móvil.
- Solo el panel móvil seleccionado participa en accesibilidad y foco (`hidden`, `tabpanel`, `aria-labelledby`). En escritorio no se renderiza el `tablist`, se retiran los roles condicionales y ambos paneles quedan visibles y accesibles. Cada panel conserva el nombre completo del programa.
- Período y Vigente continúan compartidos y reinician las páginas como antes; `programPages` conserva una página por `programaId` al alternar. Los programas se catalogan antes de filtrar, así un programa con cero coincidencias conserva su panel y estado vacío sin seleccionar automáticamente el otro. No se añadieron fetches, efectos de carga ni desmontajes de modales por alternar/redimensionar.
- La sección **Períodos académicos**, la acción/modal **Crear convocatoria**, edición, cierre, navegación a inscripciones y todos los contratos/permisos quedaron intactos.

## Paths, contrato y salida esperada
- Lógica, estado, semántica y paneles: `src/pages/FechasModule/FechasModulePage.tsx`. Estilos temáticos y breakpoint: `src/pages/FechasModule/FechasModulePage.css`.
- Entrada sin cambios: `GET /sapp/convocatoriaAdmision` entrega convocatorias con al menos `{ id, programaId, programa, periodo, cupos, fechaInicio, fechaFin, observaciones, vigente }`. Los grupos y páginas se indexan por `programaId` real.
- Móvil esperado: selector de 44 px mínimo, Maestría → Doctorado → Maestría por toque/clic y flechas/Home/End, una lista visible, filtros persistentes, vacío local y acciones correspondientes al programa. Escritorio esperado: selector ausente y ambos programas con la distribución vertical previa.
- No hay paquetes, endpoints, variables, schemas, seeds o datasets nuevos. El entorno único es `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entorno Python ni otro árbol npm.

## Verificación, retos y próximos pasos
- `npx eslint src/pages/FechasModule/FechasModulePage.tsx`: PASS; solo warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; 272 módulos y artefactos `dist/assets/index-D56WF_LI.css` (212.97 kB) e `index-BTuBYlEL.js` (633.33 kB). Persiste el warning informativo del chunk superior a 500 kB. `git diff --check`: PASS.
- `npm run lint`: FAIL por 9 errores y 1 warning preexistentes fuera de los archivos modificados (`any` en servicios API, estado síncrono en el efecto del guard de evaluación, parámetros sin usar, tipos vacíos y una dependencia de hook). El ESLint focalizado del módulo sí pasa.
- No existe script `test`. Queda pendiente probar con navegador, backend y sesión institucional: toque/clic/teclado, acciones de ambas listas, filtros, páginas independientes, programa sin coincidencias, móvil → escritorio → móvil y temas `body.light`/`body.dark`.
- No se obtuvo captura: Chromium, Chrome y Firefox no están en `PATH`, y `/fechas` requiere datos/autenticación. No instalar dependencias ni crear mocks permanentes solo para esta revisión.
- Entorno exacto: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0; reproducible por `package-lock.json`.

---

## Update 2026-09-21 — corrección del filtro de Comité Asesor en `/actas`

### Estado actual y causa confirmada
- El filtro **Tipo de acta → Comité Asesor de Posgrados** ahora incluye registros cuyo `tipoConsejo` sea `false` **o** `null`.
- La causa era una inconsistencia local: la tabla usaba la condición truthy y mostraba `null` como Comité, mientras el predicado del filtro exigía estrictamente `tipoConsejo === false`. Los registros históricos con `null` se veían en **Todos**, pero desaparecían al seleccionar Comité.
- `isActaConsejo` centraliza la interpretación. Solo `true` es Consejo Académico; cualquier valor admitido restante (`false | null`) es Comité Asesor. La tabla y el filtro consumen la misma función para evitar otra divergencia.

### Paths, contrato y salida esperada
- Lógica y presentación: `src/pages/Actas/ActasPage.tsx`; contrato sin cambios: `src/modules/actas/types.ts`.
- Entrada: `GET /sapp/actas`, con `ActaDto.tipoConsejo: boolean | null`. Salida esperada: **Consejo Académico** selecciona únicamente `true`; **Comité Asesor de Posgrados** selecciona `false` y `null`; **Todos** no restringe el tipo.
- No cambiaron endpoints, payloads, permisos, estilos, dependencias, variables, schemas, seeds ni datasets.

### Retos, próximos pasos y entorno
1. Validar con sesión/backend institucional un catálogo que combine `true`, `false` y `null`, además de combinaciones con año, texto y paginación.
2. Si el backend migra los datos históricos, mantener esta normalización mientras el DTO continúe admitiendo `null`, o coordinar primero un cambio explícito del contrato.
- Reutilizar exclusivamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, Conda, Poetry, entornos Python ni otro árbol npm. El proyecto usa Node.js/npm y no tiene script `test`; las versiones exactas están fijadas en `package-lock.json` y resumidas en `README.md`.
- `npx eslint src/pages/Actas/ActasPage.tsx src/modules/actas/types.ts` (2026-09-21): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-21): PASS; transformó 272 módulos y generó `dist/assets/index-Cc_JZsaX.css` e `index-Do082L2s.js`. Persiste solo el aviso informativo no bloqueante por el chunk JavaScript de 630.32 kB. `git diff --check`: PASS.
- No se generó captura: la corrección no altera la presentación y la ruta protegida requiere backend, sesión institucional y registros con los tres valores del contrato para verificar el comportamiento real.

---

## Update 2026-09-20 — adaptación responsive completa de `/actas`

### Estado actual y decisiones
- `src/pages/Actas/ActasPage.tsx` mantiene una sola consulta, colección, orden, filtros, paginación y conjunto de filas. Escritorio conserva la tabla original. En `max-width: 720px`, CSS transforma esas mismas filas en tarjetas, sin duplicar consultas, IDs ni controles; nombre/código se priorizan y año/fecha forman dos columnas hasta 350 px.
- La causa del desbordamiento era `.actas-table { min-width: 1040px; }`, amplificada por padding/bordes y elementos grid/flex sin contracción explícita. `src/pages/Actas/ActasPage.css` limita la corrección al módulo: usa `min-width: 0`, elimina el ancho mínimo solo en móvil y permite wrap, sin ocultar overflow en `body`.
- Encabezado, filtros y formulario se apilan en móvil. Los controles miden al menos 44 px y usan 16 px; el nombre seleccionado y código generado ajustan líneas. Se conservan valores al redimensionar y ante errores, validación PDF/15 MB, SHA-256, clasificación COMITE/CONSEJO, fecha Colombia, payload y bloqueo `isSaving`.
- Ver/Descargar comparten fila cuando caben; Eliminar ocupa otra y conserva estilo destructivo. Se mantienen `getDocumentoActa(acta.id)`, Blob URL autenticado/temporal, confirmación con nombre/código, bloqueo de operaciones y eliminación local solo tras éxito. Un fallo de consulta ya no se confunde con cero resultados.

### Contratos, paths y salida esperada
- Vista/lógica: `src/pages/Actas/ActasPage.tsx`; estilos: `src/pages/Actas/ActasPage.css`; API: `src/modules/actas/api.ts`; DTO/payload: `src/modules/actas/types.ts`; Blob/base64: `src/shared/files/base64FileUtils.ts`.
- Sin cambios: `GET /sapp/actas`, `POST /sapp/actas`, `DELETE /sapp/actas/{id}` y `GET /sapp/actas/{id}`. `CrearActaRequest` conserva `nombre`, `codigo`, `fechaCreacion`, `observaciones`, `tipoConsejo`, `contenidoBase64`, `mimeType`, `tamanoBytes` y `checksum`.
- Salida móvil esperada a 320/375/402/440 CSS px: márgenes de shell de 12–16 px, sin scroll horizontal del listado, filtros/tarjetas/formulario a una columna y todos los valores/acciones accesibles. Escritorio conserva tabla, filtros de tres columnas y formulario de dos columnas.

### Entorno, resultados y trabajo pendiente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, Poetry, entorno Python ni segundo árbol npm. Node 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No hay seeds/datasets nuevos ni script `test`.
- `npx eslint src/pages/Actas/ActasPage.tsx`: PASS (solo warning ambiental `Unknown env config "http-proxy"`). `npm run build`: PASS, 272 módulos, `index-Cc_JZsaX.css` e `index-DU-XEZcO.js`; warning no bloqueante por chunk de 630.31 kB. `git diff --check`: PASS.
- Pendiente con navegador, backend y sesión/mocks: comparar escritorio antes/después y recorrer 320/375/402/440, tablet, landscape, ambos temas y zoom; cubrir textos largos, filtros, vacío/error, paginación, PDF ausente/error/apertura/descarga, carga y eliminación sin tocar actas reales.
- No hubo captura: Chromium, Chrome y Firefox no están en `PATH`; la ruta requiere autenticación/backend. No instalar dependencias solo para falsificar esta validación.

---

## Update 2026-09-20 — `/coordinacion/profesores` responsive

### Estado, causa y decisiones
- Las dos pestañas existentes siguen usando un solo estado React y conservan búsquedas, selección y páginas al alternar. Ahora tienen semántica `tablist`/`tab`/`tabpanel`, selección visible, foco roving y navegación con flechas, Home y End.
- El recorte móvil era la combinación de ancho intrínseco de las tablas, celdas y acciones sin ajuste, contenedores flex sin `min-width: 0` y tabs con overflow. Hasta 800 CSS px las mismas filas se presentan como tarjetas CSS (sin montar una segunda lista ni duplicar solicitudes); a partir de 801 px la tabla y su distribución anterior permanecen intactas.
- Los cuatro listados están cubiertos: rol de posgrados, EISI disponible, integrantes de grupo y posgrados disponibles para agregar. Las tarjetas preservan nombre, documento/correo o identificador/rol según corresponda y botones completos de 44 px. Correos/nombres usan wrap; paginación se reorganiza sin perder el total filtrado.
- El selector de grupo es fluido y muestra el nombre completo seleccionado bajo el control en móvil. El efecto de integrantes invalida respuestas tardías cuando cambia `grupoId`, evitando pintar el grupo anterior. Se distingue explícitamente selección pendiente de grupo seleccionado sin integrantes.
- No cambiaron endpoints, DTO, permisos, elegibilidad, confirmaciones, regla de director único, alcance de retirar, estados de mutación, paginación, ni las operaciones **Agregar/Retirar de posgrados**, **Agregar al grupo**, **Hacer director** y **Retirar**.

### Paths, contratos y salida esperada
- Implementación y estado: `src/pages/GestionProfesores/GestionProfesoresPage.tsx`. Estilos aislados y breakpoint: `src/pages/GestionProfesores/GestionProfesoresPage.css` (800 CSS px; compactación adicional a 360 px).
- Contratos sin cambios: `GET /sapp/docentes`, endpoints de rol bajo `/sapp/docentes/{uuid}`, `GET /sapp/gruposInvestigacion`, y GET/POST/PUT/DELETE de `/sapp/gruposInvestigacionDocentes`. Los detalles están en `src/api/gruposInvestigacionService.ts` y `src/api/gruposInvestigacionTypes.ts`.
- Salida esperada: escritorio con tablas y todas sus columnas originales; móvil 320–440 px sin scroll horizontal, con una tarjeta por fila, texto completo y acciones a ancho disponible. El identificador de integrante continúa siendo `docenteId ?? id`, no documento ni código UIS.
- No existen seeds/datasets ni fixtures nuevos. No crear venv, Conda o Poetry: es un frontend Node y debe reutilizar `/workspace/SAPP-frontend/node_modules`.

### Verificación y próximos pasos
- `npx eslint src/pages/GestionProfesores/GestionProfesoresPage.tsx`: PASS (solo warning ambiental de npm por `http-proxy`).
- `npm run build`: PASS, 272 módulos; `dist/assets/index-DUxhBT2n.css` (202.04 kB) e `index-eaq7Vr05.js` (629.79 kB). Persiste el warning informativo del chunk mayor de 500 kB. `git diff --check`: PASS. No existe script `test`.
- Pendiente: validar con navegador y sesión de pruebas a 320/375/402/440 px, tablet, horizontal y escritorio, `body.light`/`body.dark`; comprobar teclado, zoom, nombres/correos/grupos largos, vacíos/error, búsquedas, páginas y móvil → escritorio → móvil. No hay Chromium/Chrome/Firefox en el contenedor, por lo que no hubo captura.
- Pendiente con mocks o ambiente no productivo: ejecutar asignación/retiro del rol, alta/baja del grupo y cambio de director, verificando refresh/contadores y fallos. No se modificaron usuarios reales.
- Entorno exacto: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0; versiones reproducibles en `package-lock.json`.

---

## Update 2026-09-20 — corrección de detalles de convocatoria e inscripción

### Estado actual y causa
- En `/admisiones/convocatoria/:convocatoriaId`, el hueco móvil no provenía de datos ni del tablero: al pasar el encabezado a columna, `.convocatoria-detalle__actions` conservaba `flex: 0 1 25rem`, de modo que esos 25 rem se aplicaban al eje vertical. El breakpoint de 760 px fija `flex-basis: auto` y conserva el ancho completo de la acción.
- En `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId`, **Programa** permanece dentro de **Datos de la inscripción** y se retiró de la barra inferior duplicada. La barra ahora distribuye sus dos estados en dos columnas de escritorio y una en móvil.
- No se modificaron contratos, consultas, estado React, rutas, permisos ni reglas académicas. No hay paquetes, variables, schemas, seeds o datasets nuevos.

### Paths, salida esperada y próximos pasos
- Responsive de convocatoria: `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.css`. Resumen de inscripción: `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx` y `.css`.
- A 760 CSS px o menos, cabecera, botón/aviso, indicadores y tablero deben fluir sin un hueco de 400 px. En inscripción debe aparecer el programa una sola vez, dentro del panel de metadatos; la barra conserva estado de inscripción y evaluación.
- Pendiente: comprobación autenticada en 320/375/402/440 px y escritorio, temas claro/oscuro y convocatoria abierta/cerrada. El contenedor no dispone de Chromium, Chrome ni Firefox y estas rutas requieren backend/sesión institucional.

### Entorno
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2; React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3 y Vite/Rolldown 7.2.5. No existe script `test`.
- `npx eslint src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`: PASS; solo apareció el warning ambiental conocido `Unknown env config "http-proxy"`. `npm run build`: PASS; 272 módulos y artefactos `dist/assets/index-Df4G69RN.css` e `index-xtNZzMOk.js`; persiste el aviso informativo por el chunk JS mayor de 500 kB. `git diff --check`: PASS.

---

# Update 2026-09-20 — Acta asociada en detalles de solicitudes

## Estado actual y decisiones
- `SolicitudDetallePage` es la vista compartida por solicitudes académicas normales y créditos condonables. Su DTO ahora declara `actaId`, `actaCodigo`, `actaNombre`, `actaFechaCreacion` y `actaTipoConsejo` como campos opcionales/anulables del `GET` de detalle.
- Solo cuando el estado normalizado es `APROBADA` y existe `actaId`, se renderiza una única tarjeta **Acta asociada** después del resumen general. Contiene código, fecha `DD/MM/YYYY`, nombre e instancia; no se dispersaron los campos entre las tarjetas generales.
- `actaTipoConsejo: true` significa **Consejo Académico**. Tanto `false` como `null` se muestran como **Comité Asesor de Posgrados**, consistente con el contrato ya usado al filtrar las actas disponibles durante la aprobación.
- La tarjeta usa Lucide ya instalado y tokens `--primary`, `--on-primary`, `--outline`, `--surface-container-low` y texto semántico. Tiene dos columnas en escritorio y una en móvil, compatible con temas claro/oscuro. No cambió el flujo previo de selección de acta al aprobar.

## Paths, contrato y salida esperada
- DTO: `src/modules/solicitudes/api/types.ts`. Render: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`. Estilos: `src/pages/SolicitudDetalle/SolicitudDetallePage.css`.
- Consulta existente: `GET /sapp/solicitudesAcademicas/{solicitudId}` → `{ ok, message, data }`. En `data`, los campos nuevos son `{ actaId: number | null, actaCodigo: string | null, actaNombre: string | null, actaFechaCreacion: "YYYY-MM-DD" | null, actaTipoConsejo: boolean | null }`.
- Salida esperada: `APROBADA` + `actaId` dibuja exactamente un bloque del acta en ambas familias de solicitudes; cualquier otro estado, o una aprobada sin asociación, no lo dibuja. Valores ausentes de código/nombre usan texto de respaldo y una fecha ausente usa `—`.
- No se añadieron endpoints, paquetes, variables, schemas, seeds ni datasets. La respuesta de ejemplo usada para implementar tenía `id: 65`, `estadoSigla: "APROBADA"`, `actaId: 5`, `actaCodigo: "ACT-001-2026"`, `actaNombre: "ACTA DE PRUEBA DE DAVID"`, `actaFechaCreacion: "2026-08-28"` y `actaTipoConsejo: null`.

## Retos y próximos pasos
1. Validar con el gateway una solicitud normal aprobada y un crédito condonable aprobado, además de casos no aprobados y una respuesta aprobada sin acta.
2. Confirmar con backend que `actaTipoConsejo: null` seguirá representando Comité. Si `null` pasa a significar “sin clasificar”, ajustar la etiqueta o presentar un fallback neutral.
3. Revisar visualmente la tarjeta con nombres/códigos largos a 320–440 px y escritorio en `body.light`/`body.dark`. El contenedor no contiene Chromium, Chrome ni Firefox y la ruta requiere autenticación, por lo que no se generó captura.

## Entorno y verificación reciente
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry, entornos Python ni otro árbol npm. Node.js 24.15.0 y npm 11.4.2. Instalado: React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No existe script `test` ni seeds.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx src/modules/solicitudes/api/types.ts`: PASS. `npm run build`: PASS; 272 módulos y artefactos `dist/assets/index-DNu7XGnK.css` (199.46 kB) e `index-B-Qm0z6W.js` (628.67 kB), con el aviso informativo conocido por tamaño del chunk. `git diff --check`: PASS.

---
# Update 2026-09-20 — Listado inicial de matrículas responsive

## Estado actual y decisiones
- La ruta protegida `/matricula` mantiene sin cambios visuales deliberados su presentación de escritorio: notificación, cuatro filtros, contador y tabla de seis columnas. El único ajuste de escritorio es técnico: el grid de filtros cambió `repeat(3, 33%)` por `repeat(3, minmax(0, 1fr))`, porque los tres porcentajes más los dos `gap` excedían el contenedor.
- Hasta 768 CSS px, la tabla de `min-width: 760px` deja de participar en el layout y `filteredMatriculas` se representa también como una lista vertical de tarjetas. Cada tarjeta conserva nombre, código UIS (o el `—` existente), estado textual, programa, período, fecha/hora mediante `formatDateTime` y `/matricula/{id}`. La tabla y sus enlaces usan `display: none` en ese breakpoint, por lo que no quedan controles ocultos enfocables.
- La cadena local de contenedores ahora puede contraerse con `min-width: 0`; no se aplicó `overflow-x: hidden` a `body`. Los textos usan wrap, el estado no depende solo del color y programa/período pasan de dos columnas a una bajo 360 px. Notificación y filtros se apilan, y botones/controles tienen al menos 44 px; inputs/selects usan 16 px para evitar zoom involuntario.
- No cambiaron hooks, consultas, carga/error, opciones o valores de filtros, orden por fecha, contador, roles, confirmación ni protección de doble envío del correo. No se toca el detalle de matrícula. No hay paginación implementada actualmente.

## Paths, contratos y salida esperada
- Render y fuente compartida de datos: `src/pages/Matricula/MatriculaPage.tsx`; estilos exclusivamente del módulo: `src/pages/Matricula/MatriculaPage.css`.
- Entrada del listado: `MatriculaAcademicaListadoDto[]` obtenido por el servicio existente. No cambió el DTO: `{ id, estudianteNombreCompleto, codigoEstudianteUis, programaAcademico, periodoAcademico, estado, fechaSolicitud, ... }`.
- Resultado esperado: a 769 px o más se ve la tabla anterior; a 768 px o menos solo las tarjetas. Carga y error son excluyentes del listado; con cero coincidencias se conserva `Registros encontrados: 0` y en móvil aparece el mensaje explícito de ausencia. Redimensionar no modifica estado React ni filtros y no causa nuevas consultas ni correos.

## Retos y próximos pasos
1. Ejecutar una prueba autenticada con datos reales a 320, 375, 402 y 440 CSS px, tablet, landscape y el viewport de escritorio de referencia; confirmar `scrollWidth <= clientWidth`, temas claro/oscuro, foco y zoom.
2. Probar nombres/programas/estados largos, múltiples filas, respuesta vacía y error del listado; recorrer los cuatro filtros y cada enlace **Ver detalle**, y redimensionar móvil → escritorio → móvil verificando que los filtros persisten.
3. Verificar el botón de notificación con mocks o un entorno de pruebas. No enviar correos reales. Confirmar estados disabled/loading y pulsaciones repetidas; esta revisión no cambió el handler.

## Entorno y verificación reciente
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, Poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2; React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No hay seeds ni script `test`.
- `npm run build` PASS: 272 módulos; `dist/assets/index-BqffXqoX.css` (198.34 kB) e `index-BhTGTJV5.js` (627.47 kB). Persiste el warning informativo del chunk mayor a 500 kB. `npx eslint src/pages/Matricula/MatriculaPage.tsx` PASS. `git diff --check` PASS.
- No se obtuvo captura ni se ejecutó E2E: Chromium, Chrome y Firefox no están instalados, y la ruta exige backend/sesión institucional. La validación responsive enumerada arriba permanece pendiente; no agregar una dependencia solo para capturarla.

---

# Update 2026-09-20 — Restauración del escritorio en detalle de inscripción

## Estado actual, causa y decisión
- Se comparó `a7f2dfd` con su padre (implementación previa al responsive). La regresión principal fue introducir elementos nativos `<details>` cerrados para cabecera, consideraciones y PDF: las reglas CSS de escritorio intentaban mostrar sus hijos, pero el estado cerrado del elemento seguía suprimiendo el contenido. Además se eliminaron del JSX los indicadores repetidos de estado/programa y se hizo visible la etiqueta **Nota** en cada fila de escritorio.
- La cabecera recuperó exactamente las fuentes y formatos previos: fotografía, nombre, estado de inscripción, documento, correo, teléfono, programa, `numeroInscripcion` con su fallback histórico, período, fecha de inscripción y última actualización. También regresaron los indicadores de estado de inscripción, programa y estado de evaluación. El panel compacto móvil usa estado React, pero CSS fuerza todo el contenido en escritorio, incluso si se cerró antes en móvil.
- Hoja de vida, Examen y Entrevistas reutilizan un único formulario y los mismos DTO/payloads. Las consideraciones siempre existen en el DOM y son visibles en escritorio; solo el breakpoint móvil puede ocultarlas. El formateador conserva texto y valores JSON, incluyendo fallback seguro para estructuras no serializables. Los grupos de entrevista siguen el mismo patrón para no convertir un control móvil en interacción de escritorio.
- El visor autenticado de Hoja de vida se carga junto con los criterios y queda visible automáticamente en escritorio. Su expansión opcional solo se aplica hasta 768 px; cambiar móvil → escritorio no depende de un listener ni del tamaño inicial y no remonta formulario, iframe o datos.
- **Regla permanente:** toda adaptación responsive debe preservar visual, campos e interacción de escritorio salvo solicitud explícita. Encapsular transformaciones dentro del breakpoint y comprobar escritorio → móvil → escritorio; nunca esconder contenido de escritorio mediante el estado persistente de un control móvil.

## Paths, contratos y salida esperada
- Cabecera e indicadores: `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx` y `.css`. Acordeón y overflow de escritorio: `src/modules/admisiones/components/InscripcionAccordionWindow/InscripcionAccordionWindow.css`.
- Criterios, etiquetas y formulario único: `src/modules/admisiones/components/EvaluacionEtapaSection/EvaluacionEtapaSection.tsx` y `.css`. PDF y grupos de entrevista: `src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx` y `.css`.
- Sin cambios contractuales: continúan los GET simultáneos de evaluación/documento, URL `blob:` local desde Base64 autenticado, PUT conjunto `{ id, puntajeAspirante, observaciones }`, permisos, cálculos, estados y rutas hijas. Documentos cargados conserva campos, versiones, acciones y reglas existentes.
- Salida esperada en escritorio: resumen completo directo; tres indicadores; consideraciones completas; PDF inmediato junto a Hoja de vida; una sola etiqueta visual **Nota** por columna y nombre accesible por input. En 402/440 CSS px: controles compactos y expandibles con todos los campos. Los borradores viven en `evaluacionDraftStore.ts` y no se pierden al contraer, navegar o redimensionar.

## Verificación, limitaciones y próximos pasos
- `npx eslint src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx src/modules/admisiones/components/EvaluacionEtapaSection/EvaluacionEtapaSection.tsx`: PASS (solo warning ambiental conocido de npm por `http-proxy`).
- `npm run build`: PASS; 272 módulos, `dist/assets/index-Di7oIX-v.css` e `index-DRKnmGPY.js`; solo warning informativo del chunk JS de 626.08 kB. `git diff --check`: PASS.
- `npm run lint`: FAIL por 9 errores y 1 warning preexistentes fuera de esta superficie (servicios API con `any`, guard de evaluación, mocks, validación documental y solicitudes); el lint focalizado confirma que esta corrección no añade hallazgos.
- Validación visual y captura pendientes: no existe Chromium, Chrome ni Firefox en `PATH`, y la ruta protegida requiere backend, sesión y datos institucionales. Cuando estén disponibles, comparar contra el padre de `a7f2dfd` con idénticos datos/viewport; cubrir escritorio y 402/440 px, temas claro/oscuro, cerrar paneles en móvil y volver a escritorio, además de notas/observaciones sin guardar.
- Entorno único: `/workspace/SAPP-frontend` con su `node_modules`; no crear otro árbol npm, venv, Conda ni Poetry. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No hay script `test`, seeds ni datasets nuevos.

---

# Update 2026-09-20 — Detalle responsive de convocatoria de admisiones

## Estado actual y decisiones
- Se completó el responsive de `/admisiones/convocatoria/:convocatoriaId` para convocatorias abiertas y cerradas. La cabecera usa contexto textual compacto y multilínea; si está cerrada presenta una sola nota semántica **Inscripciones cerradas** y no dibuja **Crear aspirante**, aunque el manejador y la prop `open` del modal conservan la protección contra apertura. El botón abierto conserva exactamente roles de gestión, resolución de programa/convocatoria, carga y cupos.
- La sección **Crear estudiantes admitidos** mantiene su condición existente: convocatoria cerrada + rol autorizado, y elegibilidad `estado === ADMITIDO`. `idPersona` o el ID confirmado en la sesión muestran **Estudiante creado** como estado; los pendientes mantienen el mismo servicio, payload y bloqueo `isSubmitting`. Hay tabla en escritorio y tarjetas no enfocables duplicadas visualmente en móvil mediante `display: none`, sin IDs repetidos.
- El tablero conserva fotografías grandes y navegación de cada tarjeta. `ResizeObserver` y el evento `scroll` recalculan overflow/extremos por datos y tamaño; sin overflow no hay flechas ni instrucción. En móvil, varias tarjetas usan ancho dependiente del viewport y una única tarjeta ocupa el contenedor. El scroll táctil sigue nativo; el arrastre de mouse conserva umbral de 8 px y cancela el clic posterior solo si hubo desplazamiento.
- Las tarjetas conservan todos los campos y el significado de ausentes (`?? "—"` para puntaje/posición), pasan correo a fila completa, permiten ajuste de cadenas y usan `object-fit: contain`/posición superior para no recortar rostros.

## Paths, contratos y salida esperada
- Página, condiciones, overflow y variantes tabla/tarjeta: `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx` y `.css`. Tarjeta: `src/modules/admisiones/components/StudentCard/StudentCard.tsx` y `.css`. Modal de estudiante: `src/modules/admisiones/components/CreateEstudianteModal/CreateEstudianteModal.tsx` y `.css`.
- Lecturas sin cambios: `GET /sapp/inscripcionesAdmision/convocatoria/{id}` (servicio vigente) y catálogo de convocatorias. Creación de estudiante sin cambios mediante `admitirAspiranteComoEstudiante({ idAspirante, codigoUIS, emailInstitucional })`; creación de aspirante y carga documental tampoco cambiaron.
- Salida esperada: 2 indicadores por fila hasta 1100 px y 4 en escritorio; lista apilada de admitidos hasta 760 px; tablero adaptable hasta 320 px sin overflow de página; solo el tablero desplaza horizontalmente cuando sus hijos exceden el contenedor. Ambos temas consumen exclusivamente tokens semánticos/`color-mix`.

## Retos y próximos pasos
1. Validar con sesión institucional convocatorias abierta/cerrada y cero/uno/varios aspirantes, fotos fallidas, textos largos y estados admitidos con/sin `idPersona`; inspeccionar Network sin crear registros reales.
2. Revisar manualmente 320, 375, 402, 440 CSS px, tablet, escritorio y horizontal en `body.light`/`body.dark`; comprobar zoom, teclado virtual, scroll interno del modal, foco, flechas y toque/arrastre.
3. Tomar capturas cuando exista navegador. Este contenedor no ofrece Chromium, Chrome ni Firefox y la ruta necesita backend/autenticación, por lo que no hubo revisión visual real ni captura.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entorno Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No se añadieron paquetes, variables, seeds, datasets ni schemas.
- `npx eslint src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx src/modules/admisiones/components/StudentCard/StudentCard.tsx src/modules/admisiones/components/CreateEstudianteModal/CreateEstudianteModal.tsx`: PASS; solo apareció el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; 271 módulos, `dist/assets/index-B1gestz2.css` e `index-BhpzgPd9.js`; warning no bloqueante por chunk JS de 621.22 kB. `git diff --check`: PASS. No existe script `test`.
- `npm run lint`: FAIL por los 9 errores y 1 warning preexistentes documentados en servicios API, el guard de evaluación, mocks, documentos y solicitudes; el lint focalizado confirma que los archivos de este cambio no añaden hallazgos.

---

# Update 2026-09-20 — inicio responsive de Admisiones

## Estado actual y decisiones
- La ruta protegida `/admisiones` carga una sola vez `GET /sapp/convocatoriaAdmision`, agrupa exclusivamente por el `programaId` real y conserva ambos programas en columnas de escritorio. En viewports de hasta 900 CSS px aparece un `tablist`; solo el `tabpanel` seleccionado queda renderizado para tecnologías de asistencia y navegación por teclado, pero los paneles permanecen montados conceptualmente mediante el mismo estado de datos y cambiar el breakpoint no consulta de nuevo.
- La selección móvil inicial sigue el orden vigente de programas y una selección del usuario se conserva al alternar Maestría → Doctorado → Maestría o cambiar de viewport. No se relacionan convocatorias por posición del array. Las flechas, `Home` y `End` cambian selección y foco; toque/clic cambian el contenido real.
- La tarjeta móvil se aplanó para evitar bordes/padding anidados. Nombre completo y código permanecen visibles; el encabezado usa **Convocatoria actual**, **vigente** o **más reciente** y la insignia textual ABIERTA/CERRADA. La determinación continúa usando `getConvocatoriaDestacada` e `isConvocatoriaVigente`; no se introdujo lógica académica nueva. Las fechas usan el formateo existente y una cuadrícula autoajustable.
- **Configurar fechas académicas** conserva el guard `canManagePosgrados` y navega directamente a `/fechas`. Convocatoria destacada y períodos anteriores navegan a `/admisiones/convocatoria/{id}` con el estado previo. La selección de anteriores continúa aislada por `programaId`; si no hay destacada, todas las convocatorias del programa quedan disponibles como anteriores.

## Paths, contratos y salida esperada
- Orquestación/estado/semántica: `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`; estilos responsive temáticos: `src/pages/AdmisionesHome/AdmisionesHomePage.css`; selector existente: `src/pages/AdmisionesHome/CompactPeriodSelect.tsx`.
- Datos: `GET /sapp/convocatoriaAdmision` → envelope con `data: Array<{ id, programaId, programa, periodoId, periodo, cupos, fechaInicio, fechaFin, observaciones, vigente }>`; no cambió el contrato. Los metadatos institucionales conocidos continúan asociados por ID (`1` MISI, `2` DCC), con fallback al nombre del API.
- Salida móvil esperada en 320, 375, 402 y 440 CSS px: selector de programas en una fila, un solo programa visible, sin scroll horizontal, acción principal y selector a ancho completo, controles de al menos 44 px. Escritorio: ambos programas visibles en dos columnas y sin pestañas visibles. Los temas claro/oscuro consumen tokens semánticos existentes.

## Verificación reciente, retos y próximos pasos
- `npx eslint src/pages/AdmisionesHome/AdmisionesHomePage.tsx src/pages/AdmisionesHome/CompactPeriodSelect.tsx` (2026-09-20): PASS; solo apareció el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-20): PASS; 271 módulos transformados, `dist/assets/index-Y5pbd70m.css` e `index-DnddbAO9.js`. Warning no bloqueante: chunk JS de 617.99 kB supera 500 kB. `git diff --check`: PASS. No existe script `test` en `package.json`.
- `npm run lint` global (2026-09-20): FAIL por 9 errores y 1 warning preexistentes fuera de los archivos modificados (`no-explicit-any`, estado síncrono en un efecto, parámetros sin usar, tipos vacíos y una dependencia de hook). El lint focalizado de Admisiones sí pasa.
- Pendiente con navegador/sesión institucional: validar visualmente 320/375/402/440, tablet, landscape, escritorio, ambos temas y texto ampliado; recorrer convocatorias abiertas/cerradas/anteriores de ambos programas y permisos de `/fechas`. No hubo captura porque el contenedor no dispone de Chromium, Chrome ni Firefox.
- Entorno único: `/workspace/SAPP-frontend`, Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. Reutilizar `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. No hay seeds ni datasets nuevos.

---

# Update 2026-09-20 — Responsive de `/creditos-condonables`

## Estado actual y decisiones
- La pantalla de coordinación mantiene ambas secciones/tablas simultáneas en escritorio. Hasta 768 CSS px muestra una sola sección mediante pestañas accesibles Pendientes/Histórico; inicia en Pendientes y conserva pestaña activa, filtros y paginación independiente durante cambios de pestaña y ancho.
- Los paneles móviles reutilizan las colecciones ya consultadas: no hay fetch asociado al breakpoint. Las pestañas admiten flechas izquierda/derecha, Home y End, tienen `tablist`/`tab`/`tabpanel`, foco roving y contadores con el total real de cada lista.
- Las tarjetas móviles son locales al módulo para no alterar la transformación global de `SolicitudesTable`. Incluyen enlace explícito al mismo detalle `/creditos-condonables/:solicitudId`, observaciones expandibles sin interacción anidada, estado multilínea y layout de metadatos que pasa a una columna a 350 CSS px.
- Se conservaron clasificación (`APROBADA`/`RECHAZADA` son histórico), orden, selección exacta por `estudianteId`, valores ausentes y contratos. Los estados vacío y sin coincidencias tienen textos distintos; un error no se representa como lista vacía y ofrece Reintentar.

## Paths, contratos y salida esperada
- Vista/lógica: `src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx`.
- Estilos aislados: `src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.css`; breakpoint principal 768 CSS px, referencia 402 × 874 CSS px y colapso adicional a una columna en 350 CSS px.
- Entrada sin cambios: `GET /sapp/solicitudesAcademicas` y catálogo de estados existente. Salida esperada: escritorio con pendientes e histórico visibles; móvil con una pestaña visible, tarjetas de ancho completo, filtros/paginación propios y navegación al detalle sin acciones de aprobación/rechazo.
- No se agregaron paquetes, endpoints, variables, schemas, seeds ni datasets.

## Retos y próximos pasos
1. Ejecutar revisión autenticada con backend real en 320, 375, 402, 440 CSS px, tablet, horizontal y escritorio, tanto `body.light` como `body.dark`; cubrir nombres/estados/observaciones largos, fechas ausentes, vacíos y varias páginas.
2. Confirmar mediante lector de pantalla y teclado real la locución de contadores y pestañas, y validar contraste con la paleta institucional desplegada.
3. Tomar capturas a 402 × 874 cuando exista un navegador y sesión. El contenedor actual no incluye Chromium, Chrome ni Firefox, por lo cual la inspección visual y captura siguen pendientes.

## Entorno y verificación reciente
- Reutilizar exclusivamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, Poetry, entornos Python ni otro árbol npm. Node.js 24.15.0 y npm 11.4.2; React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx`: PASS; solo warning ambiental `Unknown env config "http-proxy"`.
- `npm run build`: PASS; 271 módulos, `dist/assets/index-BKTs4nd7.css` e `index-DpUG42po.js`. Warning informativo no bloqueante por chunk JS de 616.27 kB.
- `git diff --check`: PASS. No existe script `test` en `package.json`.
- `npm run lint`: FAIL por 9 errores y 1 warning preexistentes fuera de los archivos modificados (servicios API con `any`, guarda/mock de admisiones, validación documental y tipos/editor de solicitudes); el archivo modificado pasa ESLint aislado.

---
# Update 2026-09-20 — Estudiantes responsive y filtro activo predeterminado

## Estado actual y decisiones
- `/coordinacion/estudiantes` inicia `estadoFiltro` en `ACTIVO`. Cambiar entre Maestría/Doctorado o limpiar devuelve ese valor predeterminado. El buscador y el contador de resultados quedan siempre visibles; en móvil período y estado empiezan contraídos, conservan sus valores al cerrar/redimensionar y se controlan con **Filtros**, `aria-expanded`, `aria-controls` y una insignia con el número de filtros adicionales aplicados. En escritorio ambos selects permanecen expandidos.
- La variante `compactOnMobile` de `ModuleLayout` se activa únicamente en esta página: mantiene título, usuario, avatar y ambas marcas, pero reduce padding y reúne identidad/marcas en una fila cuando hay espacio. Otras pantallas no adoptan la variante.
- El tablero conserva Pointer Events solo para mouse, umbral de 6 px, cancelación ante gesto vertical y supresión del clic posterior a drag. En móvil las tarjetas usan `calc(100% - 40px)` y gap de 12 px para anticipar 20–32 px de la siguiente según el ancho útil; el scroll táctil sigue nativo y el snap es suave. La ayuda táctil dice **Desliza para ver más**.
- Las portadas siguen grandes: alto fluido `clamp(13.75rem, 56vw, 15rem)` (220–240 px), `object-fit: contain`, fondo semántico y fallback con iniciales. Se eliminó el `min-height` vacío del encabezado, los nombres ya no se truncan a dos líneas y la fila duplicada de estado se oculta solo en móvil; la insignia conserva Activo/Inactivo. **Ver perfil** mide al menos 44 px.
- Egresados sigue cargándose bajo demanda. Los fallos muestran **No pudimos cargar los egresados.** y **Reintentar**; el error impide renderizar datos como si fueran un éxito o un vacío. El reintento repite la consulta existente sin cambiar el endpoint.

## Paths, contratos y salida esperada
- Vista/filtros/reintento: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx` y `.css`; tablero: `src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.css`; tarjeta: `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.css`; variante de layout: `src/components/ModuleLayout/ModuleLayout.tsx` y `.css`.
- Se conservan `getProgramasCoordinacion()`, `getEstudiantesByPrograma(programaId, egresados?)`, carga documental `ANX-4`, `EstudianteCoordinacion` y navegación `/coordinacion/estudiantes/{id}`. No cambiaron API, DTO, permisos, reglas, paquetes, variables, schemas, seeds o datasets.
- Estados esperados: carga independiente; error distinto de vacío; lista sin coincidencias distinta de programa sin estudiantes; fotos individuales pueden fallar y dejan iniciales sin bloquear el tablero.

## Retos y próximos pasos
1. Hacer validación autenticada real en 440 × 956, 390 × 844, 320 px, landscape y escritorio; comprobar claro/oscuro, nombres largos, con/sin foto, filtros, vacío y error/reintento.
2. Probar en dispositivo táctil scroll vertical iniciado sobre la foto, swipe horizontal y zoom; con mouse verificar clic normal frente a drag >6 px y flechas en ambos extremos.
3. Confirmar con datos backend si algún registro activo usa el valor legado `1`; el filtro actual conserva el contrato visible `ACTIVO` usado por el selector.

## Entorno y verificación reciente
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, Poetry, entornos Python ni otro árbol npm. Node 24.15.0, npm 11.4.2; React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No existe script `test` ni seeds.
- `npm run build` PASS: 271 módulos; `dist/assets/index-Ctxt-4n7.css` (182.56 kB) e `index-Bb609q7R.js` (612.22 kB). Persiste el warning informativo del chunk mayor a 500 kB.
- `git diff --check` PASS. `npm run lint` conserva 9 errores y 1 warning preexistentes fuera de estos archivos (`any`, estado en efecto, parámetros sin uso, interfaces vacías y dependencia de hook); el cambio no añade hallazgos.
- No hubo captura ni prueba E2E: no hay Chromium/Chrome, Playwright ni Puppeteer instalados y la ruta protegida requiere backend/sesión institucional. No agregar dependencias solo para la captura.

---
# Ajuste visual — Portadas grandes de estudiantes (2026-09-19)

- La solicitud posterior del usuario reemplaza la decisión anterior de avatares de 64 px: ahora las fotos ocupan una portada de ancho completo y 15rem (240 px con fuente base de 16 px) de alto, como tarjetas con imagen de Trello.
- Archivo de implementación: src/modules/estudiantes/components/EstudianteCard/EstudianteCard.css. Tarjetas de 17–19rem en escritorio y min(84vw, 19rem) en móvil. object-fit: contain muestra la fotografía completa sin deformación ni recorte; iniciales de 3.5rem cuando no existe foto. Estado debajo de la portada.
- Se mantienen los tokens semánticos de tema. No se modificaron componentes React, contratos, filtros, permisos ni manejadores de clic/arrastre.
- Validación: npm run build PASS (269 módulos); persiste advertencia de chunk JS superior a 500 kB. git diff --check PASS.
- Pendiente: revisión visual autenticada en claro/oscuro, escritorio/móvil y comprobación manual de clic frente a arrastre. No se ejecutó navegador en esta revisión.
- Entorno utilizado: proyecto local en Windows, Node 24.11.0, npm 11.6.1; node_modules existente, sin nuevas dependencias.

---
# Update 2026-09-20 — Inicio responsive y navegación móvil accesible

## Estado actual y decisiones
- La pantalla protegida de Inicio conserva los elementos devueltos por `getPrimaryNavigationItems(roles)`, por lo que las nueve opciones administrativas, su orden, sus rutas y la visibilidad por rol no cambiaron.
- En viewports de hasta 900 CSS px, el sidebar permanente se reemplaza visualmente por una barra superior compacta. El drawer empieza cerrado, se abre desde un botón con `aria-expanded`/`aria-controls`, se cierra con su botón, backdrop o `Escape`, contiene el foco y lo devuelve al disparador. Mientras está cerrado, sus enlaces y logout tienen `tabIndex=-1`; mientras abre, bloquea solo el scroll del `body` y mantiene scroll interno.
- El sidebar de escritorio sigue siendo deliberadamente un overlay temporal: ocupa 84 px contraído y se amplía a 260 px con hover/foco. El contenido reserva los 84 px persistentes; no se añadió un desplazamiento de layout al expandir para evitar saltos visuales.
- Inicio muestra dos columnas iguales entre 341 y 900 px, incluida la referencia de iPhone 16 Pro Max (viewport CSS solicitado: 440 × 956 en orientación vertical). A 340 px o menos cae a una columna. Las tarjetas son fluidas, de mínimo 120 px, y admiten etiquetas multilínea. El encabezado, avatar y logos usan Grid/Flex sin posicionamiento absoluto.

## Paths, contratos y salida esperada
- Navegación/interacción: `src/components/Sidebar/Sidebar.tsx`; drawer/barra/sidebar: `src/components/Sidebar/Sidebar.css`; reserva y márgenes de shell: `src/components/Layout/Layout.css`.
- Encabezado compartido responsive: `src/components/ModuleLayout/ModuleLayout.css`; cuadrícula exclusiva de Inicio: `src/pages/Home/HomePage.css`. La fuente de rutas y permisos permanece en `src/app/navigationItems.ts`.
- `index.html` ya contiene `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`; no se modificó. No hubo cambios de endpoints, payloads, datos, paquetes, seeds o schemas.

## Retos y próximos pasos
1. Ejecutar una revisión con sesión institucional real en 320, 375, 390, 430 y 440 CSS px, iPhone 16 Pro Max 440 × 956, landscape, tablet y escritorio. Confirmar visualmente nombres largos, zoom de texto y temas claro/oscuro.
2. Validar el ciclo completo de foco y scroll con VoiceOver/TalkBack en un dispositivo real. La implementación cubre teclado/DOM, pero el contenedor no ofrece navegador ni emulador para una prueba asistiva o capturas.
3. Revisar páginas internas en móvil porque `ModuleLayout` es compartido. Los cambios se limitaron a reorganizar su cabecera y padding bajo 768 px; no se tocaron contenidos ni lógica de módulos.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0 y npm 11.4.2. Instalado: React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide 0.468.0-local, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/components/Sidebar/Sidebar.tsx src/components/Layout/Layout.tsx src/components/ModuleLayout/ModuleLayout.tsx src/pages/Home/HomePage.tsx` (2026-09-20): PASS. `git diff --check`: PASS. `npm run build`: PASS; 271 módulos transformados, artefactos `dist/assets/index-DRTAu577.css` e `index-DL4_coBh.js`; persiste solo el warning informativo por el chunk JS de 610.11 kB.
- No existe script `test`. No se generó captura: no hay Chromium, Chrome ni Firefox en `PATH` y la aplicación fuerza inicialización contra el gateway institucional; no falsificar una sesión ni disparar logout durante la validación.

---
# Update 2026-09-20 — Tablero compacto de estudiantes de coordinación

## Estado actual y decisiones
- `/coordinacion/estudiantes` conserva los dos tipos de programa, filtros por período/nombre o código/estado, contador, orden por cohorte, carga progresiva de fotografías, bloque diferido de egresados y navegación con snapshot. No se cambió ninguna consulta ni DTO.
- `StudentHorizontalBoard` ahora permite arrastrar horizontalmente con el botón izquierdo. Solo inicia para mouse primario y fuera de controles interactivos; captura el puntero, exige 6 px, abandona el gesto cuando predomina el movimiento vertical y suprime en captura el clic generado tras un arrastre. `pointerup`, `pointercancel` y `lostpointercapture` limpian el estado. El scroll táctil, trackpad, rueda/barra y vertical permanecen nativos.
- Las flechas se deshabilitan de acuerdo con la posición real y se recalculan en scroll/resize. El tablero enfocado admite `ArrowLeft` y `ArrowRight`, muestra foco y usa cursores `grab`/`grabbing`.
- `EstudianteCard` reduce el retrato a 64 px, usa iniciales como fallback y prioriza nombre, código UIS, cohorte y estado. El estado se repite textual e icónicamente, y la tarjeta inactiva usa además borde lateral neutro e insignia discontinua. Se retiraron documento y correo del resumen para reducir ruido y exposición; siguen disponibles en el perfil. El botón **Ver perfil** mantiene el callback existente.
- Los estilos usan exclusivamente tokens semánticos existentes y `color-mix`, con anchos fluidos para escritorio/tablet/móvil y soporte inherente para `body.light`/`body.dark`. No hay dependencias nuevas.

## Paths, contratos y salida esperada
- Tablero/interacción: `src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx` y `.css`.
- Tarjeta: `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx` y `.css`.
- Ajuste responsive de filtros: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.css`.
- Entrada sin cambios: `EstudianteCoordinacion` y los servicios existentes de `src/modules/estudiantes`; la salida esperada sigue navegando a `/coordinacion/estudiantes/{estudiante.id}` con `{ estudiante }` en `location.state`.
- No cambiaron endpoints, schemas, roles, variables de entorno, seeds ni datasets.

## Retos y próximos pasos
1. Ejecutar una prueba E2E autenticada: clic normal en **Ver perfil** navega una sola vez; arrastrar desde el cuerpo de una tarjeta más de 6 px desplaza y no navega; iniciar sobre el botón conserva el comportamiento del control.
2. Revisar visualmente datos reales en tema claro/oscuro a 1440, 768 y 390 px, especialmente nombres/estados largos y fotos de encuadre heterogéneo.
3. Confirmar en Safari que Pointer Events, `color-mix` y `ResizeObserver` satisfacen la matriz institucional; agregar fallback solo si esa matriz incluye navegadores antiguos.

## Entorno y verificaciones recientes
- Reutilizar exclusivamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, Poetry, entornos Python ni un segundo árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. `npm ci` reproduce el lockfile; no hay seeds ni script `test`.
- `npx eslint src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx` (2026-09-20): PASS.
- `npm run build` (2026-09-20): PASS; 271 módulos, `dist/assets/index-Bd4ooJs_.css` y `dist/assets/index-Clw57B_Z.js`. Solo persiste el aviso informativo por el chunk JS de 611.43 kB.
- `npm run lint` (2026-09-20): FAIL por 9 errores y 1 warning preexistentes fuera de esta pantalla (servicios API con `any`, guard/mocks de admisiones, validación documental y tipos/efecto de Solicitudes). Los tres archivos TypeScript del cambio pasan aislados.
- `git diff --check` (2026-09-20): PASS. No se generó captura ni prueba E2E: Chromium, Chrome y Firefox no están disponibles en el contenedor, y la ruta protegida requiere backend/sesión institucional.

---

# Update 2026-09-19 — Acta obligatoria al aprobar solicitudes

## Estado actual y decisiones
- En `/solicitudes/:solicitudId` y el detalle compartido de créditos, **Aprobar** ya no llama inmediatamente al cambio de estado: abre un diálogo, consulta `GET /sapp/actas` mediante el servicio existente y exige escoger un acta.
- El listado se filtra por la instancia del estado previo. Si `estado` o `estadoSigla` contiene **CONSEJO**, se ofrecen únicamente actas con `tipoConsejo: true`; en el estado **ENVIADA A COMITE ASESOR DE POSGRADOS** se muestran exclusivamente las de `tipoConsejo: null`. El mismo detalle y asociación se reutiliza desde los listados de solicitudes generales y créditos condonables, evitando asociar un acta de una instancia diferente.
- Los estados descriptivos que contienen **COMITE** o **CONSEJO** habilitan la resolución para los roles reconocidos por `canManagePosgrados`, además de la sigla histórica `ENVIADA`. **Rechazar** conserva el flujo sin acta.
- El diálogo previo de solicitudes OTRA se conserva. Tras elegir si se remite al Consejo, se solicita el acta y el PUT incluye tanto el `actaId` seleccionado como `enviarConsejo=true` cuando se escogió esa alternativa. No hay IDs hardcodeados.

## Paths, contratos y salida esperada
- Vista/orquestación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`; estilos temáticos: `src/pages/SolicitudDetalle/SolicitudDetallePage.css`; serialización: `src/modules/solicitudes/api/solicitudCambioEstadoService.ts`; catálogo reutilizado: `src/modules/actas/api.ts` y `src/modules/actas/types.ts`.
- Catálogo: `GET /sapp/actas` → `{ ok, message, data: ActaDto[] }`, donde cada elemento incluye al menos `{ id, codigo, nombre, tipoConsejo }`; para este flujo se espera `tipoConsejo: true | null` (Consejo | Comité).
- Aprobación: `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&actaId={id}`, sin body. Para OTRA remitida al Consejo, también incluye `enviarConsejo=true`. Salida esperada: solo se ejecuta al elegir un acta válida y después se refresca el detalle con el GET existente.
- No se añadieron paquetes, variables, seeds, datasets ni schemas. Se reutiliza el árbol npm actual.

## Retos y próximos pasos
1. Validar con solicitudes reales cuyos estados previos sean Comité y Consejo que el texto recibido contiene esas palabras y que el backend acepta el acta del tipo filtrado.
2. Confirmar con producto si `enviarConsejo=true` debe asociar el acta del Comité que toma la decisión de remitir, como implementa el flujo actual, o si esa transición no debe considerarse todavía una aprobación definitiva.
3. Probar vacío, error del catálogo y rechazo del PUT con sesión institucional; el diálogo bloquea la confirmación cuando no existen actas elegibles.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx src/modules/actas/types.ts` (2026-09-19): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-19): PASS; 271 módulos transformados y artefactos `dist/assets/index-Chy-FRr7.css` e `index-rdW-fojp.js`. Persiste el warning informativo no bloqueante por el chunk JS de 607.12 kB. `git diff --check`: PASS. No existe script `test`.
- `npm run lint` (2026-09-19): FAIL por 9 errores preexistentes fuera de los archivos modificados (`no-explicit-any`, `set-state-in-effect`, variables sin uso e interfaces vacías) y un warning de dependencia de hook; el lint focalizado anterior confirma que este cambio no agrega hallazgos.
- No se generó captura: Chromium, Chrome y Firefox no están disponibles en `PATH`, y la pantalla protegida necesita una sesión institucional, una solicitud resolutiva y actas reales para representar el nuevo diálogo.

---

# Update 2026-09-18 — Director de grupo de investigación

## Estado actual y decisión
- En `/coordinacion/profesores`, pestaña **Grupos de investigación**, el listado de integrantes consume el nuevo booleano `esDirector`. El único registro con valor `true` se distingue mediante la insignia **Director**; las demás filas se presentan como **Integrante** y habilitan **Hacer director**.
- La designación solicita confirmación, bloquea simultáneamente altas, bajas y otras designaciones, ejecuta el nuevo PUT y vuelve a consultar los integrantes. La interfaz no modifica el arreglo local de forma optimista: muestra únicamente la condición de director confirmada por el GET posterior, sin recarga completa de la página.
- Se conserva **Retirar** para todos los integrantes, incluido el director. Si la regla de negocio debe impedir retirar al director, el backend debe rechazarlo o producto debe definir la restricción antes de ocultar esa acción.

## Paths, contratos y salida esperada
- DTO: `src/api/gruposInvestigacionTypes.ts`; transporte: `src/api/gruposInvestigacionService.ts`; estado y orquestación: `src/pages/GestionProfesores/GestionProfesoresPage.tsx`; insignia, botón y agrupación de acciones: `src/pages/GestionProfesores/GestionProfesoresPage.css`.
- Consulta: `GET /sapp/gruposInvestigacionDocentes?grupoId={grupoId}` → `{ ok, message, data: Array<{ esDirector: boolean, existeEnSapp: boolean, id: number, nombre: string, uuid: string | null }> }`. Se espera un máximo de un elemento con `esDirector: true`.
- Mutación: `PUT /sapp/gruposInvestigacionDocentes/director?grupoId={grupoId}&docenteId={docenteId}`, sin body. Se aceptan tanto un envelope exitoso como HTTP 204. Al completarse se repite el GET anterior; el nuevo director debe llegar con `esDirector: true` y el anterior con `false`.

## Retos y próximos pasos
1. Validar con el gateway real si el PUT responde con envelope o 204 y que el GET posterior actualice ambos indicadores de forma atómica.
2. Confirmar la regla para retirar al director actual y el mensaje esperado si el grupo todavía no tiene reemplazo.
3. Hacer una prueba visual autenticada en temas claro/oscuro y viewport móvil; este entorno no dispone de navegador ejecutable ni de una sesión institucional.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. El proyecto usa Node.js/npm y las versiones exactas están fijadas por `package-lock.json` y resumidas en `README.md`; no se agregaron dependencias, seeds ni datasets.
- `npx eslint src/pages/GestionProfesores/GestionProfesoresPage.tsx src/api/gruposInvestigacionService.ts src/api/gruposInvestigacionTypes.ts` (2026-09-18): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; TypeScript y rolldown-vite transformaron 271 módulos y generaron `dist/assets/index-CsH7l7Ht.css` e `index-COZE89ny.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 604.18 kB. `git diff --check`: PASS.
- No existe script `test` en `package.json`. No se generó captura porque Chromium, Chrome y Firefox no están disponibles en `PATH`, y la ruta protegida necesita backend y sesión institucional para mostrar datos reales.

---

# Update 2026-09-18 — Firma desde el módulo de Créditos condonables

## Estado actual y decisión
- Corregido el detalle `/creditos-condonables/:solicitudId`: los perfiles habilitados por `canManagePosgrados` ven **Firmar todos los documentos** cuando `estado` o `estadoSigla`, normalizado a mayúsculas, contiene `POR FIRMA`.
- La visibilidad ya no depende de `location.state.fromAssigned`. Ese estado transitorio solo se adjuntaba al navegar desde la tabla de solicitudes asignadas, por lo que faltaba al abrir un crédito desde el módulo dedicado o pegar su URL (caso reportado: solicitud 63, **POR FIRMA DIRECTOR DE TG**).
- Se mantiene la protección por rol en la interfaz y en la ruta de Créditos condonables. No cambiaron el endpoint de firma, los contratos, estilos, paquetes, variables, seeds ni datasets.

## Paths, contrato y salida esperada
- Lógica de visibilidad y operación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`; guard compartido: `src/auth/roleGuards.ts`; ruta protegida: `src/app/routes/creditosCondonablesRoutes.tsx`.
- Entrada: detalle de solicitud con `estado` o `estadoSigla` que incluya `POR FIRMA`, y sesión `ADMIN_POSGRADOS`, `SECRETARIA_POSGRADOS` o `COORDINADOR_POSGRADOS`.
- Salida: se presenta **Firmar todos los documentos** independientemente de si se llegó desde `/solicitudes`, `/creditos-condonables` o mediante URL directa. Al activarlo se conserva `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` y luego se recargan detalle y adjuntos.

## Retos y próximos pasos
1. Validar con sesión institucional la solicitud 63 y confirmar en Network que la firma responde correctamente y que el refresco entrega el estado siguiente esperado.
2. Verificar con backend que los tres perfiles de gestión autorizados por el frontend tienen permiso equivalente sobre el endpoint; la autorización definitiva sigue siendo responsabilidad del servidor.
3. Confirmar casos adicionales de estados de firma para director, coordinación u otros responsables. La detección conserva la regla previa basada en el texto `POR FIRMA`.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. El proyecto usa Node.js/npm y las versiones exactas están fijadas por `package-lock.json` y resumidas en `README.md`.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` (2026-09-18): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; 271 módulos transformados, con `dist/assets/index-CNYnAK7V.css` e `index-Bj-sDITf.js`. Persiste el warning informativo por el chunk JavaScript de 603.01 kB.
- `npm run lint` global (2026-09-18): FAIL por los 9 errores y 1 warning preexistentes en servicios API, el guard de evaluación, mocks, documentos y solicitudes; el archivo funcional modificado pasa el lint focalizado. `git diff --check`: PASS. No existe script `test` en `package.json`.
- No se generó captura: el contenedor no tiene Chromium, Chrome ni Firefox en `PATH`, y la ruta protegida requiere una sesión institucional con una solicitud en estado de firma.

---

# Update 2026-09-18 — Asignación de profesores a grupos de investigación

## Estado actual y decisiones
- En `/coordinacion/profesores`, pestaña **Grupos de investigación**, el selector contiene únicamente el grupo. Después de seleccionarlo aparecen, en este orden, la tabla de profesores ya vinculados y una segunda tabla con profesores de posgrados disponibles para agregar.
- La tabla disponible se deriva exclusivamente de `GET /sapp/docentes` con `tieneRolDocentePosgrados: true`, excluye los UUID ya asociados y, como compatibilidad con respuestas del grupo que no incluyan UUID, excluye también coincidencias de nombre normalizado. Incluye búsqueda por nombre, documento o correo y paginación local de 10 filas.
- **Agregar al grupo** envía el UUID de la fila, bloquea temporalmente las demás mutaciones y vuelve a consultar los integrantes al finalizar. **Retirar** conserva el contrato y confirmación existentes. No se agregaron dependencias, variables, seeds ni datasets.

## Paths, contratos y salida esperada
- Vista/orquestación: `src/pages/GestionProfesores/GestionProfesoresPage.tsx`; estilos temáticos: `src/pages/GestionProfesores/GestionProfesoresPage.css`; transporte existente: `src/api/gruposInvestigacionService.ts`; DTOs: `src/api/gruposInvestigacionTypes.ts`.
- Catálogo elegible: `GET /sapp/docentes` → `data: Array<{ uuid, fullName, email, documentNumber, tieneRolDocentePosgrados }>`; solo son elegibles los elementos cuyo indicador sea `true`.
- Alta: `POST /sapp/gruposInvestigacionDocentes` con `{ "grupoId": number, "docenteUuid": string }`. Baja: `DELETE /sapp/gruposInvestigacionDocentes?grupoId={grupoId}&docenteId={docenteId}`. Tras el alta se espera que `GET /sapp/gruposInvestigacionDocentes?grupoId={grupoId}` incluya al profesor y que este desaparezca de disponibles.

## Retos, próximos pasos y entorno
1. Validar con una sesión institucional y grupos reales que la respuesta de integrantes expone `docenteUuid`; la exclusión por nombre es solo una compatibilidad defensiva y no reemplaza un identificador estable.
2. Confirmar respuestas de duplicado/conflicto y autorización del POST/DELETE con el gateway. El frontend muestra el mensaje del envelope cuando está disponible.
3. Revisar ambos temas y viewport móvil con suficientes profesores para ejercitar búsqueda y paginación.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Entorno observado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.

## Verificación reciente
- `npx eslint src/pages/GestionProfesores/GestionProfesoresPage.tsx src/api/gruposInvestigacionService.ts src/api/gruposInvestigacionTypes.ts` (2026-09-18): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; TypeScript y rolldown-vite transformaron 271 módulos y generaron `dist/assets/index-rbGXm0ph.css` e `index-CEmt7pmW.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 601.60 kB.
- `git diff --check` (2026-09-18): PASS. No existe script `test` en `package.json`.
- No se generó captura: el contenedor no dispone de Chromium, Chrome ni Firefox y la ruta protegida requiere sesión/backend institucional para una representación útil.

---

# Update 2026-09-18 — Consejo Académico al aprobar solicitudes OTRA

## Estado actual y decisión
- En el detalle de solicitudes, los roles habilitados por `canManagePosgrados` siguen compartiendo la acción **Aprobar**. Cuando la solicitud tiene `tipoSolicitudId === 11` (**OTRA**, asociada al trámite 15), esa acción abre un diálogo obligatorio antes de llamar al backend.
- **Sí, enviar al Consejo** aprueba con `enviarConsejo=true`; **No, aprobar directamente** conserva literalmente el comportamiento anterior y omite el query param. **Cancelar** y el backdrop cierran el diálogo sin cambiar el estado. Rechazar y aprobar tipos distintos de OTRA no abren el diálogo.
- El cliente acepta una opción `enviarConsejo?: boolean`, pero serializa el parámetro únicamente cuando es `true`. Esto evita enviar `false` a backends que esperan el contrato histórico cuando no se requiere Consejo.

## Paths, contrato y salida esperada
- Orquestación/diálogo: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`; apariencia temática y responsive: `src/pages/SolicitudDetalle/SolicitudDetallePage.css`; URL HTTP: `src/modules/solicitudes/api/solicitudCambioEstadoService.ts`.
- Entrada discriminante: `SolicitudAcademicaDto.tipoSolicitudId === 11`. No depender del texto visible para evitar diferencias entre **OTRA**/**OTRO** o cambios de capitalización.
- Contrato afirmativo: `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&enviarConsejo=true`, sin body. Contrato negativo y resto de tipos: `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA`, sin body.
- El `actaId=2` incluido en el ejemplo del requerimiento no se añadió: este flujo no dispone de selección de acta y el contrato anterior del frontend tampoco enviaba `actaId`. Confirmar con backend/producto si debe existir una fuente real y dinámica para ese valor; no hardcodear `2` sin esa definición.

## Retos y próximos pasos
1. Validar con sesiones reales de ADMIN, SECRETARIA y COORDINADOR que los tres perfiles ven el diálogo y que Network omite/incluye el parámetro según la decisión.
2. Confirmar con backend si remitir al Consejo mantiene inmediatamente el estado `APROBADA` y cuál es la respuesta/estado posterior esperado.
3. Validar visualmente el diálogo en temas claro/oscuro y viewport móvil. La ruta está protegida y necesita una solicitud OTRA real en estado `ENVIADA`.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No se agregaron paquetes, variables, seeds ni datasets.
- `npx eslint src/modules/solicitudes/api/solicitudCambioEstadoService.ts src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` (2026-09-18): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; TypeScript y rolldown-vite transformaron 271 módulos y generaron `dist/assets/index-BpcPKGuv.css` e `index-BX3WKUBT.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 597.06 kB. `git diff --check`: PASS. No existe script `test` en `package.json`.
- No se generó captura: el contenedor no incluye Chromium, Chrome, Firefox ni una herramienta de navegador, y la ruta protegida requiere sesión institucional y una solicitud OTRA real en estado `ENVIADA`.

---

# Update 2026-09-18 — Selector DANE para lugar de expedición en créditos condonables

## Estado actual y decisiones
- Los formularios de **Solicitud crédito condonable** y **Renovación crédito condonable** ya no aceptan libremente `Departamento/Ciudad`. Presentan un selector de departamento compacto y un combobox de municipio con desplegable propio, filtrable y consistente con el estilo visual del departamento.
- Santander (código DANE `68`) queda seleccionado por defecto. Cambiar el departamento borra el municipio para impedir combinaciones inconsistentes; restablecer el formulario vuelve a Santander.
- La previsualización solo se habilita cuando el texto coincide, ignorando mayúsculas y tildes, con un municipio del departamento. Al perder foco se restaura su presentación Camel Case. El payload conserva únicamente `ciudadExpedicionDocumento: string` con el nombre visible del municipio; no se envían departamento ni códigos DANE.
- El combobox de municipio abre al recibir foco, filtra mientras se escribe, admite flechas, `Enter` y `Escape`, y se cierra al hacer clic fuera. El cambio es exclusivamente visual y de interacción; no agrega paquetes ni altera contratos.

## Paths, artefactos y contrato esperado
- Componente accesible y responsive: `src/modules/solicitudes/components/DaneLocationSelector/DaneLocationSelector.tsx` y `.css`; búsqueda, normalización y valor por defecto: `daneLocations.ts`.
- Integración y payload: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`.
- Fuente entregada: `public/resources/Tabla-Códigos-Dane.pdf`. Dataset derivado localmente: `src/modules/solicitudes/data/daneLocations.json`, con 33 departamentos y 1.119 municipios/registros, sin dependencia o consulta de red.
- Contrato sin cambios: la previsualización de crédito recibe `ciudadExpedicionDocumento`, por ejemplo `"Bucaramanga"`; nunca `"Santander/Bucaramanga"`, el código `001` ni un objeto. Aplica a ambos tipos de crédito detectados por el formulario.

## Retos y próximos pasos
1. Validar con sesión real ambos tipos de solicitud, el cambio de Santander a otro departamento y el payload en Network. La ruta protegida y los catálogos remotos de tipos/modalidades impiden una validación visual local representativa.
2. Confirmar con producto si se desea una fuente DANE más reciente; esta implementación reproduce deliberadamente el PDF suministrado y no mezcla datos externos.
3. Si el backend pasa a requerir código DANE, versionar explícitamente el contrato; no enviar códigos sin coordinación porque hoy espera solo el nombre del municipio.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No se añadieron paquetes ni variables de entorno.
- `npx eslint src/modules/solicitudes/components/DaneLocationSelector/DaneLocationSelector.tsx` (2026-09-18): PASS; npm mostró solo el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; 271 módulos transformados y artefactos `dist/assets/index-C5_8d92w.css` e `index-DtocM0qY.js`. Persiste el warning informativo por el chunk JavaScript de 595.74 kB. No existe script `test`.
- `npm run lint` global (2026-09-18): FAIL por 9 errores preexistentes fuera del selector (tipos `any`, variables no usadas, interfaces vacías y un `setState` en efecto) y 1 warning de dependencia de hook; el lint focalizado del archivo modificado sí pasa.
- Captura pendiente por limitación ambiental: no hay Chromium, Chrome ni Firefox en `PATH`, y la pantalla necesita sesión institucional y respuestas del backend.

---

# Update 2026-09-18 — Paridad de gestión ADMIN/SECRETARIA/COORDINADOR

## Estado actual y decisión
- Los roles canónicos `ADMIN_POSGRADOS`, `SECRETARIA_POSGRADOS` y `COORDINADOR_POSGRADOS` siguen siendo valores distintos, pero por decisión funcional tienen ahora exactamente la misma capacidad operativa en el frontend.
- `src/auth/roleGuards.ts` es la fuente única de esta política: `ROLES_GESTION_POSGRADOS` enumera los tres perfiles y `canManagePosgrados(roles)` resuelve la pertenencia mediante la normalización existente. No convertir un rol en otro ni modificar `normalizeRole`: la separación debe preservarse para cambios futuros.
- La revisión cubrió menú, guardas de rutas y autorizaciones internas. Los tres perfiles pueden usar Créditos condonables, Informes a dependencias, Actas, Fechas, Gestión profesores y estudiantes; además comparten creación/configuración/finalización de Admisiones, validación documental, gestión de Matrícula, resolución de Solicitudes y la variante administrativa de Perfil.

## Paths, contratos y salida esperada
- Política: `src/auth/roleGuards.ts`; compatibilidad readonly: `src/modules/auth/roles/roleUtils.ts` y `src/routes/RequireRoles/RequireRoles.tsx`.
- Navegación/rutas: `src/app/navigationItems.ts`, `src/app/routes/index.tsx` y `src/app/routes/creditosCondonablesRoutes.tsx`.
- Acciones de página auditadas: `src/pages/{AdmisionesHome,InscripcionAdmisionDetalle,InscripcionDocumentos,Matricula,MatriculaDetalleCoordinacion,Perfil,Solicitudes,SolicitudDetalle}`.
- Contrato de entrada sin cambios: `GET /api/sapp/inicio` entrega los roles funcionales en `clientRoles`; los nombres legacy todavía se normalizan. Salida esperada: al iniciar por separado con cualquiera de los tres roles, aparecen los mismos accesos y las mismas acciones administrativas, aunque el encabezado sigue mostrando la identidad real (`ADMIN`, `SECRETARIA` o `COORDINADOR`).
- No se agregaron ni cambiaron endpoints, payloads, variables, dependencias, schemas, seeds o datasets.

## Retos y próximos pasos
1. Ejecutar una matriz E2E con tres cuentas institucionales, una por rol, y comparar rutas visibles, accesos directos por URL y botones de acción; la seguridad definitiva debe estar alineada también en el backend.
2. Si producto diferencia permisos en el futuro, editar primero `ROLES_GESTION_POSGRADOS` o crear una política con nombre funcional más específico; no dispersar nuevamente arreglos de roles por las páginas.
3. Validar especialmente respuestas 403 del backend en Créditos condonables, cierre de Admisiones, validación documental y cambios de estado de Solicitudes/Matrícula, porque este repositorio solo controla autorización de interfaz.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm. Node.js 24.15.0 y npm 11.4.2.
- Paquetes instalados: React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide React 0.468.0-local, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0; `package-lock.json` fija el árbol exacto.
- `npm run build` (2026-09-18): PASS; 267 módulos transformados, artefactos `dist/assets/index-BKgrn9UU.css` e `index-BCj8u8EB.js`; solo persiste el warning informativo del chunk JS de 553.12 kB.
- ESLint focalizado sobre los 16 archivos TypeScript/TSX intervenidos (2026-09-18): PASS; npm solo mostró el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run lint` global (2026-09-18): FAIL por 9 errores y 1 warning preexistentes en tres servicios API, el guard de evaluación, mocks/fachadas de documentos y tipos/componentes de Solicitudes; ningún hallazgo pertenece a las líneas cambiadas para esta política.
- `git diff --check` (2026-09-18): PASS. No existe script `test` en `package.json`. No se requiere captura porque no hubo cambio visual: se habilitaron superficies existentes según rol y su representación depende de sesiones reales del gateway.

---
# Update 2026-09-18 — Recordatorio global de firma pendiente

## Estado actual y decisión
- Después de inicializar una sesión válida, el layout protegido consulta una vez `GET /sapp/firmaUsuario/{usuarioId}` usando `user.id`, que corresponde al ID de `UsuarioSapp`; el `63` del requerimiento era un ejemplo y no quedó hardcodeado.
- Si la respuesta no contiene firma, se muestra un toast global **Firma pendiente** con el enlace **Ingresa aquí para anexarla.** hacia `/perfil`. El aviso puede cerrarse y también se oculta al seguir el enlace. Si existe firma no se renderiza; si la consulta falla por red, contrato o autorización tampoco se presenta, para no afirmar incorrectamente que falta.
- El formulario de perfil y su carga de PNG/JPG permanecen sin cambios. El toast usa tokens semánticos, foco visible, `role="status"` y adaptación móvil para temas claro/oscuro.

## Paths, contrato y salida esperada
- Orquestación: `src/components/SignatureReminder/SignatureReminder.tsx`; estilos: `src/components/SignatureReminder/SignatureReminder.css`; montaje global: `src/components/Layout/Layout.tsx`; servicio reutilizado: `src/modules/perfil/services/firmaPerfilService.ts`.
- Entrada: `GET /sapp/firmaUsuario/{usuarioId}` autenticado. El servicio admite `ApiResponse<{ titulo, contenidoFirma } | null>` o el DTO directo. `contenidoFirma` no vacío significa que la firma existe; `data: null` o contenido vacío significa que debe mostrarse el recordatorio.
- Salida esperada: una sola consulta por montaje/entrada autenticada y por usuario. El enlace navega a la ruta protegida existente `/perfil`, donde se guarda mediante `POST /sapp/firmaUsuario/{usuarioId}`. No se añadieron variables, paquetes, schemas, seeds ni datasets.

## Retos y próximos pasos
1. Validar con sesiones reales las respuestas de firma presente y ausente, especialmente el status/envelope exacto que entrega backend cuando todavía no existe registro.
2. Confirmar en Network que el despliegue productivo realiza una consulta por entrada autenticada. El punto de entrada actual no usa `StrictMode`; si se habilita posteriormente, considerar un caché de promesa compartido para evitar la doble ejecución de efectos propia del modo de desarrollo.
3. Probar visualmente escritorio/móvil y temas claro/oscuro con backend y sesión institucional. La captura local depende de poder completar el login del gateway.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm. El proyecto usa Node.js/npm y las versiones exactas están fijadas por `package-lock.json` y resumidas en `README.md`.
- `npm run build` (2026-09-18): PASS; 267 módulos transformados, con `dist/assets/index-CzzkD3ef.css` e `index-DWDmkdnp.js`. Persiste el warning informativo por el chunk JavaScript de 553.77 kB.
- `npx eslint src/components/SignatureReminder/SignatureReminder.tsx src/components/Layout/Layout.tsx` (2026-09-18): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run lint` global (2026-09-18): FAIL por 9 errores y 1 warning preexistentes en servicios API, el guard de evaluación, mocks, documentos y solicitudes; ningún hallazgo corresponde a los archivos de este ajuste. `git diff --check`: PASS. No existe script `test`.
- No se generó captura: el contenedor no tiene Chromium, Chrome ni Firefox en `PATH`, y el estado visible requiere una sesión institucional cuya respuesta de firma sea vacía.

---

# Update 2026-09-16 — Descarga ZIP integral del estudiante

## Estado actual y decisión
- El detalle `/coordinacion/estudiantes/:estudianteId` muestra **Descargar información** junto a las acciones académicas. Al pulsarlo, el control queda deshabilitado, presenta un spinner y el texto **Preparando descarga...** durante toda la generación remota, y dispara la descarga automáticamente cuando llega el archivo.
- La operación es independiente de la carga de los documentos por pestañas y de los cambios de estado. Un fallo restaura el botón y se informa como alerta en la cabecera; los clics repetidos quedan bloqueados mientras existe una solicitud activa.
- El nombre se toma primero de `Content-Disposition` (incluido `filename*=UTF-8''...`) y cae a `{codigoUIS}-documentos.zip`. El `Blob` se descarga mediante una URL temporal que se revoca después del clic.

## Paths, contrato y salida esperada
- Servicio: `src/modules/estudiantes/services/estudiantesMockService.ts`; vista/orquestación: `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`; estilos temáticos y spinner: CSS homónimo. Se reutiliza el transporte binario `httpFile` de `src/shared/http/httpClient.ts`.
- Contrato: `GET /sapp/estudiantes/{estudianteId}/documentos/zip` sin body → contenido binario `application/zip`; encabezado esperado `Content-Disposition: attachment; filename="...zip"; filename*=UTF-8''...zip`. No parsear como JSON ni como Base64.
- Salida esperada: un único ZIP descargado automáticamente, con el nombre provisto por backend y la estructura documental interna que este genere. El frontend no inspecciona ni modifica sus carpetas o archivos.

## Retos y próximos pasos
1. Validar en integración con un estudiante que tenga un ZIP grande, el nombre con tildes/espacios y una sesión real de coordinación; confirmar además que CORS exponga `Content-Disposition` si frontend y API usan orígenes distintos.
2. Validar respuesta 404/409/500 y expiración de sesión, además de los temas claro/oscuro y viewport móvil.
3. La descarga espera el `Blob` completo porque Fetch no expone progreso portable de construcción del ZIP; el loader indica trabajo indeterminado, no porcentaje.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No se agregaron paquetes, variables, seeds ni datasets.
- `npx eslint src/modules/estudiantes/services/estudiantesMockService.ts src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-V1VYF5Kd.css` e `index-CwvfwWV8.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 547.43 kB. `git diff --check`: PASS.
- `npm run lint` global (2026-09-16): FAIL por 9 errores y 1 warning preexistentes en servicios API, el guard de evaluación, mocks, documentos y solicitudes; los dos archivos TypeScript intervenidos pasan el lint focalizado. No existe script `test`.
- No se generó captura: el contenedor no incluye Chromium, Chrome ni Firefox en `PATH`, y la ruta protegida necesita backend, sesión institucional y un estudiante real para representar la generación del ZIP.

---
# Update 2026-09-16 — Código real y datos de contacto en el detalle de inscripción

## Estado actual y decisión
- En `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId`, **Código de inscripción** prioriza `numeroInscripcion` de la respuesta del backend. El fallback `INS-{id}` se conserva para respuestas antiguas que no incluyan el nuevo campo.
- Las filas Documento, Correo y Teléfono mantienen sus etiquetas y valores, pero ya no muestran emojis.

## Paths, contrato y salida esperada
- DTO: `src/modules/admisiones/api/types.ts`; render y fallback: `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`.
- Entrada: el elemento de `data` del detalle de inscripción puede incluir `numeroInscripcion: number | string | null`. Para `{ id: 83, numeroInscripcion: 1104843491 }`, la pantalla debe mostrar `1104843491`, no `INS-83`.
- No se agregaron dependencias, variables de entorno, seeds ni datasets. Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry ni otro árbol npm.

## Pendiente
- Validar la ruta protegida con una sesión institucional y una respuesta real del backend. El repositorio no dispone de datos locales para reproducir esa vista de forma autónoma.
- `npx eslint src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx src/modules/admisiones/api/types.ts` (2026-09-16): PASS; npm mostró solamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; se transformaron 259 módulos y se generaron `dist/assets/index-V1VYF5Kd.css` e `index-BEf7u2_z.js`. Persiste el warning informativo por el chunk JavaScript mayor a 500 kB. `git diff --check`: PASS.
- No se generó captura: no hay Chromium, Chrome ni Firefox en `PATH`, y la ruta requiere sesión institucional y datos del backend.

---
# Update 2026-09-16 — Identidad única y fotografía robusta en el perfil

## Estado actual y decisión
- `/perfil` ya no duplica el nombre, rol y fotografía entre el encabezado global y el contenido. En esta ruta, `ModuleLayout` oculta únicamente su resumen de usuario mediante la prop opcional `showUserSummary={false}` y conserva **Mi perfil** y ambos logos institucionales; las demás páginas mantienen el comportamiento predeterminado.
- El perfil usa una cabecera amplia con una sola fotografía circular, nombre y roles. La imagen consume los tokens del tema y se adapta a móvil; si falta o falla, presenta la inicial del usuario sin mostrar una imagen rota.
- La normalización compartida de fotografías admite Base64 puro o un data URI ya construido. Evita anteponer dos veces `data:...;base64,`, respeta el `mimeType` del contrato y elimina espacios de la carga Base64.

## Paths, contratos y salida esperada
- Cabecera y fallback visual: `src/pages/Perfil/PerfilPage.tsx` y `src/pages/Perfil/PerfilPage.css`; resumen opcional del layout: `src/components/ModuleLayout/ModuleLayout.tsx`; normalizador: `src/shared/files/base64FileUtils.ts`.
- Entrada conservada: `useAuth().user.estudiante.foto = { documentoId, nombreArchivo, contenidoBase64, mimeType }`. No cambian `/inicio`, firma, payloads, schemas, variables, dependencias, seeds ni datasets.
- Salida esperada: una única identidad visible en `/perfil`, imagen centrada con `object-fit: cover` y fallback inicial. Fuera de `/perfil`, nombre/rol/avatar continúan junto a las marcas UIS/EISI.

## Retos, próximos pasos y entorno
1. Validar con sesiones reales cuya foto llegue en ambas variantes (Base64 y data URI), y comprobar escritorio/móvil y temas claro/oscuro.
2. Confirmar que las fotos con orientación EXIF no requieren una transformación en backend; el frontend no rota ni recomprime el documento.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No existe script `test`.

## Verificación reciente
- `npx eslint src/shared/files/base64FileUtils.ts src/components/ModuleLayout/ModuleLayout.tsx src/pages/Perfil/PerfilPage.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index--hq8ewXo.css` e `index-PMgQNOqJ.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 546.27 kB. `git diff --check`: PASS.
- `npm run lint` global (2026-09-16): FAIL por 9 errores y 1 warning preexistentes en servicios API, el guard de evaluación, mocks, documentos y solicitudes; los tres archivos TypeScript intervenidos pasan el lint focalizado. No existe script `test`.
- No se generó captura: el contenedor no incluye Chromium, Chrome ni Firefox en `PATH`, y `/perfil` requiere una sesión institucional con fotografía para una validación representativa.

---
# Update 2026-09-16 — Perfil de coordinación simplificado

## Estado actual y decisión
- En `/perfil`, las sesiones con rol `COORDINACION` o `ADMIN` ya no ven **Tipo de documento**, **Número de documento** ni **Último ingreso**. Los perfiles no administrativos conservan tipo y número de documento; no cambió el contrato de autenticación ni se eliminaron propiedades del modelo de sesión.
- **Programa a cargo** ignora deliberadamente `user.programa` para coordinación y presenta dos valores fijos: **MAESTRÍA EN INGENIERÍA DE SISTEMAS E INFORMÁTICA** y **347:DOCTORADO EN CIENCIAS DE LA COMPUTACION**. Se usa una lista semántica compacta, compatible con los temas claro y oscuro.

## Paths, contratos y salida esperada
- Renderizado y valores fijos: `src/pages/Perfil/PerfilPage.tsx`; composición de la lista: `src/pages/Perfil/PerfilPage.css`.
- Entrada conservada: `useAuth().user`, incluidos `roles`, `persona`, `activo` y los demás datos utilizados por perfiles de estudiante. No se agregaron endpoints, payloads, schemas, variables de entorno, dependencias, seeds ni datasets.
- Salida esperada para coordinación: información personal sin identificadores documentales; tarjeta de coordinación con ambos programas, unidad académica y estado de cuenta, sin el placeholder **Pendiente de integración** de último ingreso.

## Retos, próximos pasos y entorno
1. Validar la ruta protegida con cuentas reales de coordinación y administración, en escritorio/móvil y temas claro/oscuro.
2. Confirmar con producto si la maestría también debe mostrar un código numérico; no se inventó uno porque el requerimiento solo suministró explícitamente `347` para doctorado.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No existe script `test`.

## Verificación reciente
- `npx eslint src/pages/Perfil/PerfilPage.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-CtvKtV-G.css` e `index-CfPO9zmy.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 545.65 kB.
- `git diff --check` (2026-09-16): PASS. No se generó captura porque el contenedor no incluye Chromium, Chrome ni Firefox y la ruta requiere una sesión institucional.

---
# Update 2026-09-16 — Orden y presentación de materias en matrícula estudiantil

## Estado actual y decisión
- En el selector de materias de `/matricula`, las asignaturas cuyo `nivel` es numérico aparecen antes que aquellas cuyo `nivel` es `null`. El orden relativo recibido del API se conserva dentro de ambos grupos mediante el ordenamiento estable de JavaScript.
- Un nivel nulo se presenta como **Electiva**, nunca como `Nivel null`. La misma etiqueta se usa en la tabla después de seleccionar la materia.
- Cada opción del desplegable dispone el nombre y la línea `código · nivel/Electiva` en vertical y alineados a la izquierda. Los estilos usan los tokens temáticos existentes y funcionan en modo claro/oscuro.

## Paths, contrato y salida esperada
- Selector y orden: `src/modules/matricula/components/MateriasSelector/MateriasSelector.tsx`; presentación: `MateriasSelector.css`; tabla seleccionada: `src/modules/matricula/components/MateriasSelectedTable/MateriasSelectedTable.tsx`.
- Contrato tipado: `MateriaDto.nivel` y `AsignaturaApiDto.nivel` son `number | null` en `src/modules/matricula/types.ts` y `src/modules/matricula/services/matriculaAcademicaService.ts`.
- Entrada conservada: `GET /sapp/asignaturas?programaId={programaId}`. No cambian endpoint, envelope, payload de creación, dependencias, variables de entorno, seeds ni datasets.
- Salida esperada: materias con nivel primero; electivas después; cada opción totalmente alineada a la izquierda. La búsqueda y la exclusión de materias ya elegidas continúan aplicándose antes del ordenamiento.

## Retos, próximos pasos y entorno
1. Validar visualmente con una sesión real `ESTUDIANTE`, un catálogo mixto y ambos temas; la ruta protegida depende del backend institucional.
2. Si producto requiere un orden secundario por número de nivel o nombre, acordarlo antes de modificarlo: actualmente se conserva deliberadamente el orden del API dentro de materias regulares y electivas.
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Entorno observado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.

## Verificación reciente
- `npx eslint src/modules/matricula/types.ts src/modules/matricula/services/matriculaAcademicaService.ts src/modules/matricula/components/MateriasSelector/MateriasSelector.tsx src/modules/matricula/components/MateriasSelectedTable/MateriasSelectedTable.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-WwBwsYZB.css` e `index-BJQm_THy.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 545.47 kB.
- `npm run lint` global (2026-09-16): FAIL por 9 errores y 1 warning preexistentes en servicios API, el guard de evaluación, mocks, documentos y solicitudes; el lint focalizado de todos los archivos TypeScript modificados sí pasa.
- `git diff --check` (2026-09-16): PASS. No existe script `test` en `package.json`.
- No se generó captura: no hay Chromium, Chrome ni Firefox disponible en el contenedor, y la ruta protegida requiere sesión y datos del backend institucional.

---
# Update 2026-09-16 — Una consulta de entrevista para evaluadores de Admisiones

## Estado actual y decisión
- Al abrir el detalle de una admisión, una sesión que sea exclusivamente evaluadora (`PROFESOR`, `DOCENTE` o `DIRECTOR`, sin `ADMIN`, `COORDINADOR` ni `SECRETARIA`) hace una sola consulta de datos de evaluación, limitada a `ENTREVISTA`.
- La promesa se conserva por `inscripcionId` durante el montaje para que la doble ejecución de efectos de React en desarrollo no duplique la solicitud. Su respuesta queda en `evaluacionCache`; por ello `EvaluacionEtapaPage` llena las notas desde caché sin otra llamada.
- `RequireEvaluacionEnabled` espera el estado resuelto por el detalle para estos roles y no consulta el endpoint general mientras el padre está cargando. La rama administrativa no fue modificada: continúa consultando estado general y precargando documentos y las tres etapas.

## Paths, contrato y salida esperada
- Orquestación y caché: `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx` y `src/modules/admisiones/pages/EvaluacionEtapaPage/evaluacionPrefetchCache.ts`.
- Guardia anidada: `src/modules/admisiones/routes/RequireEvaluacionEnabled.tsx`; consumidor de notas: `src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx`.
- Único contrato de evaluación para evaluador: `GET /sapp/evaluacionAdmision/info?inscripcionId={id}&etapa=ENTREVISTA` → `ApiResponse<EvaluacionAdmisionItem[]>`. Salida esperada: solo los ítems cuyo evaluador coincide con la sesión aparecen editables; no deben aparecer solicitudes equivalentes para `HOJA_DE_VIDA`, `EXAMEN_DE_CONOCIMIENTOS` ni `/info?inscripcionId={id}` sin etapa.
- La consulta separada del resumen de inscripción se conserva porque suministra identidad y metadatos del aspirante. No se agregaron dependencias, variables, schemas, seeds o datasets.

## Retos y próximos pasos
1. Validar la pestaña Network con cuentas reales exclusivas de `DOCENTE` y `DIRECTOR`, incluyendo React en modo desarrollo: debe existir exactamente un GET de evaluación con `etapa=ENTREVISTA` por inscripción.
2. Confirmar con backend el mensaje/envelope que retorna el endpoint por etapa cuando una evaluación todavía no está iniciada; actualmente se presenta como error de carga, igual que cualquier respuesta no exitosa del servicio de etapa.
3. No trasladar esta optimización a coordinación: su precarga de todas las secciones, validación y finalización dependen del flujo administrativo existente.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npm run build` (2026-09-16): PASS; 259 módulos transformados y artefactos `dist/assets/index-Bf5vqx-I.css` e `index-BERUP9NS.js`. Persiste el warning informativo por el chunk JavaScript de 545.38 kB.
- `git diff --check` (2026-09-16): PASS.
- El lint focalizado conserva el error preexistente `react-hooks/set-state-in-effect` en `RequireEvaluacionEnabled.tsx:30`; no corresponde a la nueva rama y no se cambió para evitar alterar la lógica administrativa. No existe script `test`.
- No se tomó captura: el cambio no modifica la presentación y la verificación de solicitudes requiere backend y sesión institucional.

---
# Update 2026-09-16 — Contrato real y ubicación de Gestión profesores

## Estado actual y decisiones
- **Gestión profesores** es el último acceso visible del sidebar para `COORDINACION` y `ADMIN`; la ruta protegida continúa siendo `/coordinacion/profesores`.
- Se corrigió el fallo `n.filter is not a function`: `GET /sapp/docentes` no retorna un arreglo directamente en el primer `data`, sino una página en `response.data.data`. El servicio extrae y valida explícitamente esa colección antes de actualizar el estado React.
- La tabla del catálogo usa los campos reales: nombre completo (con fallback a `firstName + lastName` y finalmente `username`), correo institucional, programas académicos y UUID. La búsqueda cubre nombre, correo y usuario. No se muestran atributos sensibles como teléfono, documento o correo personal.

## Paths, contrato y salida esperada
- Adaptación HTTP: `src/api/gruposInvestigacionService.ts`; DTOs: `src/api/gruposInvestigacionTypes.ts`; vista: `src/pages/GestionProfesores/GestionProfesoresPage.tsx`; orden del menú: `src/app/navigationItems.ts`.
- Contrato confirmado: `GET /sapp/docentes` → `{ ok, message, data: { data: Array<{ uuid, firstName: string | null, lastName: string | null, username, fullName, email, attributes: Record<string, string[]> }>, meta: { skip, limit, countInPage: number | null } } }`. La salida interna de `getDocentes()` sigue siendo `Promise<DocenteDto[]>` para aislar a la vista del envelope.
- Si `data.data` no es un arreglo, se lanza un error de contrato legible y la página muestra su alerta en vez de fallar durante `.filter`. Un registro sin nombre visible utiliza el usuario institucional.
- No se modificaron endpoints de grupos: `GET/POST/DELETE /sapp/gruposInvestigacionDocentes` conservan los contratos documentados en la entrada anterior.

## Retos y próximos pasos
1. Validar con sesión institucional la carga completa y confirmar si el backend pagina realmente el catálogo: el ejemplo reporta `limit: 20` y `countInPage: null`, pero contiene más de 20 registros. Si hay páginas posteriores, definir con backend los query params y el total.
2. Confirmar ejemplos reales de grupos e integrantes y la semántica de `id`/`docenteId` antes de validar la baja en producción.
3. Validar escritorio/móvil y temas claro/oscuro. La ruta protegida requiere sesión y backend para una captura representativa.

## Entorno y verificación reciente
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm. El proyecto usa Node.js/npm; no se agregaron paquetes, variables, schemas, seeds o datasets.
- Versiones: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/api/gruposInvestigacionService.ts src/api/gruposInvestigacionTypes.ts src/app/navigationItems.ts src/pages/GestionProfesores/GestionProfesoresPage.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-Bf5vqx-I.css` e `index-B8zvzBAw.js`. Persiste el warning informativo por el chunk JavaScript de 544.94 kB. `git diff --check`: PASS.
- `npm run lint` global (2026-09-16): FAIL por 9 errores y 1 warning preexistentes fuera de los archivos de este ajuste; el lint focalizado sí pasa. No existe script `test`.
- No se generó captura: no hay Chromium, Chrome ni Firefox en `PATH`, y la ruta protegida requiere sesión institucional y backend.

---
# Update 2026-09-16 — Borrador de Gestión profesores

## Estado actual y decisiones
- Se incorporó **Gestión profesores** al menú y a la ruta protegida `/coordinacion/profesores`, disponible exclusivamente para `COORDINACION` y `ADMIN`.
- La pestaña **Docentes en Minerva** consume el catálogo real, permite buscar por nombre y muestra `id`, `nombre` y `uuid`. **Inscribir docente** se presenta deshabilitado porque todavía no se suministró un endpoint ni payload de creación; no debe conectarse a una operación inventada.
- La pestaña **Grupos de investigación** carga el catálogo de grupos y los docentes asociados al grupo seleccionado, permite asociar uno de los docentes mediante su UUID y retirarlo tras confirmación. El selector excluye docentes ya asignados cuando el contrato de integrantes informa `uuid` o `docenteUuid`.

## Paths, contratos y salida esperada
- Vista y estilos: `src/pages/GestionProfesores/GestionProfesoresPage.{tsx,css}`; barrel: `src/pages/GestionProfesores/index.ts` y `src/pages/index.ts`; ruta: `src/app/routes/index.tsx`; menú/icono: `src/app/navigationItems.ts` y `src/components/Sidebar/SidebarModuleIcon.tsx`.
- Servicio: `src/api/gruposInvestigacionService.ts`; DTOs: `src/api/gruposInvestigacionTypes.ts`. Con `VITE_API_URL=/api/sapp`, la normalización convierte los paths `/sapp/...` en `/api/sapp/...` sin duplicar el segmento.
- Contratos usados: `GET /sapp/docentes` → `ApiResponse<Array<{ id: number, nombre: string, uuid: string }>>`; `GET /sapp/gruposInvestigacion` → `ApiResponse<Array<{ id: number, codigoNombre: string }>>`; `GET /sapp/gruposInvestigacionDocentes?grupoId={id}` → integrantes; `POST /sapp/gruposInvestigacionDocentes` con `{ grupoId: number, docenteUuid: string }`; `DELETE /sapp/gruposInvestigacionDocentes?grupoId={id}&docenteId={id}`.
- El borrador tolera en cada integrante `docenteId` o, como respaldo, `id` para el parámetro de borrado. Confirmar con backend si el `id` retornado representa al docente o a la asociación antes de validar producción.

## Retos y próximos pasos
1. Obtener el contrato de creación de docentes para habilitar **Inscribir docente** y definir validaciones del formulario.
2. Confirmar ejemplos reales de respuesta de grupos e integrantes, en particular el nombre visible del grupo, el UUID del integrante y la semántica de `id`/`docenteId`.
3. Validar alta y baja con sesión institucional, además de temas claro/oscuro y viewport móvil. La captura queda pendiente: la ruta protegida necesita backend/sesión y el contenedor no incluye navegador compatible.

## Entorno y verificación reciente
- Reutilizar únicamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. No se añadieron dependencias, variables, seeds o datasets. Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2 y ESLint 9.39.2.
- `npx eslint src/api/gruposInvestigacionService.ts src/api/gruposInvestigacionTypes.ts src/app/navigationItems.ts src/app/routes/index.tsx src/components/Sidebar/SidebarModuleIcon.tsx src/pages/GestionProfesores/GestionProfesoresPage.tsx`: PASS; npm mostró solo el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run lint`: PASS; no se reportaron errores ni advertencias de ESLint.
- `npm run build`: PASS; 259 módulos transformados y artefactos `dist/assets/index-Bf5vqx-I.css` e `index-KKfbsN5N.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 544.55 kB. `git diff --check`: PASS. No existe script `test`.

---
# Update 2026-09-16 — DIRECTOR como evaluador de Admisiones

## Estado actual y decisión
- `DIRECTOR` comparte exclusivamente dentro de Admisiones los permisos operativos de `PROFESOR`/`DOCENTE`. El helper `isEvaluadorAdmision` centraliza los tres roles sin ampliar `isProfesor`, porque este último también condiciona módulos como Matrícula y Solicitudes.
- Una sesión que solo tenga `DIRECTOR` ve **Admisiones** en el menú, accede a `/admisiones` mediante la vista **Mis entrevistas** y puede abrir `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/entrevistas`.
- El detalle restringe al director a la sección de entrevistas y la evaluación filtra los ítems por coincidencia normalizada entre `item.evaluador` y el nombre completo de la persona autenticada. Por ello solo puede modificar y enviar su nota/observaciones; los roles administrativos `ADMIN`, `COORDINADOR` o `SECRETARIA` siguen prevaleciendo cuando coexisten en la sesión.

## Paths, contratos y salida esperada
- Roles: `src/auth/roleGuards.ts`; navegación: `src/app/navigationItems.ts`; protección y selección de vista: `src/app/routes/index.tsx`.
- Bandeja: `src/pages/AdmisionesProfesor/AdmisionesProfesorPage.tsx`; detalle: `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`; propiedad y edición de notas: `src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx`.
- No cambiaron endpoints ni payloads. Se conservan las consultas de convocatorias/inscripciones y el guardado de evaluación existente; el backend debe entregar el rol literal `DIRECTOR` y asignar como `evaluador` el nombre completo que corresponde a la persona de la sesión.
- Salida esperada: el director entra a **Admisiones — Mis entrevistas**, elige un aspirante y encuentra editables solo los componentes de entrevista asignados a su propio nombre. Si no existen componentes coincidentes, ve **No tienes aspectos asignados para esta entrevista**.

## Entorno, retos y próximos pasos
- Usar únicamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. No se añadieron paquetes, variables, schemas, seeds o datasets.
- Entorno verificado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2 y ESLint 9.39.2. Las versiones exactas restantes están fijadas por `package-lock.json` y detalladas en `README.md`.
- Pendiente validar en integración con una cuenta real que posea solo `DIRECTOR`: el backend también debe autorizar sus GET/PUT de evaluación y devolver asignaciones cuyo nombre de evaluador coincida con la persona autenticada. Esta modificación cubre la autorización y restricciones de UI, no la seguridad del backend.

## Verificación reciente
- `npx eslint src/auth/roleGuards.ts src/app/navigationItems.ts src/app/routes/index.tsx src/pages/AdmisionesProfesor/AdmisionesProfesorPage.tsx src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 255 módulos y generaron `dist/assets/index-Cp9gSOCw.css` e `index-srN2J68x.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 536.81 kB. `git diff --check`: PASS.
- `npm run lint` global (2026-09-16): FAIL por 9 errores y 1 warning preexistentes en servicios API, el guard de evaluación, mocks, documentos y solicitudes. Ningún hallazgo corresponde a los archivos modificados para habilitar `DIRECTOR`. No existe script `test` en `package.json`.
- No se generó captura: el ajuste no altera el diseño visual y la ruta protegida requiere backend, sesión institucional y asignaciones reales.

---
# Update 2026-09-10 — Selector compacto de períodos en Admisiones

## Estado actual y decisión
- Los dos combos **Convocatorias anteriores** de `/admisiones` usan `CompactPeriodSelect` en lugar del `<select>` nativo. El cambio evita que una lista extensa de períodos cubra casi todo el viewport: el panel tiene `max-height: 12rem`, `overflow-y: auto` y se superpone a la tarjeta sin alterar su layout.
- El disparador conserva el texto **Seleccione un período...** y las opciones se construyen con el ID y período de cada convocatoria anterior. Seleccionar mantiene exactamente el flujo existente de `handlePreviousChange`; el panel también se cierra con clic externo o `Escape` y devuelve el foco al disparador con este último.
- Fondo, texto, borde, foco, hover, selección, sombra y scrollbar consumen tokens semánticos, por lo que el control funciona en temas claro y oscuro. No se cambiaron endpoints, contratos, schemas, paquetes, variables, seeds ni datasets.

## Paths, contrato y salida esperada
- Componente: `src/pages/AdmisionesHome/CompactPeriodSelect.tsx`; integración: `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`; presentación: `src/pages/AdmisionesHome/AdmisionesHomePage.css`.
- Entrada local: `{ id, value, placeholder, options: Array<{ label, value }>, onChange }`. Los valores enviados por cada opción siguen siendo `String(convocatoria.id)` y su etiqueta sigue siendo `convocatoria.periodo`.
- Salida esperada: al abrir cualquier combo se ven aproximadamente cinco períodos dentro de un panel compacto; si hay más, el usuario los recorre mediante scroll. Al elegir uno se navega a la convocatoria correspondiente igual que antes.

## Entorno, retos y verificaciones
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2. No existe script `test`.
- Pendiente validar visualmente ambos programas con una sesión institucional y suficientes convocatorias, incluyendo scroll por ratón/trackpad, teclado y temas claro/oscuro. No se pudo generar captura local porque el contenedor no incluye Chromium, Chrome ni Firefox y la ruta protegida requiere sesión/backend.
- `npx eslint src/pages/AdmisionesHome/AdmisionesHomePage.tsx src/pages/AdmisionesHome/CompactPeriodSelect.tsx`: PASS; npm mostró solo el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; 255 módulos transformados y artefactos `dist/assets/index-Cp9gSOCw.css` e `index-6ZqY9b-z.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 536.54 kB. `git diff --check`: PASS.

---
# Update 2026-09-10 — Acciones documentales de matrícula en dos columnas

## Estado actual y decisión
- En `/matricula/:matriculaId`, para sesiones `COORDINACION` o `ADMIN`, la tabla de documentos ya no mezcla sus cuatro acciones en una sola columna. **Visualización** contiene `Ver` y `Descargar`; **Validación** contiene el componente existente con `Aprobar` y `Rechazar`.
- El grid de escritorio pasó de cinco a seis columnas y mantiene los tokens semánticos existentes. En viewports de hasta 960 px, cada grupo conserva su etiqueta responsive mediante `data-label`, por lo que las acciones siguen siendo distinguibles cuando la cabecera se oculta.
- Solo cambió la composición visual: handlers, estados de espera, confirmación del motivo de rechazo, roles, permisos, aprobación automática y contratos HTTP permanecen intactos.

## Paths, contratos y salida esperada
- Renderizado: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx`; grid y adaptación móvil: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.css`.
- Los documentos continúan llegando de `GET /sapp/document?tramiteId={matriculaId}&codigoTipoTramite=MATRICULA_ACADEMICA`; aprobar/rechazar conserva el servicio de `src/modules/documentos/api/aprobacionDocumentosService.ts`. No se agregaron schemas, payloads, dependencias, variables, seeds ni datasets.
- Salida esperada: seis encabezados (`Documento`, `Estado`, `Fecha de revisión`, `Observaciones`, `Visualización`, `Validación`), con dos botones documentales en cada una de las dos últimas columnas cuando el estado y permisos lo permiten.

## Entorno, retos y próximos pasos
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. El proyecto usa Node.js 24.15.0 y npm 11.4.2; las versiones instaladas exactas están documentadas en `README.md` y fijadas por `package-lock.json`.
- Validar con una sesión institucional de coordinación una matrícula con documentos cargados, estados aprobados/rechazados y modo de captura de motivo. Revisar escritorio, ancho de 960 px o inferior, y temas claro/oscuro.
- No hay script `test` configurado. `npx eslint src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx`: PASS. `npm run build`: PASS (253 módulos; `dist/assets/index-BomhlJcI.css` e `index-CXu4yT4j.js`; solo persiste el warning informativo del chunk de 533.23 kB). `git diff --check`: PASS.
- `npm run lint`: FAIL por 9 errores y 1 warning preexistentes en servicios API, rutas/mocks de admisiones, documentos y solicitudes; el archivo TypeScript intervenido pasa el lint focalizado. No se tomó captura porque el contenedor no tiene Chromium, Chrome ni Firefox en `PATH`, y la ruta requiere sesión institucional y datos reales del backend.

---
# Update 2026-09-10 — Detalle de documentos faltantes en informes

## Estado actual y decisión
- `/coordinacion/reportes` sigue mostrando el mensaje del backend cuando falla la generación. Además, si la respuesta contiene `data.faltantes`, presenta una tarjeta de requisitos pendientes aplicable a **Admisión**, **Matrícula** y **Créditos condonables**.
- Las categorías institucionales aparecen en una lista propia. Cada aspirante aparece en un bloque desplegable con nombre, documento, ID de inscripción, contador y lista de documentos faltantes; la composición es responsive y consume tokens del tema claro/oscuro.
- `HttpError` conserva ahora `data: unknown` tanto para solicitudes JSON como para archivos. El parser de reportes valida ese valor antes de exponerlo a la vista; una forma inesperada o vacía cae de manera segura al mensaje de error existente.

## Paths, contrato y salida esperada
- Transporte compartido: `src/shared/http/httpClient.ts`.
- Parser y tipos: `src/modules/reportes/services/reporteError.ts`.
- Orquestación/presentación: `src/pages/Reportes/ReportesPage.tsx` y `src/pages/Reportes/ReportesPage.css`.
- Contrato reconocido: `{ ok: false, message: string, data: { faltantes: { categoriasInstitucionalesFaltantes: string[], aspirantesConDocumentosFaltantes: Array<{ inscripcionId: number, documento: string, nombreCompleto: string, documentosFaltantes: string[] }> } } }`. Se espera especialmente en HTTP 409, pero la extracción no depende del código de estado para poder reutilizar el manejo en todos los tipos de informe.
- No cambiaron los endpoints ni los parámetros de generación y no se agregaron dependencias, variables, seeds o datasets.

## Retos, próximos pasos y entorno
1. Validar con sesión real los tres endpoints de informes y confirmar si matrícula/créditos usan exactamente la misma forma de `data.faltantes`.
2. Probar categorías institucionales no vacías, pues el ejemplo recibido únicamente incluye aspirantes.
3. Raíz única `/workspace/SAPP-frontend`; usar Node.js 24.15.0, npm 11.4.2 y reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm. Versiones exactas: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.

## Verificación reciente
- `npx eslint src/shared/http/httpClient.ts src/modules/reportes/services/reporteError.ts src/pages/Reportes/ReportesPage.tsx` (2026-09-10): PASS; únicamente apareció el warning ambiental conocido de npm `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-10): PASS; TypeScript y Vite transformaron 254 módulos y generaron `dist/assets/index-C-YVwHkl.css` e `index-CVFNWjzG.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 535.59 kB. `git diff --check`: PASS.
- `npm run lint` global (2026-09-10): FAIL por los 9 errores y 1 warning preexistentes ya documentados (`no-explicit-any`, estado síncrono en efecto, variables sin uso, interfaces vacías y dependencia de hook). El lint dirigido de los tres archivos TypeScript modificados sí pasa. No existe script `test` en `package.json`.
- La captura local queda limitada porque el contenedor no incluye Chromium, Chrome ni Firefox; además, el estado 409 real requiere backend y sesión institucional.

---
# Update 2026-09-10 — Filtros de estudiantes y listado diferido de egresados

## Estado actual y decisiones
- En `/coordinacion/estudiantes`, el campo **Nombre o código** busca ambas propiedades con la misma entrada, ignorando mayúsculas y tildes. El tercer control dejó de ser otro buscador y ahora filtra **Activo**, **Inactivo** o ambos estados; el filtro de período se conserva.
- `EstudianteCard` presenta explícitamente `INACTIVO` como **Inactivo** (y `EGRESADO` como **Egresado**) en vez de dejar esas etiquetas completamente en minúsculas.
- La sección **Egresados** queda al final y cerrada inicialmente. La consulta y su carga de fotos solo comienzan al pulsar **Mostrar egresados**; ocultarla no borra los resultados ya obtenidos durante el montaje. Al cambiar de programa se limpian los egresados y la sección vuelve a cerrarse.
- `StudentHorizontalBoard` acepta título y etiqueta accesible para reutilizar exactamente las mismas tarjetas y navegación sin IDs HTML duplicados. El snapshot efímero listado-detalle conserva opcionalmente egresados y el estado abierto de la sección.

## Paths, contratos y salida esperada
- Orquestación, filtros y carga diferida: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`; estilos responsive con tokens semánticos: CSS homónimo.
- Tarjetas y carrusel reutilizable: `src/modules/estudiantes/components/{EstudianteCard,StudentHorizontalBoard}`. Contrato de caché: `src/modules/estudiantes/services/estudiantesListCache.ts`.
- `getEstudiantesByPrograma(programaId, egresados = false)` está en `src/modules/estudiantes/services/estudiantesMockService.ts`. Listado principal: `GET /sapp/estudiantes/consulta?programaId={id}&egresados=false`; listado diferido: la misma ruta con `egresados=true`.
- Las fotos de ambos listados conservan el flujo `idAspirante -> GET /sapp/inscripcionAdmision/aspirante/{idAspirante} -> GET` documental para trámite `1002`, documento `ANX-4` e `inscripcion.id`, con cuatro cadenas concurrentes. Un fallo individual conserva **Sin foto** y no invalida el listado.
- No se agregaron dependencias, variables de entorno, schemas, seeds ni datasets. Salida esperada inicial: ninguna solicitud con `egresados=true`; después del clic, tarjetas de egresados con fotos progresivas y acceso al mismo detalle.

## Entorno, retos y verificaciones
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. El proyecto utiliza Node/npm y las versiones exactas están en `package-lock.json` y `README.md`.
- Pendiente validar con sesión institucional que el backend interprete literalmente `egresados=true`, que los egresados conserven `idAspirante` para resolver sus fotos y que el endpoint no mezcle estudiantes activos. Revisar además escritorio/móvil y temas claro/oscuro.
- `npx eslint src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx src/modules/estudiantes/services/estudiantesMockService.ts src/modules/estudiantes/services/estudiantesListCache.ts` (2026-09-10): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-10): PASS; TypeScript y rolldown-vite transformaron 253 módulos y generaron `dist/assets/index-mGbadlWH.css` e `index-B2aHv6xE.js`. Persiste el warning informativo por el chunk JavaScript de 532.87 kB. `git diff --check`: PASS.
- No se pudo capturar la ruta protegida con datos: requiere sesión institucional y backend; validar visualmente en el entorno integrado.

---
# Update 2026-09-10 — Convocatoria sin aspirantes permite nuevas inscripciones

## Estado actual, causa y decisión
- El backend productivo responde `404 Not Found` a `GET /sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` cuando una convocatoria todavía no tiene inscripciones. El transporte convertía esa respuesta en un `Error` y el detalle quedaba en estado de fallo, impidiendo abrir **Crear aspirante** aunque la convocatoria estuviera vigente.
- `src/shared/http/httpClient.ts` expone ahora `HttpError`, que conserva el `status` HTTP además del mensaje procesado. Tanto las respuestas JSON como las descargas mantienen su comportamiento previo, pero sus errores no exitosos son instancias de esta clase.
- `getInscripcionesByConvocatoria` captura únicamente `HttpError` con estado `404` y retorna `[]`. No depende del texto del backend. Cualquier `401`, `403`, `500`, error de red o envelope no exitoso continúa propagándose.

## Paths, contrato y salida esperada
- Transporte: `src/shared/http/httpClient.ts`; adaptación del contrato vacío: `src/modules/admisiones/api/inscripcionAdmisionService.ts`; consumidor: `src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx`.
- Entrada relevante: `GET ${VITE_API_URL || '/api/sapp'}/inscripcionAdmision/convocatoria/{convocatoriaId}` autenticado. Respuesta normal: `{ ok, message, data: InscripcionAdmisionDto[] }`; respuesta vacía observada: HTTP 404; resultado normalizado en frontend: `[]`.
- Salida esperada: una convocatoria abierta sin aspirantes muestra cero inscritos, no un error, y mantiene habilitada **Crear aspirante** para `COORDINACION`, `SECRETARIA` y `ADMIN`. La consulta independiente del catálogo de convocatorias sigue determinando vigencia y datos de la convocatoria.

## Retos, próximos pasos y entorno
1. Validar con una sesión real de coordinación la convocatoria `23`: Network conservará el 404 del servidor, pero la pantalla debe renderizar el estado vacío y permitir abrir/usar el modal de creación.
2. Como mejora de contrato backend, considerar retornar HTTP 200 con `data: []`; el frontend debe conservar esta tolerancia mientras producción utilice 404 para la colección vacía.
3. Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. No se agregaron dependencias, variables de entorno, seeds o datasets.
- `npx eslint src/shared/http/httpClient.ts src/modules/admisiones/api/inscripcionAdmisionService.ts` (2026-09-10): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-10): PASS; TypeScript y rolldown-vite transformaron 253 módulos y generaron `dist/assets/index-mGbadlWH.css` e `index-RwX5s21K.js`. Persiste el warning informativo por el chunk JavaScript de 533.08 kB.
- `npm run lint` (2026-09-10): FAIL por 9 errores y 1 warning preexistentes en servicios, mocks, rutas, tipos y componentes no modificados por este ajuste; el lint dirigido de los archivos intervenidos sí pasa.
- `git diff --check` (2026-09-10): PASS. No se tomó captura porque el ajuste no cambia la presentación; la validación funcional requiere sesión institucional y backend.

---

# Update 2026-09-09 — Correo de apertura de matrícula

## Estado actual y decisión
- En la vista de matrícula de `COORDINACION` y `ADMIN` se agregó una tarjeta **Notificación de inicio de matrícula**. Al montar, consulta las fechas vigentes y solo habilita **Enviar correo de inicio** cuando encuentra un elemento de tipo `MATRICULA`.
- La acción pide confirmación incluyendo `periodo.anioPeriodo`, se bloquea durante el envío y presenta mensajes de éxito o error accesibles. Si no existe fecha vigente, permanece deshabilitada y explica la causa.
- Se usan tokens semánticos del tema y un layout adaptable; no se agregaron colores fijos, paquetes, variables de entorno, schemas, seeds ni datasets.

## Paths, contratos y salida esperada
- Servicio y DTO: `src/modules/matricula/services/matriculaAcademicaService.ts`; orquestación: `src/pages/Matricula/MatriculaPage.tsx`; presentación: `src/pages/Matricula/MatriculaPage.css`.
- Verificación: `GET /sapp/periodoAcademicoFecha/vigente` -> `ApiResponse<PeriodoAcademicoMatriculaVigenteDto[]>`. El frontend selecciona el primer registro cuyo `tipoTramite.nombre`, normalizado, sea `MATRICULA`; el ejemplo vigente usa `periodo.id=2`, `anioPeriodo="2026 - 2"`, `fechaInicio="2026-07-18"` y `fechaFin="2026-12-18"`.
- Envío: `POST /sapp/matriculaAcademica/notificarAperturaMatricula?periodoId={periodo.id}`, sin body. Acepta envelope `ApiResponse<unknown>` o HTTP 204; se muestra `message` cuando está disponible.
- Con `VITE_API_URL=/api/sapp`, el cliente normaliza esas rutas a `/api/sapp/periodoAcademicoFecha/vigente` y `/api/sapp/matriculaAcademica/notificarAperturaMatricula?periodoId={id}`, sin duplicar `sapp`.

## Retos y próximos pasos
1. Validar con sesión institucional de coordinación que el endpoint vigente retorna la fecha de matrícula y que `periodo.id` es el identificador esperado por la notificación.
2. Confirmar con backend la audiencia del correo y su idempotencia ante un segundo envío; la interfaz evita dobles clics concurrentes, pero permite una nueva ejecución posterior.
3. Revisar visualmente la tarjeta en escritorio/móvil y temas claro/oscuro con datos reales.

## Entorno y verificaciones
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Versiones exactas y comandos de arranque permanecen documentados en `README.md`; no hay script `test` configurado.
- `npx eslint src/pages/Matricula/MatriculaPage.tsx src/modules/matricula/services/matriculaAcademicaService.ts` (2026-09-09): PASS; npm mostró solo el warning ambiental conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-09-09): PASS antes de actualizar esta bitácora.
- `npm run build` (2026-09-09): PASS; TypeScript y rolldown-vite transformaron 253 módulos y generaron `dist/assets/index-CCv-vI1Q.css` e `index-CatGG6Ho.js`. Persiste el warning no bloqueante por el chunk JavaScript de 530.68 kB.
- `npm run lint` (2026-09-09): FAIL por los 9 errores y 1 warning preexistentes en servicios API, admisiones, documentos y solicitudes; el lint focalizado de los dos archivos TypeScript modificados sí pasa.
- No se tomó captura: el contenedor no tiene Chromium, Chrome ni Firefox en `PATH`; además, la ruta protegida y su estado vigente requieren sesión institucional y backend.

---

# Update 2026-09-09 — Cambio de estado en el detalle de estudiantes

## Estado actual y decisión
- El detalle `/coordinacion/estudiantes/:estudianteId` muestra acciones junto al estado académico. Para `ACTIVO` ofrece **Inactivar estudiante**; para `INACTIVO`, **Activar estudiante**; y en ambos casos ofrece **Marcar como egresado**. En `EGRESADO` no se muestran transiciones adicionales para evitar revertir un estado académico final sin una regla explícita.
- Durante el `PUT` se bloquean las acciones y se muestra **Actualizando...**. Al confirmar el backend, React actualiza la insignia local, presenta un mensaje accesible y limpia el caché del listado. Un error conserva el estado anterior y se presenta con `role="alert"`.

## Paths, contrato y salida esperada
- Servicio y DTO de estado: `src/modules/estudiantes/services/estudiantesMockService.ts`.
- Orquestación y presentación: `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`; estilos de botones pill, foco, estados y adaptación móvil en su CSS homónimo.
- Contrato: `PUT /sapp/estudiantes/{estudianteId}/estado`, body JSON `{ "estado": "ACTIVO" | "INACTIVO" | "EGRESADO" }`. Con `VITE_API_URL=/api/sapp`, la normalización del cliente produce `/api/sapp/estudiantes/{id}/estado` sin duplicar el segmento `sapp`.
- No se modificaron schemas, seeds, datasets, dependencias ni variables de entorno. La salida esperada es que la insignia cambie solo después de una respuesta HTTP exitosa y que el listado vuelva a solicitar datos al regresar.

## Entorno, validación pendiente y próximos pasos
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry ni otro árbol npm. El proyecto usa exclusivamente Node.js/npm y conserva sus versiones exactas en `package-lock.json` y `README.md`.
- Validar con una sesión institucional de coordinación los tres payloads contra estudiantes reales, en particular el ID de referencia `15`, y confirmar si el backend asigna automáticamente `fechaEgreso` al marcar `EGRESADO`.
- `npx eslint src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx src/modules/estudiantes/services/estudiantesMockService.ts`: PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; TypeScript y rolldown-vite transformaron 253 módulos y generaron `dist/assets/index-CV5t7kwZ.css` e `index-Bk_xb6z-.js`. Persiste el warning informativo por el chunk JavaScript de 528.04 kB. `git diff --check`: PASS.
- No se tomó captura: el contenedor no tiene Chromium, Chrome ni Firefox en `PATH`, y la ruta protegida además requiere una sesión institucional y datos del backend.

---

# Update 2026-09-09 — Auditoría transversal de títulos y subtítulos

## Estado actual y decisión
- Se revisaron los encabezados semánticos y selectores de título/subtítulo de `src/pages`, `src/modules` y `src/components`. La fuente de verdad está en `src/styles/globals.css`: `h1` es título de página, `h2` título de sección, `h3` título de subsección y `h4`–`h6` título interno de componente.
- Tamaño, peso, color, interlineado y espaciado de letras de los encabezados se fijan globalmente para neutralizar las antiguas diferencias de especificidad entre módulos. Las clases BEM terminadas en `__subtitle` comparten asimismo tamaño de cuerpo, peso regular, color secundario e interlineado de lectura. Los CSS locales todavía pueden controlar márgenes y layout.
- No cambiaron componentes React, rutas, contratos HTTP, schemas, paquetes, variables, seeds ni datasets. Salida esperada: dos encabezados del mismo nivel semántico tienen idéntica tipografía en cualquier módulo, en tema claro u oscuro; el color se resuelve exclusivamente mediante `--text-primary`/`--text-secondary`.

## Entorno, retos y próximos pasos
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry ni otro árbol npm. El proyecto usa Node/npm y las versiones exactas permanecen en `package-lock.json` y `README.md`.
- En cambios futuros, elegir el nivel HTML por jerarquía del contenido y no por el tamaño deseado. No agregar tamaños, pesos o colores locales a encabezados/subtítulos; añadir un rol tipográfico global solo si aparece una necesidad semántica nueva.
- Verificaciones de esta actualización: `npm run build` pasó (253 módulos; `dist/assets/index-CXzH8O0r.css` y `index-CeQ5hOEa.js`) con el warning no bloqueante del chunk de 526.97 kB; `git diff --check` pasó. `npm run lint` conserva los 9 errores y 1 warning preexistentes en servicios API, admisiones, documentos y solicitudes; no señala ninguno de los archivos funcionales de esta actualización.
- Pendiente únicamente la inspección visual con sesión institucional de todas las rutas protegidas; no se tomó captura porque el contenedor no tiene Chromium, Chrome ni Firefox en `PATH`.

---

# Update 2026-09-09 — Filtro de estados disponible en Solicitudes

## Estado actual y decisión
- En `/solicitudes`, tanto la vista de estudiante como la vista de coordinación entregan a `SolicitudesFiltersBar` únicamente los estados presentes en el listado correspondiente. La opción general **Todos** permanece disponible.
- `getEstadosPresentesEnSolicitudes` centraliza el cruce entre resultados y catálogo, acepta `estadoId` cuando viene en el DTO y usa como respaldo la sigla normalizada. Así se toleran las variantes existentes (`REGISTRADA`, `EN ESTUDIO`, etc.) sin inventar estados.
- Al seleccionar un tipo de solicitud, las opciones de estado se recalculan con las solicitudes de ese tipo. En coordinación se consulta el backend solo por tipo y se filtra el estado localmente; esto evita que una consulta ya filtrada por estado reduzca artificialmente el selector a una sola opción.

## Paths, contratos y salida esperada
- Utilidad: `src/modules/solicitudes/utils/estadoSolicitud.ts`.
- Consumidores: `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx` y `src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx`.
- Componente presentacional sin cambios: `src/modules/solicitudes/components/SolicitudesFiltersBar/SolicitudesFiltersBar.tsx`.
- Contratos HTTP existentes: coordinación usa `GET /sapp/solicitudesAcademicas?tipoSolicitudId={id}` (o sin query para todos); estudiante usa `GET /sapp/solicitudesAcademicas/estudiante?estudianteId={id}`. No hubo cambios de backend, schemas, seeds, datasets ni variables de entorno.
- Salida esperada: cada opción de **Estado** distinta de **Todos** representa al menos una solicitud del listado actual (y del tipo seleccionado, si aplica). Un estado del catálogo con cero resultados no debe renderizarse.

## Próximos pasos y entorno
- Validar con sesiones institucionales de estudiante y coordinación que las opciones coincidan con los datos reales, incluidas solicitudes asignadas (que continúan separadas del listado general de coordinación).
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm. El proyecto usa Node/npm, con las versiones exactas registradas en `package-lock.json` y resumidas en `README.md`.
- No se añadieron paquetes ni artefactos persistentes. Verificaciones del 2026-09-09: `npx eslint src/modules/solicitudes/utils/estadoSolicitud.ts src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx` pasó; `npm run build` pasó (253 módulos, `dist/assets/index-Cab8csvh.js`) con el warning no bloqueante del chunk mayor a 500 kB; `git diff --check` pasó. npm mostró el warning ambiental conocido `Unknown env config "http-proxy"`.

---

# Update 2026-09-09 — PDF de matrícula y créditos condonables

## Estado actual y decisiones
- En `/coordinacion/reportes`, **Matrícula** ejecuta `POST /sapp/reportesMatricula/generar?actaId={number}&periodoId={number}&programaId={number}` y **Créditos condonables** ejecuta `POST /sapp/reportesCreditosCondonables/generar` con los mismos tres parámetros. No envían body.
- Ambos procesos dejaron de usar `informesMockService`: interpretan la respuesta como PDF binario, guardan el `Blob` en memoria y muestran el mismo bloque **PDF generado** con acciones **Ver** y **Descargar** que admisión.
- El servicio compartido está en `src/modules/reportes/services/reportePeriodoService.ts`; la orquestación está en `src/pages/Reportes/ReportesPage.tsx`. Se respeta el filename de `Content-Disposition`; sin ese header se construye un nombre con proceso, acta, período y programa. Un archivo vacío produce un error visible.

## Contratos, salida esperada y próximos pasos
- Entrada requerida: IDs numéricos de acta, período y programa seleccionados desde los catálogos existentes. Salida esperada de ambos endpoints: body PDF binario no vacío, `Content-Type: application/pdf` opcional y `Content-Disposition` opcional. Si el MIME no indica PDF, el frontend lo normaliza a `application/pdf` como ya hace admisión.
- No se agregaron paquetes, variables, schemas, seeds ni datasets. Los catálogos y PDFs provienen del API institucional.
- Pendiente: validar ambos endpoints con sesión institucional, incluyendo el ejemplo `actaId=2&periodoId=2&programaId=2`, la apertura en pestaña nueva, la descarga y los nombres suministrados por backend.

## Entorno y verificación
- Entorno único `/workspace/SAPP-frontend`: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. Reutilizar `node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- `npx eslint src/pages/Reportes/ReportesPage.tsx src/modules/reportes/services/reportePeriodoService.ts` (2026-09-09): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-09): PASS; TypeScript y rolldown-vite transformaron 253 módulos y generaron `dist/assets/index-D-63uBWd.css` e `index-nhiG4fGx.js`. Persiste el warning no bloqueante por el chunk JS de 525.21 kB.
- `git diff --check` (2026-09-09): PASS. No existe script `test` ni Vitest/React Testing Library en `package.json`.
- `npm run lint` (2026-09-09): FAIL por 9 errores y 1 warning preexistentes en archivos ajenos a esta actualización; el lint focalizado de los dos archivos TypeScript modificados sí pasa.
- Captura pendiente por limitación del entorno: no hay Chromium, Chrome ni Firefox instalado y la salida completa requiere una sesión institucional y los endpoints reales del backend.

---

# Update 2026-09-09 — Detalle de materias homologadas

## Estado, contrato y salida esperada
- `GET /sapp/solicitudesAcademicas/{id}` puede incluir `solicitudHomologacionesAsignaturas`, una lista cuyos elementos exponen `id`, `asignaturaOrigenId`, `asignaturaOrigenCodigo`, `asignaturaOrigenNombre`, `asignaturaDestinoId`, `asignaturaDestinoCodigo` y `asignaturaDestinoNombre`.
- Cuando `tipoSolicitudCodigo` es `HOMOLOG`, `SolicitudDetallePage` muestra esas parejas en una tabla de **Materia de origen** y **Materia de destino**, incluyendo nombre y código. Una lista ausente o vacía produce un estado vacío explícito.
- **Motivos para la solicitud del crédito condonable** solo se renderiza para `CRED_COND` y `RENOV_CRED_COND`, tanto en lectura como en edición. Al editar y seleccionar otro tipo, el payload mock recibe `motivosCreditoCondonable: []` para no conservar motivos ocultos.

## Paths y próximos pasos
- Contrato: `src/modules/solicitudes/api/types.ts`.
- Presentación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` y `src/pages/SolicitudDetalle/SolicitudDetallePage.css`.
- Validar con una sesión institucional el caso de referencia `GET /sapp/solicitudesAcademicas/61`, además de solicitudes reales de ambos códigos de crédito. Revisar la tabla en escritorio/móvil y temas claro/oscuro.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. No existen seeds ni datasets locales para este flujo.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx src/modules/solicitudes/api/types.ts`: PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; 253 módulos transformados y artefactos `dist/assets/index-D9TbtAAh.css` e `index-Cnzgyi_S.js`. Persiste el warning informativo por el chunk JavaScript de 526.42 kB.
- `git diff --check`: PASS.
- `npm run lint`: FAIL por 9 errores y 1 warning históricos fuera de los archivos de este cambio (`src/api/*Service.ts`, admisiones, documentos, `SolicitudDocumentosEditor` y `src/modules/solicitudes/types.ts`). El lint focalizado de los archivos TypeScript modificados sí pasa.
- Captura pendiente: la ruta requiere autenticación y datos del backend institucional; el contenedor tampoco dispone de un navegador compatible instalado.

---

# Update 2026-09-08 - PDF binario en Informes a dependencias

## Estado actual y decision
- En `/coordinacion/reportes`, el proceso **Admision** ahora genera el informe con `POST /sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}` sin body y mapea la respuesta como archivo binario, no como `ApiResponse` JSON. El caso reportado por usuario fue `actaId=2` y `convocatoriaId=68`, cuyo body empieza con `%PDF-1.4`.
- La pantalla guarda el resultado en memoria como `Blob` (`ReporteAdmisionGenerado`) y, debajo del boton **Generar informe**, muestra un bloque **PDF generado** con icono PDF, nombre de archivo, fecha en zona `America/Bogota` y botones estandarizados **Ver**/**Descargar** usando `.sapp-document-action`.
- Si el backend envia `Content-Disposition`, se respeta su filename. Si no, el fallback es `informe-admision-acta-{actaId}-convocatoria-{convocatoriaId}.pdf`. Si `Content-Type` no contiene `pdf`, el frontend fuerza el MIME del `Blob` a `application/pdf` porque el contenido esperado es el PDF crudo.
- Esta nota describe la primera integración de admisión. Desde 2026-09-09, matrícula y créditos condonables también usan sus endpoints binarios reales, documentados en la actualización superior.

## Paths, contratos y salida esperada
- Transporte binario generico: `src/shared/http/httpClient.ts`, nuevos `httpFile` y `httpPostFile`. Conservan autenticacion, normalizacion de rutas `/sapp`/`/api/sapp`, manejo 401/403 y parsing de errores no exitosos.
- Utilidades de archivo: `src/shared/files/base64FileUtils.ts`, nuevos `openBlobInNewTab` y `downloadBlobFile`; las funciones base64 existentes quedaron delegando en estas.
- Servicio de admision: `src/modules/reportes/services/reporteAdmisionService.ts`.
- UI y estilos: `src/pages/Reportes/ReportesPage.tsx` y `src/pages/Reportes/ReportesPage.css`.
- Contrato esperado: `POST ${VITE_API_URL || '/api/sapp'}/reportesAdmision/generar?actaId={number}&convocatoriaId={number}` -> body binario PDF (`%PDF-1.4...`), opcional `Content-Type: application/pdf`, opcional `Content-Disposition: attachment; filename="..."`.

## Retos y proximos pasos
1. Validar con sesion institucional real que `actaId=2&convocatoriaId=68` abre y descarga un PDF legible desde los botones nuevos.
2. Confirmar si backend puede enviar siempre `Content-Type: application/pdf` y `Content-Disposition` con nombre institucional; el frontend ya tolera que falten.
3. Cuando existan endpoints reales de matricula y creditos, repetir el patron binario si tambien devuelven PDF crudo.

## Entorno y resultados
- Raiz unica: `/workspace/SAPP-frontend` en el contenedor, equivalente al workspace Windows `D:\Users\david\Desktop\SAPP\react - curso\clase 1\SAPP-frontend`. Reutilizar Node.js/npm y `node_modules`; no crear venv, conda, poetry, entornos Python ni otro arbol npm.
- Versiones relevantes: Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0. No se agregaron dependencias, variables de entorno, seeds ni datasets.
- `npm run build` (2026-09-08): PASS; TypeScript y rolldown-vite transformaron 251 modulos y generaron `dist/assets/index-BooR2Eh6.css` e `index-Bp5SJfzo.js`. Warnings no bloqueantes: configs npm `msvs_version`/`python` y chunk JS mayor a 500 kB.
- `npm run dev -- --host 127.0.0.1` (2026-09-08): el intento sandbox fallo con `spawn EPERM`; reintentado con permisos elevados quedo activo en `http://127.0.0.1:5173/`.
- Validacion funcional con backend real pendiente por requerir sesion institucional y acceso al gateway desde navegador autenticado.

---

# Update 2026-09-08 - Logo EISI PNG

## Estado actual y decision
- El asset EISI activo cambio de `public/brand/eisi-favicon.svg` a `public/brand/eisi imagen.png`. En codigo se usa la ruta web exacta `/brand/eisi%20imagen.png` para respetar el espacio del nombre sin renombrar, recrear, convertir ni sobrescribir el PNG.
- Lugares actualizados: favicon en `index.html` con `type="image/png"`, marca del sidebar en `src/components/Sidebar/Sidebar.tsx` y logo EISI del encabezado compartido en `src/components/ModuleLayout/ModuleLayout.tsx`.
- El sidebar conserva `object-fit: contain` y `border-radius: 9px`. El encabezado agrega la clase especifica `module-layout__institutional-logo--eisi` con `border-radius: 12%`; el logo UIS mantiene solo `module-layout__institutional-logo`, por lo que no recibe ese radio.

## Paths, contratos y salida esperada
- Asset usado: `public/brand/eisi imagen.png`; ruta publica esperada: `GET /brand/eisi%20imagen.png`.
- Implementacion: `index.html`, `src/components/Sidebar/Sidebar.tsx`, `src/components/ModuleLayout/ModuleLayout.tsx` y `src/components/ModuleLayout/ModuleLayout.css`.
- No cambiaron navegacion, roles, permisos, autenticacion, contratos HTTP, variables de entorno, seeds ni datasets. Reutilizar el entorno npm del repo; no crear venv, conda, poetry ni otro arbol npm.

## Verificaciones de esta actualizacion
- `npx eslint src/components/ModuleLayout/ModuleLayout.tsx src/components/Sidebar/Sidebar.tsx` (2026-09-08): PASS; npm mostro solo warnings de configuracion local `msvs_version`/`python`.
- `npm run build` (2026-09-08): PASS; TypeScript y rolldown-vite transformaron 251 modulos y generaron `dist/assets/index-DT-ZNTNe.css` e `index-CH5XerqE.js`. Persiste el warning no bloqueante del chunk JS de 520.64 kB.
- `git diff --check` (2026-09-08): PASS; Git mostro avisos de normalizacion LF -> CRLF, sin errores de whitespace.
- `rg -n "eisi-favicon\\.svg" index.html src` (2026-09-08): PASS; exit code 1 sin salida, es decir, cero referencias activas al SVG antiguo en `index.html` o `src`.
- Captura visual: no realizada porque `where.exe chrome`, `where.exe msedge` y `where.exe chromium` no encontraron navegador en `PATH`, y `node_modules` no contiene Playwright ni Puppeteer.

---

# Update 2026-09-08 — Iconos Lucide restantes del sidebar

## Estado actual y decisión
- El sidebar importa `GraduationCap`, `UsersRound`, `ScrollText`, `CalendarDays` y `LogOut` desde `lucide-react` y los asigna, respectivamente, a **Matrícula**, **Estudiantes**, **Actas**, **Fechas** y **Cerrar sesión**. Ya no renderiza emoji para estas cinco opciones.
- Los componentes reutilizan `.sidebar__module-icon` (20 × 20 px y `currentColor`) dentro del contenedor `.sidebar__icon`; por ello conservan alineación, separación, color heredado y estados normal, hover y seleccionado. No se tocaron los iconos de Solicitudes, Admisiones e Informes a dependencias, ni la marca Minerva.
- `src/app/navigationItems.ts` conserva los pictogramas usados por la pantalla Inicio: esta decisión limita el cambio solicitado al menú lateral y mantiene intacta la fuente compartida de etiquetas, rutas, permisos y orden.

## Entorno, paths y próximos pasos
- Implementación: `src/components/Sidebar/Sidebar.tsx`; tamaño y herencia visual existentes: `src/components/Sidebar/Sidebar.css`; dependencia local: `vendor/lucide-react`; registro reproducible: `package.json` y `package-lock.json`.
- El registro npm respondió HTTP 403 al intentar instalar el paquete remoto. Se añadió una distribución local mínima `lucide-react@0.468.0-local`, con los cinco componentes y trazos Lucide requeridos. Reutilizar `/workspace/SAPP-frontend/node_modules`; ejecutar `npm ci` desde esta raíz y no crear otro árbol npm, venv, conda o poetry.
- No hay endpoints, schemas, contratos HTTP, variables de entorno, seeds ni datasets nuevos. La salida esperada son SVG monocromáticos de contorno, 20 px, en las cinco opciones indicadas.
- Pendiente: validar visualmente con una sesión institucional el sidebar contraído/expandido, móvil y temas claro/oscuro. El contenedor no dispone de navegador compatible, por lo que no se pudo generar captura.

## Resultados de esta actualización
- `npm ci` (2026-09-08): PASS; instaló 219 paquetes desde el lockfile y enlazó la dependencia local sin consultar el paquete remoto.
- `npx eslint src/components/Sidebar/Sidebar.tsx vendor/lucide-react/index.js` (2026-09-08): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-08): PASS; TypeScript y Vite transformaron 251 módulos y generaron `dist/assets/index-D61X9_eD.css` e `index-DYW2QVif.js`. Persiste el warning no bloqueante por el chunk JS de 520.60 kB.
- `if rg -n '🎓|👥|📜|🗓️|🚪' src/components/Sidebar/Sidebar.tsx; then exit 1; fi` (2026-09-08): PASS; ninguno de los cinco emoji permanece en el sidebar.
- `git diff --check` (2026-09-08): PASS.

---

# Update 2026-09-08 — Iconos de contorno en tres módulos del sidebar

## Estado actual y decisión
- `src/components/Sidebar/Sidebar.tsx` continúa construyendo el menú a partir de `getPrimaryNavigationItems(roles)`. Solo al renderizar las rutas `/solicitudes`, `/admisiones` y `/coordinacion/reportes` sustituye sus emoji por los SVG monocromáticos `ClipboardList`, `FileUser` y `FolderOpen`, respectivamente.
- Los trazos basados en Lucide están encapsulados en `src/components/Sidebar/SidebarModuleIcon.tsx`; usan `currentColor`, contorno de 2 px y caja uniforme de 20 × 20 px definida en `Sidebar.css`. Así heredan el color del enlace normal/seleccionado sin alterar espaciado o alineación.
- No cambiaron textos, rutas, permisos, orden, selección ni los iconos de los otros módulos. La pantalla Inicio también conserva deliberadamente sus iconos actuales, pues la solicitud se limitó al menú lateral.

## Entorno, artefactos y próximos pasos
- `lucide-react` no existía en el proyecto y `npm install lucide-react` devolvió HTTP 403 por política del registro. Para conservar un build reproducible se copiaron únicamente los trazos SVG públicos de los tres iconos requeridos y no se modificaron `package.json` ni `package-lock.json`.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. No hay nuevos endpoints, schemas, variables, seeds, datasets ni artefactos persistentes.
- Pendiente: validar visualmente con una sesión institucional los temas claro/oscuro, el estado seleccionado, el sidebar contraído/expandido y móvil. El contenedor no dispone de Chromium, Chrome ni Firefox y las rutas requieren autenticación, por lo que no se generó captura.

## Resultados de esta actualización
- `npx eslint src/components/Sidebar/Sidebar.tsx src/components/Sidebar/SidebarModuleIcon.tsx` (2026-09-08): PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-08): PASS; TypeScript y Vite transformaron 250 módulos y generaron `dist/assets/index-D61X9_eD.css` e `index-zF9B5YXD.js`. Persiste el warning no bloqueante por el chunk JS de 518.83 kB.
- `git diff --check` (2026-09-08): PASS.

---

# Update 2026-09-08 — Navegación consistente e Informes a dependencias

## Estado actual y decisión
- El sidebar y la pantalla de inicio consumen `getPrimaryNavigationItems(roles)`, por lo que presentan exactamente los mismos módulos autorizados, etiquetas e iconos. Inicio ahora incluye **Informes a dependencias** y **Actas** para coordinación/administración; continúa respetando la visibilidad anterior por rol.
- Los iconos se ajustaron por semántica: solicitudes recibidas (`📨`), matrícula/grado (`🎓`), comunidad estudiantil (`👥`), aspirantes (`🧑‍🎓`), dependencias institucionales (`🏛️`), actas (`📜`) y calendario de fechas (`🗓️`).
- El nombre visible del antiguo módulo **Reportes** es ahora **Informes a dependencias** tanto en navegación como en su `ModuleLayout`. Se conservan deliberadamente la ruta `/coordinacion/reportes`, el componente `ReportesPage` y `src/modules/reportes` para no romper enlaces ni identificadores técnicos.

## Paths, contratos y salida esperada
- Fuente canónica: `src/app/navigationItems.ts`; consumidores: `src/components/Sidebar/Sidebar.tsx` y `src/pages/Home/HomePage.tsx`; título del módulo: `src/pages/Reportes/ReportesPage.tsx`.
- `getPrimaryNavigationItems(roles: string[])` devuelve objetos `{ to, label, icon }` ya filtrados. Coordinación/administración reciben los siete accesos; otros roles reciben el subconjunto permitido. Cualquier módulo primario futuro debe agregarse en esta fuente compartida, no por separado en Sidebar/Home.
- No cambiaron APIs, schemas, autenticación, rutas, dependencias, variables de entorno, seeds ni datasets. Los datos continúan llegando del gateway/API institucional.

## Retos y próximos pasos
1. Validar con sesiones reales de coordinación, administración, secretaría, profesor y estudiante que sidebar e inicio contienen el mismo subconjunto y que todas las tarjetas navegan correctamente.
2. Revisar los emoji en los sistemas operativos objetivo, ya que su representación depende de la fuente/plataforma; si producto requiere trazo idéntico, migrar en conjunto a un set SVG accesible.
3. Validar visualmente temas claro/oscuro y móvil. No se generó captura en el contenedor porque no hay Chromium, Chrome ni Firefox instalado y la aplicación requiere sesión institucional.

## Entorno y resultados
- Entorno único `/workspace/SAPP-frontend`: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2 y ESLint 9.39.2. Reutilizar `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm.
- `npx eslint src/app/navigationItems.ts src/components/Sidebar/Sidebar.tsx src/pages/Home/HomePage.tsx src/pages/Reportes/ReportesPage.tsx` (2026-09-08): PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-08): PASS; 248 módulos transformados y artefactos `dist/assets/index-16Ne2VSA.css` e `index-DrB_Pgx_.js`. Persiste el warning no bloqueante del chunk JavaScript de 517.25 kB.
- `npm run lint` global (2026-09-08): FAIL por 9 errores y 1 warning preexistentes en archivos ajenos a esta actualización; el lint focalizado de los cuatro archivos TypeScript modificados sí pasa.
- `git diff --check` (2026-09-08): PASS.

---

# Update 2026-09-07 — Marca EISI en el sidebar

## Estado actual y decisión
- El enlace de inicio del sidebar usa `/brand/eisi-favicon.svg` como marca visible en estado contraído y expandido. Al expandirse por hover/foco muestra el título exacto **Minerva | Posgrados**; en el layout móvil se ven permanentemente el logo y el título.
- El SVG es decorativo dentro del enlace (`alt=""` y `aria-hidden="true"`), porque el destino ya cuenta con el nombre accesible **Ir al inicio**. No cambiaron navegación, permisos, contratos HTTP ni estado de sesión.

## Paths, salida esperada y próximos pasos
- Renderizado: `src/components/Sidebar/Sidebar.tsx`; dimensiones, espaciado y comportamiento responsive: `src/components/Sidebar/Sidebar.css`; asset reutilizado: `public/brand/eisi-favicon.svg`.
- Salida esperada: logo EISI de 38 × 38 px siempre visible; texto oculto con el sidebar contraído y visible al expandirlo; logo y texto visibles en viewports de hasta 900 px.
- Validar con sesión institucional los estados claro/oscuro, hover, navegación por teclado y presentación móvil. No se agregaron dependencias, variables, schemas, seeds ni datasets.
- Entorno único: reutilizar `/workspace/SAPP-frontend/node_modules` con Node.js 24.15.0 y npm 11.4.2; no crear venv, conda, poetry, entornos Python ni otro árbol npm.

## Verificación de esta actualización
- `npx eslint src/components/Sidebar/Sidebar.tsx` (2026-09-07): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-07): PASS; TypeScript y rolldown-vite transformaron 247 módulos y generaron `dist/assets/index-16Ne2VSA.css` e `index-Wumom0Ey.js`. Persiste el warning informativo por el chunk JS de 517.80 kB.
- `git diff --check` (2026-09-07): PASS.
- Captura pendiente por limitación del entorno: no hay Chromium, Chrome ni Firefox instalados. La revisión visual debe realizarse en una sesión institucional, sin modificar el flujo de autenticación.

---

# Update 2026-09-07 — Contrato vigente del PUT de períodos académicos

## Estado actual y decisión
- La ruta protegida `/fechas/periodos?periodoId={id}` obtiene el identificador del período desde `GET /sapp/periodoAcademico/withFechas` y lo usa únicamente como parámetro de ruta.
- La creación no cambió: ejecuta `POST /sapp/periodoAcademico` y omite identificadores. La edición ejecuta una sola solicitud `PUT /sapp/periodoAcademico/{id}`; ya no encadena el PUT parcial del período con un POST independiente a `/sapp/periodoAcademicoFecha`.
- De acuerdo con el contrato vigente del backend, el body de edición no incluye el id del período, el id de la fecha, `anio` ni `periodo`. La descripción del período se genera como `Periodo {anio}-{periodo}` y la descripción capturada se conserva en la fecha de matrícula.

## Paths, contrato y salida esperada
- Formulario/orquestación: `src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx`.
- Tipos del contrato: `src/modules/configFechas/api/types.ts`; transporte: `src/modules/configFechas/api/periodoAcademicoService.ts`; tipo de trámite: `src/modules/configFechas/constants.ts`.
- Body exacto de edición: `{ fechaInicio, fechaFin, descripcion, fechas: [{ tipoTramiteId, fechaInicio, fechaFin, descripcion }] }`. El id aparece únicamente en `/sapp/periodoAcademico/{id}`; se espera una respuesta exitosa bajo el envelope `ApiResponse<null>`.
- No se agregaron dependencias, variables de entorno, seeds, datasets ni cambios visuales. Los datos reales continúan viniendo del API institucional.

## Retos y próximos pasos
1. Confirmar contra el backend desplegado que `PUT /sapp/periodoAcademico/{id}` acepta el DTO integral y persiste período y fechas de manera transaccional.
2. Validar en Network con un período real que ningún identificador, `anio` ni `periodo` aparezca en el body, y que no se emita ningún POST a `periodoAcademicoFecha` al editar.
3. Agregar una prueba del servicio/formulario cuando el repositorio incorpore Vitest/React Testing Library; `package.json` todavía no define un script `test`.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `/workspace/SAPP-frontend/node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npx eslint src/modules/configFechas/api/types.ts src/modules/configFechas/api/periodoAcademicoService.ts src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx` (2026-09-07): PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-07): PASS; TypeScript y rolldown-vite transformaron 247 módulos y generaron `dist/assets/index-snGL7imV.js`. Persiste el warning no bloqueante del chunk JavaScript de 515.68 kB.
- `git diff --check` (2026-09-07): PASS.
- No se tomó captura porque el cambio afecta únicamente el método y body HTTP, no la presentación visible; la comprobación funcional completa requiere sesión y backend institucionales.

---
# Update 2026-09-07 — Homologación con materias externas

## Estado actual y contrato
- El formulario de solicitud de homologación carga en paralelo el catálogo destino del programa (`GET /sapp/asignaturas?programaId=1`) y las materias origen registradas (`GET /sapp/homologaciones/asignaturas-externas/activas`). La respuesta de materias externas esperada es `{ ok, message, data: [{ id, codigo, nombre, activo }] }`.
- Cada fila permite elegir **Del listado** o **No la encuentro**. En el primer caso el POST contiene `{ asignatura_origen_id, asignatura_destino_id }`; en el segundo contiene `{ nombreAsignaturaExterna, codigoAsignaturaExterna?, asignatura_destino_id }`. El nombre manual y el destino siempre son obligatorios; el código manual es opcional.
- El arreglo se envía como `solicitudHomologacionesAsignaturas` a `POST /sapp/solicitudesAcademicas`. No se envían simultáneamente el ID de origen y los datos manuales. Se eliminó la creación mock de materias.
- Paths principales: `src/modules/solicitudes/api/{asignaturasService.ts,types.ts}` y `src/modules/solicitudes/components/SolicitudEstudianteForm/{SolicitudEstudianteForm.tsx,SolicitudEstudianteForm.css}`.

## Retos y próximos pasos
1. Confirmar con backend si el programa debe resolverse desde la sesión en lugar de conservar el `programaId=1` preexistente.
2. Validar con una sesión de estudiante ambos payloads contra el backend y comprobar nombres/códigos nulos en el desplegable.
3. Agregar pruebas de componente cuando el repositorio incorpore Vitest/Testing Library; actualmente no hay script de tests ni esas dependencias.

## Entorno y resultados
- Entorno único `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; no crear venv, conda, poetry ni otro árbol npm. No hay seeds o datasets locales: los catálogos provienen del API.
- `npm run build` (2026-09-07): PASS; 247 módulos transformados. Persiste el warning informativo del chunk JavaScript superior a 500 kB.
- `npx eslint src/modules/solicitudes/api/asignaturasService.ts src/modules/solicitudes/api/types.ts src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx` (2026-09-07): PASS; solo apareció el warning conocido de npm sobre `http-proxy`.
- `npm run lint` global (2026-09-07): FAIL por 9 errores y 1 warning preexistentes en archivos ajenos a este cambio.
- `git diff --check` (2026-09-07): PASS.
- Captura pendiente: la ruta requiere autenticación institucional y datos del backend, y este contenedor no dispone de navegador instalado.

---

# Update 2026-09-04 — Estados visuales de convocatorias abiertas y cerradas

## Estado actual y decisión
- En `/admisiones`, el bloque destacado de cada programa comunica la vigencia mediante varias señales redundantes: borde lateral, fondo de cabecera, punto, badge con símbolo y texto explicativo. Una convocatoria abierta usa el token `--success` y anuncia **Inscripciones habilitadas**; una cerrada usa `--warning` y anuncia **Inscripciones finalizadas**.
- La acción conserva la navegación y disponibilidad existentes. Para una convocatoria abierta muestra **Entrar a la convocatoria** como botón primario; para una cerrada muestra **Consultar convocatoria** con tratamiento secundario de advertencia. No se alteró la selección de convocatoria destacada ni el acceso a convocatorias anteriores.
- Los estilos usan exclusivamente tokens semánticos y `color-mix`, por lo que son compatibles con `body.light` y `body.dark`. La semántica no depende solo del color: incluye `ABIERTA`/`CERRADA`, símbolos y una descripción textual.

## Paths, contratos y salida esperada
- Renderizado y semántica accesible: `src/pages/AdmisionesHome/AdmisionesHomePage.tsx`.
- Estados visuales y comportamiento responsive: `src/pages/AdmisionesHome/AdmisionesHomePage.css`.
- Fuente de datos sin cambios: `GET /sapp/convocatoriaAdmision`, proyectado como `ConvocatoriaAdmisionDto`; la vigencia continúa resolviéndose con `isConvocatoriaVigente`.
- No cambiaron endpoints, schemas, dependencias, variables de entorno, seeds ni datasets. Los datos reales siguen viniendo del API institucional.

## Retos y próximos pasos
1. Validar en el despliegue protegido una convocatoria abierta y otra cerrada, en temas claro y oscuro y en viewport móvil.
2. Confirmar con producto si una convocatoria cerrada debe seguir siendo consultable; esta actualización conserva deliberadamente la navegación previa y solo cambia su etiqueta/jerarquía visual.
3. Incorporar una prueba de componente para las variantes cuando el repositorio adopte Vitest/React Testing Library; `package.json` no define un script `test`.

## Entorno y resultados de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `/workspace/SAPP-frontend/node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npx eslint src/pages/AdmisionesHome/AdmisionesHomePage.tsx` (2026-09-04): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-04): PASS; 248 módulos transformados y artefactos `dist/assets/index-DCoFCRQE.css` e `index-CJr8Y3m9.js`. Persiste el warning no bloqueante del chunk JavaScript de 515.92 kB.
- `git diff --check` (2026-09-04): PASS.
- Captura pendiente por limitación del entorno: no hay Chromium, Chrome ni Firefox instalados y la ruta requiere una sesión/backend institucionales para reproducir las convocatorias de la referencia.

---

# Update 2026-09-04 — Acciones documentales Ver/Descargar estandarizadas

## Estado actual y decisión
- Los botones **Ver/Abrir** y **Descargar** de los listados de actas, inscripción documental, matrícula, detalle estudiantil, documentos de solicitudes y evaluación de admisión usan la utilidad global `sapp-document-action`.
- La utilidad reproduce el patrón visual aprobado en Actas: borde y texto `--primary`, fondo transparente, radio pill, peso tipográfico fuerte y estados hover/foco/disabled basados en tokens semánticos. Las reglas globales tienen prioridad intencional sobre skins locales heredados.
- El cambio es exclusivamente presentacional: no se alteraron callbacks, condiciones `disabled`, permisos, carga/descarga base64, nombres de archivo, contratos HTTP ni modelos TypeScript.

## Paths, artefactos y salida esperada
- Estilo canónico: `src/styles/globals.css`, clase `.sapp-document-action`.
- Consumidores actualizados: `src/pages/Actas`, `src/pages/InscripcionDocumentos`, `src/pages/MatriculaDetalleCoordinacion`, `src/pages/EstudianteDetalleCoordinacion`, `src/modules/matricula/components/DocumentosRequeridosTable`, `src/modules/solicitudes/components/DocumentosAdjuntos`, `src/modules/solicitudes/components/SolicitudDocumentosEditor` y `src/modules/admisiones/pages/EvaluacionEtapaPage`.
- Salida esperada: todas esas acciones se ven como botones secundarios pill con contorno institucional en temas claro y oscuro; cada acción continúa ejecutando exactamente su handler previo.
- No hay nuevos paquetes, schemas, endpoints, variables, seeds, datasets ni artefactos persistentes.

## Retos y próximos pasos
1. Validar visualmente las rutas protegidas con sesiones reales de estudiante, coordinación y evaluador, especialmente estados deshabilitados y textos transitorios `Abriendo...`/`Descargando...`.
2. Si aparecen nuevos listados documentales, aplicar `sapp-document-action` solo a las acciones de apertura/descarga; no usarla para acciones destructivas, carga, aprobación o rechazo.
3. El repositorio no incorpora Vitest/React Testing Library ni un script `test`; cuando se agreguen, cubrir que las condiciones y callbacks de estas acciones permanezcan sin cambios.

## Entorno y resultados de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Entorno observado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2 y ESLint 9.39.2.
- `npm run build` (2026-09-04): PASS; 248 módulos transformados. Persiste el warning no bloqueante del chunk JavaScript de 515.36 kB.
- `npm run lint` (2026-09-04): FAIL por 9 errores y 1 warning preexistentes fuera del alcance visual (servicios con `any`, efecto de guard, mocks/utilidades sin uso y tipos vacíos, entre otros).
- Captura pendiente: las pantallas afectadas son protegidas y el contenedor no dispone de sesión ni backend institucional para presentar listados documentales reales sin alterar el flujo de autenticación.

---

# Update 2026-09-04 — Período actual en matrículas y marca lateral simplificada

## Estado actual y decisiones
- En el listado de coordinación de `/matricula`, tras recibir `GET /sapp/matriculaAcademica`, el filtro **Periodo** busca entre los valores realmente devueltos el año y semestre actuales. La fecha se calcula en `America/Bogota`: enero–junio corresponde al semestre `1` y julio–diciembre al `2`. Si el período actual no tiene registros, el fallback deliberado es **TODOS**, evitando un `select` con un valor inexistente.
- El sidebar contraído ya no muestra el círculo con la letra **M**. La marca queda vacía en ese estado y muestra **Minerva** al expandirse mediante hover/foco; en la presentación móvil permanece visible.

## Paths, contratos y salida esperada
- Selección del período: `src/pages/Matricula/MatriculaPage.tsx`; reutiliza `parsePeriodo` y no cambia el contrato `MatriculaAcademicaListadoDto` ni el endpoint existente.
- Marca: `src/components/Sidebar/Sidebar.tsx` y `src/components/Sidebar/Sidebar.css`; no se agregaron assets.
- No cambiaron dependencias, variables de entorno, schemas, seeds ni datasets. Los datos siguen viniendo del API institucional.

## Retos y próximos pasos
1. Validar con una sesión institucional de coordinación y registros del período actual que el selector adopte exactamente la etiqueta entregada por el backend.
2. Agregar pruebas de componente/fecha cuando el repositorio incorpore Vitest y React Testing Library; `package.json` no define actualmente un script `test`.
3. Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. El stack instalado permanece en Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.

## Verificación de esta actualización
- `npx eslint src/pages/Matricula/MatriculaPage.tsx src/components/Sidebar/Sidebar.tsx` (2026-09-04): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-04): PASS; transformó 248 módulos y generó `dist/assets/index-uxDr--ln.js`. Persiste el warning no bloqueante del chunk JavaScript de 514.90 kB.
- `git diff --check` (2026-09-04): PASS.
- No se pudo tomar captura: la ruta es protegida y el contenedor no incluye Chromium, Chrome ni Firefox para reproducir la interfaz.

---

# Update 2026-09-04 — Gestión de convocatorias integrada en Fechas

## Estado actual y decisiones
- `/fechas` ya no muestra el resumen plano de convocatorias. Ahora incluye los filtros **Período** y **Vigente**, agrupa las convocatorias por programa y ofrece las acciones **Ver inscripciones**, **Editar** y **Cerrar**.
- El botón **Crear convocatoria**, con el mismo patrón visual del botón **Crear período académico**, abre `CreateConvocatoriaModal` sin salir del módulo. La edición reutiliza `EditConvocatoriaFechasModal` y el cierre solicita confirmación antes de invocar el servicio.
- Cada sección de programa tiene paginación independiente de 4 elementos. Cambiar cualquier filtro reinicia todas las páginas de programa para evitar páginas vacías o fuera de rango.

## Paths, contratos y salida esperada
- Implementación y estilos: `src/pages/FechasModule/FechasModulePage.tsx` y `src/pages/FechasModule/FechasModulePage.css`.
- Lectura: `GET /sapp/convocatoriaAdmision`; creación y edición conservan los contratos encapsulados en los modales existentes; cierre usa `PUT /sapp/convocatoriaAdmision/cerrar/{id}` a través de `cerrarConvocatoriaAdmision`.
- Salida esperada: una tabla por programa con hasta 4 filas visibles, controles de página propios y recarga silenciosa después de crear, editar o cerrar. No se modificaron schemas del backend.

## Retos y próximos pasos
1. Validar el flujo con una sesión institucional y al menos cinco convocatorias del mismo programa, incluido el reinicio de paginación al cambiar filtros.
2. Confirmar creación, edición, cierre y navegación a inscripciones contra el backend desplegado.
3. Agregar pruebas de interacción cuando se incorpore Vitest/React Testing Library; actualmente no existe script `test`.

## Entorno, datos y resultados
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni un árbol npm adicional. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- No se agregaron dependencias, variables de entorno, seeds ni datasets; la información proviene del API institucional.
- `npm run build` (2026-09-04): PASS; transformó 246 módulos y generó `dist/assets/index-CStv-leG.js`. Persiste el warning no bloqueante por el chunk JS de 514.63 kB.
- `npx eslint src/pages/FechasModule/FechasModulePage.tsx` (2026-09-04): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-09-04): PASS.
- Captura pendiente por limitación del entorno: la ruta es protegida y requiere sesión/backend institucionales; no hay navegador instalado para una reproducción fiel.

---

# Update 2026-09-04 — Navegación y paginación de períodos académicos

## Estado actual y decisiones
- `/fechas` obtiene los períodos con sus fechas asociadas desde `GET /sapp/periodoAcademico/withFechas`. La tabla muestra período, inicio/fin del semestre e inicio/fin de matrículas; la fecha de matrícula se identifica por `tipoTramite.id === TIPO_TRAMITE_ADMISIONES` (actualmente `2`), sin asumir que sea el primer elemento del arreglo.
- El listado de períodos se pagina en cliente de a 4 registros; el listado de convocatorias conserva páginas de 8. Cada período incluye **Editar**, que navega a `/fechas/periodos?periodoId={id}`; el botón superior abre `/fechas/periodos` sin query para crear.
- `/fechas/periodos` se presenta como **Crear período académico** o **Editar período académico** según el query param. Al ser una ruta hija de `/fechas`, el `NavLink` del menú lateral mantiene seleccionado **Fechas**, en vez de activar **Admisiones**. El formulario incluye **Atrás**, que regresa explícitamente al listado `/fechas`.
- En edición se precargan todos los campos y año/semestre permanecen bloqueados para respetar la identidad del período; se eliminó el selector anterior “Gestión de periodo”.
- Al editar se ejecuta `PUT /sapp/periodoAcademico/{id}` para el rango del semestre y luego `POST /sapp/periodoAcademicoFecha` para crear/actualizar el rango de matrículas. Al crear se conserva `POST /sapp/periodoAcademico` con el arreglo `fechas` incluido.

## Paths, contratos y salida esperada
- Listado y paginación: `src/pages/FechasModule/FechasModulePage.tsx` y `.css`.
- Formulario y regreso al listado: `src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx`; registro de la ruta: `src/app/routes/index.tsx`.
- Servicios/contratos existentes: `src/modules/configFechas/api/periodoAcademicoService.ts`, `periodoAcademicoFechaService.ts`, `types.ts` y `constants.ts`.
- `withFechas` debe devolver `PeriodoAcademicoWithFechasDto[]`, cada elemento con `{ periodo, fechas }`; la UI presenta `—` cuando no existe una fecha de matrícula tipo `2`.

## Retos y próximos pasos
1. Validar con backend institucional que `POST /sapp/periodoAcademicoFecha` tenga semántica de upsert cuando ya existe la combinación período/tipo de trámite; es el contrato que utiliza la edición completa.
2. Validar visualmente creación, edición, selección persistente de **Fechas** y las páginas 1/2 con al menos cinco períodos reales. La ruta es protegida y no hay navegador instalado en este entorno.
3. Incorporar pruebas de interacción al adoptar Vitest/React Testing Library; actualmente `package.json` no define script `test`.

## Entorno, datos y resultados
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- No se agregaron dependencias, variables de entorno, seeds ni datasets; los datos provienen del API institucional.
- `npx eslint src/app/routes/index.tsx src/pages/FechasModule/FechasModulePage.tsx src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx` (2026-09-04): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-04): PASS; TypeScript y Vite transformaron 246 módulos y generaron `dist/assets/index-CD3MJ0WQ.js`. Persiste el warning no bloqueante por el chunk JS de 511.15 kB.
- `git diff --check` (2026-09-04): PASS.
- No se tomó captura: el contenedor no tiene Chromium, Chrome ni Firefox y la ruta protegida requiere sesión/backend institucionales.

---

# Update 2026-09-04 — Resolución restringida de solicitudes por coordinación

## Estado actual y decisiones
- En `/solicitudes/:solicitudId`, la acción para cambiar el estado se muestra exclusivamente si la sesión contiene el rol exacto `COORDINADOR` y el estado normalizado de la solicitud es `ENVIADA`, cuya etiqueta de catálogo es **ENVIADA A COMITE ASESOR DE POSGRADOS**. `ADMIN`, estudiantes y los demás roles no reciben estos controles por esa sola condición.
- Se eliminó el combo del catálogo y su consulta desde esta pantalla. Los únicos destinos disponibles son `APROBADA` mediante **Aprobar** y `RECHAZADA` mediante **Rechazar**. El handler vuelve a comprobar la precondición antes del PUT y bloquea ambos botones durante la operación.
- El badge de estado del bloque de detalle admite salto de línea, limita su ancho al contenedor y puede cortar cadenas excepcionalmente largas; la tarjeta/grid usa `min-width: 0` para no desbordarse.

## Paths, contrato y salida esperada
- Lógica y UI: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`; estilos: `src/pages/SolicitudDetalle/SolicitudDetallePage.css`.
- Request al decidir: `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA|RECHAZADA`, mediante `cambiarEstadoSolicitud`, seguido de `GET /sapp/solicitudesAcademicas/{solicitudId}` para refrescar el detalle.
- No cambiaron schemas, dependencias, variables de entorno, seeds ni datasets. La autorización definitiva y la validación de transiciones deben seguir aplicándose también en backend; esta actualización restringe la interfaz y su flujo de invocación.

## Retos y próximos pasos
1. Validar con sesiones institucionales `COORDINADOR` y `ADMIN`, y solicitudes en estados `ENVIADA`, `EN_REVISION`, `APROBADA` y `RECHAZADA`, que los controles solo aparezcan en la combinación autorizada.
2. Confirmar en Network que cada botón transmite su sigla correspondiente y que backend rechaza de forma independiente roles/transiciones no autorizados.
3. Agregar pruebas de componente por rol/estado cuando el repositorio incorpore Vitest y React Testing Library; `package.json` aún no define script `test`.

## Entorno y resultados de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `/workspace/SAPP-frontend/node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npm run build` (2026-09-04): PASS; 245 módulos transformados. Persiste el warning no bloqueante del chunk JavaScript de 510.69 kB.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` (2026-09-04): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-09-04): PASS.
- Captura pendiente: la ruta es protegida y este contenedor no dispone de una sesión `COORDINADOR` ni datos/backend institucionales para reproducir de forma fiel el estado requerido.

---

# Update 2026-09-03 — Reparación del build del conversor HTML a PDF

## Estado actual y decisión
- Se reparó `src/modules/solicitudes/utils/htmlToPdf.ts` después de que una integración mezclara las dos estrategias históricas de renderizado: había dos declaraciones de `loadDataImage`, `collectTextRuns`/`paintDocumentPage` quedaban sin uso y se invocaba un `loadSvgImage` inexistente.
- La implementación activa es la estrategia directa y segura acordada: el iframe recibe HTML sanitizado; las imágenes `data:` permitidas y los fragmentos de texto se recopilan desde su layout; fondos, bordes, imágenes y texto se pintan directamente en páginas canvas de tamaño Letter. No se vuelve a introducir SVG `foreignObject`, por lo que se mantiene la mitigación del canvas contaminado.
- No cambiaron la interfaz pública `htmlToPdf(html: string): Promise<Blob>`, contratos HTTP, dependencias, variables de entorno, seeds ni datasets.

## Paths, contrato y salida esperada
- Implementación corregida: `src/modules/solicitudes/utils/htmlToPdf.ts`.
- Consumidores: buscar `htmlToPdf` dentro de `src/modules/solicitudes`; reciben HTML persistido o previsualizado y esperan un `Blob` con MIME `application/pdf` para las acciones **Ver/Descargar**.
- Recursos aceptados dentro del HTML: imágenes JPEG, PNG, GIF o WebP como data URI base64 (o base64 crudo reconocido). Scripts, documentos embebidos y recursos externos se eliminan antes de montar el iframe.
- Salida: PDF 1.4 rasterizado, páginas Letter de 612 × 792 pt (canvas 816 × 1056 px), margen vertical de 72 px y cada página incluida como JPEG.

## Retos y próximos pasos
1. Validar **Ver** y **Descargar** en Chromium con una solicitud real que contenga firma, texto multilínea, bordes, fondos y más de una página; este contenedor no dispone de la sesión/backend institucional necesarios para una comprobación funcional completa.
2. Agregar pruebas DOM/browser del sanitizador, paginación y generación cuando el repositorio incorpore Vitest y un navegador de pruebas. Actualmente `package.json` no define un script `test`.
3. Vigilar conflictos futuros en este archivo: no combinar la estrategia SVG (`loadSvgImage`/`foreignObject`) con el pintado directo (`collectTextRuns`/`paintDocumentPage`).

## Entorno y resultados de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `/workspace/SAPP-frontend/node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 245 módulos y generaron `dist/assets/index-CI7kim7r.css` e `index-DLwL1ixL.js`. Persiste únicamente el warning no bloqueante del chunk JavaScript de 509.78 kB.
- `npx eslint src/modules/solicitudes/utils/htmlToPdf.ts` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-09-03): PASS.
- No se tomó captura: el arreglo no cambia la UI visible y la ruta protegida requiere datos/sesión institucionales.

---

# Update 2026-09-03 — Orden determinista y visibilidad para PROFESOR en Solicitudes

## Estado actual y decisiones
- Los listados de solicitudes de estudiante, solicitudes asignadas y solicitudes generales usan un comparador compartido: primero `fechaRegistro` descendente y, si las fechas coinciden (o ambas son inválidas), `id` descendente.
- En `/solicitudes`, una sesión con el rol exacto `PROFESOR`, sin `COORDINADOR`, `ADMIN` ni `DIRECTOR`, recibe `assignedOnly`; la vista carga y muestra únicamente `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarioSappId}`. El bloque general, sus filtros, paginación y su request a `GET /sapp/solicitudesAcademicas` quedan ocultos.
- La restricción no se extiende al alias `DOCENTE` ni a los roles elevados. Esto implementa literalmente “solo para el rol PROFESOR” y evita retirar capacidades a una sesión que además tenga coordinación, administración o dirección.

## Paths, contratos y salida esperada
- Comparador: `src/modules/solicitudes/utils/ordenSolicitudes.ts`.
- Listados: `src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx` y `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx`.
- Decisión por roles: `src/pages/Solicitudes/SolicitudesPage.tsx`; roles de entrada en `session.user.roles`, identificador del request asignado en `session.user.id`.
- Ejemplo de salida: con solicitudes `(fechaRegistro: 2026-09-03, id: 41)`, `(2026-09-03, id: 52)` y `(2026-09-02, id: 90)`, el orden es `52, 41, 90`.
- No cambiaron schemas ni endpoints HTTP, y no se agregaron paquetes, variables de entorno, seeds, datasets o artefactos persistentes.

## Retos y próximos pasos
1. Validar con una sesión institucional exclusivamente `PROFESOR` que Network no registre el request al listado general y que solo aparezcan las solicitudes devueltas por `/asignadas`.
2. Confirmar con producto si `DOCENTE` debe considerarse equivalente a `PROFESOR` para esta restricción; actualmente se excluye deliberadamente por el requisito literal.
3. Agregar pruebas unitarias del comparador y una prueba de render por roles cuando se incorpore Vitest/React Testing Library; el repositorio aún no tiene script `test`.

## Entorno y resultados de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `/workspace/SAPP-frontend/node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npx eslint src/modules/solicitudes/utils/ordenSolicitudes.ts src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx src/pages/Solicitudes/SolicitudesPage.tsx` (2026-09-03): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; 245 módulos transformados y bundle `dist/assets/index-rXNY63gu.js` generado. Persiste el warning no bloqueante del chunk JavaScript de 508.21 kB.
- `git diff --check` (2026-09-03): PASS.
- No se tomó captura: no cambió la presentación visual, y la verificación de visibilidad necesita una sesión institucional/backend.

---

# Update 2026-09-03 — Refresco de solicitud y documentos después de firmar

## Estado actual y decisión
- En `/solicitudes/:solicitudId`, una respuesta exitosa de `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` dispara nuevas consultas del detalle de la solicitud y de sus documentos adjuntos.
- La respuesta actualizada reemplaza `solicitud`, sincroniza el selector local de estado y reemplaza `documentos`; todo ocurre mediante estado React, sin `window.location.reload()` ni navegación.
- El efecto que hace la carga documental inicial ahora depende solo del id y el código del trámite. Así, guardar un nuevo objeto de solicitud con el mismo contexto no provoca una segunda consulta documental duplicada después del refresco explícito.
- Si la firma termina pero falla alguna consulta posterior, la interfaz informa que falló la actualización en pantalla en vez de afirmar incorrectamente que falló la firma.

## Paths, contratos y salida esperada
- Orquestación: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`.
- Firma: `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}`.
- Refresco de solicitud: `GET /sapp/solicitudesAcademicas/{solicitudId}` mediante `getSolicitudAcademicaById`.
- Refresco documental: `GET /sapp/document?tramiteId={id}&codigoTipoTramite={codigo}` mediante `getSolicitudDocumentosAdjuntos`; se espera el envelope `ApiResponse<DocumentChecklistItemDto[]>`, cuyos elementos cargados se proyectan a `SolicitudDocumentoAdjuntoDto`.
- Salida esperada: después de firmar, badges/estado de la solicitud y documentos visibles reflejan la respuesta del backend inmediatamente, y aparece `Todos los documentos fueron firmados y la información fue actualizada correctamente.`

## Retos y próximos pasos
1. Validar con sesión institucional y una solicitud realmente `POR FIRMA` que el backend confirme la firma antes de que ambas consultas GET devuelvan el estado persistido; si el procesamiento fuera asíncrono, acordar con backend un estado de operación o una política acotada de reintento.
2. Agregar una prueba de interacción para firma exitosa, error de firma y error de refresco cuando se incorpore Vitest/React Testing Library; actualmente no existe script `test`.
3. No crear entornos adicionales: este repositorio usa npm y el árbol existente `/workspace/SAPP-frontend/node_modules`; no usa venv, conda ni poetry. No hay seeds o datasets locales y no se agregaron paquetes.

## Entorno y pruebas de esta actualización
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y rolldown-vite transformaron 244 módulos y generaron `dist/assets/index-0aKgKXWr.js`. Persiste el warning no bloqueante del chunk JS mayor a 500 kB.
- `git diff --check` (2026-09-03): PASS.
- No se tomó captura: el cambio no altera la presentación visual y la ruta protegida requiere sesión/backend institucional.

---

# Update 2026-09-03 — Nombre de motivos en previsualización de crédito condonable

## Estado actual y decisión
- El contrato frontend de `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` cambió la propiedad genérica `motivos` por `motivosCreditoCondonable` para las solicitudes de crédito condonable que usan motivos.
- La renovación de crédito condonable (`tipoSolicitudId === 12`) no cambia: continúa enviando `actividadesCreditoCondonable` junto con sus campos adicionales.

## Paths, contrato y salida esperada
- Contrato: `src/modules/solicitudes/api/types.ts`; construcción del payload: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`; adaptación hacia el servicio HTTP: `src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx`.
- Para un crédito condonable distinto de renovación, el request esperado contiene `motivosCreditoCondonable: string[]` y no contiene `motivos`. Para el tipo 12 contiene `actividadesCreditoCondonable` y no contiene ninguna de esas dos propiedades de motivos.
- No se agregaron dependencias, variables de entorno, seeds ni datasets.

## Retos y próximos pasos
1. Validar el request con una sesión institucional y el backend para confirmar que el DTO del endpoint ya consume `motivosCreditoCondonable`.
2. Incorporar una prueba del payload cuando el proyecto agregue Vitest; actualmente no existe un script de tests.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0.
- `git diff --check`: PASS.
- `npx eslint src/modules/solicitudes/api/types.ts src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx`: PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; TypeScript y Vite transformaron 244 módulos y generaron el build. Warning no bloqueante por el chunk JS de 508.49 kB.

---

# Update 2026-09-03 — Limpieza integral al cerrar sesión

> **Histórico:** la estrategia de `POST` configurable descrita en esta sección fue reemplazada por la navegación fija `/api/auth/slo/logout` el 2026-09-09. Consultar la actualización más reciente al final del documento antes de modificar este flujo.

## Estado actual y decisión
- `AuthContext.logout()` es asíncrono: elimina inmediatamente la sesión SAPP en memoria y luego intenta `POST` al endpoint de logout del Gateway con `credentials: 'include'`, `cache: 'no-store'` y `keepalive`.
- El endpoint predeterminado es `${VITE_API_URL}/logout` (normalmente `/api/sapp/logout`) y se puede reemplazar con `VITE_LOGOUT_URL`. El Gateway debe invalidar allí la sesión servidor y cualquier cookie `HttpOnly`; JavaScript no puede borrar directamente una cookie `HttpOnly`.
- El bloque `finally` garantiza la limpieza local aunque el Gateway no responda: vacía `localStorage`, `sessionStorage`, cookies visibles en paths/dominios aplicables, Cache Storage e IndexedDB, y desregistra service workers. Repite storages/cookies al final para cubrir escrituras de requests que estuvieran en vuelo y termina con `window.location.replace('/')`.

## Paths, contrato y salida esperada
- Orquestación React: `src/context/Auth/AuthContext.tsx`; contrato `logout: () => Promise<void>` en `src/context/Auth/types.ts`.
- Invalidación remota: `src/api/authService.ts`. Request esperado: `POST VITE_LOGOUT_URL` o, si no está definido, `POST ${VITE_API_URL}/logout`, con cookies incluidas y sin body.
- Limpieza del origen: `src/modules/auth/session/clearBrowserSession.ts`. Configuración documentada en `.env.example` y `README.md`.
- Salida esperada al pulsar **Cerrar sesión**: la sesión remota queda invalidada, no quedan datos locales accesibles a la SPA y `/` no debe reconstruir al usuario anterior. No se agregaron dependencias, seeds ni datasets.

## Retos y próximos pasos
1. Confirmar con el Gateway desplegado que acepta `POST /api/sapp/logout`; si usa otra URL, definir `VITE_LOGOUT_URL`. La respuesta debería invalidar cookies `HttpOnly` y puede incluir `Clear-Site-Data` para cubrir caché HTTP administrada exclusivamente por el navegador.
2. Validar en Network que el POST incluye la cookie institucional y que la posterior llamada a `/inicio` ya no devuelve al usuario anterior.
3. Cuando se incorpore Vitest, probar cleanup con dobles de Cache Storage, IndexedDB, cookies y service workers. Actualmente no existe script `test`.

## Entorno y resultados de esta actualización
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Versiones: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npm run build` (2026-09-03): PASS; 244 módulos transformados. Persiste solo el warning no bloqueante del chunk JS de 508.06 kB.
- `npx eslint src/api/authService.ts src/context/Auth/AuthContext.tsx src/context/Auth/types.ts src/modules/auth/session/clearBrowserSession.ts` (2026-09-03): PASS; npm emitió únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-09-03): PASS.

---
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
# Update 2026-09-03 — Firma sin título para ESTUDIANTE

## Estado actual y decisiones
- En `/perfil`, cualquier sesión cuyo arreglo `user.roles` incluya `ESTUDIANTE` ve únicamente el selector y la previsualización de la firma; el campo **Título** no se renderiza ni se valida.
- Al seleccionar o reintentar una imagen con ese rol, el POST omite la propiedad `titulo` por completo. Los demás roles conservan el campo obligatorio y el contrato anterior.
- La detección para esta regla depende explícitamente del rol `ESTUDIANTE`, no de la existencia accidental de la proyección `user.estudiante`. La proyección sigue siendo un fallback independiente para mostrar el bloque de información académica.

## Paths, contratos y salida esperada
- UI y condición de rol: `src/pages/Perfil/PerfilPage.tsx`; catálogo compartido de roles: `src/auth/roleGuards.ts`; construcción del DTO: `src/modules/perfil/services/firmaPerfilService.ts`.
- Request de `ESTUDIANTE`: `POST ${VITE_API_URL || VITE_API_BASE_URL || '/api/sapp'}/firmaUsuario/{usuarioSappId}` con `{ "contenidoFirma": "data:image/png;base64,..." }`; la llave `titulo` no debe aparecer, ni siquiera como cadena vacía, `null` o `undefined` serializado.
- Request para los demás roles: la misma ruta con `{ "titulo": "PhD.", "contenidoFirma": "data:image/png;base64,..." }`; la selección continúa bloqueada hasta diligenciar el título.
- El GET no cambió: puede devolver `titulo`; en un perfil `ESTUDIANTE` se conserva internamente para compatibilidad, pero no se muestra ni se reenvía. No se agregaron paquetes, seeds, datasets, variables de entorno ni artefactos persistentes.

## Retos y próximos pasos
1. Validar con una sesión institucional `ESTUDIANTE` en Network que el JSON del POST contiene exactamente `contenidoFirma` y que backend acepta la ausencia de `titulo`.
2. Validar con un rol no estudiante que **Título** sigue visible, obligatorio y presente en el POST.
3. Incorporar pruebas de componente/servicio cuando el repositorio adopte Vitest. No existe actualmente un script `test`.

## Entorno y resultados recientes
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y el `node_modules` existente. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npm run build` (2026-09-03): PASS; TypeScript y Vite transformaron 242 módulos y generaron `dist/assets/index-BeWbqwSs.css` e `index-BEmylqxX.js`. Warning no bloqueante: chunk JS de 504.98 kB supera 500 kB.
- `npx eslint src/pages/Perfil/PerfilPage.tsx src/modules/perfil/services/firmaPerfilService.ts src/auth/roleGuards.ts` (2026-09-03): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check` (2026-09-03): PASS. No se tomó captura: no hay Chromium, Chrome ni Firefox instalado y la ruta protegida requiere una sesión/backend institucionales.

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
# Update 2026-09-03 — Persistencia HTML y presentación PDF de solicitudes

## Estado actual y decisiones
- El endpoint `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` puede devolver contenido `text/html` en base64. El formulario conserva ese Blob fuente sin alteraciones y crea un PDF separado, solo en memoria, para el `iframe` de previsualización.
- Al elegir **Cargar todos los documentos generados**, el draft recibe un `File` construido con el Blob original, extensión `.html` y el MIME entregado por el backend. El flujo de creación existente lo carga después mediante `uploadDocument`; por tanto, `documentos_contenido` conserva el HTML y no el PDF rasterizado.
- Al consultar un documento guardado con MIME `text/html`, tanto el listado `DocumentosAdjuntos` como el editor convierten su base64 a PDF en el navegador antes de **Ver** o **Descargar**. El usuario recibe un `.pdf`; los PDF ya persistidos y otros formatos mantienen su comportamiento previo.

## Paths, contratos y salida esperada
- Captura de fuente y PDF temporal: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`.
- Conversión al consumir documentos persistidos: `src/modules/solicitudes/utils/solicitudDocumentFile.ts`, reutilizando `src/modules/solicitudes/utils/htmlToPdf.ts`.
- Consumidores: `src/modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos.tsx` y `src/modules/solicitudes/components/SolicitudDocumentosEditor/SolicitudDocumentosEditor.tsx`.
- Entrada de previsualización: `{ ..., data: [{ base64DocumentoContenido, mimeTypeDocumentoContenido: "text/html", tipoDocumentoId?, tipoDocumentoCodigo?, tipoDocumentoNombre? }] }` (también se tolera el objeto único legado).
- Persistencia esperada: el upload conserva `contenidoBase64` correspondiente al HTML y `mimeType: "text/html"`; metadatos y contenido deben persistirse transaccionalmente en backend. Salida de **Ver/Descargar**: Blob `application/pdf` y nombre con extensión `.pdf`, sin actualizar la fuente almacenada.

## Retos y próximos pasos
1. Validar extremo a extremo con backend que el endpoint de carga no reescriba el MIME/contenido y que `GET /sapp/document` devuelva nuevamente el HTML base64.
2. Confirmar si el backend necesita conservar un nombre `.html` o si debe exponer un nombre lógico independiente de la extensión; el frontend fuerza `.pdf` únicamente al descargar.
3. Agregar pruebas unitarias/de componente cuando se incorpore Vitest, cubriendo HTML, PDF, MIME con parámetros y errores del conversor.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0. No se agregaron paquetes, variables, seeds ni datasets.
- `npm run build` (2026-09-03): PASS; TypeScript y Vite transformaron 243 módulos y generaron el build. Warning no bloqueante: chunk JS de 506.96 kB.
- La validación visual/HTTP requiere navegador, sesión institucional y backend; no está disponible como prueba automatizada local.

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

# Update 2026-09-03 — Documentos y firma masiva en detalle de solicitud

## Estado actual y decisiones
- `/solicitudes/:solicitudId` consulta los documentos adjuntos para cualquier rol que pueda abrir el detalle; ya no limita la carga a coordinación o estudiante. Todos reutilizan `DocumentosAdjuntos` y la tabla omite la columna MIME **Tipo**, conservando nombre, descripción y acciones **Ver/Descargar**.
- La navegación desde el bloque **Solicitudes asignadas** lleva `location.state.fromAssigned: true`. Solo en ese contexto aparece **Firmar todos los documentos** cuando `estado` o `estadoSigla` contiene la raíz `POR FIRMA`, sin distinguir mayúsculas. Se inspeccionan ambos campos de manera independiente: el contrato real combina, por ejemplo, `estado: "POR FIRMA DIRECTOR DE TG"` con `estadoSigla: "PFIR_DIR_TG"`, por lo que no se debe seleccionar únicamente la sigla mediante `estadoSigla || estado`.
- La firma ejecuta `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` sin body. Durante la petición el botón queda bloqueado; se presentan mensajes de error/éxito y, tras responder correctamente, se vuelve a consultar el detalle para reflejar el nuevo estado.

## Paths, contratos y salida esperada
- Detalle y estilos: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx` y `.css`.
- Transporte: `firmarDocumentosSolicitudAcademica` en `src/modules/solicitudes/api/solicitudesAcademicasService.ts`.
- Origen asignado: `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx`.
- Listado común: `src/modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos.tsx`; documentos obtenidos mediante `GET /sapp/document?tramiteId={id}&codigoTipoTramite={codigo}`.
- Contrato esperado de firma: envelope `{ ok, message, data }`; solo `ok: true` se considera éxito. No se envía payload. La ruta del cliente HTTP se resuelve contra `VITE_API_URL` (fallback `/api/sapp`).

## Retos y próximos pasos
1. Validar el POST con backend y la sesión `PROFESOR` reportada (`usuarios_sapp.id = 62`) desde una solicitud asignada en estado `POR FIRMA DIRECTOR DE TG`; confirmar el envelope y el estado resultante.
- Usar únicamente `/workspace/SAPP-frontend`, npm y el `node_modules` existente. No crear venv, conda, poetry, entornos Python ni un árbol npm duplicado.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0. No se agregaron dependencias, seeds ni datasets.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx src/modules/solicitudes/api/solicitudesAcademicasService.ts src/modules/solicitudes/components/DocumentosAdjuntos/DocumentosAdjuntos.tsx`: PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS después de corregir la detección del estado real; TypeScript y Vite transformaron 242 módulos y generaron `dist/assets/index-CI7kim7r.css` e `index-Bpg9jifk.js`. Warning no bloqueante por el chunk JS mayor a 500 kB.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`: PASS después de corregir la detección del estado real; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `git diff --check`: PASS. El lint dirigido que incluyó `SolicitudesCoordinadorView.tsx` reportó sus dos errores históricos `react-hooks/set-state-in-effect` (líneas 55 y 112), sin relación con el cambio de navegación. La validación HTTP/visual depende del backend, sesión institucional y navegador no disponibles en el contenedor.

---

# Update 2026-09-03 — Listado documental único para el estudiante

## Estado actual y salida esperada
- En `/solicitudes/:solicitudId`, un usuario con rol `ESTUDIANTE` que consulta una solicitud ya creada ve únicamente **Documentos adjuntos**; se ocultó el primer checklist redundante titulado **Documentos** del modo de consulta.
- Al pulsar **Editar solicitud**, `SolicitudDocumentosEditor` continúa renderizándose dentro del formulario y conserva la carga/actualización documental. No se modificó el flujo de creación ni la presentación para otros roles.

## Paths, contratos y próximos pasos
- Cambio de renderizado: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`.
- El listado visible continúa usando `DocumentosAdjuntos` y `GET /sapp/document?tramiteId={id}&codigoTipoTramite={codigo}`; no cambió ningún request, response, schema, dependencia, seed ni dataset.
- Validar visualmente con una sesión institucional `ESTUDIANTE`: abrir una solicitud creada, comprobar que existe un solo listado documental y entrar a edición para confirmar que el editor reaparece.
- Reutilizar `/workspace/SAPP-frontend`, npm y `node_modules`; no crear venv, conda, poetry ni instalaciones paralelas.
- `npx eslint src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`: PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; TypeScript y Vite transformaron 244 módulos. Vite emitió el warning no bloqueante por un chunk de 508.30 kB.
- `git diff --check`: PASS. No se tomó captura: el contenedor no tiene Chromium, Chrome ni Firefox, y la validación de esta ruta requiere backend y sesión institucional.

---
# Update 2026-09-03 — Canvas seguro al convertir documentos HTML a PDF

## Estado actual y decisión
- Se corrigió el `SecurityError: Tainted canvases may not be exported` que aparecía al abrir o descargar documentos persistidos como `text/html`, especialmente cartas con firmas base64 embebidas.
- `htmlToPdf` mantiene el saneamiento previo de recursos externos. Además, antes de construir el SVG `foreignObject`, obtiene la geometría de cada imagen `data:`, sustituye su copia serializada por un placeholder del mismo tamaño y carga la imagen como recurso local independiente.
- Durante el paginado, cada imagen se compone directamente sobre el canvas dentro del área imprimible. El SVG nunca contiene el recurso que contaminaba el canvas y `canvas.toDataURL` puede exportar el JPEG; las firmas siguen presentes y se recortan correctamente si cruzan una página.
- No cambió el contrato HTTP, el HTML almacenado ni el MIME fuente. No se agregaron dependencias, variables, seeds o datasets.

## Paths, contrato y salida esperada
- Conversor corregido: `src/modules/solicitudes/utils/htmlToPdf.ts`.
- Consumidores: `src/modules/solicitudes/utils/solicitudDocumentFile.ts` para **Ver/Descargar** y `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx` para previsualización.
- Entrada relevante: `base64DocumentoContenido` que decodifica a HTML y `mimeTypeDocumentoContenido: "text/html"`; se admiten imágenes inline seguras JPEG, PNG, GIF o WebP en URI `data:` (o base64 crudo normalizado previamente).
- Salida esperada: Blob `application/pdf`, nombre de descarga `.pdf`, páginas Letter blancas con el contenido y sus firmas. Recursos HTTP/HTTPS continúan eliminándose deliberadamente para impedir peticiones y contaminación de origen.

## Retos y próximos pasos
1. Validar en el navegador institucional los documentos existentes, incluido `idDocumento: 1126`, mediante **Ver** y **Descargar**, comprobando visualmente ambas firmas.
2. Agregar una prueba de navegador cuando el proyecto incorpore Vitest/browser runner; jsdom por sí solo no implementa rasterización real de canvas/SVG.
3. Si el backend comienza a entregar fuentes o imágenes externas, convertirlas allí a `data:` confiable; no relajar el saneamiento CORS en el frontend.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npx eslint src/modules/solicitudes/utils/htmlToPdf.ts` (2026-09-03): PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y Vite transformaron 245 módulos y generaron `dist/assets/index-DTG9rVIh.js` (509.09 kB). El tamaño supera el umbral informativo habitual, sin bloquear el build.
- `git diff --check` (2026-09-03): PASS. No se tomó captura porque el cambio no altera la interfaz visual y el escenario requiere navegador, sesión y backend institucionales.

---
# Update 2026-09-03 — Paginación PDF basada en geometría DOM

## Estado actual y decisión
- `src/modules/solicitudes/utils/htmlToPdf.ts` conserva el contrato `htmlToPdf(html: string): Promise<Blob>`, el canvas Letter de 816×1056 px y los márgenes verticales de 72 px (área útil de 912 px).
- Tras esperar fuentes e imágenes, el conversor recopila todas las cajas de línea reales con `Range.getClientRects()`, además de la geometría de `p`, `li`, `tr`, `table`, `figure`, `h1`–`h6`, `.pdf-keep-together` y `[data-pdf-keep-together]`.
- `calculatePdfPageRanges` parte del límite ideal de cada página y lo retrocede al inicio del rectángulo atravesado. Solo retrocede si conserva al menos el 25 % del área útil; los bloques de más de 912 px se pueden dividir. El resultado son rangos `{ sourceY, sourceHeight }` consecutivos que el pintor consume directamente, sin calcular `page * PAGE_CONTENT_HEIGHT_PX`.
- La prueba `tests/browser/htmlToPdf.pagination.browser.html` es un harness de navegador sin dependencias: al servir el repositorio con Vite, abrir `/tests/browser/htmlToPdf.pagination.browser.html`. Construye un documento con dos firmas cuyo contenedor comienza cerca del final de la primera página y muestra `PASS (5 assertions)` solamente si ambas quedan completas en la segunda página, los rangos no tienen huecos ni solapamientos y cubren toda la altura.

## Contratos, plantillas y salida esperada
- Entrada/salida pública sin cambios: HTML del endpoint `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` → `Promise<Blob>` con MIME `application/pdf`.
- Las plantillas de ese servicio no existen en este repositorio frontend. El equipo backend debe añadir `data-pdf-keep-together` al **contenedor completo** de cada bloque de firmas y a tablas pequeñas o secciones institucionales que no deban separarse; el selector ya está soportado por el frontend y el fixture demuestra el contrato.
- Resultado esperado: una firma que comienza cerca de un corte se desplaza completa junto con las demás firmas de su contenedor; el contenido anterior y posterior aparece exactamente una vez. Un bloque mayor que una página sí se corta para garantizar progreso.

## Retos y próximos pasos
1. Aplicar el atributo en las plantillas reales del repositorio backend de `pdf-previsualizacion`; no duplicar dichas plantillas en este frontend.
2. Ejecutar el harness en Chrome/Chromium y validar visualmente una respuesta institucional real. Este contenedor no incluye navegador y la descarga de Playwright fue rechazada con HTTP 403, por lo que la validación visual local queda pendiente.
3. Cuando el entorno disponga de Playwright, automatizar la apertura del harness sin crear otro árbol npm; no crear venv, conda ni poetry.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, ESLint 9.39.2 y typescript-eslint 8.51.0. Reutilizar `node_modules`; no existen seeds/datasets nuevos ni entornos Python.
- La instalación de `@playwright/test@1.55.0` no modificó `package.json`/lockfile y falló por la política de red (`403 Forbidden`). El harness se dejó libre de paquetes adicionales para poder ejecutarse con cualquier navegador servido por Vite.
- `npx eslint src/modules/solicitudes/utils/htmlToPdf.ts` (2026-09-03): PASS; solo apareció el warning conocido de npm `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-03): PASS; TypeScript y Vite transformaron 245 módulos. Warning no bloqueante por el chunk JS de 510.86 kB.
- `git diff --check` (2026-09-03): PASS.

---

# Update 2026-09-04 — Cambio de marca visual a Minerva

## Estado actual y decisión
- La marca que se presenta a las personas usuarias es **Minerva**. El nombre anterior, **SAPP**, continúa intacto en URLs (`/api/sapp`, `/sapp`), contratos, `SessionKind`, claves de storage, nombres de clases CSS y demás identificadores técnicos para evitar una migración incompatible.
- El sidebar muestra una **M** circular cuando está contraído y revela **Minerva** al recibir hover/foco. En la disposición móvil, donde no hay expansión lateral, se muestran la marca y el nombre completo permanentemente.
- También se actualizaron el título HTML y los dos mensajes visibles que todavía nombraban a un “Usuario SAPP”.

## Paths, salida esperada y próximos pasos
- Marca del sidebar: `src/components/Sidebar/Sidebar.tsx` y `src/components/Sidebar/Sidebar.css`.
- Título de pestaña: `index.html`. Textos de usuario: `src/pages/Perfil/PerfilPage.tsx` y `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`.
- Salida esperada en escritorio: **M** dentro del sidebar de 84 px y **M Minerva** dentro del sidebar expandido de 260 px. En pantallas de hasta 900 px: **M Minerva** siempre visible.
- Validar visualmente ambos temas y los breakpoints con backend/sesión institucional. No sustituir ocurrencias técnicas de `SAPP` ni renombrar URLs, aunque una búsqueda global todavía las encuentre.
- Entorno único: `/workspace/SAPP-frontend`, Node.js/npm y el `node_modules` existente. No crear venv, conda, poetry ni otro árbol de dependencias. No se agregaron paquetes, seeds o datasets.
- `npx eslint src/components/Sidebar/Sidebar.tsx src/pages/Perfil/PerfilPage.tsx src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`: PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; TypeScript y Vite transformaron 246 módulos. Warning informativo no bloqueante por el chunk JavaScript de 514.72 kB.
- `git diff --check`: PASS. No se tomó captura porque el contenedor no dispone de Chromium, Chrome ni Firefox; la comprobación integral requiere además la sesión institucional.

---
# Update 2026-09-04 — Navegación de regreso estandarizada

## Estado actual y decisión
- Se creó `src/components/BackButton/BackButton.tsx` con su estilo temático en `BackButton.css`. El componente renderiza un `Link` cuando recibe `to` y un `button` cuando recibe `onClick`; conserva etiquetas contextuales, una flecha uniforme y foco accesible.
- Los regresos de detalles de convocatoria, inscripción, etapa de evaluación, estudiante, matrícula y solicitud ahora usan este componente. También se movieron al inicio superior izquierdo los regresos de crear/editar período y del formulario interno de nueva solicitud.
- No se cambiaron rutas, contratos HTTP, schemas, dependencias, variables de entorno, seeds ni datasets. El resultado esperado es que todos esos controles se vean como una píldora institucional idéntica en temas claro y oscuro, antes del contenido principal.

## Paths, retos y próximos pasos
- Componente y contrato: `src/components/BackButton/BackButton.tsx`, exportado por `src/components/index.ts`; estilos globalmente reutilizables en `src/components/BackButton/BackButton.css`.
- Consumidores modificados: páginas de detalle bajo `src/pages/{ConvocatoriaDetalle,InscripcionAdmisionDetalle,EstudianteDetalleCoordinacion,MatriculaDetalleCoordinacion,SolicitudDetalle}`, `src/modules/admisiones/pages/EvaluacionEtapaPage`, `src/pages/ConfigFechasAdmisiones` y `src/modules/solicitudes/components/SolicitudesEstudianteView`.
- Próximo paso recomendado: validar visualmente cada ruta con sesiones institucionales de coordinación, profesor y estudiante, en escritorio/móvil y temas claro/oscuro. Las rutas están protegidas y el contenedor no dispone de sesión ni backend para capturarlas con datos reales.
- Para regresos nuevos, reutilizar `BackButton`; no volver a crear clases locales de “back”. Si el destino es una ruta, pasar `to` (y opcionalmente `state`); si solo cambia estado local, pasar `onClick`.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `/workspace/SAPP-frontend/node_modules`. No crear venv, conda, poetry, entornos Python ni un segundo árbol npm.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npm run build` (2026-09-04): PASS; 248 módulos transformados y archivos `dist/assets/index-Jv30iAcw.css` e `index-OMmJdaeV.js`. Persiste únicamente el warning no bloqueante por el chunk JS de 514.65 kB.
- `git diff --check` (2026-09-04): PASS.
- Captura pendiente por limitación del entorno funcional: todas las vistas modificadas requieren autenticación institucional y datos del backend.

---

# Update 2026-09-07 — Título Minerva y pareja de logos EISI/UIS

## Estado actual y decisión
- `index.html` presenta el título exacto **Minerva | Posgrados** y mantiene como favicon el logo EISI de `public/brand/eisi-favicon.svg`.
- El encabezado compartido de `ModuleLayout` muestra, después del perfil, el logo EISI a la izquierda del logo UIS. Ambos usan una única clase y la misma altura responsiva; se preserva su relación de aspecto con `width: auto` y `object-fit: contain`.
- No se modificaron rutas, contratos HTTP, schemas, dependencias, variables de entorno, seeds ni datasets.

## Paths, contrato visual y salida esperada
- Documento y favicon: `index.html` y `public/brand/eisi-favicon.svg`.
- Assets del encabezado: `public/brand/svg.svg` (EISI) y `public/brand/LOGO UIS_PNG.png` (UIS); ambos assets fuente tienen lienzo de 1197×733.
- Integración y estilos: `src/components/ModuleLayout/ModuleLayout.tsx` y `src/components/ModuleLayout/ModuleLayout.css`.
- Salida esperada: en la esquina superior derecha, después del nombre y avatar, aparece **EISI → UIS** con alturas iguales; en móvil el grupo permanece unido, se alinea a la derecha y reduce su altura fluidamente.

## Retos y próximos pasos
1. Validar el encabezado en una ruta protegida con sesión institucional, en escritorio y móvil, y en temas claro/oscuro.
2. Si los archivos oficiales se reemplazan, conservar sus rutas o actualizar ambas constantes en `ModuleLayout.tsx`; no volver a estilizar cada logo con alturas independientes.

## Entorno y resultados
- Raíz única: `/workspace/SAPP-frontend`; Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- Reutilizar `node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm. No existen seeds o datasets para este cambio.
- `npx eslint src/components/ModuleLayout/ModuleLayout.tsx` (2026-09-07): PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-07): PASS; TypeScript y Vite transformaron 247 módulos y generaron `dist/assets/index-BF2FxPwU.css` e `index-C6bSK8Xj.js`. Persiste el warning informativo no bloqueante por el chunk JS de 515.95 kB.
- `git diff --check` (2026-09-07): PASS.
- `npm run lint` global (2026-09-07): FAIL por 9 errores y 1 warning preexistentes fuera de este cambio (`no-explicit-any`, `set-state-in-effect`, variables sin uso, interfaces vacías y una dependencia de hook faltante). El archivo TSX modificado sí pasa ESLint de forma aislada.
- No se pudo tomar la captura solicitada: el contenedor no dispone de Chromium, Chrome, Firefox, Playwright ni Puppeteer, y el encabezado real requiere además una sesión institucional en una ruta protegida.

---
# Update 2026-09-08 — Generación real del informe de admisión

## Estado, contrato y salida esperada
- El botón **Generar informe** de `/coordinacion/reportes`, cuando el proceso es **Admisión**, ya no usa el mock. Ejecuta `POST /sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}` sin body mediante el cliente HTTP compartido y su autenticación.
- Nota posterior del 2026-09-08: el backend responde con el PDF crudo (`%PDF-1.4...`) y el frontend actual lo conserva como `Blob`; no se espera el envelope `ApiResponse<unknown>` para esta operación exitosa.
- La selección de programa continúa siendo necesaria para filtrar convocatorias, pero `programaId` no forma parte del POST. Matrícula y créditos condonables conservan por ahora `informesMockService.ts`.

## Paths, retos y próximos pasos
- Integración HTTP: `src/modules/reportes/services/reporteAdmisionService.ts`.
- Orquestación y feedback: `src/pages/Reportes/ReportesPage.tsx`.
- Validar con backend una combinación real (referencia conocida: `actaId=2`, `convocatoriaId=68`) y confirmar que el PDF abre y descarga correctamente.
- Sustituir los mocks de matrícula y créditos cuando existan sus endpoints; no reutilizar el endpoint de admisión para esos procesos.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. No se agregaron dependencias, seeds o datasets.
- Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5; plugin React SWC 4.2.2; ESLint 9.39.2; typescript-eslint 8.51.0.
- `npx eslint src/pages/Reportes/ReportesPage.tsx src/modules/reportes/services/reporteAdmisionService.ts`: PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; TypeScript y Vite transformaron 249 módulos y generaron `dist/assets/index-16Ne2VSA.css` e `index-DNqqTw6i.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 517.61 kB.
- `git diff --check`: PASS. No se tomó captura porque la integración no cambia la presentación visual y su verificación funcional requiere backend y sesión institucionales.

---

# Update 2026-09-08 — Iconos definitivos en el menú de Inicio

## Estado actual y decisión
- El menú de tarjetas de `/` ya no presenta emojis: comparte los mismos SVG definitivos del sidebar para todos los módulos visibles según el rol.
- `src/components/Sidebar/SidebarModuleIcon.tsx` es la fuente única de iconografía. Incluye los trazos propios de Solicitudes, Admisiones e Informes, y el mapeo Lucide de Matrícula, Estudiantes, Actas y Fechas; acepta una clase CSS opcional para adaptarse a cada contexto.
- `src/components/Sidebar/Sidebar.tsx` y `src/pages/Home/HomePage.tsx` consumen ese componente. El inicio aplica tamaño de 2 rem y color `--primary` desde `src/pages/Home/HomePage.css`.
- No cambiaron rutas, visibilidad por roles, APIs, schemas, variables de entorno, paquetes, seeds ni datasets. La salida esperada es correspondencia visual uno a uno entre cada enlace del sidebar y su tarjeta de inicio, en temas claro y oscuro.

## Próximos pasos y entorno
- Validar visualmente `/` con roles de estudiante, profesor y coordinación, en escritorio/móvil y ambos temas. Este contenedor no incluye Chromium, Chrome ni Firefox, por lo que no fue posible generar una captura local.
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Entorno comprobado: Node.js 24.15.0; npm 11.4.2; React/React DOM 19.2.3; React Router DOM 7.11.0; TypeScript 5.9.3; Vite/rolldown-vite 7.2.5 y ESLint 9.39.2.

## Resultados recientes
- `npx eslint src/components/Sidebar/Sidebar.tsx src/components/Sidebar/SidebarModuleIcon.tsx src/pages/Home/HomePage.tsx`: PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; TypeScript y Vite transformaron 253 módulos y generaron `dist/assets/index-D-63uBWd.css` e `index-D3jf2rz7.js`. Persiste el warning informativo por el chunk JavaScript de 524.46 kB.
- `git diff --check`: PASS.

---
# Update 2026-09-09 — Sistema tipográfico global

## Estado actual y decisión
- `src/styles/globals.css` es la fuente canónica de tipografía. Define tokens para familia sans, escala de títulos, cuerpo, texto pequeño, pesos e interlineados; los elementos HTML semánticos y los controles de formulario consumen esa base en todos los módulos.
- Los títulos `h1` y `h2` usan tamaños fluidos con `clamp()`. El cuerpo mantiene `1rem` en todos los viewports: se retiró la reducción global a 15/14 px para evitar que el mismo texto cambiara de jerarquía entre escritorio y móvil.
- Se conservaron las reglas locales de componentes cuando expresan una función particular (badges, métricas, códigos o titulares destacados). Los nuevos estilos deben reutilizar los tokens `--font-*` antes de introducir otro tamaño o peso.
- El cambio es exclusivamente presentacional. No modifica componentes React, rutas, permisos, contratos HTTP ni datos.

## Paths, contrato visual y salida esperada
- Fuente canónica: `src/styles/globals.css`; carga global: `src/main.tsx`. No se añadieron fuentes remotas ni paquetes: la pila continúa usando Inter cuando esté disponible y las fuentes de sistema como respaldo.
- La salida esperada es una jerarquía consistente para `h1`–`h6`, párrafos, listas, textos auxiliares, formularios y tablas en temas claro/oscuro. Los controles heredan familia, tamaño e interlineado; los placeholders usan `--text-secondary`.
- No hay endpoints, schemas, variables de entorno, seeds o datasets nuevos. Los datos continúan viniendo del gateway/API institucional.

## Retos, entorno y próximos pasos
1. Validar las rutas protegidas en temas claro/oscuro y en escritorio/móvil con datos reales, prestando especial atención a títulos que mantienen variantes locales por diseño.
2. Al intervenir un módulo, reemplazar gradualmente valores tipográficos duplicados por los tokens globales; no eliminar excepciones semánticas como códigos monoespaciados, badges o métricas sin revisión visual.
3. Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm. El entorno observado es Node.js 24.15.0 y npm 11.4.2; las versiones exactas de paquetes están en `package-lock.json` y resumidas en `README.md`.
- `npm run build` (2026-09-09): PASS; transformó 253 módulos y generó `dist/assets/index-CNaywT30.css` e `index-BrrgKhWL.js`. Persiste el warning no bloqueante por el chunk JavaScript mayor a 500 kB.
- `npm run lint` (2026-09-09): FAIL por 9 errores y 1 warning preexistentes en servicios, mocks, tipos y componentes no modificados por esta actualización. `git diff --check`: PASS.
- No existe script de pruebas de componentes. Tampoco hay Chromium, Chrome o Firefox instalado, por lo que no fue posible tomar una captura; la revisión visual completa requiere una sesión institucional y su backend.

---

# Update 2026-09-09 — Front-channel logout institucional

## Estado actual, contrato y salida esperada
- El botón **Cerrar sesión** del sidebar continúa invocando `AuthContext.logout()`. La acción borra inmediatamente la sesión en memoria y el storage de sesión, espera la limpieza integral del origen mediante `clearBrowserSession()` y, incluso si esa limpieza falla, ejecuta `window.location.replace('/api/auth/slo/logout')` desde el bloque `finally`.
- `/api/auth/slo/logout` es una navegación de documento (front-channel logout), no una solicitud `fetch` ni un endpoint bajo `VITE_API_URL`. El Gateway/IDP debe responder a esa ruta y completar el cierre de la sesión institucional.
- La ruta es deliberadamente fija: `VITE_IDP_LOGOUT_URL` y `VITE_LOGOUT_URL` ya no intervienen. Se retiraron del ejemplo de entorno para evitar que un despliegue redirija al endpoint anterior o solamente a `/`.

## Paths, retos y próximos pasos
- Resolución de la ruta: `src/api/authService.ts`; orquestación: `src/context/Auth/AuthContext.tsx`; limpieza de navegador: `src/modules/auth/session/clearBrowserSession.ts`; disparador visual: `src/components/Sidebar/Sidebar.tsx`.
- Configuración y documentación: `.env.example` y `README.md`. No cambiaron schemas, payloads JSON, dependencias, seeds ni datasets.
- Validar en un despliegue integrado que el Gateway exponga `GET /api/auth/slo/logout`, invalide su cookie/sesión y lleve al usuario al destino post-logout esperado. La SPA no debe inicializar de nuevo `/inicio` antes de abandonar el documento.

## Entorno y resultados
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Entorno observado: Node.js 24.15.0 y npm 11.4.2. Las versiones exactas del frontend permanecen en `package-lock.json` y en la tabla de `README.md`.
- `npx eslint src/api/authService.ts src/context/Auth/AuthContext.tsx src/modules/auth/session/clearBrowserSession.ts src/components/Sidebar/Sidebar.tsx`: PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; TypeScript y Vite transformaron 253 módulos y generaron `dist/assets/index-CNaywT30.css` e `index-QBZ8MNTH.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 526.97 kB.
- `git diff --check`: PASS. No se tomó captura porque el cambio no modifica la presentación del frontend; la validación completa del SLO requiere Gateway/IDP y sesión institucional.

---
# Update 2026-09-09 — Notificación al completar la revisión documental de matrícula

## Estado actual y decisión
- En `MatriculaDetalleCoordinacionPage`, después de aprobar o rechazar un documento se recarga la lista desde el backend. La pantalla filtra los documentos obligatorios y comprueba que todos estén cargados y en estado terminal `APROBADO` o `RECHAZADO`.
- Cuando la comprobación se cumple, se invoca `POST /sapp/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos` sin body. Un `useRef` evita repetir la notificación para la misma matrícula durante el montaje actual; solo se marca como notificada después de una respuesta exitosa, de modo que un fallo no quede registrado falsamente.
- La regla anterior que aprueba automáticamente la matrícula cuando todos los documentos obligatorios están aprobados permanece intacta. La nueva notificación también cubre el caso en que uno o más documentos hayan sido rechazados.

## Paths, contrato y salida esperada
- Orquestación: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx`.
- Servicio HTTP: `src/modules/matricula/services/matriculaAcademicaService.ts`.
- Contrato: `POST ${VITE_API_URL || '/api/sapp'}/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos`, sin body, autenticado, con respuesta esperada `ApiResponse<unknown>` (o HTTP 204 admitido por el transporte compartido).
- No se agregaron dependencias, variables, seeds ni datasets. Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm.

## Retos y próximos pasos
1. Validar con una sesión real de coordinación una matrícula con todos los documentos aprobados y otra con al menos un rechazo; Network debe mostrar el POST inmediatamente después de la última decisión.
2. Confirmar que el endpoint del backend es idempotente entre recargas/sesiones, pues la protección del frontend evita duplicados durante un montaje, pero no sustituye la idempotencia del servidor.
3. Si producto decide que documentos opcionales cargados también bloquean la finalización, ampliar el filtro `documentsToReview`; actualmente el avance de matrícula ya se basa en documentos obligatorios.

## Entorno y resultados
- Entorno único `/workspace/SAPP-frontend`: Node.js 24.15.0, npm 11.4.2 y las versiones exactas declaradas/instaladas que se resumen en `README.md`. No existe script `test` en `package.json`.
- `npx eslint src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx src/modules/matricula/services/matriculaAcademicaService.ts` (2026-09-09): PASS; npm mostró solo el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-09): PASS; 253 módulos transformados y artefactos `dist/assets/index-CV5t7kwZ.css` e `index-Dq8ZwHXv.js`; persiste el warning informativo por el chunk JavaScript mayor a 500 kB.
- `git diff --check` (2026-09-09): PASS.
- Validación funcional pendiente: el flujo requiere autenticación y datos del backend institucional. No hubo cambio visual, por lo que no aplica una captura de pantalla.

---

# Update 2026-09-09 — Acciones documentales condicionadas al ID de matrícula

## Estado actual y decisión
- En la vista de matrícula del rol `ESTUDIANTE`, **Ver**, **Subir** y **Descargar** quedan deshabilitadas cuando la validación vigente todavía devuelve `CAN_CREATE`; solo se habilitan después de que la validación devuelva `EXISTS` y, por tanto, haya un `matricula.id` real.
- La confirmación inicial ya no exige adjuntos antes de crear el trámite, porque esos controles están deliberadamente bloqueados hasta disponer del ID. Primero se ejecuta `crearMatriculaAcademica`, después se vuelve a consultar la matrícula vigente y finalmente se recarga el checklist asociado al nuevo ID.
- Para una matrícula `FINALIZADA`, **Ver/Descargar** siguen disponibles porque existe el trámite, mientras **Subir** continúa bloqueado por la regla de solo lectura existente.

## Paths, contrato y salida esperada
- Orquestación y condición de permisos: `src/pages/Matricula/MatriculaPage.tsx`.
- Tabla presentacional reutilizada sin cambios: `src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.tsx`; `disabledActions` bloquea las tres acciones y `uploadDisabledOnly` permite bloquear solamente la carga.
- Contrato preservado: la creación usa el período retornado por la validación y las asignaturas elegidas; los documentos se cargan posteriormente con `tramiteId: matriculaValidation.matricula.id`. No se modificaron endpoints, schemas, dependencias, variables de entorno, seeds ni datasets.
- Salida esperada: sin matrícula, la tabla puede informar el checklist requerido pero sus tres botones están inactivos; después de confirmar materias y obtener el ID, las acciones se habilitan según el estado del trámite y del documento.

## Retos, próximos pasos y entorno
1. Validar con backend y sesión `ESTUDIANTE` la transición `CAN_CREATE → EXISTS`: confirmar materias, comprobar que aparece el ID en la respuesta de validación y luego subir un documento.
2. Confirmar con producto si conviene añadir una ayuda visible junto al checklist mientras no existe matrícula; este ajuste se limita a corregir la habilitación solicitada.
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. El entorno observado permanece en Node.js 24.15.0 y npm 11.4.2; las versiones exactas están en `README.md` y `package-lock.json`.
- No existe script automatizado `test` en `package.json`.
- `npx eslint src/pages/Matricula/MatriculaPage.tsx` (2026-09-09): PASS; npm mostró únicamente el warning conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-09): PASS; 253 módulos transformados y artefactos `dist/assets/index-CV5t7kwZ.css` e `index-CJ-CXGg0.js`. Persiste el warning informativo por el chunk JavaScript de 528.41 kB.
- `git diff --check` (2026-09-09): PASS.
- No se tomó captura: el contenedor no tiene Chromium, Chrome ni Firefox y la vista requiere además sesión `ESTUDIANTE` y backend institucional.

---
# Update 2026-09-10 — Fotografías del desplegable de egresados

## Estado actual, causa y decisión
- En `/coordinacion/estudiantes`, el bloque **Egresados** continúa siendo diferido: al abrirlo consulta `GET /sapp/estudiantes/consulta?programaId={id}&egresados=true` y luego resuelve las fotos de quienes tienen `idAspirante`.
- La causa de las fotos ausentes era el arreglo de dependencias del efecto: después de `setEgresados(data)`, el cambio de `egresados.length` ejecutaba el cleanup, marcaba la solicitud como obsoleta y la cola abortaba antes de actualizar fotos. `egresados.length` ya no es dependencia; el efecto se gobierna por el despliegue y el programa, igual que el ciclo de vida del listado normal.
- Por cada egresado se consulta primero la inscripción mediante `getInscripcionByAspirante(idAspirante)` y después el documento con `codigoTipoTramite: 1002`, `codigoTipoDocumentoTramite: 'ANX-4'` y `tramiteId: inscripcion.id`. La concurrencia máxima sigue siendo cuatro; un error individual conserva **Sin foto**.

## Paths, contrato, salida esperada y próximos pasos
- Orquestación: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`; consulta/mapeo de estudiantes: `src/modules/estudiantes/services/estudiantesMockService.ts`; servicio de foto: `src/modules/documentos/api/documentoFotoService.ts`; render: `src/modules/estudiantes/components/EstudianteCard/EstudianteCard.tsx`.
- Salida esperada: al pulsar **Mostrar egresados**, las tarjetas aparecen y cada egresado con foto `ANX-4` recibe una URI `data:{mime};base64,{contenido}`. Al ocultar durante la carga o cambiar de programa se invalidan actualizaciones tardías.
- Pendiente: validar en navegador con sesión institucional y egresados reales que las llamadas de inscripción/documentos aparecen en Network y que las imágenes se renderizan. No hay seeds ni datasets locales; los datos provienen del API.

## Entorno y verificación
- Usar exclusivamente `/workspace/SAPP-frontend` con Node/npm y el `node_modules` existente; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm. Las versiones exactas están fijadas por `package-lock.json` y resumidas en `README.md`; no se agregaron paquetes ni variables de entorno.
- Verificaciones del 2026-09-10: `npx eslint src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx` pasó (solo apareció el warning ambiental de npm `Unknown env config "http-proxy"`); `npm run build` pasó con 253 módulos y el warning no bloqueante del chunk mayor a 500 kB; `git diff --check` pasó. El repositorio no define un script `test`.

---
# Update 2026-09-10 — Edición de entrevista limitada al evaluador en sesión

## Estado actual y decisión
- En `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/entrevistas`, cada grupo continúa visible para permitir consultar las calificaciones, pero `EvaluacionEtapaSection` recibe `isReadOnly` para todos los grupos que no pertenecen al usuario autenticado. Una sesión de coordinación, por tanto, solo puede editar el grupo asignado a su propio nombre.
- La pertenencia se determina comparando `EvaluacionAdmisionItem.evaluador` con el nombre completo de `session.user.persona` después de eliminar espacios extremos, compactar espacios internos y normalizar a mayúsculas. Se reutiliza la misma regla que ya restringía las entrevistas del perfil exclusivamente profesor.
- Además del bloqueo de los controles, `handleChangeDraft` ignora cambios ajenos y el guardado masivo filtra las filas por el evaluador de la sesión. Esto es defensa de interfaz; el backend debe seguir autorizando que cada usuario actualice únicamente sus propias calificaciones.

## Paths, contrato y salida esperada
- Orquestación: `src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx`; componente presentacional reutilizado: `src/modules/admisiones/components/EvaluacionEtapaSection/EvaluacionEtapaSection.tsx`.
- Entrada existente: `GET /sapp/evaluacionAdmision/info/{inscripcionId}?etapaEvaluacion=ENTREVISTA`; cada elemento requiere `id`, `evaluador`, `puntajeAspirante`, `puntajeMax`, `observaciones` y los demás campos de `EvaluacionAdmisionItem`.
- Salida esperada: el evaluador de la sesión tiene habilitados nota y observaciones solo en su grupo; los grupos restantes muestran sus valores con controles deshabilitados. `ENTREV` continúa como resumen no editable. El `PUT` masivo existente recibe exclusivamente las filas modificadas que pertenecen al usuario actual.

## Retos, próximos pasos y entorno
1. Validar con sesiones institucionales de coordinación y de profesor que el texto de `evaluador` retornado por el backend coincide con el nombre compuesto de `personas_idp`; si el backend dispone del `usuarios_sapp.id`/UUID del evaluador, se recomienda incorporarlo al DTO y reemplazar a futuro la comparación por nombre.
2. Confirmar en backend la autorización por evaluador del endpoint de actualización; deshabilitar controles en React no reemplaza ese control de acceso.
3. Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. No se agregaron dependencias, variables, schemas, seeds ni datasets.

## Verificaciones
- `npx eslint src/modules/admisiones/pages/EvaluacionEtapaPage/EvaluacionEtapaPage.tsx` (2026-09-10): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-10): PASS; TypeScript y rolldown-vite transformaron 255 módulos y generaron `dist/assets/index-Cp9gSOCw.css` e `index-z4oLB2J3.js`. Persiste el warning informativo por el chunk JavaScript de 536.67 kB.
- `npm run lint` (2026-09-10): FAIL por 9 errores y 1 warning preexistentes en servicios API, rutas/mocks de admisiones, documentos y solicitudes; el lint focalizado del archivo funcional modificado sí pasa.
- `git diff --check` (2026-09-10): PASS. No se tomó captura: no hay Chromium, Chrome ni Firefox instalado y la ruta requiere una sesión institucional con datos reales del backend.

---

# Update 2026-09-16 — Carga documental durante la creación de matrícula

## Estado actual y decisiones
- En `/matricula`, una sesión `ESTUDIANTE` puede seleccionar cada archivo desde el checklist aun cuando la validación responda `CAN_CREATE` y todavía no exista `matricula.id`. Al confirmar, el flujo existente crea la matrícula, vuelve a consultar el registro vigente y carga los archivos seleccionados usando el ID obtenido.
- Las acciones por documento aparecen en el orden **Cargar**, **Ver**, **Descargar**. **Ver** y **Descargar** no se renderizan mientras `uploadStatus` sea distinto de `UPLOADED`, evitando acciones sin archivo.
- En una matrícula existente, **Cargar** se habilita para documentos faltantes y para documentos `RECHAZADO` que requieren corrección. Se deshabilita para archivos ya cargados que están en revisión, documentos `APROBADO`, cargas en curso y cualquier matrícula `FINALIZADA`.

## Paths, contratos y salida esperada
- Tabla y reglas por documento: `src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.tsx`.
- Integración del estado del trámite: `src/pages/Matricula/MatriculaPage.tsx`.
- El contrato HTTP no cambió: `POST /sapp/matriculaAcademica` crea primero el trámite y la carga documental existente recibe después `tramiteId: matricula.id`. No hay schemas, dependencias, variables, seeds ni datasets nuevos.
- Salida esperada en creación: **Cargar** activo y sin **Ver/Descargar** antes de seleccionar/cargar. Salida esperada después de cargar: las tres acciones visibles, pero **Cargar** bloqueado durante revisión o aprobación y nuevamente habilitado ante rechazo.

## Entorno, retos y próximos pasos
- Usar exclusivamente `/workspace/SAPP-frontend` y reutilizar `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Entorno observado: Node.js 24.15.0, npm 11.4.2; versiones exactas en `README.md` y `package-lock.json`.
- Validar con backend y sesión institucional la secuencia `CAN_CREATE → EXISTS → upload`, un documento rechazado y uno aprobado. No existe script `test` en `package.json`.
- `npx eslint src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.tsx src/pages/Matricula/MatriculaPage.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-WwBwsYZB.css` e `index-BWVDWyce.js`. Persiste el warning informativo por el chunk JavaScript de 545.52 kB.
- `git diff --check` (2026-09-16): PASS. No se pudo tomar captura local porque el contenedor no tiene Chromium, Chrome, Firefox, Playwright ni Puppeteer; además, la ruta requiere sesión institucional y backend.

---
# Update 2026-09-16 — Legibilidad de estados documentales en matrícula estudiantil

## Estado actual y decisión
- En la tabla **Cargue de documentos** de `/matricula`, las insignias **Obligatorio** y **EN_REVISION** tienen ahora mayor contraste y jerarquía: peso `800` para obligatoriedad, relleno más amplio y combinaciones de fondo, texto y borde derivadas de `--primary`. El cambio sigue el patrón del módulo de documentos de admisión y funciona con los temas claro y oscuro.
- Se retiró por completo la línea técnica `Estado de carga: {uploadStatus}` de cada fila porque duplicaba información interna sin aportar al estudiante. Se mantienen el nombre del archivo cargado o seleccionado, la columna **Estado**, las observaciones y cualquier mensaje de error.
- No cambiaron lógica de carga, bloqueos, acciones, tipos, endpoints ni contratos HTTP.

## Paths, contratos y salida esperada
- Renderizado: `src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.tsx`.
- Presentación: `src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.css`.
- El componente sigue recibiendo `DocumentoRequerido[]`; `uploadStatus` continúa determinando si hay archivo y si **Cargar**, **Ver** o **Descargar** están disponibles, aunque ya no se imprime su valor literal.
- Salida esperada: **Obligatorio** y **EN_REVISION** se distinguen claramente usando el color primario del tema, y debajo del archivo no aparece ningún texto `Estado de carga: UPLOADED` (ni otro estado técnico).

## Entorno, retos y próximos pasos
- Raíz única: `/workspace/SAPP-frontend`. Reutilizar su `node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm. No se añadieron paquetes, variables, schemas, seeds o datasets.
- Entorno verificado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. Las demás versiones exactas están fijadas en `package-lock.json`.
- Pendiente validar la ruta protegida con una sesión real de estudiante y documentos en revisión, tanto en modo claro como oscuro. No se generó captura local porque el contenedor no dispone de Chromium, Chrome, Firefox, Playwright ni Puppeteer; la ruta requiere además sesión y datos del backend.

## Verificación reciente
- `npx eslint src/modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable.tsx` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-77ECpyQ7.css` e `index-Pi6Gxfw2.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 545.35 kB.
- No existe script `test` en `package.json`.

---

# Update 2026-09-16 — Notificación fiable al terminar la revisión documental de matrícula

## Estado actual y decisión
- En el detalle de matrícula de coordinación, una aprobación o rechazo exitoso se incorpora al checklist recargado antes de evaluar si terminó la revisión. Esto evita que una lectura inmediatamente posterior, todavía desactualizada, impida reconocer la decisión sobre el último documento.
- Cuando todos los documentos **obligatorios** cargados están en `APROBADO` o `RECHAZADO`, se invoca `POST /sapp/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos` sin body. Los documentos opcionales se excluyen deliberadamente, incluso si están pendientes.
- La protección `notifiedDocumentsMatriculaIdRef` conserva un solo envío exitoso por matrícula durante el montaje. El flujo independiente que avanza automáticamente la matrícula cuando todos los obligatorios están aprobados se mantiene.

## Paths, contratos y salida esperada
- Orquestación y reconciliación local: `src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx` (`applyDocumentoDecision` y `refreshDocumentsAfterDecision`).
- Transporte: `src/modules/matricula/services/matriculaAcademicaService.ts` (`notificarDocumentosCompletosMatricula`).
- Entrada de decisión existente: `PUT /sapp/document` con `{ documentoId, aprobado, observaciones }`. Salida de finalización: `POST /sapp/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos`, autenticado, sin body; admite envelope `ApiResponse<unknown>` o HTTP 204.
- Resultado esperado: al confirmar el último obligatorio, aprobado o rechazado, Network muestra el POST de notificación aunque el GET de documentos inmediatamente posterior aún refleje el estado anterior. No hay cambios de schema, dependencias, variables, seeds ni datasets.

## Entorno, retos y verificación
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, conda, poetry, entornos Python ni un segundo árbol npm. Entorno observado: Node.js 24.15.0 y npm 11.4.2; versiones exactas del frontend en `README.md` y `package-lock.json`.
- Pendiente validar con una sesión institucional una matrícula cuyo último obligatorio se apruebe y otra cuyo último obligatorio se rechace. Confirmar además la idempotencia del endpoint entre recargas/sesiones; la protección del frontend solo cubre el montaje actual.
- El repositorio no define script `test`.
- `npx eslint src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx src/modules/matricula/services/matriculaAcademicaService.ts` (2026-09-16): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-16): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-77ECpyQ7.css` e `index-CrnH0L8m.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 545.62 kB.
- `git diff --check` (2026-09-16): PASS.

---
# Update 2026-09-18 — Migración de roles de posgrados desde `clientRoles`

## Estado actual y decisiones
- `GET /api/sapp/inicio` entrega el rol funcional en `data.clientRoles`. El mapper normaliza ese arreglo (mayúsculas/espacios, aliases y duplicados) y lo usa de forma autoritativa. Solo cuando llega vacío usa el `roles` heredado como compatibilidad temporal; no mezcla ambos arreglos para evitar que un claim obsoleto amplíe permisos. Los nombres canónicos quedan en `session.user.roles` y los claims específicos normalizados en `session.user.clientRoles`.
- Los nombres canónicos son `ADMIN_POSGRADOS`, `COORDINADOR_POSGRADOS`, `SECRETARIA_POSGRADOS`, `ESTUDIANTE_POSGRADOS` y `DOCENTE_POSGRADOS`. La capa central de roles traduce además `ADMIN_SAPP`/`ADMIN`, `COORDINADOR`, `SECRETARIA`, `ESTUDIANTE`, `PROFESOR` y `DOCENTE`; esto mantiene operativas las comparaciones antiguas que todavía existen en páginas y evita una migración fragmentada. El identificador heredado correcto usa guion bajo (`ADMIN_SAPP`), no guion medio.
- `ROLES` ya expone los valores nuevos. `PROFESOR` y `DOCENTE` son alias semánticos de `DOCENTE_POSGRADOS`, mientras `DIRECTOR` permanece sin cambio porque no fue incluido en la migración solicitada.
- La presentación está desacoplada de autorización: la cabecera compartida y `/perfil` usan `formatRoleLabel`, que elimina `_POSGRADOS` y convierte guiones bajos restantes en espacios. El rol genérico `DEFAULT-ROLES-EISI` sigue oculto. El usuario ve, por ejemplo, `COORDINADOR`, no `COORDINADOR_POSGRADOS`.

## Paths, contrato y salida esperada
- Normalización, aliases, comparación y etiqueta: `src/modules/auth/roles/roleUtils.ts`.
- Constantes funcionales: `src/auth/roleGuards.ts`.
- Contrato y mapper de inicio: `src/api/authTypes.ts` y `src/api/authMappers.ts`.
- Superficies visibles: `src/components/ModuleLayout/ModuleLayout.tsx` y `src/pages/Perfil/PerfilPage.tsx`.
- Entrada principal esperada: `{ "ok": true, "data": { ..., "clientRoles": ["COORDINADOR_POSGRADOS"] } }`. Dentro del mapper se recibe el objeto `data`; `roles` puede no existir. Resultado esperado: `session.user.roles` contiene `COORDINADOR_POSGRADOS`, las guardas de coordinación autorizan las mismas rutas/acciones de antes y la UI imprime `COORDINADOR`.
- No cambiaron endpoints, navegación, schemas de base de datos, dependencias, variables de entorno, seeds ni datasets.

## Retos y próximos pasos
1. Validar contra el gateway institucional una sesión por cada uno de los cinco roles nuevos y confirmar sidebar, rutas protegidas y acciones de cada módulo.
2. Confirmar si `DIRECTOR` y roles genéricos tendrán una nomenclatura nueva. Hasta recibir ese contrato se conservan literalmente y no se les concede acceso adicional.
3. Cuando todos los ambientes de gateway hayan retirado `roles`, se puede eliminar su fallback del mapper y los aliases heredados; hacerlo antes rompería ambientes en transición.
4. El repositorio no cuenta con Vitest. Conviene añadir pruebas unitarias para normalización, equivalencia heredada, deduplicación y etiquetas cuando se incorpore un runner.

## Entorno y verificaciones
- Raíz única `/workspace/SAPP-frontend`; reutilizar Node.js/npm y `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm.
- Entorno observado: Node.js 24.15.0 y npm 11.4.2. Lockfile: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/modules/auth/roles/roleUtils.ts src/auth/roleGuards.ts src/api/authMappers.ts src/api/authTypes.ts src/components/ModuleLayout/ModuleLayout.tsx src/pages/Perfil/PerfilPage.tsx` (2026-09-18): PASS; npm mostró solo el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; TypeScript y rolldown-vite transformaron 259 módulos y generaron `dist/assets/index-V1VYF5Kd.css` e `index-CZ50IDvu.js`. Persiste el warning informativo por el chunk JavaScript de 547.66 kB.
- `git diff --check` (2026-09-18): PASS. `npm run lint` global sigue fallando por 9 errores y 1 warning preexistentes en servicios API, rutas/mocks de admisiones, documentos y solicitudes; ninguno está en los archivos de esta migración. No existe script `test` en `package.json`.
- No se generó captura: el contenedor no tiene Chromium, Chrome ni Firefox, y las superficies de rol requieren además una sesión institucional.
- Corrección 2026-09-18: el alias heredado de administración se rectificó de `ADMIN-SAPP` a `ADMIN_SAPP`. `npx eslint src/modules/auth/roles/roleUtils.ts`, `npm run build`, `git diff --check` y la comprobación de ausencia global de `ADMIN-SAPP` pasaron; el build generó `dist/assets/index-BOMLGh01.js` y mantuvo únicamente el warning informativo de tamaño de chunk.

---
# Update 2026-09-18 — Módulo de coordinación para créditos condonables

## Estado actual y decisiones
- Se agregó `/creditos-condonables`, visible y accesible exclusivamente para `COORDINADOR_POSGRADOS`. La parte superior lista trámites pendientes y filtra por estado; la inferior contiene solo `APROBADA`/`RECHAZADA` y filtra por estado y por nombre/código UIS del estudiante. Ambos listados tienen paginación de 10 filas.
- Los códigos funcionales son `CRED_COND` y `RENOV_CRED_COND`. La detección quedó centralizada y esos registros, incluidos los asignados, se ocultan de `/solicitudes` solo para coordinación. Estudiante, docente, director y administración conservan el comportamiento previo.
- El detalle se reutiliza en `/creditos-condonables/:solicitudId`, incluidas carga documental y aprobación/rechazo; el botón de regreso reconoce el módulo de origen. Las dos rutas están protegidas por `RequireRoles` y no se añadieron permisos al resto de perfiles.

## Paths, contratos y salida esperada
- Página/estilos: `src/pages/CreditosCondonablesCoordinacion/`; rutas: `src/app/routes/creditosCondonablesRoutes.tsx`; navegación: `src/app/navigationItems.ts`.
- Clasificación compartida: `src/modules/solicitudes/utils/creditoCondonable.ts`; exclusión del listado general: `SolicitudesCoordinadorView.tsx`; detalle reutilizado: `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`.
- Contratos sin cambios: `GET /sapp/solicitudesAcademicas`, `GET /sapp/estadosSolicitud` y `GET /sapp/solicitudesAcademicas/{id}`. Se espera el DTO `SolicitudAcademicaDto`, en especial `tipoSolicitudCodigo`, `estadoId`/`estadoSigla`, `estudiante` y `codigoEstudianteUis`. No hay schemas, datasets, seeds, variables ni paquetes nuevos.

## Retos y próximos pasos
1. Validar con una sesión institucional de coordinación que ambos códigos reales llegan exactamente como `CRED_COND`/`RENOV_CRED_COND` y que no aparecen en el módulo general.
2. Confirmar con producto si `DEVUELTA` debe seguir en pendientes (decisión actual: todo estado distinto de `APROBADA`/`RECHAZADA` es pendiente).
3. Verificar visualmente temas claro/oscuro y responsive con datos reales. No hubo captura local: el contenedor no tiene Chromium, Chrome ni Firefox y la ruta requiere sesión/backend.

## Entorno y verificación
- Usar únicamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Node observado 24.15.0 y npm 11.4.2; versiones completas en `README.md`/`package-lock.json`.
- `npx eslint src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx src/pages/Solicitudes/SolicitudesPage.tsx src/pages/SolicitudDetalle/SolicitudDetallePage.tsx src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx src/modules/solicitudes/utils/creditoCondonable.ts src/app/routes/creditosCondonablesRoutes.tsx src/app/navigationItems.ts` (2026-09-18): PASS; solo apareció el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; 264 módulos, `dist/assets/index-h-NvBuld.css` e `index-BgNGRrEM.js`. Persiste únicamente el warning informativo del chunk de 552.72 kB. El repositorio no define script `test`.

---
# Update 2026-09-18 — Gestión del rol de profesores de posgrados

## Estado actual y decisiones
- El catálogo autoritativo es `GET /sapp/docentes`; se dejó de consumir `/docentes/estado?skip=0` y de interpretar la respuesta paginada anterior. Su `data` es un arreglo plano.
- La creación de convocatorias solo ofrece elementos con `tieneRolDocentePosgrados: true`. La asignación de docentes a grupos aplica el mismo criterio.
- `/gestion-profesores` presenta primero profesores de posgrados y luego profesores EISI disponibles. Ambos listados comparten filtro por nombre, documento o correo, tienen paginación local de 10 filas y se actualizan desde el servidor después de asignar o retirar el rol.
- Las mutaciones solicitan confirmación, bloquean acciones concurrentes, muestran el resultado y ejecutan una nueva consulta completa; no se mueve un registro de forma optimista.

## Paths, contratos y salida esperada
- Transporte y DTO: `src/api/gruposInvestigacionService.ts` y `src/api/gruposInvestigacionTypes.ts`.
- Adaptador de convocatoria: `src/modules/admisiones/services/profesoresMockService.ts` (el nombre es heredado; ya consume el API real).
- Página y estilos: `src/pages/GestionProfesores/GestionProfesoresPage.tsx` y `.css`.
- Respuesta esperada de `GET /sapp/docentes`: `{ ok, message, data: [{ documentNumber, email, fullName, tieneRolDocentePosgrados, uuid }] }`.
- Asignar: `POST /sapp/docentes/{uuid}/asignarRolDocentePosgrados`, sin body. Retirar: `DELETE /sapp/docentes/{uuid}/rolDocentePosgrados`, sin body. Ambos admiten envelope normal o HTTP 204.
- Resultado esperado: tras una asignación el profesor aparece en el listado superior y desaparece del inferior; al retirarlo ocurre lo contrario. Una convocatoria nunca ofrece un profesor cuyo indicador sea `false`.

## Retos y próximos pasos
1. Validar los tres endpoints con el gateway institucional y confirmar si las mutaciones responden envelope JSON o 204 (el cliente soporta ambos).
2. Validar visualmente la ruta protegida en escritorio/móvil y temas claro/oscuro con suficientes registros para recorrer la paginación.
3. Confirmar si retirar el rol debe impedirse cuando el profesor tiene evaluaciones o grupos activos; esa regla corresponde al backend y todavía no fue especificada.

## Entorno y verificación
- Reutilizar únicamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. No se agregaron dependencias, variables, schemas, seeds o datasets.
- Entorno observado: Node.js 24.15.0 y npm 11.4.2. Lockfile: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/api/gruposInvestigacionService.ts src/api/gruposInvestigacionTypes.ts src/modules/admisiones/services/profesoresMockService.ts src/pages/GestionProfesores/GestionProfesoresPage.tsx`: PASS; npm mostró solo el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; 271 módulos y assets `index-gLMwS9CI.css`/`index-Dk9dYf_G.js`; permanece el warning informativo de chunk mayor de 500 kB.
- No existe script `test`. No se generó captura porque el contenedor no dispone de Chromium, Chrome ni Firefox y la ruta necesita sesión/backend institucional.

---
# Update 2026-09-18 — Actas de comité y de consejo

## Estado actual y decisiones
- El formulario de `/actas` ahora exige seleccionar **Comité Asesor de Posgrados** o **Consejo Académico**. Comité es el valor inicial para conservar el comportamiento anterior.
- La creación incluye el nuevo booleano `tipoConsejo`: `false` representa comité y `true` representa consejo. El listado también expone esa clasificación con su nombre institucional.
- La nomenclatura generada conserva el consecutivo y año del flujo existente, pero incorpora el tipo: `ACTA_COMITE_XXX-AAAA` o `ACTA_CONSEJO_XXX-AAAA`. Al cambiar el selector, la vista previa del código se actualiza antes de enviar.

## Paths, contratos y salida esperada
- Formulario, payload, nomenclatura y tabla: `src/pages/Actas/ActasPage.tsx`; ajuste responsive del prefijo: `src/pages/Actas/ActasPage.css`; DTOs: `src/modules/actas/types.ts`.
- `POST /sapp/actas` conserva `nombre`, `codigo`, `fechaCreacion`, `observaciones`, `contenidoBase64`, `mimeType`, `tamanoBytes` y `checksum`, y añade obligatoriamente `tipoConsejo: boolean`. Ejemplo de comité: `{ "codigo": "ACTA_COMITE_001-2026", "tipoConsejo": false, ... }`; para consejo: `{ "codigo": "ACTA_CONSEJO_001-2026", "tipoConsejo": true, ... }`.
- `GET /sapp/actas` debe devolver `tipoConsejo` en cada `ActaDto`; la UI interpreta `true` como **Consejo Académico** y `false` como **Comité Asesor de Posgrados**. No cambiaron endpoints, variables, dependencias, schemas, seeds ni datasets.

## Retos y próximos pasos
1. Validar ambas creaciones contra el backend institucional y confirmar que persiste/devuelve el booleano.
2. Confirmar con producto si el año debe continuar después de `XXX`; se mantuvo porque el pedido indicó conservar el funcionamiento actual y solo agregar `COMITE` o `CONSEJO`.
3. Revisar visualmente escritorio/móvil y modos claro/oscuro con sesión real. No se tomó captura: el contenedor no dispone de Chromium, Chrome, Firefox, Playwright ni Puppeteer, y la ruta protegida requiere backend/sesión.

## Entorno y verificación
- Usar exclusivamente `/workspace/SAPP-frontend` y reutilizar `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/pages/Actas/ActasPage.tsx src/modules/actas/types.ts`: PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build`: PASS; transformó 271 módulos y generó `dist/assets/index-CNYnAK7V.css` e `index-Cw0ZFhzY.js`. Persiste solo el warning informativo por el chunk JavaScript de 602.16 kB. No existe script `test`.
- `git diff --check`: PASS.
# Update 2026-09-18 — Estado de firma por programa y modalidad editorial

## Estado actual y decisiones
- El texto visible de `PFIR_DIR_TG` ahora depende de `programaAcademico`: los valores que contienen **MAESTRIA** o la sigla **MISI** muestran **POR FIRMA DIRECTOR DE TRABAJO INVESTIGACION**; los que contienen **DOCTORADO** o **DCC** muestran **POR FIRMA DIRECTOR DE TESIS**. La comparación ignora tildes y mayúsculas. Un programa ausente/desconocido conserva **POR FIRMA DIRECTOR DE TG** para no inferir un nivel incorrecto.
- `StatusBadge` recibe opcionalmente `programaAcademico`; tabla, tarjetas y detalle ya lo entregan. La sigla, los filtros y el estado recibido del backend no cambian: el ajuste es exclusivamente de presentación.
- En solicitudes `CRED_COND` y `RENOV_CRED_COND`, seleccionar la modalidad del catálogo con `id: 2` (**EDICIÓN DE REVISTAS CIENTIFICAS**) oculta motivos/actividades, ubicación, campos adicionales de renovación y toda previsualización. El estudiante pasa directamente a Documentos; el selector del sistema operativo acepta PDF y una validación defensiva rechaza otro formato.
- El submit sigue creando la solicitud con `modalidadId: 2`. Como no se capturan motivos, `SolicitudesEstudianteView` omite `motivosCreditoCondonable` del request. Los documentos se cargan después con el flujo existente. No se añadieron dependencias, variables, seeds, datasets ni cambios de backend.

## Paths y contratos
- Etiqueta por programa: `src/modules/solicitudes/utils/estadoSolicitud.ts`; consumo visual: `src/modules/solicitudes/components/StatusBadge/StatusBadge.tsx`, `SolicitudesTable/SolicitudesTable.tsx`, `SolicitudCard/SolicitudCard.tsx` y `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`.
- Flujo especial: `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx`. Discriminante deliberado: `modalidadId === 2`, proveniente de `GET /sapp/modalidadContraprestacion`; no depender del texto susceptible a tildes o cambios editoriales.
- Salida esperada para modalidad 2: creación mediante el contrato existente con `estudianteId`, `tipoSolicitudId`, `fechaResolucion`, `observaciones` y `modalidadId: 2`; sin llamada a previsualización y sin datos de prediligenciamiento. Luego cada PDF seleccionado usa el endpoint documental existente. Los documentos obligatorios continúan validándose.

## Retos y próximos pasos
1. Validar con respuestas reales los valores exactos de `programaAcademico` para maestría y doctorado, tanto en listado como detalle.
2. Confirmar con backend/producto que modalidad 2 nunca necesita `motivosCreditoCondonable`, incluso para renovación, y que sus requisitos documentales retornados por tipo de trámite son los PDF correctos.
3. Realizar prueba E2E autenticada de ambos tipos de crédito: modalidad 2 no debe llamar al endpoint de previsualización, debe rechazar un archivo no PDF y debe registrar/cargar los PDF seleccionados.
4. Captura visual pendiente: el contenedor no cuenta con Chromium/Chrome/Firefox y la pantalla protegida necesita sesión y catálogos institucionales.

## Entorno y verificación
- Usar únicamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. `npm ci` reproduce `package-lock.json`; no hay seeds ni script `test`.
- `npm run build` (2026-09-18): PASS; 271 módulos transformados, artefactos `dist/assets/index-CNYnAK7V.css` e `index-BWeMOHZP.js`. Solo apareció el warning ambiental `Unknown env config "http-proxy"` y el aviso informativo por el chunk JS de 603.04 kB.

---

---
# Update 2026-09-18 — Actualización de archivos desde el detalle del estudiante

## Estado actual y decisiones
- Las tarjetas documentales de **Admisión** y **Matrículas** en `/coordinacion/estudiantes/:estudianteId` ahora muestran **Actualizar documento** junto a **Ver** y **Descargar** cuando ya existe un archivo.
- Los requisitos pendientes conservan **Cargar documento**. Ambas acciones comparten selección de formatos, cálculo SHA-256, conversión Base64, estado de progreso por tarjeta y refresco posterior de la consulta agregada.
- La actualización reutiliza el contrato vigente de carga; no se añadió un endpoint de reemplazo ni se envía el `documentoId`. El backend identifica el requisito por `tramiteId` + `tipoDocumentoTramiteId` y administra `version`, mientras que el frontend vuelve a consultar la metadata autoritativa.

## Paths, contratos y salida esperada
- Vista: `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx`; estilos existentes: `src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.css`; transporte compartido: `src/api/documentUploadService.ts`.
- Entrada de metadata: `GET /sapp/document/by-estudiante/{codigoEstudianteUis}`. Cada documento actualizable necesita `tramiteId` en su grupo y `tipoDocumentoTramiteId` en su metadata.
- Escritura: `POST /sapp/document` con `{ tipoDocumentoTramiteId, nombreArchivo, tramiteId, usuarioCargaId, aspiranteCargaId: null, contenidoBase64, mimeType, tamanoBytes, checksum }`.
- Salida esperada: tras un POST exitoso se repite el GET agregado; la tarjeta conserva **Ver**, **Descargar** y **Actualizar documento**, y presenta nombre, fecha, tamaño, estado y versión retornados por el servidor. No cambiaron schemas, variables, dependencias, seeds ni datasets.

## Retos y próximos pasos
1. Validar con el backend institucional que un segundo `POST` para el mismo `tramiteId` + `tipoDocumentoTramiteId` genera/reemplaza la versión vigente y no produce un documento duplicado visible.
2. Confirmar en Network que el refresco agregado devuelve el nuevo `id`, `nombreArchivo`, `fechaCarga` y `version` después de actualizar.
3. Probar formatos PDF, DOC/DOCX, PNG y JPEG, además de temas claro/oscuro y responsive, con una sesión real de gestión.

## Entorno y verificación
- Reutilizar exclusivamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js 24.15.0 y npm 11.4.2; las versiones exactas del lockfile están documentadas en `README.md`.
- `npx eslint src/pages/EstudianteDetalleCoordinacion/EstudianteDetalleCoordinacionPage.tsx` (2026-09-18): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-18): PASS; transformó 271 módulos y generó `dist/assets/index-CNYnAK7V.css` e `index-alOfGVtp.js`. Persiste solo el aviso informativo por el chunk JavaScript de 603.07 kB.
- `npm run lint` (2026-09-18): continúa fallando por 9 errores y 1 warning preexistentes en servicios API, guardas/mocks de admisiones y módulos de documentos/solicitudes; el archivo modificado pasa al validarlo de forma aislada.
- `git diff --check` (2026-09-18): PASS. No hay script `test` en `package.json` ni navegador Chrome/Chromium/Firefox disponible para una captura autenticada.
# Update 2026-09-19 — Filtro por tipo en Gestión de actas

## Estado actual y decisión
- El listado de `/actas` incorpora el filtro **Tipo de acta** con tres opciones: **Todos**, **Comité Asesor de Posgrados** y **Consejo Académico**.
- El filtrado ocurre en cliente sobre el catálogo ya cargado, se combina con búsqueda por nombre/código y año, y reinicia la paginación en la página 1 al cambiar. No se agregó una consulta HTTP ni se alteraron contratos.

## Paths, contrato y salida esperada
- Vista y lógica: `src/pages/Actas/ActasPage.tsx`. Los estilos existentes de `sapp-filters-panel` y `sapp-filter-field` se reutilizan sin una hoja nueva.
- Entrada: `GET /sapp/actas`, donde cada `ActaDto` expone `tipoConsejo: boolean`; `true` corresponde a Consejo Académico y `false` a Comité Asesor de Posgrados.
- Salida: **Todos** no restringe el catálogo; **Consejo Académico** conserva registros con `tipoConsejo === true`; **Comité Asesor de Posgrados** conserva registros con `tipoConsejo === false`. Los estados vacío, carga y paginación operan sobre el resultado combinado.
- No se agregaron paquetes, variables, schemas, seeds ni datasets.

## Retos y próximos pasos
1. Validar visualmente con una sesión institucional y datos de ambos tipos que las combinaciones tipo+año+texto producen los resultados esperados.
2. Si el catálogo crece y el backend pagina `GET /sapp/actas`, trasladar los filtros al contrato HTTP antes de asumir que el cliente tiene el conjunto completo.

## Entorno y verificación reciente
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. El proyecto usa Node.js/npm; las versiones exactas están fijadas por `package-lock.json` y resumidas en `README.md`.
- `npx eslint src/pages/Actas/ActasPage.tsx` (2026-09-19): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-19): PASS; TypeScript y rolldown-vite transformaron 271 módulos y generaron `dist/assets/index-Chy-FRr7.css` e `index-CwxD0sSI.js`. Persiste el warning informativo no bloqueante por el chunk JavaScript de 607.10 kB. `git diff --check`: PASS. No existe script `test` en `package.json`.
- No se generó captura: Chromium, Chrome y Firefox no están disponibles en `PATH`, y la ruta protegida requiere backend y sesión institucional para mostrar actas reales.

---
# Update 2026-09-19 (Créditos condonables: combo de estudiante en histórico)

## Estado actual

- El filtro **Estudiante** de `/creditos-condonables`, dentro de **Histórico de solicitudes**, dejó de ser una búsqueda de texto y ahora es un `<select>`.
- Las opciones se deduplican por `estudianteId` a partir de las solicitudes históricas (`APROBADA`/`RECHAZADA`) recibidas en la consulta vigente, se ordenan por nombre en español y muestran `nombre — código UIS` cuando existe código.
- La opción **Todos** conserva el histórico completo. La selección filtra por igualdad exacta de `estudianteId` y reinicia la paginación; **Limpiar filtros** restablece tanto estado como estudiante.

## Contrato y archivos

- Implementación: `src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx`.
- Fuente: `GET /sapp/solicitudesAcademicas`; se reutilizan `SolicitudAcademicaDto.estudianteId`, `estudiante` y `codigoEstudianteUis`. No hay endpoints, schemas, seeds, datasets, variables de entorno ni dependencias nuevas.
- Entorno existente: Node/npm con las versiones fijadas en `package.json`/`package-lock.json`; usar el `node_modules` actual y no crear venv, conda, Poetry ni una segunda instalación de dependencias.

## Próximos pasos y validación

- Validar con el backend autenticado que dos solicitudes históricas del mismo estudiante produzcan una sola opción y que estudiantes con nombres iguales se distingan por código UIS.
- `npx eslint src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx` (2026-09-19): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-19): PASS; 271 módulos transformados, con artefactos `dist/assets/index-C4041SpY.css` y `dist/assets/index-CaQSr3LZ.js`. Vite mostró el warning no bloqueante conocido por el chunk JS mayor a 500 kB.
- `git diff --check` (2026-09-19): PASS.
- No se generó captura: Chromium, Chrome y Firefox no están disponibles en `PATH`, y la ruta protegida necesita backend y sesión institucional para mostrar las solicitudes reales.

# Update 2026-09-20 — Corrección de pestañas móviles en Créditos condonables

## Estado actual y causa confirmada
- En `/creditos-condonables`, **Pendientes** continúa siendo la pestaña móvil inicial. Clic, toque o navegación de teclado actualizan el único estado `activeListing`, que ahora controla efectivamente cuál `tabpanel` queda visible.
- La causa no estaba en los eventos ni en el estado React: el atributo `hidden` cambiaba correctamente, pero `.creditos-condonables__section { display: grid; }` era una regla CSS de autor y prevalecía sobre el estilo de agente de usuario `[hidden] { display: none; }`. Por eso cambiaba el color del tab mientras ambos paneles seguían visibles.
- Se añadió `.creditos-condonables__section[hidden] { display: none; }`. El panel inactivo queda oculto y fuera de navegación/lectores de pantalla; no se desmonta, así que conserva filtro y página. En escritorio `isMobile` hace que ninguno tenga `hidden`, por lo cual se muestran ambos como antes.
- Ambos tabs declaran `type="button"`; conservan `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabIndex`, flechas, `Home` y `End`, y ahora tienen foco visible explícito. El cambio funciona independientemente de que los resultados estén cargando, vacíos o en error porque la selección envuelve el panel completo.

## Paths, contratos y salida esperada
- Lógica/estado/semántica: `src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx`. Visibilidad y foco: `src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.css`.
- Contrato HTTP sin cambios: una carga compartida de solicitudes y estados; alternar pestañas o breakpoints no ejecuta otra consulta. Tampoco cambian permisos, clasificación, contadores ni la ruta `Ver solicitud`.
- Salida móvil esperada: Pendientes → Histórico → Pendientes muestra exactamente un panel, preservando por separado `estadoPendienteId`/`pendingPage` y `estadoHistoricoId`/`estudianteId`/`historyPage`. Salida de escritorio esperada: ambos paneles visibles. Al regresar a móvil se respeta la última pestaña activa.

## Entorno, verificaciones y pendientes
- Raíz única `/workspace/SAPP-frontend`; reutilizar `node_modules`. No crear venv, conda, poetry, entornos Python ni otro árbol npm. Node.js/npm y todas las versiones de paquetes siguen siendo las documentadas en `README.md`; no se agregaron dependencias, variables, seeds ni datasets.
- El proyecto no tiene script ni infraestructura de pruebas de componentes (`package.json` solo expone dev/build/lint/preview), por lo que no se agregó una prueba automatizada artificial.
- `npx eslint src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx` (2026-09-20): PASS; npm mostró únicamente el warning ambiental conocido `Unknown env config "http-proxy"`.
- `npm run build` (2026-09-20): PASS; 271 módulos transformados y artefactos `dist/assets/index-BitnsXae.css` e `index-DZRe2v1A.js`. Persiste el warning informativo no bloqueante por el chunk JS de 616.30 kB. `git diff --check`: PASS.
- `npm run lint` global (2026-09-20): FAIL por los mismos 9 errores y 1 warning preexistentes fuera de los archivos funcionales modificados (`no-explicit-any`, `set-state-in-effect`, variables sin uso, interfaces vacías y una dependencia de hook). El lint focalizado anterior confirma que la corrección no agrega hallazgos.
- Pendiente: prueba manual autenticada en navegador real con datos suficientes para paginar y filtrar ambos listados, cubriendo vacío/carga/error y el cambio móvil → escritorio → móvil. El contenedor no incluye Chromium, Chrome ni Firefox y la ruta necesita sesión/backend institucional; no afirmar que esa interacción se ejecutó aquí.

---
# Update 2026-09-20 — Detalle responsive de inscripción de admisión

## Estado actual y decisiones
- La ruta protegida `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId` y sus hijas `documentos`, `hoja-vida`, `examen` y `entrevistas` ya tienen representación móvil real (tarjetas/bloques), no scroll horizontal como sustituto. El resumen no repite programa ni estado de inscripción; distingue explícitamente el estado de evaluación y muestra `numeroInscripcion` con el fallback histórico existente.
- Los acordeones son controles `<button>` asociados a regiones por `aria-controls`/`aria-labelledby`. La URL continúa determinando la sección abierta, por lo que enlaces directos, recarga y historial conservan el contrato de rutas. Los borradores de nota/observación se guardan en memoria por inscripción y etapa en `evaluacionDraftStore.ts`, sobreviven al desmontaje causado por el cambio de ruta/acordeón y se eliminan después de un PUT exitoso. Cambiar de sección pide confirmación únicamente si hay borradores; cerrar/recargar usa `beforeunload`.
- `EvaluacionEtapaSection` mantiene un único formulario/estado y cambia solo mediante CSS de tabla en escritorio a bloques en móvil. Distingue vacío de cero, no corrige valores silenciosamente y conserva máximo/decimales/validaciones/payload. JSON válido se presenta como lista o pares clave/valor conservando orden y contenido; texto o estructuras anidadas desconocidas no se interpretan y se serializan.
- Hoja de vida sigue obteniendo base64 por el servicio autenticado y crea una URL `blob:` local; no expone token ni URL pública. Abrir y descargar están antes de criterios en móvil, incluso en estado final (son consulta, no edición), y el iframe es opcional. Entrevistas conserva el resumen y el cálculo backend, permisos por evaluador y operación conjunta; los grupos `<details>` no desmontan campos al contraerse. Documentos conserva permisos, condición de continuación y operaciones por documento; muestra resultados inline y previene doble envío con el bloqueo existente.

## Paths, contratos y salida esperada
- Shell/resumen/rutas: `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx` y `.css`; acordeón: `src/modules/admisiones/components/InscripcionAccordionWindow/`.
- Documentos: `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx` y `.css`; validación compartida: `src/modules/documentos/components/ValidationButtons/`. No cambió `aprobarRechazarDocumento` ni la evaluación de obligatorios.
- Evaluaciones/PDF/entrevistas: `src/modules/admisiones/pages/EvaluacionEtapaPage/`; formulario responsive: `src/modules/admisiones/components/EvaluacionEtapaSection/`; borradores transitorios: `src/modules/admisiones/utils/evaluacionDraftStore.ts`.
- Contratos intactos: `GET` de evaluación/documentos, PUT conjunto de `{ id, puntajeAspirante, observaciones }`, inicio/finalización y aprobación/rechazo documental. No cambiaron roles, fórmulas, ponderaciones, rutas, schemas, variables, paquetes, seeds ni datasets.

## Retos y próximos pasos
1. Probar con sesión institucional en 320, 375, 402 y 440 CSS px, landscape, tablet y escritorio, temas claro/oscuro y zoom de texto. Incluir nombres/correos/archivos largos, JSON extenso/anidado, varios evaluadores, cero, vacío, decimales y rechazo del servidor.
2. Validar Atrás/Adelante, apertura/retorno de PDF y teclado virtual en dispositivo real. Los borradores se conservan en memoria durante navegación SPA, no tras una recarga aceptada expresamente por el usuario.
3. Confirmar con lector de pantalla el anuncio de regiones, errores y mensajes de estado. No fue posible capturar ni inspeccionar visualmente: no hay Chromium/Chrome/Firefox en `PATH`, y no se falsificó sesión ni se alteraron evaluaciones reales.

## Entorno y verificación reciente
- Usar solo `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, Poetry, entornos Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No existe script `test`.
- `npx eslint` focalizado sobre los cinco TSX funcionales y el store: PASS. `npm run build`: PASS, 272 módulos, `dist/assets/index-CV-fTsMB.css` e `index-Dlh1BoHO.js`; solo aparece el warning informativo de chunk JS de 623.85 kB.
- `npm run lint`: FAIL por los 9 errores y 1 warning preexistentes fuera de los archivos modificados (tres servicios con `any`, guard de evaluación, mocks, validación documental y tipos/efecto de Solicitudes). El lint focalizado confirma que este cambio no añade hallazgos.

---
# Update 2026-09-21 — Adaptación responsive integral de `/fechas`

## Estado actual y decisiones
- `/fechas` conserva su representación de escritorio. En `max-width: 780px`, períodos y convocatorias reutilizan el mismo `<table>` y las mismas filas/datos, pero CSS los presenta como tarjetas sin ancho mínimo ni scroll horizontal. A 359 px o menos las parejas de fechas pasan a una columna; entre 360 y 780 px usan dos columnas.
- Períodos distingue **Período académico · Inicio/Fin** de **Matrículas · Inicio/Fin**, conserva `—`, orden, cuatro registros por página y edición. Convocatorias conserva filtros, nombres completos de programa, cuatro registros por página para cada programa, observaciones sin elipsis y todas las acciones. Cerrar queda separado visualmente, mantiene `window.confirm`, bloquea solicitudes duplicadas y espera servidor/refresco antes del éxito.
- La fuente de verdad de estado es `ConvocatoriaAdmisionDto.vigente`. `isConvocatoriaVigente` ya no compara fechas con el reloj del navegador; sus consumidores existentes reciben la misma decisión autoritativa del backend.
- Los formularios asociados mantienen contratos, campos y validaciones. Sus cambios son CSS móvil: una columna, `min-width: 0`, inputs/selects de 16 px y controles de 44 px; ambos modales caben en `100dvh` y tienen scroll interno. No se añadieron dependencias ni se cambiaron rutas, permisos, payloads o fechas sin hora.

## Paths, contratos y salida esperada
- Listado/estado/paginación: `src/pages/FechasModule/FechasModulePage.tsx`; presentación: `src/pages/FechasModule/FechasModulePage.css`; estado backend: `src/modules/admisiones/utils/convocatoriaEstado.ts`.
- Formulario de período: `src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx` y `.css`. Creación: `src/modules/admisiones/components/CreateConvocatoriaModal/`. Edición: `src/modules/admisiones/components/EditConvocatoriaFechasModal/`.
- Entradas: `GET /sapp/periodoAcademico/withFechas`, `GET /sapp/convocatoriaAdmision` y catálogos existentes. Escrituras sin cambios: servicios de período, `POST /sapp/convocatoriaAdmision`, `PUT /sapp/convocatoriaAdmision/fechas/{id}` y `PUT /sapp/convocatoriaAdmision/cerrar/{id}`.
- Salida esperada: escritorio idéntico; móvil sin scroll horizontal local, con tarjetas completas, filtros a ancho completo y paginadores independientes. Cambiar viewport no desmonta listados, filtros ni formularios.

## Verificación reciente y limitaciones
- `npx eslint src/pages/FechasModule/FechasModulePage.tsx src/pages/ConfigFechasAdmisiones/ConfigFechasAdmisionesPage.tsx src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx src/modules/admisiones/components/EditConvocatoriaFechasModal/EditConvocatoriaFechasModal.tsx src/modules/admisiones/utils/convocatoriaEstado.ts` (2026-09-21): PASS; solo warning ambiental conocido de npm por `http-proxy`.
- `npm run build` (2026-09-21): PASS; 272 módulos, `dist/assets/index-Bu7Uk1uf.css` y `dist/assets/index-D6zrhrGt.js`; aviso informativo por chunk JS de 631.44 kB.
- `git diff --check` (2026-09-21): PASS antes de actualizar documentación.
- No hay Chromium, Chrome ni Firefox en `PATH`; por ello no se pudo tomar captura, medir en navegador 320/375/402/440 px, probar Safari/iOS real, teclado virtual, temas con renderizado, transición móvil→escritorio→móvil ni flujos autenticados contra backend. Estas validaciones manuales siguen pendientes y no deben presentarse como ejecutadas.

## Retos y próximos pasos
1. Con sesión institucional y mocks/backend de pruebas, validar 320, 375, 402 y 440 CSS px, landscape, tablet y escritorio; cubrir temas claro/oscuro, zoom, nombres y observaciones extensos, ausentes, carga, error y listas vacías.
2. Probar creación/edición/cierre sin alterar calendarios reales: rechazo del servidor debe conservar valores; abrir y guardar una fecha sin cambios no debe desplazar el día; doble toque en Cerrar debe producir una sola solicitud.
3. Comparar captura de escritorio antes/después con los mismos datos y verificar foco/restauración de foco de modales y controles con lector de pantalla en un navegador real.

## Entorno
- Reutilizar exclusivamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, conda, Poetry, entornos Python ni otra instalación npm. No hay seeds ni script `test`.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
# Update 2026-09-21 — búsqueda de profesores sin diacríticos

## Estado actual y decisión
- Se corrigió el filtro local de `/coordinacion/profesores`: antes solo convertía
  a minúsculas, por lo que `andres leo` no era substring de `ANDRÉS LEONARDO`.
  `normalize` ahora aplica normalización Unicode NFD y elimina marcas diacríticas
  antes de comparar nombre, documento y correo.
- La misma función ya alimentaba el buscador general, el buscador de profesores
  disponibles y las comparaciones para excluir integrantes de un grupo; por eso
  todos esos puntos quedan consistentes. No cambiaron UI, API, permisos ni DTO.

## Paths, contratos y salida esperada
- Implementación: `src/pages/GestionProfesores/GestionProfesoresPage.tsx`.
- Entrada vigente: `getDocentes()` entrega `DocenteDto` y se buscan localmente
  `fullName`, `email` y `documentNumber`. No se añadieron endpoints, schemas,
  variables, seeds, datasets ni dependencias.
- Resultado esperado: `andres leo`, `ANDRÉS LEO` y otras variantes de mayúsculas
  o tildes encuentran `ANDRÉS LEONARDO GONZÁLEZ GÓMEZ`; documento y correo siguen
  siendo buscables como antes.

## Retos y próximos pasos
1. Validar con sesión institucional búsquedas con y sin tildes en las pestañas
   **Profesores** y **Grupos de investigación**, incluidos vacíos y paginación.
2. Si se incorpora una suite, extraer la normalización a una utilidad y cubrir
   tildes, espacios y caracteres Unicode con pruebas unitarias.
3. No duplicar ambientes: reutilizar `/workspace/SAPP-frontend/node_modules`.
   No crear venv, Conda, Poetry, entornos Python ni otro árbol npm.

## Entorno y verificación
- Entorno único: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router
  DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2,
  ESLint 9.39.2 y typescript-eslint 8.51.0.
- `npx eslint src/pages/GestionProfesores/GestionProfesoresPage.tsx`: PASS.
- `npm run build`: PASS (272 módulos; persiste únicamente el warning informativo
  del chunk JS mayor a 500 kB). `git diff --check`: PASS.
- `npm run lint`: conserva 9 errores y 1 warning preexistentes fuera del archivo
  modificado (servicios con `any`, guard de evaluación, mocks, documentos y
  solicitudes). El proyecto no define script `test`.

---
## Actualización 2026-09-21 — consulta de archivos en detalle de inscripción

### Estado actual

- En `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`, las acciones **Ver** y **Descargar** se muestran para usuarios gestores aun si la inscripción alcanzó un estado final.
- El listado `GET /sapp/document?codigoTipoTramite=...&tramiteId=...` puede entregar únicamente metadatos. Si no incluye Base64, cada acción obtiene el archivo con `getDocumentById(documentoId)`, que consume `GET /sapp/document/{documentoId}`; conserva compatibilidad con respuestas del listado que sí incluyan contenido.
- **Ver** reserva la pestaña en el mismo gesto del clic antes de esperar la consulta autenticada, evitando que el bloqueador de ventanas emergentes descarte la previsualización asíncrona; la utilidad compartida acepta esa ventana como destino.
- La celda **Archivo cargado** ya no muestra el icono decorativo; conserva nombre y versión.

### Contrato y salida esperada

- `GET /sapp/document/{documentoId}` debe responder `ApiResponse<DocumentoCompletoDto>` con `data.contenidoBase64`; `mimeType` y `nombreArchivo` pueden ser nulos y el frontend usa los metadatos/fallback PDF.
- Un documento marcado como cargado y con `idDocumento` habilita ambas acciones. Mientras se consulta o procesa, ambos botones quedan deshabilitados y muestran el estado de progreso correspondiente.
- Las acciones de aprobación/rechazo y **Continuar evaluación** permanecen bloqueadas en estados finales; solo la lectura/descarga continúa disponible.

### Próximos pasos / retos abiertos

1. Verificar contra backend real un documento cuyo endpoint de listado omita el Base64 y confirmar permisos del endpoint individual para los roles de posgrados.
2. Agregar una prueba de componente cuando exista infraestructura de tests, cubriendo el fallback al endpoint individual y una inscripción finalizada.

### Entorno y pruebas

- Reutilizar la instalación npm del repositorio (`node_modules`); no crear entornos venv/conda/poetry para este frontend.
- Versiones exactas y comandos continúan documentados en `package.json`/`package-lock.json` y README.
- `npx eslint src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx src/shared/files/base64FileUtils.ts`: PASS. `npm run build`: PASS (273 módulos; warning informativo conocido por chunk principal mayor de 500 kB). `git diff --check`: PASS. El lint global continúa fallando por 9 errores y 1 warning preexistentes en archivos no relacionados (`creditosService`, `matriculaService`, `solicitudesService`, `RequireEvaluacionEnabled`, mocks/validación y tipos/componentes de solicitudes).

---
# Update 2026-09-22 — clasificación de solicitudes de tema por programa

## Estado actual y decisión
- El tipo compartido `tipoSolicitudId: 13` / `tipoSolicitudCodigo: TEMA_T` ya no aparece simultáneamente en maestría y doctorado. `correspondeSolicitudANivel` lo clasifica por el valor ya disponible en `programaAcademico`: si contiene `DCC`, corresponde solo a **Tesis doctoral**; en caso contrario corresponde solo a **Trabajo de investigación de maestría**.
- El filtro se aplica a los resultados asignados y generales de coordinación y al listado/refresco posterior a creación del estudiante. Los tipos no compartidos siguen determinados por `TIPOS_TRABAJO_GRADO_POR_NIVEL`.
- `getNivelTrabajoGrado` reconoce la sigla `DCC`; esto evita redirigir a un estudiante de `61204 - DCC` al apartado de maestría. Todo valor que no contenga esa sigla se clasifica como maestría conforme a la regla acordada.

## Paths, contrato y salida esperada
- Regla de dominio de presentación: `src/modules/trabajos-grado/constants.ts`.
- Integración del módulo: `src/pages/TrabajosGrado/TrabajosGradoPage.tsx`.
- Punto extensible de filtrado de filas: `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx` y `src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx`.
- El contrato REST no cambia. El listado debe seguir entregando `tipoSolicitudId`, `tipoSolicitudCodigo` y `programaAcademico`; ejemplo relevante: `{ "tipoSolicitudId": 13, "tipoSolicitudCodigo": "TEMA_T", "programaAcademico": "61204 - DCC" }` se ve solo en `/trabajos-grado/doctorado`. El mismo tipo con un programa que no contiene `DCC` se ve solo en `/trabajos-grado/maestria`.
- No se agregaron endpoints, schemas, paquetes, variables, seeds ni datasets.

## Retos y próximos pasos
1. Validar con backend y sesión institucional los listados **Solicitudes asignadas** y **Solicitudes** en ambas pestañas, incluida la solicitud 51 del ejemplo, y confirmar que cada ID aparece exactamente una vez.
2. Confirmar los valores reales de `programaAcademico`; la regla solicitada trata un valor ausente o sin `DCC` como maestría. Si backend incorpora otra sigla doctoral, acordar primero el contrato antes de ampliar la inferencia.
3. Cuando exista infraestructura de pruebas, cubrir la clasificación `DCC`/no `DCC` y los tres flujos de filtrado. No hay script `test` actualmente.

## Entorno
- Reutilizar únicamente `/workspace/SAPP-frontend` y su `node_modules`; no crear venv, Conda, Poetry, entornos Python ni otra instalación npm. No hay seeds para este flujo.
- Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.

## Verificación de esta corrección
- `npx eslint src/modules/trabajos-grado/constants.ts src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx src/pages/TrabajosGrado/TrabajosGradoPage.tsx`: PASS.
- `npm run build`: PASS; 278 módulos, `dist/assets/index-BBLqYFql.css` e `index-CwDe3c1W.js`; persiste solo el aviso informativo conocido por el chunk JS de 642.58 kB.
- La comprobación visual autenticada queda pendiente: el contenedor no ofrece navegador ni backend/sesión institucional. El cambio no añade estilos ni elementos visuales; modifica qué filas existentes recibe cada apartado.
# Update 2026-09-23 — catálogo completo de estados en proyectos de grado

## Corrección 2026-09-23 — estado enviado a consejo

- Se identificó que el DTO real entrega `estadoId: 10`, `estadoSigla: "ENVIADA_CONSEJO"` y `estado: "ENVIADA A CONSEJO"`, pero la unión tipada, el catálogo local y el mapa de normalización no incluían esa sigla. Como el listado y el detalle pasan preferentemente `estadoSigla` al `StatusBadge`, la normalización devolvía `UNKNOWN` y la UI mostraba **DESCONOCIDO**.
- `src/modules/solicitudes/utils/estadoSolicitud.ts` incorpora el estado 10, su etiqueta **ENVIADA A CONSEJO ACADEMICO** y aliases descriptivos con/sin tilde. `StatusBadge.tsx` reutiliza la variante visual `enviada`. La prueba dirigida cubre la sigla, el nombre devuelto por el backend y el registro por id.
- No cambian endpoints ni schemas. Entrada esperada: el contrato anterior; salida visual esperada: **ENVIADA A CONSEJO ACADEMICO** tanto en el listado como en el detalle de proyectos de grado. Reutilizar `node_modules`; no crear venv, Conda, Poetry ni otro entorno.
- Verificación local: `node --test tests/estadoSolicitud.test.ts` PASS (3/3), ESLint focalizado PASS, `npm run build` PASS (283 módulos; CSS 231.65 kB y JS 666.70 kB) y `git diff --check` PASS. El build conserva el aviso informativo conocido por el chunk JavaScript mayor de 500 kB.


## Estado actual y decisión

- `TrabajosGradoPage` activa `showAllEstadoOptions` en las vistas compartidas de estudiante y coordinación. Por ello, los filtros de ambos niveles (maestría y doctorado) ofrecen todo el catálogo recibido desde `GET /sapp/estadosSolicitud`, no solamente los estados actualmente representados por solicitudes del listado ni únicamente los estados propios de evaluación del proyecto.
- Las vistas compartidas mantienen por defecto el filtrado histórico mediante `getEstadosPresentesEnSolicitudes`; el nuevo comportamiento es opt-in y, por ahora, exclusivo de Proyectos de grado. Elegir un estado sin coincidencias muestra el vacío normal del listado.
- El cambio solo amplía las opciones del filtro. No autoriza transiciones en frontend ni modifica el proceso privado de evaluación, contratos, endpoints, DTO, roles, dependencias, variables, schemas, seeds o datasets. Las transiciones válidas siguen bajo control del backend.

## Paths, validación pendiente y entorno

- Integración: `src/pages/TrabajosGrado/TrabajosGradoPage.tsx`. Props y selección de catálogo: `src/modules/solicitudes/components/SolicitudesEstudianteView/SolicitudesEstudianteView.tsx` y `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx`.
- Pendiente verificar con sesión institucional que el selector muestre los estados generales y los de evaluación, y que cada opción filtre correctamente para estudiante y coordinación en ambos niveles. No crear otro entorno: reutilizar `/workspace/SAPP-frontend/node_modules`; el proyecto no usa venv, Conda ni Poetry. Node.js 24.15.0 y npm 11.4.2; versiones exactas restantes en `package-lock.json` y `README.md`.
- Verificación local del 2026-09-23: prueba Node dirigida PASS (2/2), ESLint focalizado PASS, build PASS (283 módulos; `index-CagCtW9j.css` 231.16 kB e `index-DhEovsif.js` 666.35 kB) y `git diff --check` PASS. Persisten únicamente el warning ambiental de npm por `http-proxy` y el aviso informativo del chunk JavaScript mayor de 500 kB.

---

---

# Update 2026-09-23 — sincronización y detalle de evaluaciones de jurados

## Estado actual y decisiones
- `ProcesoEvaluacionPanel` recibe `onUpdated` desde `SolicitudDetallePage`. Después
  de cualquier mutación exitosa (designar, reemplazar, retirar o reinvitar un
  jurado; definir documento; enviar a ajustes; programar sustentación; registrar
  resultado) espera en paralelo el GET canónico del proceso y la recarga de la
  solicitud/adjuntos. Los recordatorios aplican la misma recarga. La UI ya no
  depende del DTO devuelto por la mutación para quedar sincronizada.
- La columna Evaluaciones dejó de concatenar códigos. Cada registro muestra su
  momento y, según `momentoCodigo`, el concepto de `CONCEPTO_DOCUMENTO` o el
  resultado de `SUSTENTACION`; las observaciones se muestran solo si contienen
  texto. El contrato admite los aliases reales `momento`, `concepto` y
  `resultado`, además de `*Nombre` y `*Codigo`.

## Paths, contrato y salida esperada
- Coordinación visual/recarga: `src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx`
  y `.css`; callback padre en `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`;
  aliases DTO en `src/modules/trabajos-grado/evaluacion/types.ts`.
- Después de una acción exitosa se esperan `GET
  /sapp/procesoEvaluacionTg/solicitud/{solicitudId}`, `GET` de la solicitud y la
  consulta de adjuntos del trámite. Si una recarga falla, la acción no se anuncia
  como sincronizada y se muestra el error; el usuario puede reintentar.
- Ejemplo de presentación: `CONCEPTO_DOCUMENTO` → «Concepto del documento»,
  «Concepto: Favorable» y observaciones opcionales; `SUSTENTACION` →
  «Sustentación», «Resultado: Aprobado» y observaciones opcionales.

## Entorno y próximos pasos
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear
  venv, Conda, Poetry ni otro árbol npm. Node.js 24.15.0, npm 11.4.2,
  React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y
  typescript-eslint 8.51.0. No hay seeds ni datasets para este flujo.
- Pendiente validar con backend y sesión de coordinación las recargas después de
  cada estado y la presentación con observaciones extensas. El contenedor no
  dispone de navegador instalado; documentar cualquier captura realizada desde
  un entorno autenticado externo.
- Verificación 2026-09-23: ESLint focalizado de los tres archivos TS/TSX
  modificados PASS; `npm run build` PASS (283 módulos, CSS 231.65 kB y JS
  667.25 kB), con el aviso informativo conocido por chunk >500 kB;
  `git diff --check` PASS. `npm run lint` conserva 9 errores y 1 warning
  preexistentes fuera de este cambio. No se tomó captura porque
  `command -v chromium || command -v chromium-browser || command -v
  google-chrome || command -v firefox` no encontró navegador y el flujo requiere
  sesión/backend institucionales.

---

# Update 2026-09-23 — depuración visual de acciones del proceso de evaluación

## Estado actual y decisiones
- `ProcesoEvaluacionPanel` eliminó las cuatro tarjetas redundantes de estudiante,
  programa, fecha límite y documento. El encabezado del proceso, mensajes,
  formularios, jurados, sustentación y línea de tiempo se conservan.
- Las seis acciones superiores se renderizan solo cuando su regla de negocio las
  habilita para el estado actual. `busy` no retira controles durante una petición:
  deshabilita temporalmente las acciones previamente disponibles para impedir
  duplicados y evitar saltos de layout.
- La columna **Acciones** de jurados existe solo si `canManageJurors` es verdadero
  y hay al menos un jurado activo. Una fila inactiva no presenta botones; si no
  existe ninguna operación posible, tampoco se renderiza el `th` de la columna.
- No se modificaron contratos HTTP, DTO, estados, permisos, estilos, schemas,
  dependencias, variables, seeds ni datasets.

## Paths, verificación y siguientes pasos
- Implementación: `src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx`.
  Salida esperada para un proceso cerrado como `SUSTENTADA`: sin tarjetas de
  resumen, sin barra vacía de acciones y sin columna de acciones de jurados.
- `npx eslint src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx`:
  PASS; solo aparece el warning ambiental conocido de npm por `http-proxy`.
- `npm run build`: PASS; 283 módulos, `index-Ch9v6k1n.css` (231.65 kB) e
  `index-6ruUdfsX.js` (666.44 kB). Persiste el aviso informativo por el chunk JS
  mayor de 500 kB. `git diff --check`: PASS.
- Pendiente: comprobación autenticada de cada estado y captura en claro/oscuro.
  El contenedor no dispone de Chromium, Chrome ni Firefox y la ruta protegida
  requiere backend y sesión institucional, por lo que no se generó captura.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda,
  Poetry, entorno Python ni otro árbol npm. Node.js 24.15.0, npm 11.4.2,
  React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2.

---
# Update 2026-09-23 — estado AJUSTES_RECIB en proyectos de grado

## Estado actual y contrato

- El catálogo compartido de solicitudes reconoce ahora `estadoSolicitud: "AJUSTES_RECIB"` y el nombre descriptivo `"AJUSTES RECIBIDOS"`; ambos se normalizan a la misma sigla y se presentan como **AJUSTES RECIBIDOS**, no como **DESCONOCIDO**.
- La corrección vive en `src/modules/solicitudes/utils/estadoSolicitud.ts` y `StatusBadge.tsx`, por lo que cubre las tablas/tarjetas y el detalle individual compartidos por estudiante y coordinación. El estado usa la variante visual `en-revision`.
- El catálogo local registra el estado con id 21. No cambian endpoints, payloads, DTO, transiciones, permisos, schemas, variables, seeds ni datasets. Entrada relevante del proceso: `{ "estadoSolicitud": "AJUSTES_RECIB", "estadoSolicitudNombre": "AJUSTES RECIBIDOS" }`; salida visual esperada: **AJUSTES RECIBIDOS**.

## Entorno, pruebas y continuidad

- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otra instalación npm. Las versiones exactas están en `package-lock.json`; el proyecto se ejecuta con `npm run dev` y no requiere seeds.
- La regresión dirigida está en `tests/estadoSolicitud.test.ts` y cubre la sigla, el nombre descriptivo, la etiqueta y el registro de catálogo. Pendiente únicamente la comprobación autenticada contra backend real para ambos roles; el contenedor no dispone de esa sesión institucional.
- Verificación local del 2026-09-23: `node --test tests/estadoSolicitud.test.ts` PASS (4/4), ESLint focalizado PASS, `npm run build` PASS (284 módulos; `index-BAvKq9XY.css` 232.60 kB e `index-_pxWkai9.js` 668.17 kB) y `git diff --check` PASS. El build conserva el aviso informativo conocido por el chunk JavaScript mayor de 500 kB; npm conserva el warning ambiental conocido por `http-proxy`.

---

# Update 2026-09-23 — resultado condicionado a evaluaciones de sustentación

## Estado actual, regla y salida esperada
- `ProcesoEvaluacionPanel` ya no habilita **Registrar resultado** solamente por
  el estado `SUST_PROGRAMADA`: exige además que todos los jurados activos tengan
  al menos una evaluación de momento `SUSTENTACION`. Un jurado activo que solo
  tenga `CONCEPTO_DOCUMENTO` mantiene oculta la acción.
- Los jurados con `activo: false` representan reemplazos/retiros y no participan
  en la condición. Una lista vacía o sin jurados activos tampoco habilita el
  botón. Se reconocen `momentoCodigo`, `momento` y `momentoNombre`, incluidas las
  formas `SUSTENTACION` y `Sustentación`.
- La misma condición protege el render del formulario ya abierto. No cambió el
  contrato de escritura: `registrarResultado` conserva el payload
  `{ resultadoCodigo, notaFinal, actaId }`; no hay cambios de endpoint, DTO,
  schema, permisos, dependencias, variables, seeds ni datasets.

## Paths, pruebas, entorno y próximos pasos
- Regla pura: `src/modules/trabajos-grado/evaluacion/estadoProcesoEvaluacion.ts`;
  integración: `src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx`;
  regresión: `tests/estadoProcesoEvaluacion.test.ts`.
- Verificación local 2026-09-23: `node --test
  tests/estadoProcesoEvaluacion.test.ts` PASS (4/4); ESLint focalizado PASS;
  `npm run build` PASS (286 módulos; CSS 232.60 kB y JS 668.84 kB). Persiste
  únicamente el aviso informativo del chunk JS mayor de 500 kB y el warning
  ambiental npm `Unknown env config "http-proxy"`.
- Pendiente comprobar con una sesión institucional un proceso con dos jurados:
  con un solo concepto de sustentación el botón debe estar oculto y, tras la
  evaluación del segundo jurado, debe aparecer. La ruta requiere backend y
  autenticación reales.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda,
  Poetry ni otro árbol npm. Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM
  19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y
  ESLint 9.39.2; el proyecto no usa seeds.

---

# Update 2026-09-23 — rueda y tarjeta interactiva en estudiantes

## Estado actual y salida esperada
- `StudentHorizontalBoard` convierte el movimiento dominante de la rueda
  (`deltaY` o `deltaX`) en desplazamiento horizontal y contempla los tres
  `deltaMode`. Solo cancela el scroll de la página cuando el tablero realmente
  puede avanzar en la dirección solicitada; los extremos liberan la rueda.
- `EstudianteCard` funciona completa como acceso al perfil mediante clic,
  `Enter` o espacio, con foco visible y semántica de enlace. La acción visual
  **Ver perfil** permanece integrada en la tarjeta sin crear controles
  interactivos anidados. La supresión de clic posterior a un arrastre permanece en el
  contenedor, por lo que arrastrar una tarjeta no abre el detalle.
- Salida esperada: rueda sobre cualquier tablero con desbordamiento mueve sus
  tarjetas; clic en foto, estado, nombre o datos abre exactamente el mismo
  detalle que el botón. No hay cambios de API, schema, DTO ni permisos.

## Paths, entorno, validación y continuidad
- Implementación: `src/modules/estudiantes/components/StudentHorizontalBoard/StudentHorizontalBoard.tsx`
  y `src/modules/estudiantes/components/EstudianteCard/{EstudianteCard.tsx,EstudianteCard.css}`.
  Consumidor: `src/pages/EstudiantesCoordinacion/EstudiantesCoordinacionPage.tsx`.
- Verificación local 2026-09-23: ESLint focalizado PASS; `npm run build` PASS
  (286 módulos; CSS 232.73 kB y JS 669.38 kB); `git diff --check` PASS. El build
  conserva el aviso informativo por el chunk JS mayor de 500 kB y npm el warning
  ambiental `Unknown env config "http-proxy"`.
- Pendiente: comprobar con backend y sesión institucional la rueda en ratón
  físico, clic/teclado y temas claro/oscuro. No se pudo capturar la ruta
  protegida porque el contenedor no incluye Chromium, Chrome ni Firefox y no
  dispone de una sesión institucional reproducible.
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda,
  Poetry ni otro árbol npm. No hay seeds ni datasets. Entorno: Node.js 24.15.0,
  npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3,
  Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol exacto.

---
# Update 2026-09-23 — evaluación del examen de candidatura doctoral

## Estado actual y decisiones
- El tipo de solicitud `9` quedó incluido en
  `TIPOS_TRABAJO_GRADO_POR_NIVEL.doctorado`; el código `CAND_DOCTORAL` ya estaba
  habilitado en `CODIGOS_PROCESO_EVALUACION_TG`. Por ello el examen aparece en
  el listado doctoral y usa el mismo `ProcesoEvaluacionPanel` de propuestas y
  defensas, incluidas designación de jurados, correcciones, programación de
  sustentación, cierre e historial. Se conserva temporalmente el ID `8` del
  catálogo anterior para compatibilidad con datos existentes.
- `SolicitudDetallePage` muestra solo `tituloTrabajo` (o el respaldo `titulo`
  del proceso) para candidatura y nunca renderiza el resumen. También habilita
  el panel estudiantil de ajustes para el ID `9` bajo las mismas reglas actuales.
- En la lista de jurados, las evaluaciones `SUSTENTACION` de candidatura usan
  `nota` y la etiqueta **Nota**; propuesta y defensa siguen usando el resultado
  nominal. La regla está aislada en
  `src/modules/trabajos-grado/evaluacion/presentacionEvaluacion.ts`.

## Contratos, paths y salida esperada
- Se reutiliza `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}`. Para cada
  jurado se espera `evaluaciones[]` con `{ id, momentoCodigo, nota, ... }`; si
  `tipoSolicitudCodigo === "CAND_DOCTORAL"` y
  `momentoCodigo === "SUSTENTACION"`, la UI produce `Nota: <nota>` aunque la
  respuesta también contenga un `resultadoNombre`.
- Archivos centrales: `src/modules/trabajos-grado/constants.ts`,
  `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx`,
  `src/modules/trabajos-grado/evaluacion/ProcesoEvaluacionPanel.tsx` y
  `presentacionEvaluacion.ts`. Regresión: `tests/candidaturaDoctoral.test.ts`.
- Pendiente: validar con backend y sesión institucional la presencia del tipo 9
  en el catálogo, el ciclo completo de correcciones/sustentación y una nota real
  (incluidos `0` y decimales). Confirmar después con backend si el ID legado `8`
  puede retirarse. La autoridad de permisos y transiciones continúa en backend.

## Entorno y resultados
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda,
  Poetry ni un segundo árbol npm. No existen seeds/datasets para este flujo.
  Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM
  7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2.
- Verificación 2026-09-23: pruebas dirigidas PASS (7/7), ESLint focalizado PASS,
  build PASS (287 módulos; CSS 233.01 kB, JS 670.38 kB) y `git diff --check`
  PASS. `npm run lint` sigue bloqueado por 9 errores y 1 warning preexistentes
  en servicios placeholder, admisiones, documentos y tipos/editor de
  solicitudes. Persisten además el warning ambiental `Unknown env config
  "http-proxy"` y el aviso informativo por el chunk mayor de 500 kB.

---
# Update 2026-09-24 — base API corregida en matrícula financiera

## Estado actual, contrato y salida esperada
- `src/modules/matricula-financiera/api.ts` ya no retira `/sapp` de `API_URL`. La base del módulo se forma eliminando solo las barras finales y anexando `/liquidacionMatricula`.
- Con `VITE_API_URL=https://sapp.eisi.online/api/sapp`, todos los endpoints del módulo deben producir `https://sapp.eisi.online/api/sapp/liquidacionMatricula/...`; por ejemplo, el listado de procesos usa `GET https://sapp.eisi.online/api/sapp/liquidacionMatricula/procesos`.
- Se conservan los contratos, payloads, cabecera `X-Internal-Token`, descarga Excel y manejo de errores existentes. No cambiaron dependencias, variables de entorno, seeds, datasets ni schema.

## Entorno, validación y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. Este frontend se ejecuta con Node.js/npm y las versiones exactas están fijadas en `package-lock.json`.
- Pendiente de validación integrada: abrir matrícula financiera con una sesión institucional y confirmar en la pestaña Network que procesos, liquidaciones, tarifas, vista estudiantil y exportación conservan `/api/sapp/liquidacionMatricula`.

---
# Update 2026-09-24 — presentación de matrícula para estudiantes

## Estado actual y decisiones
- La experiencia se adapta con `canManagePosgrados`: para estudiantes, `/matricula` muestra **Liquidación** y los textos solicitados en sus dos tarjetas; `/matricula/financiera` usa **Liquidación** como título y no renderiza **Actualizar**. Coordinación, secretaría y administración conservan **Matrícula financiera**, sus descripciones operativas y el refresco manual.
- `getPrimaryNavigationItems(roles)` también entrega **Liquidación** como etiqueta del submenú para perfiles sin capacidad administrativa. Las rutas no cambiaron: ambas variantes siguen navegando a `/matricula/financiera`.
- El desfase del botón Matrícula provenía de dos niveles de padding: `.sidebar__link` y `.sidebar__parent-link`. La regla más específica `.sidebar__link.sidebar__link--parent { padding: 0; }` deja el icono alineado con los demás módulos sin alterar el pill activo ni el submenú.

## Paths, contratos y salida esperada
- Archivos: `src/pages/MatriculaHome/MatriculaHomePage.tsx`, `src/pages/MatriculaFinanciera/MatriculaFinancieraPage.tsx`, `src/app/navigationItems.ts` y `src/components/Sidebar/Sidebar.css`.
- No cambiaron API, schemas, DTO, permisos, rutas, dependencias, variables, seeds ni datasets. La carga inicial de `GET /liquidacionMatricula/mias` y el refresco posterior a `responderMiLiquidacion` permanecen intactos aunque el estudiante ya no tenga botón manual.
- Salida estudiantil esperada: tarjetas “Matrícula académica — Registra asignaturas y documentos requeridos para el proceso de matrícula.” y “Liquidación — Información para proceso de liquidación.”; sidebar y título de página dicen “Liquidación”; no aparece “Actualizar”.

## Entorno, validación y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. Entorno: Node.js 24.15.0, npm 11.4.2 y versiones exactas fijadas en `package-lock.json`.
- Validación 2026-09-24: `npm run build` PASS (297 módulos; CSS 240.95 kB, JS 689.62 kB), `npm run lint` PASS, ESLint focalizado PASS, prueba dirigida de matrícula financiera PASS y `git diff --check` PASS. Persisten únicamente el warning ambiental de npm `Unknown env config "http-proxy"` y el aviso informativo por el chunk JS mayor de 500 kB.
- Pendiente: validar visualmente con sesiones institucionales de estudiante y coordinación, en sidebar contraído/expandido y viewport móvil. No hay datos locales para seed; el flujo depende del backend configurado.

---
# Update 2026-09-24 — título obligatorio en solicitudes de proyecto de grado

## Estado, contrato y salida esperada
- `SolicitudEstudianteForm` obtiene la regla desde `src/modules/solicitudes/utils/datosTrabajoSolicitud.ts`: los tipos 4, 5, 6, 7 y 9 presentan título y no permiten registrar un valor vacío o compuesto solo por espacios. El input conserva `required` y la validación de aplicación produce `Debes ingresar el <nombre académico del título>.`.
- Tipos 4/5: etiqueta **Título de la tesis**; tipos 6/7: **Título del trabajo de investigación**; tipo 9: **Título del trabajo**. Los tipos 4–7 también exigen `resumenTrabajo`; el 9 no lo presenta ni lo envía. Un tipo sin control de título (por ejemplo, 13) no exige ni envía esos datos.
- El contrato HTTP no cambia: `POST /sapp/solicitudesAcademicas` recibe `tituloTrabajo` recortado para los tipos anteriores, junto con `estudianteId`, `tipoSolicitudId` y los campos generales. El backend debe conservar su propia validación; esta corrección cubre el cliente.
- Artefactos: utilidad `src/modules/solicitudes/utils/datosTrabajoSolicitud.ts`, integración `src/modules/solicitudes/components/SolicitudEstudianteForm/SolicitudEstudianteForm.tsx` y regresión `tests/datosTrabajoSolicitud.test.ts`. No existen seeds o datasets para este flujo.

## Entorno, pruebas y continuidad
- Reutilizar `/workspace/SAPP-frontend/node_modules`; no crear otro árbol npm ni venv, Conda o Poetry. Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol exacto.
- PASS: `node --test --test-isolation=none tests/*.test.ts` (47/47), ESLint focalizado, `npm run build` (308 módulos) y `git diff --check`. `npm run lint` continúa con 9 errores y 1 warning preexistentes en servicios placeholder, admisiones, documentos y tipos/editor de solicitudes.
- Pendiente integrado: confirmar con el backend y una sesión institucional que los cinco tipos del catálogo mantienen esos IDs y que un título válido se persiste. Si el catálogo deja de garantizar IDs estables, migrar la configuración a códigos de solicitud sin duplicar la regla en el componente.

---
# Handoff actual — ajustes de matrícula financiera (2026-09-24)

## Estado, contratos y salida esperada

- Se completaron los ocho ajustes de UX en `src/pages/MatriculaFinanciera` y la validación reutilizable en `src/modules/matricula-financiera/rules.ts`.
- El payload de coordinación conserva `RespuestasCoordinacionRequest`: las respuestas aplicables son booleanas, `certificadoVotacionRecibido` se deriva de `certificadoVotacion === true` y `observaciones` es `string | null`. La carga ANX-39 continúa como operación documental separada y opcional.
- El certificado solo se renderiza cuando la respuesta de votación es Sí. Sus acciones de ver, descargar, cargar y reemplazar no envían accidentalmente el formulario padre. El botón de respuestas requiere 2 respuestas para `NUEVO` y 4 para `VIGENTE`, respetando preguntas dinámicas con `aplica`.
- No se modificaron API, schemas, variables, seeds ni datasets. El simulador disponible sigue en `tests/fixtures/matricula-financiera/preview.html`.

## Entorno, pruebas y próximos pasos

- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no ejecutar otro `npm install` ni crear venv, Conda o Poetry. Es un proyecto Node: Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, Router 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2; `package-lock.json` fija el árbol.
- Verificación de esta entrega: ESLint focalizado PASS; pruebas Node PASS (51/51); build PASS (309 módulos, CSS 247.18 kB y JS 725.06 kB); `git diff --check` PASS. Avisos no bloqueantes: configuración ambiental npm `Unknown env config "http-proxy"` y chunk JS mayor de 500 kB.
- Pendiente: validar con backend y sesión institucional los modos claro/oscuro y móvil, los cuatro estados de liquidación, la derivación de recepción y el reemplazo documental. Si hay navegador disponible, capturar las rutas protegidas; este repositorio no aporta credenciales ni backend reproducible.

---

---

# Update 2026-09-24 — acciones, correcciones y privacidad de liquidación

## Estado actual y decisiones
- `LiquidacionActions.tsx` centraliza confirmación, exclusión, desmarcado y reinclusión para tabla/detalle. Sus diálogos identifican estudiante, código y periodo; la confirmación PUTTY incluye total y checkbox exacto. Exclusión conserva el total y envía `{ motivo: string }` recortado. `useOperacion` evita dobles envíos. `PUBLICADO` no permite mutaciones; una fila `LIQUIDADA` debe desmarcarse antes de excluirse.
- Confirmar requiere `RESPONDIDA` y `totalFinal != null` (incluye `0`); alertas no bloquean. En detalle también se bloquea si el formulario de respuestas o las correcciones tienen cambios locales. Tras una mutación se refrescan fila, tabla y resumen desde el backend.
- El editor **Corregir cálculo** vive dentro de **Cálculo recibido del sistema** y no desmonta su estado al cerrarse. Los campos monetarios aceptan formato colombiano, ajuste negativo y máximo cuatro decimales. El payload continúa numérico; `valorFinalManual: null` retira la sustitución y `0` se conserva.
- El filtro `conAlertas` y la columna semestre se retiraron del listado. Las insignias tienen texto y tokens/mezclas compatibles con tema. El botón de flecha del sidebar ahora centra un área estable de 40 px y rota al expandir.
- Estudiantes solo ven `valores.totalFinal`; jamás se renderiza `valores.desglose`, aunque el DTO se mantiene sin cambios. Coordinación conserva el desglose completo.

## Contratos, paths y salida esperada
- Sin endpoints ni schemas nuevos: `PUT /liquidaciones/{id}/liquidada` con `{ liquidada: boolean }`, `/excluir` con `{ motivo }`, `/reincluir` sin cuerpo, `/ajustes` con reemplazo completo y `/respuestas` con respuestas aplicables. Base HTTP existente: `/api/sapp`.
- Paths principales: `src/pages/MatriculaFinanciera/{LiquidacionActions,LiquidacionDetallePage,ProcesoLiquidacionPage,MatriculaFinancieraPage,RespuestasForm}.tsx`, CSS compartido en `MatriculaFinancieraPage.css`, reglas en `src/modules/matricula-financiera/rules.ts` y regresiones en `tests/matriculaFinancieraRules.test.ts`.
- Salida esperada: cero puede confirmarse; total ausente, estado no respondido o cambios locales deshabilitan confirmación; cancelar un diálogo no muta; motivo vacío/espacios no se envía; fallos del servidor mantienen el diálogo y muestran error. Publicado solo consulta.

## Entorno, resultados y siguientes pasos
- Reutilizar exclusivamente `/workspace/SAPP-frontend/node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. `package-lock.json` fija el árbol.
- Validación local: suite Node PASS (53/53), ESLint focalizado PASS, build PASS (310 módulos; CSS 248.52 kB; JS 728.06 kB) y `git diff --check` PASS. `npm run lint` conserva 9 errores y 1 warning preexistentes fuera de este alcance (servicios placeholder, admisiones, documentos y solicitudes). npm muestra el warning ambiental `Unknown env config "http-proxy"`; Vite advierte por el chunk >500 kB.
- Pendiente institucional: probar errores reales de cada mutación, actualización de resumen, permisos y proceso publicado con backend/sesión; revisar teclado, foco, claro/oscuro y escritorio/móvil. No se tomó captura porque el contenedor no dispone de Chromium, Chrome ni Firefox; la ruta real requiere autenticación/backend.
# Update 2026-09-24 — botón Volver del tablero financiero

## Estado, contrato y salida esperada
- `src/pages/MatriculaFinanciera/ProcesoLiquidacionPage.tsx` reemplaza el enlace de texto local `mf-back` por el `BackButton` compartido, manteniendo la etiqueta **Volver a procesos** y el destino `/matricula/financiera`.
- La salida esperada es el mismo control pill utilizado en el resto del sistema, con flecha gestionada por el componente, tokens semánticos, foco visible y hover compatible con temas claro/oscuro. No cambiaron API, schemas, DTO, permisos, rutas, dependencias, seeds ni datasets.

## Entorno y continuidad
- Proyecto Node.js/npm: Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni un segundo árbol npm.
- Verificación local: suite Node PASS (56/56), ESLint focalizado PASS, build PASS (313 módulos; CSS 252.50 kB y JS 732.50 kB) y `git diff --check` PASS. `npm run lint` conserva 9 errores y 1 warning preexistentes fuera de este ajuste. Avisos no bloqueantes: npm informa `Unknown env config "http-proxy"` y Vite advierte por el chunk mayor de 500 kB.
- Pendiente integrado: revisar el control con una sesión institucional en escritorio/móvil y ambos temas. No se capturó imagen porque el contenedor no dispone de Chromium, Chrome ni Firefox; el flujo depende además del backend autenticado y no tiene seed local.

---
