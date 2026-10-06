const MARCADOR_ENCABEZADO = '{{encabezado}}'
const MARCADOR_PIE = '{{pie}}'

/* Bloques informativos: translucidos para no competir con el cuerpo que se edita. */
const BLOQUE_AUTOMATICO = (texto: string) =>
  `<div style="margin:6px 0;padding:6px 10px;border:1px dashed #9aa3b2;border-radius:6px;background:#f4f5f7;color:#7a8290;opacity:0.55;font:11px Arial,Helvetica,sans-serif;text-align:center;">${texto}</div>`

const PREFACIO = '<!doctype html><html><head><meta charset="utf-8"></head>' +
  '<body style="margin:0;padding:12px;background:#eef0f2;font-family:Arial,Helvetica,sans-serif;">'

/**
 * Arma el documento de la vista previa. El encabezado y el pie se muestran como bloques
 * automaticos, porque el sistema los agrega al enviar. Las variables se resaltan.
 */
export const construirVistaPrevia = (html: string): string => {
  const cuerpo = html
    .split(MARCADOR_ENCABEZADO).join('')
    .split(MARCADOR_PIE).join('')
  const resaltado = cuerpo.replace(/\{\{(\w+)\}\}/g,
    '<mark style="background:#fff3c4;padding:0 2px;border-radius:3px;">{{$1}}</mark>')
  const encabezado = BLOQUE_AUTOMATICO('Encabezado general (se agrega automáticamente)')
  const pie = BLOQUE_AUTOMATICO('Pie general (se agrega automáticamente)')
  return `${PREFACIO}${encabezado}${resaltado}${pie}</body></html>`
}

/** Nombres de las variables {{var}} usadas, sin los marcadores de encabezado y pie. */
export const extraerVariables = (texto: string): string[] => {
  const nombres = new Set<string>()
  for (const coincidencia of texto.matchAll(/\{\{(\w+)\}\}/g)) {
    if (coincidencia[1] !== 'encabezado' && coincidencia[1] !== 'pie') nombres.add(coincidencia[1])
  }
  return Array.from(nombres)
}
