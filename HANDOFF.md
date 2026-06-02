# HANDOFF — SAPP Frontend

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
