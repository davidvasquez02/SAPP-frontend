# SAPP Frontend — historial de homologaciones en revisión

## Mejora 2026-09-25 — información de sustentación programada

- En el detalle de trabajos de grado, estudiantes y coordinación pueden consultar la fecha y hora, modalidad y lugar de una sustentación programada. Si la modalidad es virtual y el backend entrega `enlaceSustentacion`, la interfaz presenta un enlace accesible que se abre en una pestaña nueva.
- La presentación admite el contrato plano real (`fechaSustentacion`, `modalidadSustentacion`, `modalidadSustentacionCodigo`, `lugarSustentacion`, `enlaceSustentacion`) y conserva compatibilidad con el objeto `sustentacion` anterior. La información ya capturada por `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}` se reutiliza sin endpoints ni payloads nuevos.
- Stack instalado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`.
- No existen seeds ni credenciales reproducibles para la ruta protegida. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni un segundo árbol npm.
- Verificación local: regresión de sustentación 3/3, suite Node 72/72, ESLint focalizado y build de producción (309 módulos) pasan. El build conserva el aviso informativo por el chunk JavaScript mayor de 500 kB y npm informa `Unknown env config "http-proxy"`.

---

## Mejora 2026-09-25 — retroalimentación al gestionar jurados

- En el detalle de coordinación de trabajos de grado, los mensajes de éxito de las acciones del proceso (por ejemplo, **Jurado registrado e invitación enviada.**) se eliminan automáticamente después de cinco segundos, con limpieza del temporizador al cambiar o desmontar la vista.
- Mientras está abierto el formulario para agregar o reemplazar un evaluador, la acción **Agregar evaluador** de la cabecera de **Jurados evaluadores** se oculta para evitar una invitación duplicada o confusa. Al cancelar o completar el formulario, la acción vuelve a estar disponible si el estado permite gestionar jurados.
- No cambiaron endpoints, DTO, payloads, permisos, estados, dependencias, variables, schemas, seeds ni datasets. La ruta protegida usa el backend institucional; para desarrollo se reutilizan `node_modules` y `package-lock.json` con `npm run dev`.

---

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

## Cambio 2026-09-25

- En el detalle de una solicitud de homologación pendiente, coordinación puede desplegar **Ver historial de homologaciones**. La consulta se realiza bajo demanda mediante `GET /homologaciones/historial` y presenta materias de origen/destino, fecha, vigencia y acta como contexto informativo para decidir. La acción no aparece cuando la solicitud ya está `APROBADA` o `RECHAZADA`, ni en la vista estudiantil.
- El detalle de cualquier solicitud para estudiantes queda exclusivamente en modo de consulta: se retiraron **Editar solicitud**, sus campos y el editor de documentos asociado. La creación de nuevas solicitudes y los demás flujos no cambian.
- Stack instalado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni un segundo árbol npm.
- Ejecución: `npm run dev`; regresión: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No hay seed ni credenciales para la ruta protegida: los datos provienen del backend institucional configurado mediante las variables Vite existentes.

---

# Mejora 2026-09-25 — advertencia antes de convocar estudiantes

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En el detalle administrativo de un proceso de matrícula financiera, **Convocar estudiantes** presenta ahora un aviso destacado que explica que la acción lista a todos los estudiantes activos, tanto vigentes como nuevos. El mensaje exige revisar cada fila y excluir desde el detalle los casos que no correspondan antes de enviar las solicitudes, porque el envío también habilita el proceso y remite correo a las personas incluidas.
- El aviso usa `role="note"`, una etiqueta accesible y tokens semánticos (`--primary`, `--on-primary`, `--surface`) compatibles con temas claro y oscuro. La acción **Convocar**, su payload `{ incluirVigentes: true, incluirNuevos: true }`, los estados y los contratos HTTP no cambian.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; este frontend no usa venv, Conda ni Poetry.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No existe un seed reproducible para la ruta protegida; los datos reales provienen del backend institucional y la fixture aislada permanece en `tests/fixtures/matricula-financiera/`.

---

# Corrección 2026-09-25 — introducción y verificación de la liquidación

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- La vista estudiantil de **Mi liquidación** ya no muestra la introducción **Responde la información y consulta tu liquidación.** El encabezado queda limitado al título antes del flujo y las tarjetas; la introducción administrativa se conserva para coordinación.
- El paso **1. Revisa la solicitud** ahora pide verificar los datos de la liquidación: periodo académico, programa académico y fecha límite para completar el proceso. No cambian flujos, estados, API, DTO, rutas, roles, schemas, dependencias, variables, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; este frontend no usa venv, Conda ni Poetry.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No existe un seed reproducible para la ruta protegida; la fixture aislada está en `tests/fixtures/matricula-financiera/` y los datos reales provienen del backend institucional.

---

# Corrección 2026-09-25 — descripción fiel de la espera de liquidación

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- El paso 3 del **Flujo de matrícula financiera** para estudiantes ahora se titula **Espera la liquidación** y explica: **La coordinación recibe la información y realiza el proceso de liquidación.** Se eliminó la afirmación de que coordinación valida las respuestas o solicita correcciones, porque no corresponde al proceso real.
- Es un ajuste exclusivamente de contenido en la guía estudiantil. No cambia el flujo de coordinación, lógica, estados, endpoints, DTO, rutas, permisos, dependencias, schemas, variables, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; este frontend no usa venv, Conda ni Poetry.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No existe un seed reproducible para la ruta protegida; la fixture aislada está en `tests/fixtures/matricula-financiera/` y los datos reales provienen del backend institucional.

---

# Corrección 2026-09-25 — estado del proceso omitido en la vista estudiantil

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- La tarjeta de liquidación del estudiante muestra ahora únicamente la fecha límite en **Recepción de respuestas habilitada hasta el …**; se retiró el texto redundante **Proceso ABIERTO**, porque esta visual consulta procesos vigentes disponibles para el estudiante.
- El estado del proceso se conserva en el contrato y en la lógica que determina si se pueden responder preguntas, mostrar avisos fuera de plazo y editar el certificado. No cambian filtros del backend, endpoints, DTO, rutas, permisos, dependencias, schemas, variables, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; este frontend no usa venv, Conda ni Poetry.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No existe un seed reproducible para la ruta protegida; la fixture aislada está en `tests/fixtures/matricula-financiera/` y los datos reales provienen del backend institucional.

---

# Mejora 2026-09-25 — ayudas contextuales en el detalle de liquidación

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- **Revisión del caso** incorpora controles `?` junto a Tipo de estudiante, Origen de respuesta, Solicitud enviada, Último recordatorio, Respuesta recibida y Marcada liquidada. Al pasar el puntero o enfocar/pulsar el control se explica de manera breve el significado y procedencia de cada dato.
- Las ayudas son accesibles mediante teclado y lector de pantalla, usan los tokens semánticos de la aplicación, funcionan en temas claro/oscuro y se limitan al detalle administrativo. No cambian valores, estados, API, DTO, rutas, permisos, dependencias, schemas, variables, seeds ni datasets.
- Entorno exacto: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules` y `package-lock.json`; este frontend no usa venv, Conda ni Poetry.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No existe un seed reproducible para la ruta protegida; los datos reales provienen del backend institucional configurado mediante las variables Vite existentes.

---

