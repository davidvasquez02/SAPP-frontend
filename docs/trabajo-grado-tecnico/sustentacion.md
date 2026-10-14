# Material técnico para la sustentación de SAPP

**10 de octubre de 2026.** Propuesta textual de ocho diapositivas, notas de exposición, guion de aproximadamente cinco minutos y doce respuestas para el jurado. Basada en los cuatro proyectos locales y en [referencias.md](referencias.md). No es un archivo PowerPoint.

## Propuesta de ocho diapositivas

### Diapositiva 1. Propósito de SAPP

**Contenido visible**

- Apoyo a trámites de posgrados EISI–UIS.
- Información, soportes y decisiones asociados a cada proceso.
- Usuarios internos, aspirantes y evaluadores externos.
- Complementa los sistemas institucionales.

**Visual sugerido:** diagrama de contexto, sin listar tecnologías todavía.

**Notas del expositor:** SAPP reúne funciones de admisión, matrícula, solicitudes y trabajos de grado. Su contribución verificable consiste en organizar la gestión y conservar información del proceso. La liquidación calcula y exporta soportes; no se debe describir como plataforma de recaudo ni atribuirle sincronización con todos los sistemas UIS. Evidencia: E01, E06–E10, E15.

### Diapositiva 2. Componentes del sistema

**Contenido visible**

- SPA institucional y portal público en React.
- Backend principal y backend público en Spring Boot.
- Persistencia PostgreSQL con tablas compartidas.
- Integración externa con identidad y correo.

**Visual sugerido:** 02-componentes.mmd.

**Notas del expositor:** Las dos interfaces atienden formas de acceso diferentes. El backend principal reúne la gestión académica; el público atiende aspirantes y jurados. Se comunican indirectamente mediante datos compartidos y eventos de correo. La descripción es cliente-servidor con componentes separados. Dos aplicaciones Java no bastan para afirmar microservicios, especialmente cuando comparten tablas. Evidencia: E03–E05, E07, E13–E15.

### Diapositiva 3. Organización del código

**Contenido visible**

- Frontend: páginas, componentes, módulos y servicios HTTP.
- Backend: web, domain y persistence.
- DTO y mappers para intercambiar información.
- Servicios para validaciones y cambios de estado.

**Visual sugerido:** recorrido Controller → Service → Repository → PostgreSQL.

**Notas del expositor:** En matrícula, el controlador recibe HTTP, el servicio verifica periodo, duplicados y asignaturas, y los repositorios persisten. Esta separación facilita localizar responsabilidades. Hay interfaces y estrategias de flujo, pero los servicios también dependen de Spring y JPA, por lo que no presento una arquitectura limpia estricta. En React se usan Context y hooks; no se atribuye Redux o Axios porque aparezcan en una guía genérica. Evidencia: E01–E02, E05, E08–E09.

### Diapositiva 4. Modelo de datos y trazabilidad

**Contenido visible**

- UsuarioSapp vincula el ID local con el UUID del IAM.
- Estudiante se relaciona con usuario y programa.
- Solicitudes conservan estado, resolución e historial.
- Documentos separan metadatos y contenido.

**Visual sugerido:** subconjunto de 04-entidades.mmd.

**Notas del expositor:** El modelo actual incorpora idp_id en usuarios_sapp; la migración elimina la antigua personas_idp. Otra migración permite una fila de estudiante por usuario y programa. En solicitudes se registra estado anterior/nuevo, origen, fecha y detalle. Esa bitácora facilita seguimiento, pero no demuestra auditoría completa e inmutable de todo el sistema. El esquema realmente aplicado aún requiere confirmación. Evidencia: E09, E11–E12.

### Diapositiva 5. Identidad y acceso

**Contenido visible**

- Institucional: gateway, token interno e IAM.
- Aspirante: consulta por datos de inscripción.
- Jurado: enlace temporal asociado a su evaluación.
- Los permisos de interfaz necesitan respaldo del servidor.

**Visual sugerido:** 05-secuencia-inicio.mmd, simplificado si se proyecta.

**Notas del expositor:** El frontend solicita /inicio; el servidor verifica firma del token, consulta IAM y exige registro local y rol admitido. El portal del jurado usa un token opaco cuyo hash se conserva en base, con expiración/revocación y descarga ligada al proceso. Los accesos no tienen controles idénticos. Se encontraron comprobaciones de propietario en liquidación personal y firmante asignado, pero no una política uniforme en todos los endpoints. Evidencia: E02, E04, E07, E11, E14–E15.

### Diapositiva 6. Recorrido de una homologación

**Contenido visible**

