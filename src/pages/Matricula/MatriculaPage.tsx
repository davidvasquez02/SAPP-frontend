import { useCallback, useEffect, useMemo, useState } from "react";
import { downloadBase64File, openBase64InNewTab } from "../../shared/files/base64FileUtils";
import { Link } from "react-router-dom";
import { ModuleLayout } from "../../components";
import { canManagePosgrados, hasAnyRole } from "../../auth/roleGuards";
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
  getPeriodoMatriculaVigente,
  notificarAperturaMatricula,
  notificarDocumentosCompletosMatricula,
} from "../../modules/matricula/services/matriculaAcademicaService";
import type { PeriodoAcademicoMatriculaVigenteDto } from "../../modules/matricula/services/matriculaAcademicaService";
import { uploadDocument } from "../../api/documentUploadService";
import { fileToBase64 } from "../../utils/fileToBase64";
import { sha256Hex } from "../../utils/sha256";
import { isPdfFile } from "../../shared/files/pdfFile";
import type {
  DocumentoRequerido,
  MateriaDto,
  MateriaSeleccionada,
  MatriculaAcademicaListadoDto,
  MatriculaAcademicaVigenteDto,
  MatriculaConvocatoria,
} from "../../modules/matricula/types";
import {
  formatBackendDateTime,
  getMatriculaAcademicaDetallePath,
  getMatriculaEstadoLabel,
  getMatriculaEstadoModifier,
} from "../../modules/matricula/utils/matriculaPresentation";
import { parsePeriodo } from "../../modules/admisiones/utils/periodo";
import "./MatriculaPage.css";
import { formatProgramaAcademico, getProgramaAcademico } from "../../shared/domain/programaAcademico";

const TIPO_TRAMITE_ID_MATRICULA = 2;
const LISTADO_PAGE_SIZE = 10;

const resolvePeriodoActual = (periodos: string[]): string => {
  const colombiaDateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const anioActual = Number(
    colombiaDateParts.find((part) => part.type === "year")?.value,
  );
  const mesActual = Number(
    colombiaDateParts.find((part) => part.type === "month")?.value,
  );
  const semestreActual = mesActual <= 6 ? 1 : 2;

  return (
    periodos.find((periodo) => {
      const { anio, semestre } = parsePeriodo(periodo);
      return anio === anioActual && semestre === semestreActual;
    }) ?? "TODOS"
  );
};

const resolveProgramaLabel = (programa: string): string => {
  if (programa === "TODOS") {
    return "Seleccione un programa...";
  }

  return getProgramaAcademico(programa)
    ? formatProgramaAcademico(programa).replace(" - ", " · ")
    : programa;
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

const tieneDocumentosObligatoriosCargados = (
  documentos: DocumentoTramiteItemDto[],
) => {
  const obligatorios = documentos.filter(
    (documento) => documento.obligatorioTipoDocumentoTramite,
  );

  return (
    obligatorios.length > 0 &&
    obligatorios.every(
      (documento) =>
        documento.documentoCargado && documento.documentoUploadedResponse !== null,
    )
  );
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
  fechaRevision: documento.documentoUploadedResponse?.fechaRevisionDocumento ?? null,
  observaciones: documento.documentoUploadedResponse?.observacionesDocumento ?? null,
  selectedFile: null,
  uploadStatus: documento.documentoCargado ? "UPLOADED" : "NOT_SELECTED",
  uploadedFileName: documento.documentoUploadedResponse?.nombreArchivoDocumento,
  uploadedBase64:
    documento.documentoUploadedResponse?.base64DocumentoContenido ??
    documento.documentoUploadedResponse?.contenidoBase64,
  uploadedMimeType:
    documento.documentoUploadedResponse?.mimeTypeDocumentoContenido ??
    documento.documentoUploadedResponse?.mimeType,
});

