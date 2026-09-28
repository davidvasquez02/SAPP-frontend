# Banco manual de matrícula financiera

Ejecutar `npm run dev` y abrir `/tests/fixtures/matricula-financiera/preview.html` en el servidor local.

Esta página monta los componentes reales con una sesión ficticia y un transporte en memoria. No llama al backend: toda petición fetch se resuelve localmente. Recargar reinicia los datos. No es una prueba de normativa, cálculo financiero, gateway ni autorización del backend.

Recorrido: responder como estudiante nuevo; cambiar a coordinación; abrir un detalle; registrar respuestas, ajustes, excluir/reincluir y marcar; cargar/reemplazar el archivo `certificado-prueba.txt`; revisar el resultado de envíos; cerrar/publicar; volver a estudiante y revisar solo lectura. Hay 26 filas iniciales para probar paginación y lotes. Tarifas y alta manual tienen respuestas simuladas. Cambiar tema permite comprobar los tokens claro/oscuro.

La página es una entrada de desarrollo separada. No forma parte de `src/main.tsx` ni de la compilación de producción.
