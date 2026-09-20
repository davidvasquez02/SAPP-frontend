# Minerva Frontend — EISI UIS

## Decisión reciente — responsive de créditos condonables (2026-09-20)

- `/creditos-condonables` conserva las dos tablas en escritorio y presenta en viewports de hasta 768 CSS px pestañas accesibles de igual ancho para **Pendientes** e **Histórico**. Cada listado conserva de forma independiente sus filtros y página; los contadores corresponden al total real de cada clasificación, no al tamaño de la página.
- En móvil, las solicitudes usan tarjetas propias del módulo con estudiante, código UIS, tipo, estado multilínea, programa, fechas, observaciones expandibles y un enlace explícito al detalle existente. A 350 CSS px o menos, los datos breves pasan de dos columnas a una; los controles mantienen al menos 44 CSS px y los `select` usan 16 px.
- Los filtros siguen usando los datos de `GET /sapp/solicitudesAcademicas`: pendiente filtra por estado; histórico por estado y `estudianteId` exacto. El cambio de pestaña o breakpoint no limpia estado ni dispara una consulta. Se añadieron mensajes diferenciados para colección vacía/sin coincidencias y reintento ante error, sin modificar API, orden o reglas de clasificación.
- Verificación: `npx eslint src/pages/CreditosCondonablesCoordinacion/CreditosCondonablesCoordinacionPage.tsx`, `npm run build` y `git diff --check` pasan. El build generó `dist/assets/index-BKTs4nd7.css` y `index-DpUG42po.js`; persiste el aviso informativo del chunk de 616.27 kB. No fue posible tomar captura ni hacer inspección visual real porque no hay Chromium, Chrome ni Firefox en el contenedor y la ruta protegida depende de sesión/backend institucional.

## Estado funcional (2026-09-20)

- **El tablero de estudiantes de coordinación es responsive y navegable:** `/coordinacion/estudiantes` inicia con el estado **Activo**, mantiene buscador y contador siempre visibles y contrae período/estado detrás de **Filtros** solo en móvil, sin perder valores. Las tarjetas conservan portadas grandes de 220–240 px, fotografía completa o iniciales, ancho calculado desde el tablero para anticipar la siguiente tarjeta y datos compactos sin duplicar el estado en móvil. El tablero mantiene scroll táctil/vertical nativo, snap suave, flechas con límites, teclado y arrastre de mouse protegido contra clics accidentales. Egresados continúa bajo demanda y ofrece un error contextual en español con reintento.
- **Inicio es responsive y accesible:** en móvil, la navegación se presenta como una barra superior compacta y un panel lateral cerrado inicialmente; admite cierre explícito, backdrop y `Escape`, trampa/restauración de foco, bloqueo temporal del scroll y etiquetas multilínea. El encabezado reorganiza usuario, avatar y marcas institucionales sin posiciones absolutas, y los accesos mantienen sus rutas/permisos en una cuadrícula de dos columnas (una a menos de 341 px). En escritorio se conserva la barra contraída con expansión temporal, por lo que no reserva los 260 px ni desplaza el contenido.
- En **Créditos condonables → Histórico de solicitudes**, el filtro de estudiante es un combo desplegable construido con los estudiantes únicos presentes en el resultado histórico de la consulta. Cada opción muestra nombre y código UIS, y selecciona por el identificador del estudiante para evitar coincidencias parciales ambiguas.
- El listado de **Gestión de actas** se puede filtrar por instancia: todas, Comité Asesor de Posgrados o Consejo Académico. El filtro se combina con la búsqueda y el año, y vuelve a la primera página cuando cambia.
- Al aprobar una solicitud desde Comité o Consejo, el detalle consulta `GET /sapp/actas`, muestra únicamente las actas de la instancia anterior y exige seleccionar una antes de confirmar. El cambio de estado incorpora el `actaId` elegido; no se usan identificadores hardcodeados.
- En **Gestión profesores → Grupos de investigación**, la lista de integrantes identifica al único director con una insignia institucional. Los demás integrantes ofrecen **Hacer director**, que ejecuta `PUT /sapp/gruposInvestigacionDocentes/director` y vuelve a consultar el grupo para reflejar el nuevo director sin recargar la página.
- En el detalle de **Créditos condonables**, los perfiles de gestión vuelven a ver **Firmar todos los documentos** cuando el estado indica `POR FIRMA`, incluso al entrar directamente por `/creditos-condonables/:solicitudId`; la acción ya no depende del estado efímero de navegación del módulo Solicitudes.
- En **Solicitudes**, el estado técnico `PFIR_DIR_TG` se presenta según el programa del estudiante: **POR FIRMA DIRECTOR DE TRABAJO INVESTIGACION** para maestría/MISI y **POR FIRMA DIRECTOR DE TESIS** para doctorado/DCC. En creación y renovación de crédito condonable, la modalidad de contraprestación `id: 2` (**EDICIÓN DE REVISTAS CIENTIFICAS**) omite el diligenciamiento y la previsualización, y pasa directamente a adjuntar únicamente archivos PDF.
- **Actas** permite clasificar y cargar documentos del Comité Asesor de Posgrados o del Consejo Académico. El formulario envía `tipoConsejo: false` para comité y `tipoConsejo: true` para consejo, genera respectivamente códigos `ACTA_COMITE_XXX-AAAA` o `ACTA_CONSEJO_XXX-AAAA`, y muestra el tipo institucional en el listado.
- En **Gestión profesores → Grupos de investigación**, al seleccionar un grupo se muestran primero sus integrantes y, debajo, una tabla paginada y filtrable con los profesores de posgrados todavía disponibles. Cada fila permite agregar mediante `POST /sapp/gruposInvestigacionDocentes`; la acción existente para retirar mediante `DELETE` se conserva.
- La creación de convocatorias obtiene los evaluadores desde `GET /sapp/docentes` y solo ofrece profesores con `tieneRolDocentePosgrados: true`. Gestión de profesores separa los usuarios de posgrados de los demás profesores EISI y permite asignar o retirar ese rol; después de cada operación vuelve a consultar el catálogo para actualizar ambos listados.
- Al aprobar una solicitud de tipo **OTRA** (`tipoSolicitudId: 11`), cualquier rol de gestión autorizado debe indicar en un diálogo si requiere aprobación del Consejo Académico. La opción afirmativa añade `enviarConsejo=true` al cambio de estado; la negativa conserva el contrato anterior sin ese parámetro.
- En las solicitudes de crédito condonable y renovación, el lugar de expedición se selecciona con el catálogo DANE suministrado: Santander aparece por defecto, el municipio usa un desplegable filtrable con la misma identidad visual del selector de departamento y el contrato HTTP conserva únicamente el nombre del municipio seleccionado.
- `ADMIN_POSGRADOS`, `SECRETARIA_POSGRADOS` y `COORDINADOR_POSGRADOS` conservan identidades separadas, pero comparten actualmente todos los módulos y acciones de gestión. La equivalencia se define una sola vez en `ROLES_GESTION_POSGRADOS`/`canManagePosgrados`, y se aplica a rutas, navegación y acciones internas para evitar diferencias accidentales.
- Al completar el inicio de sesión, el layout protegido consulta la firma del `UsuarioSapp` autenticado mediante `GET /sapp/firmaUsuario/{usuarioId}`. Si no existe contenido de firma, muestra un recordatorio tipo toast con acceso directo a `/perfil`; los errores de red o autorización no se confunden con una firma faltante.
- El detalle de una inscripción de admisión muestra como **Código de inscripción** el campo `numeroInscripcion` entregado por el API; conserva el identificador `INS-{id}` únicamente como compatibilidad cuando el backend no envía el nuevo valor. Los datos de documento, correo y teléfono se presentan sin emojis.
- La autorización consume los roles funcionales de `clientRoles` en `GET /api/sapp/inicio`: `ADMIN_POSGRADOS`, `COORDINADOR_POSGRADOS`, `SECRETARIA_POSGRADOS`, `ESTUDIANTE_POSGRADOS` y `DOCENTE_POSGRADOS`. La sesión los conserva como valores canónicos; durante la transición también acepta y normaliza los nombres anteriores, incluido `ADMIN_SAPP`. Las etiquetas visibles eliminan el sufijo `_POSGRADOS`.
- Coordinación dispone del módulo exclusivo **Créditos condonables** (`/creditos-condonables`): separa solicitudes y renovaciones pendientes del histórico aprobado/rechazado, con filtros por estado y estudiante. Esos dos tipos dejan de aparecer en **Solicitudes** únicamente para coordinación; los demás roles conservan su flujo anterior.

El acceso de coordinación incluye **Gestión profesores** al final del menú. El módulo consulta el contrato paginado vigente de Minerva, presenta nombre, correo institucional, programa y UUID, y permite administrar la pertenencia de docentes a grupos de investigación. El módulo de estudiantes de coordinación presenta estudiantes activos/inactivos y, bajo demanda, egresados por programa. Ambos listados recuperan la fotografía documental `ANX-4` a partir de la inscripción de admisión, sin bloquear el resto de tarjetas cuando una foto individual falla. Desde el detalle de un estudiante, coordinación también puede solicitar en una sola descarga ZIP toda su información documental; el botón permanece ocupado mientras el backend construye el archivo y la descarga comienza automáticamente al recibirlo. El formulario de solicitudes académicas también soporta la homologación de una o más parejas de materias. En el detalle de matrícula de coordinación, las acciones documentales están organizadas por propósito en columnas independientes de visualización y validación.

### Stack instalado y ejecución rápida

- React/React DOM 19.2.3, React Router DOM 7.11.0, Lucide React 0.468.0-local, TypeScript 5.9.3, Vite/Rolldown 7.2.5, plugin React SWC 4.2.2, ESLint 9.39.2 y typescript-eslint 8.51.0.
- Componentes/páginas en `src/components` y `src/pages`; módulos de dominio en `src/modules`; sesión en `src/context/Auth`; transporte en `src/shared/http`.

```bash
npm ci          # instala exactamente package-lock.json
npm run dev     # servidor Vite
npm run build   # TypeScript + producción
npm run lint    # revisión estática global
npm run preview # sirve el build
```