# Corrección 2026-09-25 — edición consciente de respuestas por coordinación

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- **Detalle de liquidación** abre ahora **Respuestas y respaldo de coordinación** en modo de consulta. Los radios, las observaciones y la carga o reemplazo del certificado permanecen ocultos o inactivos hasta que coordinación pulsa **Editar respuestas**.
- El modo de edición presenta un aviso explícito de que la persona coordinadora está actuando en nombre del estudiante, ofrece **Cancelar edición** para descartar cambios locales y regresa automáticamente a consulta después de guardar correctamente. Los casos no editables por estado conservan únicamente la visualización.
- Se preservan los endpoints, DTO, permisos, rutas, schemas, dependencias, variables, seeds y datasets existentes. La respuesta sigue enviándose mediante el servicio de liquidaciones y el respaldo continúa usando el tipo documental ANX-39.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules` y `package-lock.json`; ejecutar con `npm run dev`, probar con `node --test --test-isolation=none tests/*.test.ts` y compilar con `npm run build`. No hay seeds locales para esta ruta protegida; los datos provienen del backend institucional.

---

# Corrección 2026-09-25 — guardado unificado de respuestas y certificado

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En la visual estudiantil de matrícula financiera se eliminó el botón independiente **Guardar certificado**. El usuario selecciona el archivo y ejecuta todo desde el único botón **Guardar respuestas**.
- El guardado unificado llama primero al servicio documental ANX-39 y, únicamente si la carga termina correctamente, llama al servicio de respuestas. Si ya existe un certificado vigente y no se selecciona un reemplazo, guarda solo las respuestas; si la carga falla, no envía las respuestas y permite reintentar sin perder la selección.
- La coordinación conserva su flujo administrativo y el guardado documental independiente. No cambian endpoints, DTO, permisos, rutas, dependencias, variables, schemas, seeds ni datasets.
- Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules` y `package-lock.json`; ejecutar con `npm run dev`, probar con `node --test --test-isolation=none tests/*.test.ts` y compilar con `npm run build`. No hay seeds locales para esta ruta; los datos provienen del backend institucional.

---

# Corrección 2026-09-25 — certificado obligatorio al responder Sí

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En la visual estudiantil de matrícula financiera, responder **Sí** a **¿Tienes certificado de votación vigente?** mantiene deshabilitado **Guardar respuestas** hasta que ANX-39 se consulte o cargue correctamente. Un documento rechazado no cumple el requisito; responder **No** no exige archivo. La coordinación conserva su flujo independiente y puede registrar el respaldo recibido por otros medios.
- La tarjeta comunica que el archivo es obligatorio en este caso y muestra una indicación mientras falta. El control vuelve a validarse al cambiar de **No** a **Sí**, al consultar el documento y después de una carga exitosa; el submit también aplica la misma condición para impedir el envío por una vía distinta al botón.
- Contrato preservado: la carga continúa por el servicio documental ANX-39 y las respuestas usan el endpoint y DTO existentes. No cambian rutas, permisos, dependencias, variables, schemas, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; regresiones: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No existe seed institucional para esta ruta protegida; la fixture aislada está en `tests/fixtures/matricula-financiera/`. Verificación local: ESLint focalizado PASS, regresión dirigida 13/13 PASS, suite Node 60/60 PASS, build PASS (314 módulos) y `git diff --check` PASS. npm conserva el aviso ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo del chunk mayor de 500 kB.

---

# Corrección 2026-09-25 — detalle simplificado del certificado de votación

- En el detalle del certificado de votación de matrícula financiera se muestra únicamente el nombre del archivo cargado. La versión interna y el estado documental dejan de exponerse junto al nombre porque no aportan al proceso operativo.
- Los estados conservan su uso interno para validar el certificado y, si fue rechazado, se mantiene el aviso accionable con sus observaciones. No cambian contratos HTTP, DTO, carga, descarga, versionado, permisos, rutas, dependencias, variables, schemas, seeds ni datasets.

---

# Corrección 2026-09-25 — certificado de votación junto a su cargue

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En la visual estudiantil de matrícula financiera, **¿Tienes certificado de votación vigente?** se presenta como la última pregunta aplicable. Al responder **Sí**, el cargue del certificado aparece inmediatamente después de esa pregunta, sin que otra respuesta lo separe visualmente.
- El orden recibido del backend no se muta y la vista de coordinación conserva su orden actual. No cambian validaciones, respuestas, endpoints, DTO, permisos, dependencias, variables, schemas, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No hay seed institucional para esta ruta protegida; la fixture aislada permanece en `tests/fixtures/matricula-financiera/preview.html`.

---

# Corrección 2026-09-25 — confirmaciones de Gestión profesores

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- **Gestión profesores** ya no usa los cuadros de confirmación nativos del navegador. Agregar o retirar el rol de docente de posgrados, retirar un integrante de un grupo y designar su director muestran ahora un diálogo institucional uniforme con el resto de SAPP, identificación explícita del profesor, explicación del efecto y acciones tipo píldora.
- El modal usa los tokens semánticos globales en temas claro/oscuro, se adapta a móvil, enfoca inicialmente **Cancelar**, admite cierre seguro con `Escape`, botón de cierre o backdrop y bloquea todos los cierres mientras la mutación está en curso. Los errores conservan abierto el diálogo para permitir reintentar; el éxito lo cierra y mantiene las notificaciones existentes.
- No cambian rutas, permisos, endpoints ni contratos: asignar y retirar el rol siguen operando por UUID; las operaciones de grupo siguen usando `grupoId` y `docenteId`. No se agregaron dependencias, variables, schemas, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Verificación local: ESLint focalizado PASS, suite Node 58/58 PASS, build de producción PASS (314 módulos) y `git diff --check` PASS. npm conserva el warning ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo por el chunk JavaScript mayor de 500 kB.

---

# Corrección 2026-09-24 — botones de retorno de matrícula financiera

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- Los retornos de **Detalle de liquidación** y **Tarifas de matrícula** ahora reutilizan el componente global `BackButton`, igual que el tablero del proceso y los demás detalles del sistema. Ambos muestran el tratamiento tipo píldora, borde, sombra, desplazamiento al pasar el cursor y foco accesible definidos por los tokens semánticos para temas claro y oscuro.
- Se retiraron los enlaces y la regla local `mf-back`; las rutas se conservan: el detalle vuelve a `/matricula/financiera/procesos/:procesoId` y tarifas vuelve a `/matricula/financiera`. No cambian API, DTO, permisos, dependencias, variables, schemas, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Verificación local: ESLint focalizado PASS, suite Node 58/58 PASS, build de producción PASS (314 módulos) y `git diff --check` PASS. npm conserva el warning ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo por el chunk JavaScript mayor de 500 kB.

---

# Corrección 2026-09-24 — retorno desde una inscripción para profesores

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En el detalle de una inscripción de admisión, el botón de retorno ahora reconoce al profesor que participa únicamente como evaluador. Para ese perfil muestra **Volver a inscripciones** y regresa a `/admisiones`, donde está su listado anterior, en lugar de intentar abrir la convocatoria de coordinación y terminar redirigido al inicio por falta de permisos.
- Los perfiles de coordinación, secretaría y administración conservan **Volver a convocatoria** y su ruta existente. No cambian rutas registradas, permisos, endpoints, contratos, dependencias, variables, schemas, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Verificación local: ESLint focalizado PASS, suite Node 58/58 PASS, build de producción PASS (314 módulos) y `git diff --check` PASS. npm conserva el warning ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo por el chunk JavaScript mayor de 500 kB.

---

# Corrección 2026-09-24 — nombres de origen en homologación

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En el formulario estudiantil de **Homologación de asignaturas**, las opciones para indicar el origen se presentan ahora como **Asignatura del listado** y **Asignatura nueva**. Los nombres describen directamente si la materia ya existe en el catálogo o si debe escribirse manualmente, sin cambiar el comportamiento del selector.
- El ajuste es exclusivamente de contenido visual. Se conservan los modos internos `catalogo` y `manual`, el payload de homologación, validaciones, endpoints, roles, dependencias, variables, schemas, seeds y datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Verificación local: ESLint focalizado PASS, suite Node 58/58 PASS, build de producción PASS (314 módulos) y `git diff --check` PASS. npm conserva el warning ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo por el chunk JavaScript mayor de 500 kB.

---

# Corrección 2026-09-24 — tabla de grupos y ancho del menú lateral

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En **Gestión profesores > Grupos de investigación**, la tabla de integrantes ya no presenta la columna técnica **Identificador**. El identificador del docente se conserva internamente como clave y para las operaciones de designar director o retirar, por lo que no cambian contratos, endpoints ni comportamiento.
- El menú lateral expandido pasa de 260 px a 284 px para mostrar completa, en una sola línea, la etiqueta **Informes a dependencias**. El estado contraído continúa en 84 px y la variante móvil conserva su ancho adaptable de hasta 320 px.
- No se agregaron dependencias, variables, schemas, seeds ni datasets. Los profesores, grupos y permisos siguen viniendo del backend configurado mediante las variables Vite existentes.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Verificación local: ESLint focalizado PASS, suite Node 58/58 PASS, build de producción PASS (314 módulos) y `git diff --check` PASS. npm conserva el warning ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo por el chunk JavaScript mayor de 500 kB.

---

# Corrección 2026-09-24 — confirmación uniforme al eliminar actas

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas y proyectos de grado. React compone las vistas, los módulos TypeScript encapsulan contratos y transporte, y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- `/actas` reemplaza la confirmación nativa del navegador por un modal institucional consistente con las demás secciones. Identifica el acta por nombre y código, advierte que la eliminación es irreversible y diferencia claramente **Cancelar** de **Sí, eliminar acta**.
- El diálogo usa tokens semánticos para temas claro/oscuro, diseño adaptable, foco inicial en la opción segura, cierre mediante `Escape`, botón de cierre o backdrop, y bloqueo de todos los cierres mientras `DELETE /actas/{id}` está en curso. Un error mantiene el acta y permite reintentar; el éxito cierra el modal, actualiza el listado y conserva la notificación temporal existente.
- No cambiaron el endpoint, DTO, permisos, rutas, dependencias, variables, schemas, seeds ni datasets. El contrato sigue siendo `DELETE /actas/{id}` sin cuerpo y respuesta exitosa sin contenido.
- Stack comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No existen seeds locales para actas: el contenido proviene del backend configurado mediante las variables Vite.
- Verificación local: ESLint focalizado PASS, suite Node 58/58 PASS, build de producción PASS (314 módulos) y `git diff --check` PASS. npm conserva el warning ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo por el chunk JavaScript mayor de 500 kB.

---

# Correccion 2026-09-24 — estados disponibles en Proyectos de grado

- El filtro **Estado** de Trabajo de investigacion de maestria y Tesis doctoral ahora sigue la misma regla de creditos condonables: ofrece unicamente los estados representados en los registros cargados para el listado actual. Por tanto, los estados de firma —o cualquier otro estado sin solicitudes visibles— ya no aparecen como opciones vacias.
- La regla aplica tanto a la vista estudiantil como a la de coordinacion y conserva **Todos** como opcion inicial. No cambian los registros, estados de dominio, endpoints, DTO, permisos, dependencias, variables, schemas, seeds ni datasets; solo cambia el catalogo visible del selector.
- Entorno exacto: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro arbol npm.
- Ejecucion: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; produccion: `npm run build` y `npm run preview`. No existen seeds locales: los estados y solicitudes provienen del backend institucional configurado mediante las variables Vite.
- Verificacion local: suite Node 58/58 y build de produccion (314 modulos) pasan; ESLint focalizado y `git diff --check` pasan. El lint global conserva 9 errores y 1 warning preexistentes fuera de este cambio; npm mantiene el warning ambiental `Unknown env config "http-proxy"` y Vite el aviso informativo por el chunk mayor de 500 kB.

---

# Corrección 2026-09-24 — filtro de solicitudes generales

- El selector **Tipo de solicitud** del listado de coordinación muestra
  exclusivamente los tipos autoritativos `1` (READMISION), `10` (AMPLIACION DE
  PERMANENCIA), `11` (OTRA) y `2` (HOMOLOGACION DE ASIGNATURAS). La misma regla
  filtra las filas recibidas para evitar que aparezcan trámites pertenecientes a
  créditos condonables o proyectos de grado.
- Las vistas exclusivamente asignadas de profesor y director conservan todos sus
  tipos, pues su acceso depende de la asignación. No cambian endpoints, DTO,
  dependencias, variables, schemas, seeds ni datasets; se sigue consumiendo
  `GET /sapp/tipoSolicitud`.

---

# Corrección 2026-09-24 — tipos de solicitud de Proyectos de grado

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables y proyectos de grado. React compone las rutas y vistas, los módulos TypeScript concentran reglas de presentación y servicios HTTP tipados, y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- **Trabajo de investigación de maestría** ofrece exclusivamente los tipos `9` (GRADO), `7` (DEFENSA), `6` (PROPUESTA) y `13` (ENVÍO DE TEMA).
- **Tesis doctoral** ofrece exclusivamente los tipos `9` (GRADO), `5` (DEFENSA), `8` (EXAMEN DE CANDIDATURA), `4` (PROPUESTA) y `13` (ENVÍO DE TEMA). El tipo `10` (AMPLIACION DE PERMANENCIA) no pertenece a ninguno de los dos catálogos.
- La candidatura doctoral se identifica con el ID `8`; GRADO se identifica con el ID `9`. El filtro continúa usando `GET /sapp/tiposSolicitud` y muestra los nombres entregados por el backend. No cambian endpoints, DTO, payloads, permisos, dependencias, variables, schemas, seeds ni datasets.
- Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No hay seeds locales: los catálogos y registros provienen del backend configurado mediante las variables Vite existentes.
- Entorno único: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Verificación local: regresiones dirigidas 8/8 y suite Node 56/56 pasan; ESLint focalizado, build de producción (313 módulos) y `git diff --check` pasan. El build mantiene el aviso informativo del chunk mayor de 500 kB y npm el warning ambiental `Unknown env config "http-proxy"`.

---

# Actualización 2026-09-24 — filtro por nivel en matrícula académica

Minerva es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables y trabajos de grado. La aplicación usa páginas React de composición, módulos TypeScript de dominio y servicios HTTP tipados; el backend Spring Boot/PostgreSQL mantiene las reglas y la persistencia.

- En la creación estudiantil de matrícula académica, el buscador de materias ahora tiene a su lado un selector de nivel construido dinámicamente a partir del catálogo recibido. **Todos** conserva el comportamiento anterior y cada opción **Nivel N** limita las materias regulares al nivel elegido.
- Las electivas (`nivel: null`) permanecen visibles con cualquier nivel seleccionado. El filtro continúa combinándose con la búsqueda por nombre/código y excluye materias que el estudiante ya agregó.
- El control usa los tokens semánticos existentes, etiquetas visibles y foco accesible; permanece en dos columnas en escritorio/tablet y se apila en móviles estrechos. No cambiaron endpoints, payloads, DTO, rutas, permisos, dependencias, variables, seeds ni datasets.
- Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Los datos reales provienen del catálogo entregado por el backend configurado con las variables Vite existentes; no hay seeds locales.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni un segundo árbol npm.

---

# Actualización 2026-09-24 — resultado de proyecto de grado para estudiantes

Minerva es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables y trabajos de grado. La aplicación usa páginas React de composición, módulos TypeScript de dominio y servicios HTTP tipados; el backend Spring Boot/PostgreSQL mantiene reglas y persistencia.

- El detalle estudiantil de una solicitud de proyecto de grado consulta `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}` y presenta un resumen del resultado final, fecha, nota cuando exista e información de sustentación disponible.
- La nueva sección lista únicamente los evaluadores activos para no confundir reemplazos históricos. Por cada evaluador muestra nombre, institución, estado de invitación y todas sus evaluaciones, distinguiendo concepto del documento o resultado/nota de sustentación junto con sus observaciones. Por privacidad, el correo retornado por el endpoint no se expone al estudiante.
- El contrato tipado admite tanto la sustentación anidada previa como los campos planos reales (`fechaSustentacion`, `modalidadSustentacion`, `lugarSustentacion`, `enlaceSustentacion`), además de `resultado`, `fechaResultado`, `orden` y fechas límite. No se agregaron endpoints, dependencias, variables, seeds ni datasets.
- Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Los datos reales provienen del backend configurado con las variables Vite existentes.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni un segundo árbol npm. Verificación: suite Node 53/53, ESLint focalizado, build de producción y `git diff --check` pasan.

---

# Correcciones 2026-09-24 — títulos y filtros de gestión

Minerva es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables y trabajos de grado. Mantiene páginas React de composición, módulos TypeScript de dominio y servicios HTTP tipados; Spring Boot y PostgreSQL continúan siendo responsables de las reglas y la persistencia.

- **Gestión de profesores** conserva el título del `ModuleLayout` y elimina el segundo encabezado visual dentro de la tarjeta; la descripción y todas las pestañas, tablas y operaciones permanecen iguales.
- **Proyectos de grado** incorpora el tipo 9 (**GRADO**) al catálogo de Trabajo de investigación de maestría. El tipo sigue disponible también en Tesis doctoral; no cambian el endpoint `GET /sapp/tiposSolicitud`, sus DTO ni el filtrado de los demás tipos.
- **Créditos condonables** reconoce como `PFIR_DIR_TG` tanto la sigla como los nombres descriptivos **POR FIRMA DIRECTOR DE TG**, **POR FIRMA DIRECTOR DE TESIS** y las variantes de trabajo de investigación. Así, un trámite que llegue con el nombre visible se representa en el filtro pendiente mediante la entrada de catálogo de ID 6.
- No se agregaron endpoints, migraciones, dependencias, variables, seeds ni datasets. Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Los datos reales provienen del backend configurado mediante las variables Vite existentes.
- Entorno exacto comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni un segundo árbol npm.
- Verificación local: suite Node 50/50, ESLint focalizado, build de producción (309 módulos) y `git diff --check` pasan. El build conserva el aviso informativo de chunk JavaScript mayor de 500 kB y npm el warning ambiental `Unknown env config "http-proxy"`.

---

# Actualización 2026-09-24 — ajustes de matrícula financiera

SAPP Frontend es la SPA institucional de EISI–UIS para admisiones, estudiantes, matrículas, solicitudes, créditos, candidatura, trabajos de grado e informes. Las páginas React componen la experiencia, `src/modules` concentra dominio y transporte tipado, y el backend SAPP conserva cálculos, reglas de negocio y persistencia.

- El tablero financiero convoca siempre vigentes y nuevos con ambos indicadores en `true`; solicitudes y recordatorios se ejecutan sobre todos los elegibles del proceso, sin selección de filas y sin depender de filtros visibles. Las acciones incompatibles con BORRADOR, ABIERTO, CERRADO o PUBLICADO ya no se muestran.
- La tabla usa Nombre, Código, Programa académico, Tipo de estudiante, Estado, Semestre, Total y Acciones. Conserva búsqueda, programa, estado, alertas, paginación y desplazamiento horizontal contenido en móvil; el alta manual conserva el tipo de estudiante.
- Se retiró la promoción de la interfaz, pero el ajuste completo preserva su valor histórico en el payload. La creación no envía `procesoBaseId`; creación y edición envían siempre `baseSalud: 'SMMLV'`, sin mutar datos al consultar, y advierten antes de reemplazar una base histórica MATRÍCULA. Tarifas continúan administrándose desde la pantalla principal.
- Contratos existentes, exportación Excel y cálculos backend permanecen intactos; no hay endpoints, migraciones, dependencias ni seeds nuevos. La fixture visual aislada sigue en `tests/fixtures/matricula-financiera/preview.html`, con datos ficticios sin alertas de promoción.
- Entorno exacto: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; no crear venv, Conda, Poetry ni otro árbol npm. Ejecutar `npm run dev`, `node --test --test-isolation=none tests/*.test.ts` y `npm run build`; no existen seeds locales y los datos reales provienen del backend configurado en `.env`.

---

# Ajuste 2026-09-24 — selector compacto de informes

SAPP Frontend es la SPA institucional de EISI–UIS para admisiones, estudiantes,
matrículas, solicitudes, créditos, candidatura, trabajos de grado e informes. La
aplicación separa páginas de composición, módulos de dominio y servicios HTTP
tipados; el backend SAPP mantiene las reglas de negocio y la persistencia.

- En **Informes a dependencias**, la franja introductoria usa menos altura y las
  opciones **Admisión**, **Matrícula** y **Créditos condonables** muestran solo
  su nombre. Al retirar las descripciones secundarias y reducir el padding, los
  tres botones son más compactos sin cambiar la selección ni sus estados.
- El ajuste es exclusivamente visual y conserva tokens semánticos, temas claro
  y oscuro, rutas, permisos, contratos, DTO y servicios existentes. No agrega
  dependencias, variables, schemas, seeds ni datasets.
- Stack exacto instalado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3,
  React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint
  9.39.2. Reutilizar `node_modules`; este frontend no usa venv, Conda ni Poetry.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none
  tests/*.test.ts`; producción: `npm run build` y `npm run preview`. Los datos
  se obtienen del backend configurado con las variables Vite de `.env.example`.

---

# Actualización 2026-09-24 — matrícula paginada y acceso estudiantil confiable

SAPP Frontend es la SPA institucional de EISI–UIS para admisiones, estudiantes, matrículas, solicitudes, créditos, candidatura y trabajos de grado. La aplicación mantiene una arquitectura React por páginas y módulos de dominio: las páginas componen la experiencia, `src/modules` concentra componentes/servicios tipados, `src/api` encapsula el transporte y el backend SAPP conserva las reglas de negocio y persistencia PostgreSQL.

- El listado de matrículas académicas de coordinación ahora pagina en cliente grupos de 10 registros, reinicia en la primera página al cambiar cualquier filtro y usa el mismo patrón visual/accesible de Solicitudes. La tabla y las tarjetas móviles consumen exactamente el mismo segmento paginado.
- Las tarjetas de documentos del detalle coordinador del estudiante ya no presentan el metadato **Tamaño**; conservan archivo, fecha, estado y acciones.
- El tablero horizontal limpia la supresión residual de clic al iniciar cada gesto. Esto evita que un arrastre anterior sin evento `click` obligue a pulsar varias veces para abrir un estudiante, sin perder la protección que impide navegar al finalizar un arrastre real.
- Stack exacto instalado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. El lockfile y `/workspace/SAPP-frontend/node_modules` son el entorno único; no se usa Python, venv, Conda ni Poetry.
- Ejecución: `npm run dev`; validación: `npx eslint <archivos>`, `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No hay seeds ni datasets nuevos: los datos provienen del backend configurado mediante las variables Vite existentes.

---

# Corrección 2026-09-24 — paginador consistente en matrícula financiera

- El paginador compartido de matrícula financiera adopta la misma presentación sobria del módulo de Solicitudes: alineación a la derecha, texto secundario y controles compactos con fondo de superficie, borde semántico y forma pill. En pantallas pequeñas se centra y, en móviles, distribuye las acciones en dos columnas con el indicador de página encima.
- Se retiró la reutilización visual de los botones de acción financiera, que hacía que la navegación se viera sobredimensionada y con el color primario. El componente conserva el mismo contrato `pagina`, `total` y `onChange`, limita el total visible a una página y mejora su semántica con botones `type="button"`, etiqueta contextual y anuncio no intrusivo del estado.
- El ajuste es exclusivamente de presentación y accesibilidad: no modifica rutas, permisos, API, DTO, dependencias, variables, seeds ni datasets. Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build`.
- Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; no crear venv, Conda, Poetry ni otro árbol npm.

---

# Corrección 2026-09-24 — encabezados más concisos en solicitudes y proyectos

- El listado de coordinación ya no repite **Solicitudes** dentro de la tarjeta cuando `ModuleLayout` ya presenta ese título. La sección conserva un nombre accesible mediante `aria-label`, y **Solicitudes asignadas** mantiene su encabezado propio cuando corresponde.
- El encabezado de **Trabajo de investigación de maestría** y **Tesis doctoral** deja de mostrar el texto provisional sobre “esta primera etapa”; se conservan el contexto del perfil y el título académico.
- El cambio es exclusivamente de presentación: no modifica filtros, tablas, rutas, roles, endpoints, DTO, dependencias, variables, seeds ni datasets. Desarrollo: `npm run dev`; producción: `npm run build`.
- Verificación local: 48/48 pruebas Node, ESLint focalizado, build (309 módulos) y `git diff --check` pasan. El build conserva el aviso informativo del chunk mayor de 500 kB y npm el warning ambiental `Unknown env config "http-proxy"`.
- Entorno: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; no crear venv, Conda, Poetry ni otro árbol npm.

---

# Corrección 2026-09-24 — estado único en tarjetas de estudiantes

- Las tarjetas del listado de estudiantes muestran el estado académico una sola vez, en la insignia ubicada bajo la fotografía. Se eliminó la segunda aparición de **Activo** o **Inactivo** en el bloque de detalles y se conserva la cohorte tanto en escritorio como en móvil.
- El cambio es exclusivamente de presentación en `EstudianteCard`: no modifica filtros, navegación, permisos, DTO, endpoints, dependencias, variables, seeds ni datasets. El listado continúa consumiendo `estadoAcademico` y la ruta de detalle sigue siendo `/coordinacion/estudiantes/{id}`.
- Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build`. Verificación local: 48/48 pruebas, ESLint focalizado, build (309 módulos) y `git diff --check` pasan. El lint global conserva 9 errores y 1 warning preexistentes fuera de este cambio.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; este frontend no usa venv, Conda ni Poetry y no requiere seed local.

# Actualización 2026-09-24 — directorio del banco de evaluadores

- **Agregar evaluador** y **Reemplazar** ya no consultan el banco mientras se escribe el correo. El formulario ofrece **Buscar en el directorio**, carga el listado completo con `GET /sapp/procesoEvaluacionTg/jurados/banco` y solo envía `?q=...` cuando coordinación ejecuta explícitamente el filtro por nombre, correo o institución.
- Cada resultado muestra nombre, correo, institución, procedencia, idioma, número de participaciones y última participación. **Seleccionar** cierra el directorio y completa automáticamente nombre, correo, institución, indicador de evaluador externo e idioma; los campos permanecen editables antes de guardar.
- El directorio contempla carga, lista vacía y error, funciona con los tokens semánticos de los temas claro/oscuro y se reorganiza en una columna en móvil. No cambiaron el payload de designación, los permisos, el esquema, las dependencias, las variables, los seeds ni los datasets.
- Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build`. Verificación local: 48/48 pruebas, ESLint focalizado, build (308 módulos) y `git diff --check` pasan. El build conserva el aviso informativo del chunk mayor de 500 kB y npm el warning ambiental `Unknown env config "http-proxy"`.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; este frontend no usa venv, Conda ni Poetry y no requiere seed local.

# Corrección 2026-09-24 — título obligatorio al crear proyectos de grado

- Toda solicitud de proyecto de grado que presenta el campo de título exige ahora un valor no vacío antes de registrarse. La regla cubre propuestas y defensas doctorales (tipos 4 y 5), propuestas y defensas de maestría (tipos 6 y 7) y examen doctoral (tipo 8); además del `required` nativo, la validación rechaza valores compuestos solo por espacios.
- La configuración del título, su etiqueta académica y la necesidad de resumen quedaron centralizadas en `src/modules/solicitudes/utils/datosTrabajoSolicitud.ts`. Solo los tipos 4, 5, 6 y 7 exigen resumen; el tipo 8 continúa enviando únicamente `tituloTrabajo`. Los tipos que no muestran el control no agregan estos campos al payload.
- No cambiaron endpoints, DTO, roles, esquema, dependencias, variables, seeds ni datasets. `POST /sapp/solicitudesAcademicas` conserva `tituloTrabajo` como campo condicional del contrato existente.
- Verificación: 47/47 pruebas Node y ESLint focalizado pasan; el build de producción pasa (308 módulos). El lint global conserva 9 errores y 1 warning preexistentes fuera de este cambio. Entorno: Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; no hay venv, Conda ni Poetry.

# Actualización 2026-09-24 — director de trabajo de grado en perfiles estudiantiles

- El perfil del usuario muestra el nombre y correo del director de trabajo de grado dentro de **Información académica** cuando la sesión corresponde a un estudiante. El detalle de coordinación presenta los mismos campos para el estudiante consultado.
- Se incorporó el contrato opcional y anulable `directorTg: { nombreCompleto, correo } | null` tanto a `detalle.estudiante` de `GET /inicio` como a cada registro de `GET /sapp/estudiantes/consulta`. Si el backend entrega `null`, ambos valores se renderizan vacíos, sin texto sustituto.
- No cambiaron endpoints, permisos, dependencias, variables, seeds ni datasets. Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; validación de producción: `npm run build`.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; el proyecto no usa venv, Conda ni Poetry.

# Corrección 2026-09-24 — solicitudes asignadas ocultas para coordinación

- El usuario con rol exacto `COORDINADOR_POSGRADOS` deja de ver el bloque **Solicitudes asignadas** tanto en el módulo general de **Solicitudes** como en los listados de **Proyectos de grado**. Las solicitudes asignadas también permanecen excluidas del listado general, por lo que no se duplican ni reaparecen allí.
- El cambio es exclusivo de ese rol. Administración, secretaría, dirección, docentes y estudiantes conservan sus listados y permisos actuales; en particular, los docentes siguen usando **Solicitudes asignadas** para atender los trámites que les corresponden.
- Se reutilizan `GET /sapp/solicitudesAcademicas` y `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarios_sapp.id}` para calcular la exclusión. No cambiaron endpoints, DTO, transiciones, dependencias, variables, seeds ni datasets.
- Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; validación de producción: `npm run build`. Entorno verificado: Node.js 24.15.0, npm 11.4.2, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `node_modules`; no hay venv, Conda ni Poetry.

# Implementación 2026-09-24 — matrícula financiera

- Se completaron las nueve operaciones de interfaz pendientes y el flujo documental: detalle, respaldo por coordinación, ajustes/observaciones, exclusión/reinclusión, edición del proceso, proceso base, alta manual y tarifas. Tablero con filtros/paginación, selección y envíos por lotes, resultados de omitidos y publicación validada. El estudiante dispone de plazo, respuestas, certificado y desglose disponible.
- [Detalle de implementación y validación](docs/matricula-financiera-implementacion-2026-09-24.md). Se mantienen `/api/sapp`, los perfiles actuales y los cálculos del servidor. La auditoría anterior describe el estado previo a esta implementación.
- Verificación: 44/44 pruebas Node, TypeScript y ESLint focalizado PASS; build PASS (305 módulos); recorridos en navegador con datos ficticios PASS. Pendiente validar contratos/permisos y Excel con backend institucional; no hubo despliegue ni correos reales.
- Desarrollo: `npm run dev`; prueba manual aislada en `/tests/fixtures/matricula-financiera/preview.html`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build`. El banco usa datos en memoria y no está incluido en la entrada de producción.
- Entorno sin dependencias nuevas: Node 24.11.0/npm 11.6.1 en Windows. React/DOM 19.2.3, Router 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, ESLint 9.39.2. Reutilizar `node_modules`; no hay seeds de backend ni entornos Python.

# Auditoría 2026-09-24 — cobertura de matrícula financiera

- [Análisis de flujos y brechas](docs/auditoria-matricula-financiera-2026-09-24.md): contraste de los dos HTML aportados con el código actual. La UI conecta 15 de las 24 operaciones documentadas; faltan detalle, respaldo, ajustes, exclusión/reinclusión, edición del proceso, alta manual y tarifas, además de documentos y feedback de envíos. Esta entrada documenta hallazgos; no implementa cambios funcionales.
- La publicación ya existe. Según el contrato revisado, los valores pueden consultarse al quedar la fila LIQUIDADA, antes de publicar; publicación avisa y congela. Los textos actuales de la guía visual necesitan corregirse. Se conserva la decisión local de base `/api/sapp`; el prefijo diferente de los HTML queda pendiente de verificación del gateway.
- Prueba dirigida: `node --test --test-isolation=none tests/matriculaFinancieraFlow.test.ts`, 3/3 PASS. Sin validación de backend ni navegador en esta revisión.
- Entorno Windows observado: Node 24.11.0/npm 11.6.1; las referencias anteriores a Node 24.15.0/npm 11.4.2 pertenecen a otro entorno. Se conserva el árbol `node_modules` del repositorio y el lockfile (React/DOM 19.2.3, Router 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, ESLint 9.39.2). Ejecución: `npm run dev`; compilación: `npm run build`. No hay seeds locales ni entornos Python.

# Ajuste 2026-09-24 — presentación estudiantil de matrícula

- Para el perfil estudiante, la opción financiera se presenta como **Liquidación** tanto en la portada de Matrícula y el submenú lateral como en el encabezado de la vista. Los perfiles de gestión conservan el nombre **Matrícula financiera**.
- La portada estudiantil describe **Matrícula académica** como “Registra asignaturas y documentos requeridos para el proceso de matrícula.” y **Liquidación** como “Información para proceso de liquidación.”; coordinación conserva sus textos operativos.
- El botón manual **Actualizar** de la vista de liquidación se oculta únicamente al estudiante. La carga inicial y la recarga automática después de guardar respuestas siguen activas; no cambiaron rutas, endpoints, contratos, dependencias, variables, seeds ni datasets.
- Se corrigió la alineación horizontal de Matrícula en el sidebar eliminando el padding duplicado del contenedor padre. Se mantiene el árbol npm existente (Node.js 24.15.0/npm 11.4.2) y no se usan venv, Conda ni Poetry.

# Actualización 2026-09-24 — guía y cierre del flujo de matrícula financiera

- La portada de matrícula financiera incorpora una **Guía de servicios** inicial adaptada al rol: coordinación recorre configuración, convocatoria, revisión y publicación; el estudiante recorre solicitud, respuestas, revisión y consulta del resultado.
- El formulario de creación ahora expone todas las reglas enviadas al backend (fuente del SMMLV, porcentajes de votación/salud y base de salud) con restricciones básicas. El tablero habilita la publicación únicamente desde `CERRADO`, exige fecha límite de pago y usa el endpoint existente `POST /liquidacionMatricula/procesos/{id}/publicar`.
- La matriz de acciones por estado quedó centralizada y probada. No cambiaron endpoints, DTO, autenticación, dependencias, variables, seeds ni datasets.

# Corrección 2026-09-24 — base API unificada para matrícula financiera

- Matrícula financiera conserva ahora la misma base configurada que el resto del proyecto: con `VITE_API_URL=https://sapp.eisi.online/api/sapp`, sus solicitudes se envían a `https://sapp.eisi.online/api/sapp/liquidacionMatricula/...`.
- La capa del módulo ya no elimina el segmento `/sapp`; únicamente normaliza barras finales antes de agregar `/liquidacionMatricula`. No cambiaron endpoints relativos, payloads, autenticación, dependencias, variables, seeds ni datasets.

# Actualización 2026-09-24 — módulo de matrícula financiera y navegación jerárquica

- **Matrícula** es ahora un módulo contenedor en `/matricula`: su portada ofrece **Matrícula académica** (`/matricula/academica`) y **Matrícula financiera** (`/matricula/financiera`). El menú lateral despliega ambas opciones y conserva comportamiento accesible en escritorio y móvil.
- Matrícula financiera decide la experiencia por rol: coordinación/administración/secretaría gestiona procesos, resumen, filtros, convocatoria, correos, recálculo, cierre, exportación Excel y marcado de filas; estudiantes consultan `GET /mias`, responden únicamente las preguntas entregadas por el backend y ven el total cuando está disponible. El detalle coordinador está protegido también en la ruta.
- La capa `src/modules/matricula-financiera/api.ts` encapsula el contrato `/liquidacionMatricula`, agrega `X-Internal-Token`, conserva los mensajes españoles de error y descarga Excel como blob. Los importes se presentan sin calcularlos ni redondearlos en el frontend; las fechas-hora del contrato se tratan como hora Colombia sin conversión UTC.
- El backend dev esperado es `https://sapp.eisi.online/api/sapp/liquidacionMatricula`. No hay seeds locales: para la prueba integrada se usa un periodo libre y los datos históricos del backend (68 estudiantes en el escenario documentado); los correos de dev llegan a MailPit. Reutilice el `node_modules` existente y no cree venv, Conda, Poetry ni otro árbol npm.

# Actualización 2026-09-24 — histórico y documento correcto al designar evaluadores

- En el detalle de las solicitudes de trabajo de grado, la sección antes titulada **Línea de tiempo** se presenta ahora como **Histórico de cambios**. Continúa consumiendo `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/historial` y mostrando los cambios reales reportados por el backend.
- **Agregar evaluador** ya no muestra la opción **Enviar invitación al guardar**: toda designación nueva envía `enviarInvitaciones: true` de manera obligatoria. El reemplazo conserva su flujo existente de reemplazar e invitar.
- Al crear un jurado, el frontend persiste primero el documento elegido con `PUT /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/documento-evaluar/{documentoId}` y después ejecuta `POST /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/jurados`, cuyo payload conserva el mismo `documentoEvaluarId`. Así se evita que el backend use como alternativa el último documento cargado (por ejemplo, `1192`) cuando coordinación seleccionó explícitamente otro (por ejemplo, `1191`), y la invitación se genera contra la selección ya persistida.
- No cambiaron rutas, DTO de designación, permisos, dependencias, variables de entorno, seeds ni datasets. El frontend usa Node.js 24.15.0, npm 11.4.2 y las versiones fijadas por `package-lock.json`; se ejecuta con `npm run dev`, sin entornos Python ni pasos de seed.

---

# Minerva Frontend — EISI UIS

Frontend institucional para centralizar los procesos de posgrado EISI–UIS: admisiones,
matrícula, solicitudes, créditos condonables, estudiantes, trabajos de grado,
reportes, actas y configuración académica. Es una SPA modular que consume la API
Spring Boot mediante servicios HTTP; React Router controla rutas protegidas y los
módulos conservan separados contratos, servicios, componentes y páginas.

## Mejora reciente — evaluación del examen de candidatura doctoral (2026-09-23)

- El examen de candidatura (tipo de solicitud `8`, código `CAND_DOCTORAL`) forma
  parte del listado doctoral de **Proyectos de grado** y reutiliza el proceso
  completo de propuesta/defensa: designación y gestión de jurados, conceptos,
  correcciones, sustentación, resultado e historial.
- Su detalle muestra el **Título** del proyecto, pero oculta el **Resumen**, aun
  si una respuesta histórica del backend lo incluyera. El resto de propuestas y
  defensas conserva ambos campos.
- En la tabla de jurados, una evaluación del momento `SUSTENTACION` muestra
  **Nota** y consume `evaluacion.nota` para `CAND_DOCTORAL`. Los otros procesos
  continúan mostrando **Resultado** desde el catálogo. No cambiaron endpoints,
  payloads, esquema, dependencias, variables de entorno, seeds ni datasets.

## Mejora reciente — navegación del listado de estudiantes (2026-09-23)

- La rueda vertical del ratón desplaza horizontalmente los tableros de
  estudiantes mientras todavía exista contenido en esa dirección. Al alcanzar
  cualquiera de los extremos, el desplazamiento vuelve a la página para no
  encerrar la navegación.
- Toda la tarjeta abre el perfil, además del botón **Ver perfil**. La tarjeta es
  alcanzable por teclado y responde a `Enter` o barra espaciadora; arrastrar el
  tablero continúa desplazándolo sin abrir un perfil accidentalmente.
- No cambiaron rutas, servicios, DTO, permisos, dependencias, variables de
  entorno, seeds ni datasets. El detalle conserva la ruta
  `/coordinacion/estudiantes/{id}` y el estado previo del listado.

## Actualización de programas académicos (2026-09-23)

- El catálogo vigente usa **302 — MAESTRÍA EN INGENIERÍA DE SISTEMAS E
  INFORMÁTICA** (id `1`, nivel `MAESTRIA`) y **347 — DOCTORADO EN CIENCIAS DE LA
  COMPUTACION** (id `2`, nivel `DOCTORADO`). `codigo_uis` ya no corresponde a
  `61412`/`61204` y `nombre` ya no contiene las siglas `MISI`/`DCC`.
- La resolución y presentación se centralizaron en
  `src/shared/domain/programaAcademico.ts`. Catálogos, filtros y visualizaciones
  consumen el nombre y código vigentes; la lectura mantiene compatibilidad con
  respuestas históricas para no romper registros ya persistidos. Las siglas que
  forman parte de códigos reglamentarios de trámites o asignaturas no se alteraron.
- El contrato tolera las formas camelCase y snake_case de `codigo_uis` y
  `codigo_idp`, además del legado `codigoNombre`. No cambiaron los endpoints: el
  catálogo se obtiene de `GET /sapp/programaAcademico` y los procesos continúan
  enviando `programaId`.
- No se agregaron dependencias, variables, seeds ni datasets. Se usa el único
  `node_modules` existente; este repositorio no usa venv, Conda ni Poetry.

## Stack y ejecución

Entorno verificado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3,
React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint
9.39.2. Las versiones exactas resueltas están en `package-lock.json`.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`VITE_API_URL` vale `/api/sapp` y `VITE_DEV_PROXY_TARGET` apunta por defecto a
`http://localhost:8080`. No existe un proceso de seeds: todos los catálogos se
obtienen del backend. Use `npm run lint`, `npm run build` y `npm run preview`
para validación y previsualización de producción.

## Corrección reciente — firma por responsable actualmente asignado (2026-09-23)

- **Firmar todos los documentos** depende ahora de la asignación vigente de la persona autenticada, sin restringirse a un rol concreto. En créditos condonables se compara `solicitudCreditoCondonable.personaAsignadaId` con `session.user.persona.id`; por ejemplo, los IDs `65` del director y de la asignación habilitan la acción en `PFIR_CAR_CONT`.
- Si el detalle identifica expresamente a otra persona, esa información prevalece y el botón se oculta aunque el trámite hubiera aparecido antes en el listado de asignadas. Para otros tipos de solicitud que aún no exponen el responsable en su detalle, se conserva como respaldo `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarioSappId}`.
- Después de firmar se invalidan la asignación local y se recargan el detalle y los documentos. El botón solo vuelve a mostrarse si la respuesta actualizada confirma que la misma persona continúa asignada y el estado sigue siendo firmable. El backend continúa siendo la autoridad final del `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}`.
- No se agregaron dependencias, variables de entorno, seeds, datasets ni cambios de esquema. Se reutiliza `node_modules`; desarrollo con `npm run dev` y build con `npm run build`. Stack instalado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2.

## Corrección reciente — agendamiento tras recibir ajustes (2026-09-23)

- El detalle de coordinación de trabajos de grado muestra **Programar sustentación** tanto en `CONCEPTOS_REC` como en `AJUSTES_RECIB`; también tolera los nombres descriptivos **CONCEPTOS RECIBIDOS** y **AJUSTES RECIBIDOS** entregados por el backend.
- La regla se centralizó y conserva el comportamiento previo para `EN_AJUSTES`. No cambiaron el formulario, el endpoint `POST /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/sustentacion`, su payload, los permisos ni las validaciones del backend.
- No se agregaron dependencias, variables de entorno, seeds o datasets. La regresión se cubre con una prueba Node específica de los estados habilitados y bloqueados.

## Corrección reciente — estado de ajustes recibidos en proyectos de grado (2026-09-23)

- El estado de evaluación `AJUSTES_RECIB`, entregado por el backend con el nombre **AJUSTES RECIBIDOS**, se reconoce ahora en las solicitudes de proyectos de grado y deja de mostrarse como **DESCONOCIDO**.
- El mapeo compartido se aplica tanto al listado como al detalle individual para estudiantes y coordinación. La insignia reutiliza la variante visual de revisión y mantiene la compatibilidad con los temas claro y oscuro.
- No cambiaron endpoints, DTO, transiciones, dependencias, variables de entorno, seeds ni datasets; el backend continúa siendo la autoridad del flujo académico.

## Mejora reciente — acciones de evaluación de proyectos de grado (2026-09-23)

- En el detalle de coordinación, **Agregar evaluador** está ahora integrado en la cabecera de la tabla de jurados y abre el mismo formulario que selecciona el documento a evaluar. Se retiró la acción independiente **Definir documento** para evitar que el flujo ofreciera dos lugares distintos para escogerlo.
- La acción **Enviar a ajustes** se presenta como **Enviar a correcciones**. Cuando el proceso permite pasar a sustentación, una tarjeta destacada confirma que los conceptos están completos y ofrece directamente **Programar sustentación**.
- La mejora es exclusivamente de presentación: conserva estados, permisos, payloads y endpoints del proceso de evaluación. Los estilos usan los tokens semánticos del tema y se adaptan a móvil, modo claro y modo oscuro.

## Corrección reciente — cierre de la firma docente al reasignar (2026-09-23)

- Después de que un docente firma correctamente los documentos de un crédito condonable asignado, la interfaz consume de inmediato su asignación local y oculta **Firmar todos los documentos**. Esto evita que el botón permanezca disponible cuando el nuevo estado también es de firma, pero el trámite ya corresponde a otra persona.
- La regla sigue exigiendo simultáneamente un estado firmable y una asignación vigente al docente. El detalle y los documentos se recargan como antes; el backend continúa siendo la autoridad de autorización y transición.
- No se agregaron contratos, dependencias, variables de entorno, seeds, datasets ni cambios de esquema. La regresión está cubierta en `tests/firmaSolicitud.test.ts`.

## Corrección reciente — firma docente de créditos condonables asignados (2026-09-23)

- Se corrigió el motivo por el que un docente veía un crédito condonable en **Solicitudes asignadas**, pero no encontraba la acción de firma: el detalle restringía `Firmar todos los documentos` exclusivamente a los roles de gestión de posgrados.
- Un usuario con rol `DOCENTE_POSGRADOS` puede ahora firmar cuando el trámite aparece en `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarioSappId}` y el estado es de firma. La comprobación reconoce tanto los nombres que contienen `POR FIRMA` como las siglas `PFIR_DIR_TG`, `PFIR_COOR_POS` y `PFIR_CAR_CONT`.
- La asignación se valida nuevamente al abrir el detalle; navegar manualmente a una solicitud ajena no habilita el botón. Los perfiles de gestión conservan el comportamiento anterior y el backend sigue siendo la autoridad final del `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}`.
- No se agregaron paquetes, variables de entorno, seeds, datasets ni cambios de esquema. Desarrollo: `npm run dev`; verificación: `node --test tests/firmaSolicitud.test.ts`, ESLint focalizado y `npm run build`.

## Corrección reciente — título y resumen en el detalle de trabajo de grado (2026-09-23)

- El detalle compartido de la solicitud muestra ahora **Título** y **Resumen**, en ese orden y justo antes de **Observaciones**, tanto para coordinación como para estudiantes cuando esos datos fueron solicitados al crear el trámite.
- La vista prioriza `tituloTrabajo` y `resumenTrabajo` de `GET /sapp/solicitudesAcademicas/{id}`. Para los trámites con proceso de evaluación también consulta `GET /sapp/procesoEvaluacionTg/solicitud/{id}` y usa sus campos `titulo` y `resumen` como respaldo; así cubre el contrato real del proceso sin cambiar el payload de creación.
- Si el proceso aún no existe (por ejemplo, antes de aprobar la solicitud), la consulta opcional no bloquea el resto del detalle. No se agregaron endpoints, dependencias, variables de entorno, seeds, datasets ni cambios de esquema.
- Verificación local: ESLint focalizado, build de producción y `git diff --check` pasan. El build transformó 283 módulos y produjo `index-Ch9v6k1n.css` e `index-Bj4f55CP.js`; permanece el aviso informativo conocido por el chunk JavaScript mayor de 500 kB.

## Corrección reciente — aprobación contextual de proyectos de grado (2026-09-23)

- En el detalle de una solicitud de proyecto de grado enviada al Comité Asesor de Posgrados, la acción principal se presenta como **Aprobar y enviar a consejo académico**.
- Cuando esa solicitud ya está enviada al Consejo Académico, la misma acción se presenta como **Aprobar y asignar jurados**. Los demás tipos de solicitud conservan la etiqueta **Aprobar**.
- El ajuste es exclusivamente descriptivo: conserva el flujo, la selección obligatoria del acta, los permisos, las transiciones y los contratos HTTP existentes. No agrega dependencias, variables de entorno, seeds, datasets ni cambios de esquema.

## Corrección reciente — acciones disponibles en la evaluación (2026-09-23)

- El panel de coordinación del proceso de evaluación ya no repite el resumen de estudiante, programa, fecha límite y documento, pues esos datos ya están disponibles en el detalle de la solicitud.
- La barra muestra exclusivamente las acciones permitidas por el estado actual. Durante una mutación, las acciones que ya eran válidas permanecen visibles y se bloquean temporalmente para evitar envíos duplicados.
- La tabla de jurados presenta **Acciones** solo cuando al menos un jurado activo puede gestionarse. Las filas inactivas no muestran controles y, cuando ninguna fila admite operaciones, se omite también el encabezado completo de la columna.
- No cambiaron estados, permisos, endpoints, DTO, dependencias, variables de entorno, seeds ni datasets; el backend continúa siendo la autoridad sobre las transiciones del proceso.

## Corrección reciente — catálogo completo de estados en proyectos de grado (2026-09-23)

- Los filtros de **Proyectos de grado** muestran ahora el catálogo completo retornado por `GET /sapp/estadosSolicitud`, tanto para estudiantes como para coordinación. Esto incluye los estados generales del trámite (envío, revisión, aprobación, rechazo, devolución y firmas) y los estados propios de evaluación, ajustes y sustentación.
- Seleccionar un estado sin solicitudes asociadas produce el resultado vacío habitual, en vez de retirar ese estado del selector. Los demás módulos conservan el comportamiento anterior de mostrar únicamente los estados presentes en sus listados.
- No cambiaron transiciones, permisos, endpoints, DTO, esquema, dependencias, variables de entorno, seeds ni datasets; el backend continúa siendo la autoridad sobre qué transiciones son válidas.

## Corrección reciente — títulos académicos en proyectos de grado (2026-09-23)

- Al crear solicitudes de maestría (tipos 6 y 7), el campo obligatorio se identifica como **Título del trabajo de investigación**; para las solicitudes doctorales de propuesta o defensa (tipos 4 y 5), se identifica como **Título de la tesis**. Los cuatro tipos conservan el resumen obligatorio.
- El tipo 8, **Examen doctoral**, muestra únicamente **Título del trabajo**: no presenta ni exige el resumen y envía `tituloTrabajo` sin `resumenTrabajo` en `POST /sapp/solicitudesAcademicas`.
- No cambiaron rutas, permisos, endpoints, esquema, dependencias, variables de entorno, seeds ni datasets. La distinción usa los IDs estables del catálogo y mantiene el contrato existente del backend.

## Corrección reciente — reasignación del documento ajustado (2026-09-23)

- Cuando un estudiante carga la nueva versión solicitada para un trabajo de grado en estado `EN_AJUSTES`, el frontend conserva primero el documento mediante `POST /sapp/document` y utiliza el `id` real de esa respuesta como `documentoId` para llamar inmediatamente a `PUT /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/documento-evaluar/{documentoId}`.
- Esta reasignación es exclusiva del formulario estudiantil que aparece cuando los evaluadores devolvieron el trabajo con observaciones (`EN_AJUSTES`, estado 16). El manejador comprueba nuevamente ese estado antes de cargar y asignar; no se ejecuta al adjuntar documentos inicialmente ni desde otros estados o acciones de coordinación.
- El refresco del proceso, la solicitud, el checklist y los adjuntos ocurre únicamente después de completar ambas operaciones. El mensaje de éxito confirma que la versión recién creada quedó asignada como el documento que deben evaluar los jurados; un error de asignación no se presenta como éxito completo.
- No cambiaron el payload documental, los roles, los estados, las rutas de interfaz, las dependencias, las variables de entorno, los seeds ni los datasets. El flujo reutiliza `definirDocumentoEvaluar` y el cliente HTTP autenticado existentes.

## Corrección reciente — datos del trabajo al crear solicitudes (2026-09-23)

- En **Proyectos de grado**, el formulario estudiantil solicita ahora `tituloTrabajo` y `resumenTrabajo` para los tipos 4, 5, 6 y 7 (propuestas y defensas de doctorado/maestría). Ambos campos son obligatorios, se limpian antes del envío y se incluyen en `POST /sapp/solicitudesAcademicas` con `estudianteId` y `tipoSolicitudId`.
- Los tipos de solicitud conservan en pantalla el campo `nombre` entregado por `GET /sapp/tipoSolicitud`. En particular, el tipo 13 se muestra como **ENVIO DE TEMA DE TRABAJO DE INVESTIGACION/TESIS** (o exactamente como lo entregue el backend) y ya no se reemplaza por una etiqueta contextual inventada por el frontend.
- No cambiaron rutas, permisos, endpoints, esquema, dependencias, variables de entorno, seeds ni datasets. Se reutilizan el formulario y los servicios existentes; los campos nuevos solo aparecen para los cuatro tipos indicados.
- Verificación local: ESLint focalizado y build pasan. El build transformó 281 módulos y generó `index-DhxWK-Ve.css` e `index-Ds21m2NR.js`; permanece el aviso informativo conocido por el chunk JavaScript superior a 500 kB. No hubo captura porque el contenedor no dispone de Chromium, Chrome ni Firefox y la ruta protegida requiere backend y sesión institucional.

## Funcionalidad reciente — proceso privado de evaluación de trabajos de grado (2026-09-22)

- El detalle autenticado de los cinco trámites con jurados (`DEF_TESIS_DCC`, `DEF_TI_MISI`, `CAND_DOCTORAL`, `PROP_TESIS_DCC` y `PROP_TI_MISI`) incorpora la sección de coordinación **Proceso de evaluación**. `TEMA_T` permanece expresamente fuera del proceso.
- La sección consume `/sapp/procesoEvaluacionTg`: consulta el proceso y catálogos, designa jurados con autocompletado del banco, conserva el historial de jurados inactivos, reenvía invitaciones, reemplaza o retira jurados, envía recordatorios, cambia el documento evaluado, envía a ajustes, programa la sustentación y registra el resultado.
- Los catálogos de estados, modalidades y resultados proceden del backend. Los formularios validan los requisitos inmediatos de modalidad; las transiciones y reglas académicas siguen siendo responsabilidad del backend y sus mensajes 400 se muestran al usuario.
- La evaluación se integra únicamente en el portal privado y solo para perfiles de gestión. No se añadió la ruta pública del evaluador ni una segunda API. El cliente compartido existente aporta el JWT Bearer y conserva la envoltura `{ ok, message, data }`.
- La vista usa los tokens globales, funciona en modo claro/oscuro y adapta tabla, formularios y acciones a móvil. No se agregaron paquetes, variables de entorno, seeds ni datasets. Desarrollo: `npm run dev`; validación: `npm run build` y `npm run lint`.

## Corrección reciente — clasificación de temas por programa (2026-09-22)

- Las solicitudes compartidas de tipo 13 (`TEMA_T`, **ENVÍO DE TEMA DE TRABAJO DE INVESTIGACIÓN/TESIS**) ya no se repiten en los dos apartados de Proyectos de grado: si `programaAcademico` contiene `DCC` se muestran únicamente en **Tesis doctoral**; cualquier otro programa se muestra únicamente en **Trabajo de investigación de maestría**.
- La misma clasificación se aplica a solicitudes asignadas, al listado general de coordinación y al listado/refresco del estudiante. `DCC` también determina la ruta permitida para un estudiante; cualquier otro valor se trata como maestría conforme a la regla acordada.
- Los demás tipos exclusivos de cada nivel conservan su distribución. No cambiaron endpoints, DTO, payloads, rutas, permisos, dependencias, variables de entorno, schemas, seeds ni datasets; el filtro usa el campo `programaAcademico` que ya entrega el listado de solicitudes.

## Decisión reciente — módulo inicial de Proyectos de grado (2026-09-22)

- Se creó el módulo protegido `/trabajos-grado`, con las rutas de **Trabajo de investigación de maestría** y **Tesis doctoral** para estudiantes y coordinación.
- Los tipos de solicitud 13, 9, 6 y 7 se presentan en la ruta de maestría; los tipos 13, 9, 8, 4 y 5 en doctorado. El tipo compartido 13 conserva su identificador y el nombre exacto entregado por el catálogo del backend.
- Esos seis tipos ya no se muestran ni se ofrecen para crear desde el módulo general de Solicitudes. No se cambiaron endpoints ni DTO: el nuevo módulo reutiliza por ahora los servicios, formularios, filtros, tablas y detalle existentes.
- El estudiante es dirigido al nivel inferido de su programa y no puede navegar al otro; coordinación dispone de ambos niveles. Las funcionalidades de expediente, avances, evaluadores, defensa y calificación se implementarán posteriormente.

## Decisión reciente — seguimiento de matrícula estudiantil y coherencia con coordinación (2026-09-21)

- Se confirmó el enrutamiento real: `/matricula` renderiza `MatriculaPage` y decide por rol entre la experiencia del estudiante y el listado de gestión; `/matricula/:matriculaId` renderiza `MatriculaDetalleCoordinacionPage` y conserva exclusivamente los controles de coordinación.
- Para estudiantes, la consulta real continúa siendo `GET /sapp/matriculaAcademica/vigente/estudiante/{estudianteId}`. El DTO deja de descartar programa, fecha de revisión, estado/grupo/observaciones por asignatura e identificador del registro matrícula-asignatura. La selección de una respuesta con varias matrículas ya no depende de `data[0]`: prioriza el período solicitado cuando existe contexto y, sin él, usa fecha de solicitud e ID como desempate determinista. Los documentos siguen en la consulta separada por trámite e ID de matrícula.
- La vista incorpora un resumen compacto con estado legible, número, programa disponible, período, fechas de solicitud/revisión y **Observaciones de la matrícula**. Las asignaturas conservan nombre, código y nivel, y añaden estado individual, grupo útil y observaciones destacadas. Las fechas sin zona se formatean sin construir un `Date`, evitando asumir UTC. Estados desconocidos se humanizan sin atribuirles una regla de negocio.
- Documentos conserva obligatoriedad, estado, fecha, observaciones y Cargar/Ver/Descargar. Cuando el catálogo completo está disponible muestra obligatorios aprobados/total; un error documental permanece separado y nunca se representa como cero. La carga queda bloqueada fuera de `PENDIENTE_DOCUMENTOS` con explicación, sin transferir controles de aprobación. Coordinación muestra las mismas etiquetas y añade las observaciones generales sin cambiar sus validaciones.
- Se añadió el fixture no productivo `tests/fixtures/matricula/student-matriculas.json` y una prueba Node sin dependencias para finalizada/matriculada, observación general, varias materias, grupo nulo, fechas ausentes, estado desconocido y selección entre períodos. No hay seeds. Build, ESLint focalizado, prueba y `git diff --check` pasan; el build generó `index-DhFeTLOW.css` e `index-DQeieq-z.js`, con el aviso informativo conocido por el chunk de 638.82 kB. No se pudo hacer validación visual/captura ni pruebas autenticadas a 320/375/402/440 px porque no hay navegador, backend o sesión institucional en el contenedor.

## Corrección reciente — colores de estados en solicitudes responsive (2026-09-21)

- Los listados de solicitudes académicas y créditos condonables comparten `StatusBadge` como fuente única para la normalización, etiqueta y color de sus ocho estados. La convención vigente es: enviada con el tono institucional, revisión y los tres pasos de firma en ámbar, aprobada en verde, rechazada en rojo, y devuelta/desconocida en tonos neutrales.
- Se eliminó la sobrescritura móvil de color, fondo y borde que aplicaba el mismo verde a todos los estados de las tarjetas de créditos condonables. El breakpoint de 768 CSS px ahora solo adapta tamaño, ajuste de línea y alineación; por tanto, una misma solicitud conserva exactamente su semántica cromática entre la tabla de escritorio, las tarjetas responsive y el detalle compartido, tanto en `body.light` como en `body.dark`.
- No cambiaron estados, etiquetas, filtros, orden, endpoints, DTO, navegación, permisos, dependencias, variables de entorno, seeds ni datasets. La aplicación continúa siendo un frontend React que consume los contratos REST de Spring Boot mediante los servicios del módulo; no existe script automatizado `test`.
- Verificación local: el build de producción transformó 272 módulos y generó `dist/assets/index-CtLOhbNR.css` e `index-C7FRZ1pi.js`; `git diff --check` y la comprobación estática de que el selector móvil no redefine colores pasan. Persiste únicamente el aviso informativo conocido por el chunk JavaScript de 635.45 kB.

## Decisión reciente — homologación de asignaturas responsive (2026-09-21)

- El alcance sigue siendo el frontend institucional para trámites de posgrado. La arquitectura no cambia: React renderiza las rutas protegidas, los componentes del módulo `solicitudes` encapsulan formulario/documentos y los servicios HTTP conservan los contratos de Spring Boot. Este ajuste se limita a la creación estudiantil y al detalle compartido `/solicitudes/:solicitudId` cuando el tipo es `HOMOLOG`.
- En escritorio se conservan las dos columnas del formulario y la tabla origen/destino del detalle. Hasta 640 CSS px, cada pareja de creación pasa a una columna; hasta 768 CSS px, cada fila del detalle pasa a una tarjeta que mantiene origen y destino juntos, verticales y en el orden del API. Los nombres/códigos largos ajustan línea y no se añadió `overflow-x: hidden`.
- Cada bloque del formulario conserva el UUID generado al crearse como `key` e identificador de controles. Agregar y quitar continúa actualizando por ese UUID, por lo que eliminar la pareja intermedia no reasigna las demás. El payload no cambió: origen registrado usa `asignatura_origen_id` + `asignatura_destino_id`; origen manual usa `nombreAsignaturaExterna`, el opcional `codigoAsignaturaExterna` y `asignatura_destino_id`.
- La validación vigente sigue exigiendo una pareja completa y al menos una pareja, sin restricciones nuevas. Tras intentar enviar, los errores también quedan asociados mediante `aria-invalid`/`aria-describedby` al origen o destino de su pareja. En móvil se muestra bajo cada selector el código y nombre completos de la selección, sin duplicar etiquetas visibles en escritorio.
- Los documentos adjuntos conservan nombre, descripción, Ver y Descargar. Su tabla se mantiene en escritorio y pasa a tarjetas hasta 768 CSS px, con nombre completo y acciones táctiles. No cambiaron roles, estados editables, aprobación exclusiva de coordinación, actas, endpoints, DTO, reglas, dependencias, seeds ni datasets.

### Ejecución y entorno exacto

```bash
npm install        # solo si node_modules no existe; reutilizar el árbol actual
npm run dev
npm run build
npm run lint
```

- Entorno único: `/workspace/SAPP-frontend` y su `node_modules`; no usa venv, Conda ni Poetry y no debe crearse un segundo entorno. Node.js 24.15.0 y npm 11.4.2.
- Versiones instaladas principales: React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2, typescript-eslint 8.51.0 y Lucide 0.468.0-local.
- No existe script automatizado `test`, seed ni dataset local. La aplicación requiere el backend, autenticación y datos institucionales para recorrer las rutas protegidas.

## Decisión reciente — detalle de matrícula responsive por rol (2026-09-21)

- La ruta de gestión `/matricula/:matriculaId` conserva en escritorio el resumen, la grilla documental de seis columnas y la tabla de asignaturas. Hasta 768 CSS px, las asignaturas se presentan como tarjetas y, hasta 960 px, los documentos usan tarjetas con requisito, estado, archivo completo, fecha, observaciones y filas separadas de visualización y validación. Aprobar/Rechazar documentos continúa siendo inmediato; las decisiones y comentarios de asignaturas mantienen el envío conjunto **Guardar validación de asignaturas**.
- La experiencia real del estudiante continúa en `/matricula`, no en una ruta de detalle independiente. Sus tablas de documentos y materias se transforman en tarjetas solo hasta 768 CSS px, usando el mismo estado React, inputs de archivo y manejadores existentes. Conserva carga/reemplazo permitido por estado, Ver/Descargar autenticados, selección y eliminación de materias y el envío vigente; nunca recibe controles de coordinación.
- Los cambios eliminan el desplazamiento horizontal móvil causado por `min-width` de las tablas sin ocultar overflow en `body`. Cadenas largas ajustan línea, controles táctiles alcanzan 44 px e inputs/textareas usan 16 px. No se duplican presentaciones ni peticiones: el mismo DOM, datos y borradores se redistribuyen mediante breakpoints, por lo que redimensionar no pierde selecciones, archivos, comentarios o decisiones.
- No cambiaron rutas, endpoints, DTO, permisos, estados, requisitos de finalización, tipos/tamaños de archivo, dependencias, variables, schemas, seeds ni datasets. ESLint focalizado, build y `git diff --check` pasan. El build produjo `dist/assets/index-KHN1TpiC.css` e `index-CTXBbwem.js`; queda pendiente la prueba visual autenticada y captura porque el contenedor no dispone de navegador ni backend/sesión institucional.

## Decisión reciente — selector móvil de programa en `/fechas` (2026-09-21)

- En **Convocatorias de admisión**, el breakpoint existente de 780 CSS px presenta un selector accesible de ancho completo para **Maestría** y **Doctorado**, ubicado entre la cabecera/acción de creación y los filtros compartidos. Las opciones se relacionan con los `programaId` recibidos en las convocatorias, no con posiciones ni identificadores codificados.
- La primera visita móvil prioriza Maestría cuando está disponible. La selección persiste al alternar, al cambiar filtros y durante móvil → escritorio → móvil; el escritorio no muestra el selector y mantiene ambos programas. Los paneles usan `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, foco roving y flechas/Home/End.
- Período y Vigente siguen siendo filtros compartidos y conservan su reinicio de paginación. Cada programa conserva su página propia al cambiar de pestaña; una combinación sin resultados muestra el vacío del programa seleccionado sin saltar al otro. El nombre institucional completo permanece sobre cada listado.
- No se modificaron **Períodos académicos**, consultas, formularios, permisos, acciones, endpoints, DTO, dependencias, variables, schemas, seeds ni datasets. El cambio reutiliza la consulta existente y el breakpoint no dispara cargas ni remonta formularios.
- Verificación local: ESLint focalizado, build y `git diff --check` pasan. El build generó `dist/assets/index-D56WF_LI.css` e `index-BTuBYlEL.js`; persiste el aviso informativo del chunk JS de 633.33 kB. El lint global conserva 9 errores y 1 warning preexistentes fuera del módulo (servicios API, guard/mock de admisiones, validación documental y solicitudes). La prueba visual/autenticada y la captura quedan pendientes porque el contenedor no incluye navegador ni backend/sesión institucional.

## Corrección reciente — filtro de actas de Comité Asesor (2026-09-21)

- Se corrigió la discrepancia entre la columna **Tipo** y el filtro **Tipo de acta** de `/actas`. El contrato histórico admite `tipoConsejo: null` para Comité Asesor: la tabla ya lo mostraba como **Comité Asesor de Posgrados**, pero el filtro solo aceptaba el booleano `false` y por eso ocultaba esas filas.
- La clasificación quedó centralizada: únicamente `tipoConsejo === true` representa **Consejo Académico**; tanto `false` como `null` representan **Comité Asesor de Posgrados**. La misma regla alimenta ahora la etiqueta y el filtro, sin cambios de endpoint, DTO, dependencias, variables, schemas, seeds ni datasets.
- El catálogo continúa obteniéndose mediante `GET /sapp/actas` y se filtra en cliente junto con año y búsqueda. La paginación sigue operando sobre el resultado combinado y vuelve a la primera página al cambiar un filtro.

## Decisión reciente — `/actas` responsive (2026-09-20)

- El módulo protegido conserva sin cambios su tabla de ocho columnas, filtros en tres columnas, formulario en dos columnas, paginación, clasificación, contratos y acciones en escritorio. Hasta 720 CSS px, las mismas filas se presentan como tarjetas verticales con nombre y código completos, tipo real, año, fecha, observaciones, tipo/tamaño y acciones explícitas.
- El recorte horizontal provenía del `min-width: 1040px` de la tabla dentro de una cadena de tarjetas/contenedores que no declaraba toda la contracción. La solución es local a `ActasPage`: mantiene tabla y DOM únicos, convierte las filas a Grid solo en móvil y ajusta texto largo, sin aplicar `overflow-x: hidden` al documento.
- Encabezado, filtros y carga pasan a una columna móvil con controles de 44 px y fuente de 16 px. El PDF conserva input táctil nativo, validaciones PDF/15 MB, nombre visible, valores ante error, checksum, código y payload. El envío permanece bloqueado durante la operación.
- Ver/Descargar mantienen recuperación autenticada por ID y Blob URL temporal sin token; Eliminar mantiene confirmación con nombre/código, bloqueo de operaciones simultáneas y actualización solo tras éxito. Un error de consulta ya no se muestra también como lista vacía.
- No se añadieron dependencias, endpoints, variables, seeds, datasets o schemas. ESLint focalizado, build y `git diff --check` pasan; el build produjo `dist/assets/index-Cc_JZsaX.css` e `index-DU-XEZcO.js`, con el aviso informativo conocido por chunk de 630.31 kB. La captura y pruebas autenticadas/mocks quedan pendientes porque no hay navegador ni backend/sesión institucional.

## Decisión reciente — Gestión de profesores responsive (2026-09-20)

- `/coordinacion/profesores` conserva en escritorio las pestañas, tablas, columnas, filtros, paginación y operaciones existentes. Hasta 800 CSS px, los cuatro listados se adaptan a tarjetas verticales: profesores de posgrados, profesores EISI disponibles, integrantes del grupo y profesores de posgrados disponibles para el grupo.
- El recorte móvil provenía de tablas intrínsecamente más anchas que el viewport dentro de una cadena flex sin `min-width: 0`, celdas/acciones sin ajuste y pestañas desplazables. La solución es local al módulo: permite contracción de contenedores, transforma semánticamente las filas solo en el breakpoint, ajusta texto largo y distribuye botones/paginación sin ocultar overflow en `body` ni eliminar información.
- Las pestañas implementan `tablist`/`tab`/`tabpanel`, foco roving y flechas/Home/End. El selector ocupa todo el ancho móvil y repite debajo el nombre completo seleccionado; una protección descarta respuestas tardías al cambiar de grupo. Las mutaciones y consultas, confirmaciones, identificadores, elegibilidad, regla de director único, estados de envío y contratos HTTP no cambiaron.
- No se añadieron dependencias, variables, schemas, seeds ni datasets. Se reutiliza el único `node_modules` del repositorio. ESLint focalizado, build y `git diff --check` pasan; el build produjo `dist/assets/index-DUxhBT2n.css` e `index-eaq7Vr05.js`, con el aviso informativo conocido por tamaño del chunk. La comprobación visual autenticada, capturas y operaciones con mocks quedan pendientes porque el contenedor no tiene navegador ni entorno backend/sesión de pruebas.

## Corrección reciente — detalles de convocatoria e inscripción en móvil (2026-09-20)

- Se corrigió el espacio vertical excesivo que aparecía en el detalle móvil de una convocatoria: la columna de acciones heredaba un `flex-basis: 25rem` pensado para el eje horizontal de escritorio. Hasta 760 px ahora usa base automática, por lo que **Crear aspirante**, los indicadores y el listado quedan consecutivos sin una zona vacía artificial.
- En el detalle de inscripción se eliminó la segunda aparición de **Programa** en la barra de resumen. El dato se conserva en **Datos de la inscripción** y la barra queda en dos columnas con estado de inscripción y estado de evaluación.
- No cambiaron endpoints, DTO, permisos, reglas de admisión, paquetes, variables, seeds ni datasets. Los estilos continúan usando tokens semánticos y funcionan en los temas claro y oscuro.

## Decisión reciente — acta asociada en el detalle de solicitudes (2026-09-20)

- El detalle compartido por `/solicitudes/:solicitudId` y `/creditos-condonables/:solicitudId` consume los nuevos campos `actaId`, `actaCodigo`, `actaNombre`, `actaFechaCreacion` y `actaTipoConsejo` del contrato de consulta. Cuando la solicitud está en estado `APROBADA` y tiene un `actaId`, presenta toda la información en una única tarjeta institucional **Acta asociada**; para los demás estados no muestra el bloque.
- La tarjeta informa código, nombre, fecha en formato `DD/MM/YYYY` e instancia. `actaTipoConsejo: true` se presenta como **Consejo Académico** y `false` o `null`, conforme al contrato vigente, como **Comité Asesor de Posgrados**. La misma implementación cubre solicitudes académicas ordinarias y créditos condonables porque ambas rutas reutilizan `SolicitudDetallePage`.
- Los estilos usan tokens semánticos, admiten temas claro/oscuro y pasan de dos columnas a una en móvil. No cambiaron endpoints, navegación, permisos, mutaciones, paquetes, variables, seeds ni datasets.
- Verificación: ESLint focalizado, build de producción y `git diff --check` pasan. El build produjo `dist/assets/index-DNu7XGnK.css` e `index-B-Qm0z6W.js`; persiste únicamente el aviso informativo por el chunk JS mayor de 500 kB. La revisión visual autenticada queda pendiente porque no hay navegador ejecutable ni sesión/backend institucional en el contenedor.

## Corrección reciente — listado responsive de matrículas (2026-09-20)

- `/matricula`, para perfiles de gestión, conserva en escritorio la tabla, sus seis columnas, filtros, contador, orden, rutas y notificación de apertura. En viewports de hasta 768 CSS px el mismo arreglo ya filtrado se presenta como tarjetas con estudiante, código UIS, estado textual, programa, período, fecha/hora y el enlace original **Ver detalle**.
- La causa del desbordamiento era la tabla con `min-width: 760px` dentro de ancestros flexibles sin una cadena completa de `min-width: 0`; además, las tres columnas de filtros de `33%` sumaban sus `gap` al ancho disponible. La tabla sigue intacta en escritorio y queda fuera del layout móvil, no escondida mediante `overflow-x` global; el grid usa columnas contraíbles y las tarjetas admiten texto largo.
- En móvil, la notificación permite texto multilínea y coloca el botón a ancho completo; los cuatro filtros forman una columna con controles de 16 px y altura mínima de 44 px. No cambiaron consultas, permisos, estado de envío, confirmación, filtros ni contratos API, y ambas presentaciones consumen `filteredMatriculas` sin solicitudes duplicadas.
- Verificación de esta revisión: `npm run build`, ESLint focalizado y `git diff --check` pasan. El build transformó 272 módulos y produjo `index-BqffXqoX.css`/`index-BhTGTJV5.js`; persiste solo el aviso informativo del chunk superior a 500 kB. No existe script de pruebas ni navegador instalado, por lo que queda pendiente la comprobación visual autenticada a 320, 375, 402, 440 px, tablet, horizontal y escritorio, en claro/oscuro, sin enviar correos reales.

## Corrección reciente — escritorio del detalle de inscripción (2026-09-20)

- El detalle `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId` vuelve a tomar como contrato visual la versión de escritorio anterior al responsive: cabecera con fotografía, nombre, estado, documento, correo, teléfono, programa, código de inscripción, período y fechas, más los tres indicadores originales (inscripción, programa y evaluación). En móvil se mantiene la presentación compacta, sin eliminar información.
- Las consideraciones de Hoja de vida, Examen y Entrevistas permanecen siempre renderizadas y visibles en escritorio. Sus controles de expansión solo afectan viewports de hasta 768 px; estructuras JSON conocidas conservan orden y contenido, y los valores no reconocidos usan una representación textual segura en vez de desaparecer.
- Hoja de vida vuelve a mostrar automáticamente el PDF autenticado junto a la tabla en escritorio. El botón de previsualización es exclusivamente móvil: cerrarlo y ampliar el viewport no oculta el visor. Abrir/descargar, carga simultánea, errores y borradores de notas/observaciones conservan los contratos existentes.
- En las tablas de escritorio, **Nota**, **Observaciones**, **Puntaje máximo** y los demás nombres se presentan en el encabezado una sola vez. La etiqueta asociada al input de nota sigue disponible para tecnologías de asistencia y solo se hace visible en la transformación móvil a formulario.
- **Regla para cambios futuros:** una adaptación responsive debe preservar la visual, los campos y la interacción de escritorio salvo petición explícita. Los cambios móviles deben quedar dentro de sus breakpoints y nunca depender del tamaño inicial del dispositivo; al redimensionar, escritorio debe recuperar toda su información aunque un panel se hubiera cerrado en móvil.
- No cambiaron API, permisos, cálculos, guardado, dependencias, variables, schemas, seeds ni datasets. El entorno continúa siendo el `node_modules` de este repositorio (Node.js 24.15.0, npm 11.4.2; versiones completas fijadas por `package-lock.json`); no se usa venv, Conda ni Poetry.

## Decisión reciente — detalle responsive de inscripción de admisión (2026-09-20)

- `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/{documentos,hoja-vida,examen,entrevistas}` conserva rutas, permisos, contratos y cálculos, pero reorganiza el resumen y las cuatro etapas para móvil sin tablas horizontales. El encabezado mantiene foto, nombre, estado de inscripción, programa y `numeroInscripcion`; los datos secundarios quedan en **Datos de la inscripción**, desplegable en móvil. El estado de evaluación permanece en un bloque independiente.
- Los acordeones usan botones nativos con `aria-expanded`, `aria-controls` y paneles etiquetados. Los formularios se convierten en tarjetas a 768 px, con etiquetas visibles, entradas de 16 px, blancos táctiles de 44 px, criterios JSON representados como listas descriptivas sin reinterpretar valores y observaciones de ancho completo. Los borradores se conservan por inscripción/etapa al contraer o navegar y solo se confirma una navegación entre secciones cuando existen cambios pendientes; recargar/cerrar conserva el aviso nativo del navegador.
- Documentos mantiene la tabla de escritorio y usa tarjetas en móvil con requisito, estado, archivo/versión, observaciones, apertura/descarga y validación. Conserva la condición vigente de documentos obligatorios aprobados, rechazo con motivo, permisos y bloqueo por operación. Hoja de vida prioriza **Abrir PDF**/**Descargar** en móvil y deja el visor `blob:` autenticado como previsualización opcional. Entrevistas conserva el resumen y el envío conjunto, agrupando criterios en desplegables por evaluador sin desmontarlos.
- No se añadieron dependencias, endpoints, seeds ni datasets. El lint focalizado y el build de producción pasan; queda pendiente la prueba visual autenticada porque el contenedor no incluye navegador y la pantalla depende del gateway/sesión institucional.

