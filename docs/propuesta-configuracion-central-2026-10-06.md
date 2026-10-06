# Propuesta: Configuración central de SAPP

Fecha: 2026-10-06. Estado actualizado: el usuario autorizó implementar la reorganización después de esta evaluación. Nombre definitivo: **Administración académica**, con menú interno persistente y rutas bajo `/administracion-academica`. Las rutas antiguas redirigen conservando parámetros, fragmentos y estado. Las recomendaciones de separación funcional de convocatorias siguen pendientes; se conservan los flujos existentes. El resto de este documento registra el planteamiento inicial y sus hallazgos; README/HANDOFF describen la implementación y pruebas actuales.

## Conclusión

Tiene sentido reunir la navegación administrativa en **Configuración**, conservando secciones, servicios y reglas de dominio independientes. El beneficio principal es encontrar las herramientas y reducir duplicidad. La revisión de código no demuestra todavía una mejora de tiempos ni de usabilidad; eso requiere validar el recorrido con usuarios.

## Evidencia del checkout

- Reconsulta del repositorio: `src/app/navigationItems.ts` ahora expone cuatro entradas principales: Fechas, Gestión profesores, Grupos de investigación y Plantillas de correo. Todas usan la visibilidad administrativa derivada de `canManagePosgrados`.
- `src/pages/Home/HomePage.tsx` reutiliza ese catálogo para los accesos de inicio; la reorganización futura debe contemplar ambos lugares.
- `src/auth/roleGuards.ts` y `src/app/routes/index.tsx`: coordinación, secretaría y administración comparten acceso mediante `ROLES_GESTION_POSGRADOS`. Los valores reales son `COORDINADOR_POSGRADOS`, `SECRETARIA_POSGRADOS` y `ADMIN_POSGRADOS`. No se verificaron permisos del backend.
- `src/pages/FechasModule/FechasModulePage.tsx`: combina períodos, ventanas de matrícula, creación de convocatorias, edición de fechas y cierre de convocatorias.
- `src/pages/ConvocatoriasAdmisionConfig/ConvocatoriasAdmisionConfigPage.tsx`: también lista convocatorias y utiliza los mismos modales de creación/edición y servicio de cierre. Hay solapamiento de responsabilidades; no implica que toda la lógica esté duplicada.
- `src/pages/GestionProfesores/GestionProfesoresPage.tsx`: ya contiene las vistas `docentes` y `grupos`. Incluye asignar/retirar rol docente de posgrados, vincular/retirar integrantes y asignar director. Estas acciones tienen consecuencias de acceso y participación; no son un catálogo puramente visual.
- La reconsulta confirma `src/pages/PlantillasCorreo/PlantillasCorreoPage.tsx`, `PlantillaCorreoFormPage.tsx` y `src/api/plantillasCorreoService.ts`. Rutas actuales: `/coordinacion/plantillas-correo` y `/coordinacion/plantillas-correo/:plantillaId/editar`, protegidas por `ROLES_GESTION_POSGRADOS`. Esto reemplaza la conclusión de la primera revisión que no encontraba el módulo.
- Grupos también tiene módulo propio en `src/pages/GestionGruposInvestigacion`, con rutas de listado, creación/edición, profesores e instituciones (escuelas/facultades). La vista de grupos permanece accesible desde Gestión profesores: revisar los accesos compartidos al reorganizar, sin asumir que son implementaciones duplicadas.

### Plantillas: alcance confirmado en el frontend

- Listado con búsqueda por nombre/descripción, filtro Español/Inglés y paginación local de 10 registros.
- Edición de nombre, descripción, asunto, idioma y cuerpo HTML; vista previa y extracción/inserción de variables encontradas en asunto/cuerpo. No es un catálogo validado de todas las variables que admite el backend.
- `sigla` identifica la plantilla y no es editable. No hay acciones de creación o eliminación en las páginas/servicio revisados.
- La interfaz indica que encabezado y pie se agregan automáticamente al enviar; la vista previa los representa con marcadores informativos.
- Guardado con confirmación de campos modificados. El botón de prueba se bloquea mientras hay campos en edición o cambios sin guardar; utiliza la versión guardada.
- Contrato consumido: `GET /sapp/plantillasCorreo`, `GET /sapp/plantillasCorreo/{id}`, `PUT /sapp/plantillasCorreo/{id}` y `POST /sapp/plantillasCorreo/{id}/prueba`. La llamada de prueba no envía destinatario desde el frontend; su resolución debe confirmarse en backend.
- Los DTO no incluyen programa, período ni un campo de evento/proceso para filtrar. Reutilizar los filtros reales de búsqueda e idioma.
- Con el menú interno persistente, conservar el editor en una página amplia, con contenido y vista previa en paralelo y apilados en móvil. Evitar encerrar el editor en una tarjeta estrecha. Proponer aviso al salir con cambios: el botón Volver actual navega directamente al listado.

## Estructura propuesta

Un acceso principal **Configuración**, con cuatro destinos navegables:

| Sección | Alcance | Contexto |
| --- | --- | --- |
| Calendario académico | Períodos, fechas de matrícula y fechas de convocatorias | Período; programa solo donde el contrato lo soporte |
| Profesores | Consulta y vinculación a posgrados | Directorio y estado de vinculación |
| Grupos de investigación | Catálogo, creación/edición, integrantes, director e instituciones asociadas | Grupo y sección seleccionados |
| Plantillas de correo | Listado, edición de plantillas existentes, vista previa y envío de prueba | Búsqueda por nombre/descripción e idioma |

