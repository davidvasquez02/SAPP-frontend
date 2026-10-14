# Verificación de la entrega

**Fecha: 10 de octubre de 2026, America/Bogota.**

## Alcance comprobado

Lectura de código/configuración en las cuatro rutas indicadas. El manifiesto [evidencias.json](evidencias.json) contiene 149 referencias, agrupadas en 22 evidencias, con SHA-256. [referencias.md](referencias.md) permite abrirlas. El documento reemplaza las conclusiones obsoletas del borrador del 9 de octubre, sin mezclar otras copias de backend.

No se enviaron correos, ejecutaron migraciones ni consultaron servicios institucionales/base real. Las escrituras de esta tarea se limitaron a documentación y logs. La ejecución de TypeScript puede actualizar su caché de compilación ignorada; no se editaron fuentes ni dependencias.

## Resultados nuevos, separados de los históricos

| Comando / comprobación | Resultado de esta revisión | Evidencia |
|---|---|---|
| node --test --test-isolation=none tests/*.test.ts tests/*.test.mjs | PASS: 168 pruebas, 0 fallos; duración reportada 17.654 s | [Log de pruebas](logs/frontend-tests.txt) |
| npm run build | FAIL, salida 1: TypeScript completó; Vite falló cargando configuración | [Log de build](logs/frontend-build.txt) |
| npm run lint | FAIL, salida 1: 9 errores y 1 advertencia | [Log de ESLint](logs/frontend-lint.txt) |
| node --version / npm --version | v24.11.0 / 11.6.1 | Salida observada de terminal; reproducible |
| java -version | Java 17.0.2 en PATH | Salida observada; proyectos requieren 21 |
| Pruebas/build Java | No ejecutados | JDK activo incompatible; tampoco se preparó infraestructura |
| Prueba SSR de tests/integration | No ejecutada | Fuera de la suite ligera; Vite mostró problemas de entorno |
| Build/lint portal público | No ejecutados | Se revisaron fuentes/lockfile/configuración, sin preparar otro entorno |
| Recorridos completos con IAM y datos | No ejecutados | No se contó con un entorno integral de prueba confirmado |

El build ejecuta tsc -b && vite build. Haber llegado a Vite acredita el éxito de esa invocación de TypeScript, no de todo el empaquetado. El log registra spawn EPERM en externalize-deps y error de carga de @swc/core-win32-x64-msvc con “stream did not contain valid UTF-8”. Se conserva el diagnóstico sin atribuir con certeza una única causa. No se intentó corregirlo porque el encargo prohíbe modificar código y no requiere reparar dependencias.

Los errores ESLint corresponden a fuentes preexistentes: reglas de hooks, variables sin uso e interfaces vacías; hay advertencia de dependencia de efecto. No se modificaron esos archivos. npm también advierte sobre configuraciones heredadas msvs_version/python.

## Qué prueban las pruebas existentes

Se identificaron 53 archivos de prueba frontend, 70 clases Java de prueba de B y una clase de contexto de U. Son inventarios de archivos, no cobertura ni casos ejecutados. Las 168 pruebas son únicamente la suite principal indicada.

Ejemplos inspeccionados:

- estadoSolicitud y matriculaFinancieraRules: reglas puras de presentación/normalización.
- solicitudDetalleAutorizacion: protección de interfaz comprobada con inspección de código; no demuestra autorización HTTP de Java.
- reportesFaltantes: servicios/parser con respuesta HTTP simulada.
- administracionAcademicaRoutes: montaje SSR y rutas reales, separado de la suite ligera.
- AuthServiceTest e InfrastructureHeadersFilterTest: identidad/filtro mediante dependencias de prueba.
- MatriculaAcademicaServiceTest y SolicitudesAcademicaServiceTest: reglas del proceso.
- MiLiquidacionServiceTest: datos de la sesión, visibilidad y respuestas.
- EventoCorreoServiceTest: resolución de destinatarios, éxito, fallos y continuidad del lote.
- SappPublicApplicationTests: arranque de contexto; no constituye una batería de pruebas del flujo público.

No se calculó cobertura, rendimiento o carga. Los PASS de otras fechas en README/HANDOFF siguen siendo históricos.

## Controles documentales

Se verifican existencia de referencias, hashes de los 149 archivos, enlaces locales, número de diapositivas/preguntas y correspondencia exacta entre seis fuentes .mmd y sus bloques en diagramas.md. Los resultados de esos controles se guardan en [verificacion-documental.json](verificacion-documental.json).

No se ejecutó un renderizador Mermaid. Las fuentes son editables; deben abrirse en el visor elegido antes de exportar figuras finales. Los diagramas de despliegue muestran artefactos/configuración y el ER es un subconjunto lógico, no certificación de la base activa.

## Reproducción y continuidad

Reutilizar node_modules y package-lock.json del frontend institucional. No crear venv, Conda, Poetry ni otro árbol npm para esta revisión. No ejecutar SQL de distintas etapas indiscriminadamente.

Para Java, seleccionar un JDK 21 ya disponible o preparar uno en una tarea de entorno; después revisar configuración de pruebas y usar el Maven Wrapper 3.9.11. El comando de backend no fue ejecutado aquí, por lo que no hay PASS/FAIL de compilación Java.

Las fuentes documentales son Markdown y Mermaid. La propuesta de ocho diapositivas incluye notas, pero no se exportó PPTX porque se solicitó una propuesta textual. No se generaron PDF ni se publicaron resultados.
