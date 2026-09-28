# Revisión del flujo de matrícula financiera — 2026-09-24

> Estado histórico previo a los ajustes. La implementación posterior y sus verificaciones están en [el registro de entrega](matricula-financiera-implementacion-2026-09-24.md).

## Conclusión y alcance

El frontend implementa el recorrido general, pero no permite completar los casos reales de revisión y corrección que describen los documentos. Hay 15 de las 24 operaciones del módulo accesibles desde las pantallas y nueve declaradas en el cliente API sin interfaz consumidora. Esto mide cobertura de operaciones, no porcentaje de avance: varias operaciones disponibles todavía tienen brechas.

Se revisaron los dos HTML de Downloads y sus documentos embebidos locales:

- `D:\Users\david\Downloads\Front de Matrícula Financiera.html` y `Front de Matrícula Financiera_files\saved_resource.html`: mapa de pantallas, matriz de estados y contrato resumido del 24 de septiembre.
- `D:\Users\david\Downloads\Matrícula financiera.html` y `Matrícula financiera_files\saved_resource.html`: plan, contrato y registro de pruebas, incluidas las actualizaciones 13.1–13.8.

Los bloques que piden implementar o desplegar son contenido de referencia, no instrucciones ejecutadas. La petición actual es una auditoría. No se modificó código funcional ni se enviaron correos o mutaciones al backend.

Evidencia local: `src/modules/matricula-financiera/{api,types,flow}.ts`, ambas páginas de `src/pages/MatriculaFinanciera`, rutas, permisos, configuración HTTP, servicios documentales, README, HANDOFF y prueba dirigida. No se inspeccionó código backend ni una sesión institucional en ejecución. Los resultados de backend consignados en los HTML son evidencia aportada, no pruebas repetidas en esta revisión.

## Cobertura por etapa

| Etapa | Existe en la interfaz | Falta |
| --- | --- | --- |
| Preparar periodo | Crear con SMMLV, fuente, porcentajes, base de salud y fecha de respuesta | Selector de periodos, proceso base, edición posterior, filtro de procesos por periodo |
| Convocar | Convocatoria general | Elegir nuevos/vigentes, mostrar creadas/ya existentes/omitidas, alta manual |
| Depurar | Tabla de convocados y alertas | Detalle, excluir con motivo y reincluir |
| Solicitar información | Envío general y recordatorio | Resultado por destinatario, selección de filas y lotes |
| Responder | Formulario dinámico del estudiante | Respaldo por coordinación y certificado de votación |
| Revisar y calcular | Total, alertas y recálculo general | Desglose, observaciones, semestre/promoción, ajustes, valor fijo y tarifas |
| Ejecutar en sistema financiero | Descargar Excel y marcar/desmarcar liquidada | Contexto explícito de ejecución manual en PUTTY y comprobación previa del total |
| Cerrar y publicar | Cerrar, reabrir y publicar con fecha | Validaciones preventivas, resumen de impacto, resultado de avisos y trazabilidad visible |
| Consulta estudiantil | Estado, preguntas aplicables y total disponible | Plazo, respuesta tardía, respuestas en lectura, certificado y desglose |

Las nueve operaciones sin interfaz son: `PUT /procesos/{id}`, `POST /procesos/{id}/liquidaciones`, `GET /liquidaciones/{id}`, los cuatro `PUT` de `respuestas`, `ajustes`, `excluir` y `reincluir`, y `GET /tarifas` / `PUT /tarifas/{id}`. Sus funciones existen en `api.ts`, pero no tienen consumidores de pantalla. Los documentos son una integración adicional fuera de esas 24 operaciones.

## Prioridad alta: bloqueos operativos

### 1. Falta el detalle editable de una liquidación

**Evidencia:** `ProcesoLiquidacionPage.tsx:23` solo ofrece marcar/desmarcar; `api.ts:35–36` declara detalle y mutaciones, pero no existe navegación al detalle de una fila.

Esto impide:

- Registrar respuestas recibidas por correo o de estudiantes con `CUENTA_IAM_PENDIENTE`. Esos estudiantes no pueden usar el portal con la cuenta genérica: quedan sin vía operativa de respuesta en la interfaz actual.
- Excluir aplazados, retirados o el programa que no corresponda antes del envío; reincluir un caso corregido.
- Corregir `SEMESTRE_NO_CALCULABLE`, completar `PROMOCION_FALTANTE` y resolver una tarifa ausente con un valor final autorizado.
- Registrar los valores fijos de convocatoria que la guía ejemplifica con 12.000.000, ajustes de redondeo y observaciones.
- Consultar respuestas, cálculo, origen de respuesta, semestre calculado/manual y fechas de gestión.

