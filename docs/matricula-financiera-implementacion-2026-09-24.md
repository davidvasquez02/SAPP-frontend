# Matrícula financiera — implementación del 24 de septiembre de 2026

## Entrega

Se conectaron a la interfaz las nueve operaciones que faltaban en la auditoría: edición de proceso, alta manual, detalle de liquidación, respuestas de coordinación, ajustes, exclusión, reinclusión y lectura/edición de tarifas. Las 24 operaciones documentadas tienen ahora acceso desde las pantallas. Esto no certifica el backend ni el despliegue.

- Procesos: selector de periodos, prevención visual de duplicados, proceso base opcional, filtros y paginación local; parámetros editables hasta publicar.
- Tablero: filtros de programa/estado/tipo/alertas/texto; búsqueda por envío (evita peticiones por pulsación); 20 filas por página; descarte y cancelación de lecturas anteriores.
- Convocatoria: selección de vigentes/nuevos, conteos de creadas/ya existentes/omitidas. Alta manual mediante catálogo de estudiantes.
- Solicitudes/recordatorios: selección de pendientes, lotes de hasta 25 cuando se seleccionan filas, progreso, resultados acumulados y motivos de omisión. Sin selección se usa el conjunto predeterminado del backend. No hay reintentos automáticos de mutaciones.
- Detalle: respuestas ternarias, respaldo por coordinación, semestre/promoción, ajuste manual, valor final manual y observaciones. Se preservan todos los campos del reemplazo completo de ajustes. Exclusión con motivo y reinclusión por estado.
- Documentos: checklist de trámite 1018, ANX-39, carga/reemplazo con checksum, consulta y descarga. Se usa el ID del catálogo y el ID de liquidación, nunca un ID documental fijo. Una carga bloquea otras escrituras de esa fila mientras se procesa.
- Certificado recibido: el checkbox de coordinación refleja el valor del backend; la marca manual solo se envía si el usuario cambia expresamente ese control, evitando convertir una recepción documental derivada en una marca manual al guardar otras respuestas.
- Tarifas: edición de rango/factores/activo por programa, validaciones básicas y aviso de recálculo posterior.
- Publicación: fecha no anterior al día de Colombia, al menos una LIQUIDADA, confirmación del cierre definitivo, resumen de pendientes/alertas y resultados del aviso. Tras un fallo también se recarga el estado; no se reenvían correos automáticamente.
- Estudiante: solo claves aplicables al enviar; fecha de respuesta y aviso de tardanza sin bloquear si el backend lo permite; respuestas en consulta, certificado, total y desglose solo cuando existe. El texto ya explica que LIQUIDADA permite consultar valores antes de publicar.
- Dinero y fechas: no hay cálculo monetario en componentes; hasta cuatro decimales para visualización. ISO local sin zona conserva fecha/hora; el día actual para validar pago se obtiene en America/Bogota.

## Rutas y archivos

- `/matricula/financiera`: lista/creación o consulta estudiantil según perfil.
- `/matricula/financiera/procesos/:procesoId`: tablero.
- `/matricula/financiera/procesos/:procesoId/liquidaciones/:liquidacionId`: detalle; comprueba pertenencia al proceso.
- `/matricula/financiera/tarifas`: tarifas por programa.
- Servicios y contratos: `src/modules/matricula-financiera/{api,transport,types,rules,hooks,flow}.ts`.
- Componentes y páginas: `src/pages/MatriculaFinanciera/`.
- Protección de nuevas rutas: `src/app/routes/matriculaRoutes.tsx`, reutilizando `ROLES_GESTION_POSGRADOS`.

## Contratos y decisiones conservadas

Se mantiene `VITE_API_URL` sin retirar `/sapp`. El transporte financiero y sus operaciones documentales/catálogos usan `X-Internal-Token` desde la sesión existente. Documentos, estudiantes, programas y periodos se consultan como rutas hermanas del módulo, no debajo de `/liquidacionMatricula`.

Se conservan coordinación, administración y secretaría como perfiles de gestión, conforme a la decisión existente del repositorio. No se cambiaron roles globales ni reglas de cálculo, base de datos o endpoints backend. Los 400 conservan los mensajes por campo; 403/409 conservan el mensaje español sin invalidar sesión; 401 limpia la sesión almacenada.