- Estudiante registra solicitud y asignaturas.
- Servicio valida y guarda solicitud/detalles.
- Gestión registra aprobación o rechazo.
- Resolución e historial quedan consultables.

**Visual sugerido:** 06-secuencia-homologacion.mmd.

**Notas del expositor:** El estado inicial almacenado es ENVIADA, correspondiente a la constante ENVIADA_COMITE. El endpoint de decisión admite APROBADA o RECHAZADA. Rechazar exige observaciones; aprobar homologación genera historial de asignaturas homologadas. El acta se asocia si se suministra y es válida, pero el servicio no la exige en toda aprobación. Otros tipos requieren firmas o jurados, por lo que este recorrido no representa todos los trámites. Evidencia: E09–E10, E13.

### Diapositiva 7. Documentos y avisos

**Contenido visible**

- Archivos base64 y metadatos en PostgreSQL.
- Versiones, secuencias y revisión documental.
- Avisos directos y eventos en evento_correo.
- Consumidor con estados, intentos y registro de fallos.

**Visual sugerido:** productor público → evento_correo → consumidor principal → IAM/SMTP.

**Notas del expositor:** Contenido y metadatos se guardan mediante una transacción. El evento de correo público puede persistir en la misma transacción que el cambio del trámite, para que el backend principal lo procese después. Se encontraron lotes de 15 y hasta cinco intentos fallidos. Esto no garantiza envío exactamente una vez: puede repetirse si el proveedor recibió el correo y el consumidor falló antes de registrar éxito. Los envíos directos no tienen esa misma recuperación. Evidencia: E07, E11, E13–E14.

### Diapositiva 8. Despliegue y validación

**Contenido visible**

- Artefactos frontend en nginx; Java en Temurin 21.
- GitLab CI delega construcción y despliegue.
- 168 pruebas frontend aprobadas en esta revisión.
- Integración real y configuración de producción por confirmar.

**Visual sugerido:** 03-despliegue.mmd.

**Notas del expositor:** Los Dockerfiles y pipelines describen la preparación del despliegue, pero no prueban número de máquinas, réplicas o disponibilidad. La suite principal pasó; ESLint reporta nueve errores y una advertencia. TypeScript pasó y Vite falló al cargar configuración/SWC en este entorno. No se ejecutó Java: el PATH tiene 17 y los proyectos requieren 21. No se afirman cobertura total o validación con IAM real. Evidencia: E16–E22 y verificacion.md.

## Guion de arquitectura: aproximadamente cinco minutos

Orientación: unas 650 palabras, con pausas para señalar los diagramas. El tiempo real debe medirse en ensayo; no se presenta como cronometraje ejecutado.

### 0:00–0:40 — Propósito

SAPP es una aplicación de apoyo para los trámites de posgrados de la Escuela de Ingeniería de Sistemas e Informática. Su alcance comprende admisiones, matrícula, solicitudes, créditos y procesos de trabajo de grado. La aplicación organiza los datos y documentos de cada trámite y permite consultar decisiones y avances. Complementa los sistemas institucionales: por ejemplo, calcular valores de matrícula y exportar soportes no significa recaudar el pago ni actualizar automáticamente todos los registros de la universidad.

### 0:40–1:30 — Componentes

La solución tiene cuatro componentes de aplicación. Hay un frontend institucional y un portal público, ambos construidos con React, además de un backend principal y uno público en Spring Boot. El institucional atiende estudiantes y personal de posgrados; el público permite continuar la documentación de aspirantes y participar como jurado mediante un enlace.

Los frontends se comunican con las API mediante HTTP. Los backends utilizan PostgreSQL y comparten tablas del proceso académico. También existe una tabla de eventos de correo que conecta al productor público con el consumidor del backend principal. Por esa dependencia de datos compartidos, la explicación defendible es una aplicación cliente-servidor con componentes separados; no es necesario clasificarla como microservicios.

### 1:30–2:15 — Organización interna

Dentro del frontend se separan páginas, componentes reutilizables y servicios que realizan peticiones. El estado de sesión utiliza Context y hooks. En Java hay tres grupos principales: web, domain y persistence. Los controladores reciben las peticiones, los servicios aplican reglas y los repositorios realizan la persistencia.

En matrícula, por ejemplo, el servicio verifica que exista una ventana habilitada, que el estudiante no tenga otra matrícula para ese periodo y que las asignaturas no estén duplicadas. La cabecera y los detalles se guardan dentro de una transacción. Esta división ayuda a ubicar la lógica y a probar servicios con repositorios simulados.

### 2:15–3:05 — Datos y trazabilidad