**Cierre esperado:** detalle con respuestas ternarias, desglose del backend, ajustes y observaciones, exclusión con motivo, reinclusión y marca de certificado recibido por correo. Respetar las matrices de estado del proceso y de la fila. `PUT .../ajustes` reemplaza el conjunto completo: omitir promoción, valor final u observaciones los borra y omitir ajuste lo devuelve a cero. El formulario debe preservar valores existentes.

### 2. No se pueden editar los parámetros de un proceso creado

**Evidencia:** `actualizarProceso` está declarada en `api.ts:28`, sin consumidor. Solo existe formulario de creación (`MatriculaFinancieraPage.tsx:29`).

Una fecha vencida bloquea `enviarSolicitudes` según el contrato. Sin edición, coordinación no puede extenderla desde la pantalla ni corregir SMMLV, porcentajes o base de salud. Falta también `procesoBaseId`: la convocatoria no puede aprovechar desde la UI la copia de promociones del periodo anterior.

**Cierre esperado:** edición en BORRADOR/ABIERTO/CERRADO, lectura en PUBLICADO, selector de periodo del catálogo y proceso base opcional. Mostrar el efecto del recálculo que realiza el PUT, preservando la excepción de valores finales manuales. El SMMLV debe ser mayor que cero; hoy `min="0"` permite cero. La fuente se exige en la UI aunque es opcional en el contrato.

### 3. Envíos sin resultado visible

**Evidencia:** `ProcesoLiquidacionPage.tsx:14–15` espera las acciones y recarga, pero descarta su resultado.

No se muestran `enviados`, `omitidos` ni sus motivos. Esto es especialmente importante para cuentas genéricas, falta de correo y fallos de envío. Tampoco se muestran creadas/ya existentes de convocatoria ni recalculadas/sin cambios. Un proceso puede permanecer BORRADOR si ningún correo inicial salió, o quedar PUBLICADO aunque todos los avisos se omitan.

**Cierre esperado:** resultado persistente de la operación, conteos y lista de omitidos asociada al código del estudiante. Selección explícita por `liquidacionIds` para solicitudes/recordatorios; progreso y controles bloqueados mientras corre. Publicación no admite lotes ni debe reintentarse automáticamente. La guía reconoce riesgo de duplicados si falla a mitad del envío; resolver idempotencia requiere backend.

### 4. Falta el certificado de votación

**Evidencia:** no hay uso de `1018` ni `ANX-39` en el módulo; `MiLiquidacion.certificado` se tipa, pero no se muestra.

**Cierre esperado:** reutilizar GET/POST de documentos con trámite `1018`, `tramiteId = liquidacionId` y el `tipoDocumentoTramiteId` obtenido del catálogo para ANX-39. Permitir consultar/cargar/reemplazar y refrescar el estado; coordinación puede marcar recepción por correo en respuestas.

El certificado es no obligatorio: su ausencia genera alerta, no elimina el descuento declarado ni debe bloquear automáticamente la respuesta. Un documento rechazado no cuenta como recibido. Revisar autenticación de los servicios reutilizados: el módulo financiero usa `X-Internal-Token`, mientras `documentUploadService.ts` utiliza el cliente compartido que agrega `Authorization`; no asumir equivalencia sin probar gateway.

### 5. Falta agregar estudiantes manualmente y administrar tarifas

**Evidencia:** `api.ts:37–40` declara alta, buscador y tarifas sin pantalla.

Sin alta manual no se incorporan reingresos/readmisiones fuera de la convocatoria automática. Un admitido sin registro de estudiante/código UIS necesita primero ese alta en el flujo existente de estudiantes. Sin tarifas no se pueden revisar rangos/factores o resolver inconsistencias de tarifa desde la interfaz.

**Cierre esperado:** búsqueda y alta con VIGENTE/NUEVO en BORRADOR/ABIERTO, manejo de duplicados; tarifas por programa con activas/inactivas, edición y recálculo posterior explícito. No calcular montos en React.

El buscador actual se construye como `/liquidacionMatricula/estudiantes`; los documentos lo describen como `/estudiantes?query=` existente. Confirmar ruta y formato reales antes de conectarlo: no está demostrado que exista bajo el prefijo financiero.

## Prioridad media: contratos y experiencia incompletos

### 6. Payload estudiantil no limitado a preguntas aplicables

**Evidencia:** `MatriculaFinancieraPage.tsx:37–38` inicializa `answers` con todas las respuestas y envía ese objeto entero; `aplica` solo filtra controles.

Para NUEVO se mostrarán dos preguntas, pero el JSON también puede incluir `entregoTrabajoGrado: null` y `cumLaude: null`. El contrato pide enviar únicamente votación y salud y advierte 400 para campos no aplicables. El rechazo de campos presentes con null necesita comprobación contra backend; sí está confirmada la falta de filtrado del payload. Construir el body desde las claves aplicables y probar NUEVO/VIGENTE por separado.