## Decisión reciente — detalle responsive de convocatoria de admisiones (2026-09-20)

- `/admisiones/convocatoria/:convocatoriaId` reorganiza cabecera, contexto e indicadores con prioridad móvil: el período y los nombres extensos de programa ajustan línea, **Crear aspirante** conserva permisos/validaciones y ocupa el ancho disponible, y una convocatoria cerrada muestra un único bloque informativo **Inscripciones cerradas** en vez de un botón inactivo. El cierre sigue habilitando, bajo las condiciones previas, la creación de estudiantes admitidos.
- Los cuatro indicadores mantienen sus cálculos y usan dos columnas en móvil/cuatro cuando hay espacio. La creación de estudiantes conserva la tabla en escritorio y usa tarjetas sin scroll horizontal en móvil; **Estudiante creado** es ahora un estado no interactivo. El modal conserva payload/validaciones y añade scroll interno, campos de 16 px, controles táctiles y acciones visibles en alturas reducidas.
- El tablero recalcula desbordamiento mediante `ResizeObserver`: oculta instrucciones/flechas sin overflow, limita flechas en extremos, soporta flechas del teclado y conserva scroll táctil. El arrastre con mouse usa un umbral de 8 px y suprime el clic posterior para no abrir inscripciones accidentalmente. Las tarjetas móviles anticipan la siguiente solo cuando existe, muestran la foto completa con `object-fit: contain`, impiden arrastre de imágenes, dan el correo a todo el ancho y conservan `—` para puntaje/posición ausentes.
- Verificación: lint focalizado, compilación y `git diff --check` pasan. El build produjo `dist/assets/index-B1gestz2.css` e `index-BhpzgPd9.js`, con el aviso informativo conocido por el chunk JS de 621.22 kB. No se ejecutó revisión visual real ni captura: el contenedor no tiene Chromium/Chrome/Firefox y la ruta protegida requiere backend y sesión institucional; quedan pendientes las matrices manuales de datos, viewport y tema. No cambiaron API, rutas, permisos, reglas, dependencias, seeds ni datasets.

