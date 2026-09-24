import type { ReactNode } from 'react'
import type { Omision } from '../../modules/matricula-financiera/types'
import { ALERTAS, money } from '../../modules/matricula-financiera/rules'

export function Aviso({ error, message }: { error?: string; message?: string }) {
  return <>{error && <div className="mf-notice mf-notice--error" role="alert">{error}</div>}{message && <div className="mf-notice" role="status">{message}</div>}</>
}
export function Alertas({ alertas }: { alertas: string[] }) {
  return <>{alertas.map(a => <span className="mf-alert" key={a}>{ALERTAS[a] ?? a.replaceAll('_', ' ')}</span>)}</>
}
export function Importe({ titulo, valor }: { titulo: string; valor?: number | null }) {
  return <div className="mf-value"><dt>{titulo}</dt><dd>{money(valor)}</dd></div>
}
export function ResultadoOperacion({ titulo, children, omitidos = [], codigos = {} }: { titulo: string; children?: ReactNode; omitidos?: Omision[]; codigos?: Record<number, string> }) {
  return <section className="mf-card" aria-label="Resultado de la operación"><h2>{titulo}</h2><div role="status">{children}</div>{omitidos.length > 0 && <><h3>Omitidos ({omitidos.length})</h3><ul>{omitidos.map((o, i) => <li key={`${o.estudianteId}-${i}`}><strong>{codigos[o.estudianteId] ?? `Estudiante #${o.estudianteId}`}</strong>: {o.motivo}</li>)}</ul><p>Revisa los motivos antes de realizar otro envío.</p></>}</section>
}
export function Paginacion({ pagina, total, onChange }: { pagina: number; total: number; onChange: (page: number) => void }) {
  const totalPaginas = Math.max(1, total)

  return (
    <nav className="mf-pagination" aria-label="Paginación de matrícula financiera">
      <button type="button" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}>
        Anterior
      </button>
      <span aria-live="polite">Página {pagina} de {totalPaginas}</span>
      <button type="button" disabled={pagina >= totalPaginas} onClick={() => onChange(pagina + 1)}>
        Siguiente
      </button>
    </nav>
  )
}
