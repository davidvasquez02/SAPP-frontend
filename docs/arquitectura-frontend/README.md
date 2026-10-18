# Arquitectura y patrones del frontend para la sustentación

Revisión del código: 18 de octubre de 2026. Alcance: SPA institucional de este repositorio. El portal público pertenece a otro proyecto.

## Material para las diapositivas

- `SAPP-arquitectura-y-patrones-frontend.pptx`: dos láminas editables, con el formato 16:9, Calibri, paleta y elementos institucionales de las láminas 13 y 14 del borrador 4 entregado por el usuario.
- `arquitectura-frontend.png` y `patrones-frontend.png`: vistas para insertar como imágenes.
- [01-arquitectura-frontend.mmd](01-arquitectura-frontend.mmd): fuente Mermaid de la vista lógica.

Ubicación sugerida: después de «Herramientas y tecnologías», actual diapositiva 14. Al integrarlas, conservar el formato de origen y actualizar el índice y la numeración del archivo principal. El PPTX original no se modificó. Las notas de cada lámina contienen el guion y las referencias al código.

## Descripción defendible

**SPA modular con separación de responsabilidades y una organización híbrida por dominio y carpetas compartidas.** React compone la interfaz. React Router organiza la navegación. Los servicios encapsulan operaciones de la API y los mapeadores adaptan datos externos. Context comparte la sesión. Los hooks reutilizan comportamiento de interacción.

Conviven `src/pages`, `src/api` y `src/components` con `src/modules`. La vista representa responsabilidades predominantes, no una arquitectura estricta ni una secuencia obligatoria de llamadas. Existen dos clientes HTTP (`src/shared/http/httpClient.ts` y `src/api/httpClient.ts`) y algunos servicios usan `fetch` directamente, por ejemplo matrícula financiera. El nombre histórico `MockService` tampoco demuestra por sí solo que un servicio use datos simulados: revisar su implementación antes de describirlo.

Versiones exactas verificadas en `package-lock.json`: React y React DOM **19.2.3**, React Router DOM **7.11.0**, TypeScript **5.9.3**, Vite mediante el alias `rolldown-vite` **7.2.5**. Estas versiones prevalecen para describir la implementación frente al ejemplo genérico React 18 del instructivo.

## Patrones y evidencia

| Patrón o decisión | Aplicación observable | Evidencia |
| --- | --- | --- |
| Organización modular y separación de responsabilidades | Rutas, interfaz, servicios y utilidades repartidos por trámite y carpetas compartidas | [Rutas](../../src/app/routes/index.tsx), `src/modules`, `src/pages`, `src/api` |
| Composición de componentes | `Layout` combina `Sidebar`, `Outlet` y `SignatureReminder`; los módulos reutilizan componentes documentales | [Layout](../../src/components/Layout/Layout.tsx), [DocumentUploadCard](../../src/components/DocumentUploadCard/DocumentUploadCard.tsx) |
| Provider / Context | `AuthProvider` ofrece sesión, usuario y acciones; `useAuth` permite consumirlos | [AuthProvider](../../src/context/Auth/AuthContext.tsx), [Context](../../src/context/Auth/context.ts), [useAuth](../../src/context/Auth/useAuth.ts) |
| Servicios de API | Funciones por trámite encapsulan endpoints, filtros y respuestas tipadas | [Solicitudes académicas](../../src/modules/solicitudes/api/solicitudesAcademicasService.ts), [HTTP compartido](../../src/shared/http/httpClient.ts) |
| Adapter / Mapper | Funciones transforman DTOs externos en la sesión o en elementos documentales de la interfaz | [authMappers](../../src/api/authMappers.ts), [Mapeadores documentales](../../src/modules/admisiones/api/tramiteDocumentoMappers.ts) |
| Hooks personalizados | `useConsulta` reúne carga, errores, cancelación y recarga; `useOperacion` bloquea operaciones simultáneas y expone su resultado | [hooks de matrícula financiera](../../src/modules/matricula-financiera/hooks.ts) |
| Guardas de navegación | `ProtectedRoute` exige sesión y `RequireRoles` decide si renderiza los hijos o redirige | [ProtectedRoute](../../src/app/routes/protectedRoute.tsx), [RequireRoles](../../src/routes/RequireRoles/RequireRoles.tsx) |
| Caché en memoria | Un `Map` conserva fotos al cambiar entre listado y detalle | [Caché de fotos](../../src/modules/estudiantes/services/estudianteFotoCache.ts) |

La organización modular y los servicios son decisiones de arquitectura. Composición, Provider/Context y hooks son patrones de React. La etiqueta Adapter/Mapper describe una adaptación funcional de DTOs, sin afirmar una implementación de clases del catálogo GoF. No agrupar toda la lista como patrones GoF.

## Guion breve

**Arquitectura:** «El frontend es una aplicación de una sola página organizada alrededor de los trámites de posgrado. Las rutas y el layout organizan la navegación. Las páginas y componentes implementan cada trámite y consultan servicios de API. Los clientes HTTP encapsulan parte de la comunicación con el backend. La sesión, los componentes comunes y el tema visual apoyan a los módulos de forma transversal».

**Patrones:** «Usamos composición para construir la interfaz con piezas reutilizables. Provider y Context comparten la sesión. Los servicios agrupan las operaciones de cada trámite y los mapeadores adaptan las respuestas externas. Los hooks personalizados reúnen comportamiento repetido, como cargar datos o controlar el envío de una operación».

## Precisiones para preguntas del jurado

- Las guardas del navegador organizan el acceso a la interfaz. El backend debe comprobar los permisos de cada operación.
- La autenticación institucional ocurre aguas arriba. `AuthProvider` resuelve la sesión mediante `loginFromGateway`. `NO_TOKEN` es un marcador del cliente y `getToken` no lo envía como credencial Bearer.
- La base URL predeterminada es `/api/sapp`, configurable por `VITE_API_URL` o `VITE_API_BASE_URL`. No reemplazar los contratos observados por el prefijo genérico `/api/v1` del instructivo.
- No afirmar MVC o MVVM estricto, microfrontends, Redux, Zustand, Axios o React Query como implementaciones de este repositorio.
- Context actualiza a sus consumidores, pero ello no acredita una implementación propia del patrón Observer con suscripciones explícitas.
- Estos materiales complementan los [diagramas técnicos del sistema completo](../trabajo-grado-tecnico/diagramas.md).

## Validación y reproducción

El PPTX tiene dos láminas con texto, formas y conectores editables. Se validaron estructura, dimensiones, tipografía y reimportación con Artifact Tool. Las vistas de ambas láminas se revisaron visualmente. No se verificó el renderizado en PowerPoint nativo.

Este cambio solo añade documentación y artefactos de presentación. Se revisa el diff sin ejecutar `npm test`, cobertura o build del aplicativo, conforme a la excepción documental de `AGENTS.md`. No se crearon pruebas ni se alteraron fuentes de `src`, dependencias o contratos.

La creación reutilizó Node 24.19.0 y Python del runtime de Codex con `@oai/artifact-tool`. No requiere instalar herramientas en el frontend, crear entornos Python ni modificar `node_modules`. La fuente de autoría y el recibo de validación quedan en la carpeta privada de esta conversación, documentada en `HANDOFF.md`.