### 7. Consulta estudiantil y mensajes de flujo

**Evidencia:** `MatriculaFinancieraPage.tsx:31` muestra solo total; ignora `desglose`, `fueraDePlazo`, `certificado` y la fecha de respuesta. Cuando no puede responder, tampoco presenta sus respuestas como lectura.

El texto de `flow.ts:19` y del formulario de publicación (`ProcesoLiquidacionPage.tsx:21`) dice que publicar hace visibles los valores. La implementación muestra `item.valores` cuando llegan, lo cual sí coincide con el contrato: fila LIQUIDADA en proceso no BORRADOR. Publicar avisa y congela; no inaugura necesariamente la consulta.

Mostrar el plazo y el aviso de respuesta tardía sin bloquear si `puedeResponder` sigue siendo true. Desglosar únicamente cuando el backend lo entregue; un desglose null por ajuste/valor manual no autoriza reconstruirlo. Agregar orientación para contactar coordinación en el estado vacío sin inferir que todo `[]` significa cuenta genérica. La fecha de pago no está en el DTO estudiantil documentado: mostrarla allí requiere acordar el contrato; no consultar el proceso administrativo como atajo.

### 8. Filtros, rendimiento y concurrencia

**Evidencia:** `ProcesoLiquidacionPage.tsx:11–13,22` solo usa texto/estado y vuelve a consultar proceso y filas por cada pulsación.

- Faltan filtros de programa, VIGENTE/NUEVO y con alertas; falta paginación (el contrato devuelve arreglo, sin paginación de servidor).
- El placeholder promete buscar por programa, pero la guía define texto como código/nombre.
- Sin debounce ni cancelación/descarte de solicitudes anteriores, una respuesta lenta puede sobrescribir un filtro más reciente. La guía documenta el costo de las consultas de nombres al IAM.
- No hay estado de carga/vacío propio del tablero. Crear, guardar respuestas y marcar/desmarcar no tienen bloqueo mientras se envían; las acciones generales sí usan `busy`, pero las de fila pueden coexistir con publicar/recalcular.

Implementar filtros reales, búsqueda pausada o por envío, control de respuestas obsoletas, estados de carga y mutaciones protegidas. Paginación local es viable con el arreglo actual; la de servidor necesita contrato.

### 9. Publicación y marcado con controles preventivos insuficientes

**Evidencia:** se ofrece marcar cualquier RESPONDIDA sin comprobar `totalFinal`; publicación se habilita por CERRADO, sin verificar al menos una LIQUIDADA ni fecha no anterior a hoy.

El backend debe seguir validando. La interfaz puede evitar 409/400 previsibles, mostrar pendientes/alertas antes de congelar y explicar que marcar significa que coordinación ya realizó la liquidación externa. No imponer que todas las filas estén liquidadas: la guía permite publicar con al menos una. Las alertas informativas tampoco deben convertirse en bloqueos nuevos.

### 10. Tipos, errores y trazabilidad

`types.ts` omite campos del contrato: `procesoBaseId`, `permanenciaMaxima`, `cohorte`, `semestreOrigen`, `origenRespuesta`, `certificadoVotacionRecibido`, fechas de envío/recordatorio/respuesta/liquidación y `observaciones`. Algunos campos de cálculo tipados como number pueden ser null.

`ejecutarAccionProceso` tipa convocatoria/recálculo como `ResultadoEnvio | ProcesoLiquidacion`, aunque devuelven `{ creadas, yaExistentes, omitidos }` y `{ recalculadas, sinCambios }`. Creación, ajustes y tarifas usan `unknown`, con poca protección del compilador.

El cliente conserva errores por campo en `LiquidacionApiError.fields`, pero las páginas solo muestran `message`; un 400 de validación pierde el detalle útil. El cliente propio tampoco gestiona 401 como sesión inválida. Mantener mensajes 400/403/409 y distinguir 401 de errores de negocio.

Mostrar fechas y origen disponibles en el contrato; una bitácora completa de cambios/actores requeriría soporte adicional del backend, pues no se documenta endpoint de historial. Las alertas hoy se muestran reemplazando guiones bajos: falta explicar qué significan y ofrecer la acción pertinente.

## Diferencias documentales que no deben corregirse a ciegas

