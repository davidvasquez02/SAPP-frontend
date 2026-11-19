const MARCADOR_ENCABEZADO = '{{encabezado}}'
const MARCADOR_PIE = '{{pie}}'

/* Bloques informativos: translucidos para no competir con el cuerpo que se edita. */
const BLOQUE_AUTOMATICO = (texto: string) =>
  `<div style="margin:6px 0;padding:6px 10px;border:1px dashed #9aa3b2;border-radius:6px;background:#f4f5f7;color:#7a8290;opacity:0.55;font:11px Arial,Helvetica,sans-serif;text-align:center;">${texto}</div>`

const PREFACIO = '<!doctype html><html><head><meta charset="utf-8">' +
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; form-action \'none\'; base-uri \'none\'"></head>' +
  '<body style="margin:0;padding:12px;background:#eef0f2;font-family:Arial,Helvetica,sans-serif;">'

const EJEMPLOS = new Map([
  ['nombre', 'Laura Gómez'],
  ['nombreAspirante', 'Laura Gómez'],
  ['nombreEstudiante', 'Laura Gómez'],
  ['programa', 'Maestría en Ingeniería de Sistemas'],
  ['fecha', '20 de noviembre de 2026'],
])

export const etiquetaVariable = (nombre: string): string => {
  const texto = nombre.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const conDatosDeEjemplo = (texto: string): string =>
  texto.replace(/\{\{(\w+)\}\}/g, (_, nombre: string) => EJEMPLOS.get(nombre) ?? `[Ejemplo: ${etiquetaVariable(nombre)}]`)

/**
 * Arma el documento de la vista previa. El encabezado y el pie se muestran como bloques
 * automáticos. Los ejemplos se aplican al texto visible y preservan los atributos.
 */
export const construirVistaPrevia = (html: string): string => {
  const cuerpo = html
    .split(MARCADOR_ENCABEZADO).join('')
    .split(MARCADOR_PIE).join('')
  const plantilla = document.createElement('template')
  plantilla.innerHTML = cuerpo
  const walker = document.createTreeWalker(plantilla.content, window.NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const nodo = walker.currentNode as Text
    if (!nodo.parentElement?.closest('script, style, textarea')) nodo.data = conDatosDeEjemplo(nodo.data)
  }
  const encabezado = BLOQUE_AUTOMATICO('Encabezado general (se agrega automáticamente)')
  const pie = BLOQUE_AUTOMATICO('Pie general (se agrega automáticamente)')
  return `${PREFACIO}${encabezado}${plantilla.innerHTML}${pie}</body></html>`
}

/** Nombres de las variables {{var}} usadas, sin los marcadores de encabezado y pie. */
export const extraerVariables = (texto: string): string[] => {
  const nombres = new Set<string>()
  for (const coincidencia of texto.matchAll(/\{\{(\w+)\}\}/g)) {
    if (coincidencia[1] !== 'encabezado' && coincidencia[1] !== 'pie') nombres.add(coincidencia[1])
  }
  return Array.from(nombres)
}
