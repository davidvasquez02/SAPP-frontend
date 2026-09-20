import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ScrollText, UsersRound } from "lucide-react";
import { BackButton, ModuleLayout } from "../../components";
import { ROLES, hasAnyRole } from "../../auth/roleGuards";
import { useAuth } from "../../context/Auth";
import { getConvocatoriasAdmision } from "../../modules/admisiones/api/convocatoriaAdmisionService";
import type { ConvocatoriaAdmisionDto } from "../../modules/admisiones/api/convocatoriaAdmisionTypes";
import { getInscripcionesByConvocatoria } from "../../modules/admisiones/api/inscripcionAdmisionService";
import type { InscripcionAdmisionDto } from "../../modules/admisiones/api/types";
import { CreateAspiranteModal } from "../../modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal";
import { CreateEstudianteModal } from "../../modules/admisiones/components/CreateEstudianteModal/CreateEstudianteModal";
import StudentCard from "../../modules/admisiones/components/StudentCard/StudentCard";
import { isConvocatoriaVigente } from "../../modules/admisiones/utils/convocatoriaEstado";
import { resolveProgramaIdFromInscripciones } from "../../modules/admisiones/utils/resolveProgramaId";
import "./ConvocatoriaDetallePage.css";

const BOARD_DRAG_THRESHOLD = 8;

const normalizeEstado = (estado?: string | null) =>
  (estado ?? "").trim().toUpperCase().replaceAll(" ", "_");

