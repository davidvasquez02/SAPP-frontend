# Revisión de paridad de roles — 2026-09-29

## Resultado y alcance

La equivalencia ADMIN_POSGRADOS = SECRETARIA_POSGRADOS = COORDINADOR_POSGRADOS está implementada parcialmente. Los tres perfiles individuales reciben los mismos diez módulos de navegación, pero no todas las acciones ni bandejas son equivalentes. Esta entrega es una auditoría: no modifica permisos ni lógica funcional.

Se revisaron autenticación y normalización de roles, navegación de inicio/sidebar, todas las declaraciones de rutas, condiciones de rol en páginas y componentes, servicios implicados y pruebas existentes. No hay código Java de backend en este repositorio. No se ejecutaron operaciones institucionales ni sesiones reales de los tres perfiles; las conclusiones sobre interfaz provienen del código y las comprobaciones locales, no de una validación integral contra el servidor.

## Cobertura por módulo

| Módulo | Situación de los tres perfiles individuales |
| --- | --- |
| Admisiones | Rutas de gestión, creación, documentos, finalización y tratamiento administrativo de evaluaciones compartidos; excepción: Ver evaluadores. |
| Matrícula académica | Gestión y detalle usan canManagePosgrados; misma capacidad por rol. |
| Matrícula financiera | Vista administrativa compartida; procesos, tarifas y liquidaciones protegidos con ROLES_GESTION_POSGRADOS. |
| Solicitudes | Gestión del detalle compartida; bandejas diferentes y problema de ocultamiento de asignadas. |
| Proyectos de grado / candidatura | Gestión del proceso compartida; recordatorios masivos exclusivos de coordinación y bandejas diferentes. |
| Créditos condonables | Rutas y gestión del detalle compartidas. Firma depende del responsable y del estado. |
| Estudiantes | Listado y detalle protegidos con los tres roles. |
| Informes a dependencias | Ruta protegida con los tres roles. |
| Actas | Ruta protegida con los tres roles. |
| Fechas / períodos | Rutas protegidas con los tres roles. |
| Gestión profesores | Ruta protegida con los tres roles. |
| Perfil | Capacidad administrativa identificada mediante canManagePosgrados. |

Matrícula académica y financiera son dos opciones de un mismo módulo del menú; por eso el resultado de navegación es diez módulos.

## Hallazgos y ajustes necesarios

### 1. Ver evaluadores excluye a admin y secretaría (P2)

`src/pages/ConvocatoriaDetalle/ConvocatoriaDetallePage.tsx:90` calcula canViewEvaluadores únicamente con ROLES.COORDINACION. Admin y secretaría entran a la convocatoria y pueden crear aspirantes, pero no disponen del botón Ver evaluadores (línea 397).

Ajuste: usar canManagePosgrados para esta capacidad. Verificar autorización equivalente en GET /sapp/evaluadorConvocatoria/convocatoria/{convocatoriaId}. Actualizar tests/evaluadoresConvocatoriaDetalle.test.ts, que actualmente exige exclusividad de coordinación.

### 2. Recordatorios masivos de candidatura excluyen a admin y secretaría (P2)

`src/pages/TrabajosGrado/TrabajosGradoPage.tsx:26` separa isCoordinador de isCoordinacion y la línea 63 utiliza el primero para montar RecordatoriosCandidatura. Los otros dos perfiles no pueden iniciar esta acción desde tesis doctoral.

Ajuste: aplicar canManagePosgrados, manteniendo las condiciones del período vigente, notificación previa y confirmación del envío. Verificar POST /solicitudesAcademicas/recordatorio-candidatura en backend. Actualizar tests/recordatoriosCandidatura.test.ts, que documenta la restricción anterior. La auditoría no envió correos.

### 3. Solicitudes asignadas pueden desaparecer para coordinación (P1)

`src/pages/Solicitudes/SolicitudesPage.tsx:44` y `src/pages/TrabajosGrado/TrabajosGradoPage.tsx:74` pasan hideAssignedList=true solo al coordinador. Admin y secretaría conservan la sección de asignadas.

En `src/modules/solicitudes/components/SolicitudesCoordinadorView/SolicitudesCoordinadorView.tsx:175`, availableRows elimina SIEMPRE los identificadores de assignedRows del listado general, aunque la sección asignada se oculte en la línea 205. Si una solicitud aparece tanto en el listado general como en las asignadas del coordinador, no se muestra en ninguna sección.

Ajuste: definir una presentación común a los tres roles. Si se conserva una única bandeja, incluir allí las asignadas cuando hideAssignedList=true. No basta con extender hideAssignedList a los tres: eso propagaría el defecto. Probar la intersección de listados, filtros, paginación y acceso al detalle.

### 4. DIRECTOR adicional recorta capacidades administrativas (P1)