Se requiere Node.js 18 o superior (verificado con Node 24.15.0 y npm 11.4.2). No hay seeds. La información funcional proviene del gateway/API, salvo mocks explícitos y el catálogo estático derivado de `public/resources/Tabla-Códigos-Dane.pdf`, almacenado en `src/modules/solicitudes/data/daneLocations.json`. `VITE_API_URL` configura la API cuando corresponda; varios servicios conservan `/api/sapp` como fallback.

### Decisiones recientes (changelog-lite)

- **2026-09-20:** se optimizó `/coordinacion/estudiantes` para 440 × 956 CSS px sin alterar contratos. El filtro de estado inicia en `ACTIVO`; en móvil el buscador permanece visible y período/estado empiezan contraídos en un panel accesible con contador de filtros adicionales. El encabezado compartido usa una variante compacta exclusiva de esta pantalla. Las tarjetas miden el ancho disponible menos 40 px, separan 12 px, conservan portadas `object-fit: contain` de 220–240 px, muestran nombres completos y ocultan la segunda repetición del estado en móvil. El tablero mantiene drag de mouse, scroll táctil nativo, snap y flechas; el mensaje de error de egresados es contextual y permite reintentar. No cambiaron API, roles, paquetes, seeds ni datasets.
- **2026-09-20 (decisión histórica sustituida):** el primer tablero horizontal propuso fotos de 64 px; la decisión vigente indicada arriba las reemplazó por portadas grandes. Se conservan de aquella iteración el arrastre con botón izquierdo mediante Pointer Events, captura de puntero, umbral de 6 px, cancelación cuando predomina el gesto vertical, supresión del clic posterior a arrastrar, flechas con límites y teclado. No cambiaron API, roles, paquetes, seeds ni datasets.
- **2026-09-20:** se mantuvo el sidebar expandido de escritorio como overlay temporal activado por hover/foco, mientras que hasta 900 px se sustituye por una barra superior y drawer modal. El drawer usa `100dvh` con fallback, safe areas, scroll interno, controles de 44 px, foco contenido/restaurado y enlaces no enfocables cuando está cerrado. Inicio usa márgenes de 16 px, una cabecera compacta y tarjetas fluidas de 120 px en `repeat(2, minmax(0, 1fr))`; baja a una columna por debajo de 341 px. La meta viewport existente ya era correcta. No se cambiaron rutas, roles, API, paquetes, seeds ni datasets.
- **2026-09-19:** **Gestión de actas** incorpora el filtro local **Tipo de acta**, con las opciones **Todos**, **Comité Asesor de Posgrados** y **Consejo Académico**. La clasificación usa el booleano `tipoConsejo` ya presente en `GET /sapp/actas`, se combina con los filtros de texto y año y reinicia la paginación al cambiar; no se modificaron endpoints, contratos, paquetes, seeds ni datasets.
- **2026-09-19:** **Aprobar** abre una selección obligatoria de acta tanto para solicitudes generales como para solicitudes de crédito condonable. El catálogo existente `GET /sapp/actas` se filtra según la instancia del estado anterior: **ENVIADA A COMITE ASESOR DE POSGRADOS** admite exclusivamente actas con `tipoConsejo: null`, mientras un estado enviado a Consejo admite exclusivamente `tipoConsejo: true`. La confirmación ejecuta `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&actaId={actaId}`; para solicitudes OTRA conserva además `enviarConsejo=true` cuando corresponda. Rechazar no exige acta. Los controles de resolución también reconocen estados descriptivos de Comité o Consejo, además de la sigla histórica `ENVIADA`. No se agregaron paquetes, variables, seeds, datasets ni cambios de esquema.
- **2026-09-18:** el contrato de integrantes de un grupo incorpora `esDirector` y `existeEnSapp`. La tabla muestra **Director** para el registro cuyo indicador es verdadero y ofrece **Hacer director** exclusivamente a los demás. Tras confirmar, el frontend llama `PUT /sapp/gruposInvestigacionDocentes/director?grupoId={grupoId}&docenteId={docenteId}` sin body, bloquea temporalmente las mutaciones y repite `GET /sapp/gruposInvestigacionDocentes?grupoId={grupoId}` para mostrar la designación confirmada por el backend sin recargar la página. No se agregaron paquetes, variables, seeds, datasets ni cambios de esquema.
- **2026-09-18:** las tarjetas de documentos de Admisión y Matrículas en el detalle de un estudiante permiten **Actualizar documento** aun cuando ya existe un archivo. La actualización reutiliza `POST /sapp/document` con el mismo `tramiteId` y `tipoDocumentoTramiteId`, conserva las acciones **Ver** y **Descargar**, muestra progreso en la tarjeta y vuelve a consultar `GET /sapp/document/by-estudiante/{codigoEstudianteUis}` al finalizar para presentar la metadata y versión vigentes. Los documentos pendientes mantienen la acción **Cargar documento** y no cambiaron los contratos, dependencias, seeds ni datasets.
- **2026-09-18:** la disponibilidad de **Firmar todos los documentos** en el detalle se determina por la capacidad de gestión (`canManagePosgrados`) y por un estado cuyo nombre o sigla contiene `POR FIRMA`. Se eliminó la dependencia de `location.state.fromAssigned`, porque ese indicador solo se enviaba desde la tabla de asignadas de Solicitudes y no existía al navegar desde el nuevo módulo de Créditos condonables o mediante URL directa. El endpoint de firma, los DTO y las reglas del backend no cambian.
- **2026-09-18:** las insignias del estado `PFIR_DIR_TG` usan `programaAcademico` para distinguir maestría/MISI de doctorado/DCC, conservando **POR FIRMA DIRECTOR DE TG** como fallback si el programa no es reconocible. Para `CRED_COND` y `RENOV_CRED_COND`, la modalidad `id: 2` del catálogo `GET /sapp/modalidadContraprestacion` no solicita motivos/actividades, lugar de expedición ni datos adicionales de renovación, y no consume la previsualización: solo muestra los requisitos documentales y restringe su selección a PDF. El registro conserva `modalidadId: 2` y omite la lista vacía de motivos en el request. No se agregaron paquetes, variables, seeds ni cambios de esquema.
- **2026-09-18:** el catálogo común de profesores migra al contrato plano de `GET /sapp/docentes`, cuyos registros contienen `documentNumber`, `email`, `fullName`, `tieneRolDocentePosgrados` y `uuid`. La creación de convocatorias y la asignación a grupos filtran exclusivamente los docentes de posgrados. En Gestión de profesores, los dos listados filtrables y paginados permiten activar el rol con `POST /sapp/docentes/{uuid}/asignarRolDocentePosgrados` o retirarlo con `DELETE /sapp/docentes/{uuid}/rolDocentePosgrados`, y recargan el catálogo al completar la mutación. No se agregaron paquetes, variables, seeds, datasets ni cambios de esquema.
- **2026-09-18:** la acción **Aprobar** para el tipo **OTRA** (ID 11, trámite 15) solicita confirmar si el caso debe remitirse al Consejo Académico. **Sí** ejecuta `PUT /sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&enviarConsejo=true`; **No** aprueba usando la URL previa, sin enviar `enviarConsejo=false`. Rechazar y aprobar los demás tipos no cambian. El diálogo permite cancelar sin ejecutar la transición y usa los tokens institucionales en temas claro y oscuro. No se agregaron dependencias, variables, seeds ni cambios de esquema.
- **2026-09-18:** los formularios `CRED_COND` y `RENOV_CRED_COND` sustituyen el texto libre de lugar de expedición por una selección dependiente departamento/municipio basada en el PDF DANE incluido. El departamento inicia en Santander, puede cambiarse, limpia el municipio anterior y ocupa menos ancho que el municipio. El municipio permite escribir para filtrar en un desplegable visualmente consistente con el selector de departamento, con soporte de teclado; solo habilita la previsualización cuando coincide con el catálogo. Los nombres se muestran en Camel Case y `ciudadExpedicionDocumento` continúa siendo un `string` con exclusivamente el nombre del municipio, sin código ni departamento. No cambian endpoint, dependencias ni esquema backend.
- **2026-09-18:** `ADMIN_POSGRADOS` y `SECRETARIA_POSGRADOS` quedan funcionalmente equiparados con `COORDINADOR_POSGRADOS` en el frontend, sin fusionar ni renombrar los roles. La política compartida habilita Créditos condonables, Informes a dependencias, Actas, Fechas, Gestión de profesores, gestión completa de estudiantes, convocatorias y períodos de admisión, finalización/validación documental de inscripciones, gestión de matrículas, resolución y exclusión de créditos en Solicitudes y presentación de datos de coordinación en Perfil. Las guardas de ruta y los controles dentro de página consumen la misma definición central, para que una futura separación requiera cambiar explícitamente la política y no buscar comparaciones dispersas. No cambian endpoints, payloads, dependencias, variables, seeds ni schemas.
- **2026-09-18:** cada entrada autenticada ejecuta una única verificación global de firma con el ID dinámico de `user.id` (no un ID fijo). Una respuesta exitosa sin `contenidoFirma` presenta **Firma pendiente** y enlaza al formulario existente de `/perfil`; una firma válida no genera aviso y una falla de consulta se omite para evitar falsos positivos. El toast puede cerrarse, es accesible y utiliza tokens de los temas claro/oscuro. No se agregaron endpoints, dependencias, variables, seeds ni cambios de esquema.
- **2026-09-18:** las solicitudes `CRED_COND` y `RENOV_CRED_COND` se separan para `COORDINADOR_POSGRADOS` en un módulo protegido propio. La vista reutiliza `GET /sapp/solicitudesAcademicas`, el catálogo de estados, la tabla y el detalle existentes; divide pendientes e histórico, pagina ambos bloques y permite filtrar el histórico por nombre/código UIS. No se agregaron endpoints, dependencias, seeds ni cambios de esquema.
- **2026-09-18:** `clientRoles` pasa a ser la fuente autoritativa de autorización del inicio de sesión. Los cinco roles de posgrados se normalizan centralmente y todas las guardas existentes comparan equivalencias canónicas, por lo que rutas, sidebar y permisos funcionan con los nombres nuevos sin duplicar reglas. `roles` queda como propiedad opcional y solo se usa como fallback temporal cuando `clientRoles` está vacío. La cabecera y el perfil muestran `ADMIN`, `COORDINADOR`, `SECRETARIA`, `ESTUDIANTE` o `DOCENTE`, nunca el sufijo técnico `_POSGRADOS`.
- **2026-09-16:** el detalle de inscripción de admisión usa `numeroInscripcion` del API como **Código de inscripción**, con `INS-{id}` como fallback compatible. Las etiquetas Documento, Correo y Teléfono se muestran sin emojis.
- **2026-09-16:** el detalle de estudiantes de coordinación incorpora **Descargar información**. La acción consume `GET /sapp/estudiantes/{estudianteId}/documentos/zip` como respuesta binaria, muestra un indicador **Preparando descarga...** hasta completar la generación y dispara automáticamente el ZIP. Prioriza el nombre UTF-8 de `Content-Disposition` y usa `{codigoUIS}-documentos.zip` como respaldo; los errores se muestran en la misma cabecera sin navegar fuera del detalle.
- **2026-09-16:** `/perfil` presenta la identidad una sola vez en una cabecera visual propia: el encabezado compartido conserva únicamente el título y las marcas institucionales en esta ruta. La fotografía del estudiante acepta tanto Base64 puro como un `data:image/...` completo, respeta el MIME entregado por `/inicio`, recorta con proporción circular y usa la inicial del nombre si no existe o no puede decodificarse; el resto de módulos conserva su resumen de usuario habitual.
- **2026-09-16:** el perfil de coordinación deja de mostrar tipo/número de documento y el campo provisional de último ingreso. **Programa a cargo** ya no depende del valor de la sesión: presenta de forma fija la Maestría en Ingeniería de Sistemas e Informática y `347:DOCTORADO EN CIENCIAS DE LA COMPUTACION`; los perfiles sin rol de coordinación conservan sus datos documentales.
- **2026-09-16:** la validación documental de matrícula en coordinación aplica localmente la decisión ya confirmada por el backend antes de comprobar el checklist recargado. Así, aunque la consulta inmediatamente posterior todavía devuelva el estado anterior, al aprobar o rechazar el último documento obligatorio se ejecuta `POST /sapp/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos`; los documentos opcionales continúan excluidos del criterio y la protección por montaje evita envíos repetidos.
- **2026-09-16:** en la gestión de matrícula del estudiante, las insignias **Obligatorio** y **EN_REVISION** usan ahora el énfasis visual primario ya aplicado en otros módulos (mayor peso, relleno y borde temáticos), compatible con los modos claro y oscuro. También se eliminó el texto técnico **Estado de carga: ...** de cada documento; el nombre del archivo, el estado funcional y los errores continúan visibles.
- **2026-09-16:** durante la creación de una matrícula, el estudiante puede seleccionar los archivos requeridos antes de confirmar; la matrícula se crea primero y esos archivos se cargan luego con el `matricula.id` obtenido. Cada fila presenta las acciones en orden **Cargar**, **Ver**, **Descargar** y oculta **Ver/Descargar** hasta que exista un archivo cargado. En matrículas existentes, **Cargar** queda disponible para documentos faltantes o rechazados que requieren ajuste, pero se bloquea mientras están en revisión, cuando están aprobados y cuando la matrícula está finalizada.
- **2026-09-16:** el selector de materias de la matrícula estudiantil reconoce que `nivel` puede ser `null`: muestra esas asignaturas como **Electiva**, ubica primero todas las materias que sí tienen nivel y alinea a la izquierda el nombre y los metadatos de cada opción. La tabla de materias ya seleccionadas usa también **Electiva** para mantener la misma interpretación, sin cambiar el orden enviado por el API dentro de cada grupo ni los contratos de creación de matrícula.
- **2026-09-16:** el detalle de admisión para sesiones exclusivas de `PROFESOR`, `DOCENTE` o `DIRECTOR` realiza una sola consulta de evaluación: `GET /sapp/evaluacionAdmision/info?inscripcionId={id}&etapa=ENTREVISTA`. Esa respuesta alimenta el caché y las calificaciones de entrevista; ya no se precargan Hoja de vida/Examen ni se consulta después el endpoint general. La carga administrativa de `COORDINADOR`, `ADMIN` y `SECRETARIA` conserva exactamente su flujo previo por etapas y estado general.
- **2026-09-16:** se corrigió la carga de **Gestión profesores** para el contrato real de `GET /sapp/docentes`: el catálogo se extrae de `data.data`, se valida como arreglo antes de entregarlo a la vista y se tipan los datos personales, atributos y metadatos de paginación. La tabla usa `fullName` (con fallback a nombres o usuario), correo institucional, programas académicos y UUID, admite búsqueda por nombre/correo y tolera nombres nulos. El acceso **Gestión profesores** queda como último elemento visible del sidebar.
- **2026-09-16:** se añadió para `COORDINACION` y `ADMIN` la ruta `/coordinacion/profesores`. **Docentes en Minerva** lista y filtra el catálogo de `GET /sapp/docentes`, incluyendo el UUID requerido por las asociaciones; la acción visual **Inscribir docente** queda deshabilitada hasta disponer de su contrato de creación. **Grupos de investigación** carga `GET /sapp/gruposInvestigacion`, consulta integrantes por `grupoId`, registra con `{ grupoId, docenteUuid }` y permite retirarlos mediante `DELETE` con `grupoId` y `docenteId`. Los servicios permanecen encapsulados fuera de la vista y las nuevas superficies consumen los tokens de tema claro/oscuro.
- **2026-09-16:** el rol `DIRECTOR` tiene en Admisiones el mismo acceso operativo que `PROFESOR` y `DOCENTE`: ve el acceso lateral, entra a **Mis entrevistas**, abre el detalle de cada aspirante y puede registrar únicamente las notas y observaciones del grupo evaluador asociado a su nombre de sesión. El permiso se encapsuló en `isEvaluadorAdmision` para no convertir al director en profesor en módulos ajenos a Admisiones; si además posee un rol administrativo de Admisiones, prevalece la vista administrativa.
- **2026-09-10:** en el detalle de entrevistas de una inscripción se muestran las calificaciones agrupadas de todos los evaluadores, pero los campos de nota y observaciones solo se habilitan en el grupo cuyo nombre de evaluador coincide con el nombre completo de la sesión SAPP. Esto aplica también a coordinación: los grupos de otros usuarios permanecen visibles en modo consulta y el guardado descarta defensivamente cualquier fila que no pertenezca al usuario autenticado.
- **2026-09-10:** los combos **Convocatorias anteriores** de `/admisiones` dejaron de depender del desplegable nativo, que podía ocupar casi toda la pantalla cuando había muchos períodos. Ahora usan un selector accesible y temático cuya lista flota sobre la tarjeta, tiene una altura máxima de `12rem` y activa desplazamiento vertical para el resto de períodos; se cierra al seleccionar, al hacer clic fuera o al presionar `Escape`, sin cambiar la navegación ni los datos de las convocatorias.
- **2026-09-10:** **Informes a dependencias** conserva ahora el `data` estructurado de las respuestas HTTP fallidas. Cuando cualquiera de los informes responde con requisitos pendientes, la pantalla mantiene el mensaje del servidor y agrega un resumen desplegable por aspirante con documento, inscripción y lista de documentos faltantes; también presenta las categorías institucionales pendientes cuando existan. El parser valida defensivamente el contrato `{ data: { faltantes: { categoriasInstitucionalesFaltantes, aspirantesConDocumentosFaltantes } } }` y los errores sin ese detalle conservan el feedback simple anterior.
- **2026-09-10:** el listado de documentos del detalle de matrícula para coordinación separa la antigua columna única **Acciones** en **Visualización** (`Ver`/`Descargar`) y **Validación** (`Aprobar`/`Rechazar`). La distribución responsive mantiene ambas agrupaciones identificadas mediante sus respectivas etiquetas, sin cambiar handlers, permisos ni contratos HTTP.
- **2026-09-10:** el detalle de una convocatoria interpreta el `404 Not Found` de `GET /sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` como una colección vacía. El coordinador puede entrar a una convocatoria abierta sin aspirantes y usar **Crear aspirante**; los demás errores HTTP conservan su manejo normal. El cliente HTTP compartido expone ahora `HttpError.status` para tomar esta decisión por código de estado y no por el texto variable del backend.
- **2026-09-10:** la carga diferida de egresados mantiene activa su solicitud después de guardar el listado inicial. El cambio evita que la actualización de `egresados.length` desmonte lógicamente el efecto y cancele la cola de fotografías antes de llamar al servicio documental; las fotos se resuelven ahora con el mismo flujo de inscripción y documento `ANX-4` usado por el listado normal.
- **2026-09-10:** el listado de coordinación unifica la búsqueda por nombre y código UIS en un solo campo y dedica el tercer filtro al estado **Activo/Inactivo**. Las tarjetas presentan el estado `INACTIVO` como **Inactivo**. Al final se agregó una sección colapsable de egresados: no ejecuta ninguna consulta al cargar la página y, solo al pulsar **Mostrar egresados**, consume `GET /sapp/estudiantes/consulta?programaId={id}&egresados=true`, presenta las mismas tarjetas y carga sus fotografías con el flujo documental existente y un máximo de cuatro tareas concurrentes.
- **2026-09-09:** el módulo de matrícula para `COORDINACION`/`ADMIN` verifica primero `GET /sapp/periodoAcademicoFecha/vigente` y busca la fecha vigente cuyo tipo de trámite es `MATRICULA`. Solo cuando existe presenta habilitada la acción **Enviar correo de inicio**; tras confirmación, ejecuta `POST /sapp/matriculaAcademica/notificarAperturaMatricula?periodoId={id}` sin body, usando el identificador del periodo retornado por la verificación. La pantalla informa el periodo y rango de fechas, bloquea reenvíos mientras la solicitud está en curso y muestra el resultado del API.
- **2026-09-09:** en el detalle de matrícula de coordinación, cada aprobación o rechazo vuelve a consultar los documentos obligatorios y verifica que todos estén cargados y tengan estado final `APROBADO` o `RECHAZADO`. Al completar la revisión se ejecuta una sola vez por matrícula y por montaje `POST /sapp/matriculaAcademica/{matriculaId}/notificarDocumentosCompletos`, sin body; los documentos opcionales no bloquean esta notificación.
- **2026-09-09:** el detalle de estudiantes de coordinación permite cambiar el estado académico mediante `PUT /sapp/estudiantes/{estudianteId}/estado` con el body `{ estado: "ACTIVO" | "INACTIVO" | "EGRESADO" }`. Un estudiante activo puede inactivarse, uno inactivo puede activarse y cualquiera de los dos puede marcarse como egresado; la tarjeta actualiza el estado confirmado, informa errores del API y limpia el caché del listado para que el cambio se refleje al regresar.
- **2026-09-09:** se cerró la auditoría transversal de títulos y subtítulos de todos los módulos. Los encabezados semánticos `h1`–`h6` quedan gobernados por roles tipográficos globales (página, sección, subsección y componente), siempre con el mismo peso, color, interlineado y espaciado entre letras; los subtítulos BEM `__subtitle` comparten tamaño, peso, color e interlineado. Las hojas de módulo conservan únicamente sus decisiones de composición y márgenes, evitando que su especificidad vuelva a alterar la jerarquía global.
- **2026-09-09:** **Cerrar sesión** elimina primero la sesión y el caché locales y después reemplaza la navegación por `/api/auth/slo/logout`. Esta ruta de front-channel logout queda fija para que el Gateway/IDP finalice también la sesión institucional; ya no depende de `VITE_IDP_LOGOUT_URL` ni `VITE_LOGOUT_URL`.
- **2026-09-09:** se consolidó una escala tipográfica global para todos los módulos mediante tokens CSS de familia, tamaños, pesos e interlineados. Encabezados, texto de lectura, ayudas, etiquetas, controles y cabeceras de tabla comparten ahora una jerarquía base; las excepciones visuales específicas de cada módulo se conservan. El tamaño base ya no disminuye en tablet o móvil, mientras los títulos usan `clamp()` para adaptarse sin perjudicar la legibilidad.
- **2026-09-09:** el filtro **Estado** del listado de solicitudes ahora se construye con los estados realmente presentes en los resultados visibles. Los estados sin solicitudes se omiten; al cambiar el tipo de solicitud, las opciones de estado se recalculan sobre ese subconjunto. En coordinación, el filtro de estado se aplica en cliente sobre la consulta por tipo para conservar todas las opciones disponibles sin mostrar estados vacíos.
- **2026-09-09:** el detalle de una solicitud `HOMOLOG` presenta las parejas de materias recibidas en `solicitudHomologacionesAsignaturas`, con código y nombre de origen y destino. La sección **Motivos para la solicitud del crédito condonable**, incluida su edición, se muestra exclusivamente para los códigos `CRED_COND` y `RENOV_CRED_COND`; al cambiar durante la edición a otro tipo se limpian los motivos enviados.
- **2026-09-09:** los informes de **Matrícula** y **Créditos condonables** dejaron de usar el mock. Ahora envían `POST` a `/sapp/reportesMatricula/generar` y `/sapp/reportesCreditosCondonables/generar`, respectivamente, con `actaId`, `periodoId` y `programaId` en el query string. Ambos consumen el PDF binario, respetan el nombre de `Content-Disposition` cuando está disponible y presentan las mismas acciones **Ver**/**Descargar** del informe de admisión.
- **2026-09-08:** el logo EISI activo cambio de `public/brand/eisi-favicon.svg` a `public/brand/eisi imagen.png`, servido como `/brand/eisi%20imagen.png` por el espacio en el nombre. Se usa como favicon PNG en `index.html`, marca del sidebar en `src/components/Sidebar/Sidebar.tsx` y logo EISI del encabezado compartido en `src/components/ModuleLayout/ModuleLayout.tsx`. El sidebar conserva `object-fit: contain` y `border-radius: 9px`; el encabezado agrega `module-layout__institutional-logo--eisi` con `border-radius: 12%` solo para EISI, sin tocar el logo UIS.
  Verificacion: `npx eslint src/components/ModuleLayout/ModuleLayout.tsx src/components/Sidebar/Sidebar.tsx`, `npm run build`, `git diff --check` y `rg -n "eisi-favicon\\.svg" index.html src` pasaron el 2026-09-08; no hubo captura porque Chrome/Edge/Chromium no estan en `PATH` y no hay Playwright/Puppeteer instalado.
- **2026-09-08:** **Generar informe** en **Informes a dependencias** conectó inicialmente el informe de admisión a `POST /sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}` como respuesta binaria PDF, no como envelope JSON. El servicio devuelve un `Blob` con MIME `application/pdf`, toma el nombre desde `Content-Disposition` cuando exista y muestra debajo del formulario un PDF generado con icono, fecha Colombia y botones estandarizados **Ver**/**Descargar** (`sapp-document-action`).
- **2026-09-08:** los iconos restantes del menú lateral se unificaron con el lenguaje visual de contorno de Lucide: **Matrícula** usa `GraduationCap`, **Estudiantes** usa `UsersRound`, **Actas** usa `ScrollText`, **Fechas** usa `CalendarDays` y **Cerrar sesión** usa `LogOut`. Todos heredan `currentColor` y reutilizan la caja existente de 20 px, sin cambiar etiquetas, rutas, permisos, orden, espaciado, estados del menú, los tres iconos modernizados anteriormente ni la marca Minerva. Debido al HTTP 403 del registro npm, `lucide-react` queda disponible como dependencia local reproducible en `vendor/lucide-react`, con únicamente los cinco componentes requeridos.
- **2026-09-08:** el menú lateral reemplaza exclusivamente los pictogramas de **Solicitudes**, **Admisiones** e **Informes a dependencias** por iconos SVG de contorno basados en Lucide (`ClipboardList`, `FileUser` y `FolderOpen`). Los tres usan `currentColor`, 20 px y el mismo alineado tanto en estado normal como seleccionado; los demás iconos, etiquetas, rutas, permisos, orden y comportamiento permanecen intactos. La instalación de `lucide-react` fue bloqueada por la política del registro npm (HTTP 403), por lo que se incorporaron localmente solo los trazos SVG requeridos, sin añadir una dependencia que impidiera compilar.
- **2026-09-08:** **Generar informe** se conectó inicialmente al servicio real de admisiones: `POST /sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}`, sin body y con los valores seleccionados en pantalla. Esa decisión fue reemplazada el mismo día por el mapeo binario PDF descrito arriba.
- **2026-09-08:** el sidebar y los accesos de inicio comparten una única definición de navegación, de modo que cada módulo permitido por rol aparece en ambos lugares con el mismo nombre e icono. Se incorporaron en inicio los accesos antes ausentes a **Informes a dependencias** y **Actas**, se revisaron los pictogramas según el significado de cada proceso y el nombre visible **Reportes** se reemplazó por **Informes a dependencias** sin cambiar la ruta técnica `/coordinacion/reportes`.
- **2026-09-07:** homologación separa los catálogos de origen y destino. Los orígenes se consultan en `GET /sapp/homologaciones/asignaturas-externas/activas`, los destinos permanecen en `GET /sapp/asignaturas?programaId=1` y cada fila permite alternar entre una materia externa registrada y el alta manual. `POST /sapp/solicitudesAcademicas` recibe ambas variantes dentro de `solicitudHomologacionesAsignaturas`; ya no se crean opciones mock en memoria.
- **2026-09-07:** la pestaña del navegador se identifica como **Minerva | Posgrados** y conserva el favicon EISI. El encabezado compartido muestra ahora los logotipos EISI y UIS juntos, en ese orden y con la misma altura responsiva para mantener una proporción visual consistente en escritorio y móvil.
- **2026-09-07:** la edición de un período académico usa un único `PUT /sapp/periodoAcademico/{id}`, donde el identificador se envía exclusivamente en la URL. El body se alineó con la última versión del backend: `{ fechaInicio, fechaFin, descripcion, fechas: [{ tipoTramiteId, fechaInicio, fechaFin, descripcion }] }`, sin IDs, año ni número de período. La creación conserva su `POST`.
- **2026-09-04:** las tarjetas de convocatorias en `/admisiones` diferencian ahora todo el bloque por vigencia, no solo la insignia: las abiertas usan acento de éxito y explican que reciben aspirantes; las cerradas usan acento de advertencia, informan que las inscripciones finalizaron y reemplazan la acción primaria por **Consultar convocatoria**. La distinción combina color, texto y símbolos para no depender únicamente de la percepción cromática y funciona con los temas claro/oscuro.
- **2026-09-04:** las acciones **Ver/Abrir** y **Descargar** de los listados documentales comparten la clase global `sapp-document-action`, basada en la apariencia del listado de actas: contorno primario, forma pill y estados hover, foco y espera compatibles con tema claro/oscuro. Se conservaron intactos los handlers, permisos, estados de carga y contratos HTTP de cada pantalla.
- **2026-09-04:** el listado de matrículas de coordinación preselecciona, después de cargar los registros, el período correspondiente a la fecha actual en Colombia (`año-1` entre enero y junio; `año-2` entre julio y diciembre). Si el API no devuelve matrículas de ese período, conserva **TODOS**. El sidebar ya no presenta la insignia circular **M** cuando está contraído; el nombre **Minerva** aparece únicamente al expandirlo y permanece visible en móvil.
- **2026-09-04:** todos los controles de regreso del sistema usan el componente compartido `BackButton`: píldora con flecha, tokens semánticos del tema, foco visible y comportamiento uniforme como enlace o botón. Se ubicaron al inicio y arriba a la izquierda de las vistas de detalle de convocatorias, inscripciones, evaluaciones, estudiantes, matrículas y solicitudes, además de la edición de períodos y el formulario de nueva solicitud.
- **2026-09-04:** la marca visible del sistema cambió de **SAPP** a **Minerva**, sin modificar rutas, contratos, claves de storage ni identificadores técnicos existentes. El nombre completo **Minerva** aparece al expandir el sidebar o navegar en móvil; el título del documento y los textos visibles de usuario también adoptaron la nueva marca.
- **2026-09-04:** `/fechas` reemplazó el resumen general de convocatorias por la gestión completa que ya existía en `/admisiones/convocatorias`: filtros de período/vigencia, secciones por programa, creación, edición, cierre y acceso a inscripciones. Cada programa mantiene su propia paginación de 4 convocatorias. La creación y edición de períodos continúa en `/fechas/periodos` y su listado también se pagina de a 4 registros.
- **2026-09-04:** en el detalle de una solicitud, únicamente una sesión con rol `COORDINADOR` puede resolverla, y solo mientras su estado normalizado sea `ENVIADA` (**ENVIADA A COMITE ASESOR DE POSGRADOS**). El selector libre de estados fue reemplazado por los botones **Aprobar** y **Rechazar**, que envían exclusivamente `APROBADA` o `RECHAZADA`; para cualquier otro estado ambos controles se ocultan. El badge del estado ahora puede ocupar varias líneas dentro de su tarjeta, evitando desbordamientos con etiquetas extensas.
- **2026-09-03:** el conversor HTML→PDF dejó de cortar el documento en múltiplos rígidos de 912 px. Después de cargar fuentes e imágenes, obtiene las cajas de cada línea con `Range.getClientRects()` y protege párrafos, listas, filas/tablas, figuras, encabezados y bloques `.pdf-keep-together`/`[data-pdf-keep-together]`. Cada página conserva Letter 816×1056 y márgenes verticales de 72 px, pero ahora usa rangos consecutivos ajustados a la geometría real. Un umbral de ocupación del 25 % y la división permitida de bloques mayores de 912 px evitan páginas casi vacías y ciclos infinitos. La prueba de navegador `tests/browser/htmlToPdf.pagination.browser.html` coloca dos firmas cerca del primer corte y comprueba que ambas pasan completas a la segunda página, que los rangos son contiguos y que cubren todo el documento. Las plantillas de `pdf-previsualizacion` pertenecen al backend (no están en este repositorio): sus contenedores completos de firmas, tablas pequeñas y secciones institucionales indivisibles deben llevar `data-pdf-keep-together`.
- **2026-09-03:** se corrigió la regresión de integración que dejó simultáneamente dos implementaciones de `loadDataImage`, utilidades del renderizador directo sin uso y una llamada huérfana a `loadSvgImage`. La exportación vuelve a usar una única canalización coherente: sanitiza el HTML, recopila texto e imágenes seguras y pinta cada página Letter directamente en canvas, sin `foreignObject`; `npm run build` vuelve a finalizar correctamente.
- **2026-09-03:** la conversión de documentos HTML persistidos a PDF ya no dibuja imágenes `data:` dentro del SVG `foreignObject`. Las firmas/imágenes se extraen, se conserva su espacio en el layout y se componen directamente sobre cada página del canvas; así **Ver** y **Descargar** evitan el `SecurityError` de canvas contaminado sin eliminar las firmas ni modificar el HTML guardado.
- **2026-09-03:** todos los listados del módulo Solicitudes ordenan por `fechaRegistro` descendente y, cuando dos registros comparten fecha, por `id` descendente. Una sesión cuyo único acceso operativo es el rol exacto `PROFESOR` ve exclusivamente **Solicitudes asignadas**; no se consulta ni se renderiza el listado general. `DOCENTE`, `DIRECTOR`, coordinación y administración conservan su comportamiento anterior, y los roles elevados prevalecen si una sesión también incluye `PROFESOR`.
- **2026-09-03:** el payload de `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` usa `motivosCreditoCondonable` para los motivos de las solicitudes de crédito condonable; el frontend dejó de enviar la clave genérica `motivos`. La renovación (tipo 12) conserva su campo especifico `actividadesCreditoCondonable`.
- **2026-09-03:** después de completar **Firmar todos los documentos** en el detalle de una solicitud, la SPA vuelve a consultar tanto `GET /sapp/solicitudesAcademicas/{solicitudId}` como `GET /sapp/document?tramiteId={solicitudId}&codigoTipoTramite={codigo}`. La solicitud, su selector de estado y los documentos adjuntos se actualizan en el estado React sin recargar la página completa; el mensaje final solo confirma actualización completa cuando ambas consultas terminan correctamente.
- **2026-09-03 (decisión histórica, reemplazada el 2026-09-09):** se introdujo la limpieza integral de sesión y cachés del navegador. La implementación vigente conserva esa limpieza, pero sustituyó el antiguo `POST` configurable y la navegación a `/` por el front-channel logout fijo `/api/auth/slo/logout` descrito arriba.
- **2026-09-03:** los documentos generados por `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` se convierten a PDF únicamente para su previsualización. Al registrar la solicitud se carga el HTML original, con MIME `text/html`, y las acciones posteriores **Ver/Descargar** lo convierten de nuevo a PDF en el navegador; así la base de datos conserva la fuente HTML sin exponerla como formato de descarga.
- **2026-09-03:** el detalle de cualquier solicitud carga y presenta **Documentos adjuntos** para todos los roles autorizados, reutilizando el listado antes exclusivo de coordinación y omitiendo la columna técnica **Tipo**. Al entrar desde **Solicitudes asignadas**, un estado descriptivo que contiene `POR FIRMA` (incluido `POR FIRMA DIRECTOR DE TG`) habilita **Firmar todos los documentos**, aunque `estadoSigla` tenga un código como `PFIR_DIR_TG`; la acción ejecuta `POST /sapp/firmasDocumento/solicitudesAcademicas/{solicitudId}` y recarga el detalle tras el éxito.
- **2026-09-03:** el perfil de un usuario con rol `ESTUDIANTE` solicita únicamente la imagen de firma y omite por completo `titulo` en el POST de creación. Los demás roles conservan el título obligatorio y el contrato `{ titulo, contenidoFirma }`.
- **2026-09-03:** los perfiles `PROFESOR`/`DOCENTE`, `COORDINADOR` y `DIRECTOR` ven primero **Solicitudes asignadas**, obtenidas con `GET /sapp/solicitudesAcademicas/asignadas?idUsuario={usuarios_sapp.id}`. El listado general excluye por `id` las solicitudes ya asignadas al usuario para evitar duplicados en pantalla.
- **2026-09-03:** se restituyó **Cerrar sesión** exclusivamente en el pie del sidebar. La acción elimina la sesión SAPP y los storages del origen, expira las cookies accesibles para la SPA y recarga la página para que el Gateway vuelva a resolver la autenticación institucional.
- **2026-09-03:** el listado y el detalle de estudiantes omiten los marcadores técnicos `N/A`/`NA` al presentar el documento de identidad. El formato se centralizó para mostrar únicamente las partes disponibles (por ejemplo, `1005324324` cuando no existe tipo documental) y `—` solo cuando tampoco existe número.
- **2026-09-03:** el encabezado del detalle de solicitudes presenta en una sola línea `Solicitud {id} — {tipoSolicitud}` para todos los roles autorizados; se retiraron el símbolo `#`, el código técnico y la repetición del nombre descriptivo.
- **2026-09-03:** el perfil consulta la firma vigente mediante `GET /api/sapp/firmaUsuario/{usuarioSappId}`, muestra su imagen y título, y permite reemplazarla. El POST ahora usa el contrato `{ titulo, contenidoFirma }`; el título es obligatorio en la interfaz antes de seleccionar una imagen.
- **2026-09-03:** el listado y detalle de estudiantes de coordinación resuelven el tipo de documento desde los campos superiores `tipoDocumento` o `tipoDocumentoIdentificacion` del contrato real, conservando `persona.tipoDocumento` como fallback; así se evita mostrar `N/A` junto a un número válido. En el detalle se eliminó la cohorte duplicada sobre el correo institucional y se conserva únicamente **Cohorte de ingreso** en los datos académicos.
- **2026-09-03:** la proyección de coordinación para estudiantes se alineó con el contrato real de `GET /sapp/estudiantes/consulta`: `numeroDocumento`, `correoInstitucional` y `correoPersonal` se leen desde el nivel superior; `persona.id`/`persona.idpId`, `estudiante.fechaEgreso` y cohortes con formato `YYYY-N` también se conservan. El detalle dejó de recurrir a datos mock al abrirse directamente y consulta el mismo recurso por `estudianteId`; además muestra ambos correos.
- **2026-09-03:** el listado de estudiantes de coordinación ordena la colección por semestre/cohorte descendente antes de iniciar la cola de descarga de fotos. De este modo, las consultas de fotos se programan en el mismo orden que las tarjetas visibles, con desempate alfabético por nombre y manteniendo el límite existente de cuatro tareas concurrentes.
- **2026-09-03:** el detalle de matrícula de coordinación presenta en **Estado** el valor real de `documentoUploadedResponse.estadoDocumento` (por ejemplo, `APROBADO`) en lugar de reducir todo documento existente a `Cargado`. La columna **Validación** fue reemplazada por **Fecha de revisión**, obtenida de `fechaRevisionDocumento`; los controles para aprobar o rechazar siguen disponibles dentro de **Acciones**. La vista del estudiante también usa ahora la fecha de revisión real, no la fecha de carga, y ambos listados comparten el mismo tratamiento visual de tabla, estados, bordes, espaciado y botones.
- **2026-09-02:** cuando una matrícula está `FINALIZADA`, el detalle de coordinación oculta las acciones **Aprobar/Rechazar** de documentos y asignaturas, así como el guardado de validaciones. Los documentos cargados muestran el nombre original entregado por `nombreArchivoDocumento`.
- **2026-09-02:** en el detalle de matrícula de coordinación, aprobar el último documento obligatorio ejecuta automáticamente la aprobación de la matrícula (`PUT /sapp/matriculaAcademica/{id}`). Se eliminó el botón manual **Aprobar documentos** y se bloquean las demás validaciones documentales mientras finaliza la transición para evitar solicitudes concurrentes.
- **2026-09-02:** únicamente el tipo de solicitud `12` (**RENOVACION CREDITO CONDONABLE**, trámite `17`) solicita los datos adicionales de renovación y envía `actividadesCreditoCondonable`, dirección, periodo inicial, intensidad y horas a la previsualización PDF; teléfono y correo se obtienen de la sesión. Los demás tipos conservan su formulario y contrato anteriores.
- **2026-09-02:** la consulta de matrícula vigente interpreta el nuevo objeto `{ periodoId, puedeCrear }`: bloquea el formulario y muestra que no hay fechas habilitadas cuando `puedeCrear` es `false`; cuando es `true`, usa el `periodoId` entregado por esa misma validación en el POST de creación.
- **2026-09-02:** se corrigió la ruta de períodos con fechas para eliminar dos espacios que el navegador codificaba como `%20%20`; la solicitud vuelve a resolverse como `GET /api/sapp/periodoAcademico/withFechas`.

