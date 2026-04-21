import { useEffect, useMemo, useState } from 'react'
import { DocumentUploadCard } from '../../../../components'
import { getDocumentosPorTipoTramite } from '../../../../api/tramiteDocumentService'
import type { TramiteDocumentoDto } from '../../../../api/tramiteDocumentTypes'
import type { DocumentUploadItem } from '../../../documentos/types/documentUploadTypes'
import { getAsignaturasCatalogo } from '../../api/asignaturasService'
import { getModalidadesContraprestacion } from '../../api/modalidadContraprestacionService'
import type { AsignaturaCatalogoDto, ModalidadContraprestacionDto } from '../../api/types'
import type { SolicitudDocumentoDraft, TipoSolicitudDto } from '../../types'
import { formatTipoSolicitudLabel } from '../../utils/tipoSolicitudLabel'
import './SolicitudEstudianteForm.css'

interface HomologacionAsignaturaFormItem {
  id: string
  asignaturaOrigenId: number | null
  asignaturaDestinoId: number | null
}

export interface SolicitudEstudiantePayload {
  tipoSolicitudId: number
  observaciones: string
  modalidadId: number | null
  solicitudHomologacionesAsignaturas: Array<{
    asignatura_origen_id: number
    asignatura_destino_id: number
  }>
  documentos: Array<{
    id: number
    nombre: string
    obligatorio: boolean
    file: File | null
  }>
}

interface SolicitudEstudianteFormProps {
  tipos: TipoSolicitudDto[]
  onSubmit?: (payload: SolicitudEstudiantePayload) => Promise<void> | void
}

const mapDocumentoToDraft = (documento: TramiteDocumentoDto): SolicitudDocumentoDraft => ({
  id: documento.id,
  nombre: documento.nombre,
  obligatorio: documento.obligatorio,
  file: null,
  error: null,
})

const mapDraftToCardItem = (documento: SolicitudDocumentoDraft): DocumentUploadItem => ({
  id: documento.id,
  codigo: '',
  nombre: documento.nombre,
  obligatorio: documento.obligatorio,
  status: documento.file ? 'READY_TO_UPLOAD' : 'NOT_SELECTED',
  selectedFile: documento.file,
  errorMessage: documento.error ?? undefined,
})

const nextMockAsignaturaId = (() => {
  let current = -1
  return () => {
    const value = current
    current -= 1
    return value
  }
})()

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

const isCreditoCondonableTipo = (tipo: TipoSolicitudDto | null): boolean => {
  const descriptor = `${tipo?.codigoNombre ?? ''} ${tipo?.nombre ?? ''}`
  return normalizeText(descriptor).includes('CREDITO')
}

const isHomologacionTipo = (tipo: TipoSolicitudDto | null): boolean => {
  const descriptor = `${tipo?.codigoNombre ?? ''} ${tipo?.nombre ?? ''}`
  return normalizeText(descriptor).includes('HOMOLOG')
}

