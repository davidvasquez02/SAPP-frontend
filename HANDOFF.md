# HANDOFF — SAPP Frontend

## Estado actual
- Se completó una mejora responsive transversal sin tocar contratos de servicios ni endpoints.
- El layout principal ahora usa dos comportamientos:
  - **Desktop (>=1024px):** sidebar lateral fijo/colapsable existente.
  - **Tablet/Móvil (<1024px):** botón `☰ Menú` + sidebar tipo drawer superpuesto.
- El menú móvil se cierra al: seleccionar ruta, tocar overlay, usar botón “Cerrar” o hacer logout.
- Se añadió bloqueo de scroll del fondo cuando el menú móvil está abierto (`body.menu-open`).
- Se reforzó prevención de overflow horizontal global y ajustes móviles en tablas/filtros.

## Archivos tocados
- `src/components/Layout/Layout.tsx`
- `src/components/Layout/Layout.css`
- `src/components/Sidebar/Sidebar.tsx`
- `src/components/Sidebar/Sidebar.css`
- `src/styles/globals.css`
- `README.md`
- `HANDOFF.md`

## Retos abiertos
1. Ejecutar validación visual completa en 1440/1024/768/430/390/360 para todos los módulos funcionales (admisiones, solicitudes, matrícula, coordinación).
2. Ajustar puntualmente pantallas que tengan grillas/tablas especializadas si aparece overflow interno no deseado.
3. Resolver errores TypeScript preexistentes del repo para recuperar `npm run build` en CI local.

## Próximos pasos recomendados
1. Levantar app con `npm run dev` y validar navegación por roles (ESTUDIANTE, COORDINACION, SECRETARIA, ADMIN, DOCENTE/PROFESOR).
2. Verificar que el drawer móvil no quede por debajo de modales de negocio críticos y que el foco/teclado siga usable.
3. Revisar componentes de formularios complejos para confirmar paso a una columna en móvil en todos los casos.
4. Si se requiere, estandarizar una clase utilitaria compartida para barras de acciones de tablas en mobile (`flex-wrap`).

## Paths / artefactos clave
- Shell principal: `src/components/Layout/*`
- Navegación y roles sidebar: `src/components/Sidebar/*`, `src/auth/roleGuards.ts`
- Tokens y estilos globales: `src/styles/globals.css`

## Contratos/Esquemas esperados
- **Sin cambios** en contratos API.
- Se mantiene envelope: `{ ok, message, data }`.
- Sin cambios en rutas protegidas, resolución de sesión o auth context.

## Entorno exacto y paquetes
- Runtime: Node.js + npm (sin venv/conda/poetry; no aplica).
- `react` 19.2.0
- `react-dom` 19.2.0
- `react-router-dom` 7.9.2
- `typescript` 5.9.3
- `vite` (alias `rolldown-vite`) 7.2.5
- `@vitejs/plugin-react-swc` 4.2.2
- `eslint` 9.39.1

**Nota para evitar entornos duplicados:** usar el entorno npm del repo actual; no crear otros entornos paralelos.

## Últimos resultados de pruebas + logs
- `npm run build` (13-May-2026): **falló** por errores TypeScript preexistentes fuera del alcance de esta mejora responsive (tipado en módulos de admisiones/documentos y un error en ModuleLayout).
- No se introdujeron cambios de lógica backend/API en esta iteración.

## Comandos base
```bash
npm install
npm run dev
npm run build
npm run lint
```
