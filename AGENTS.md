---
name: "Modern React Project Template"
description: "A comprehensive development guide for modern frontend projects based on React 18 + TypeScript + Vite, including complete development standards and best practices"
category: "Frontend Framework"
author: "Agents.md Collection"
authorUrl: "https://github.com/gakeez/agents_md_collection"
tags: ["react", "typescript", "vite", "frontend", "spa"]
lastUpdated: "2024-12-19"
---

# Modern React Project Development Guide

## Project Overview

This is a modern frontend project template based on React 18, TypeScript, and Vite. It's suitable for building high-performance Single Page Applications (SPA) with integrated modern development toolchain and best practices.

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand / Redux Toolkit
- **Routing**: React Router v6
- **UI Components**: Ant Design / Material-UI
- **Styling**: Tailwind CSS / Styled-components
- **HTTP Client**: Axios
- **Testing Framework**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier + Husky

## Project Structure

```
react-project/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/         # Reusable components
│   │   ├── common/        # Common components
│   │   └── ui/            # UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom Hooks
│   ├── store/             # State management
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── styles/            # Global styles
│   ├── constants/         # Constants
│   ├── App.tsx
│   └── main.tsx
├── tests/                 # Test files
├── docs/                  # Project documentation
├── .env.example          # Environment variables example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development Guidelines

### Component Development Standards

1. **Function Components First**: Use function components and Hooks
2. **TypeScript Types**: Define interfaces for all props
3. **Component Naming**: Use PascalCase, file name matches component name
4. **Single Responsibility**: Each component handles only one functionality

```tsx
// Example: Button Component
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size = 'medium',
  disabled = false,
  onClick,
  children
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### State Management Standards

Using Zustand for state management:

```tsx
// store/userStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

### API Service Standards

```tsx
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
```

## Environment Setup

### Development Requirements
- Node.js >= 18.0.0
- npm >= 8.0.0 or yarn >= 1.22.0

### Installation Steps
```bash
# 1. Create project
npm create vite@latest my-react-app -- --template react-ts

# 2. Navigate to project directory
cd my-react-app

# 3. Install dependencies
npm install

# 4. Install additional dependencies
npm install zustand react-router-dom axios
npm install -D @types/node

# 5. Start development server
npm run dev
```

### Environment Variables Configuration
```env
# .env.local
VITE_API_URL=http://localhost:3001/api
VITE_APP_TITLE=My React App
VITE_ENABLE_MOCK=false
```

## Routing Configuration

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Testing Strategy

### Unit Testing Example
```tsx
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/components/Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Click me
      </Button>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Performance Optimization

### Code Splitting
```tsx
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

### Memory Optimization
```tsx
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({ ...item, processed: true }));
  }, [data]);

  const handleUpdate = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleUpdate(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
});
```

## Deployment Configuration

### Build Production Version
```bash
npm run build
```

### Vite Configuration Optimization
```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

## Common Issues

### Issue 1: Vite Development Server Slow Startup
**Solution**:
- Check dependency pre-build cache
- Use `npm run dev -- --force` to force rebuild
- Optimize optimizeDeps configuration in vite.config.ts

### Issue 2: TypeScript Type Errors
**Solution**:
- Ensure correct type definition packages are installed
- Check tsconfig.json configuration
- Use `npm run type-check` for type checking

## Reference Resources

