const MARCADOR_ENCABEZADO = '{{encabezado}}'
const MARCADOR_PIE = '{{pie}}'

const BLOQUE_AUTOMATICO = (texto: string) =>
  `<div style="margin:8px 0;padding:10px 12px;border:1px dashed #438213;border-radius:6px;background:#f2f8ec;color:#2b5a0e;font:12px Arial,Helvetica,sans-serif;">${texto}</div>`

const PREFACIO = '<!doctype html><html><head><meta charset="utf-8"></head>' +
  '<body style="margin:0;padding:12px;background:#eef0f2;font-family:Arial,Helvetica,sans-serif;">'

/**
 * Arma el documento de la vista previa. El encabezado y el pie se muestran como bloques
 * automaticos, porque el sistema los agrega al enviar. Las variables se resaltan.
 */
export const construirVistaPrevia = (html: string): string => {
  const conBloques = html
    .split(MARCADOR_ENCABEZADO).join(BLOQUE_AUTOMATICO('Encabezado general (se agrega automáticamente)'))
    .split(MARCADOR_PIE).join(BLOQUE_AUTOMATICO('Pie general (se agrega automáticamente)'))
  const resaltado = conBloques.replace(/\{\{(\w+)\}\}/g,
    '<mark style="background:#fff3c4;padding:0 2px;border-radius:3px;">{{$1}}</mark>')
  return `${PREFACIO}${resaltado}</body></html>`
}

/** Nombres de las variables {{var}} usadas, sin los marcadores de encabezado y pie. */
export const extraerVariables = (texto: string): string[] => {
  const nombres = new Set<string>()
  for (const coincidencia of texto.matchAll(/\{\{(\w+)\}\}/g)) {
    if (coincidencia[1] !== 'encabezado' && coincidencia[1] !== 'pie') nombres.add(coincidencia[1])
  }
  return Array.from(nombres)
}
