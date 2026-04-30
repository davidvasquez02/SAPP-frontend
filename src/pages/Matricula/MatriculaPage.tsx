import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ModuleLayout } from "../../components";
import { ROLES, hasAnyRole } from "../../auth/roleGuards";
import { useAuth } from "../../context/Auth";
import type { AuthUser } from "../../context/Auth/types";
import DocumentosRequeridosTable from "../../modules/matricula/components/DocumentosRequeridosTable/DocumentosRequeridosTable";
import MatriculaClosedState from "../../modules/matricula/components/MatriculaClosedState/MatriculaClosedState";
import MateriasSelectedTable from "../../modules/matricula/components/MateriasSelectedTable/MateriasSelectedTable";
import MateriasSelector from "../../modules/matricula/components/MateriasSelector/MateriasSelector";
import {
  fetchMatriculaConvocatoria,
} from "../../modules/matricula/services/matriculaMockService";
import { getDocumentosPorTipoTramite } from "../../api/tramiteDocumentService";
import type { TramiteDocumentoDto } from "../../api/tramiteDocumentTypes";
import type { DocumentoTramiteItemDto } from "../../modules/documentos/api/types";
import {
  crearMatriculaAcademica,
  getDocumentosMatriculaAcademica,
  getAsignaturasPorPrograma,
  getMatriculaVigenteValidationByEstudiante,
  getMatriculasAcademicas,
} from "../../modules/matricula/services/matriculaAcademicaService";
import { uploadDocument } from "../../api/documentUploadService";
import { fileToBase64 } from "../../utils/fileToBase64";
import { sha256Hex } from "../../utils/sha256";
import type {
  DocumentoRequerido,
  MateriaDto,
  MateriaSeleccionada,
  MatriculaAcademicaListadoDto,
  MatriculaConvocatoria,
} from "../../modules/matricula/types";
import "./MatriculaPage.css";

const TIPO_TRAMITE_ID_MATRICULA = 2;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "—";
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapDocumentoTramiteToRequerido = (
  documento: TramiteDocumentoDto,
): DocumentoRequerido => ({
  id: documento.id,
  nombre: documento.descripcion?.trim() || documento.nombre,
  obligatorio: documento.obligatorio,
  estado: "PENDIENTE",
  fechaRevision: null,
  observaciones: null,
  selectedFile: null,
  uploadStatus: "NOT_SELECTED",
});

const mapEstadoDocumento = (
  documento: DocumentoTramiteItemDto,
): DocumentoRequerido["estado"] => {
  const estadoRaw =
    documento.documentoUploadedResponse?.estadoDocumento?.toUpperCase() ?? "";

  if (estadoRaw.includes("APROB")) {
    return "APROBADO";
  }

  if (estadoRaw.includes("RECHAZ")) {
    return "RECHAZADO";
  }

  if (estadoRaw.includes("REVISION") || estadoRaw.includes("ESTUDIO")) {
    return "EN_REVISION";
  }

  return documento.documentoCargado ? "EN_REVISION" : "PENDIENTE";
};

const mapDocumentoCargadoToRequerido = (
  documento: DocumentoTramiteItemDto,
): DocumentoRequerido => ({
  id: documento.idTipoDocumentoTramite,
  nombre:
    documento.descripcionTipoDocumentoTramite?.trim() ||
    documento.nombreTipoDocumentoTramite,
  obligatorio: documento.obligatorioTipoDocumentoTramite,
  estado: mapEstadoDocumento(documento),
  fechaRevision: documento.documentoUploadedResponse?.fechaCargaDocumento ?? null,
  observaciones: documento.documentoUploadedResponse?.observacionesDocumento ?? null,
  selectedFile: null,
  uploadStatus: documento.documentoCargado ? "UPLOADED" : "NOT_SELECTED",
  uploadedFileName: documento.documentoUploadedResponse?.nombreArchivoDocumento,
});

