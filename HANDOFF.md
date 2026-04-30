# HANDOFF — SAPP Frontend

## Estado actual
- Ajuste aplicado en creación de convocatorias (`/admisiones/convocatorias`) para manejo especial de evaluadores:
  - `Luis Carlos Gomez` y `Fabio Martinez Carillo` ya no aparecen en el combo de profesores seleccionables.
  - Ambos se muestran preseleccionados en chips al abrir el modal.
  - Al guardar, **no** se incluyen en el payload de asignación de evaluadores (`POST /sapp/evaluadorConvocatoria`).
  - Solo se envían los profesores adicionales que el usuario agregue manualmente.

## Archivos tocados
- `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Confirmar con negocio si la exclusión de los dos profesores debe basarse en nombre (actual) o en `id` fijo de backend.
2. Confirmar si los chips preseleccionados deben ser removibles por usuario o bloquearse visualmente.

## Próximos pasos recomendados
1. Validación manual de flujo completo en UI:
   - abrir modal,
   - verificar que los dos profesores no salgan en dropdown,
   - verificar que sí aparezcan en chips,
   - crear convocatoria con profesores extra.
2. Verificar en Network que `POST /sapp/evaluadorConvocatoria` no reciba IDs de los dos profesores excluidos.
3. (Opcional) agregar test unitario para la lógica de filtrado/normalización de nombres.

## Paths / artefactos clave
- Modal de creación: `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx`
- Servicio de asignación: `src/modules/admisiones/services/convocatoriaProfesoresMockService.ts`

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
