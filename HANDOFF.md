# HANDOFF — SAPP Frontend

## Estado actual
- Se corrigió el modal **Nueva convocatoria** en `/admisiones/convocatorias`: el combo de programas ya no depende de convocatorias existentes.
- Ahora se consume `GET /sapp/programaAcademico` para poblar opciones y se mantiene fallback a programas derivados de convocatorias por resiliencia.
- El submit sigue enviando `programaId` numérico dentro de `POST /sapp/convocatoriaAdmision` (contrato esperado por backend).

## Archivos tocados
- `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Confirmar con backend si el endpoint `/sapp/programaAcademico` siempre retorna `codigoNombre` con formato estable (actualmente se parsea para etiqueta UI).
2. Resolver errores TypeScript preexistentes del repo que bloquean `npm run build` global (no introducidos por este cambio).

## Próximos pasos recomendados
1. Probar manualmente flujo completo en navegador:
   - abrir modal,
   - seleccionar programa (MISI/DCC),
   - crear convocatoria y validar payload real en Network.
2. Agregar prueba de integración UI (RTL/Vitest) para asegurar que el combo de programas se puebla desde API aunque no existan convocatorias.

## Contratos/Esquemas esperados
### Programas
- `GET /sapp/programaAcademico`
- Respuesta esperada:
  - `{ ok, message, data: Array<{ id, nombre, codigoNombre }> }`

### Crear convocatoria
- `POST /sapp/convocatoriaAdmision`
- Body ejemplo:
```json
{
  "cupos": 5,
  "fechaFin": "2026-02-10",
  "fechaInicio": "2026-01-29",
  "observaciones": "observadassss",
  "programaId": 2,
  "periodoId": 2
}
```

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
- `npm run build`: **falló** por errores TypeScript preexistentes en módulos no relacionados (ModuleLayout/evaluación/documentos).
- No se ejecutaron pruebas automáticas adicionales en este cambio.

## Logs útiles
- Verificar en DevTools Network que `POST /sapp/convocatoriaAdmision` incluya `programaId` (`1` MISI, `2` DCC) según selección del combo.