- **2026-09-02:** el selector de firma del perfil valida y previsualiza el archivo y persiste inmediatamente el data URI mediante `POST /api/sapp/firmaUsuario/{usuarioSappId}`; se retiró la persistencia provisional en `localStorage`.
- **2026-09-02:** el perfil aprovecha el contrato real de `/inicio`: código UIS, programa, cohorte, estado, fecha de ingreso, correo personal y teléfono, con fallback a `attributes` cuando corresponde.
- La firma no se incorpora a la sesión: se consulta directamente al abrir el perfil y no se duplica en `localStorage`.
- Los estilos nuevos consumen tokens semánticos y se adaptan a móvil y modos claro/oscuro.

Frontend de **Minerva**, sistema de apoyo para la gestión de trámites de posgrados de la Escuela de Ingeniería de Sistemas e Informática (**EISI**) de la Universidad Industrial de Santander (**UIS**). La marca anterior era **SAPP**; ese término se conserva únicamente donde forma parte de contratos o identificadores técnicos que no deben migrarse.

## Propósito y alcance

Minerva centraliza y estandariza la trazabilidad de procesos académicos y administrativos de posgrado:

- admisiones y convocatorias;
- matrícula académica;
- matrícula financiera y créditos condonables;
- solicitudes estudiantiles;
- examen de candidatura;
- trabajos de grado;
- configuración de fechas y notificaciones.
- consulta y carga de actas institucionales por coordinación y administración.