const MatriculaPage = () => {
  const { session } = useAuth();
  const roles = useMemo(
    () => (session?.kind === "SAPP" ? session.user.roles : []),
    [session],
  );
  const isEstudiante = hasAnyRole(roles, ["ESTUDIANTE"]);
  const canManageMatriculas = hasAnyRole(roles, [
    ROLES.COORDINACION,
    ROLES.ADMIN,
  ]);

  const [loadingConvocatoria, setLoadingConvocatoria] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [convocatoria, setConvocatoria] =
    useState<MatriculaConvocatoria | null>(null);
  const [materiasCatalogo, setMateriasCatalogo] = useState<MateriaDto[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoRequerido[]>([]);
  const [selectedMaterias, setSelectedMaterias] = useState<
    MateriaSeleccionada[]
  >([]);
  const [errorConvocatoria, setErrorConvocatoria] = useState<string | null>(
    null,
  );
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [matriculaValidationMessage, setMatriculaValidationMessage] = useState<
    string | null
  >(null);
  const [canCreateMatricula, setCanCreateMatricula] = useState(false);
  const [hasExistingMatricula, setHasExistingMatricula] = useState(false);
  const [isReadOnlyMatriculaFinalizada, setIsReadOnlyMatriculaFinalizada] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [periodoId, setPeriodoId] = useState<number>(1);

  const [isLoadingListado, setIsLoadingListado] = useState(false);
  const [errorListado, setErrorListado] = useState<string | null>(null);
  const [matriculas, setMatriculas] = useState<MatriculaAcademicaListadoDto[]>(
    [],
  );
  const [programaFilter, setProgramaFilter] = useState("TODOS");
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [periodoFilter, setPeriodoFilter] = useState("TODOS");
  const [searchText, setSearchText] = useState("");

  const getMatriculaEstadoClassName = (estado: string) => {
    const normalizedEstado = estado.trim().toUpperCase();

    if (normalizedEstado === "PENDIENTE_DOCUMENTOS") {
      return "matricula-page__estado-badge matricula-page__estado-badge--pendiente-documentos";
    }

    if (normalizedEstado === "RADICADA") {
      return "matricula-page__estado-badge matricula-page__estado-badge--radicada";
    }

    if (normalizedEstado === "FINALIZADA") {
      return "matricula-page__estado-badge matricula-page__estado-badge--finalizada";
    }

    return "matricula-page__estado-badge matricula-page__estado-badge--default";
  };

  const applyMatriculaValidation = (
    validation: Awaited<
      ReturnType<typeof getMatriculaVigenteValidationByEstudiante>
    >,
    materias: MateriaDto[],
  ) => {
    if (validation.status === "EXISTS") {
      setCanCreateMatricula(false);
      setHasExistingMatricula(true);
      setIsReadOnlyMatriculaFinalizada(
        validation.matricula.estado.toUpperCase() === "FINALIZADA",
      );
      setMatriculaValidationMessage(
        validation.matricula.estado.toUpperCase() === "FINALIZADA"
          ? "Tu proceso de matrícula se encuentra finalizado."
          : "El estudiante ya tiene matrícula para el periodo vigente.",
      );
      setPeriodoId(validation.matricula.periodoId);
      setConvocatoria((current) =>
        current
          ? {
              ...current,
              periodoLabel: validation.matricula.periodoAcademico,
            }
          : current,
      );

      const selectedFromMatricula = validation.matricula.asignaturas
        .map((asignatura) => {
          const materiaCatalogo = materias.find(
            (item) => item.id === asignatura.asignaturaId,
          );
          if (!materiaCatalogo) {
            return null;
          }

          return {
            ...materiaCatalogo,
            codigo: materiaCatalogo.codigo ?? asignatura.asignaturaCodigo,
            addedAt: new Date().toISOString(),
          } satisfies MateriaSeleccionada;
        })
        .filter((item): item is MateriaSeleccionada => item !== null);

      setSelectedMaterias(selectedFromMatricula);
      return;
    }

    if (validation.status === "NO_ACTIVE_PERIOD") {
      setCanCreateMatricula(false);
      setHasExistingMatricula(false);
      setIsReadOnlyMatriculaFinalizada(false);
      setMatriculaValidationMessage(validation.message);
      return;
    }

    setCanCreateMatricula(true);
    setHasExistingMatricula(false);
    setIsReadOnlyMatriculaFinalizada(false);
    setMatriculaValidationMessage(null);
  };

  const loadDocumentosMatricula = useCallback(async (
    validation: Awaited<
      ReturnType<typeof getMatriculaVigenteValidationByEstudiante>
    >,
  ) => {
    if (validation.status === "EXISTS") {
      const documentosCargados = await getDocumentosMatriculaAcademica(
        validation.matricula.id,
      );
      setDocumentos(documentosCargados.map(mapDocumentoCargadoToRequerido));
      return;
    }

    const documentosRequeridos = await getDocumentosPorTipoTramite(
      TIPO_TRAMITE_ID_MATRICULA,
    );
    setDocumentos(documentosRequeridos.map(mapDocumentoTramiteToRequerido));
  }, []);

  const estudianteId = useMemo(() => {
    if (session?.kind !== "SAPP") {
      return null;
    }

    return (session.user as AuthUser).estudiante?.id ?? null;
  }, [session]);

  const usuarioCargaId = useMemo(() => {
    if (session?.kind !== "SAPP") {
      return null;
    }

    const usuarioId = Number(session.user.id);
    return Number.isFinite(usuarioId) ? usuarioId : null;
  }, [session]);

  useEffect(() => {
    if (!isEstudiante || !estudianteId) {
      return;
    }

    let cancelled = false;

    const loadMatriculaState = async () => {
      let loadedConvocatoria = false;
      setLoadingConvocatoria(true);
      setErrorConvocatoria(null);

      try {
        const matriculaValidation =
          await getMatriculaVigenteValidationByEstudiante(estudianteId);
        if (cancelled) {
          return;
        }

        const convocatoriaResult = await fetchMatriculaConvocatoria();
        if (cancelled) {
          return;
        }

        loadedConvocatoria = true;
        setConvocatoria(convocatoriaResult);

        if (!convocatoriaResult.isOpen) {
          return;
        }

        setLoadingForm(true);
        setErrorForm(null);

        const materiasResult = await getAsignaturasPorPrograma(1);
        await loadDocumentosMatricula(matriculaValidation);

        if (cancelled) {
          return;
        }

        setMateriasCatalogo(materiasResult);

        applyMatriculaValidation(matriculaValidation, materiasResult);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar la información de matrícula.";

        if (!cancelled) {
          if (!loadedConvocatoria) {
            setErrorConvocatoria(message);
          } else {
            setErrorForm(message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingConvocatoria(false);
          setLoadingForm(false);
        }
      }
    };

    void loadMatriculaState();

    return () => {
      cancelled = true;
    };
  }, [estudianteId, isEstudiante, loadDocumentosMatricula]);

  useEffect(() => {
    if (!canManageMatriculas) {
      return;
    }

    let cancelled = false;

    const loadMatriculas = async () => {
      setIsLoadingListado(true);
      setErrorListado(null);

      try {
        const response = await getMatriculasAcademicas();
        if (cancelled) {
          return;
        }

        setMatriculas(response);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar el listado de matrículas.";
        if (!cancelled) {
          setErrorListado(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingListado(false);
        }
      }
    };

    void loadMatriculas();

    return () => {
      cancelled = true;
    };
  }, [canManageMatriculas]);

  const handleAddMateria = (materia: MateriaDto) => {
    setSelectedMaterias((current) => {
      if (current.some((item) => item.id === materia.id)) {
        return current;
      }

      return [
        ...current,
        { ...materia, addedAt: new Date().toISOString() },
      ];
    });
  };

  const handleConfirmMatricula = async () => {
    if (!estudianteId) {
      setErrorForm("No fue posible identificar el estudiante autenticado.");
      return;
    }
    if (!usuarioCargaId) {
      setErrorForm("No fue posible identificar el usuario que carga documentos.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorForm(null);

      const latestValidation =
        await getMatriculaVigenteValidationByEstudiante(estudianteId);
      applyMatriculaValidation(latestValidation, materiasCatalogo);
      await loadDocumentosMatricula(latestValidation);

      if (latestValidation.status === "NO_ACTIVE_PERIOD") {
        setErrorForm(
          latestValidation.message ||
            "No es posible crear matrícula en este momento.",
        );
        return;
      }

      if (latestValidation.status === "CAN_CREATE") {
        const missingRequiredDocument = documentos.some(
          (documento) =>
            documento.obligatorio &&
            documento.uploadStatus !== "UPLOADED" &&
            !documento.selectedFile,
        );
        if (missingRequiredDocument) {
          setErrorForm(
            "Debes adjuntar todos los documentos obligatorios antes de confirmar.",
          );
          return;
        }

        await crearMatriculaAcademica({
          estudianteId,
          periodoId,
          asignaturas: selectedMaterias.map((materia) => ({
            asignaturaId: materia.id,
          })),
        });
      }

      const matriculaValidation =
        await getMatriculaVigenteValidationByEstudiante(estudianteId);
      if (matriculaValidation.status !== "EXISTS") {
        throw new Error("No fue posible obtener el trámite de matrícula vigente.");
      }

      const documentosConCambios = documentos.filter(
        (documento) => Boolean(documento.selectedFile),
      );
      if (
        latestValidation.status === "EXISTS" &&
        documentosConCambios.length === 0
      ) {
        setErrorForm("Selecciona al menos un documento nuevo para enviar.");
        return;
      }

      for (const documento of documentosConCambios) {
        const file = documento.selectedFile;
        if (!file) {
          continue;
        }

        setDocumentos((current) =>
          current.map((item) =>
            item.id === documento.id
              ? { ...item, uploadStatus: "UPLOADING", errorMessage: undefined }
              : item,
          ),
        );

        try {
          const buffer = await file.arrayBuffer();
          const contenidoBase64 = await fileToBase64(file);
          const checksum = await sha256Hex(buffer);

          const uploaded = await uploadDocument({
            tipoDocumentoTramiteId: documento.id,
            nombreArchivo: file.name,
            tramiteId: matriculaValidation.matricula.id,
            usuarioCargaId,
            aspiranteCargaId: null,
            contenidoBase64,
            mimeType: file.type || "application/octet-stream",
            tamanoBytes: file.size,
            checksum,
          });

          setDocumentos((current) =>
            current.map((item) =>
              item.id === documento.id
                ? {
                    ...item,
                    uploadStatus: "UPLOADED",
                    uploadedFileName: uploaded.nombreArchivo,
                    selectedFile: null,
                    errorMessage: undefined,
                  }
                : item,
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "No fue posible cargar el documento.";
          setDocumentos((current) =>
            current.map((item) =>
              item.id === documento.id
                ? { ...item, uploadStatus: "ERROR", errorMessage: message }
                : item,
            ),
          );
          throw new Error(
            `La matrícula fue creada, pero falló la carga del documento "${documento.nombre}". ${message}`,
          );
        }
      }

      applyMatriculaValidation(matriculaValidation, materiasCatalogo);
      await loadDocumentosMatricula(matriculaValidation);

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible registrar la matrícula.";
      setErrorForm(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const programas = useMemo(
    () => [
      "TODOS",
      ...Array.from(
        new Set(matriculas.map((item) => item.programaAcademico)),
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [matriculas],
  );
  const periodos = useMemo(
    () => [
      "TODOS",
      ...Array.from(
        new Set(matriculas.map((item) => item.periodoAcademico)),
      ).sort((a, b) => b.localeCompare(a)),
    ],
    [matriculas],
  );
  const estados = useMemo(
    () => [
      "TODOS",
      ...Array.from(new Set(matriculas.map((item) => item.estado))).sort(
        (a, b) => a.localeCompare(b),
      ),
    ],
    [matriculas],
  );

  const filteredMatriculas = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return matriculas.filter((item) => {
      if (
        programaFilter !== "TODOS" &&
        item.programaAcademico !== programaFilter
      ) {
        return false;
      }

      if (
        periodoFilter !== "TODOS" &&
        item.periodoAcademico !== periodoFilter
      ) {
        return false;
      }

      if (estadoFilter !== "TODOS" && item.estado !== estadoFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        item.estudianteNombreCompleto,
        item.codigoEstudianteUis ?? "",
        item.programaAcademico,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [estadoFilter, matriculas, periodoFilter, programaFilter, searchText]);

  const hasAllDocumentsUploadedAndNoRejected = useMemo(() => {
    if (!hasExistingMatricula) {
      return false;
    }

    const hasRejectedDocuments = documentos.some((item) => item.estado === "RECHAZADO");
    if (hasRejectedDocuments) {
      return false;
    }

    return documentos.every((item) => item.uploadStatus === "UPLOADED");
  }, [documentos, hasExistingMatricula]);

  const canConfirmMatricula = useMemo(() => {
    if (isSubmitting || isReadOnlyMatriculaFinalizada) {
      return false;
    }

    if (canCreateMatricula) {
      return selectedMaterias.length > 0;
    }

    if (hasExistingMatricula) {
      return !hasAllDocumentsUploadedAndNoRejected;
    }

    return false;
  }, [
    canCreateMatricula,
    hasAllDocumentsUploadedAndNoRejected,
    hasExistingMatricula,
    isReadOnlyMatriculaFinalizada,
    isSubmitting,
    selectedMaterias.length,
  ]);



  if (!isEstudiante && !canManageMatriculas) {
    return (
      <ModuleLayout title="Matrícula">
        <p className="matricula-page__placeholder">
          No disponible para tu rol.
        </p>
      </ModuleLayout>
    );
  }

  if (canManageMatriculas) {
    return (
      <ModuleLayout title="Matrícula">
        <div className="matricula-page">
          <header className="matricula-page__header">
            <h3>Listado de matrículas académicas</h3>
            <p>Consulta y filtra las matrículas registradas por programa.</p>
          </header>

          <section className="matricula-page__card matricula-page__filters sapp-filters-panel">
            <label className="sapp-filter-field">
              <span>Programa</span>
              <select
                value={programaFilter}
                onChange={(event) => setProgramaFilter(event.target.value)}
              >
                {programas.map((programa) => (
                  <option key={programa} value={programa}>
                    {programa}
                  </option>
                ))}
              </select>
            </label>
            <label className="sapp-filter-field">
              <span>Periodo</span>
              <select
                value={periodoFilter}
                onChange={(event) => setPeriodoFilter(event.target.value)}
              >
                {periodos.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    {periodo}
                  </option>
                ))}
              </select>
            </label>
            <label className="sapp-filter-field">
              <span>Estado</span>
              <select
                value={estadoFilter}
                onChange={(event) => setEstadoFilter(event.target.value)}
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </label>
            <label className="sapp-filter-field">
              <span>Buscar estudiante</span>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Nombre, código o programa"
              />
            </label>
          </section>

          <section className="matricula-page__card">
            {isLoadingListado ? (
              <p className="matricula-page__status">Cargando matrículas...</p>
            ) : null}
            {errorListado ? (
              <p className="matricula-page__error">{errorListado}</p>
            ) : null}

            {!isLoadingListado && !errorListado ? (
              <>
                <p className="matricula-page__description">
                  Registros encontrados: {filteredMatriculas.length}
                </p>
                <div className="matricula-page__table-wrapper sapp-table-shell">
                  <table className="matricula-page__table sapp-table" role="grid">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Programa</th>
                        <th>Periodo</th>
                        <th>Estado</th>
                        <th>Fecha solicitud</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMatriculas.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.estudianteNombreCompleto}</strong>
                            <br />
                            <small>
                              Código UIS: {item.codigoEstudianteUis ?? "—"}
                            </small>
                          </td>
                          <td>{item.programaAcademico}</td>
                          <td>{item.periodoAcademico}</td>
                          <td>
                            <span className={getMatriculaEstadoClassName(item.estado)}>
                              {item.estado}
                            </span>
                          </td>
                          <td>{formatDateTime(item.fechaSolicitud)}</td>
                          <td>
                            <Link
                              to={`/matricula/${item.id}`}
                              className="matricula-page__detail-button"
                            >
                              Ver detalle
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Proceso de matrícula">
      <div className="matricula-page">
        <header className="matricula-page__header">
          <h3>Proceso de matrícula</h3>
          {convocatoria?.periodoLabel ? (
            <p>Periodo académico: {convocatoria.periodoLabel}</p>
          ) : null}
        </header>

        {loadingConvocatoria ? (
          <p className="matricula-page__status">Cargando convocatoria...</p>
        ) : null}
        {errorConvocatoria ? (
          <p className="matricula-page__error">{errorConvocatoria}</p>
        ) : null}

        {!loadingConvocatoria && convocatoria && !convocatoria.isOpen ? (
          <MatriculaClosedState message={convocatoria.mensaje} />
        ) : null}

        {!loadingConvocatoria && convocatoria?.isOpen ? (
          <>
            <section className="matricula-page__card">
              {!isReadOnlyMatriculaFinalizada && !hasExistingMatricula ? (
                <>
                  <h4>Selección de materias</h4>
                  <p className="matricula-page__description">
                    Agrega las materias que cursarás en este periodo.
                  </p>
                </>
              ) : null}
              {loadingForm ? (
                <p className="matricula-page__status">Cargando materias...</p>
              ) : null}
              {errorForm ? (
                <p className="matricula-page__error">{errorForm}</p>
              ) : null}
              {!hasExistingMatricula && matriculaValidationMessage ? (
                <p className="matricula-page__status">
                  {matriculaValidationMessage}
                </p>
              ) : null}
              
              {!loadingForm && !errorForm ? (
                <>
                  {!isReadOnlyMatriculaFinalizada && !hasExistingMatricula ? (
                    <MateriasSelector
                      materias={materiasCatalogo}
                      selected={selectedMaterias}
                      onAdd={handleAddMateria}
                      disabled={isReadOnlyMatriculaFinalizada || hasExistingMatricula}
                    />
                  ) : null}
                  <MateriasSelectedTable
                    selected={selectedMaterias}
                    disabled={isReadOnlyMatriculaFinalizada || hasExistingMatricula}
                    readOnlyView={isReadOnlyMatriculaFinalizada}
                    hideActionColumn={hasExistingMatricula}
                    onRemove={(id) =>
                      setSelectedMaterias((current) =>
                        current.filter((item) => item.id !== id),
                      )
                    }
                  />                </>
              ) : null}
            </section>

            <section className="matricula-page__card">
              {!isReadOnlyMatriculaFinalizada ? <h4>Cargue de documentos</h4> : null}
              {!isReadOnlyMatriculaFinalizada && !hasExistingMatricula ? (
                <p className="matricula-page__description">
                  Revisa y carga los documentos solicitados para la matrícula.
                </p>
              ) : null}
              {loadingForm ? (
                <p className="matricula-page__status">Cargando documentos...</p>
              ) : null}
              {!loadingForm && !errorForm ? (
                <DocumentosRequeridosTable
                  documentos={documentos}
                  disabledActions={false}
                  showActions
                  uploadDisabledOnly={isReadOnlyMatriculaFinalizada}
                  onSelectFile={(docId, file) => {
                    setDocumentos((current) =>
                      current.map((item) => {
                        if (item.id !== docId) {
                          return item;
                        }

                        if (!file) {
                          return {
                            ...item,
                            selectedFile: null,
                            uploadStatus: item.uploadedFileName
                              ? "UPLOADED"
                              : "NOT_SELECTED",
                            errorMessage: undefined,
                          };
                        }

                        return {
                          ...item,
                          selectedFile: file,
                          uploadStatus: "READY_TO_UPLOAD",
                          errorMessage: undefined,
                        };
                      }),
                    );
                    setErrorForm(null);
                  }}
                />
              ) : null}
            </section>

            {!isReadOnlyMatriculaFinalizada ? (
              <div className="matricula-page__actions">
                <button
                  type="button"
                  className="matricula-page__confirm"
                  disabled={
                    !canConfirmMatricula
                  }
                  onClick={() => void handleConfirmMatricula()}
                >
                  {isSubmitting ? (hasExistingMatricula ? "Actualizando..." : "Confirmando...") : hasExistingMatricula ? "Actualizar matrícula" : "Confirmar matrícula"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </ModuleLayout>
  );
};

export default MatriculaPage;