## Decisión reciente — inicio responsive de Admisiones (2026-09-20)

- `/admisiones` conserva las dos tarjetas de programa en escritorio y, hasta 900 CSS px, presenta un selector accesible de ancho igual para los programas reales devueltos por `GET /sapp/convocatoriaAdmision`. Solo el panel seleccionado permanece visible y accesible en móvil; la selección se conserva al cambiar de breakpoint y los estados de convocatorias anteriores siguen separados por `programaId`, sin nuevas consultas.
- La pantalla elimina tarjetas anidadas en móvil, reduce espacios, conserva la identidad institucional y la acción autorizada **Configurar fechas académicas** hacia `/fechas`. La convocatoria distingue por texto e insignia si está abierta/cerrada, mantiene la lógica vigente de período/fechas y permite consultar anteriores incluso cuando no existe convocatoria actual.
- Las pestañas admiten toque, clic, flechas, `Home` y `End`; paneles y foco usan `tablist`/`tab`/`tabpanel`. Acciones, selector de período y opciones tienen al menos 44 CSS px, texto multilínea y foco visible; las fechas ocupan dos columnas mientras caben y colapsan automáticamente en anchos estrechos. No cambiaron rutas, permisos, API, dependencias, seeds ni datasets.
- Verificación: lint focalizado, compilación y `git diff --check` pasan. El build generó `dist/assets/index-Y5pbd70m.css` e `index-DnddbAO9.js`, con el aviso informativo conocido por el chunk JS de 617.99 kB. No se realizó captura ni interacción con sesión real porque el contenedor no incluye navegador y la ruta está protegida.

