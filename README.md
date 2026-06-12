# SAPP Frontend — EISI UIS

Frontend del **Sistema de Apoyo para la gestión de trámites de posgrados (SAPP)** de la Escuela de Ingeniería de Sistemas e Informática (**EISI**) de la Universidad Industrial de Santander (**UIS**).

## Propósito y alcance

SAPP centraliza y estandariza la trazabilidad de procesos académicos y administrativos de posgrado:

- admisiones y convocatorias;
- matrícula académica;
- matrícula financiera y créditos condonables;
- solicitudes estudiantiles;
- examen de candidatura;
- trabajos de grado;
- configuración de fechas y notificaciones.

Este repositorio contiene únicamente el **frontend React/TypeScript**. La lógica de dominio, persistencia y contratos principales viven en el backend Spring Boot/PostgreSQL consumido por API HTTP.

## Arquitectura breve

- **SPA React + TypeScript** servida con Vite/rolldown-vite.
- **Ruteo** centralizado en `src/app/routes` con rutas protegidas por rol.
- **Autenticación** en `src/context/Auth` y persistencia de sesión en storage compartido; actualmente existe un mock temporal ADMIN para pruebas de gateway.
- **Cliente HTTP** encapsulado en `src/shared/http/httpClient.ts` y servicios por módulo/API.
- **Módulos de dominio UI** bajo `src/modules` y pantallas bajo `src/pages`.
- **Layout institucional** con `Sidebar`, `Layout` y `ModuleLayout`; los assets de marca institucional viven en `public/brand`.

## Stack y versiones exactas observadas

Versiones instaladas en `/workspace/SAPP-frontend` según `npm list --depth=0` el **2026-06-12**:

| Paquete | Versión |
| --- | --- |
| Node.js | 24.15.0 |
| npm | 11.4.2 |
| react | 19.2.3 |
| react-dom | 19.2.3 |
| react-router-dom | 7.11.0 |
| typescript | 5.9.3 |
| vite | npm:rolldown-vite@7.2.5 |
| @vitejs/plugin-react-swc | 4.2.2 |
| eslint | 9.39.2 |
| @eslint/js | 9.39.2 |
| typescript-eslint | 8.51.0 |
| eslint-plugin-react-hooks | 7.0.1 |
| eslint-plugin-react-refresh | 0.4.26 |
| @types/node | 24.10.4 |
| @types/react | 19.2.7 |
| @types/react-dom | 19.2.3 |
| globals | 16.5.0 |

> Nota: `package.json` mantiene rangos semver para algunos paquetes, pero las versiones anteriores son las instaladas actualmente en `node_modules`/lockfile.

## Requisitos de entorno

- Usar **Node.js + npm** en la raíz del repo.
- No usar ni crear `venv`, `conda`, `poetry` ni entornos Python duplicados para este frontend.
- Reutilizar `node_modules` de la raíz cuando exista; si falta, ejecutar `npm install`.
- Variable opcional: `VITE_API_BASE_URL` para apuntar al backend/gateway. Si no se define, el cliente usa `http://localhost:8080`.

Ejemplo `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Cómo ejecutar

```bash
npm install
npm run dev
```

La app queda disponible por defecto en `http://localhost:5173/`.

Otros comandos útiles:

```bash
npm run build
npm run lint
npm run preview
```

## Seeds / sesión de pruebas

No hay seed de base de datos en este repositorio frontend. Para pruebas locales, el estado actual conserva un mock temporal de autenticación:

- archivo: `src/context/Auth/mockGatewaySession.ts`;
- bandera: `ENABLE_GATEWAY_AUTH_MOCK = true`;
- sesión: usuario `Administrador SAPP Mock` con rol `ADMIN`;
- token: `NO_TOKEN`, filtrado para no enviar un Bearer falso al backend/gateway;
- storage: `SAPP_AUTH_SESSION`.

Cuando se conecte el contrato real de API Gateway/IDP, este bypass debe desactivarse o reemplazarse por el mapper real de identidad.

## Decisiones recientes / changelog-lite

### 2026-06-12 — Marca EISI/UIS

- Se reemplazó el favicon de Vite por el ícono EISI en `public/brand/eisi-favicon.svg` y `index.html`.
- Se agregó el logo UIS en el encabezado de módulos, a la derecha de la foto del usuario autenticado, usando `public/brand/uis-logo.svg` y estilos responsivos en `ModuleLayout`.
- Se actualizó el título del documento a `SAPP EISI UIS` y el idioma HTML a español.

### 2026-06-06 — Rediseños visuales de admisiones/documentos

- Se modernizaron pantallas de admisiones y detalle de documentos sin alterar contratos backend.
- Se mantuvieron acciones existentes de ver/descargar/aprobar/rechazar documentos.

### 2026-06-05 — Mock temporal de API Gateway

- Se habilitó una sesión mock ADMIN para pruebas de integración evitando pantalla de login.
- `NO_TOKEN` se filtra para no enviar `Authorization` ficticio.

### 2026-06-02 — Ajustes temporales de convocatoria cerrada

- Se permitió temporalmente crear aspirantes en convocatoria cerrada para pruebas.
- Revertir antes de ambientes estables/productivos si se requiere respetar el gating original.

## Contratos relevantes

- Base URL: `VITE_API_BASE_URL || http://localhost:8080`.
- Prefijo backend observado: rutas tipo `/sapp/...`.
- Programas: `GET /sapp/programaAcademico`.
- Aspirantes: `POST /sapp/aspirante`.
- Inscripciones por convocatoria: `GET /sapp/inscripcionAdmision/convocatoria/{convocatoriaId}`.
- Documentos: operaciones de checklist/prefetch y validación mediante servicios de documentos existentes.

## Notas visuales de marca

- Mantener compatibilidad con tokens CSS globales y modo claro/oscuro.
- Evitar colores hardcodeados en componentes nuevos cuando exista token semántico equivalente.
- Los logos institucionales agregados en `public/brand` son SVG ligeros y no requieren imports desde TypeScript.
