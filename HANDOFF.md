# HANDOFF — SAPP Frontend

## Estado actual
- Listado de aspirantes por convocatoria con fallback visual de foto implementado.
- En `StudentCard`, si `photoUrl` no existe o el recurso falla al cargar (`onError`), se renderiza avatar genérico institucional (`👤`) en el bloque de media.
- Se mantiene compatibilidad con tema claro/oscuro usando tokens CSS semánticos (`--surface-container-low`, `--primary`).

## Archivos tocados
- `src/modules/admisiones/components/StudentCard/StudentCard.tsx`
- `src/modules/admisiones/components/StudentCard/StudentCard.css`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Definir con diseño si el avatar genérico debe migrar de emoji a ícono SVG institucional compartido.
2. Validar con backend si conviene exponer flag explícito de foto disponible para evitar intentos de carga inválidos.

## Próximos pasos recomendados
1. Validar visualmente `/admisiones/convocatoria/:convocatoriaId` con casos: foto válida, sin foto, y foto corrupta/base64 inválido.
2. (Opcional) Extraer componente reusable de avatar fallback para header/listados.

## Contratos/Esquemas esperados
### Inscripción admisión (foto)
- Campo actual usado: `inscripcion.foto?.contenidoBase64` + `inscripcion.foto?.mimeType`.
- Comportamiento frontend esperado:
  - Si hay base64 válido → render `<img>`.
  - Si no hay base64 o falla carga de imagen → render avatar genérico.

## Entorno exacto y paquetes
- Runtime: Node.js + npm (sin venv/conda/poetry).
- Frontend: React 19.2.0 + TypeScript ~5.9.3 + Vite (rolldown-vite 7.2.5 alias).
- **Evitar entornos duplicados**: usar instalación local del repo (`npm install`) y no crear entornos paralelos.

## Comandos base
```bash
npm install
npm run dev
npm run build
npm run lint
```

## Últimos resultados de pruebas
- `npm run lint`: no ejecutado en este ajuste puntual (cambio UI acotado en componente).
- Validación manual pendiente para escenarios de foto ausente y foto con error de carga.

## Logs útiles
- Verificar en DevTools que imágenes con error disparen `onError` y cambien al fallback sin romper layout.
