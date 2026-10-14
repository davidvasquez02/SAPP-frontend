# Información pendiente de confirmación

**10 de octubre de 2026.** La documentación continúa con lo verificable. Estas preguntas delimitan aquello que el código no permite certificar; no solicitan secretos ni datos personales.

| Prioridad | Pregunta concreta | Por qué sigue pendiente | Evidencia |
|---|---|---|---|
| Alta | ¿Qué commits de los cuatro proyectos corresponden a la versión del trabajo de grado y cuáles están desplegados? | Las rutas locales fueron indicadas expresamente, pero no prueban la versión de producción. | E01, E03–E04, E14 |
| Alta | ¿Cuál es el repositorio oficial del esquema y puede compartirse el changelog de sapp-liquibase-manager y el listado de migraciones aplicadas? | Se encontraron scripts manuales y una referencia a ese gestor, pero no su proyecto ni el estado de la base. | E12 |
| Alta | ¿Están aplicadas la fusión de personas_idp y la unicidad de estudiante por usuario/programa? | Las entidades y migraciones actuales difieren de las instrucciones históricas AGENTS.md. | E04, E12 |
| Alta | ¿Qué operaciones protege el gateway por rol y propietario, y qué controles adicionales existen en Java? | El login valida roles y hay controles puntuales, pero no una política uniforme comprobada para toda la API. | E04, E11, E15 |
| Alta | ¿Cómo se acredita en cada operación pública que quien modifica un aspirante o carga un documento es su titular? | La consulta inicial utiliza inscripción/documento; las operaciones posteriores aceptan IDs sin sesión verificable encontrada en esos métodos. | E03, E07 |
| Alta | ¿Cuál es la regla oficial de completitud antes de pasar una inscripción a revisión o radicar matrícula? | El principal comprueba checklist para admisión, el público no en su transición leída; radicar matrícula tampoco lo consulta. | E06–E08 |
| Alta | ¿Qué requisitos de acta y transiciones aplican realmente a cada tipo de solicitud? | El servidor permite acta opcional y el motor general no demuestra una matriz exhaustiva de estados. No se deduce conformidad reglamentaria solo del código. | E09 |
| Alta | ¿El gateway/proxy y los logs ocultan tokens de evaluación, parámetros personales y contenido documental? | El filtro público registra URI/query y puede capturar el token del enlace. | E14, E18–E19 |
| Media | ¿Qué zona horaria usan JVM, PostgreSQL y las columnas de expiración? | Conviven Date, LocalDateTime y conversiones a Colombia; algunas comparaciones utilizan zona por defecto. | E08–E09, E14 |
| Media | ¿Qué validación de formato real, límite de tamaño y análisis de archivos se aplica en servidor o infraestructura? | Extensión/MIME del cliente y checksum declarado no demuestran inspección del contenido ni antivirus. | E03, E07, E11 |
| Media | ¿Se requiere idempotencia de entrega de correos y cómo se trata un envío exitoso seguido de fallo al marcar el evento? | El outbox controla reclamo/reintentos, pero no garantiza envío exactamente una vez. | E07, E13 |
| Media | ¿Qué proveedor de correo y qué opciones de prueba/copia están activas en cada ambiente? | Las ramas IAM/SMTP y opciones existen; los valores efectivos del despliegue no están certificados. | E13, E18 |
| Media | ¿Dónde se alojan componentes, base, gateway y TLS; qué backups, restauraciones y réplicas hay? | Dockerfiles y triggers describen artefactos, no la topología ni su estado operativo. | E16–E19 |
| Media | ¿Producción sobrescribe feign.ssl.disable-verification y limita Actuator/logs? | La configuración común contiene valores que necesitan contrastarse con la configuración efectiva. | E18 |
| Media | ¿Qué versiones exactas de PostgreSQL, imágenes por digest y dependencias Maven resueltas se despliegan? | POM, tags y wrapper no prueban versiones efectivas del servidor. | E04, E14, E16–E19 |
| Media | ¿Qué recorridos de aceptación se probaron con IAM, base y correo, en qué fechas y con qué resultados? | Las 168 pruebas de esta revisión no representan una prueba integral; no hay medición de cobertura o carga. | E20–E22, verificacion.md |
| Media | ¿Qué integraciones existen con los sistemas académicos/financieros UIS y qué permanece manual? | Calcular/exportar y mostrar textos institucionales no acreditan sincronización ni recaudo. | E10, E15 |
| Baja | ¿Qué alternativas tecnológicas evaluaron los autores y qué resultados de uso midieron? | Los beneficios arquitectónicos pueden interpretarse, pero no se debe inventar motivación histórica, adopción o ahorro de tiempo. | Documento técnico |

Para resolver estos puntos bastan contratos, diagramas de infraestructura sanitizados, esquema sin registros personales, commits y resultados de pruebas sin credenciales. No es necesario compartir contraseñas, claves, tokens de jurados ni documentos de estudiantes.

Las conclusiones antiguas sobre ausencia de matrícula financiera, historiales, plantillas o backend de jurados **ya no se mantienen**: la versión analizada contiene esas implementaciones. También se corrigieron la identidad de /inicio, el contrato de matrícula vigente y la persistencia del rechazo.