## Decisión reciente — responsive de créditos condonables (2026-09-20)

- Se corrigió la conmutación real de las pestañas móviles **Pendientes** e **Histórico**. La causa era la regla de autor `.creditos-condonables__section { display: grid; }`, que prevalecía sobre el estilo `display: none` del atributo HTML `hidden`: React sí actualizaba la selección y el atributo, pero ambos paneles continuaban dibujándose. La regla explícita `.creditos-condonables__section[hidden] { display: none; }` vuelve a vincular el estado único `activeListing` con el contenido visible y retira el panel inactivo del árbol de accesibilidad, sin desmontarlo ni perder filtros/página.
- Los tabs móviles son botones `type="button"`, mantienen las asociaciones `tablist`/`tab`/`tabpanel`, selección y foco mediante `aria-*`, y ofrecen foco visible y navegación con flechas, `Home` y `End`. En escritorio ambos paneles siguen visibles; los cambios de breakpoint y pestaña no relanzan consultas ni reinician estado local.
- Verificación de la corrección: el lint focalizado, la compilación de producción y `git diff --check` pasan. El build produjo `dist/assets/index-BitnsXae.css` e `index-DZRe2v1A.js`; conserva el aviso informativo por el chunk JS de 616.30 kB. El lint global sigue fallando por los 9 errores y 1 warning preexistentes documentados en `HANDOFF.md`. No se ejecutó interacción real ni captura porque el contenedor no dispone de navegador y la ruta protegida requiere backend/sesión institucional.
- `/creditos-condonables` conserva las dos tablas en escritorio y presenta en viewports de hasta 768 CSS px pestañas accesibles de igual ancho para **Pendientes** e **Histórico**. Cada listado conserva de forma independiente sus filtros y página; los contadores corresponden al total real de cada clasificación, no al tamaño de la página.
- En móvil, las solicitudes usan tarjetas propias del módulo con estudiante, código UIS, tipo, estado multilínea, programa, fechas, observaciones expandibles y un enlace explícito al detalle existente. A 350 CSS px o menos, los datos breves pasan de dos columnas a una; los controles mantienen al menos 44 CSS px y los `select` usan 16 px.
- Los filtros siguen usando los datos de `GET /sapp/solicitudesAcademicas`: pendiente filtra por estado; histórico por estado y `estudianteId` exacto. El cambio de pestaña o breakpoint no limpia estado ni dispara una consulta. Se añadieron mensajes diferenciados para colección vacía/sin coincidencias y reintento ante error, sin modificar API, orden o reglas de clasificación.
- Verificación: `npx eslint src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx`, `npm run build` y `git diff --check` pasan. El build generó `dist/assets/index-BKTs4nd7.css` y `index-DpUG42po.js`; persiste el aviso informativo del chunk de 616.27 kB. No fue posible tomar captura ni hacer inspección visual real porque no hay Chromium, Chrome ni Firefox en el contenedor y la ruta protegida depende de sesión/backend institucional.

## Estado funcional (2026-09-20)

- **El tablero de estudiantes de coordinación es responsive y navegable:** `/coordinacion/estudiantes` inicia con el estado **Activo**, mantiene buscador y contador siempre visibles y contrae período/estado detrás de **Filtros** solo en móvil, sin perder valores. Las tarjetas conservan portadas grandes de 220–240 px, fotografía completa o iniciales, ancho calculado desde el tablero para anticipar la siguiente tarjeta y datos compactos sin duplicar el estado en móvil. El tablero mantiene scroll táctil/vertical nativo, snap suave, flechas con límites, teclado y arrastre de mouse protegido contra clics accidentales. Egresados continúa bajo demanda y ofrece un error contextual en español con reintento.
- **Inicio es responsive y accesible:** en móvil, la navegación se presenta como una barra superior compacta y un panel lateral cerrado inicialmente; admite cierre explícito, backdrop y `Escape`, trampa/restauración de foco, bloqueo temporal del scroll y etiquetas multilínea. El encabezado reorganiza usuario, avatar y marcas institucionales sin posiciones absolutas, y los accesos mantienen sus rutas/permisos en una cuadrícula de dos columnas (una a menos de 341 px). En escritorio se conserva la barra contraída con expansión temporal, por lo que no reserva los 260 px ni desplaza el contenido.
- En **Créditos condonables → Histórico de solicitudes**, el filtro de estudiante es un combo desplegable construido con los estudiantes únicos presentes en el resultado histórico de la consulta. Cada opción muestra nombre y código UIS, y selecciona por el identificador del estudiante para evitar coincidencias parciales ambiguas.
- El listado de **Gestión de actas** se puede filtrar por instancia: todas, Comité Asesor de Posgrados o Consejo Académico. El filtro se combina con la búsqueda y el año, y vuelve a la primera página cuando cambia.
- Al aprobar una solicitud desde Comité o Consejo, el detalle consulta `GET /sapp/actas`, muestra únicamente las actas de la instancia anterior y exige seleccionar una antes de confirmar. El cambio de estado incorpora el `actaId` elegido; no se usan identificadores hardcodeados.
- En **Gestión profesores → Grupos de investigación**, la lista de integrantes identifica al único director con una insignia institucional. Los demás integrantes ofrecen **Hacer director**, que ejecuta `PUT /sapp/gruposInvestigacionDocentes/director` y vuelve a consultar el grupo para reflejar el nuevo director sin recargar la página.
- En el detalle de **Créditos condonables**, los perfiles de gestión vuelven a ver **Firmar todos los documentos** cuando el estado indica `POR FIRMA`, incluso al entrar directamente por `/creditos-condonables/:solicitudId`; la acción ya no depende del estado efímero de navegación del módulo Solicitudes.
- En **Solicitudes**, el estado técnico `PFIR_DIR_TG` se presenta según el programa del estudiante: **POR FIRMA DIRECTOR DE TRABAJO INVESTIGACION** para maestría/MISI y **POR FIRMA DIRECTOR DE TESIS** para doctorado/DCC. En creación y renovación de crédito condonable, la modalidad de contraprestación `id: 2` (**EDICIÓN DE REVISTAS CIENTIFICAS**) omite el diligenciamiento y la previsualización, y pasa directamente a adjuntar únicamente archivos PDF.
- **Actas** permite clasificar y cargar documentos del Comité Asesor de Posgrados o del Consejo Académico. El formulario envía `tipoConsejo: false` para comité y `tipoConsejo: true` para consejo, genera respectivamente códigos `ACTA_COMITE_XXX-AAAA` o `ACTA_CONSEJO_XXX-AAAA`, y muestra el tipo institucional en el listado.
- En **Gestión profesores → Grupos de investigación**, al seleccionar un grupo se muestran primero sus integrantes y, debajo, una tabla paginada y filtrable con los profesores de posgrados todavía disponibles. Cada fila permite agregar mediante `POST /sapp/gruposInvestigacionDocentes`; la acción existente para retirar mediante `DELETE` se conserva.
- La creación de convocatorias obtiene los evaluadores desde `GET /sapp/docentes` y solo ofrece profesores con `tieneRolDocentePosgrados: true`. Gestión de profesores separa los usuarios de posgrados de los demás profesores EISI y permite asignar o retirar ese rol; después de cada operación vuelve a consultar el catálogo para actualizar ambos listados.
- Al aprobar una solicitud de tipo **OTRA** (`tipoSolicitudId: 11`), cualquier rol de gestión autorizado debe indicar en un diálogo si requiere aprobación del Consejo Académico. La opción afirmativa añade `enviarConsejo=true` al cambio de estado; la negativa conserva el contrato anterior sin ese parámetro.
- En las solicitudes de crédito condonable y renovación, el lugar de expedición se selecciona con el catálogo DANE suministrado: Santander aparece por defecto, el municipio usa un desplegable filtrable con la misma identidad visual del selector de departamento y el contrato HTTP conserva únicamente el nombre del municipio seleccionado.
- `ADMIN_POSGRADOS`, `SECRETARIA_POSGRADOS` y `COORDINADOR_POSGRADOS` conservan identidades separadas, pero comparten actualmente todos los módulos y acciones de gestión. La equivalencia se define una sola vez en `ROLES_GESTION_POSGRADOS`/`canManagePosgrados`, y se aplica a rutas, navegación y acciones internas para evitar diferencias accidentales.
- Al completar el inicio de sesión, el layout protegido consulta la firma del `UsuarioSapp` autenticado mediante `GET /sapp/firmaUsuario/{usuarioId}`. Si no existe contenido de firma, muestra un recordatorio tipo toast con acceso directo a `/perfil`; los errores de red o autorización no se confunden con una firma faltante.
- El detalle de una inscripción de admisión muestra como **Código de inscripción** el campo `numeroInscripcion` entregado por el API; conserva el identificador `INS-{id}` únicamente como compatibilidad cuando el backend no envía el nuevo valor. Los datos de documento, correo y teléfono se presentan sin emojis.
- La autorización consume los roles funcionales de `clientRoles` en `GET /api/sapp/inicio`: `ADMIN_POSGRADOS`, `COORDINADOR_POSGRADOS`, `SECRETARIA_POSGRADOS`, `ESTUDIANTE_POSGRADOS` y `DOCENTE_POSGRADOS`. La sesión los conserva como valores canónicos; durante la transición también acepta y normaliza los nombres anteriores, incluido `ADMIN_SAPP`. Las etiquetas visibles eliminan el sufijo `_POSGRADOS`.
- Coordinación dispone del módulo exclusivo **Créditos condonables** (`/creditos-condonables`): separa solicitudes y renovaciones pendientes del histórico aprobado/rechazado, con filtros por estado y estudiante. Esos dos tipos dejan de aparecer en **Solicitudes** únicamente para coordinación; los demás roles conservan su flujo anterior.

El acceso de coordinación incluye **Gestión profesores** al final del menú. El módulo consulta el contrato paginado vigente de Minerva, presenta nombre, correo institucional, programa y UUID, y permite administrar la pertenencia de docentes a grupos de investigación. El módulo de estudiantes de coordinación presenta estudiantes activos/inactivos y, bajo demanda, egresados por programa. Ambos listados recuperan la fotografía documental `ANX-4` a partir de la inscripción de admisión, sin bloquear el resto de tarjetas cuando una foto individual falla. Desde el detalle de un estudiante, coordinación también puede solicitar en una sola descarga ZIP toda su información documental; el botón permanece ocupado mientras el backend construye el archivo y la descarga comienza automáticamente al recibirlo. El formulario de solicitudes académicas también soporta la homologación de una o más parejas de materias. En el detalle de matrícula de coordinación, las acciones documentales están organizadas por propósito en columnas independientes de visualización y validación.

### Stack instalado y ejecución rápida

- React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide React 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- Componentes/páginas en `src/components` y `src/pages`; módulos de dominio en `src/modules`; sesión en `src/context/Auth`; transporte en `src/shared/http`.

```bash
npm ci          # instala exactamente package-lock.json
npm run dev     # servidor Vite
npm run build   # TypeScript + producción
npm run lint    # revisión estática global
npm run preview # sirve el build
```

Se requiere Node.js 18 o superior (verificado con Node 24.15.0 y npm 11.4.2). No hay seeds. La información funcional proviene del gateway/API, salvo mocks explícitos y el catálogo estático derivado de `public/resources/Tabla-Códigos-Dane.pdf`, almacenado en `src/modules/solicitudes/data/daneLocations.json`. `VITE_API_URL` configura la API cuando corresponda; varios servicios conservan `/api/sapp` como fallback.

### Decisiones recientes (changelog-lite)