El frontend no impide publicar por alertas informativas o filas pendientes: la regla documentada exige al menos una LIQUIDADA. Publicar puede terminar con correos omitidos. LIQUIDADA registra la ejecución manual en PUTTY, no un pago. Si se edita Excel, esos cambios deben reflejarse también en SAPP; no hay importación del libro.

## Validación realizada

| Verificación | Resultado |
| --- | --- |
| TypeScript (`tsc -b`) | PASS |
| ESLint en módulo, páginas, rutas y nuevas pruebas | PASS |
| `node --test --test-isolation=none tests/*.test.ts` | 44/44 PASS |
| `npm run build` | PASS; 305 módulos; CSS 243.32 kB; JS 722.53 kB |
| Prueba manual en navegador con transporte simulado | PASS en los recorridos indicados abajo |

Las nuevas pruebas automatizadas cubren serialización NUEVO/VIGENTE y preguntas aplicables, matriz completa de ediciones tras publicación, transiciones por fila, total cero, conservación de valores manuales, fechas, URL/token/documentos, errores 400/401/403/409, Excel binario y ausencia de reintentos ante fallo de red.

Recorridos comprobados mediante controles reales en el navegador y datos ficticios: guardar dos respuestas de NUEVO y cuatro de VIGENTE por coordinación; corregir semestre/promoción y valor final cero; excluir/reincluir; marcar liquidada; cargar y reemplazar certificado (versiones 1 y 2); agregar estudiante; enviar 26 seleccionados en dos lotes y mostrar omitidos; editar parámetros; cerrar/publicar con avisos omitidos; comprobar edición deshabilitada y consulta estudiantil; editar tarifa; crear proceso desde catálogo y proceso base. Inspección visual en claro/oscuro en el navegador integrado. Sin errores de consola observados.

El banco manual está en `tests/fixtures/matricula-financiera/preview.html`, con datos en memoria y un certificado ficticio. Se abre con Vite en `/tests/fixtures/matricula-financiera/preview.html`; reemplaza `window.fetch` solo en esa página y no contacta APIs reales. No se importa desde la aplicación ni se incluye en la entrada de producción. Es una simulación de interacción, no una implementación del backend ni una prueba de cálculo o del Excel real. Recargar reinicia los datos.

Entorno: Windows/PowerShell, Node 24.11.0, npm 11.6.1. Lockfile sin cambios: React/DOM 19.2.3, Router 7.11.0, TypeScript 5.9.3, Vite/Rolldown 7.2.5 y ESLint 9.39.2. Se reutilizó `node_modules`; no hubo instalaciones ni entornos adicionales. Vite necesitó ejecución fuera del sandbox por `spawn EPERM`. Persisten avisos npm `msvs_version`/`python` y aviso de chunk JS mayor de 500 kB.

## Pendiente de validación integrada y backend

1. Confirmar con sesión institucional el buscador `/estudiantes?query=` con `{ id, codigoNombre }`, el gateway `/api/sapp`, el código ANX-39 del checklist y la aceptación de `X-Internal-Token` en catálogos/documentos. Se implementaron los contratos aportados; la prueba local no confirma su despliegue real.
2. Comprobar permisos backend por rol/programa y propiedad documental. Las barreras de interfaz no sustituyen autorización del servidor.
3. Validar idempotencia y recuperación de publicación parcial, migraciones, plantillas, IAM y códigos PUTTY en el backend. Este repositorio no contiene esas implementaciones.
4. Abrir el Excel real y confirmar los cálculos/fórmulas y el procedimiento de ajustes con coordinación. La exportación frontend continúa descargando el binario del servidor.
5. Probar con dos programas/cuentas reales, plazo vencido, sesión expirada, documento rechazado, tarifas sin coincidencia y fallos de red reales. La fecha de pago en la consulta estudiantil y una bitácora de cambios completa requieren ampliar el contrato si se solicitan.

No hubo cambios sobre datos institucionales, correos reales, despliegues ni integración con PUTTY.
