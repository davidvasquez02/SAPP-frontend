# SAPP Frontend

## Purpose & Scope
This repository hosts the React frontend for SAPP (Sistema de Apoyo para la Gestión de Trámites de Posgrados) at EISI–UIS. The UI centralizes workflows such as admisiones, matrícula académica/financiera, solicitudes, exámenes de candidatura, trabajos de grado, and notificaciones.

## Architecture (Brief)
- **Routing:** React Router v7 with protected routes (`src/app/routes/AppRoutes`).
- **Auth state:** Context-based session management (`src/context/Auth`), currently backed by a mock login helper (`src/api/auth.ts`).
- **UI composition:** Page-level views in `src/pages`, shared layout/components in `src/components`, global styles in `src/styles` and scoped CSS modules per feature.
- **App shell:** `src/app/App.tsx` wraps `AppRoutes` with `AuthProvider`.

## Tech Stack (Exact Versions)
- **React:** 19.2.0
- **React DOM:** 19.2.0
- **React Router DOM:** 7.9.2
- **TypeScript:** 5.9.3
- **Vite:** rolldown-vite 7.2.5 (npm alias)
- **@vitejs/plugin-react-swc:** 4.2.2
- **ESLint:** 9.39.1

> Full dependency list: see `package.json`.

## How to Run
```bash
npm install
npm run dev
```

Other useful commands:
```bash
npm run build
npm run preview
npm run lint
```

### Seeds / Mock Data
There are no seed scripts. Authentication is mocked in `src/api/auth.ts`:
- Provide any non-empty username/password.
- Certain usernames map to roles (`secretaria`, `coordinacion`, `comite`, `docente`, `aspirante`, `invitado`).
- Any other username defaults to `ESTUDIANTE`.

## Recent Decisions (Changelog-lite)
- Keep mocked authentication (`loginMock`) to enable UI flow without backend integration.
- Use `rolldown-vite@7.2.5` as the Vite engine via npm alias.
- Centralize routing in `AppRoutes` with a `ProtectedRoute` wrapper for authenticated areas.