La identidad local está representada por UsuarioSapp, con un identificador propio y el UUID del IAM. El estudiante se relaciona con ese usuario y con su programa. Las solicitudes conservan el estado actual y una bitácora de cambios. En una homologación, la aprobación registra además el historial de asignaturas homologadas; un rechazo conserva su motivo.

Los documentos separan metadatos y contenido base64 en tablas relacionadas. Hay versiones para reemplazos y secuencias para documentos genéricos. Esas estructuras permiten consultar soportes y decisiones, aunque no equivalen a una auditoría inmutable de cada acción del sistema.

### 3:05–4:00 — Identidad y notificaciones

Para la sesión institucional, el gateway debe aportar un token interno. El backend verifica su firma, consulta el directorio IAM y exige un usuario local con un rol admitido. El portal del jurado utiliza otro mecanismo: un enlace temporal cuyo token se valida mediante su hash, vigencia y revocación. La descarga queda asociada al trabajo de ese jurado.

La autorización debe evaluarse operación por operación. Ocultar opciones en React no impide llamadas directas a la API. Se encontraron controles de pertenencia en funciones concretas, pero no una política uniforme de permisos en todos los endpoints.

Para los avisos, hay envíos directos y una cola en base de datos. El consumidor registra estados y reintentos. No se afirma entrega exactamente una vez, porque un fallo después del envío puede causar una repetición.

### 4:00–5:00 — Despliegue y evidencia

Los frontends generan archivos estáticos que se sirven con nginx. Los backends producen archivos JAR para Java 21. Los pipelines de GitLab delegan construcción y despliegue a plantillas externas; la ubicación física, TLS, backups y réplicas requieren información adicional.

La revisión ejecutó 168 pruebas frontend, todas aprobadas. También identificó errores existentes de lint y un fallo de empaquetado en este entorno; no se presenta como una validación completa de producción. Los siguientes puntos técnicos por confirmar son el esquema aplicado, las reglas del gateway y las pruebas integrales entre portales, API, identidad y correo. Cada conclusión del análisis tiene referencias a archivos para que pueda verificarse y discutirse durante la sustentación.

## Doce preguntas del jurado con respuestas

### 1. ¿Qué arquitectura tiene el sistema?

