# HANDOFF — SAPP-frontend-public

## Estado actual

- Flujo de aspirante migrado al subproyecto `SAPP-frontend-public/`.
- La vista inicial es login aspirante.
- Tras login exitoso se habilita:
  - checklist de documentos,
  - cargue individual,
  - previsualización para ANX-4 (imagen),
  - formulario de grupo/director de investigación.

## Retos abiertos

1. Confirmar con backend que todos los endpoints públicos están habilitados en el entorno objetivo.
2. Validar CORS para `VITE_API_BASE_URL`.
3. Si se requiere URL real `/aspirante/documentos`, agregar router de nuevo cuando la instalación de dependencias permita `react-router-dom`.

## Siguientes pasos sugeridos

1. Probar con un aspirante real de pruebas (inscripción/documento válidos).
2. Confirmar carga de al menos un documento obligatorio y uno opcional.
3. Verificar transición de estado por `cambioEstadoPorVal` al completar obligatorios.
4. Afinar copy/mensajes de error según UX final.

## Paths clave y artefactos

- Entry point: `src/main.tsx`
- Enrutamiento por sesión: `src/App.tsx`
- Login aspirante: `src/pages/AspiranteLogin/AspiranteLoginPage.tsx`
- Cargue documentos: `src/pages/AspiranteDocumentos/AspiranteDocumentosPage.tsx`
- Layout: `src/components/AspiranteLayout/AspiranteLayout.tsx`
- Auth/session:
  - `src/context/Auth/*`
  - `src/modules/auth/session/sessionStore.ts`
- HTTP/API:
  - `src/shared/http/httpClient.ts`
  - `src/api/*.ts`

## Contratos / endpoints esperados

- `GET /api/sapp/aspirante/consultaInfo`
- `GET /api/sapp/tipoDocumentoIdentificacion`
- `GET /api/sapp/document`
- `POST /api/sapp/document`
- `GET /api/sapp/gruposInvestigacion`
- `GET /api/sapp/gruposInvestigacionDocentes`
- `PUT /api/sapp/aspirante`
- `PUT /api/sapp/inscripcionAdmision/cambioEstadoPorVal/{id}`

### Formato de respuesta esperado

Todos los servicios consumen wrapper:

```ts
{ ok: boolean; message: string; data: T }
```

## Resultado de pruebas recientes

- `npm run build` en `SAPP-frontend-public/` ⚠️ falló por dependencias no instaladas (`@vitejs/plugin-react`, `@rolldown/plugin-babel`).
- `npm install` ⚠️ falló en este entorno por política 403 al resolver paquetes externos.

## Entorno exacto y notas de entorno

- Gestor: `npm`
- Proyecto: `SAPP-frontend-public/`
- No usar `venv/conda/poetry` (no aplica; es Node frontend).
- Evitar crear entornos duplicados: usar únicamente este directorio con su `package-lock.json`.
- Si hay bloqueo de red corporativo, configurar mirror/registry autorizado antes de `npm install`.