Profesores y grupos pueden compartir componentes y servicios, aunque se expongan como dos accesos claros. Mantener las subsecciones propias de Grupos sin promover cada catálogo auxiliar a otra entrada del menú principal.

Propuesta de URLs: `/configuracion`, `/configuracion/calendario`, `/configuracion/profesores`, `/configuracion/grupos-investigacion`, `/configuracion/plantillas-correo`. Son rutas de interfaz propuestas, no endpoints existentes.

Convocatorias necesita una decisión funcional: recomendar una edición canónica de fechas accesible tanto desde Configuración como desde Admisiones; conservar creación, cierre, evaluaciones e inscripciones en el contexto de Admisiones. Una primera etapa puede reutilizar la pantalla actual antes de separar responsabilidades. No duplicar editores ni fuentes de datos.

Mantener Estudiantes, Actas, Informes y trámites como módulos operativos. La firma y preferencias personales siguen en Perfil. No ampliar Configuración a gestión general de usuarios sin un alcance explícito.

## Condiciones que deben preservarse

- Reutilizar los contratos actuales: `/sapp/periodoAcademico`, `/sapp/periodoAcademico/withFechas`, `/sapp/docentes`, `/sapp/gruposInvestigacion`, `/sapp/gruposInvestigacionDocentes` y `/sapp/plantillasCorreo`. Unificar navegación no requiere fusionar tablas ni endpoints.
- `PeriodoAcademicoDto` no incluye programa. No aplicar un selector global de programa/período a todas las secciones ni asumir que cambia el alcance de datos institucionales.
- Revisar la semántica de `TIPO_TRAMITE_ADMISIONES = 2`: actualmente se utiliza para fechas rotuladas como matrícula. Validar contra el catálogo/backend antes de renombrar conceptos o mover campos.
- Acceso del contenedor si el usuario puede entrar a alguna sección; autorización de cada ruta y acción, también en backend. Mantener los perfiles administrativos existentes en la primera etapa.
- Guardado por formulario; feedback y manejo de errores locales. Cambiar de sección no debe perder cambios sin advertencia. Preservar confirmaciones de retiro de roles, cambio de director y cierre.
- Conservar rutas antiguas mediante redirecciones y parámetros como `periodoId`; revisar botones Volver y accesos desde Admisiones.
- Carga independiente por sección para que un fallo en plantillas no bloquee calendario o docentes.
- Mantener tokens UIS/Beer.css, tema claro/oscuro, tarjetas redondeadas, botones pill, foco visible y navegación adaptable. En móvil, reemplazar el menú interno lateral por un selector o navegación que se distribuya sin recorte.

## Alternativas visuales

**Centro con tarjetas:** cuatro accesos descriptivos y una sección seleccionada. Facilita descubrir dónde se configura cada cosa; ocupa más espacio y puede añadir un paso si se implementa como portada independiente.

**Menú interno persistente (recomendado para trabajo frecuente):** sección seleccionada a la izquierda, contenido a la derecha, dentro del módulo Configuración. Permite alternar herramientas sin volver a una portada. Debe simplificarse en móvil y evitar una jerarquía de menús anidados.

La propuesta interactiva inicial de esta conversación muestra ambas variantes. Sus contenidos son ilustrativos; no consulta datos ni guarda cambios. Su rótulo de Plantillas como integración pendiente quedó desactualizado con la reconsulta: el módulo ya existe. El ejemplo visual tampoco define variables reales del backend. No se regeneró ese boceto durante la reconsulta.

## Plan para una futura implementación

1. Cerrar alcance: ubicación canónica de convocatorias y accesos compartidos de profesores/grupos. Plantillas ya está localizada; queda confirmar permisos efectivos, destinatario de pruebas en backend y significado del tipo de trámite 2.
2. Introducir el contenedor y la entrada Configuración, reutilizando pantallas, conservando enlaces antiguos, query params y permisos. Actualizar inicio y menú juntos.
3. Unificar las vistas solapadas de convocatorias y exponer profesores/grupos sin duplicar servicios. Reutilizar listado/editor/servicio de correo y preservar su sigla, variables, confirmación y prueba de la versión guardada. Conservar enlaces profundos de edición de plantillas.
4. Homogeneizar cabeceras, tablas, filtros pertinentes, estados vacíos, guardado y navegación móvil.
5. Verificar acceso directo a rutas, perfiles administrativos y no autorizados, roles combinados, regreso desde Admisiones, conservación de período, aislamiento de errores y cambios sin guardar. Comprobar modo claro/oscuro y teclado. Ejecutar pruebas pertinentes, TypeScript y build cuando haya cambios funcionales.

Aceptación: el usuario encuentra cada herramienta desde Configuración; los enlaces anteriores siguen funcionando; no cambian resultados de negocio ni permisos; cada edición tiene una fuente única; no aparecen filtros sin efecto real.

## Validación de esta tarea

Inspección estática del frontend y sus contratos. Sin ejecución de flujos autenticados ni validación del backend. No se ejecutaron pruebas/build de la aplicación porque solo se elaboró una propuesta documental y visual. No se modificó código funcional, configuración, dependencias, schemas o datos. Los resultados históricos del HANDOFF no corresponden a esta revisión.