Cliente-servidor, con dos interfaces SPA, dos aplicaciones Spring Boot y persistencia PostgreSQL. Internamente Java organiza responsabilidades en web, domain y persistence. Esa descripción se apoya en código y artefactos. No se afirma arquitectura limpia estricta porque los servicios conocen Spring/JPA. [E01–E05, E14](referencias.md#e01)

### 2. ¿Son microservicios?

No hay evidencia suficiente para defender esa clasificación. Los dos backends son artefactos separados, pero comparten tablas de trámites y el outbox. Separación de despliegue no equivale a autonomía de datos y dominio. [E07, E12–E15](referencias.md#e07)

### 3. ¿Por qué React y Spring Boot?

Son las tecnologías implementadas y permiten separar presentación y reglas del servidor. React ofrece componentes; Spring integra web, validación y persistencia. Son beneficios técnicos interpretados, no una justificación histórica atribuida a los autores. La decisión original y las alternativas evaluadas requieren confirmación. [E01, E03–E05](referencias.md#e01)

### 4. ¿Cómo entra un usuario institucional?

La SPA consulta /inicio. Un filtro verifica X-Internal-Token; AuthService consulta IAM, exige UsuarioSapp local y un rol permitido. El ID de respuesta es usuarios_sapp.id. Las pantallas de contraseña y la federación completa están fuera de los cuatro repositorios. [E02, E04](referencias.md#e02)

### 5. ¿Los roles del frontend garantizan seguridad?

No. Limitan opciones y navegación, pero un cliente puede enviar HTTP directamente. Existen verificaciones de propietario en MiLiquidacionService y de firmante en FirmaDocumentoService; no se encontró una aplicación uniforme de permisos en toda la API. [E01–E02, E04, E11, E15](referencias.md#e01)

### 6. ¿Cómo accede un jurado sin cuenta institucional?

Mediante un token opaco generado con SecureRandom. Se almacena su hash; el backend público valida vigencia, revocación y jurado activo. Descargar el documento exige aceptar la invitación y se resuelve desde su proceso. El enlace debe tratarse como credencial; su presencia en logs es una limitación pendiente de corregir. [E14–E15](referencias.md#e14)

### 7. ¿Cómo se evita duplicar una matrícula?

El servicio busca una matrícula del mismo estudiante/periodo antes de crearla y el SQL de referencia contempla unicidad. También rechaza asignaturas repetidas. La restricción realmente aplicada debe confirmarse en PostgreSQL, porque leer una migración no demuestra su ejecución. [E08, E12](referencias.md#e08)

### 8. ¿Qué trazabilidad conserva una solicitud?

Estado actual, registro, resolución, motivo de rechazo y registros de historial con estados anterior/nuevo, fecha, origen y detalle. Puede asociar acta y usuario según el flujo. No es evidencia de una auditoría completa e inmutable de toda actividad. [E09, E12](referencias.md#e09)

### 9. ¿Dónde están los archivos y cómo se protegen?

Contenido base64 en documentos_contenido y metadatos en documentos, guardados transaccionalmente. Hay versiones, secuencias y revisión. El jurado tiene descarga acotada por token; las rutas genéricas necesitan confirmar controles de pertenencia y de inspección/tamaño en servidor. [E03, E07, E11, E14](referencias.md#e03)

### 10. ¿Qué ocurre si falla un correo?

Depende del camino. El outbox registra intentos y errores, reintenta y llega a FALLIDO_DEFINITIVO. Hay envíos directos que solo capturan el fallo o lo propagan. No todos los avisos tienen la misma recuperación y no se garantiza correo exactamente una vez. [E06, E08, E13](referencias.md#e06)

### 11. ¿Qué pruebas respaldan la implementación?

Se ejecutaron 168 casos de la suite principal del frontend con éxito. Hay pruebas de lógica, código de componentes y servicios simulados, además de pruebas Java existentes. No se ejecutaron esas pruebas Java ni recorridos completos con IAM/correo/base real; no se afirma porcentaje de cobertura. Lint y build tienen resultados separados. [E20–E22, verificacion.md](referencias.md#e20)

### 12. ¿Está demostrada la escalabilidad y qué se mejoraría primero?

No hay mediciones de carga, réplicas o alta disponibilidad que permitan afirmarlo. Las primeras mejoras propuestas son autorización uniforme, validaciones documentales consistentes, migraciones reproducibles, pruebas de integración y revisión de logs/TLS. Son propuestas futuras, no cambios realizados en este análisis. [E04–E19](referencias.md#e04)

## Conceptos técnicos en lenguaje sencillo

| Concepto | Explicación aplicada a SAPP |
|---|---|
| SPA | La aplicación se carga en el navegador y cambia sus pantallas sin descargar una página completa en cada navegación. |
| Frontend / backend | El frontend presenta e interactúa; el backend recibe operaciones, aplica reglas y accede a datos. |
| API / endpoint | Contrato para pedir una operación; por ejemplo, POST /matriculaAcademica solicita crear una matrícula. |
| DTO | Estructura que define los datos de entrada o salida, distinta de la entidad persistida. |
| Entidad / repositorio | La entidad representa datos relacionados con tablas; el repositorio encapsula consultas y escrituras. |
| ORM / JPA | Mecanismo que vincula objetos Java con datos relacionales; no elimina la necesidad de restricciones SQL. |
| Transacción | Conjunto de cambios en base que se confirma o revierte como unidad. No revierte automáticamente un correo ya enviado. |
| Clave foránea / unicidad | La primera enlaza registros válidos; la segunda impide combinaciones duplicadas. |
| Autenticación / autorización | Identificar quién solicita una operación y decidir si puede realizarla. Son preguntas diferentes. |
| Token / hash | El token permite acceso; su hash es una representación para comprobarlo sin almacenar el valor original en la tabla. |
| Estado / historial | Estado indica la situación actual; historial conserva cambios anteriores con contexto. |
| Outbox | Tabla de tareas pendientes escrita junto con un cambio del negocio, para procesarlas después. |
| Idempotencia | Repetir una operación no duplica su efecto. Debe verificarse por operación, no suponerse para todo el sistema. |
| Migración | Cambio controlado del esquema o catálogos; tener el archivo no significa que esté aplicado. |
| Contenedor / pipeline | El contenedor empaqueta ejecución; el pipeline automatiza pasos de construcción y entrega. |
| Mock / prueba integral | Un mock simula una dependencia; una prueba integral comprueba interacción real entre componentes. |

## Preparación de la exposición

Antes de presentar, confirmar las versiones desplegadas y el esquema aplicado; ensayar el guion con cronómetro y sustituir “aproximadamente” por el tiempo medido. Mantener los límites relevantes en las notas y disponer del documento técnico para profundizar si el jurado pregunta. Evitar afirmar adopción, ahorro de tiempo o mejoras de rendimiento si no se cuenta con mediciones del proyecto.