- [React Official Documentation](https://react.dev/)
- [Vite Official Documentation](https://vitejs.dev/)
- [TypeScript Official Documentation](https://www.typescriptlang.org/)
- [React Router Documentation](https://reactrouter.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

Este repositorio contiene el sistema de apoyo para la gestión de trámites de posgrados de la Escuela de Ingeniería de Sistemas e Informática (EISI – UIS).  
Stack principal: **Spring Boot (Java)** + **PostgreSQL** + **React (TypeScript)**.

El objetivo del sistema es **centralizar, estandarizar y dar trazabilidad** a procesos de:

- Admisiones
- Matrícula académica
- Matrícula financiera / créditos condonables
- Solicitudes estudiantiles
- Examen de candidatura
- Trabajos de grado
- Notificaciones y configuración de fechas

---

## 1. Arquitectura y principios generales

- **Backend**: Spring Boot, arquitectura por módulos / capas:
  - `domain` (entidades de dominio, servicios de dominio)
  - `application` (casos de uso / servicios de aplicación)
  - `infrastructure` (JPA, controladores REST, integración con IDP, correo, etc.)
- **Base de datos**: PostgreSQL, esquema definido a través de migraciones (`Flyway` o similar) usando el SQL del modelo actual.
- **Frontend**: React + TypeScript, con:
  - React Router para navegación
  - Algún cliente de datos tipo React Query / fetch encapsulado en servicios
- **Principio guía**: **el dominio manda**, no la tecnología. Antes de agregar campos o cambiar lógica, preguntarse:
  > ¿Qué implica esto en términos de reglamento de posgrados / proceso académico?

---

## 2. Dominio y nomenclatura

Usar nombres coherentes con el modelo de datos y el contexto UIS/EISI:

- Programas: `Programa`, `ProgramaService`, `ProgramaController`…
- Periodos: `PeriodoAcademico`
- Personas y usuarios:
  - **IDP**: `PersonasIdp` (`personas_idp`)
  - **Sistema SAPP**: `UsuarioSapp` (`usuarios_sapp`)
- Admisiones: `Aspirante`, `ConvocatoriaAdmision`, `InscripcionAdmision`, `EvaluacionAdmision`
- Matrícula: `MatriculaAcademica`, `MatriculaAsignatura`, `LiquidacionMatricula`
- Créditos: `SolicitudCredito`, `CertificadoContraprestacion`
- Solicitudes: `Solicitud`, `SolicitudHomologacion`, etc.
- Trabajos de grado: `TrabajoGrado`, `EtapaTrabajoGrado`, `SustentacionTrabajoGrado`
- Examen de candidatura: `ExamenCandidatura`

**No inventar terminología** anglófona para conceptos de reglamento (ej. “ThesisExam” → mejor `ExamenCandidatura`).

---

## 3. Reglas clave del modelo de datos (no romper)

Al tocar código que usa la BD:

- Un registro en `estudiantes` está ligado **1:1** a `personas_idp`:
  - Respetar `constraint uq_persona_estudiante unique (persona_id)`
- Un `UsuarioSapp` siempre referencia una `PersonaIdp`.  
  El ID principal del sistema para autenticación/autorización es `usuarios_sapp.id`.
- No eliminar ni modificar constraints de unicidad sin revisar impacto:
  - `uq_periodo` (año + periodo)
  - `uq_convocatoria` (programa + periodo)
  - `uq_matricula_est_per`, `uq_liq_est_per`, `uq_credito_est_per_tipo`
  - `uq_plan_prog_anio`, `uq_plan_asig`
- **Documentos**:
  - Metadatos en `documentos`
  - Contenido base64 en `documentos_contenido`
  - Siempre manipular ambos de forma consistente (transacción / rollback coherente).

---

## 4. Backend (Spring Boot)

### 4.1. Acceso a datos

- Usar **Spring Data JPA** para repositorios.
- Evitar SQL crudo salvo en:
  - migraciones (`Flyway`)
  - consultas muy específicas/problemas de rendimiento.
- No modificar el esquema desde JPA (no usar `ddl-auto=create/update` en entornos serios).

### 4.2. Servicios y casos de uso

- Exponer casos de uso claros por módulo:
  - `AdmisionService`, `MatriculaAcademicaService`, `CreditoCondonableService`, etc.
- Reglas de negocio importantes:
  - Un estudiante solo puede tener **una matrícula académica por periodo**.
  - Una solicitud de crédito por estudiante+periodo+tipo (`uq_credito_est_per_tipo`).
  - El estado de procesos debe seguir flujos válidos (ej. `RADICADA → EN_REVISION → APROBADA / RECHAZADA`).
- Manejar fechas y horas con `OffsetDateTime` / `ZonedDateTime` considerando horario de Colombia.

### 4.3. API REST

- Prefijo: `/api/v1/...`
- Estándar:
  - `GET /api/v1/estudiantes`
  - `POST /api/v1/solicitudes`
  - `PATCH /api/v1/solicitudes/{id}/estado`
- Respuestas:
  - JSON con DTOs, **no exponer entidades JPA crudas**.
  - Incluir `id`, `estado`, timestamps y referencias mínimas (`*_id`) necesarias.
- Manejo de errores:
  - Validaciones → HTTP 400 (`BAD_REQUEST`) con lista de errores.
  - No encontrado → 404.
  - No autorizado / prohibido → 401 / 403.
  - Errores internos → 500, log detallado pero mensaje de usuario genérico.

---

## 5. Frontend (React)

### 5.1. Organización

- Estructura sugerida:
  - `/src/modules/admisiones`
  - `/src/modules/matricula`
  - `/src/modules/creditos`
  - `/src/modules/solicitudes`
  - `/src/modules/trabajos-grado`
  - `/src/shared/components`, `/src/shared/hooks`, `/src/shared/api`
- Cada módulo con:
  - vistas (`pages`),
  - componentes presentacionales (`components`),
  - servicios de API (`api.ts` o `service.ts`).

### 5.2. Buenas prácticas específicas

- Formularios complejos (admisión, matrícula, solicitudes):
  - usar alguna librería tipo `react-hook-form` o similar.
  - Validar tanto en cliente como en servidor (no confiar solo en el frontend).
- Tablas/lists:
  - siempre manejar **paginación** y **filtros básicos** (por programa, periodo, estado).
- Fechas:
  - almacenar en backend en UTC / timestamptz;
  - mostrar siempre en zona horaria de Colombia y formato consistente.

---

## 6. Seguridad, roles y permisos

- Autenticación:
  - El sujeto autenticado se mapea a un `UsuarioSapp` (tabla `usuarios_sapp`).
- Autorización:
  - Roles de `roles` + `usuario_roles`:
    - `ESTUDIANTE`, `ASPIRANTE`, `SECRETARIA`, `COORDINACION`, `COMITE`, `DOCENTE`, `INVITADO`.
  - Controlar acceso en backend con anotaciones (`@PreAuthorize`) basadas en roles.
- Reglas de ejemplo:
  - Estudiante solo ve y modifica **sus propios trámites**.
  - Secretaría/Coordinación pueden ver y gestionar trámites del programa.
  - Comité solo ve lo que va a comité (admisiones, ciertas solicitudes, exámenes, trabajos).

---

## 7. Notificaciones y comunicación

- Las notificaciones deben registrarse en tabla `notificaciones`:
  - `usuario_destino_id`, `canal`, `asunto`, `cuerpo`, `estado`.
- Los envíos de correo deben:
  - ser idempotentes (no duplicar correos si se reintenta),
  - cambiar el `estado` de la notificación adecuadamente (`PENDIENTE`, `ENVIADA`, `ERROR`).

---

## 8. Migraciones y evolución del modelo

- Toda modificación de esquema se hace mediante **migraciones versionadas** (Flyway).
- No borrar columnas/tablas que ya están en producción sin plan de migración de datos.
- Mantener el SQL del modelo **alineado con las entidades JPA**.
- Antes de cambiar una constraint importante, documentar el motivo en la migración.

---

## 9. Testing

- Backend:
  - tests de servicios (unitarios) para reglas de negocio clave:
    - cálculo de liquidaciones,
    - transiciones de estados de solicitudes,
    - validación de admisión (ponderaciones).
  - tests de integración para endpoints críticos de cada módulo.
- Frontend:
  - pruebas de componentes de formularios complejos
  - pruebas de flujo de usuario para:
    - creación de solicitudes,
    - revisión y cambio de estado por parte de secretaría/coordinación.

---

## 10. Trazabilidad

Please update two files based on our recent work and decisions.
README.md — keep a holistic, up-to-date view:
purpose/scope, brief architecture, stack with exact versions,
how to run (commands, seeds), recent decisions (changelog-lite).
HANDOFF.md — for a fresh instance (who will take this conversation when we hit the context limit) to continue smoothly: (remember the new instance has not context about our work or previous conversation) Please add (examples)
current status, open challenges, next steps,
paths/artifacts/datasets, recent test results + logs,
schemas/contracts and expected outputs,
exact environment (venv/conda/poetry), package versions, and notes to avoid creating duplicate envs.

## 11. Cosas que NO hacer

- No exponer directamente datos sensibles de personas (ej: teléfonos, correos) a usuarios que no lo requieren por rol.
- No crear campos “rápidos” en tablas preexistentes sin revisar modelo de datos y migrações.
- No acoplar el frontend directamente a la estructura interna de la BD (usar siempre la API).
- No mezclar lógica de negocios compleja dentro de controladores o componentes React; debe estar en servicios.

---