`src/app/navigationItems.ts:32` identifica DIRECTOR sin excluir perfiles de gestión. Las líneas 41 y 51 ocultan Matrícula y Proyectos de grado a cualquier usuario con ese rol, incluso admin, secretaría o coordinador. Comprobación local: pasan de diez a ocho módulos.

`src/pages/Solicitudes/SolicitudesPage.tsx:43` también activa assignedOnly para cualquier DIRECTOR: deja de consultar/presentar la bandeja general. Si además es coordinador, hideAssignedList=true puede ocultar ambas secciones.

Ajuste: priorizar gestión; tratar como director limitado solo a quien no tenga canManagePosgrados. Aplicar la misma política a menú, inicio, bandejas y filtros de tipos. Probar cada perfil de gestión combinado con DIRECTOR y DOCENTE_POSGRADOS.

### 5. ESTUDIANTE adicional desplaza la vista administrativa (P2)

`src/pages/Solicitudes/SolicitudesPage.tsx:34` y `src/pages/TrabajosGrado/TrabajosGradoPage.tsx:65` eligen primero la vista de estudiante. TrabajosGradoPage también limita el nivel navegable al programa del estudiante (líneas 37–40), aunque muestra los enlaces administrativos de ambos niveles.

Ajuste: dar prioridad a gestión o establecer un selector explícito de contexto. La matrícula académica ya prioriza canManageMatriculas; el detalle de solicitud ya evita aplicar la restricción de propiedad estudiantil a gestores. Revisar también acciones estudiantiles del detalle para mantener una política consistente.

## Contratos y comprobaciones pendientes en servidor

- `src/auth/roleGuards.ts` contiene el grupo correcto de tres roles y canManagePosgrados. La solución debe reutilizarlo sin agregar artificialmente el rol coordinador a otros usuarios.
- `src/api/authMappers.ts:25`: clientRoles no vacío es la fuente autoritativa; roles solo es respaldo. Un ADMIN presente únicamente en roles no concede gestión si clientRoles contiene otros valores. Confirmar la respuesta real de /inicio y la configuración del cliente en el proveedor de identidad; no fusionar roles globales automáticamente.
- `src/modules/auth/roles/roleUtils.ts`: funcionan ADMIN, ADMIN_SAPP, SECRETARIA y COORDINADOR, además de nombres canónicos. COORDINACION y valores ROLE_* no se traducen. Esto es un riesgo condicionado al contrato real del gateway, no una falla probada en producción.
- Las firmas se autorizan por asignación personal y estado, no por ser coordinador: `src/modules/solicitudes/utils/firmaSolicitud.ts` y `src/pages/SolicitudDetalle/SolicitudDetallePage.tsx:269`. La misma regla ya aplica a los tres. Si se pretende que admin/secretaría sustituyan al coordinador como firmantes, debe definirse delegación/asignación en el flujo del backend conservando identidad y trazabilidad.
- Validar en backend filtros por programa, autorizaciones de lectura/escritura, asignaciones, estados y correspondencia de user.id con el identificador esperado por los endpoints. La interfaz utiliza dto.id para user.id; esta auditoría no puede confirmar su semántica con datos reales.
- Ocultar botones no garantiza seguridad. Algunas rutas compartidas solo exigen sesión y delegan en la página o el servidor; no se demuestra una vulnerabilidad del backend por esa diferencia.

## Validación y plan de cierre

- `node --test --test-isolation=none tests/*.test.ts tests/*.test.mjs`: 162/162 PASS; cero fallos.
- Subconjunto de navegación, evaluadores, recordatorios, autorización del detalle y firma: 21/21 PASS.
- Comprobación ejecutable de funciones reales, transpiladas en memoria con TypeScript ES2022: los tres roles canónicos y cuatro alias tienen navegación idéntica (10 módulos); cada perfil + DIRECTOR muestra 8. Un primer intento del comprobador usó el target ES5 predeterminado, incompatible con la iteración de Set sin downlevelIteration; se corrigió el comprobador, sin cambiar la aplicación.
- Las pruebas existentes incluyen verificaciones textuales de código. Su aprobación no acredita paridad funcional: dos protegen explícitamente exclusiones que contradicen el requisito nuevo.
- Siguiente implementación: corregir primero la pérdida de asignadas y precedencia de roles; después unificar las dos acciones exclusivas y las bandejas; añadir pruebas de comportamiento parametrizadas para roles individuales/mixtos y actualizar las expectativas anteriores.
- Cierre integral: probar con tres sesiones institucionales, mismos programas y estados, acceso directo por URL y acciones equivalentes; comprobar respuestas HTTP y persistencia. En pruebas negativas, docente/estudiante sin rol de gestión deben seguir limitados. Los envíos y firmas requieren fixtures o un entorno de pruebas adecuado.
- Entorno reutilizado: Windows/PowerShell, Node 24.11.0, npm 11.6.1, React/DOM 19.2.3, React Router DOM 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5, ESLint 9.39.2. No se instalaron dependencias ni se crearon entornos, seeds, credenciales o datos institucionales.