Este repositorio contiene únicamente el **frontend React/TypeScript**. La lógica de dominio, persistencia y contratos principales viven en el backend Spring Boot/PostgreSQL consumido por API HTTP.

## Arquitectura breve

- **SPA React + TypeScript** servida con Vite/rolldown-vite.
- **Ruteo** centralizado en `src/app/routes` con rutas protegidas por rol. No se publican rutas de login ni un portal independiente para aspirantes.
- **Autenticación** en `src/context/Auth`: al arrancar la SPA se inicializa la sesión real desde el API Gateway/IDP y se persiste en storage compartido.
- **Cliente HTTP** encapsulado en `src/shared/http/httpClient.ts` y servicios por módulo/API.
- **Módulos de dominio UI** bajo `src/modules` y pantallas bajo `src/pages`.
- **Layout institucional** con `Sidebar`, `Layout` y `ModuleLayout`; los assets de marca institucional viven en `public/brand`.

## Stack y versiones exactas observadas

Versiones instaladas en `D:\Users\david\Desktop\SAPP\react - curso\clase 1\SAPP-frontend` según `npm list --depth=0` el **2026-09-08**:

| Paquete | Versión |
| --- | --- |
| Node.js | 24.15.0 |
| npm | 11.4.2 |
| react | 19.2.3 |
| react-dom | 19.2.3 |
| react-router-dom | 7.11.0 |
| lucide-react | 0.468.0-local -> .\vendor\lucide-react |
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

