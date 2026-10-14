# Entrega técnica de SAPP para trabajo de grado

**10 de octubre de 2026.** Análisis de los cuatro proyectos indicados: frontend institucional, portal público, backend principal y backend público. Se revisaron código, SQL, pruebas y configuración.

1. [Documento técnico](documento-tecnico.md): alcance, arquitectura, versiones, backend, frontend, datos, acceso, tres trámites, archivos/correo, operación y límites.
2. [Diagramas Mermaid](diagramas.md): contexto, componentes, despliegue declarado, entidades, sesión institucional y homologación; seis fuentes .mmd editables.
3. [Sustentación](sustentacion.md): ocho diapositivas con notas, guion de unos cinco minutos, doce preguntas/respuestas y conceptos.
4. [Información pendiente](informacion-pendiente.md): preguntas concretas para cerrar lo que no se deduce del código.
5. [Referencias](referencias.md) y [manifiesto SHA-256](evidencias.json): 149 archivos en 22 grupos.
6. [Verificación y logs](verificacion.md): resultados nuevos y límites de ejecución.

Esta entrega sustituye el borrador del 9 de octubre. El backend actual sí incluye liquidación, evaluación de trabajos de grado, historial y notificaciones. La identidad y los contratos se corrigieron conforme a las fuentes actuales.

**Validación:** 168/168 pruebas frontend PASS; TypeScript completó, pero Vite falló en este entorno; lint reportó 9 errores y 1 advertencia. No se ejecutaron pruebas Java ni integración institucional. Las fuentes Mermaid no se renderizaron. No se modificó código de aplicación.
