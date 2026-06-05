# HANDOFF — SAPP Frontend

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
- Programas: `GET ${VITE_API_BASE_URL || 'http://localhost:8080'}/sapp/programaAcademico` con envelope `{ ok, message, data }`; cada item esperado incluye `{ id, nombre, codigoNombre }`.
- Estudiantes por programa: `GET ${VITE_API_BASE_URL || 'http://localhost:8080'}/sapp/estudiantes/consulta?programaId={id}&egresados=false` con envelope `{ ok, message, data }`.
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