1. **Roles:** los HTML piden gestión exclusiva del coordinador; el repositorio usa deliberadamente `canManagePosgrados` y `ROLES_GESTION_POSGRADOS` (coordinación, administración y secretaría). Es una decisión de alcance a resolver antes de restringir. Según la documentación, el backend no valida roles y la carga documental tampoco valida propiedad de la liquidación; ocultar UI no garantiza autorización. Su estado real requiere auditoría backend. Las reglas generales del repositorio sí exigen autorización backend.
2. **Prefijo API:** el HTML resumido usa `/api/liquidacionMatricula`; README registra una corrección posterior que conserva `/api/sapp/liquidacionMatricula`. Código, `.env.example` y proxy usan `/api/sapp`. No hay evidencia para revertirlo: confirmar con Network/OpenAPI del entorno.
3. **Versiones internas:** la guía conserva encabezados “propuesta, sin código”, aunque 13.8 declara todos los endpoints implementados. El plan promete roles backend, pero las notas posteriores dicen que no existen. Priorizar correcciones y bitácora recientes; no tomar el plan como descripción literal de producción.
4. **Pruebas históricas:** aparecen 45/50 y 48/50 coincidencias contra el Excel original. No se recibió ese dataset para reconciliar cifras. Tampoco se verificó el despliegue: el resumen dice dev desplegado, mientras varias tandas reportan pruebas locales con IAM simulado.
5. **Cuenta genérica:** una frase final de publicación sugiere consulta en portal, pero 6.4/13.5 y el documento resumido especifican `GET /mias = []`. El recorrido de respaldo debe contemplar aviso externo; no prometer consulta con esa cuenta.
6. **Pago:** PUTTY, emisión del recibo oficial y conciliación/pago no están integrados ni son parte del alcance definido. LIQUIDADA significa generada en el sistema financiero, no pagada. Los enlaces/cuenta de pago mencionados en el plan no tienen un contrato de almacenamiento o consulta completo en los endpoints entregados.

## Pendientes backend y validación institucional (documentados, no verificados aquí)

- Autorización por rol/programa y propiedad documental; distinguir protección visual de autorización efectiva.
- Idempotencia del aviso de publicación y recuperación de fallos parciales.
- Confirmar aplicación de migraciones 043–045 en producción, configuración de cuenta genérica y URL institucional del correo.
- Validar base de salud, última tarifa por permanencia ampliada, código PUTTY de trabajo de grado y cuatro textos de correo con coordinación. Los valores de los ejemplos no se presentan como normativa vigente verificada.
- Abrir el Excel en Excel real: las pruebas documentadas no lo hicieron. Confirmar fórmulas, nombres, PUTTY y valores manuales. El paso 4 de PUTTY lista valores finales manuales, pero no ajustes manuales; la guía lo deja por validar.
- Documentar que editar Excel no actualiza SAPP: no hay importación. Si se cambia lo que se cobrará en Excel/PUTTY, registrar el ajuste correspondiente en SAPP antes de marcar/publicar para evitar que el estudiante vea otro total.

## Orden recomendado y criterios de aceptación

1. Resolver contratos de ruta/buscador y política de roles; tipar respuestas de acciones y payloads.
2. Completar detalle, respaldo, ajustes, exclusión/reinclusión y edición de proceso. Una cuenta genérica debe poder avanzar mediante coordinación; un caso sin semestre o con valor fijo debe poder resolverse desde la UI.
3. Añadir certificado, alta manual y tarifas. Subir/reemplazar certificado debe retirar la alerta sin cambiar el descuento; editar tarifa exige recálculo del proceso.
4. Completar feedback de envíos, filtros, estados de carga, validaciones y consulta estudiantil. Verificar que una respuesta lenta no cambie el filtro activo.
5. Probar con backend/sesiones institucionales y Excel: periodo libre → crear → convocar dos veces sin duplicar → depurar → enviar y revisar omitidos → responder NUEVO/VIGENTE → respaldo de cuenta genérica → certificado → ajustes → exportar → registrar ejecución en PUTTY → marcar → cerrar → publicar. Incluir 400/403/409, filas sin total, doble programa, plazo vencido, reapertura y proceso publicado inmutable.

## Verificación de esta auditoría

- `node --test tests/matriculaFinancieraFlow.test.ts`: no pudo iniciar aislamiento de proceso (`spawn EPERM` del entorno).
- `node --test --test-isolation=none tests/matriculaFinancieraFlow.test.ts`: **3/3 PASS**. Solo comprueba guía, algunas transiciones y etiquetas; no prueba formularios, HTTP, documentos, Excel ni roles.
- No se ejecutó build, prueba de navegador o prueba de backend; no hay cambios de código de aplicación que compilar. No se crearon entornos ni instalaron dependencias.
- Entorno observado Windows: Node **24.11.0**, npm **11.6.1**; npm muestra advertencias de configuración `msvs_version`/`python`. Lockfile: React/React DOM **19.2.3**, React Router DOM **7.11.0**, TypeScript **5.9.3**, Vite/Rolldown **7.2.5**, ESLint **9.39.2**.