El cierre de sesión no requiere variable de entorno: después de limpiar sesión y cachés, la SPA navega a la ruta institucional fija `/api/auth/slo/logout`.

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

No hay seeds de base de datos ni usuarios quemados en este repositorio. La sesión SAPP se obtiene al cargar la SPA mediante `GET /api/sapp/inicio`, sin body. Para desarrollo se necesita un backend/gateway que capture la identidad institucional y responda el contrato descrito abajo. La sesión normalizada se guarda en `localStorage['SAPP_AUTH_SESSION']`; `NO_TOKEN` es solo un marcador local y nunca se envía como Bearer porque la autenticación se resuelve en el gateway.

## Decisiones recientes / changelog-lite

### 2026-09-03 — Listado documental único en el detalle estudiantil

- Al consultar una solicitud ya creada desde el perfil `ESTUDIANTE`, la vista de detalle oculta el checklist redundante titulado **Documentos** y conserva únicamente la tabla **Documentos adjuntos**.
- El editor de documentos sigue disponible al activar **Editar solicitud**; el cambio no afecta la creación, la edición, la carga de archivos ni las vistas de otros roles.
- No cambiaron contratos de API, dependencias, variables de entorno, seeds ni datasets.

### 2026-09-03 — Encabezado descriptivo del detalle de solicitudes

