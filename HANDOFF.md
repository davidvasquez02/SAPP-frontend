# HANDOFF — SAPP Frontend

## Estado actual
- Flujo de creación de convocatorias actualizado para cumplir dependencia de evaluadores/profesores.
- Después de `POST /sapp/convocatoriaAdmision`, el frontend ejecuta una llamada por profesor a `POST /sapp/evaluadorConvocatoria` con `{ evaluadorId, convocatoriaId }`.
- La creación **no se considera finalizada** hasta completar exitosamente todas las asociaciones de profesores; si falla alguna, la UI deja mensaje de advertencia y permite reintento.

## Archivos tocados
- `src/modules/admisiones/components/CreateConvocatoriaModal/CreateConvocatoriaModal.tsx`
- `src/modules/admisiones/services/convocatoriaProfesoresMockService.ts`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Confirmar con backend si la ausencia de inscripciones debería estandarizarse como `ok=true,data=[]` para eliminar inferencia por mensaje.
2. Mantener consistencia de mensajes backend (evitar variantes excesivas de “sin registros”).

## Próximos pasos recomendados
1. Validar manualmente en `http://localhost:5173/admisiones/convocatoria/19` con una convocatoria vacía.
2. (Opcional) Extraer helper compartido para clasificar respuestas “empty-state” por módulo en vez de lógica inline por página.

## Contratos/Esquemas esperados
### Inscripciones por convocatoria
- `GET /sapp/inscripcionAdmision/convocatoria/{convocatoriaId}`
- Ideal esperado: `{ ok: true, message: string, data: [] }` cuando no hay registros.
- Estado actual tolerado por frontend: respuestas con mensaje semántico de “no hay/no existe/sin registros” se interpretan como vacío.

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
- `npm run lint`: falló por errores preexistentes del repositorio en módulos no relacionados (no introducidos por este ajuste).
- No se ejecutó `npm run build` en este ajuste puntual (cambio acotado de comportamiento UI).

## Logs útiles
- Verificar en UI que, para convocatoria sin registros, se renderice solo mensaje neutro y no bloque de error/reintento.