const MatriculaPage = () => {
  const { session } = useAuth();
  const roles = useMemo(
    () => (session?.kind === "SAPP" ? session.user.roles : []),
    [session],
  );
  const isEstudiante = hasAnyRole(roles, ["ESTUDIANTE"]);
  const canManageMatriculas = canManagePosgrados(roles);

  const [loadingConvocatoria, setLoadingConvocatoria] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [convocatoria, setConvocatoria] =
    useState<MatriculaConvocatoria | null>(null);
  const [materiasCatalogo, setMateriasCatalogo] = useState<MateriaDto[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoRequerido[]>([]);
  const [activeMatricula, setActiveMatricula] =
    useState<MatriculaAcademicaVigenteDto | null>(null);
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null);
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
  const [hasActiveMatriculaDates, setHasActiveMatriculaDates] = useState(true);
  const [hasExistingMatricula, setHasExistingMatricula] = useState(false);
  const [isReadOnlyMatriculaFinalizada, setIsReadOnlyMatriculaFinalizada] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<
    "VALIDATING" | "PREPARING_DOCUMENTS" | "CREATING" | "UPLOADING" | "FINALIZING" | null
  >(null);

  const [isLoadingListado, setIsLoadingListado] = useState(false);
  const [errorListado, setErrorListado] = useState<string | null>(null);
  const [matriculas, setMatriculas] = useState<MatriculaAcademicaListadoDto[]>(
    [],
  );
  const [programaFilter, setProgramaFilter] = useState("TODOS");
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [periodoFilter, setPeriodoFilter] = useState("TODOS");
  const [searchText, setSearchText] = useState("");
  const [listadoPage, setListadoPage] = useState(1);
  const [periodoMatriculaVigente, setPeriodoMatriculaVigente] =
    useState<PeriodoAcademicoMatriculaVigenteDto | null>(null);
  const [isLoadingPeriodoVigente, setIsLoadingPeriodoVigente] = useState(false);
  const [isNotificandoApertura, setIsNotificandoApertura] = useState(false);
  const [isNotificacionConfirmationOpen, setIsNotificacionConfirmationOpen] =
    useState(false);
  const [notificacionAperturaError, setNotificacionAperturaError] = useState<string | null>(null);
  const [notificacionAperturaMessage, setNotificacionAperturaMessage] = useState<string | null>(null);

  const getMatriculaEstadoClassName = (estado: string) => {
    return `matricula-page__estado-badge matricula-page__estado-badge--${getMatriculaEstadoModifier(estado)}`;
  };

  const applyMatriculaValidation = (
    validation: Awaited<
      ReturnType<typeof getMatriculaVigenteValidationByEstudiante>
    >,
    materias: MateriaDto[],
  ) => {
    if (validation.status === "EXISTS") {
      setActiveMatricula(validation.matricula);
      setHasActiveMatriculaDates(true);
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

          return {
            id: asignatura.asignaturaId,
            nombre: materiaCatalogo?.nombre ?? asignatura.asignaturaNombre,
            codigo: materiaCatalogo?.codigo ?? asignatura.asignaturaCodigo,
            nivel: materiaCatalogo?.nivel ?? null,
            programaId: materiaCatalogo?.programaId,
            addedAt: new Date().toISOString(),
            matriculaAsignaturaId: asignatura.id,
            estado: asignatura.estado,
            grupo: asignatura.grupo,
            observaciones: asignatura.observaciones,
          } satisfies MateriaSeleccionada;
        })

      setSelectedMaterias(selectedFromMatricula);
      return;
    }

    if (validation.status === "NO_ACTIVE_PERIOD") {
      setActiveMatricula(null);
      setHasActiveMatriculaDates(false);
      setCanCreateMatricula(false);
      setHasExistingMatricula(false);
      setIsReadOnlyMatriculaFinalizada(false);
      setMatriculaValidationMessage(validation.message);
      return;
    }

    setHasActiveMatriculaDates(true);
    setActiveMatricula(null);
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
    setErrorDocumentos(null);
    try {
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
    } catch (error) {
      setDocumentos([]);
      setErrorDocumentos(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los documentos de la matrícula.",
      );
    }
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

        applyMatriculaValidation(matriculaValidation, []);
        if (matriculaValidation.status === "NO_ACTIVE_PERIOD") {
          return;
        }

        if (!convocatoriaResult.isOpen) {
          return;
        }

        setLoadingForm(true);
        setErrorForm(null);

        const [materiasResult] = await Promise.all([
          getAsignaturasPorPrograma(1),
          loadDocumentosMatricula(matriculaValidation),
        ]);

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
        setPeriodoFilter(
          resolvePeriodoActual(response.map((item) => item.periodoAcademico)),
        );
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

  useEffect(() => {
    if (!canManageMatriculas) {
      return;
    }

    let cancelled = false;

    const loadPeriodoMatriculaVigente = async () => {
      setIsLoadingPeriodoVigente(true);
      setNotificacionAperturaError(null);

      try {
        const periodoVigente = await getPeriodoMatriculaVigente();
        if (!cancelled) {
          setPeriodoMatriculaVigente(periodoVigente);
        }
      } catch (error) {
        if (!cancelled) {
          setNotificacionAperturaError(
            error instanceof Error
              ? error.message
              : "No fue posible verificar si hay un periodo de matrícula abierto.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPeriodoVigente(false);
        }
      }
    };

    void loadPeriodoMatriculaVigente();

    return () => {
      cancelled = true;
    };
  }, [canManageMatriculas]);

  const handleNotificarAperturaMatricula = async () => {
    if (!periodoMatriculaVigente) {
      return;
    }

    setIsNotificacionConfirmationOpen(false);
    setIsNotificandoApertura(true);
    setNotificacionAperturaError(null);
    setNotificacionAperturaMessage(null);

    try {
      const message = await notificarAperturaMatricula(
        periodoMatriculaVigente.periodo.id,
      );
      setNotificacionAperturaMessage(message);
      window.setTimeout(() => {
        setNotificacionAperturaMessage(null);
        setIsLoadingPeriodoVigente(true);
        void getPeriodoMatriculaVigente()
          .then((periodoVigente) => {
            setPeriodoMatriculaVigente(periodoVigente);
          })
          .catch((refreshError: unknown) => {
            setNotificacionAperturaError(
              refreshError instanceof Error
                ? refreshError.message
                : "No fue posible actualizar el estado de la notificación de apertura.",
            );
          })
          .finally(() => {
            setIsLoadingPeriodoVigente(false);
          });
      }, 5000);
    } catch (error) {
      setNotificacionAperturaError(
        error instanceof Error
          ? error.message
          : "No fue posible enviar la notificación de apertura de matrícula.",
      );
    } finally {
      setIsNotificandoApertura(false);
    }
  };

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
      setSubmissionStage("VALIDATING");
      setErrorForm(null);

      const latestValidation =
        await getMatriculaVigenteValidationByEstudiante(estudianteId);
      applyMatriculaValidation(latestValidation, materiasCatalogo);

      if (latestValidation.status === "NO_ACTIVE_PERIOD") {
        setErrorForm(
          latestValidation.message ||
            "No es posible crear matrícula en este momento.",
        );
        return;
      }

      setSubmissionStage("PREPARING_DOCUMENTS");
      await loadDocumentosMatricula(latestValidation);

      if (latestValidation.status === "CAN_CREATE") {
        setSubmissionStage("CREATING");
        await crearMatriculaAcademica({
          estudianteId,
          periodoId: latestValidation.periodoId,
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

      setSubmissionStage("UPLOADING");
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
      setSubmissionStage("FINALIZING");
      const documentosActualizados = await getDocumentosMatriculaAcademica(
        matriculaValidation.matricula.id,
      );
      setDocumentos(documentosActualizados.map(mapDocumentoCargadoToRequerido));

      if (
        documentosConCambios.some((documento) => documento.obligatorio) &&
        tieneDocumentosObligatoriosCargados(documentosActualizados)
      ) {
        await notificarDocumentosCompletosMatricula(
          matriculaValidation.matricula.id,
        );
      }

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible registrar la matrícula.";
      setErrorForm(message);
    } finally {
      setIsSubmitting(false);
      setSubmissionStage(null);
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

    return matriculas
      .filter((item) => {
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
    })
      .sort((a, b) => {
        const aTime = new Date(a.fechaSolicitud).getTime();
        const bTime = new Date(b.fechaSolicitud).getTime();

        return bTime - aTime;
      });
  }, [estadoFilter, matriculas, periodoFilter, programaFilter, searchText]);

  const listadoTotalPages = Math.max(
    1,
    Math.ceil(filteredMatriculas.length / LISTADO_PAGE_SIZE),
  );
  const safeListadoPage = Math.min(listadoPage, listadoTotalPages);
  const paginatedMatriculas = useMemo(
    () =>
      filteredMatriculas.slice(
        (safeListadoPage - 1) * LISTADO_PAGE_SIZE,
        safeListadoPage * LISTADO_PAGE_SIZE,
      ),
    [filteredMatriculas, safeListadoPage],
  );

  useEffect(() => {
    setListadoPage(1);
  }, [estadoFilter, periodoFilter, programaFilter, searchText]);

  const hasRejectedDocuments = useMemo(
    () => documentos.some((item) => item.estado === "RECHAZADO"),
    [documentos],
  );

  const requiredDocumentsSummary = useMemo(() => {
    if (errorDocumentos || documentos.length === 0) return null;
    const required = documentos.filter((documento) => documento.obligatorio);
    return {
      approved: required.filter((documento) => documento.estado === "APROBADO").length,
      total: required.length,
    };
  }, [documentos, errorDocumentos]);

  const isExistingMatriculaBlocked = Boolean(
    activeMatricula && activeMatricula.estado.trim().toUpperCase() !== "PENDIENTE_DOCUMENTOS",
  );
  const uploadBlockedReason = isExistingMatriculaBlocked
    ? `La carga no está disponible mientras la matrícula se encuentre en estado ${getMatriculaEstadoLabel(activeMatricula?.estado ?? "")}.`
    : null;

  const canConfirmMatricula = useMemo(() => {
    if (isSubmitting || isReadOnlyMatriculaFinalizada || isExistingMatriculaBlocked) {
      return false;
    }

    if (canCreateMatricula) {
      return selectedMaterias.length > 0;
    }

    if (hasExistingMatricula) {
      return hasRejectedDocuments;
    }

    return false;
  }, [
    canCreateMatricula,
    hasRejectedDocuments,
    hasExistingMatricula,
    isReadOnlyMatriculaFinalizada,
    isExistingMatriculaBlocked,
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
      <ModuleLayout title="Matrículas académicas">
        <div className="matricula-page">
          {periodoMatriculaVigente?.notificacionAperturaEnviada !== true ? <section className="matricula-page__card matricula-page__notification-card">
            <div>
              <h4>Notificación de inicio de matrícula</h4>
              {isLoadingPeriodoVigente ? (
                <p className="matricula-page__description" role="status">
                  Verificando fechas de matrícula vigentes...
                </p>
              ) : periodoMatriculaVigente ? (
                <p className="matricula-page__description">
                  Periodo {periodoMatriculaVigente.periodo.anioPeriodo}, habilitado del{" "}
                  {periodoMatriculaVigente.fechaInicio} al {periodoMatriculaVigente.fechaFin}.
                </p>
              ) : !notificacionAperturaError ? (
                <p className="matricula-page__description">
                  No hay un periodo de matrícula abierto para notificar.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="matricula-page__notification-button"
              disabled={
                isLoadingPeriodoVigente ||
                isNotificandoApertura ||
                !periodoMatriculaVigente
              }
              onClick={() => setIsNotificacionConfirmationOpen(true)}
            >
              {isNotificandoApertura ? "Enviando correo..." : "Enviar correo de inicio"}
            </button>
            {notificacionAperturaMessage ? (
              <p className="matricula-page__success" role="status">
                {notificacionAperturaMessage}
              </p>
            ) : null}
            {notificacionAperturaError ? (
              <p className="matricula-page__error" role="alert">
                {notificacionAperturaError}
              </p>
            ) : null}
          </section> : null}

          <section className="matricula-page__card matricula-page__filters sapp-filters-panel">
            <h3 className="matricula-page__list-title">Listado de matrículas académicas</h3>
            <div className="matricula-page__filters-top-row">
              <label className="sapp-filter-field matricula-page__filter-field">
                <span>Programa académico</span>
                <select
                  value={programaFilter}
                  onChange={(event) => setProgramaFilter(event.target.value)}
                >
                  {programas.map((programa) => (
                    <option key={programa} value={programa}>
                      {resolveProgramaLabel(programa)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sapp-filter-field matricula-page__filter-field">
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
              <label className="sapp-filter-field matricula-page__filter-field">
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
            </div>
            <label className="sapp-filter-field matricula-page__search-filter">
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
                      {paginatedMatriculas.map((item) => (
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
                              {getMatriculaEstadoLabel(item.estado)}
                            </span>
                          </td>
                          <td>{formatBackendDateTime(item.fechaSolicitud)}</td>
                          <td>
                            <Link
                              to={getMatriculaAcademicaDetallePath(item.id)}
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
                <div
                  className="matricula-page__mobile-list"
                  aria-label="Matrículas académicas"
                >
                  {filteredMatriculas.length === 0 ? (
                    <p className="matricula-page__placeholder">
                      No hay matrículas que coincidan con los filtros seleccionados.
                    </p>
                  ) : null}
                  {paginatedMatriculas.map((item) => (
                    <article className="matricula-page__mobile-card" key={item.id}>
                      <header className="matricula-page__mobile-card-header">
                        <div>
                          <h4>{item.estudianteNombreCompleto}</h4>
                          <p>Código UIS: {item.codigoEstudianteUis ?? "—"}</p>
                        </div>
                        <span className={getMatriculaEstadoClassName(item.estado)}>
                          {getMatriculaEstadoLabel(item.estado)}
                        </span>
                      </header>
                      <div className="matricula-page__mobile-card-academic">
                        <div>
                          <span className="matricula-page__mobile-label">Programa</span>
                          <p>{item.programaAcademico}</p>
                        </div>
                        <div>
                          <span className="matricula-page__mobile-label">Periodo</span>
                          <p>{item.periodoAcademico}</p>
                        </div>
                      </div>
                      <div className="matricula-page__mobile-date">
                        <span className="matricula-page__mobile-label">
                          Fecha y hora de solicitud
                        </span>
                        <p>{formatBackendDateTime(item.fechaSolicitud)}</p>
                      </div>
                      <Link
                        to={getMatriculaAcademicaDetallePath(item.id)}
                        className="matricula-page__detail-button matricula-page__mobile-detail-button"
                      >
                        Ver detalle
                      </Link>
                    </article>
                  ))}
                </div>
                {filteredMatriculas.length > 0 ? (
                  <footer
                    className="matricula-page__pagination"
                    aria-label="Paginación de matrículas académicas"
                  >
                    <button
                      type="button"
                      onClick={() => setListadoPage((page) => Math.max(1, page - 1))}
                      disabled={safeListadoPage <= 1}
                    >
                      Anterior
                    </button>
                    <span aria-live="polite">
                      Página {safeListadoPage} de {listadoTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setListadoPage((page) => Math.min(listadoTotalPages, page + 1))
                      }
                      disabled={safeListadoPage >= listadoTotalPages}
                    >
                      Siguiente
                    </button>
                  </footer>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
        {isNotificacionConfirmationOpen && periodoMatriculaVigente ? (
          <div
            className="matricula-page__confirmation-modal"
            role="presentation"
            onMouseDown={() => {
              if (!isNotificandoApertura) {
                setIsNotificacionConfirmationOpen(false);
              }
            }}
          >
            <section
              className="matricula-page__confirmation-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="matricula-notification-confirmation-title"
              aria-describedby="matricula-notification-confirmation-description"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="matricula-page__confirmation-icon" aria-hidden="true">
                ✉
              </div>
              <div>
                <p className="matricula-page__confirmation-eyebrow">Notificación de matrícula</p>
                <h2 id="matricula-notification-confirmation-title">Enviar correo de inicio</h2>
                <p id="matricula-notification-confirmation-description">
                  Se enviará la notificación de apertura de matrícula a los estudiantes del período {periodoMatriculaVigente.periodo.anioPeriodo}.
                </p>
              </div>
              <div className="matricula-page__confirmation-actions">
                <button
                  type="button"
                  className="matricula-page__confirmation-cancel"
                  onClick={() => setIsNotificacionConfirmationOpen(false)}
                  disabled={isNotificandoApertura}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="matricula-page__confirmation-submit"
                  onClick={() => void handleNotificarAperturaMatricula()}
                  disabled={isNotificandoApertura}
                >
                  {isNotificandoApertura ? "Enviando correo..." : "Enviar correo"}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Proceso de matrícula">
      <div className="matricula-page" aria-busy={isSubmitting}>
        {isSubmitting ? (
          <div className="matricula-page__progress" role="status" aria-live="assertive" aria-label="Procesando solicitud de matrícula">
            <span className="matricula-page__spinner" aria-hidden="true" />
            <strong>{
              submissionStage === "PREPARING_DOCUMENTS"
                ? "Preparando los documentos…"
                : submissionStage === "CREATING"
                  ? "Creando la matrícula…"
                  : submissionStage === "UPLOADING"
                    ? "Subiendo documentos…"
                    : submissionStage === "FINALIZING"
                      ? "Finalizando la solicitud…"
                      : "Validando la solicitud…"
            }</strong>
            <span>Espere mientras finaliza el proceso. No cierre ni modifique la solicitud.</span>
          </div>
        ) : null}
        <header className="matricula-page__header">
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

        {!loadingConvocatoria && convocatoria && (!convocatoria.isOpen || !hasActiveMatriculaDates) ? (
          <MatriculaClosedState
            message={
              !hasActiveMatriculaDates
                ? matriculaValidationMessage ?? undefined
                : convocatoria.mensaje
            }
          />
        ) : null}

        {!loadingConvocatoria && convocatoria?.isOpen && hasActiveMatriculaDates ? (
          <>
            {activeMatricula ? (
              <section className="matricula-page__card matricula-page__tracking" aria-labelledby="matricula-tracking-title">
                <header className="matricula-page__tracking-header">
                  <div>
                    <h4 id="matricula-tracking-title">Resumen de la matrícula</h4>
                    <p className="matricula-page__description">Consulta el estado informado para este periodo.</p>
                  </div>
                  <span className={getMatriculaEstadoClassName(activeMatricula.estado)}>
                    {getMatriculaEstadoLabel(activeMatricula.estado)}
                  </span>
                </header>
                <div className="matricula-page__tracking-grid">
                  <p><strong>Número de matrícula</strong><span>#{activeMatricula.id}</span></p>
                  {activeMatricula.programaAcademico ? (
                    <p><strong>Programa</strong><span>{activeMatricula.programaAcademico}</span></p>
                  ) : null}
                  <p><strong>Periodo</strong><span>{activeMatricula.periodoAcademico || "—"}</span></p>
                  <p><strong>Fecha de solicitud</strong><span>{formatBackendDateTime(activeMatricula.fechaSolicitud)}</span></p>
                  <p><strong>Fecha de revisión</strong><span>{formatBackendDateTime(activeMatricula.fechaRevision ?? null)}</span></p>
                </div>
                <div className="matricula-page__tracking-observations">
                  <strong>Observaciones de la matrícula</strong>
                  <p>{activeMatricula.observaciones?.trim() || "Sin observaciones registradas."}</p>
                </div>
              </section>
            ) : null}
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
                      disabled={isSubmitting || isReadOnlyMatriculaFinalizada || hasExistingMatricula}
                    />
                  ) : null}
                  <MateriasSelectedTable
                    selected={selectedMaterias}
                    disabled={isSubmitting || isReadOnlyMatriculaFinalizada || hasExistingMatricula}
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
              {errorDocumentos ? (
                <p className="matricula-page__error" role="alert">{errorDocumentos}</p>
              ) : null}
              {!loadingForm && !errorDocumentos && requiredDocumentsSummary ? (
                <p className="matricula-page__documents-summary">
                  Documentos obligatorios aprobados: <strong>{requiredDocumentsSummary.approved}/{requiredDocumentsSummary.total}</strong>
                </p>
              ) : null}
              {!loadingForm && !errorDocumentos ? (
                <DocumentosRequeridosTable
                  documentos={documentos}
                  showActions
                  uploadDisabledOnly={isSubmitting || isReadOnlyMatriculaFinalizada || isExistingMatriculaBlocked}
                  uploadBlockedReason={uploadBlockedReason}
                  onAction={(docId, action) => {
                    const documento = documentos.find((item) => item.id === docId);
                    if (!documento) {
                      return;
                    }

                    const fileBase64 = documento.uploadedBase64;
                    const mimeType = documento.uploadedMimeType;
                    const fileName = documento.uploadedFileName ?? `${documento.nombre}.pdf`;

                    if (action === "VER") {
                      if (!fileBase64 || !mimeType) {
                        setErrorForm("Este documento todavía no tiene un archivo disponible para visualizar.");
                        return;
                      }

                      openBase64InNewTab(fileBase64, mimeType, fileName);
                      return;
                    }

                    if (action === "DESCARGAR") {
                      if (!fileBase64 || !mimeType) {
                        setErrorForm("Este documento todavía no tiene un archivo disponible para descargar.");
                        return;
                      }

                      downloadBase64File(fileBase64, mimeType, fileName);
                    }
                  }}
                  onSelectFile={(docId, file) => {
                    if (file && !isPdfFile(file)) {
                      setDocumentos((current) =>
                        current.map((item) =>
                          item.id === docId
                            ? {
                                ...item,
                                selectedFile: null,
                                uploadStatus: item.uploadedFileName ? "UPLOADED" : "NOT_SELECTED",
                                errorMessage: "Solo se permiten archivos PDF.",
                              }
                            : item,
                        ),
                      );
                      return;
                    }

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

            {!isReadOnlyMatriculaFinalizada && (!hasExistingMatricula || hasRejectedDocuments) ? (
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