- **2026-09-20:** corregida la visibilidad de las pestañas móviles de `/creditos-condonables`. El selector CSS explícito para paneles con `hidden` evita que el `display: grid` del componente anule el ocultamiento nativo; por ello solo el panel asociado con `activeListing` queda visible y accesible en móvil, mientras escritorio conserva ambos. Los botones declaran `type="button"` y foco visible. Se mantienen montados ambos listados para preservar filtros y páginas, sin nuevas consultas, cambios de API, paquetes, seeds ni datasets.
- **2026-09-20:** se optimizó `/coordinacion/estudiantes` para 440 × 956 CSS px sin alterar contratos. El filtro de estado inicia en `ACTIVO`; en móvil el buscador permanece visible y período/estado empiezan contraídos en un panel accesible con contador de filtros adicionales. El encabezado compartido usa una variante compacta exclusiva de esta pantalla. Las tarjetas miden el ancho disponible menos 40 px, separan 12 px, conservan portadas `object-fit: contain` de 220–240 px, muestran nombres completos y ocultan la segunda repetición del estado en móvil. El tablero mantiene drag de mouse, scroll táctil nativo, snap y flechas; el mensaje de error de egresados es contextual y permite reintentar. No cambiaron API, roles, paquetes, seeds ni datasets.
- **2026-09-20 (decisión histórica sustituida):** el primer tablero horizontal propuso fotos de 64 px; la decisión vigente indicada arriba las reemplazó por portadas grandes. Se conservan de aquella iteración el arrastre con botón izquierdo mediante Pointer Events, captura de puntero, umbral de 6 px, cancelación cuando predomina el gesto vertical, supresión del clic posterior a arrastrar, flechas con límites y teclado. No cambiaron API, roles, paquetes, seeds ni datasets.
- **2026-09-20:** se mantuvo el sidebar expandido de escritorio como overlay temporal activado por hover/foco, mientras que hasta 900 px se sustituye por una barra superior y drawer modal. El drawer usa `100dvh` con fallback, safe areas, scroll interno, controles de 44 px, foco contenido/restaurado y enlaces no enfocables cuando está cerrado. Inicio usa márgenes de 16 px, una cabecera compacta y tarjetas fluidas de 120 px en `repeat(2, minmax(0, 1fr))`; baja a una columna por debajo de 341 px. La meta viewport existente ya era correcta. No se cambiaron rutas, roles, API, paquetes, seeds ni datasets.
- **2026-09-19:** **Gestión de actas** incorpora el filtro local **Tipo de acta**, con las opciones **Todos**, **Comité Asesor de Posgrados** y **Consejo Académico**. La clasificación usa el booleano `tipoConsejo` ya presente en `GET /sapp/actas`, se combina con los filtros de texto y año y reinicia la paginación al cambiar; no se modificaron endpoints, contratos, paquetes, seeds ni datasets.
- **2026-09-19:** **Aprobar** abre una selección obligatoria de acta tanto para solicitudes generales como para solicitudes de crédito condonable. El catálogo existente `GET /sapp/actas` se filtra según la instancia del estado anterior: **ENVIADA A COMITE ASESOR DE POSGRADOS** admite exclusivamente actas con `tipoConsejo: null`, mientras un estado enviado a Consejo admite exclusivamente `tipoConsejo: true`. La confirmación ejecuta `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&actaId={actaId}`; para solicitudes OTRA conserva además `enviarConsejo=true` cuando corresponda. Rechazar no exige acta. Los controles de resolución también reconocen estados descriptivos de Comité o Consejo, además de la sigla histórica `ENVIADA`. No se agregaron paquetes, variables, seeds, datasets ni cambios de esquema.
- **2026-09-18:** el contrato de integrantes de un grupo incorpora `esDirector` y `existeEnSapp`. La tabla muestra **Director** para el registro cuyo indicador es verdadero y ofrece **Hacer director** exclusivamente a los demás. Tras confirmar, el frontend llama `PUT /sapp/gruposInvestigacionDocentes/director?grupoId={grupoId}&docenteId={docenteId}` sin body, bloquea temporalmente las mutaciones y repite `GET /sapp/gruposInvestigacionDocentes?grupoId={grupoId}` para mostrar la designación confirmada por el backend sin recargar la página. No se agregaron paquetes, variables, seeds, datasets ni cambios de esquema.
- **2026-09-18:** las tarjetas de documentos de Admisión y Matrículas en el detalle de un estudiante permiten **Actualizar documento** aun cuando ya existe un archivo. La actualización reutiliza `POST /sapp/document` con el mismo `tramiteId` y `tipoDocumentoTramiteId`, conserva las acciones **Ver** y **Descargar**, muestra progreso en la tarjeta y vuelve a consultar `GET /sapp/document/by-estudiante/{codigoEstudianteUis}` al finalizar para presentar la metadata y versión vigentes. Los documentos pendientes mantienen la acción **Cargar documento** y no cambiaron los contratos, dependencias, seeds ni datasets.
- **2026-09-18:** la disponibilidad de **Firmar todos los documentos** en el detalle se determina por la capacidad de gestión (`canManagePosgrados`) y por un estado cuyo nombre o sigla contiene `POR FIRMA`. Se eliminó la dependencia de `location.state.fromAssigned`, porque ese indicador solo se enviaba desde la tabla de asignadas de Solicitudes y no existía al navegar desde el nuevo módulo de Créditos condonables o mediante URL directa. El endpoint de firma, los DTO y las reglas del backend no cambian.
- **2026-09-18:** las insignias del estado `PFIR_DIR_TG` usan `programaAcademico` para distinguir maestría/MISI de doctorado/DCC, conservando **POR FIRMA DIRECTOR DE TG** como fallback si el programa no es reconocible. Para `CRED_COND` y `RENOV_CRED_COND`, la modalidad `id: 2` del catálogo `GET /sapp/modalidadContraprestacion` no solicita motivos/actividades, lugar de expedición ni datos adicionales de renovación, y no consume la previsualización: solo muestra los requisitos documentales y restringe su selección a PDF. El registro conserva `modalidadId: 2` y omite la lista vacía de motivos en el request. No se agregaron paquetes, variables, seeds ni cambios de esquema.
- **2026-09-18:** el catálogo común de profesores migra al contrato plano de `GET /sapp/docentes`, cuyos registros contienen `documentNumber`, `email`, `fullName`, `tieneRolDocentePosgrados` y `uuid`. La creación de convocatorias y la asignación a grupos filtran exclusivamente los docentes de posgrados. En Gestión de profesores, los dos listados filtrables y paginados permiten activar el rol con `POST /sapp/docentes/{uuid}/asignarRolDocentePosgrados` o retirarlo con `DELETE /sapp/docentes/{uuid}/rolDocentePosgrados`, y recargan el catálogo al completar la mutación. No se agregaron paquetes, variables, seeds, datasets ni cambios de esquema.
- **2026-09-18:** la acción **Aprobar** para el tipo **OTRA** (ID 11, trámite 15) solicita confirmar si el caso debe remitirse al Consejo Académico. **Sí** ejecuta `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&enviarConsejo=true`; **No** aprueba usando la URL previa, sin enviar `enviarConsejo=false`. Rechazar y aprobar los demás tipos no cambian. El diálogo permite cancelar sin ejecutar la transición y usa los tokens institucionales en temas claro y oscuro. No se agregaron dependencias, variables, seeds ni cambios de esquema.
- **2026-09-18:** los formularios `CRED_COND` y `RENOV_CRED_COND` sustituyen el texto libre de lugar de expedición por una selección dependiente departamento/municipio basada en el PDF DANE incluido. El departamento inicia en Santander, puede cambiarse, limpia el municipio anterior y ocupa menos ancho que el municipio. El municipio permite escribir para filtrar en un desplegable visualmente consistente con el selector de departamento, con soporte de teclado; solo habilita la previsualización cuando coincide con el catálogo. Los nombres se muestran en Camel Case y `ciudadExpedicionDocumento` continúa siendo un `string` con exclusivamente el nombre del municipio, sin código ni departamento. No cambian endpoint, dependencias ni esquema backend.
- **2026-09-18:** `ADMIN_POSGRADOS` y `SECRETARIA_POSGRADOS` quedan funcionalmente equiparados con `COORDINADOR_POSGRADOS` en el frontend, sin fusionar ni renombrar los roles. La política compartida habilita Créditos condonables, Informes a dependencias, Actas, Fechas, Gestión de profesores, gestión completa de estudiantes, convocatorias y períodos de admisión, finalización/validación documental de inscripciones, gestión de matrículas, resolución y exclusión de créditos en Solicitudes y presentación de datos de coordinación en Perfil. Las guardas de ruta y los controles dentro de página consumen la misma definición central, para que una futura separación requiera cambiar explícitamente la política y no buscar comparaciones dispersas. No cambian endpoints, payloads, dependencias, variables, seeds ni schemas.
- **2026-09-18:** cada entrada autenticada ejecuta una única verificación global de firma con el ID dinámico de `user.id` (no un ID fijo). Una respuesta exitosa sin `contenidoFirma` presenta **Firma pendiente** y enlaza al formulario existente de `/perfil`; una firma válida no genera aviso y una falla de consulta se omite para evitar falsos positivos. El toast puede cerrarse, es accesible y utiliza tokens de los temas claro/oscuro. No se agregaron endpoints, dependencias, variables, seeds ni cambios de esquema.
- **2026-09-18:** las solicitudes `CRED_COND` y `RENOV_CRED_COND` se separan para `COORDINADOR_POSGRADOS` en un módulo protegido propio. La vista reutiliza `GET /sapp/solicitudesAcademicas`, el catálogo de estados, la tabla y el detalle existentes; divide pendientes e histórico, pagina ambos bloques y permite filtrar el histórico por nombre/código UIS. No se agregaron endpoints, dependencias, seeds ni cambios de esquema.
- **2026-09-18:** `clientRoles` pasa a ser la fuente autoritativa de autorización del inicio de sesión. Los cinco roles de posgrados se normalizan centralmente y todas las guardas existentes comparan equivalencias canónicas, por lo que rutas, sidebar y permisos funcionan con los nombres nuevos sin duplicar reglas. `roles` queda como propiedad opcional y solo se usa como fallback temporal cuando `clientRoles` está vacío. La cabecera y el perfil muestran `ADMIN`, `COORDINADOR`, `SECRETARIA`, `ESTUDIANTE` o `DOCENTE`, nunca el sufijo técnico `_POSGRADOS`.
- **2026-09-16:** el detalle de inscripción de admisión usa `numeroInscripcion` del API como **Código de inscripción**, con `INS-{id}` como fallback compatible. Las etiquetas Documento, Correo y Teléfono se muestran sin emojis.
- **2026-09-16:** el detalle de estudiantes de coordinación incorpora **Descargar información**. La acción consume `GET /sapp/estudiantes/{estudianteId}/documentos/zip` como respuesta binaria, muestra un indicador **Preparando descarga...** hasta completar la generación y dispara automáticamente el ZIP. Prioriza el nombre UTF-8 de `Content-Disposition` y usa `{codigoUIS}-documentos.zip` como respaldo; los errores se muestran en la misma cabecera sin navegar fuera del detalle.
- **2026-09-16:** `/perfil` presenta la identidad una sola vez en una cabecera visual propia: el encabezado compartido conserva únicamente el título y las marcas institucionales en esta ruta. La fotografía del estudiante acepta tanto Base64 puro como un `data:image/...` completo, respeta el MIME entregado por `/inicio`, recorta con proporción circular y usa la inicial del nombre si no existe o no puede decodificarse; el resto de módulos conserva su resumen de usuario habitual.
- **2026-09-16:** el perfil de coordinación deja de mostrar tipo/número de documento y el campo provisional de último ingreso. **Programa a cargo** ya no depende del valor de la sesión: presenta de forma fija la Maestría en Ingeniería de Sistemas e Informática y `347:DOCTORADO EN CIENCIAS DE LA COMPUTACION`; los perfiles sin rol de coordinación conservan sus datos documentales.
- **2026-09-16:** la validación documental de matrícula en coordinación aplica localmente la decisión ya confirmada por el backend antes de comprobar el checklist recargado. Así, aunque la consulta inmediatamente posterior todavía devuelva el estado anterior, al aprobar o rechazar el último documento obligatorio se ejecuta `POST /sapp/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos`; los documentos opcionales continúan excluidos del criterio y la protección por montaje evita envíos repetidos.
- **2026-09-16:** en la gestión de matrícula del estudiante, las insignias **Obligatorio** y **EN_REVISION** usan ahora el énfasis visual primario ya aplicado en otros módulos (mayor peso, relleno y borde temáticos), compatible con los modos claro y oscuro. También se eliminó el texto técnico **Estado de carga: ...** de cada documento; el nombre del archivo, el estado funcional y los errores continúan visibles.
- **2026-09-21:** el detalle de una inscripción permite **Ver** y **Descargar** documentos cargados incluso cuando la inscripción está en estado final. Como el listado puede retornar solo metadatos, estas acciones consultan el contenido completo mediante `GET /sapp/document/{documentoId}` cuando el Base64 no viene incluido. También se eliminó el icono decorativo de la celda **Archivo cargado**.
- **2026-09-16:** durante la creación de una matrícula, el estudiante puede seleccionar los archivos requeridos antes de confirmar; la matrícula se crea primero y esos archivos se cargan luego con el `matricula.id` obtenido. Cada fila presenta las acciones en orden **Cargar**, **Ver**, **Descargar** y oculta **Ver/Descargar** hasta que exista un archivo cargado. En matrículas existentes, **Cargar** queda disponible para documentos faltantes o rechazados que requieren ajuste, pero se bloquea mientras están en revisión, cuando están aprobados y cuando la matrícula está finalizada.
- **2026-09-16:** el selector de materias de la matrícula estudiantil reconoce que `nivel` puede ser `null`: muestra esas asignaturas como **Electiva**, ubica primero todas las materias que sí tienen nivel y alinea a la izquierda el nombre y los metadatos de cada opción. La tabla de materias ya seleccionadas usa también **Electiva** para mantener la misma interpretación, sin cambiar el orden enviado por el API dentro de cada grupo ni los contratos de creación de matrícula.
- **2026-09-16:** el detalle de admisión para sesiones exclusivas de `PROFESOR`, `DOCENTE` o `DIRECTOR` realiza una sola consulta de evaluación: `GET /sapp/evaluacionAdmision/info?inscripcionId={id}&etapa=ENTREVISTA`. Esa respuesta alimenta el caché y las calificaciones de entrevista; ya no se precargan Hoja de vida/Examen ni se consulta después el endpoint general. La carga administrativa de `COORDINADOR`, `ADMIN` y `SECRETARIA` conserva exactamente su flujo previo por etapas y estado general.
- **2026-09-16:** se corrigió la carga de **Gestión profesores** para el contrato real de `GET /sapp/docentes`: el catálogo se extrae de `data.data`, se valida como arreglo antes de entregarlo a la vista y se tipan los datos personales, atributos y metadatos de paginación. La tabla usa `fullName` (con fallback a nombres o usuario), correo institucional, programas académicos y UUID, admite búsqueda por nombre/correo y tolera nombres nulos. El acceso **Gestión profesores** queda como último elemento visible del sidebar.
- **2026-09-16:** se añadió para `COORDINACION` y `ADMIN` la ruta `/coordinacion/profesores`. **Docentes en Minerva** lista y filtra el catálogo de `GET /sapp/docentes`, incluyendo el UUID requerido por las asociaciones; la acción visual **Inscribir docente** queda deshabilitada hasta disponer de su contrato de creación. **Grupos de investigación** carga `GET /sapp/gruposInvestigacion`, consulta integrantes por `grupoId`, registra con `{ grupoId, docenteUuid }` y permite retirarlos mediante `DELETE` con `grupoId` y `docenteId`. Los servicios permanecen encapsulados fuera de la vista y las nuevas superficies consumen los tokens de tema claro/oscuro.
- **2026-09-16:** el rol `DIRECTOR` tiene en Admisiones el mismo acceso operativo que `PROFESOR` y `DOCENTE`: ve el acceso lateral, entra a **Mis entrevistas**, abre el detalle de cada aspirante y puede registrar únicamente las notas y observaciones del grupo evaluador asociado a su nombre de sesión. El permiso se encapsuló en `isEvaluadorAdmision` para no convertir al director en profesor en módulos ajenos a Admisiones; si además posee un rol administrativo de Admisiones, prevalece la vista administrativa.
- **2026-09-10:** en el detalle de entrevistas de una inscripción se muestran las calificaciones agrupadas de todos los evaluadores, pero los campos de nota y observaciones solo se habilitan en el grupo cuyo nombre de evaluador coincide con el nombre completo de la sesión SAPP. Esto aplica también a coordinación: los grupos de otros usuarios permanecen visibles en modo consulta y el guardado descarta defensivamente cualquier fila que no pertenezca al usuario autenticado.
- **2026-09-10:** los combos **Convocatorias anteriores** de `/admisiones` dejaron de depender del desplegable nativo, que podía ocupar casi toda la pantalla cuando había muchos períodos. Ahora usan un selector accesible y temático cuya lista flota sobre la tarjeta, tiene una altura máxima de `12rem` y activa desplazamiento vertical para el resto de períodos; se cierra al seleccionar, al hacer clic fuera o al presionar `Escape`, sin cambiar la navegación ni los datos de las convocatorias.
- **2026-09-10:** **Informes a dependencias** conserva ahora el `data` estructurado de las respuestas HTTP fallidas. Cuando cualquiera de los informes responde con requisitos pendientes, la pantalla mantiene el mensaje del servidor y agrega un resumen desplegable por aspirante con documento, inscripción y lista de documentos faltantes; también presenta las categorías institucionales pendientes cuando existan. El parser valida defensivamente el contrato `{ data: { faltantes: { categoriasInstitucionalesFaltantes, aspirantesConDocumentosFaltantes } } }` y los errores sin ese detalle conservan el feedback simple anterior.
- **2026-09-10:** el listado de documentos del detalle de matrícula para coordinación separa la antigua columna única **Acciones** en **Visualización** (`Ver`/`Descargar`) y **Validación** (`Aprobar`/`Rechazar`). La distribución responsive mantiene ambas agrupaciones identificadas mediante sus respectivas etiquetas, sin cambiar handlers, permisos ni contratos HTTP.
- **2026-09-10:** el detalle de una convocatoria interpreta el `404 Not Found` de `GET /sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` como una colección vacía. El coordinador puede entrar a una convocatoria abierta sin aspirantes y usar **Crear aspirante**; los demás errores HTTP conservan su manejo normal. El cliente HTTP compartido expone ahora `HttpError.status` para tomar esta decisión por código de estado y no por el texto variable del backend.
- **2026-09-10:** la carga diferida de egresados mantiene activa su solicitud después de guardar el listado inicial. El cambio evita que la actualización de `egresados.length` desmonte lógicamente el efecto y cancele la cola de fotografías antes de llamar al servicio documental; las fotos se resuelven ahora con el mismo flujo de inscripción y documento `ANX-4` usado por el listado normal.
- **2026-09-10:** el listado de coordinación unifica la búsqueda por nombre y código UIS en un solo campo y dedica el tercer filtro al estado **Activo/Inactivo**. Las tarjetas presentan el estado `INACTIVO` como **Inactivo**. Al final se agregó una sección colapsable de egresados: no ejecuta ninguna consulta al cargar la página y, solo al pulsar **Mostrar egresados**, consume `GET /sapp/estudiantes/consulta?programaId={id}&egresados=true`, presenta las mismas tarjetas y carga sus fotografías con el flujo documental existente y un máximo de cuatro tareas concurrentes.
- **2026-09-09:** el módulo de matrícula para `COORDINACION`/`ADMIN` verifica primero `GET /sapp/periodoAcademicoFecha/vigente` y busca la fecha vigente cuyo tipo de trámite es `MATRICULA`. Solo cuando existe presenta habilitada la acción **Enviar correo de inicio**; tras confirmación, ejecuta `POST /sapp/matriculaAcademica/notificarAperturaMatricula?periodoId={id}` sin body, usando el identificador del periodo retornado por la verificación. La pantalla informa el periodo y rango de fechas, bloquea reenvíos mientras la solicitud está en curso y muestra el resultado del API.
- **2026-09-09:** en el detalle de matrícula de coordinación, cada aprobación o rechazo vuelve a consultar los documentos obligatorios y verifica que todos estén cargados y tengan estado final `APROBADO` o `RECHAZADO`. Al completar la revisión se ejecuta una sola vez por matrícula y por montaje `POST /sapp/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos`, sin body; los documentos opcionales no bloquean esta notificación.
- **2026-09-09:** el detalle de estudiantes de coordinación permite cambiar el estado académico mediante `PUT /sapp/estudiantes/{estudianteId}/estado` con el body `{ estado: "ACTIVO" | "INACTIVO" | "EGRESADO" }`. Un estudiante activo puede inactivarse, uno inactivo puede activarse y cualquiera de los dos puede marcarse como egresado; la tarjeta actualiza el estado confirmado, informa errores del API y limpia el caché del listado para que el cambio se refleje al regresar.
- **2026-09-09:** se cerró la auditoría transversal de títulos y subtítulos de todos los módulos. Los encabezados semánticos `h1`–`h6` quedan gobernados por roles tipográficos globales (página, sección, subsección y componente), siempre con el mismo peso, color, interlineado y espaciado entre letras; los subtítulos BEM `__subtitle` comparten tamaño, peso, color e interlineado. Las hojas de módulo conservan únicamente sus decisiones de composición y márgenes, evitando que su especificidad vuelva a alterar la jerarquía global.
- **2026-09-09:** **Cerrar sesión** elimina primero la sesión y el caché locales y después reemplaza la navegación por `/api/auth/slo/logout`. Esta ruta de front-channel logout queda fija para que el Gateway/IDP finalice también la sesión institucional; ya no depende de `VITE_IDP_LOGOUT_URL` ni `VITE_LOGOUT_URL`.
- **2026-09-09:** se consolidó una escala tipográfica global para todos los módulos mediante tokens CSS de familia, tamaños, pesos e interlineados. Encabezados, texto de lectura, ayudas, etiquetas, controles y cabeceras de tabla comparten ahora una jerarquía base; las excepciones visuales específicas de cada módulo se conservan. El tamaño base ya no disminuye en tablet o móvil, mientras los títulos usan `clamp()` para adaptarse sin perjudicar la legibilidad.
- **2026-09-09:** el filtro **Estado** del listado de solicitudes ahora se construye con los estados realmente presentes en los resultados visibles. Los estados sin solicitudes se omiten; al cambiar el tipo de solicitud, las opciones de estado se recalculan sobre ese subconjunto. En coordinación, el filtro de estado se aplica en cliente sobre la consulta por tipo para conservar todas las opciones disponibles sin mostrar estados vacíos.
- **2026-09-09:** el detalle de una solicitud `HOMOLOG` presenta las parejas de materias recibidas en `solicitudHomologacionesAsignaturas`, con código y nombre de origen y destino. La sección **Motivos para la solicitud del crédito condonable**, incluida su edición, se muestra exclusivamente para los códigos `CRED_COND` y `RENOV_CRED_COND`; al cambiar durante la edición a otro tipo se limpian los motivos enviados.
- **2026-09-09:** los informes de **Matrícula** y **Créditos condonables** dejaron de usar el mock. Ahora envían `POST` a `/sapp/reportesMatricula/generar` y `/sapp/reportesCreditosCondonables/generar`, respectivamente, con `actaId`, `periodoId` y `programaId` en el query string. Ambos consumen el PDF binario, respetan el nombre de `Content-Disposition` cuando está disponible y presentan las mismas acciones **Ver**/**Descargar** del informe de admisión.
- **2026-09-08:** el logo EISI activo cambio de `public/brand/eisi-favicon.svg` a `public/brand/eisi imagen.png`, servido como `/brand/eisi%20imagen.png` por el espacio en el nombre. Se usa como favicon PNG en `index.html`, marca del sidebar en `src/components/Sidebar/Sidebar.tsx` y logo EISI del encabezado compartido en `src/components/ModuleLayout/ModuleLayout.tsx`. El sidebar conserva `object-fit: contain` y `border-radius: 9px`; el encabezado agrega `module-layout__institutional-logo--eisi` con `border-radius: 12%` solo para EISI, sin tocar el logo UIS.
  Verificacion: `npx eslint src/components/ModuleLayout/ModuleLayout.tsx src/components/Sidebar/Sidebar.tsx`, `npm run build`, `git diff --check` y `rg -n "eisi-favicon\\.svg" index.html src` pasaron el 2026-09-08; no hubo captura porque Chrome/Edge/Chromium no estan en `PATH` y no hay Playwright/Puppeteer instalado.
- **2026-09-08:** **Generar informe** en **Informes a dependencias** conectó inicialmente el informe de admisión a `POST /sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}` como respuesta binaria PDF, no como envelope JSON. El servicio devuelve un `Blob` con MIME `application/pdf`, toma el nombre desde `Content-Disposition` cuando exista y muestra debajo del formulario un PDF generado con icono, fecha Colombia y botones estandarizados **Ver**/**Descargar** (`sapp-document-action`).
- **2026-09-08:** los iconos restantes del menú lateral se unificaron con el lenguaje visual de contorno de Lucide: **Matrícula** usa `GraduationCap`, **Estudiantes** usa `UsersRound`, **Actas** usa `ScrollText`, **Fechas** usa `CalendarDays` y **Cerrar sesión** usa `LogOut`. Todos heredan `currentColor` y reutilizan la caja existente de 20 px, sin cambiar etiquetas, rutas, permisos, orden, espaciado, estados del menú, los tres iconos modernizados anteriormente ni la marca Minerva. Debido al HTTP 403 del registro npm, `lucide-react` queda disponible como dependencia local reproducible en `vendor/lucide-react`, con únicamente los cinco componentes requeridos.
- **2026-09-08:** el menú lateral reemplaza exclusivamente los pictogramas de **Solicitudes**, **Admisiones** e **Informes a dependencias** por iconos SVG de contorno basados en Lucide (`ClipboardList`, `FileUser` y `FolderOpen`). Los tres usan `currentColor`, 20 px y el mismo alineado tanto en estado normal como seleccionado; los demás iconos, etiquetas, rutas, permisos, orden y comportamiento permanecen intactos. La instalación de `lucide-react` fue bloqueada por la política del registro npm (HTTP 403), por lo que se incorporaron localmente solo los trazos SVG requeridos, sin añadir una dependencia que impidiera compilar.
- **2026-09-08:** **Generar informe** se conectó inicialmente al servicio real de admisiones: `POST /sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}`, sin body y con los valores seleccionados en pantalla. Esa decisión fue reemplazada el mismo día por el mapeo binario PDF descrito arriba.
- **2026-09-08:** el sidebar y los accesos de inicio comparten una única definición de navegación, de modo que cada módulo permitido por rol aparece en ambos lugares con el mismo nombre e icono. Se incorporaron en inicio los accesos antes ausentes a **Informes a dependencias** y **Actas**, se revisaron los pictogramas según el significado de cada proceso y el nombre visible **Reportes** se reemplazó por **Informes a dependencias** sin cambiar la ruta técnica `/coordinacion/reportes`.
- **2026-09-07:** homologación separa los catálogos de origen y destino. Los orígenes se consultan en `GET /sapp/homologaciones/asignaturas-externas/activas`, los destinos permanecen en `GET /sapp/asignaturas?programaId=1` y cada fila permite alternar entre una materia externa registrada y el alta manual. `POST /sapp/solicitudesAcademicas` recibe ambas variantes dentro de `solicitudHomologacionesAsignaturas`; ya no se crean opciones mock en memoria.
- **2026-09-07:** la pestaña del navegador se identifica como **Minerva | Posgrados** y conserva el favicon EISI. El encabezado compartido muestra ahora los logotipos EISI y UIS juntos, en ese orden y con la misma altura responsiva para mantener una proporción visual consistente en escritorio y móvil.
- **2026-09-07:** la edición de un período académico usa un único `PUT /sapp/periodoAcademico/{id}`, donde el identificador se envía exclusivamente en la URL. El body se alineó con la última versión del backend: `{ fechaInicio, fechaFin, descripcion, fechas: [{ tipoTramiteId, fechaInicio, fechaFin, descripcion }] }`, sin IDs, año ni número de período. La creación conserva su `POST`.
- **2026-09-04:** las tarjetas de convocatorias en `/admisiones` diferencian ahora todo el bloque por vigencia, no solo la insignia: las abiertas usan acento de éxito y explican que reciben aspirantes; las cerradas usan acento de advertencia, informan que las inscripciones finalizaron y reemplazan la acción primaria por **Consultar convocatoria**. La distinción combina color, texto y símbolos para no depender únicamente de la percepción cromática y funciona con los temas claro/oscuro.
- **2026-09-04:** las acciones **Ver/Abrir** y **Descargar** de los listados documentales comparten la clase global `sapp-document-action`, basada en la apariencia del listado de actas: contorno primario, forma pill y estados hover, foco y espera compatibles con tema claro/oscuro. Se conservaron intactos los handlers, permisos, estados de carga y contratos HTTP de cada pantalla.
- **2026-09-04:** el listado de matrículas de coordinación preselecciona, después de cargar los registros, el período correspondiente a la fecha actual en Colombia (`año-1` entre enero y junio; `año-2` entre julio y diciembre). Si el API no devuelve matrículas de ese período, conserva **TODOS**. El sidebar ya no presenta la insignia circular **M** cuando está contraído; el nombre **Minerva** aparece únicamente al expandirlo y permanece visible en móvil.
- **2026-09-04:** todos los controles de regreso del sistema usan el componente compartido `BackButton`: píldora con flecha, tokens semánticos del tema, foco visible y comportamiento uniforme como enlace o botón. Se ubicaron al inicio y arriba a la izquierda de las vistas de detalle de convocatorias, inscripciones, evaluaciones, estudiantes, matrículas y solicitudes, además de la edición de períodos y el formulario de nueva solicitud.
- **2026-09-04:** la marca visible del sistema cambió de **SAPP** a **Minerva**, sin modificar rutas, contratos, claves de storage ni identificadores técnicos existentes. El nombre completo **Minerva** aparece al expandir el sidebar o navegar en móvil; el título del documento y los textos visibles de usuario también adoptaron la nueva marca.
- **2026-09-04:** `/fechas` reemplazó el resumen general de convocatorias por la gestión completa que ya existía en `/admisiones/convocatorias`: filtros de período/vigencia, secciones por programa, creación, edición, cierre y acceso a inscripciones. Cada programa mantiene su propia paginación de 4 convocatorias. La creación y edición de períodos continúa en `/fechas/periodos` y su listado también se pagina de a 4 registros.
- **2026-09-04:** en el detalle de una solicitud, únicamente una sesión con rol `COORDINADOR` puede resolverla, y solo mientras su estado normalizado sea `ENVIADA` (**ENVIADA A COMITE ASESOR DE POSGRADOS**). El selector libre de estados fue reemplazado por los botones **Aprobar** y **Rechazar**, que envían exclusivamente `APROBADA` o `RECHAZADA`; para cualquier otro estado ambos controles se ocultan. El badge del estado ahora puede ocupar varias líneas dentro de su tarjeta, evitando desbordamientos con etiquetas extensas.
- **2026-09-03:** el conversor HTML→PDF dejó de cortar el documento en múltiplos rígidos de 912 px. Después de cargar fuentes e imágenes, obtiene las cajas de cada línea con `Range.getClientRects()` y protege párrafos, listas, filas/tablas, figuras, encabezados y bloques `.pdf-keep-together`/`[data-pdf-keep-together]`. Cada página conserva Letter 816×1056 y márgenes verticales de 72 px, pero ahora usa rangos consecutivos ajustados a la geometría real. Un umbral de ocupación del 25 % y la división permitida de bloques mayores de 912 px evitan páginas casi vacías y ciclos infinitos. La prueba de navegador `tests/browser/htmlToPdf.pagination.browser.html` coloca dos firmas cerca del primer corte y comprueba que ambas pasan completas a la segunda página, que los rangos son contiguos y que cubren todo el documento. Las plantillas de `pdf-previsualizacion` pertenecen al backend (no están en este repositorio): sus contenedores completos de firmas, tablas pequeñas y secciones institucionales indivisibles deben llevar `data-pdf-keep-together`.
- **2026-09-03:** se corrigió la regresión de integración que dejó simultáneamente dos implementaciones de `loadDataImage`, utilidades del renderizador directo sin uso y una llamada huérfana a `loadSvgImage`. La exportación vuelve a usar una única canalización coherente: sanitiza el HTML, recopila texto e imágenes seguras y pinta cada página Letter directamente en canvas, sin `foreignObject`; `npm run build` vuelve a finalizar correctamente.
- **2026-09-03:** la conversión de documentos HTML persistidos a PDF ya no dibuja imágenes `data:` dentro del SVG `foreignObject`. Las firmas/imágenes se extraen, se conserva su espacio en el layout y se componen directamente sobre cada página del canvas; así **Ver** y **Descargar** evitan el `SecurityError` de canvas contaminado sin eliminar las firmas ni modificar el HTML guardado.
- **2026-09-03:** todos los listados del módulo Solicitudes ordenan por `fechaRegistro` descendente y, cuando dos registros comparten fecha, por `id` descendente. Una sesión cuyo único acceso operativo es el rol exacto `PROFESOR` ve exclusivamente **Solicitudes asignadas**; no se consulta ni se renderiza el listado general. `DOCENTE`, `DIRECTOR`, coordinación y administración conservan su comportamiento anterior, y los roles elevados prevalecen si una sesión también incluye `PROFESOR`.
- **2026-09-03:** el payload de `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` usa `motivosCreditoCondonable` para los motivos de las solicitudes de crédito condonable; el frontend dejó de enviar la clave genérica `motivos`. La renovación (tipo 12) conserva su campo especifico `actividadesCreditoCondonable`.
- **2026-09-03:** después de completar **Firmar todos los documentos** en el detalle de una solicitud, la SPA vuelve a consultar tanto `GET /sapp/solicitudesAcademicas/{solicitudId}` como `GET /sapp/document?tramiteId={solicitudId}&codigoTipoTramite={codigo}`. La solicitud, su selector de estado y los documentos adjuntos se actualizan en el estado React sin recargar la página completa; el mensaje final solo confirma actualización completa cuando ambas consultas terminan correctamente.
- **2026-09-03 (decisión histórica, reemplazada el 2026-09-09):** se introdujo la limpieza integral de sesión y cachés del navegador. La implementación vigente conserva esa limpieza, pero sustituyó el antiguo `POST` configurable y la navegación a `/` por el front-channel logout fijo `/api/auth/slo/logout` descrito arriba.
- **2026-09-03:** los documentos generados por `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` se convierten a PDF únicamente para su previsualización. Al registrar la solicitud se carga el HTML original, con MIME `text/html`, y las acciones posteriores **Ver/Descargar** lo convierten de nuevo a PDF en el navegador; así la base de datos conserva la fuente HTML sin exponerla como formato de descarga.
- **2026-09-03:** el detalle de cualquier solicitud carga y presenta **Documentos adjuntos** para todos los roles autorizados, reutilizando el listado antes exclusivo de coordinación y omitiendo la columna técnica **Tipo**. Al entrar desde **Solicitudes asignadas**, un estado descriptivo que contiene `POR FIRMA` (incluido `POR FIRMA DIRECTOR DE TG`) habilita **Firmar todos los documentos**, aunque `estadoSigla` tenga un código como `PFIR_DIR_TG`; la acción ejecuta `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` y recarga el detalle tras el éxito.
- **2026-09-03:** el perfil de un usuario con rol `ESTUDIANTE` solicita únicamente la imagen de firma y omite por completo `titulo` en el POST de creación. Los demás roles conservan el título obligatorio y el contrato `{ titulo, contenidoFirma }`.
- **2026-09-03:** los perfiles `PROFESOR`/`DOCENTE`, `COORDINADOR` y `DIRECTOR` ven primero **Solicitudes asignadas**, obtenidas con `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarios_sapp.id}`. El listado general excluye por `id` las solicitudes ya asignadas al usuario para evitar duplicados en pantalla.
- **2026-09-03:** se restituyó **Cerrar sesión** exclusivamente en el pie del sidebar. La acción elimina la sesión SAPP y los storages del origen, expira las cookies accesibles para la SPA y recarga la página para que el Gateway vuelva a resolver la autenticación institucional.
- **2026-09-03:** el listado y el detalle de estudiantes omiten los marcadores técnicos `N/A`/`NA` al presentar el documento de identidad. El formato se centralizó para mostrar únicamente las partes disponibles (por ejemplo, `1005324324` cuando no existe tipo documental) y `—` solo cuando tampoco existe número.
- **2026-09-03:** el encabezado del detalle de solicitudes presenta en una sola línea `Solicitud {id} — {tipoSolicitud}` para todos los roles autorizados; se retiraron el símbolo `#`, el código técnico y la repetición del nombre descriptivo.
- **2026-09-03:** el perfil consulta la firma vigente mediante `GET /api/sapp/firmaUsuario/{usuarioSappId}`, muestra su imagen y título, y permite reemplazarla. El POST ahora usa el contrato `{ titulo, contenidoFirma }`; el título es obligatorio en la interfaz antes de seleccionar una imagen.
- **2026-09-03:** el listado y detalle de estudiantes de coordinación resuelven el tipo de documento desde los campos superiores `tipoDocumento` o `tipoDocumentoIdentificacion` del contrato real, conservando `persona.tipoDocumento` como fallback; así se evita mostrar `N/A` junto a un número válido. En el detalle se eliminó la cohorte duplicada sobre el correo institucional y se conserva únicamente **Cohorte de ingreso** en los datos académicos.
- **2026-09-03:** la proyección de coordinación para estudiantes se alineó con el contrato real de `GET /sapp/estudiantes/consulta`: `numeroDocumento`, `correoInstitucional` y `correoPersonal` se leen desde el nivel superior; `persona.id`/`persona.idpId`, `estudiante.fechaEgreso` y cohortes con formato `YYYY-N` también se conservan. El detalle dejó de recurrir a datos mock al abrirse directamente y consulta el mismo recurso por `estudianteId`; además muestra ambos correos.
- **2026-09-03:** el listado de estudiantes de coordinación ordena la colección por semestre/cohorte descendente antes de iniciar la cola de descarga de fotos. De este modo, las consultas de fotos se programan en el mismo orden que las tarjetas visibles, con desempate alfabético por nombre y manteniendo el límite existente de cuatro tareas concurrentes.
- **2026-09-03:** el detalle de matrícula de coordinación presenta en **Estado** el valor real de `documentoUploadedResponse.estadoDocumento` (por ejemplo, `APROBADO`) en lugar de reducir todo documento existente a `Cargado`. La columna **Validación** fue reemplazada por **Fecha de revisión**, obtenida de `fechaRevisionDocumento`; los controles para aprobar o rechazar siguen disponibles dentro de **Acciones**. La vista del estudiante también usa ahora la fecha de revisión real, no la fecha de carga, y ambos listados comparten el mismo tratamiento visual de tabla, estados, bordes, espaciado y botones.
- **2026-09-02:** cuando una matrícula está `FINALIZADA`, el detalle de coordinación oculta las acciones **Aprobar/Rechazar** de documentos y asignaturas, así como el guardado de validaciones. Los documentos cargados muestran el nombre original entregado por `nombreArchivoDocumento`.
- **2026-09-02:** en el detalle de matrícula de coordinación, aprobar el último documento obligatorio ejecuta automáticamente la aprobación de la matrícula (`PUT /sapp/matriculaAcademica/{id}`). Se eliminó el botón manual **Aprobar documentos** y se bloquean las demás validaciones documentales mientras finaliza la transición para evitar solicitudes concurrentes.
- **2026-09-02:** únicamente el tipo de solicitud `12` (**RENOVACION CREDITO CONDONABLE**, trámite `17`) solicita los datos adicionales de renovación y envía `actividadesCreditoCondonable`, dirección, periodo inicial, intensidad y horas a la previsualización PDF; teléfono y correo se obtienen de la sesión. Los demás tipos conservan su formulario y contrato anteriores.
- **2026-09-02:** la consulta de matrícula vigente interpreta el nuevo objeto `{ periodoId, puedeCrear }`: bloquea el formulario y muestra que no hay fechas habilitadas cuando `puedeCrear` es `false`; cuando es `true`, usa el `periodoId` entregado por esa misma validación en el POST de creación.
- **2026-09-02:** se corrigió la ruta de períodos con fechas para eliminar dos espacios que el navegador codificaba como `%20%20`; la solicitud vuelve a resolverse como `GET /api/sapp/periodoAcademico/withFechas`.

