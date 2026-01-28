import { useEffect, useRef } from 'react'
import { getDocumentosPorTipoTramite } from '../../api/tramiteDocumentService'
import { useAuth } from '../../context/Auth'
import './AspiranteDocumentosPage.css'

const AspiranteDocumentosPage = () => {
  const { session } = useAuth()
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!session || session.kind !== 'ASPIRANTE') {
      return
    }

    if (hasFetchedRef.current) {
      return
    }

    hasFetchedRef.current = true

    const fetchDocumentos = async () => {
      try {
        const documentos = await getDocumentosPorTipoTramite(4)
        console.log('[AspiranteDocumentos] documentos:', documentos)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('[AspiranteDocumentos] error consultando documentos:', message)
      }
    }

    void fetchDocumentos()
  }, [session?.kind, session])

  return (
    <section className="aspirante-documentos">
      <h1 className="aspirante-documentos__title">Carga de documentos del aspirante</h1>
      <p className="aspirante-documentos__placeholder">Pendiente de implementación</p>
      <div className="aspirante-documentos__uploader" />
    </section>
  )
}

export default AspiranteDocumentosPage
