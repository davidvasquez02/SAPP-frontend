import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ModuleLayout } from "../../components";
import { ROLES, hasAnyRole } from "../../auth/roleGuards";
import { useAuth } from "../../context/Auth";
import { getConvocatoriasAdmision } from "../../modules/admisiones/api/convocatoriaAdmisionService";
import type { ConvocatoriaAdmisionDto } from "../../modules/admisiones/api/convocatoriaAdmisionTypes";
import { getInscripcionesByConvocatoria } from "../../modules/admisiones/api/inscripcionAdmisionService";
import type { InscripcionAdmisionDto } from "../../modules/admisiones/api/types";
import { CreateAspiranteModal } from "../../modules/admisiones/components/CreateAspiranteModal/CreateAspiranteModal";
import StudentCard from "../../modules/admisiones/components/StudentCard/StudentCard";
import { resolveProgramaIdFromInscripciones } from "../../modules/admisiones/utils/resolveProgramaId";
import "./ConvocatoriaDetallePage.css";

const BOARD_SCROLL_DISTANCE = 320;

const normalizeEstado = (estado?: string | null) =>
  (estado ?? "").trim().toUpperCase().replaceAll(" ", "_");

const ConvocatoriaDetallePage = () => {
  const { convocatoriaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [inscripciones, setInscripciones] = useState<InscripcionAdmisionDto[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [convocatoria, setConvocatoria] =
    useState<ConvocatoriaAdmisionDto | null>(null);

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
        icon: "👥",
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

  const scrollBoard = (direction: "left" | "right") => {
    boardRef.current?.scrollBy({
      left:
        direction === "right" ? BOARD_SCROLL_DISTANCE : -BOARD_SCROLL_DISTANCE,
      behavior: "smooth",
    });
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
    // AJUSTE TEMPORAL PARA PRUEBAS (2026-06-02): permitir crear aspirantes aunque la convocatoria esté cerrada.
    // Revertir después de las pruebas para restaurar el bloqueo por convocatoria cerrada.
    if (cuposExcedidos) {
      window.alert(
        `No es posible crear más aspirantes: la convocatoria alcanzó su cupo máximo (${cuposConvocatoria}).`,
      );
      return;
    }

    setIsCreateModalOpen(true);
  }, [cuposConvocatoria, cuposExcedidos]);

  return (
    <ModuleLayout title="Admisiones">
      <section className="admission-detail-page convocatoria-detalle">
        <Link
          className="admission-detail-page__back convocatoria-detalle__back"
          to="/admisiones"
        >
          ← Volver a convocatorias
        </Link>

        <header className="admission-detail-header convocatoria-detalle__header">
          <div className="admission-detail-header__content">
            <p className="admission-detail-header__eyebrow">▧ Convocatoria</p>
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

          {canCreateAspirante ? (
            <div className="convocatoria-detalle__actions">
              {/* AJUSTE TEMPORAL PARA PRUEBAS (2026-06-02): antes este botón se ocultaba cuando la convocatoria estaba cerrada.
                  Revertir tras validar creación de aspirantes/estudiantes en convocatorias cerradas. */}
              <button
                type="button"
                className="convocatoria-detalle__create-button"
                onClick={handleOpenCreateAspirante}
                disabled={
                  !resolvedProgramaId ||
                  !parsedConvocatoriaId ||
                  isLoading ||
                  cuposExcedidos
                }
              >
                <span aria-hidden="true">＋</span> Crear aspirante
              </button>
              {(!resolvedProgramaId || !parsedConvocatoriaId) &&
              !isLoading &&
              !error ? (
                <p className="convocatoria-detalle__status convocatoria-detalle__status--error">
                  No se pudo determinar el programa o el identificador de la
                  convocatoria.
                </p>
              ) : null}
              {cuposExcedidos ? (
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
            {summaryStats.map((stat) => (
              <article
                key={stat.label}
                className={`admission-stat-card admission-stat-card--${stat.tone}`}
              >
                <span className="admission-stat-card__icon" aria-hidden="true">
                  {stat.icon}
                </span>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </article>
            ))}
          </div>
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
                <p>Desliza horizontalmente para ver más aspirantes</p>
              </div>
              <div
                className="applicants-board-header__controls"
                aria-label="Controles de desplazamiento horizontal"
              >
                <button
                  type="button"
                  aria-label="Desplazar aspirantes a la izquierda"
                  onClick={() => scrollBoard("left")}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Desplazar aspirantes a la derecha"
                  onClick={() => scrollBoard("right")}
                >
                  →
                </button>
              </div>
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
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        programaId={resolvedProgramaId}
        convocatoriaAdmisionId={parsedConvocatoriaId}
        onCreated={handleCreated}
      />
    </ModuleLayout>
  );
};

export default ConvocatoriaDetallePage;
