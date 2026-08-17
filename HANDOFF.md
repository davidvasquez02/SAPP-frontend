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