const ConvocatoriaDetallePage = () => {
  const { convocatoriaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });
  const suppressBoardClickRef = useRef(false);

  const [inscripciones, setInscripciones] = useState<InscripcionAdmisionDto[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAspirante, setSelectedAspirante] =
    useState<InscripcionAdmisionDto | null>(null);
  const [createdAspiranteIds, setCreatedAspiranteIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [convocatoria, setConvocatoria] =
    useState<ConvocatoriaAdmisionDto | null>(null);
  const [boardOverflow, setBoardOverflow] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const { periodoAcademico, periodoLabel, programaNombre, programaId, cupos } =
    useMemo(() => {
      return (
        (location.state as {
          periodoAcademico?: string;
          periodoLabel?: string;
          programaNombre?: string;
          programaId?: number;
          cupos?: number;
        } | null) ?? {}
      );
    }, [location.state]);

  const resolvedProgramaId = useMemo(() => {
    if (typeof programaId === "number") {
      return programaId;
    }

    return resolveProgramaIdFromInscripciones(inscripciones);
  }, [inscripciones, programaId]);

  const canCreateAspirante =
    session?.kind === "SAPP" &&
    hasAnyRole(session.user.roles, [
      ROLES.COORDINACION,
      ROLES.SECRETARIA,
      ROLES.ADMIN,
    ]);

  const parsedConvocatoriaId = useMemo(() => {
    if (!convocatoriaId) {
      return null;
    }

    const convocatoriaIdNumber = Number(convocatoriaId);
    return Number.isNaN(convocatoriaIdNumber) ? null : convocatoriaIdNumber;
  }, [convocatoriaId]);

  const periodoConvocatoria =
    periodoLabel ??
    periodoAcademico ??
    inscripciones[0]?.periodoAcademico ??
    convocatoria?.periodo ??
    null;
  const programaConvocatoria =
    programaNombre ??
    inscripciones[0]?.programaAcademico ??
    convocatoria?.programa ??
    null;

  const cuposConvocatoria = typeof cupos === "number" ? cupos : null;
  const cuposExcedidos =
    typeof cuposConvocatoria === "number" &&
    inscripciones.length >= cuposConvocatoria;
  const convocatoriaCerrada = convocatoria
    ? !convocatoria.vigente || !isConvocatoriaVigente(convocatoria)
    : false;
  const aspirantesAdmitidos = useMemo(
    () =>
      inscripciones.filter(
        (inscripcion) => normalizeEstado(inscripcion.estado) === "ADMITIDO",
      ),
    [inscripciones],
  );
  const summaryStats = useMemo(() => {
    const admitidos = inscripciones.filter(
      (inscripcion) => normalizeEstado(inscripcion.estado) === "ADMITIDO",
    ).length;
    const enEvaluacion = inscripciones.filter((inscripcion) => {
      const estado = normalizeEstado(inscripcion.estado);
      return (
        estado.includes("EVALUACION") ||
        estado.includes("REVISION") ||
        estado.includes("VALIDACION") ||
        estado.includes("POR_VALIDAR")
      );
    }).length;
    const noAdmitidos = inscripciones.filter((inscripcion) => {
      const estado = normalizeEstado(inscripcion.estado);
      return estado.includes("RECHAZADO") || estado.includes("NO_ADMITIDO");
    }).length;

    return [
      {
        label: "Aspirantes inscritos",
        value: inscripciones.length,
        icon: "users",
        tone: "primary",
      },
      { label: "Admitidos", value: admitidos, icon: "✓", tone: "success" },
      { label: "En evaluación", value: enEvaluacion, icon: "◷", tone: "info" },
      { label: "No admitidos", value: noAdmitidos, icon: "×", tone: "danger" },
    ];
  }, [inscripciones]);

  const loadInscripciones = useCallback(async () => {
    if (!convocatoriaId) {
      setError("Convocatoria inválida.");
      return;
    }

    const convocatoriaIdNumber = Number(convocatoriaId);

    if (Number.isNaN(convocatoriaIdNumber)) {
      setError("Convocatoria inválida.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [data, convocatorias] = await Promise.all([
        getInscripcionesByConvocatoria(convocatoriaIdNumber),
        getConvocatoriasAdmision(),
      ]);
      setInscripciones(data);
      setConvocatoria(
        convocatorias.find((item) => item.id === convocatoriaIdNumber) ?? null,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible cargar las inscripciones.";
      const normalizedMessage = message.toLowerCase();
      const isEmptyInscripcionesResponse =
        normalizedMessage.includes("inscrip") &&
        (normalizedMessage.includes("no hay") ||
          normalizedMessage.includes("no existe") ||
          normalizedMessage.includes("sin registros"));

      if (isEmptyInscripcionesResponse) {
        setInscripciones([]);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [convocatoriaId]);

  useEffect(() => {
    if (!convocatoriaId) {
      setError("Convocatoria inválida.");
      return;
    }

    const convocatoriaIdNumber = Number(convocatoriaId);
    if (Number.isNaN(convocatoriaIdNumber)) {
      setError("Convocatoria inválida.");
      return;
    }

    loadInscripciones();
  }, [convocatoriaId, loadInscripciones]);

  const resolveAspirantePhoto = (
    inscripcion: InscripcionAdmisionDto,
  ): string | null => {
    const contenidoBase64 = inscripcion.foto?.contenidoBase64?.trim();
    if (!contenidoBase64) {
      return null;
    }

    const mimeType = inscripcion.foto?.mimeType?.trim() || "image/jpeg";
    return `data:${mimeType};base64,${contenidoBase64}`;
  };

  const handleRowClick = (inscripcion: InscripcionAdmisionDto) => {
    if (!convocatoriaId) {
      return;
    }

    navigate(
      `/admisiones/convocatoria/${convocatoriaId}/inscripcion/${inscripcion.id}`,
      {
        state: {
          nombreAspirante: inscripcion.nombreAspirante,
          periodoAcademico: inscripcion.periodoAcademico,
          inscripcionId: inscripcion.id,
          inscripcionEstado: inscripcion.estado,
        },
      },
    );
  };

  const updateBoardOverflow = useCallback(() => {
    const board = boardRef.current;
    if (!board) {
      setBoardOverflow({
        hasOverflow: false,
        canScrollLeft: false,
        canScrollRight: false,
      });
      return;
    }

    const maxScrollLeft = Math.max(0, board.scrollWidth - board.clientWidth);
    setBoardOverflow({
      hasOverflow: maxScrollLeft > 2,
      canScrollLeft: board.scrollLeft > 2,
      canScrollRight: board.scrollLeft < maxScrollLeft - 2,
    });
  }, []);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || inscripciones.length === 0) {
      updateBoardOverflow();
      return;
    }

    updateBoardOverflow();
    const resizeObserver = new ResizeObserver(updateBoardOverflow);
    resizeObserver.observe(board);
    Array.from(board.children).forEach((child) => resizeObserver.observe(child));
    board.addEventListener("scroll", updateBoardOverflow, { passive: true });

    return () => {
      resizeObserver.disconnect();
      board.removeEventListener("scroll", updateBoardOverflow);
    };
  }, [inscripciones, updateBoardOverflow]);

  const scrollBoard = (direction: "left" | "right") => {
    const board = boardRef.current;
    if (!board) return;
    const distance = Math.max(240, board.clientWidth * 0.82);
    board.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    });
  };

  const handleBoardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const board = boardRef.current;
    if (!board) return;
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: board.scrollLeft,
      moved: false,
    };
    board.setPointerCapture(event.pointerId);
  };

  const handleBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    const drag = dragStateRef.current;
    if (!board || !drag.active) return;
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < BOARD_DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      board.classList.add("is-dragging");
    }
    board.scrollLeft = drag.startScrollLeft - delta;
  };

  const finishBoardDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    const wasMoved = dragStateRef.current.moved;
    dragStateRef.current.active = false;
    dragStateRef.current.moved = false;
    board?.classList.remove("is-dragging");
    if (board?.hasPointerCapture(event.pointerId)) {
      board.releasePointerCapture(event.pointerId);
    }
    if (wasMoved) suppressBoardClickRef.current = true;
  };

  const handleBoardClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressBoardClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressBoardClickRef.current = false;
  };

  const handleBoardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      scrollBoard(event.key === "ArrowRight" ? "right" : "left");
    }
  };

  const handleCreated = useCallback(
    (result: { uploadSummary: { failedItems: { id: number }[] } }) => {
      if (result.uploadSummary.failedItems.length > 0) {
        setSuccessMessage(
          `Aspirante creado. Falló la carga de ${result.uploadSummary.failedItems.length} documento(s).`,
        );
      } else {
        setSuccessMessage(
          "Aspirante creado y documentos cargados correctamente.",
        );
      }
      loadInscripciones();
    },
    [loadInscripciones],
  );

  const handleOpenCreateAspirante = useCallback(() => {
    if (!convocatoria || convocatoriaCerrada) {
      window.alert(
        "No es posible crear aspirantes porque la convocatoria está cerrada.",
      );
      return;
    }

    if (cuposExcedidos) {
      window.alert(
        `No es posible crear más aspirantes: la convocatoria alcanzó su cupo máximo (${cuposConvocatoria}).`,
      );
      return;
    }

    setIsCreateModalOpen(true);
  }, [convocatoria, convocatoriaCerrada, cuposConvocatoria, cuposExcedidos]);

  return (
    <ModuleLayout title="Admisiones">
      <section className="admission-detail-page convocatoria-detalle">
        <BackButton to="/admisiones">Volver a convocatorias</BackButton>

        <header className="admission-detail-header convocatoria-detalle__header">
          <div className="admission-detail-header__content">
            <h1 className="admission-detail-header__title convocatoria-detalle__title">
              Aspirantes inscritos
            </h1>

            <div
              className="admission-context-chips"
              aria-label="Contexto de la convocatoria"
            >
              {periodoConvocatoria ? (
                <span className="admission-context-chip">
                  <span aria-hidden="true">📅</span> Período:{" "}
                  {periodoConvocatoria}
                </span>
              ) : null}
              {programaConvocatoria ? (
                <span className="admission-context-chip">
                  <span aria-hidden="true">🎓</span> Programa:{" "}
                  {programaConvocatoria}
                </span>
              ) : null}
            </div>

            {successMessage ? (
              <p className="convocatoria-detalle__status convocatoria-detalle__status--success">
                {successMessage}
              </p>
            ) : null}
          </div>

          {convocatoriaCerrada || canCreateAspirante ? (
            <div className="convocatoria-detalle__actions">
              {convocatoriaCerrada ? (
                <aside className="convocatoria-detalle__closed-notice">
                  <ScrollText aria-hidden="true" />
                  <div>
                    <strong>Inscripciones cerradas</strong>
                    <p>
                      El registro de nuevos aspirantes no está disponible para
                      esta convocatoria.
                    </p>
                  </div>
                </aside>
              ) : canCreateAspirante ? <button
                type="button"
                className="convocatoria-detalle__create-button"
                onClick={handleOpenCreateAspirante}
                disabled={
                  !resolvedProgramaId ||
                  !parsedConvocatoriaId ||
                  !convocatoria ||
                  isLoading ||
                  cuposExcedidos
                }
              >
                <span aria-hidden="true">＋</span> Crear aspirante
              </button> : null}
              {(!resolvedProgramaId || !parsedConvocatoriaId) &&
                !isLoading &&
                !error ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  No se pudo determinar el programa o el identificador de la
                  convocatoria.
                </p>
              ) : null}
              {cuposExcedidos && !convocatoriaCerrada ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  Cupo máximo alcanzado ({cuposConvocatoria}). No se pueden
                  registrar más aspirantes.
                </p>
              ) : null}
            </div>
          ) : null}
        </header>

        {!isLoading && !error ? (
          <div
            className="admission-stats-grid"
            aria-label="Resumen de aspirantes"
          >
            {summaryStats.map((stat) => {
              return (
              <article
                key={stat.label}
                className={`admission-stat-card admission-stat-card--${stat.tone}`}
              >
                <span className="admission-stat-card__icon" aria-hidden="true">
                  {stat.icon === "users" ? (
                    <UsersRound size={20} strokeWidth={2.4} />
                  ) : stat.icon}
                </span>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </article>
            )})}
          </div>
        ) : null}

        {!isLoading && !error && convocatoriaCerrada && canCreateAspirante ? (
          <section className="convocatoria-detalle__admitir-panel" aria-labelledby="crear-estudiantes-title">
            <div>
              <p className="admission-detail-header__eyebrow">✓ Convocatoria cerrada</p>
              <h2 id="crear-estudiantes-title">Crear estudiantes admitidos</h2>
              <p>Asigna el código UIS y el correo institucional a cada aspirante admitido.</p>
            </div>
            {aspirantesAdmitidos.length === 0 ? (
              <p>No hay aspirantes con estado ADMITIDO en esta convocatoria.</p>
            ) : (
              <>
                <div className="convocatoria-detalle__table-wrap">
                <table className="convocatoria-detalle__table">
                  <thead><tr><th>Aspirante</th><th>Documento</th><th>Acción</th></tr></thead>
                  <tbody>
                    {aspirantesAdmitidos.map((aspirante) => {
                      const wasCreated = createdAspiranteIds.has(aspirante.aspiranteId);
                      const alreadyExistsAsEstudiante = aspirante.idPersona != null;
                      const cannotCreateEstudiante =
                        alreadyExistsAsEstudiante || wasCreated;
                      return (
                        <tr key={aspirante.id}>
                          <td>{aspirante.nombreAspirante}</td>
                          <td>{aspirante.numeroDocumento ?? aspirante.cedula ?? "—"}</td>
                          <td>
                            {cannotCreateEstudiante ? (
                              <span className="convocatoria-detalle__student-created">
                                <span aria-hidden="true">✓</span> Estudiante creado
                              </span>
                            ) : (
                              <button type="button" className="convocatoria-detalle__student-button" onClick={() => setSelectedAspirante(aspirante)}>
                                Crear estudiante
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                <div className="convocatoria-detalle__admitted-cards">
                {aspirantesAdmitidos.map((aspirante) => {
                  const cannotCreateEstudiante =
                    aspirante.idPersona != null ||
                    createdAspiranteIds.has(aspirante.aspiranteId);
                  return (
                    <article className="convocatoria-detalle__admitted-card" key={aspirante.id}>
                      <strong>{aspirante.nombreAspirante}</strong>
                      <div>
                        <span>Documento</span>
                        <b>{aspirante.numeroDocumento ?? aspirante.cedula ?? "—"}</b>
                      </div>
                      {cannotCreateEstudiante ? (
                        <span className="convocatoria-detalle__student-created">
                          <span aria-hidden="true">✓</span> Estudiante creado
                        </span>
                      ) : (
                        <button type="button" className="convocatoria-detalle__student-button" onClick={() => setSelectedAspirante(aspirante)}>
                          Crear estudiante
                        </button>
                      )}
                    </article>
                  );
                })}
                </div>
              </>
            )}
          </section>
        ) : null}

        {isLoading ? (
          <div className="convocatoria-detalle__skeletons" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="convocatoria-detalle__skeleton"
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="convocatoria-detalle__status convocatoria-detalle__status--error">
            <p>{error}</p>
            <button
              className="convocatoria-detalle__retry"
              type="button"
              onClick={loadInscripciones}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error ? (
          <section
            className="applicants-board"
            aria-labelledby="applicants-board-title"
          >
            <div className="applicants-board-header">
              <div>
                <h2 id="applicants-board-title">Listado de aspirantes</h2>
                {boardOverflow.hasOverflow ? (
                  <p>Desliza horizontalmente para ver más aspirantes</p>
                ) : null}
              </div>
              {boardOverflow.hasOverflow ? <div
                className="applicants-board-header__controls"
                aria-label="Controles de desplazamiento horizontal"
              >
                <button
                  type="button"
                  aria-label="Desplazar aspirantes a la izquierda"
                  onClick={() => scrollBoard("left")}
                  disabled={!boardOverflow.canScrollLeft}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  aria-label="Desplazar aspirantes a la derecha"
                  onClick={() => scrollBoard("right")}
                  disabled={!boardOverflow.canScrollRight}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div> : null}
            </div>

            {inscripciones.length === 0 ? (
              <div className="convocatoria-detalle__empty">
                <span aria-hidden="true">👤</span>
                <p>No hay aspirantes inscritos en esta convocatoria.</p>
              </div>
            ) : (
              <div
                ref={boardRef}
                className="applicants-horizontal-board convocatoria-detalle__grid"
                tabIndex={0}
                aria-label="Listado horizontal de aspirantes inscritos"
                onPointerDown={handleBoardPointerDown}
                onPointerMove={handleBoardPointerMove}
                onPointerUp={finishBoardDrag}
                onPointerCancel={finishBoardDrag}
                onClickCapture={handleBoardClickCapture}
                onKeyDown={handleBoardKeyDown}
              >
                {inscripciones.map((inscripcion) => (
                  <StudentCard
                    key={inscripcion.id}
                    inscripcion={inscripcion}
                    photoUrl={resolveAspirantePhoto(inscripcion)}
                    onClick={() => handleRowClick(inscripcion)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </section>

      <CreateAspiranteModal
        open={isCreateModalOpen && Boolean(convocatoria) && !convocatoriaCerrada}
        onClose={() => setIsCreateModalOpen(false)}
        programaId={resolvedProgramaId}
        convocatoriaAdmisionId={parsedConvocatoriaId}
        onCreated={handleCreated}
      />
      <CreateEstudianteModal
        aspirante={selectedAspirante}
        onClose={() => setSelectedAspirante(null)}
        onCreated={(estudiante) => {
          setCreatedAspiranteIds((current) => new Set(current).add(estudiante.idAspirante));
          setSuccessMessage(`Estudiante ${estudiante.codigoEstudianteUis} creado correctamente.`);
        }}
      />
    </ModuleLayout>
  );
};

export default ConvocatoriaDetallePage;