- La ruta compartida `/solicitudes/:solicitudId` muestra el encabezado `Solicitud {id} — {tipoSolicitud}` sin el símbolo `#` ni el código técnico `tipoSolicitudCodigo`.
- El nombre descriptivo deja de repetirse en un párrafo separado. Como todos los roles autorizados usan la misma pantalla de detalle, el formato aplica por igual a estudiantes, coordinación y administración.
- No cambiaron contratos de API, permisos, dependencias, variables de entorno, seeds ni datasets.

### 2026-09-03 — Estado y fecha reales de documentos de matrícula

- En `/matricula/:matriculaId`, la columna **Estado** consume directamente `documentoUploadedResponse.estadoDocumento`; solo usa `EN_REVISION` como fallback para un archivo cargado sin estado y `PENDIENTE` cuando aún no existe archivo.
- La antigua columna **Validación** se sustituyó por **Fecha de revisión**, alimentada por `documentoUploadedResponse.fechaRevisionDocumento`. Aprobar/rechazar no desaparece del flujo: sus controles se agruparon con **Ver** y **Descargar** en **Acciones**.
- La tabla documental del estudiante dejó de mostrar `fechaCargaDocumento` bajo el rótulo de revisión y ahora usa el mismo campo `fechaRevisionDocumento`. El listado de coordinación adoptó el contenedor, separadores, badges y adaptación móvil del listado estudiantil.
- No se agregaron dependencias, variables de entorno, seeds ni datasets.

### 2026-09-02 — Informes a dependencias para coordinación

- Se incorporó la ruta protegida `/coordinacion/reportes`, disponible para coordinación y administración, con informes de admisión, matrícula y créditos condonables.
- Los selectores consumen los servicios de programas, convocatorias, períodos y actas. En admisión, el programa filtra las convocatorias; en matrícula y créditos, se preselecciona el período vigente por fechas o, como fallback, el más reciente.
- La generación está encapsulada en `informesMockService.ts`. Su request usa IDs numéricos y discrimina el proceso; debe sustituirse por el endpoint definitivo sin llevar lógica HTTP a la pantalla.
- No se agregaron dependencias, variables de entorno, seeds ni datasets.

### 2026-09-02 — Datos de previsualización para renovación de crédito condonable

- El tratamiento especial está delimitado por `tipoSolicitudId: 12` (**RENOVACION CREDITO CONDONABLE**, asociado al trámite `17`); no se infiere a partir del nombre y no altera los demás tipos de solicitud.
- El formulario reutiliza la modalidad y ciudad de expedición del flujo de crédito condonable, reemplaza visualmente los motivos por una lista dinámica de actividades y agrega dirección, periodo académico inicial en formato `AAAA-P`, intensidad horaria semanal y horas del semestre.
- Para este tipo, `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` recibe `actividadesCreditoCondonable` y no `motivos`; también recibe los campos adicionales, mientras `telefonoEstudiante` y `correoEstudiante` provienen de la sesión SAPP (con preferencia por correo institucional).
- No se agregaron dependencias, variables de entorno, seeds ni datasets.

### 2026-09-02 — Disponibilidad y período de creación de matrícula

- `GET /api/sapp/matriculaAcademica/vigente/estudiante/{estudianteId}` puede responder, cuando no existe matrícula vigente, `data: { periodoId, puedeCrear }`.
- Si `puedeCrear` es `false`, la pantalla de estudiante no carga ni presenta materias, documentos o la acción de confirmación; en su lugar informa que no hay fechas de matrícula habilitadas actualmente.
- Si `puedeCrear` es `true`, el frontend conserva el `periodoId` de la validación y lo envía como `periodoId` en `POST /api/sapp/matriculaAcademica`. La validación se repite justo antes del POST para no crear con una disponibilidad o período obsoletos.
- Se mantiene compatibilidad con la respuesta que contiene una matrícula existente. La antigua respuesta booleana `true` ya no permite crear porque carece del período obligatorio; no se agregaron dependencias, seeds ni datasets.

### 2026-09-02 — Ruta de períodos con fechas sin espacios codificados

- `getPeriodosAcademicosWithFechas()` usa la ruta lógica `/sapp/periodoAcademico/withFechas`, sin espacios antes de `sapp`.
- Con la base relativa predeterminada `/api/sapp`, el cliente HTTP normaliza la llamada a `GET /api/sapp/periodoAcademico/withFechas`; ya no genera `/%20%20sapp/periodoAcademico/withFechas`.
- No cambiaron el DTO, el envelope `{ ok, message, data }`, las dependencias, los seeds ni los datasets.

### 2026-09-02 — Previsualización y carga de múltiples documentos generados

- La previsualización de crédito condonable conserva ahora todos los elementos de `data` retornados por `POST /sapp/solicitudesAcademicas/pdf-previsualizacion`; una respuesta histórica con un único objeto continúa normalizándose a una lista.
- El visor presenta un selector tipo pestañas cuando se generan varios documentos, permitiendo alternar entre ellos sin abrir ventanas adicionales. Cada HTML se convierte localmente a PDF y cada PDF recibido se conserva.
- **Cargar todos los documentos generados** asocia cada archivo al requisito del listado comparando primero `tipoDocumentoId` con el ID del requisito o `tipoDocumentoCodigo` con su código. Así, por ejemplo, `{ tipoDocumentoId: 18, tipoDocumentoCodigo: "ANX-17" }` funciona con cualquiera de los dos identificadores.
- Si algún documento no tiene requisito coincidente, los demás sí se cargan y la interfaz informa la carga parcial. No se agregaron dependencias ni seeds.

### 2026-09-02 — Bloqueo de recursos externos durante la conversión PDF

- Las firmas/imágenes JPEG entregadas como base64 crudo (`/9j/...`) o como data URI se normalizan a un data URI compacto antes de cargar el HTML.
- Se elimina `srcset` y cualquier atributo de recursos no permitido, y el documento aislado incorpora una política CSP que solo admite imágenes `data:` y estilos inline. Esto impide que el navegador interprete el base64 como una URL relativa (`GET /9j/...`) y evita contaminar el canvas antes de `toDataURL`.