- **2026-09-02:** el selector de firma del perfil valida y previsualiza el archivo y persiste inmediatamente el data URI mediante `POST /api/sapp/firmaUsuario/{usuarioSappId}`; se retiró la persistencia provisional en `localStorage`.
- **2026-09-02:** el perfil aprovecha el contrato real de `/inicio`: código UIS, programa, cohorte, estado, fecha de ingreso, correo personal y teléfono, con fallback a `attributes` cuando corresponde.
- La firma no se incorpora a la sesión: se consulta directamente al abrir el perfil y no se duplica en `localStorage`.
- Los estilos nuevos consumen tokens semánticos y se adaptan a móvil y modos claro/oscuro.

Frontend de **Minerva**, sistema de apoyo para la gestión de trámites de posgrados de la Escuela de Ingeniería de Sistemas e Informática (**EISI**) de la Universidad Industrial de Santander (**UIS**). La marca anterior era **SAPP**; ese término se conserva únicamente donde forma parte de contratos o identificadores técnicos que no deben migrarse.

> **Decisión 2026-09-23:** el catálogo del frontend reconoce el estado de solicitud `10 / ENVIADA_CONSEJO` y lo presenta como **ENVIADA A CONSEJO ACADEMICO** en los listados y detalles, admitiendo también los nombres descriptivos `ENVIADA A CONSEJO` y `ENVIADA A CONSEJO ACADÉMICO` como entradas compatibles.

## Propósito y alcance

Minerva centraliza y estandariza la trazabilidad de procesos académicos y administrativos de posgrado:

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

Versiones instaladas en `D:\Users\david\Desktop\SAPP\react - curso\clase 1\SAPP-frontend` según `npm list --depth=0` el **2026-09-08**:

| Paquete | Versión |
| --- | --- |
| Node.js | 24.15.0 |
| npm | 11.4.2 |
| react | 19.2.3 |
| react-dom | 19.2.3 |
| react-router-dom | 7.11.0 |
| lucide-react | 0.468.0-local -> .\vendor\lucide-react |
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

El cierre de sesión no requiere variable de entorno: después de limpiar sesión y cachés, la SPA navega a la ruta institucional fija `/api/auth/slo/logout`.

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

### 2026-09-03 — Listado documental único en el detalle estudiantil

- Al consultar una solicitud ya creada desde el perfil `ESTUDIANTE`, la vista de detalle oculta el checklist redundante titulado **Documentos** y conserva únicamente la tabla **Documentos adjuntos**.
- El editor de documentos sigue disponible al activar **Editar solicitud**; el cambio no afecta la creación, la edición, la carga de archivos ni las vistas de otros roles.
- No cambiaron contratos de API, dependencias, variables de entorno, seeds ni datasets.

### 2026-09-03 — Encabezado descriptivo del detalle de solicitudes

- La ruta compartida `/solicitudes/:solicitudId` muestra el encabezado `Solicitud {id} — {tipoSolicitud}` sin el símbolo `#` ni el código técnico `tipoSolicitudCodigo`.
- El nombre descriptivo deja de repetirse en un párrafo separado. Como todos los roles autorizados usan la misma pantalla de detalle, el formato aplica por igual a estudiantes, coordinación y administración.
- No cambiaron contratos de API, permisos, dependencias, variables de entorno, seeds ni datasets.

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
- El inicio de sesión institucional continúa resolviéndose automáticamente mediante el API Gateway/IDP al montar la aplicación. Desde 2026-09-03, el sidebar vuelve a ofrecer una salida local que limpia el estado del origen y recarga la SPA; no se reintrodujo una pantalla de login interna.
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

### 2026-06-12 — Marca EISI/UIS (actualizada 2026-09-08)

- Se reemplazó el favicon de Vite por el logo EISI PNG en `public/brand/eisi imagen.png`; `index.html` lo sirve como `/brand/eisi%20imagen.png` con MIME `image/png`.
- El sidebar muestra el logo EISI PNG tanto contraído como expandido y presenta la marca completa `Minerva | Posgrados` al expandirse; en móvil ambos permanecen visibles. El logo conserva `object-fit: contain` y `border-radius: 9px`.
- El encabezado de módulos presenta el logo UIS y el logo EISI con altura responsiva concordante. EISI usa `/brand/eisi%20imagen.png` y la clase `module-layout__institutional-logo--eisi` con `border-radius: 12%`; UIS conserva `public/brand/LOGO UIS_PNG.png` sin ese radio.
- El título vigente del documento es `Minerva | Posgrados`; el idioma HTML permanece configurado en español.

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
- Archivo integral de un estudiante: `GET /api/sapp/estudiantes/{estudianteId}/documentos/zip`; responde binario `application/zip` y puede incluir `Content-Disposition: attachment` con `filename*` UTF-8. No se debe intentar interpretar la respuesta como JSON ni Base64.
- Inscripciones por convocatoria: `GET /api/sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` desde el navegador. Cada elemento puede incluir `idPersona: number | null`; un valor numérico indica que el aspirante ya existe como estudiante y bloquea una nueva creación.
- Documentos: operaciones de checklist/prefetch y validación mediante servicios de documentos existentes.
- Archivo de un acta: `GET /api/sapp/actas/{actaId}`; el path usa `ActaDto.id`, no `documentoContenidoId`. Se espera el envelope `{ ok, message, data }`, con `data.contenidoBase64`, `data.mimeType` y `data.nombreArchivo` para visualizar o descargar el PDF.
- Aprobación de solicitud: `PUT /api/sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&actaId={actaId}` sin body. `actaId` se obtiene de `GET /api/sapp/actas` y debe corresponder a la instancia del estado anterior (`tipoConsejo: null` para Comité, `true` para Consejo); las solicitudes OTRA pueden añadir `enviarConsejo=true`.
- Informe de admision generado: `POST /api/sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}` sin body. La respuesta esperada es el contenido binario del PDF (`%PDF-1.4...`) como `Blob`; no parsear como JSON. Si el backend envia `Content-Disposition`, se usa ese nombre de archivo; si no, el fallback es `informe-admision-acta-{actaId}-convocatoria-{convocatoriaId}.pdf`.
- Login institucional: `GET /api/sapp/inicio`, sin body, envelope `{ ok, message, data }`. Además de los campos de identidad superiores, `data.detalle` contiene `{ aspirante, docente, estudiante, persona }`. `detalle.persona.id` alimenta `session.user.persona.id`, `detalle.estudiante?.id` alimenta `session.user.estudiante?.id` y el detalle completo queda disponible en `session.user.detalle`; no usar el `data.id` superior como sustituto de esos identificadores de dominio.

## Notas visuales de marca

- Mantener compatibilidad con tokens CSS globales y modo claro/oscuro.
- Evitar colores hardcodeados en componentes nuevos cuando exista token semántico equivalente.
- Los logos institucionales agregados en `public/brand` se sirven desde `public` y no requieren imports desde TypeScript; el logo EISI vigente es el PNG `/brand/eisi%20imagen.png`.

### 2026-09-08 — Iconografía unificada entre sidebar e inicio

- Las tarjetas de acceso rápido de **Inicio** usan ahora exactamente los iconos definitivos del sidebar para Solicitudes, Matrícula, Estudiantes, Admisiones, Informes a dependencias, Actas y Fechas.
- `SidebarModuleIcon` centraliza tanto los trazos propios como los iconos Lucide de los módulos; sidebar e inicio consumen esa única fuente para evitar que vuelvan a divergir.
- Los iconos del inicio heredan `--primary` y conservan trazos vectoriales nítidos en modo claro y oscuro. No se modificaron rutas, permisos, contratos HTTP, dependencias, seeds ni datasets.

## Decisión reciente — `/fechas` responsive (2026-09-21)

- El módulo protegido mantiene en escritorio sus tablas, columnas, filtros, agrupación por programa, formularios y acciones. Hasta 780 CSS px, las mismas filas y manejadores se presentan como tarjetas: los períodos separan las fechas del período académico de las fechas de matrículas y las convocatorias muestran período, estado, cupos, fechas, observaciones completas y acciones explícitas.
- El desbordamiento móvil provenía de los anchos mínimos locales de 860 px y 1080 px de las tablas, sumados al padding de tarjetas anidadas. La corrección está encapsulada en `FechasModulePage.css`: elimina esos mínimos únicamente en móvil, convierte el DOM de tabla existente a Grid y mantiene el encabezado de tabla disponible para tecnologías de asistencia; no oculta overflow en `body` ni modifica tablas de otros módulos.
- Los filtros, la página de períodos y la página independiente de cada programa siguen siendo estados React únicos y no dependen del breakpoint. Después de una recarga de datos se ajustan páginas que hayan quedado fuera del rango. El cierre conserva confirmación y endpoint, ahora bloquea reenvíos mientras está en curso y solo informa éxito después de la respuesta y el refresco.
- `vigente` retornado por el backend es la fuente autoritativa de **VIGENTE/CERRADA**; el cliente ya no reclasifica una convocatoria con el reloj local. No cambiaron endpoints, DTO, serialización de fechas, roles, rutas, dependencias, variables, schemas, seeds ni datasets.
- Los formularios de período, creación de convocatoria y edición de fechas conservan campos y validaciones. En móvil pasan a una columna, usan controles de al menos 44 px y fuente de 16 px, y los modales limitan su alto con scroll interno mediante `100dvh` sin desmontar ni duplicar el formulario.

### Contratos y ejecución de `/fechas`

- Lectura: `GET /sapp/periodoAcademico/withFechas` y `GET /sapp/convocatoriaAdmision`. Escritura: creación/actualización de período mediante los servicios existentes; `POST /sapp/convocatoriaAdmision`; `PUT /sapp/convocatoriaAdmision/fechas/{id}`; cierre confirmado mediante `PUT /sapp/convocatoriaAdmision/cerrar/{id}`.
- Desarrollo: reutilice `node_modules` y ejecute `npm run dev`; producción: `npm run build`; no existe script `test`. No se requieren seeds para frontend y los catálogos/datos provienen del backend configurado por el cliente HTTP existente.
- Entorno verificado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, rolldown-vite 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0. No crear venv, conda, Poetry ni otro árbol npm.
# SAPP Frontend