const SolicitudEstudianteForm = ({ tipos, onSubmit }: SolicitudEstudianteFormProps) => {
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null)
  const [documentosDraft, setDocumentosDraft] = useState<SolicitudDocumentoDraft[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [documentosError, setDocumentosError] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [modalidades, setModalidades] = useState<ModalidadContraprestacionDto[]>([])
  const [modalidadId, setModalidadId] = useState<number | null>(null)
  const [loadingModalidades, setLoadingModalidades] = useState(false)
  const [modalidadesError, setModalidadesError] = useState<string | null>(null)
  const [asignaturasCatalogo, setAsignaturasCatalogo] = useState<AsignaturaCatalogoDto[]>([])
  const [loadingAsignaturas, setLoadingAsignaturas] = useState(false)
  const [asignaturasError, setAsignaturasError] = useState<string | null>(null)
  const [nuevaAsignaturaNombre, setNuevaAsignaturaNombre] = useState('')
  const [homologaciones, setHomologaciones] = useState<HomologacionAsignaturaFormItem[]>([])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const selectedTipo = useMemo(() => tipos.find((tipo) => tipo.id === tipoSolicitudId) ?? null, [tipoSolicitudId, tipos])
  const selectedTipoLabel = useMemo(
    () =>
      formatTipoSolicitudLabel(selectedTipo?.codigoNombre) || selectedTipo?.nombre?.trim() || selectedTipo?.codigoNombre || '',
    [selectedTipo],
  )
  const isCreditoCondonable = useMemo(() => isCreditoCondonableTipo(selectedTipo), [selectedTipo])
  const isHomologacion = useMemo(() => isHomologacionTipo(selectedTipo), [selectedTipo])

  useEffect(() => {
    if (selectedTipo == null) {
      setDocumentosDraft([])
      setDocumentosError(null)
      setLoadingDocumentos(false)
      return
    }

    const tipoTramiteId = selectedTipo.tipoTramiteId
    if (tipoTramiteId == null || Number.isNaN(tipoTramiteId)) {
      setDocumentosDraft([])
      setDocumentosError('El tipo de solicitud seleccionado no tiene tipoTramiteId para consultar documentos.')
      setLoadingDocumentos(false)
      return
    }

    let mounted = true
    setLoadingDocumentos(true)
    setDocumentosError(null)

    getDocumentosPorTipoTramite(tipoTramiteId)
      .then((documentos) => {
        if (!mounted) {
          return
        }
        setDocumentosDraft(documentos.map(mapDocumentoToDraft))
      })
      .catch((documentsError) => {
        if (!mounted) {
          return
        }
        setDocumentosDraft([])
        setDocumentosError(
          documentsError instanceof Error
            ? documentsError.message
            : 'No fue posible cargar documentos del tipo de trámite seleccionado.',
        )
      })
      .finally(() => {
        if (mounted) {
          setLoadingDocumentos(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [selectedTipo])

  useEffect(() => {
    if (!isCreditoCondonable) {
      setModalidadId(null)
      setModalidades([])
      setModalidadesError(null)
      setLoadingModalidades(false)
      return
    }

    let mounted = true
    setLoadingModalidades(true)
    setModalidadesError(null)

    getModalidadesContraprestacion()
      .then((data) => {
        if (mounted) {
          setModalidades(data)
        }
      })
      .catch((fetchError) => {
        if (!mounted) {
          return
        }
        setModalidades([])
        setModalidadesError(
          fetchError instanceof Error ? fetchError.message : 'No fue posible cargar modalidades de contraprestación.',
        )
      })
      .finally(() => {
        if (mounted) {
          setLoadingModalidades(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [isCreditoCondonable])

  useEffect(() => {
    if (!isHomologacion) {
      setAsignaturasCatalogo([])
      setHomologaciones([])
      setNuevaAsignaturaNombre('')
      setLoadingAsignaturas(false)
      setAsignaturasError(null)
      return
    }

    let mounted = true
    setLoadingAsignaturas(true)
    setAsignaturasError(null)

    getAsignaturasCatalogo()
      .then((asignaturas) => {
        if (mounted) {
          setAsignaturasCatalogo(asignaturas)
          setHomologaciones((current) =>
            current.length > 0
              ? current
              : [{ id: crypto.randomUUID(), asignaturaOrigenId: null, asignaturaDestinoId: null }],
          )
        }
      })
      .catch((fetchError) => {
        if (!mounted) {
          return
        }
        setAsignaturasCatalogo([])
        setAsignaturasError(fetchError instanceof Error ? fetchError.message : 'No fue posible cargar asignaturas.')
      })
      .finally(() => {
        if (mounted) {
          setLoadingAsignaturas(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [isHomologacion])

  const handleFileChange = (documentoId: number, file: File | null) => {
    setDocumentosDraft((current) =>
      current.map((documento) =>
        documento.id === documentoId
          ? {
              ...documento,
              file,
              error: documento.obligatorio && file === null ? 'Este documento es obligatorio.' : null,
            }
          : documento,
      ),
    )
  }

  const validate = (): boolean => {
    if (tipoSolicitudId === null) {
      setErrorMsg('Debes seleccionar un tipo de trámite.')
      return false
    }
    if (documentosError) {
      setErrorMsg('No es posible registrar la solicitud hasta cargar correctamente el listado de documentos.')
      return false
    }
    if (isCreditoCondonable) {
      if (modalidadesError) {
        setErrorMsg('No es posible registrar la solicitud hasta cargar la modalidad de contraprestación.')
        return false
      }
      if (modalidadId === null) {
        setErrorMsg('Debes seleccionar la modalidad de contraprestación para solicitudes de crédito condonable.')
        return false
      }
    }
    if (isHomologacion) {
      if (asignaturasError) {
        setErrorMsg('No es posible registrar la solicitud hasta cargar asignaturas de homologación.')
        return false
      }
      if (homologaciones.length === 0) {
        setErrorMsg('Agrega al menos un par de asignaturas para homologación.')
        return false
      }
      const missingPair = homologaciones.some(
        (item) => item.asignaturaOrigenId == null || item.asignaturaDestinoId == null,
      )
      if (missingPair) {
        setErrorMsg('Cada fila de homologación debe tener asignatura origen y destino.')
        return false
      }
    }
    const missingRequired = documentosDraft.some((documento) => documento.obligatorio && !documento.file)
    if (missingRequired) {
      setDocumentosDraft((current) =>
        current.map((documento) =>
          documento.obligatorio && !documento.file
            ? { ...documento, error: 'Este documento es obligatorio.' }
            : documento,
        ),
      )
      setErrorMsg('Adjunta todos los documentos obligatorios antes de registrar la solicitud.')
      return false
    }

    setErrorMsg(null)
    return true
  }

  const resetForm = () => {
    setTipoSolicitudId(null)
    setDocumentosDraft([])
    setObservaciones('')
    setModalidadId(null)
    setHomologaciones([])
    setNuevaAsignaturaNombre('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMsg(null)

    if (!validate() || tipoSolicitudId === null) {
      return
    }

    const payload: SolicitudEstudiantePayload = {
      tipoSolicitudId,
      observaciones,
      modalidadId,
      solicitudHomologacionesAsignaturas: homologaciones
        .filter((item) => item.asignaturaOrigenId !== null && item.asignaturaDestinoId !== null)
        .map((item) => ({
          asignatura_origen_id: item.asignaturaOrigenId as number,
          asignatura_destino_id: item.asignaturaDestinoId as number,
        })),
      documentos: documentosDraft.map((documento) => ({
        id: documento.id,
        nombre: documento.nombre,
        obligatorio: documento.obligatorio,
        file: documento.file,
      })),
    }

    try {
      setLoadingSubmit(true)
      if (onSubmit) {
        await onSubmit(payload)
      } else {
        await new Promise((resolve) => {
          setTimeout(resolve, 200)
        })
      }

      setErrorMsg(null)
      setSuccessMsg('Solicitud registrada correctamente.')
      resetForm()
    } catch {
      setSuccessMsg(null)
      setErrorMsg('No fue posible registrar la solicitud. Intenta nuevamente.')
    } finally {
      setLoadingSubmit(false)
    }
  }

  const addHomologacionRow = () => {
    setHomologaciones((current) => [...current, { id: crypto.randomUUID(), asignaturaOrigenId: null, asignaturaDestinoId: null }])
  }

  const removeHomologacionRow = (rowId: string) => {
    setHomologaciones((current) => current.filter((item) => item.id !== rowId))
  }

  const updateHomologacionRow = (
    rowId: string,
    key: 'asignaturaOrigenId' | 'asignaturaDestinoId',
    value: number | null,
  ) => {
    setHomologaciones((current) => current.map((item) => (item.id === rowId ? { ...item, [key]: value } : item)))
  }

  const addMockAsignatura = () => {
    const nombre = nuevaAsignaturaNombre.trim()
    if (!nombre) {
      return
    }
    const newItem: AsignaturaCatalogoDto = {
      id: nextMockAsignaturaId(),
      codigo: null,
      nombre,
    }
    setAsignaturasCatalogo((current) => [newItem, ...current])
    setNuevaAsignaturaNombre('')
  }

  return (
    <form className="solicitud-estudiante-form" onSubmit={handleSubmit}>
      <h3 className="solicitud-estudiante-form__title">Registro de solicitud</h3>
      <p className="solicitud-estudiante-form__subtitle">
        Selecciona el tipo de trámite y adjunta los soportes requeridos. El estado inicial de la solicitud será
        ENVIADA A COMITE ASESOR DE POSGRADOS.
      </p>

      {errorMsg && <p className="solicitud-estudiante-form__alert solicitud-estudiante-form__alert--error">{errorMsg}</p>}
      {successMsg && (
        <p className="solicitud-estudiante-form__alert solicitud-estudiante-form__alert--success">{successMsg}</p>
      )}

      <div className="solicitud-estudiante-form__section">
        <label htmlFor="tipoSolicitud">Tipo de trámite *</label>
        <select
          id="tipoSolicitud"
          value={tipoSolicitudId ?? ''}
          onChange={(event) => {
            const nextValue = event.target.value
            setTipoSolicitudId(nextValue ? Number(nextValue) : null)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
          required
        >
          <option value="">Selecciona una opción</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {formatTipoSolicitudLabel(tipo.codigoNombre) || tipo.nombre || tipo.codigoNombre || `Tipo #${tipo.id}`}
            </option>
          ))}
        </select>
      </div>

      {isCreditoCondonable && (
        <div className="solicitud-estudiante-form__section">
          <label htmlFor="modalidadContraprestacion">Modalidad de contraprestación *</label>
          {loadingModalidades ? (
            <p className="solicitud-estudiante-form__empty">Cargando modalidades...</p>
          ) : modalidadesError ? (
            <p className="solicitud-estudiante-form__doc-error">{modalidadesError}</p>
          ) : (
            <select
              id="modalidadContraprestacion"
              value={modalidadId ?? ''}
              onChange={(event) => setModalidadId(event.target.value ? Number(event.target.value) : null)}
              required
            >
              <option value="">Selecciona una modalidad</option>
              {modalidades.map((modalidad) => (
                <option key={modalidad.id} value={modalidad.id}>
                  {modalidad.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {isHomologacion && (
        <div className="solicitud-estudiante-form__section">
          <h4>Asignaturas de homologación</h4>
          <p className="solicitud-estudiante-form__help">
            Selecciona pares de asignatura origen/destino. También puedes crear asignaturas nuevas de forma temporal
            (mock).
          </p>
          <div className="solicitud-estudiante-form__mock-create">
            <input
              value={nuevaAsignaturaNombre}
              onChange={(event) => setNuevaAsignaturaNombre(event.target.value)}
              placeholder="Nueva asignatura (mock)"
            />
            <button type="button" onClick={addMockAsignatura}>
              Agregar asignatura mock
            </button>
          </div>
          {loadingAsignaturas ? (
            <p className="solicitud-estudiante-form__empty">Cargando asignaturas...</p>
          ) : asignaturasError ? (
            <p className="solicitud-estudiante-form__doc-error">{asignaturasError}</p>
          ) : homologaciones.length === 0 ? (
            <button type="button" onClick={addHomologacionRow}>
              Agregar par de homologación
            </button>
          ) : (
            <div className="solicitud-estudiante-form__homologaciones">
              {homologaciones.map((item, index) => (
                <div key={item.id} className="solicitud-estudiante-form__homologacion-row">
                  <span className="solicitud-estudiante-form__homologacion-index">Par #{index + 1}</span>
                  <select
                    value={item.asignaturaOrigenId ?? ''}
                    onChange={(event) =>
                      updateHomologacionRow(item.id, 'asignaturaOrigenId', event.target.value ? Number(event.target.value) : null)
                    }
                  >
                    <option value="">Asignatura a homologar (origen)</option>
                    {asignaturasCatalogo.map((asignatura) => (
                      <option key={`origen-${asignatura.id}`} value={asignatura.id}>
                        {asignatura.nombre}
                      </option>
                    ))}
                  </select>
                  <select
                    value={item.asignaturaDestinoId ?? ''}
                    onChange={(event) =>
                      updateHomologacionRow(item.id, 'asignaturaDestinoId', event.target.value ? Number(event.target.value) : null)
                    }
                  >
                    <option value="">Asignatura homologable (destino)</option>
                    {asignaturasCatalogo.map((asignatura) => (
                      <option key={`destino-${asignatura.id}`} value={asignatura.id}>
                        {asignatura.nombre}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeHomologacionRow(item.id)}>
                    Quitar
                  </button>
                </div>
              ))}
              <button type="button" onClick={addHomologacionRow}>
                Agregar otro par
              </button>
            </div>
          )}
        </div>
      )}

      <div className="solicitud-estudiante-form__section">
        <h4>Documentos</h4>
        {selectedTipoLabel && <p className="solicitud-estudiante-form__help">Requisitos para: {selectedTipoLabel}</p>}

        {loadingDocumentos ? (
          <p className="solicitud-estudiante-form__empty">Cargando documentos requeridos...</p>
        ) : documentosError ? (
          <p className="solicitud-estudiante-form__doc-error">{documentosError}</p>
        ) : documentosDraft.length === 0 ? (
          <p className="solicitud-estudiante-form__empty">Selecciona un tipo de trámite para cargar documentos.</p>
        ) : (
          <div className="solicitud-estudiante-form__docs-list">
            {documentosDraft.map((documento) => (
              <DocumentUploadCard
                key={documento.id}
                item={mapDraftToCardItem(documento)}
                onSelectFile={handleFileChange}
                onRemoveFile={(documentoId) => handleFileChange(documentoId, null)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="solicitud-estudiante-form__section">
        <label htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          rows={4}
          value={observaciones}
          onChange={(event) => setObservaciones(event.target.value)}
          placeholder="Describe detalles relevantes para tu solicitud"
        />
      </div>

      <button type="submit" className="solicitud-estudiante-form__submit" disabled={loadingSubmit}>
        {loadingSubmit ? 'Registrando...' : 'Registrar solicitud'}
      </button>
    </form>
  )
}

export default SolicitudEstudianteForm
