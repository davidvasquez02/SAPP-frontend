# HANDOFF — SAPP Frontend

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
