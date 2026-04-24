# SAPP Frontend Public (Flujo Aspirante)

Frontend público del sistema SAPP enfocado en el **flujo completo de aspirante**: validación de ingreso, consulta/cargue de documentos y registro de información de investigación.

## Propósito y alcance

Este proyecto (`SAPP-frontend-public/`) ahora implementa como pantalla inicial:

1. **Login de aspirante** por número de inscripción + tipo/número de documento.
2. **Carga de documentos** del checklist de admisiones.
3. **Actualización de información de investigación** (grupo y director).
4. **Cambio de estado de inscripción** a `POR_VAL` cuando el checklist obligatorio queda completo.

> Alcance actual: solo flujo aspirante (sin módulos administrativos internos).

## Arquitectura breve

- **UI**: React + TypeScript.
- **Estado de sesión**: `AuthProvider` + `localStorage` (`SAPP_AUTH_SESSION`).
- **HTTP**: wrapper `fetch` en `src/shared/http/httpClient.ts` con `VITE_API_BASE_URL`.
- **Pantalla inicial**: `AspiranteLoginPage`.
- **Pantalla autenticada**: `AspiranteLayout` + `AspiranteDocumentosPage`.

## Stack y versiones (lockfile)

- Node.js: recomendado `>=18`
- React: `19.2.5`
- React DOM: `19.2.5`
- Vite: `8.0.8`
- TypeScript: `6.0.3`
- ESLint: `9.39.4`
- `@vitejs/plugin-react`: `6.0.1`

## Ejecución local

```bash
cd SAPP-frontend-public
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Variables de entorno

Crear `.env` o `.env.local` en `SAPP-frontend-public/`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

El cliente concatena automáticamente `api` + path (ej. `/sapp/aspirante/consultaInfo`).

## Seeds / datos iniciales

No hay seeds en este frontend. Depende de endpoints disponibles en backend SAPP con datos de aspirantes, checklist y catálogo de documentos/tipos.

## Changelog-lite (decisiones recientes)

- Se reemplazó el template base de Vite por una app enfocada en aspirantes.
- La pantalla de inicio ahora es el login de aspirante.
- Se portó la lógica de:
  - autenticación de aspirante,
  - checklist y cargue de documentos,
  - cálculo de completitud de obligatorios,
  - actualización de investigación,
  - transición de estado de inscripción al completar checklist.
- Se dejó el proyecto original (`/src` raíz del repo) sin cambios funcionales para este flujo.