### 2026-09-02 — Márgenes verticales en el PDF generado

- Cada página carta generada en el navegador reserva ahora `0.75 in` (`72 px` a 96 DPI) en la parte superior e inferior.
- La paginación usa únicamente el área imprimible entre esos márgenes (`912 px` por página) y recorta el HTML por tramos consecutivos, por lo que no se pierde contenido entre páginas.
- El ajuste aplica solo a la conversión de respuestas HTML; los documentos que el backend ya entrega como PDF continúan utilizándose sin modificación.

### 2026-09-02 — Conversión local de la previsualización HTML a PDF

- `POST /sapp/solicitudesAcademicas/pdf-previsualizacion` puede retornar `data` como una lista cuyos documentos contienen `base64DocumentoContenido` y `mimeTypeDocumentoContenido: "text/html"`; el servicio conserva toda la colección generada.
- Para solicitudes de crédito condonable, el navegador decodifica ese HTML, lo renderiza en un `iframe` aislado sin scripts y genera un PDF tamaño carta paginado. La conversión no requiere dependencias ni servicios externos.
- El previsualizador recibe una URL Blob con MIME `application/pdf`. **Cargar archivo de solicitud** adjunta exactamente ese mismo Blob como `carta-solicitud-credito-condonable.pdf`, en vez de renombrar contenido HTML como si fuera PDF.
- La compatibilidad con respuestas que ya contienen PDF se mantiene: cualquier MIME distinto de HTML se usa directamente. Las URLs Blob se revocan al regenerar, reiniciar o desmontar el formulario.
- Antes de insertar el HTML en un documento activo, se normalizan las imágenes base64 sin prefijo `data:` (por ejemplo, firmas JPEG que empiezan por `/9j/`) y se eliminan recursos externos. Así, la conversión procesa únicamente el HTML recibido, no genera solicitudes como `GET /9j/...` y ningún recurso remoto puede contaminar el canvas.

### 2026-08-28 — Módulo de actas

- Se incorporó la ruta protegida `/actas` para los roles `COORDINADOR` y `ADMIN`, con acceso desde la navegación principal.
- El módulo consume `GET /actas`, permite buscar por nombre/código y pagina localmente los resultados en grupos de 10. Las actas se ordenan por código de forma descendente y, cuando el código base coincide, por el año descendente incluido en `ACT-{consecutivo}-{año}`; el orden se aplica antes de filtrar y paginar.
- El filtro de año y la columna **Año** se derivan del sufijo del código del acta, no de `fechaCreacion`. El conteo textual de resultados fue retirado.
- Cada fila permite **Ver** o **Descargar** el PDF. La acción consulta el contenido mediante `GET /actas/{actaId}` usando el `id` del acta (no `documentoContenidoId`) y usa el nombre retornado o, como fallback, `{codigo}.pdf`.
- Cada fila también permite **Eliminar**. Antes de enviar `DELETE /actas/{id}`, la interfaz solicita confirmación mostrando el nombre y el código del acta; al completarse, retira el registro del listado y presenta una confirmación temporal.
- La creación consume `POST /actas`. La interfaz arma el código `ACT-{código}-{año}`, fija `fechaCreacion` con la fecha actual en `America/Bogota`, convierte el PDF a base64 y calcula su checksum SHA-256 antes de enviarlo. Solo admite PDF de hasta 15 MB.
- La confirmación de creación se oculta automáticamente después de 5 segundos.
- No se agregaron seeds ni dependencias. El contrato y transporte están encapsulados en `src/modules/actas`; la pantalla está en `src/pages/Actas`.

### 2026-08-28 — Bloqueo de creación de aspirantes en convocatorias cerradas

- El detalle de una convocatoria continúa siendo consultable cuando está cerrada, pero la acción **Crear aspirante** queda deshabilitada y se explica el motivo en pantalla.
- El bloqueo usa tanto el indicador `vigente` del backend como el rango de fechas de la convocatoria, y se aplica también en el manejador de la acción y en la apertura del modal para evitar el alta por estados transitorios de la interfaz.
- La creación de estudiantes admitidos continúa disponible en convocatorias cerradas; esta regla solo restringe nuevos aspirantes.

### 2026-08-28 — Prevención persistente de estudiantes duplicados

- En el detalle de una convocatoria cerrada, la acción **Crear estudiante** solo queda habilitada para aspirantes admitidos cuya inscripción no contiene `idPersona`.
- Si `GET /api/sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` devuelve un `idPersona` numérico, la UI presenta **Estudiante creado** y deshabilita la acción, incluso después de recargar la página.
- La marca local posterior a un alta exitosa se conserva para dar retroalimentación inmediata, pero el contrato de `idPersona` es la fuente persistente al volver a consultar la convocatoria.

### 2026-08-28 — Orden y filtros del listado de estudiantes

- `/coordinacion/estudiantes` ordena las tarjetas primero por período/cohorte, del más reciente al más antiguo, y usa el nombre como segundo criterio estable.
- El listado permite combinar un selector de período con búsquedas parciales por nombre y código UIS. Las búsquedas ignoran mayúsculas, minúsculas y tildes, muestran el conteo de resultados y pueden limpiarse en una sola acción.
- Los filtros operan sobre la respuesta ya cargada de `GET /api/sapp/estudiantes/consulta?programaId={id}&egresados=false`; no cambian el contrato HTTP, no agregan dependencias y se reinician al cambiar entre maestría y doctorado.

### 2026-08-28 — Caché efímera al consultar el detalle de un estudiante

- El listado de `/coordinacion/estudiantes` guarda en memoria los programas, el programa seleccionado, los estudiantes y las fotos ya resueltas únicamente cuando se abre el detalle de una tarjeta.
- Al volver desde `/coordinacion/estudiantes/:estudianteId`, la pantalla consume ese snapshot una sola vez y evita repetir tanto la consulta del listado como las consultas individuales de fotografías.
- El snapshot se elimina al consumirlo o al abandonar el detalle hacia cualquier ruta distinta del listado. No se usa `localStorage`, `sessionStorage` ni una caché global de duración indefinida, por lo que una visita posterior desde otro módulo solicita datos actuales.
- No cambiaron endpoints, DTO, dependencias, seeds ni datasets.

### 2026-08-28 — Carga progresiva de fotografías de estudiantes

- El listado de coordinación muestra primero los estudiantes con `fotoUrl: null` y luego carga cada retrato de forma progresiva, manteniendo **Sin foto** ante datos o documentos ausentes y fallos individuales.
- La fotografía de admisión se resuelve con `idAspirante → GET /inscripcionAdmision/aspirante/{idAspirante} → inscripcion.id`; ese ID de inscripción, no el del aspirante, se envía como `tramiteId` al contrato documental `codigoTipoTramite=1002` y `codigoTipoDocumentoTramite=ANX-4`.
- Las consultas secundarias se limitan a cuatro estudiantes simultáneos y sus respuestas se ignoran si cambia el programa. El filtro `codigoTipoDocumentoTramite` se envía al backend para no descargar todo el checklist.
- No se agregaron dependencias, seeds ni datasets. Para volúmenes mayores sigue recomendándose un endpoint batch de backend que elimine el patrón N+1.

### 2026-08-28 — Fotografías más altas en tarjetas de aspirantes y estudiantes

- Las fotografías de las tarjetas del detalle de convocatoria y del listado de estudiantes de coordinación aumentaron de 190 px a 240 px de alto para mostrar mejor el retrato sin cambiar el ancho de las tarjetas.
- En pantallas de hasta 640 px se usa una altura de 220 px, manteniendo el carrusel horizontal y el recorte proporcional con `object-fit: cover`.
- El ajuste es exclusivamente visual: no modifica rutas, contratos HTTP, datos, seeds ni dependencias.

### 2026-08-28 — Convocatoria cerrada del período actual visible

- La pantalla `/admisiones` destaca primero la convocatoria que corresponde al semestre calendario actual en Colombia (enero-junio: período 1; julio-diciembre: período 2), aunque sus fechas hayan terminado o su estado sea cerrado.
- La tarjeta diferencia explícitamente **ABIERTA** y **CERRADA**, conserva las fechas y permite entrar al detalle en ambos estados. Solo recurre a una convocatoria abierta de otro período cuando no existe una convocatoria para el período actual.
- La convocatoria destacada se excluye del selector de convocatorias anteriores para evitar mostrarla dos veces; el contrato HTTP de `GET /api/sapp/convocatoriaAdmision` no cambió.

### 2026-08-26 — Edición de fechas de convocatorias

- El listado de configuración de convocatorias incorpora la acción **Editar** en cada fila y abre un diálogo con las fechas actuales de inicio y fin.
- El formulario valida que ambas fechas existan y que el fin no sea anterior al inicio; el botón de guardado solo se habilita cuando existe un cambio.
- La actualización usa `PUT /api/sapp/convocatoriaAdmision/fechas/{id}` y envía únicamente los campos modificados (`fechaInicio` y/o `fechaFin`). Después de una respuesta exitosa, el listado se consulta nuevamente para reflejar el estado y las fechas calculadas por el backend.

### 2026-08-25 — Actualización inmediata de la evaluación tras validar documentos

- Al iniciar la evaluación desde **Documentos cargados**, la pantalla espera hasta confirmar que el backend reporta la evaluación como iniciada.
- Una confirmación exitosa actualiza el estado del detalle padre, precarga Hoja de vida, Examen de conocimiento y Entrevistas, y vuelve a montar sus vistas antes de abrir Hoja de vida. Así, los componentes inferiores quedan habilitados sin recargar manualmente la página.
- Si el backend acepta la solicitud pero los componentes todavía no están disponibles después de los reintentos, la navegación se detiene y se informa al usuario para evitar mostrar una sección deshabilitada o vacía.

### 2026-08-25 — Rol principal visible sin el rol genérico del sistema

- El encabezado común ahora ignora `DEFAULT-ROLES-EISI` al elegir el rol principal que se muestra junto al nombre del usuario.
- Se conserva el orden de roles entregado por la sesión y se presenta el primer rol distinto al genérico, comparándolo sin distinguir mayúsculas y minúsculas.
- Si la sesión no contiene ningún rol funcional, se muestra `SIN ROL ASIGNADO` en lugar de atribuir un rol inexistente o exponer el rol técnico.

