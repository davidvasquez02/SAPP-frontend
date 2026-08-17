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
- **Ruteo** centralizado en `src/app/routes` con rutas protegidas por rol. No se publican rutas de login ni un portal independiente para aspirantes.
- **Autenticación** en `src/context/Auth`: al arrancar la SPA se inicializa la sesión real desde el API Gateway/IDP y se persiste en storage compartido.
- **Cliente HTTP** encapsulado en `src/shared/http/httpClient.ts` y servicios por módulo/API.
- **Módulos de dominio UI** bajo `src/modules` y pantallas bajo `src/pages`.
- **Layout institucional** con `Sidebar`, `Layout` y `ModuleLayout`; los assets de marca institucional viven en `public/brand`.

## Stack y versiones exactas observadas

Versiones instaladas en `/workspace/SAPP-frontend` según `npm list --depth=0` el **2026-08-17**:

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
- `VITE_API_URL` centraliza la ruta base consumida por el cliente HTTP. El valor por defecto versionado es `/api/sapp`, para que dev/prod usen rutas relativas del frontend.
- `VITE_DEV_PROXY_TARGET` configura únicamente el proxy local de Vite. Si no se define, apunta a `http://localhost:8080`; puede cambiarse sin tocar código fuente.
- `VITE_API_BASE_URL` se mantiene como fallback transitorio para compatibilidad con ambientes antiguos, pero los nuevos ambientes deben usar `VITE_API_URL`.

Ejemplo `.env.local`:

```env
VITE_API_URL=/api/sapp
VITE_DEV_PROXY_TARGET=http://localhost:8080
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

No hay seeds de base de datos ni usuarios quemados en este repositorio. La sesión SAPP se obtiene al cargar la SPA mediante `POST /api/sapp/auth/login`, sin body. Para desarrollo se necesita un backend/gateway que capture la identidad institucional y responda el contrato descrito abajo. La sesión normalizada se guarda en `localStorage['SAPP_AUTH_SESSION']`; `NO_TOKEN` es solo un marcador local y nunca se envía como Bearer porque la autenticación se resuelve en el gateway.

## Decisiones recientes / changelog-lite

### 2026-08-17 — Acceso gestionado fuera de la SPA

- Se retiraron el formulario/ruta de login, el login de aspirantes y el portal documental de aspirantes; `/login`, `/login/aspirante` y `/aspirante/*` ya no tienen rutas propias y caen en el fallback hacia `/`.
- Se eliminó la acción de cerrar sesión del sidebar y del contexto de autenticación. El inicio de sesión institucional continúa resolviéndose automáticamente mediante el API Gateway/IDP al montar la aplicación.
- Las respuestas HTTP 401 limpian la copia local obsoleta de la sesión, pero la SPA ya no redirige a una pantalla de login interna. Los 403 se reportan sin invalidar la sesión.

### 2026-08-16 — Sesión institucional desde API Gateway/IDP

- Se eliminó la sesión ADMIN mock y el formulario SAPP de usuario/contraseña.
- El primer montaje llama a `POST /auth/login` sin payload, bloquea el ruteo mientras inicializa y llena la sesión con la respuesta real.
- La sesión conserva `uuid`, `attributes`, roles generales y `clientRoles`; para autorización UI se usa la unión normalizada y sin duplicados de ambos arreglos.
- Un fallo de inicialización limpia cualquier sesión obsoleta; desde 2026-08-17 ya no existe una pantalla interna de login o reintento.

### 2026-06-17 — URL backend relativa y proxy local

- Se centralizó la base de API en `VITE_API_URL`, con valor default `/api/sapp`.
- Se configuró proxy local de Vite para reenviar `/api/sapp/*` a `VITE_DEV_PROXY_TARGET` y remover el prefijo cuando el target es localhost.
- Los servicios siguen usando el cliente HTTP centralizado; este normaliza rutas heredadas `/sapp/*` y rutas ya migradas `/api/sapp/*` para evitar duplicar prefijos.

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

- Base URL frontend: `VITE_API_URL || VITE_API_BASE_URL || /api/sapp`.
- Local: el navegador llama `/api/sapp/...` y Vite reenvía al backend definido por `VITE_DEV_PROXY_TARGET`.
- Dev/prod: el navegador llama rutas relativas `/api/sapp/...`; la infraestructura debe enrutar ese prefijo al backend.
- Prefijo backend histórico observado: rutas tipo `/sapp/...`; el cliente centralizado evita duplicar ese segmento cuando `VITE_API_URL` termina en `/sapp`.
- Programas: `GET /api/sapp/programaAcademico` desde el navegador.
- Aspirantes: `POST /api/sapp/aspirante` desde el navegador.
- Inscripciones por convocatoria: `GET /api/sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` desde el navegador.
- Documentos: operaciones de checklist/prefetch y validación mediante servicios de documentos existentes.
- Login institucional: `POST /api/sapp/auth/login`, sin body, envelope `{ ok, message, data }`. `data` contiene `{ id, uuid, username, firstName, lastName, fullName, email, attributes: Record<string, string[]>, roles: string[], clientRoles: string[] }`. `id` es el identificador local de `personas_idp`, distinto de `uuid`.

## Notas visuales de marca

- Mantener compatibilidad con tokens CSS globales y modo claro/oscuro.
- Evitar colores hardcodeados en componentes nuevos cuando exista token semántico equivalente.
- Los logos institucionales agregados en `public/brand` son SVG ligeros y no requieren imports desde TypeScript.
