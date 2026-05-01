# HANDOFF — SAPP Frontend

## Estado actual
- Ajuste aplicado en detalle de inscripción de admisiones (sección **Documentos cargados**): las acciones **Ver/Descargar** se muestran únicamente cuando la inscripción **no** está en estado final (`ADMITIDO` o `RECHAZADO`).
- Se preserva la validación por rol (`COORDINADOR`/`SECRETARIA`) y no hubo cambios de contrato API; el cambio es de renderizado condicional en frontend.

## Archivos tocados
- `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Validar con coordinación/secretaría que, en inscripciones no finalizadas, las acciones **Ver/Descargar** vuelven a mostrarse correctamente.
2. Confirmar en estados `ADMITIDO` y `RECHAZADO` que la columna **Acciones** ya no se renderiza.

## Próximos pasos recomendados
1. Validación manual en `/admisiones/convocatoria/:convocatoriaId/inscripcion/:inscripcionId/documentos` con rol coordinación/secretaría:
   - inscripción en estado no final: debe aparecer columna **Acciones** con **Ver/Descargar**.
   - inscripción en estado `ADMITIDO` o `RECHAZADO`: no debe aparecer columna **Acciones**.
2. Verificar que aprobar/rechazar documentos mantiene comportamiento previo en estados no finales.
3. (Opcional) agregar test de render condicional de columna Acciones por `isEstadoFinal`.

## Paths / artefactos clave
- Página documentos inscripción: `src/pages/InscripcionDocumentos/InscripcionDocumentosPage.tsx`
- Contexto de estado final (`isEstadoFinal`): `src/pages/InscripcionAdmisionDetalle/InscripcionAdmisionDetallePage.tsx`

## Contratos/Esquemas esperados
### Asignación de evaluadores
- Endpoint: `POST /sapp/evaluadorConvocatoria`
- Payload por iteración:
  - `evaluadorId: number`
  - `convocatoriaId: number`
- Regla implementada:
  - excluir de `evaluadorId` a profesores con nombre normalizado `luis carlos gomez` y `fabio martinez carillo`.

## Entorno exacto y paquetes
- Runtime: Node.js + npm.
- Frontend: React 19.2.0, TypeScript 5.9.3, Vite (rolldown-vite 7.2.5 alias).
- Sin venv/conda/poetry (no aplica al stack actual).
- **Evitar entornos duplicados**: usar el entorno local del repo con `npm install`.

## Últimos resultados de pruebas + logs
- `npm run lint` ejecutado el 30-Apr-2026:
  - **falla** por errores preexistentes en varios módulos no relacionados al ajuste (e.g. `no-explicit-any`, `react-hooks/set-state-in-effect`, `react-refresh/only-export-components`).
  - Resultado del ajuste puntual sin errores de compilación reportados en este cambio.

## Comandos base
```bash
npm install
npm run dev
npm run build
npm run lint
```