Interfaz web del Sistema de Apoyo para la gestión de trámites de Posgrados de la
EISI–UIS. Centraliza las experiencias de admisiones, estudiantes, matrícula,
créditos condonables, solicitudes, comités, trabajos de grado, profesores,
notificaciones y configuración académica. Consume los contratos REST del backend
SAPP; no accede directamente a PostgreSQL.

## Arquitectura y stack

- SPA modular construida con componentes funcionales y hooks de React.
- Rutas públicas y protegidas centralizadas en `src/app/routes`; páginas en
  `src/pages`, componentes compartidos en `src/components` y acceso HTTP en
  `src/api`.
- React/React DOM 19.2.3, React Router DOM 7.11.0 y Lucide React 0.468.0-local.
- TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y
  typescript-eslint 8.51.0 (versiones resueltas por `package-lock.json`).
- Temas claro/oscuro basados en los tokens semánticos UIS/Beer.css.

## Ejecución local

Requisitos comprobados: Node.js 24.15.0 y npm 11.4.2. Reutilice el único árbol
`node_modules` del repositorio; este frontend no usa venv, Conda ni Poetry.

```bash
npm ci
cp .env.example .env.local # ajuste únicamente los valores de su entorno
npm run dev
```

Validaciones y compilación de producción:

```bash
npm run lint
npm run build
npm run preview
```

No existe un script de seeds ni datasets locales: los catálogos y registros se
obtienen del backend configurado mediante las variables Vite documentadas en
`.env.example`. Tampoco hay actualmente un script automatizado `test`.

## Decisiones recientes (changelog ligero)

- **2026-09-24:** las acciones de cada fila en la tabla de matrícula financiera
  se presentan como botones secundarios compactos, incluido **Ver detalle**, en
  lugar de enlaces subrayados. El botón de la sección de convocatoria ahora
  muestra únicamente **Convocar**; la operación conserva la inclusión de
  estudiantes vigentes y nuevos y no cambia contratos ni permisos.
- **2026-09-24:** el catálogo de Proyectos de grado de maestría excluye el tipo `8` de examen de candidatura, exclusivo de doctorado, e incluye
  el tipo `9` **GRADO**. El catálogo doctoral conserva candidatura y también
  permite tramitar grado; el tipo `10` (AMPLIACION DE PERMANENCIA) queda fuera
  de ambos niveles.
- **2026-09-24:** la selección del nivel en Proyectos de grado reutiliza el
  resolvedor canónico de programas académicos. Además de las siglas históricas
  `MISI`/`DCC`, reconoce los nombres vigentes, los códigos UIS `302`/`347` y
  variantes con o sin tildes. Así, un estudiante del Doctorado en Ciencias de
  la Computación recibe exclusivamente el catálogo doctoral al crear una
  solicitud, en lugar de las opciones de maestría.
- **2026-09-23:** la línea de tiempo del detalle de evaluación de trabajos de
  grado dejó de depender del historial incluido en el DTO general y consulta
  `GET /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/historial`. Cada cambio
  presenta el nuevo estado, fecha en horario de Colombia, origen, responsable,
  detalle y minutos transcurridos en el estado anterior cuando esos valores
  existen. El historial se refresca también después de las mutaciones del
  proceso.
- **2026-09-23:** el catálogo y la presentación de solicitudes reconocen los
  estados de proyectos de grado 12–20 (`JUR_POR_DESIG`, `JUR_INVITADO`,
  `EN_EVALUACION`, `CONCEPTOS_REC`, `EN_AJUSTES`, `SUST_PROGRAMADA`,
  `SUSTENTADA`, `APLAZADA` y `NO_APROBADA`). Sus nombres se muestran siempre
  en mayúsculas en filtros, listados, detalle y línea de tiempo del proceso,
  conservando las tildes entregadas por el backend.
- **2026-09-23:** el detalle estudiantil de las solicitudes de trabajo de grado
  tipo 4, 5, 6, 7 y 8 consulta `GET
  /sapp/procesoEvaluacionTg/solicitud/{solicitudId}`. Cuando la solicitud está en
  `EN_AJUSTES` (estado 16), muestra las observaciones de los evaluadores y
  permite volver a cargar exactamente el documento señalado por
  `documentoEvaluarId`. Después de crear la nueva versión con `POST
  /sapp/document`, asigna el `id` retornado mediante `PUT
  /sapp/procesoEvaluacionTg/solicitud/{solicitudId}/documento-evaluar/{documentoId}`
  y solo entonces refresca el proceso, la solicitud y sus adjuntos.
- **2026-09-21:** se definió un orden único de módulos para la navegación
  principal y los accesos de Inicio: Admisiones, Matrícula, Solicitudes,
  Créditos condonables, Estudiantes, Informes a dependencias, Actas, Fechas y
  Gestión profesores. Los permisos continúan ocultando los módulos que no
  correspondan a cada rol, sin alterar el orden relativo de los visibles.
- **2026-09-21:** la búsqueda en Gestión de profesores pasó a ignorar tildes y
  otros signos diacríticos. Consultas como `andres leo` encuentran nombres como
  `ANDRÉS LEONARDO`, sin alterar los DTO ni los endpoints existentes.
- **2026-09-20:** se completaron adaptaciones responsive en Fechas, Admisiones,
  Créditos condonables y Estudiantes, preservando permisos y contratos.

---
- **2026-09-23:** todas las mutaciones del proceso de evaluación de trabajos de
  grado (jurados, documento, ajustes, sustentación, resultado y recordatorios)
  vuelven a consultar tanto el proceso como la solicitud y sus adjuntos. La tabla
  de jurados presenta cada evaluación por separado: momento y concepto para
  `CONCEPTO_DOCUMENTO`, o momento y resultado para `SUSTENTACION`, incluyendo
  observaciones únicamente cuando existen.

## Corrección reciente — resultado tras conceptos de sustentación (2026-09-23)

- En un proceso `SUST_PROGRAMADA`, **Registrar resultado** se muestra únicamente
  cuando cada jurado activo tiene una evaluación cuyo momento es
  `SUSTENTACION`. Los jurados reemplazados o retirados (`activo: false`) no
  bloquean el cierre, pero se exige que exista al menos un jurado activo.
- La regla admite `momentoCodigo`, `momento` o `momentoNombre` del contrato del
  backend, normalizando espacios, guiones, mayúsculas y tildes. El formulario
  también queda protegido por la misma condición si los datos cambian mientras
  el detalle está abierto.
- No cambiaron endpoints, payloads, permisos, dependencias, variables, schemas,
  seeds ni datasets. El backend continúa siendo la autoridad final al procesar
  el registro del resultado.

## Decisión reciente — vista del rol director (2026-09-24)

- El menú principal del rol `DIRECTOR` ya no presenta **Matrícula** ni
  **Proyectos de grado**. Admisiones y Solicitudes permanecen disponibles.
- En `/solicitudes`, el director consulta únicamente **Solicitudes asignadas**;
  no se solicita ni se muestra el listado general con filtros. La página conserva
  un único título principal **Solicitudes**, sin repetirlo dentro del contenido.
- El cambio es solo de presentación y navegación por rol. No modifica rutas,
  endpoints, DTO, schemas, variables de entorno, dependencias, seeds ni datasets.
# SAPP Frontend

Interfaz web institucional para centralizar y dar trazabilidad a los procesos de posgrado EISI–UIS: admisiones, matrículas académica y financiera, créditos condonables, solicitudes y trabajos de grado. Es una SPA modular que consume los contratos REST de SAPP; el backend conserva la autoridad sobre reglas, cálculos, permisos y persistencia.

## Arquitectura, stack y ejecución

- React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2 (árbol exacto en `package-lock.json`).
- Rutas y guards en `src/app`; vistas en `src/pages`; dominio, tipos y transporte por módulo en `src/modules`; componentes compartidos en `src/components`.
- Reutiliza el entorno npm existente: `npm run dev` inicia desarrollo, `npm run build` genera `dist`, `npm run lint` revisa calidad y `node --test --test-isolation=none tests/*.test.ts` ejecuta las regresiones. No usa venv, Conda ni Poetry.
- No hay seeds generales ni base local versionada. Los datos provienen del backend institucional; el simulador aislado de matrícula financiera está en `tests/fixtures/matricula-financiera/preview.html` y usa datos ficticios sin red.

## Decisión reciente — claridad y validación de matrícula financiera (2026-09-24)

- Los parámetros usan etiquetas orientadas al usuario, ayudas explicativas y acciones distintas para crear/editar. La base de salud continúa fija internamente en `SMMLV` sin exponerse.
- Las tarjetas ya solo resumen convocados y pendientes, y todas las vigencias se expresan como “Recepción de respuestas habilitada hasta el…”.
- El detalle destaca el estado con una variante semántica. El certificado se muestra dentro de las respuestas únicamente al contestar **Sí**, conserva consulta/versionado y sigue cargándose de forma independiente.
- Coordinación ya no marca “Certificado recibido”: la respuesta Sí/No genera `certificadoVotacionRecibido` automáticamente. El registro queda bloqueado y se vuelve a validar en el envío mientras falte alguna respuesta aplicable; observaciones y archivo siguen opcionales. No cambiaron endpoints ni DTO del backend.

---

## Actualización 2026-09-24 — revisión y confirmación de liquidaciones

- Coordinación dispone de las mismas acciones en tabla y detalle: **Ver detalle**, **Confirmar liquidación en PUTTY** y **Excluir del proceso**. Confirmar exige estado `RESPONDIDA`, total definido (cero es válido), respuestas/correcciones guardadas y aceptación explícita; excluir exige motivo no vacío y confirmación. Desmarcar y reincluir conservan los endpoints existentes y también piden confirmación. Los procesos `PUBLICADO` son de consulta.
- **Corregir cálculo** está integrado como panel desplegable dentro del cálculo del servidor. Mantiene semestre, ajuste con signo, total manual opcional y motivo; admite moneda colombiana y hasta cuatro decimales sin confundir cero con vacío. El servidor sigue siendo la autoridad del total definitivo.
- El listado ya no ofrece ni envía `conAlertas`, retiró semestre y presenta insignias textuales para pendiente, respondida, liquidada y excluida. El control del submenú lateral conserva dimensiones estables, centrado y rotación.
- La vista estudiantil presenta exclusivamente **Total liquidado** cuando está disponible. El desglose permanece en el contrato para compatibilidad, pero solo coordinación lo presenta; el detalle oficial se consulta por canales institucionales del sistema financiero.
- No se añadieron estados, endpoints, migraciones ni dependencias. Reutilizar `node_modules`; ejecutar `npm run dev`, `npm run lint`, `node --test --test-isolation=none tests/*.test.ts` y `npm run build`. No hay seeds para este flujo; la fixture aislada está en `tests/fixtures/matricula-financiera/preview.html`.
# Actualización 2026-09-24 — botón Volver uniforme en liquidaciones

- El tablero de detalle de un proceso de matrícula financiera reutiliza ahora `BackButton`, el control compartido del sistema, para **Volver a procesos**. Esto unifica su presentación pill, borde, superficie, sombra y estados de foco/hover en los temas claro y oscuro, sin cambiar la ruta `/matricula/financiera` ni el comportamiento de navegación.
- Es un ajuste exclusivamente visual: no modifica contratos HTTP, DTO, permisos, dependencias, variables, seeds ni datasets. El frontend sigue usando React 19.2.3, React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2 sobre Node.js 24.15.0 y npm 11.4.2.
- Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm. Desarrollo: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No hay seeds locales; los datos reales provienen del backend configurado con las variables Vite.

---

## Decisión reciente — mensaje de confirmación de liquidación (2026-09-24)

- El detalle de matrícula financiera conserva la instrucción de confirmar solo
  después de registrar la liquidación en PUTTY, pero omite la explicación sobre
  el carácter no bloqueante de las alertas por no ser relevante en ese punto de
  la interfaz.
- El ajuste es exclusivamente de contenido. No cambia validaciones, acciones,
  contratos HTTP, DTO, dependencias, variables, seeds ni datasets.

## Decisión reciente — formato monetario durante la edición (2026-09-24)

- Los campos **Valor a sumar o restar al cálculo** y **Total autorizado
  manualmente** muestran mientras se escribe el prefijo `$` y separadores de
  miles colombianos. Los valores negativos y hasta cuatro decimales continúan
  admitidos; el payload enviado al backend permanece numérico y sin formato.
- No se modificaron endpoints, DTO, reglas de cálculo, dependencias, variables,
  seeds ni datasets. El servidor conserva la autoridad sobre el total final.

## Corrección reciente — flecha del submenú de matrícula (2026-09-24)

- El control que despliega los submenús de **Matrícula** usa ahora un icono
  vectorial de flecha consistente con la iconografía del menú. Su caja de 40 px
  y el SVG de 18 px quedan centrados en ambos ejes, y la rotación comunica
  el estado expandido sin depender de la alineación tipográfica de un glifo.
- El ajuste es únicamente visual y conserva la interacción, los atributos
  accesibles, las rutas, los permisos y los tokens de tema existentes. No cambia
  contratos HTTP, dependencias, variables, seeds ni datasets.

## Decisión reciente — semestre en el detalle de liquidación (2026-09-25)

- En la tarjeta **Revisión del caso** del detalle de matrícula financiera, el
  parámetro **Semestre** presenta solamente el número o **Sin calcular** cuando
  no existe. El origen técnico `CALCULADO`/`MANUAL` permanece en el DTO para
  compatibilidad, pero ya no se muestra junto al valor.
- El cambio es exclusivamente de presentación: no modifica endpoints, payloads,
  tipos, reglas de cálculo, permisos, dependencias, variables, seeds ni datasets.
  Reutilizar `node_modules`; el flujo real continúa dependiendo del backend y de
  una sesión institucional.

---

# Mejora 2026-09-25 — fecha límite destacada en la liquidación estudiantil

SAPP Frontend es la SPA institucional de EISI–UIS para centralizar admisiones, matrículas, solicitudes, créditos condonables, actas, informes y proyectos de grado. React compone las vistas, TypeScript mantiene los contratos del cliente y el backend Spring Boot/PostgreSQL conserva las reglas académicas y la persistencia.

- En **Mi liquidación**, la fecha **Recepción de respuestas habilitada hasta el …** aparece inmediatamente después del nombre del programa y antes del código y período del estudiante. Se presenta en un aviso destacado con borde y fondo derivados de `--primary`; la fecha usa mayor peso visual para que el límite del proceso sea identificable rápidamente en temas claro y oscuro.
- El ajuste es únicamente de jerarquía y presentación. La fecha continúa proviniendo de `item.proceso.fechaLimiteRespuesta` y se formatea con `fechaColombia`; no cambian endpoints, DTO, validaciones, permisos, dependencias, variables, schemas, seeds ni datasets.
- Entorno comprobado: Node.js 24.15.0, npm 11.4.2, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar `/workspace/SAPP-frontend/node_modules` y `package-lock.json`; no crear venv, Conda, Poetry ni otro árbol npm.
- Ejecución: `npm run dev`; pruebas: `node --test --test-isolation=none tests/*.test.ts`; producción: `npm run build` y `npm run preview`. No hay seed reproducible para la ruta protegida; la fixture aislada permanece en `tests/fixtures/matricula-financiera/` y los datos reales vienen del backend institucional.

---

# Ajuste 2026-09-25 — resumen de procesos de matrícula financiera

- Las tarjetas de `/matricula/financiera` para coordinación muestran únicamente estado, periodo y fecha límite de recepción. Los conteos de **convocados** y **pendientes** se consultan al entrar al detalle del proceso.
- En `/matricula/financiera/procesos/:procesoId`, el encabezado ya no presenta **Pago hasta Sin registro** ni ninguna variante de esa línea, y el resumen deja de renderizar la tarjeta **Con alertas**. Permanecen **Convocados**, **Liquidadas**, **No liquidar**, **Pendientes** y **Respondidas**.
- Es un cambio de presentación. `resumen.convocados`, `resumen.pendientes`, `resumen.conAlertas` y `fechaLimitePago` continúan en el DTO y disponibles para reglas internas, publicación y compatibilidad con el backend; no cambiaron endpoints, payloads, permisos, rutas, dependencias, schemas, variables, seeds ni datasets.
- Entorno verificado: Node.js 24.11.0, npm 11.6.1, React/React DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Reutilizar el `node_modules` y `package-lock.json` existentes; no crear venv, Conda, Poetry ni otro árbol npm. Ejecutar `npm run dev`, `node --test --test-isolation=none tests/*.test.ts`, `npm run build` y, para revisar la salida compilada, `npm run preview`. No existe seed local para estas rutas protegidas; los datos reales provienen del backend institucional.
- Verificación: ESLint focalizado PASS; pruebas Node PASS (63/63); build PASS (312 módulos, CSS 261.02 kB, JS 739.16 kB); `git diff --check` PASS. Avisos no bloqueantes: configuraciones npm heredadas `msvs_version`/`python` y chunk JavaScript mayor de 500 kB.

## Ajuste 2026-09-25 — nombres descriptivos para las métricas

- El resumen del tablero financiero reemplaza las etiquetas breves por descripciones operativas: **Estudiantes registrados en el proceso de matrícula**, **Matrículas registradas en el sistema financiero (PUTTY)**, **Estudiantes excluidos de liquidación**, **Estudiantes pendientes de responder** y **Estudiantes que registraron sus respuestas**.
- Las claves y cifras del backend permanecen intactas; el cambio se concentra en `etiquetaResumen` y en la legibilidad de las tarjetas. No se modificaron contratos, cálculos, estados, endpoints, permisos, dependencias, variables, schemas, seeds ni datasets.
- Verificación: ESLint focalizado PASS; pruebas Node PASS (63/63); build PASS (312 módulos, CSS 261.03 kB, JS 739.33 kB). Persisten únicamente los avisos ambientales de npm y el warning conocido por el chunk JavaScript mayor de 500 kB.

## Ajuste 2026-09-25 — parámetros visibles del proceso financiero

- El acordeón **Parámetros y fechas del proceso** del tablero muestra **Fuente SMMLV**, **SMMLV**, **Votación / salud**, **Primer envío** y **Fecha límite recepción respuestas**. Se retiraron de esa sección **Cierre** y **Publicación**.
- Los valores provienen del mismo DTO: `valorSmmlv` usa el formato monetario institucional y `fechaLimiteRespuesta` usa la fecha de Colombia. `fechaCierre` y `fechaPublicacion` permanecen en el contrato para compatibilidad y reglas del proceso; no cambiaron endpoints, payloads, estados, permisos, dependencias, schemas, variables, seeds ni datasets.
- Verificación: ESLint focalizado PASS; pruebas Node PASS (64/64); build PASS (312 módulos, CSS 261.03 kB, JS 739.35 kB). Avisos no bloqueantes: configuraciones npm heredadas y chunk JavaScript mayor de 500 kB.

## Ajuste 2026-09-25 — porcentajes y edición dentro del acordeón

- **Votación / salud** se separó en **Porcentaje de votación** y **Porcentaje de salud**, cada uno con su valor independiente. El botón **Editar parámetros** ahora aparece dentro de **Parámetros y fechas del proceso**; conserva su disponibilidad para procesos no publicados y su bloqueo mientras hay una operación en curso. **Agregar estudiante** continúa como acción independiente fuera del acordeón.
- No cambiaron el formulario ni su payload: siguen utilizándose `porcentajeVotacion` y `porcentajeSalud`. Tampoco cambiaron endpoints, permisos, estados, dependencias, schemas, variables, seeds ni datasets.
- Verificación: ESLint focalizado PASS; pruebas Node PASS (64/64); build PASS (312 módulos, CSS 261.03 kB, JS 739.54 kB). Avisos no bloqueantes: configuraciones npm heredadas y chunk JavaScript mayor de 500 kB.

## Ajuste 2026-09-25 — primer envío y advertencia de recálculo

- El parámetro **Primer envío** se presenta ahora como **Fecha del primer envío de solicitudes**, conservando `fechaEnvioSolicitudes` como fuente. En **Editar parámetros**, el texto sobre el recálculo se muestra dentro de una advertencia titulada **Consecuencias de guardar cambios**, con icono, borde lateral, fondo y contraste derivados de tokens semánticos para temas claro y oscuro.
- Se conserva literalmente la consecuencia funcional: guardar recalcula las filas sin valor final manual y requiere revisar los valores antes de exportar nuevamente. No cambiaron el recálculo, el formulario, payloads, endpoints, permisos, estados, dependencias, schemas, variables, seeds ni datasets.
- Verificación: ESLint focalizado PASS; pruebas Node PASS (65/65); build PASS (312 módulos, CSS 261.83 kB, JS 739.91 kB). Avisos no bloqueantes: configuraciones npm heredadas y chunk JavaScript mayor de 500 kB.

## Ajuste 2026-09-25 — alta manual dentro de seguimiento

- **Agregar estudiante** y el formulario **Agregar estudiante manualmente** se trasladaron a la tarjeta **Seguimiento y cierre**, junto a las acciones que administran el conjunto de estudiantes y antes del listado filtrable. La acción continúa visible solo cuando el estado permite `convocar` y conserva el mismo servicio, payload, validaciones y bloqueo durante operaciones.
- No cambiaron contratos, endpoints, permisos, reglas de elegibilidad, estados, dependencias, schemas, variables, seeds ni datasets.
- Verificación: ESLint focalizado PASS; pruebas Node PASS (65/65); build PASS (312 módulos, CSS 261.83 kB, JS 739.86 kB). Avisos no bloqueantes: configuraciones npm heredadas y chunk JavaScript mayor de 500 kB.