### 2026-08-24 — Evaluadores de convocatoria identificados por UUID

- La creación de convocatorias consulta el catálogo con `GET /api/sapp/docentes/estado?skip=0` y conserva `uuid`, `id`, `nombre` y `existeEnSapp`; las entradas sin nombre o UUID utilizable no se muestran.
- La selección y los reintentos de asociación usan el UUID como identidad estable del docente, incluso cuando `id` es `null` porque la persona aún no existe en SAPP.
- Cada asociación ejecuta `POST /api/sapp/evaluadorConvocatoria` con `{ evaluadorUuid: string, convocatoriaId: number }`; se retiró el envío anterior de `evaluadorId`.

### 2026-08-17 — Detalle de identidad en la sesión institucional

- El contrato de `GET /inicio` incorpora `data.detalle` con las figuras `aspirante`, `docente`, `estudiante` y `persona`; las figuras que no aplican llegan como `null`.
- La sesión conserva el objeto `detalle` completo y toma `persona.id` y `estudiante.id` de sus respectivas figuras dentro de `detalle`, en vez de fabricar esos identificadores desde el `id` superior.
- Se mantiene compatibilidad con los procesos existentes: `user.persona` se normaliza con los datos de aspirante/persona y `user.estudiante` referencia `detalle.estudiante`, por lo que los consumidores actuales vuelven a recibir el identificador local del estudiante.

### 2026-08-17 — Consultas de aspirantes con nombres desagregados

- Los contratos frontend de `GET /aspirante`, `GET /aspirante/{id}` y `GET /aspirante/consultaInfo` consumen `nombre1`, `nombre2`, `apellido1` y `apellido2`; ya no esperan el campo único `nombre`.
- El servicio de admisiones expone consultas tipadas para el listado, el detalle por identificador y la información del aspirante actual, manteniendo el envelope `{ ok, message, data }`.
- Para presentar el nombre se dispone de un compositor que concatena únicamente las partes informadas, sin reconstruir ni persistir un campo de contrato obsoleto.

### 2026-08-17 — Creación de estudiantes al cerrar una convocatoria

- El detalle de una convocatoria cerrada muestra a coordinación, secretaría y administración una sección para crear estudiantes a partir de los aspirantes con estado `ADMITIDO`.
- Cada creación solicita los dos datos institucionales obligatorios y ejecuta `POST /estudiantes` con `{ idAspirante, codigoUIS, emailInstitucional }`; ya no se envían programa, período, correo personal ni los nombres antiguos de los campos.
- La UI consume el objeto de estudiante retornado en `data`, muestra el código UIS confirmado y bloquea una segunda creación para ese aspirante durante la sesión actual. El backend continúa siendo responsable de la unicidad definitiva.

### 2026-08-17 — Nombres de aspirante desagregados para el IDP

- El formulario de creación reemplaza el campo único **Nombre** por **Primer nombre**, **Segundo nombre**, **Primer apellido** y **Segundo apellido**.
- Primer nombre y primer apellido son obligatorios; segundo nombre y segundo apellido son opcionales.
- `POST /api/sapp/aspirante` ya no envía `nombre`: el contrato vigente usa `{ nombre1, nombre2, apellido1, apellido2, tipoDocumentoIdentificacionId, numeroDocumento, emailPersonal, numeroInscripcionUis, telefono, observaciones, programaId, convocatoriaAdmisionId }`. Los campos opcionales de nombre se normalizan a `null` cuando quedan vacíos.

### 2026-08-17 — Error al crear aspirantes sin abandonar la convocatoria

- `POST /api/sapp/aspirante` desactiva la invalidación/redirección automática ante 401/403: el modal permanece abierto, conserva los datos digitados y muestra el error devuelto por el backend.
- El cliente HTTP presenta tanto `message`/`error` como listas o mapas `errors` de validación, facilitando identificar rechazos por datos duplicados, contrato, permisos o reglas de convocatoria.
- Una falla que persista debe verificarse en Network y logs backend; el frontend ya no oculta la causa navegando al inicio.

### 2026-08-17 — Acceso gestionado fuera de la SPA

- Se retiraron el formulario/ruta de login, el login de aspirantes y el portal documental de aspirantes; `/login`, `/login/aspirante` y `/aspirante/*` ya no tienen rutas propias y caen en el fallback hacia `/`.
- El inicio de sesión institucional continúa resolviéndose automáticamente mediante el API Gateway/IDP al montar la aplicación. Desde 2026-09-03, el sidebar vuelve a ofrecer una salida local que limpia el estado del origen y recarga la SPA; no se reintrodujo una pantalla de login interna.
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

### 2026-06-12 — Marca EISI/UIS (actualizada 2026-09-08)

- Se reemplazó el favicon de Vite por el logo EISI PNG en `public/brand/eisi imagen.png`; `index.html` lo sirve como `/brand/eisi%20imagen.png` con MIME `image/png`.
- El sidebar muestra el logo EISI PNG tanto contraído como expandido y presenta la marca completa `Minerva | Posgrados` al expandirse; en móvil ambos permanecen visibles. El logo conserva `object-fit: contain` y `border-radius: 9px`.
- El encabezado de módulos presenta el logo UIS y el logo EISI con altura responsiva concordante. EISI usa `/brand/eisi%20imagen.png` y la clase `module-layout__institutional-logo--eisi` con `border-radius: 12%`; UIS conserva `public/brand/LOGO UIS_PNG.png` sin ese radio.
- El título vigente del documento es `Minerva | Posgrados`; el idioma HTML permanece configurado en español.

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
- Docentes disponibles para una convocatoria: `GET /api/sapp/docentes/estado?skip=0`; cada elemento contiene `{ existeEnSapp: boolean, id: number | null, nombre: string, uuid: string }`.
- Asociación de evaluadores: `POST /api/sapp/evaluadorConvocatoria` por cada docente seleccionado, con `{ evaluadorUuid: string, convocatoriaId: number }`.
- Edición de fechas de convocatoria: `PUT /api/sapp/convocatoriaAdmision/fechas/{convocatoriaId}` con al menos uno de `{ fechaInicio?: 'YYYY-MM-DD', fechaFin?: 'YYYY-MM-DD' }`; la respuesta esperada conserva el envelope `{ ok, message, data }`.
- Aspirantes: `POST /api/sapp/aspirante` desde el navegador con nombres desagregados en `nombre1`, `nombre2`, `apellido1` y `apellido2`.
- Estudiantes desde admisiones: `POST /api/sapp/estudiantes` desde el navegador con `{ idAspirante: number, codigoUIS: string, emailInstitucional: string }`. La respuesta exitosa usa el envelope habitual y `data` contiene `{ id, cohorte, estado, codigoEstudianteUis, fechaIngreso, fechaEgreso, idAspirante, foto }`.
- Archivo integral de un estudiante: `GET /api/sapp/estudiantes/{estudianteId}/documentos/zip`; responde binario `application/zip` y puede incluir `Content-Disposition: attachment` con `filename*` UTF-8. No se debe intentar interpretar la respuesta como JSON ni Base64.
- Inscripciones por convocatoria: `GET /api/sapp/inscripcionAdmision/convocatoria/{convocatoriaId}` desde el navegador. Cada elemento puede incluir `idPersona: number | null`; un valor numérico indica que el aspirante ya existe como estudiante y bloquea una nueva creación.
- Documentos: operaciones de checklist/prefetch y validación mediante servicios de documentos existentes.
- Archivo de un acta: `GET /api/sapp/actas/{actaId}`; el path usa `ActaDto.id`, no `documentoContenidoId`. Se espera el envelope `{ ok, message, data }`, con `data.contenidoBase64`, `data.mimeType` y `data.nombreArchivo` para visualizar o descargar el PDF.
- Aprobación de solicitud: `PUT /api/sapp/solicitudesAcademicas/cambioEstado/{solicitudId}?siglaEstado=APROBADA&actaId={actaId}` sin body. `actaId` se obtiene de `GET /api/sapp/actas` y debe corresponder a la instancia del estado anterior (`tipoConsejo: null` para Comité, `true` para Consejo); las solicitudes OTRA pueden añadir `enviarConsejo=true`.
- Informe de admision generado: `POST /api/sapp/reportesAdmision/generar?actaId={actaId}&convocatoriaId={convocatoriaId}` sin body. La respuesta esperada es el contenido binario del PDF (`%PDF-1.4...`) como `Blob`; no parsear como JSON. Si el backend envia `Content-Disposition`, se usa ese nombre de archivo; si no, el fallback es `informe-admision-acta-{actaId}-convocatoria-{convocatoriaId}.pdf`.
- Login institucional: `GET /api/sapp/inicio`, sin body, envelope `{ ok, message, data }`. Además de los campos de identidad superiores, `data.detalle` contiene `{ aspirante, docente, estudiante, persona }`. `detalle.persona.id` alimenta `session.user.persona.id`, `detalle.estudiante?.id` alimenta `session.user.estudiante?.id` y el detalle completo queda disponible en `session.user.detalle`; no usar el `data.id` superior como sustituto de esos identificadores de dominio.

## Notas visuales de marca

- Mantener compatibilidad con tokens CSS globales y modo claro/oscuro.
- Evitar colores hardcodeados en componentes nuevos cuando exista token semántico equivalente.
- Los logos institucionales agregados en `public/brand` se sirven desde `public` y no requieren imports desde TypeScript; el logo EISI vigente es el PNG `/brand/eisi%20imagen.png`.

### 2026-09-08 — Iconografía unificada entre sidebar e inicio

- Las tarjetas de acceso rápido de **Inicio** usan ahora exactamente los iconos definitivos del sidebar para Solicitudes, Matrícula, Estudiantes, Admisiones, Informes a dependencias, Actas y Fechas.
- `SidebarModuleIcon` centraliza tanto los trazos propios como los iconos Lucide de los módulos; sidebar e inicio consumen esa única fuente para evitar que vuelvan a divergir.
- Los iconos del inicio heredan `--primary` y conservan trazos vectoriales nítidos en modo claro y oscuro. No se modificaron rutas, permisos, contratos HTTP, dependencias, seeds ni datasets.
