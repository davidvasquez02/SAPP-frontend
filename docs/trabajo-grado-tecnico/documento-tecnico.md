# SAPP: diseño e implementación técnica

**Revisión: 10 de octubre de 2026, America/Bogota.** Base para el capítulo de diseño e implementación del trabajo de grado. Describe las cuatro copias locales indicadas por el usuario; no certifica la versión desplegada.

## Criterio de evidencia

**Implementado** significa que se encontró código o configuración que realiza la función; no implica ejecución de extremo a extremo. **Inferido** identifica una interpretación técnica. **Pendiente** requiere infraestructura o confirmación de los autores. E01–E22 remiten a [referencias verificables](referencias.md), con hashes en [evidencias.json](evidencias.json).

Se inspeccionaron pantallas, servicios HTTP, controladores, servicios Java, repositorios, entidades, SQL, pruebas y configuración. Las directrices de AGENTS.md se distinguen del código efectivo. Esta revisión sustituye el borrador del 9 de octubre: el backend actual incorpora funciones ausentes en aquella descripción y ahora se incluye el backend público. No se modificaron código de aplicación, configuración ni datos.

## 1. Visión general

SAPP apoya la gestión de trámites de posgrados de la Escuela de Ingeniería de Sistemas e Informática de la UIS. La interfaz también utiliza la denominación Minerva Posgrados. Organiza información, soportes, revisiones y decisiones, y conserva datos para seguir el avance de los trámites. Complementa los sistemas institucionales: calcular una liquidación o exportar un soporte no acredita recaudo de pagos, contabilización ni matrícula oficial automática en los sistemas de la universidad. [E01, E10, E15](referencias.md#e01)

### Componentes encontrados antes de redactar

| Identificador | Proyecto inspeccionado | Responsabilidad |
|---|---|---|
| F | SAPP-frontend | SPA institucional para estudiantes y personal de posgrados |
| P | SAPP-frontend-public, en la ruta anidada indicada | Portal de aspirantes y evaluación de jurados por enlace |
| B | back - v2/sapp-backend | API institucional, reglas académicas, persistencia, reportes y tareas de correo |
| U | sapp-public-backend | API pública de aspirantes y evaluadores; productor de eventos de correo |
| Datos | B/src/sapp.sql y B/src/main/resources/db | SQL de referencia y migraciones de distintas etapas del modelo |
| Operación | Dockerfiles, nginx.conf y .gitlab-ci.yml | Construcción y configuración parcial del despliegue |

Las rutas absolutas figuran en el manifiesto. No se mezclaron otras copias de backend con las rutas solicitadas. [E01, E03–E04, E12, E14, E16–E19](referencias.md#e01)

### Actores, módulos e integraciones

La SPA reconoce COORDINADOR_POSGRADOS, SECRETARIA_POSGRADOS, ADMIN_POSGRADOS, DOCENTE_POSGRADOS, DIRECTOR y ESTUDIANTE_POSGRADOS. ROLES_GESTION_POSGRADOS agrupa los tres primeros. Algunas acciones tienen condiciones adicionales; esa agrupación no prueba igualdad absoluta de permisos. Comité y consejo aparecen como instancias del proceso, sin un rol técnico COMITE independiente corroborado. Aspirantes y jurados externos utilizan el portal público. [E01–E04, E09, E14](referencias.md#e01)

| Área | Responsabilidad implementada | Evidencia |
|---|---|---|
| Admisiones | Convocatorias, inscripción, documentos, ponderaciones y evaluación | E06–E07, E10 |
| Matrícula académica | Ventanas, asignaturas, radicación y revisión | E08, E10 |
| Matrícula financiera | Procesos, tarifas, respuestas, ajustes, cierre, publicación y exportación | E15 |
| Solicitudes | Registro, homologación, remisión a instancias y resolución | E09–E10 |
| Créditos condonables | Detalle de solicitud, documentos y circuito de firmas | E09, E11 |
| Trabajos de grado/candidatura | Jurados, invitaciones, conceptos, ajustes, sustentación y resultado | E14–E15 |
| Gestión transversal | Actas, estudiantes, reportes, fechas, docentes, grupos y plantillas | E01, E08–E13, E15 |

El backend principal consulta el directorio IAM para identidad y datos de personas. El correo admite IAM o SMTP. El público consulta un directorio local y registra eventos para el consumidor de correo. Estas integraciones no demuestran sincronización general con todos los sistemas UIS. [E04, E07, E13–E14](referencias.md#e04)

## 2. Arquitectura general

**Interpretación:** sistema web cliente-servidor con dos SPA, dos aplicaciones Java y persistencia PostgreSQL. Los módulos del backend principal se empaquetan dentro de una aplicación Spring Boot; el público tiene su propio arranque y artefacto. Ambos utilizan tablas comunes de admisión, documentos y evaluación; U escribe en evento_correo y B procesa sus avisos. No hay evidencia de autonomía de datos por servicio, por lo que no se clasifica como microservicios solamente por tener dos backends. [E03–E04, E07, E12–E15](referencias.md#e03)

Los navegadores envían HTTP/JSON y reciben JSON o archivos. La base habitual del cliente es /api/sapp; Java declara rutas como /inicio o /matriculaAcademica. El prefijo externo depende del proxy/gateway, y no aparece una convención general /api/v1. El portal público utiliza la misma base relativa en su propio contexto: el enrutamiento externo debe distinguir qué backend atiende cada portal. [E02–E03, E06, E08–E09, E16–E19](referencias.md#e02)

El acceso institucional espera identidad autenticada aguas arriba. InfrastructureHeadersFilter valida X-Internal-Token y obtiene el sujeto para consultar IAM. Las pantallas de contraseña, cookies, reglas del gateway y protocolo completo de federación no están en estos proyectos; no se afirma un flujo OIDC/SAML específico basándose solo en nombres de configuración. [E04](referencias.md#e04)

La **separación lógica** corresponde a componentes, servicios, repositorios y módulos del código. La **separación física prevista** se observa en Dockerfiles independientes. Esto no permite inferir el número de servidores, réplicas ni máquinas reales. Un paquete Java no constituye un servidor y un contenedor no acredita un nodo dedicado. [E05, E16–E19](referencias.md#e05)

## 3. Tecnologías y versiones verificables

Versiones frontend tomadas de los lockfiles; versiones Java, de los POM. Las dependencias transitivas no resueltas no se presentan como versiones instaladas.

| Tecnología | Versión comprobable | Función y evidencia |
|---|---|---|
| React / React DOM institucional | 19.2.3 | Componentes y montaje; E01 |
| React Router DOM institucional | 7.11.0 | Navegación; E01–E02 |
| TypeScript institucional | 5.9.3 | Tipos y compilación; E01 |
| Vite institucional | alias rolldown-vite 7.2.5 | Desarrollo y empaquetado; E01, E16 |
| Plugin React SWC / ESLint institucional | 4.2.2 / 9.39.2 | Transformación y análisis estático; E01 |
| React / React DOM público | 19.2.7 | Interfaz pública; E03 |
| TypeScript / Vite público | 6.0.3 / 8.0.16 | Compilación del portal; E03 |
| Plugin React / React Compiler público | 6.0.2 / 1.0.0 | Plugins activados en Vite; E03, E17 |
| ESLint público | 9.39.4 | Análisis estático; E03 |
| fetch, Hooks y Context | APIs del navegador/React | Transporte y estado; E02–E03 |
| lucide-react institucional | dependencia local file:vendor/lucide-react | Iconos; no equivale a versión npm pública; E01 |
| Java | objetivo 21 en ambos | Ejecución Java; E04, E14 |
| Spring Boot | 4.0.0 en ambos | Web MVC, JPA, validación y operación; E04, E14 |
| Spring Cloud BOM | 2025.1.0 en ambos | Gestión de dependencias, OpenFeign; E04, E14 |
| MapStruct / Lombok | 1.5.5.Final / 1.18.34 | Conversión y generación de métodos; E04, E14 |
| JJWT | 0.12.6 en B; 0.11.5 declarada en U | B verifica JWT interno; jurados en U usan token opaco, no JWT; E04, E14 |
| springdoc OpenAPI | 3.0.1 en ambos | Documentación HTTP; E04, E14 |
| OpenHTMLToPDF / Apache POI | 1.0.10 / 5.5.1 en B | PDF y hojas de cálculo; E04, E15 |
| PostgreSQL | motor confirmado; versión efectiva pendiente | JDBC, SQL, integridad y JSONB; E12–E14 |
| Thymeleaf / Spring Data JPA | gestionadas por Spring Boot | Plantillas, repositorios y ORM; E04–E05, E13 |
| Maven Wrapper | 3.9.11 | Distribución fijada en ambos; E18–E19 |
| nginx / Temurin | nginx:alpine / eclipse-temurin:21-jre | Imágenes declaradas; sin digest ni versión exacta nginx; E16–E19 |
| GitLab CI | plantillas v5.0.0 | Build, push y despliegue delegado; E16–E19 |

Entorno local medido: Node 24.11.0, npm 11.6.1 y Java 17.0.2 en PATH. Java 17 no satisface el objetivo 21. Se reutilizaron node_modules y lockfiles; no se instalaron dependencias ni se crearon entornos. [Verificación](verificacion.md)

## 4. Organización interna del backend

Los paquetes principales son web, domain y persistence. web contiene controladores, clientes, filtros, configuración y planificadores; domain agrupa servicios, DTO, mappers, excepciones y contratos de repositorio; persistence contiene entidades JPA, interfaces Spring Data, proyecciones y adaptadores. El público mantiene una organización semejante con menor alcance. [E04–E05, E07, E14](referencias.md#e04)

Un recorrido concreto es MatriculaAcademicaController → MatriculaAcademicaService → MatriculaAcademicaRepository → MatriculaAcademicaRepositoryImpl → MatriculaAcademicaJPARepository. Los servicios aplican condiciones del proceso y los adaptadores acceden a datos. Se usan consultas derivadas, JPQL y SQL nativo; el outbox utiliza SQL específico de PostgreSQL y U actualiza solicitudes/historial mediante EntityManager. [E05, E08, E13–E14](referencias.md#e05)

La interpretación defendible es **organización por capas con interfaces de repositorio**. No se acredita arquitectura limpia estricta: los servicios conocen entidades JPA, EntityManager y anotaciones Spring. Spring MVC es el framework web del servidor; ello no convierte las vistas React en plantillas MVC del backend. [E05, E08–E09](referencias.md#e05)

Los DTO separan contratos HTTP y entidades. Jakarta Validation y grupos OnCreate/OnUpdate se activan en determinados controladores. MapStruct convierte datos; AuthService compone parte de la respuesta manualmente. Hay excepciones: DocumentoContoller.save no declara @Valid/@Validated, aunque DocumentoRequest tiene restricciones y el servicio efectúa validaciones propias. [E04–E06, E08–E11](referencias.md#e04)

@Transactional delimita aspirante/inscripción, matrícula/asignaturas, solicitud/detalles y contenido/metadatos documentales. El público también agrupa una transición y su evento de correo en una transacción. La atomicidad de PostgreSQL no se extiende automáticamente a IAM ni al envío de correo externo. [E06–E09, E11, E13](referencias.md#e06)

FlujoSolicitudResolver elige implementaciones de FlujoSolicitudAcademica, con FlujoGenerico como respaldo: es evidencia concreta de selección de estrategias de comportamiento. El servicio todavía conserva ramas para homologación y crédito; no toda regla está separada en estrategias. [E09](referencias.md#e09)

### API y errores

La envoltura frecuente es { ok, message, data }. Conviven recursos y comandos como PUT /solicitudesAcademicas/cambioEstado/{id}. Algunos listados usan Pageable y otros devuelven listas completas; no existe evidencia de paginación de servidor universal. [E05–E09](referencias.md#e05)

GlobalExceptionHandler devuelve 400 para entradas inválidas, 404 para recursos no encontrados, 403 para acceso denegado y 409 para conflictos específicos. Ciertos errores de Feign preservan 4xx y otros se traducen a 502. IllegalStateException se transforma en 401 incluso cuando expresa una precondición académica. El error general incluye ex.getMessage en el 500. Esto limita la consistencia HTTP y la separación entre diagnóstico y mensaje de usuario. [E05](referencias.md#e05)

## 5. Organización interna del frontend

El institucional combina src/app, src/pages, src/modules, src/components, src/api y src/shared. Las páginas orquestan interacción; módulos/servicios encapsulan contratos y parte de las reglas de presentación. main.tsx monta BrowserRouter y AuthProvider. Estado y formularios usan Context y hooks. Axios, Redux, Zustand, React Query y react-hook-form no aparecen como dependencias directas del proyecto. [E01–E02, E10](referencias.md#e01)

ProtectedRoute exige sesión de aplicación; RequireRoles y otros guards limitan navegación. El menú filtra opciones y el detalle de solicitud comprueba condiciones del estudiante. Son controles de interfaz; no impiden llamadas HTTP directas. [E01–E02, E10, E20](referencias.md#e01)

Los servicios encapsulan fetch, normalización de rutas, JSON, errores y descargas Blob. HttpError conserva status/data; los 401 borran sesión cuando corresponde. Coexisten clientes y formatos: Java puede colocar errores de validación en data y el cliente compartido busca errors para concatenar mensajes por campo. [E02, E05, E10](referencias.md#e02)

DocumentUploadCard, componentes de layout, utilidades de archivos y tokens globales favorecen reutilización. Los estilos implementan light/dark; esto no acredita una auditoría de accesibilidad completa. [E20](referencias.md#e20)

El portal público distingue /evaluacion/{token} mediante window.location.pathname. Para el resto, muestra login o documentos del aspirante según Context. No declara React Router. Sus servicios de jurado llaman a /evaluacion/{token}/... sin Bearer institucional. [E03](referencias.md#e03)

## 6. Base de datos, integridad y trazabilidad

El modelo PostgreSQL relaciona programas, periodos, aspirantes, convocatorias, inscripciones, estudiantes, matrículas y solicitudes. Documentos y documentos_contenido separan metadatos y base64; existen catálogos de estados, trámites y evaluación. [E08–E09, E11–E12, E14–E15](referencias.md#e08)

**Identidad actual:** UsuarioSapp contiene id local e idp_id UUID del IAM. Estudiante referencia usuarios_sapp por usuario_id y programa por programa_id. migration_merge_personas_idp.sql incorpora UUID y elimina personas_idp. El nombre PersonaIdpService persiste como servicio y no demuestra una entidad vigente. AuthService devuelve usuarioSapp.id. [E04, E12](referencias.md#e04)

migration_estudiantes_unique_usuario_programa.sql sustituye la unicidad por usuario por UNIQUE(usuario_id, programa_id), permitiendo una fila de estudiante por programa para la misma persona. Difiere de las reglas históricas del AGENTS.md; esta revisión no modifica constraints. Su aplicación en producción queda pendiente. [E12](referencias.md#e12)

| Mecanismo | Integridad o seguimiento observable |
|---|---|
| Programa/periodo | Convocatorias y ventanas de trámites |
| Estudiante/periodo | Validación de matrícula duplicada y constraint SQL de referencia |
| Matrícula/asignaturas | Estados, revisor y fecha de revisión |
| Solicitud | Estado, registro, resolución, acta y motivo de rechazo |
| HistorialEstadoSolicitud | Estado anterior/nuevo, fecha, origen, detalle y usuario/acta cuando disponibles |
| Documentos | Asociación a contenido, revisión, versión o secuencia |
| AccesoEvaluador | Hash único, expiración, revocación y registro de uso |
| Evaluación de jurado | Momento y reglas para evitar repetirlo |
| EventoCorreo | JSONB, estado, intentos, error y fechas |

documentos.tramite_id es un identificador genérico, no una FK a cada tabla de trámite. La bitácora de solicitudes es real, pero no constituye una auditoría exhaustiva e inmutable de todas las operaciones. [E09, E11–E14](referencias.md#e09)

Coexisten Date, LocalDate y LocalDateTime, con usos explícitos de America/Bogota. No se acredita almacenamiento universal UTC/timestamptz. En U, registrarUso aplica Colombia y esUtilizable compara expiración con LocalDateTime.now() sin zona explícita; su consistencia depende de la configuración horaria. [E08–E09, E14](referencias.md#e08)

Los SQL representan distintas etapas y no deben ejecutarse como instalador ordenado. No se encontró Flyway en los POM y ddl-auto=none desactiva la evolución automática por Hibernate. Una migración menciona sapp-liquibase-manager; ese repositorio no estaba en las rutas inspeccionadas. Hay semillas parciales de catálogos/tarifas y SQL de pruebas, pero no un seed integral confirmado. [E12, E18–E19](referencias.md#e12)

## 7. Autenticación y autorización

### Sesión institucional

1. AuthProvider consulta GET /inicio.
2. InfrastructureHeadersFilter exige X-Internal-Token, verifica firma HMAC con JJWT y rechaza ausencia/error con 401.
3. AuthService consulta IAM por el sujeto.
4. Exige UsuarioSapp local y un rol SAPP permitido entre roles/clientRoles.
5. Devuelve identidad, roles y bloques académicos; el ID superior es usuarios_sapp.id.
6. La UI guarda sesión; NO_TOKEN es un marcador filtrado por getToken, no un JWT. El cierre dirige a /api/auth/slo/logout. [E02, E04](referencias.md#e02)

El filtro no comprueba explícitamente audiencia, emisor ni permisos de cada operación. SecurityConfig principal está deshabilitada; no se encontró SecurityFilterChain ni @PreAuthorize. Validar roles al resolver /inicio no equivale a validarlos en cada endpoint. Hay controles puntuales: MiLiquidacionService resuelve estudiantes desde el sujeto y rechaza filas ajenas; FirmaDocumentoService compara usuario actual/asignado. No se generalizan al resto de la API. [E04, E11, E15](referencias.md#e04)

### Aspirantes y jurados

El aspirante consulta por inscripción, tipo y número de documento. La UI crea sesión de presentación; las operaciones públicas revisadas aceptan IDs sin una credencial de sesión de aspirante verificada en cada llamada. Comprobar existencia de un aspirante no prueba pertenencia. Cualquier control adicional del gateway requiere su configuración. [E03, E07](referencias.md#e03)

AccesoEvaluadorService genera 32 bytes con SecureRandom, entrega token para el enlace y guarda SHA-256. U busca el hash y verifica vigencia, revocación y jurado activo. Descargar requiere aceptación y entrega el documento asociado al proceso del jurado. El campo propósito no se usa como permiso separado. [E14–E15](referencias.md#e14)

El enlace es una credencial por posesión. RequestLoggingFilter público registra URI/query, por lo que puede registrar el token de la ruta aunque en la tabla se almacene solo su hash. No se publican tokens reales en esta entrega. [E14](referencias.md#e14)

## 8. Tres procesos representativos

Las rutas siguientes son relativas al backend; el navegador añade la base correspondiente.

### 8.1. Registro y gestión de admisión

**Actor y pantallas.** Gestión registra desde la convocatoria y el aspirante completa soportes en AspiranteDocumentosPage. ConvocatoriaDetallePage e InscripcionAdmisionDetallePage organizan revisión y evaluación. [E03, E10](referencias.md#e03)

**Registro.** POST /aspirante en B valida DTO, inscripción duplicada y convocatoria vigente del programa. Crea aspirante/inscripción en una transacción, con estado ENCONST y respuesta inscripcionAdmisionId. Envía plantilla de registro; captura fallo del correo para no abortar por ese motivo. [E06](referencias.md#e06)

**Documentos.** U consulta GET /aspirante/consultaInfo y recibe POST /document. PUT /inscripcionAdmision/cambioEstadoPorVal/{id} pasa ENCONST → PVALDOCS e inserta DOCUMENTOS_LISTOS_REVISION en evento_correo dentro de la misma transacción. Un UPDATE condicionado evita duplicar evento entre peticiones concurrentes. Ese método público no consulta el checklist; su homónimo en B sí verifica documentos obligatorios. Las validaciones no son equivalentes. [E06–E07](referencias.md#e06)

**Evaluación.** B revisa documentos y usa PUT /inscripcionAdmision/cambioEstadoVal/{id} para VALDOCS. POST /evaluacionAdmision/iniciarEvaluacion/{id} exige ese estado y pasa a EVAL. PUT /evaluacionAdmision/registroPuntaje guarda puntajes con control del máximo. La finalización comprueba registros y calcula ADMIT/RECHZ según el umbral del programa, conservando datos de resultado. [E06](referencias.md#e06)

**Errores, permisos y avisos.** cambioEstadoValDoc principal captura excepciones y solo las registra; el controlador puede anunciar éxito sin completar el cambio. La UI muestra errores de carga/consulta, pero no se acredita autorización pública por propietario. Se corroboran correo de registro y aviso de documentos; no se supone notificación de todos los estados. [E06–E07, E10](referencias.md#e06)

### 8.2. Matrícula académica y revisión documental

**Actor y pantallas.** El estudiante usa MatriculaPage y gestión revisa en MatriculaDetalleCoordinacionPage. GET /matriculaAcademica/vigente/estudiante/{estudianteId} devuelve matrícula existente o información de periodo/posibilidad de crear. B implementa MatriculaVigenteEstadoResponse(periodoId, puedeCrear), compatible con esa necesidad del cliente. La incompatibilidad booleana del borrador antiguo ya no describe esta versión. [E08, E10](referencias.md#e08)

**Creación.** POST /matriculaAcademica comprueba ventana MATRICULA, estudiante/periodo existentes, inexistencia de matrícula duplicada y asignaturas válidas sin duplicados. Guarda PENDIENTE_DOCUMENTOS y detalles SELECCIONADA en una transacción. [E08](referencias.md#e08)

**Radicación y revisión de archivos.** PUT /matriculaAcademica/{id} pasa a RADICADA desde el estado permitido; repetir en RADICADA devuelve el registro. Este método no consulta el checklist. POST /{id}/notificarDocumentosCompletos sí exige obligatorios cargados; POST /{id}/finalizarRevisionDocumentos exige completitud y ausencia de pendientes para comunicar el resultado. El resultado documental no cambia por sí mismo el estado de las asignaturas. [E08, E11](referencias.md#e08)

**Revisión académica.** PUT /{id}/validarAsignaturas normaliza APROBADA/RECHAZADA a MATRICULADA/NO_MATRICULADA. Impide revisar PENDIENTE_DOCUMENTOS. Según las decisiones, la cabecera queda RADICADA, EN_REVISION o FINALIZADA, con fecha/revisor. [E08](referencias.md#e08)

**Avisos y límites.** POST /matriculaAcademica/notificarAperturaMatricula?periodoId=... notifica a estudiantes activos y contabiliza enviados/omitidos. Es envío en línea sin reintentos del outbox. Guards limitan pantallas, pero no se encontró control uniforme del propietario en estas operaciones. Radicar directamente puede omitir la comprobación documental de la UI. [E08, E10](referencias.md#e08)

### 8.3. Creación y resolución de homologación

**Actor y entrada.** El estudiante utiliza SolicitudEstudianteForm; gestión consulta bandeja y SolicitudDetallePage. POST /solicitudesAcademicas valida tipo, detalle obligatorio de homologación, asignatura destino y referencias. [E09–E10](referencias.md#e09)

**Persistencia.** Guarda solicitud/detalles en transacción. El flujo genérico utiliza la sigla ENVIADA (constante Java ENVIADA_COMITE), registra la entrada inicial del historial y genera aviso de solicitud pendiente de gestión. Otros tipos tienen firmas o jurados y no deben representarse con este mismo flujo. [E09, E13](referencias.md#e09)

**Resolución.** PUT /solicitudesAcademicas/cambioEstado/{id} recibe siglaEstado y actaId, enviarConsejo, observaciones cuando corresponden. El método de entrada acepta APROBADA o RECHAZADA; rechazar exige observaciones y persiste motivoRechazo. Homologación aprobada registra historial de asignaturas homologadas. Si viene actaId debe existir, pero B no exige acta en toda aprobación. [E09–E10](referencias.md#e09)

**Trazabilidad.** Conserva estado anterior/nuevo, detalle y fecha; fechaResolucion se asigna en estados finales. GET /solicitudesAcademicas/{id}/historial permite consultar la bitácora. No se presume correo de resolución de homologación solo porque otros flujos notifiquen. [E09, E13](referencias.md#e09)

**Errores/permisos.** Se rechazan datos incompletos y referencias inexistentes. La separación de pantallas no prueba control uniforme de rol/propiedad en Java. Aceptar únicamente dos destinos de entrada tampoco demuestra una matriz exhaustiva de transiciones desde cada estado anterior. [E04, E09–E10](referencias.md#e04)

## 9. Gestión documental y notificaciones

### Archivos

POST /document recibe JSON con tipoDocumentoTramiteId, tramiteId, cargador declarado, nombre, contenidoBase64, mimeType, tamanoBytes y checksum. DocumentosContenidoService guarda contenido/metadatos en una transacción. B informa a ProcesoEvaluacionTgService cuando una carga puede corresponder a una corrección. [E11](referencias.md#e11)

Documentos normales incrementan versión y reemplazan el anterior; el tipo genérico usa secuencia y admite varios vigentes. Se asigna POR_REVISAR y fecha. PUT /document exige estado revisable y observaciones al rechazar. Las consultas devuelven metadatos/contenido y el cliente utiliza base64/Blob para visualizar o descargar. [E11, E20](referencias.md#e11)

P valida PDF para documentos y JPG/PNG para fotografía ANX-4, mediante extensión/MIME declarado, e incorpora utilidad SHA-256. No equivale a antivirus, inspección del contenido ni comprobación del checksum en servidor. No se identificó un límite global uniforme de tamaño en los servicios revisados. [E03, E07, E11](referencias.md#e03)

La descarga del jurado está ligada al token y proceso; las rutas genéricas no exhiben el mismo control de pertenencia. La función de firma comprueba asignación, pero no acredita firma digital certificada PKI. [E11, E14](referencias.md#e11)

### Correos y fallos

EmailService delega a EmailSenderClient: IAM por defecto, SMTP mediante email.provider=smtp. Hay plantillas en plantilla_correo con variables, y una plantilla Thymeleaf de ejemplo. El cliente IAM incorpora contexto M2M para envíos sin petición institucional. [E13](referencias.md#e13)

Se corroboran avisos de aspirante, documentos, apertura/revisión de matrícula, firmas, solicitudes pendientes, jurados y liquidación. Conviven envíos sincrónicos y eventos de U en evento_correo. No toda notificación pasa por la cola. [E06–E09, E13–E15](referencias.md#e06)

EventoCorreoScheduler usa fixedDelay=600000 ms. El consumidor reclama hasta 15 eventos, recupera PROCESANDO con reclamo de más de cinco minutos y limita los intentos fallidos a cinco. El repositorio usa FOR UPDATE SKIP LOCKED; conserva PENDIENTE, PROCESANDO, ENVIADO o FALLIDO_DEFINITIVO, error e intentos. [E13](referencias.md#e13)

**Interpretación de entrega:** evitar reclamos simultáneos no garantiza correo exactamente una vez. Un fallo después del envío y antes de marcar ENVIADO puede causar reenvío. La guarda de admisión evita duplicar ciertos eventos, no acredita idempotencia global del proveedor. [E07, E13](referencias.md#e07)

## 10. Despliegue y operación

### Desarrollo y construcción

| Componente | Comandos desde su raíz | Condiciones |
|---|---|---|
| F y P | npm ci; npm run dev; npm run build; npm run preview | npm ci solo para preparar dependencias cuando sea necesario; aquí se reutilizó node_modules |
| B y U | .\mvnw.cmd test; .\mvnw.cmd package; java -jar target/sapp-0.0.1-SNAPSHOT.jar | Java 21, configuración y base apropiadas; no ejecutados en esta revisión |
| B local | .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local | Existe perfil local; no crea IAM/gateway |
| Docker | docker build -t nombre-local . | Frontend requiere dist previo; Java requiere JAR previo |

Vite redirige /api/sapp y elimina el prefijo cuando el destino es local. Los backends esperan 8080 internamente: para ejecutarlos juntos hay que asignar puertos distintos y dirigir cada frontend a su API. secure:false pertenece al proxy de desarrollo y no demuestra política TLS de producción. [E16–E19](referencias.md#e16)

Claves frontend: VITE_API_URL, VITE_API_BASE_URL y VITE_DEV_PROXY_TARGET. El backend requiere datasource y configuración IAM/correo según proveedor; también usa URLs de portales, cron y opciones de diagnóstico. Los valores sensibles se omiten. Para detalles, consultar las claves de application.properties y perfil local sin copiar credenciales. [E02–E03, E16–E19](referencias.md#e02)

### Configuración por componente (solo nombres)

| Área | Variables verificadas |
|---|---|
| Frontends | VITE_API_URL, VITE_API_BASE_URL, VITE_DEV_PROXY_TARGET |
| PostgreSQL, ambos backends | POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD |
| Pool, ambos | DB_POOL_MAX_SIZE, DB_POOL_MIN_IDLE, DB_POOL_IDLE_TIMEOUT_MS |
| CORS | CORS_ALLOWED_ORIGIN_PATTERNS_PRIVADO en B; CORS_ALLOWED_ORIGIN_PATTERNS_PUBLICO en U |
| Identidad, B | CLIENT_ID_SAPP, CLIENT_SECRET_SAPP, GW_INTERNAL_SECRET_SAPP, IAM_CUENTA_GENERICA_UUID |
| Portales y tareas, B | PORTAL_ASPIRANTES_URL, PORTAL_PRIVADO_URL, SOLICITUDES_RECORDATORIO_CRON, JURADOS_VENCIMIENTO_CRON |
| Correo, B | EMAIL_PROVIDER, EMAIL_COPIA_PERSONAL_HABILITADA, EMAIL_TRAMPA_HABILITADA, EMAIL_TRAMPA_DESTINATARIO |
| SMTP, B | SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD |

La tabla muestra claves, nunca valores. Tener una opción de configuración no certifica que esté activa en producción. [E02–E03, E18–E19](referencias.md#e02)

### Producción declarada

Los Dockerfiles frontend copian dist a nginx:alpine. nginx resuelve rutas SPA con index.html; P contempla explícitamente /evaluacion/. Los Java copian JAR a Temurin 21 JRE y exponen 8080. [E16–E19](referencias.md#e16)

Los pipelines incluyen plantillas externas v5.0.0 para build/push/trigger, con node:24-alpine y Maven/Temurin 21. Hay redes de aplicación declaradas. No se inspeccionaron las plantillas externas ni infraestructura completa: proxy/gateway, TLS, base efectiva, backups, volúmenes, réplicas y estado de pipelines quedan pendientes. [E16–E19](referencias.md#e16)

### Diagnóstico

Existen filtros de peticiones con X-Request-Id, logs estructurados configurables, Actuator y OpenAPI. B declara health, info, env, beans y mappings en Actuator y feign.ssl.disable-verification=true. Falta confirmar overrides, accesibilidad y protección reales. Los logs pueden contener rutas, parámetros o cuerpos; su sanitización es una revisión pendiente concreta. [E14, E18–E19](referencias.md#e14)

## 11. Calidad y limitaciones

Se identificaron 53 archivos frontend de prueba, 70 clases de prueba de B y una clase de contexto de U. Son cantidades de archivos, no cobertura. La suite frontend principal del 10 de octubre terminó **168/168 PASS**. TypeScript pasó dentro del build; Vite falló al cargar configuración con spawn EPERM y un error de carga de SWC nativo. ESLint reportó **9 errores y 1 advertencia**. Los logs y límites están en [verificacion.md](verificacion.md). [E20–E22](referencias.md#e20)

Hay pruebas de lógica, inspección textual de componentes, servicios con HTTP simulado, rutas SSR y servicios/controladores/filtros Java con simulaciones. La prueba de tests/integration no forma parte de las 168. No se ejecutaron recorridos con IAM/base/correo reales ni pruebas Java; Java 17 en PATH no satisface el objetivo 21. [E20–E22](referencias.md#e20)

La mantenibilidad se apoya en DTO/mappers, interfaces de repositorio, estrategias, componentes compartidos y servicios especializados. Permanecen métodos extensos, IDs de catálogos fijados en código, contratos/errores heterogéneos y validaciones distintas entre B y U. No se atribuyen alta disponibilidad, rendimiento, escalabilidad ni cobertura cuantificada. [E05–E15, E20](referencias.md#e05)

**Mejoras futuras propuestas; no implementadas en esta revisión:**

- Completar autorización por rol/objeto y probar rechazos entre usuarios distintos.
- Unificar validaciones documentales y comprobar archivos en servidor.
- Excluir credenciales/documentos de logs y revisar TLS/Actuator.
- Consolidar migraciones y semillas con la fuente oficial de esquema.
- Uniformar errores y evitar mensajes internos en respuestas.
- Probar duplicados/fallos de correo y documentar la garantía de entrega.
- Añadir integración del portal público y recorridos entre los cuatro componentes.
- Uniformar zona horaria y pruebas de expiración de enlaces.

Las confirmaciones concretas figuran en [informacion-pendiente.md](informacion-pendiente.md). Los beneficios descritos son interpretaciones técnicas salvo cuando se identifica una justificación en el propio código.
