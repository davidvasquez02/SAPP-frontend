import { useCallback, useEffect, useMemo, useState } from "react";
import { hasAnyRole, ROLES } from "../../auth/roleGuards";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "../../components";
import { useAuth } from "../../context/Auth";
import { getConvocatoriasAdmision } from "../../modules/admisiones/api/convocatoriaAdmisionService";
import type { ConvocatoriaAdmisionDto } from "../../modules/admisiones/api/convocatoriaAdmisionTypes";
import { getProgramaNombreLargo } from "../../modules/admisiones/utils/programNames";
import { parsePeriodo } from "../../modules/admisiones/utils/periodo";
import { isConvocatoriaVigente } from "../../modules/admisiones/utils/convocatoriaEstado";
import "./AdmisionesHomePage.css";

const PROGRAM_META = new Map<
  number,
  {
    code: string;
    icon: string;
  }
>([
  [1, { code: "61412 - MISI", icon: "▣" }],
  [2, { code: "61204 - DCC", icon: "010\n101" }],
]);

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const formatDateOnly = (value?: string | null): string => {
  const rawValue = value?.trim();

  if (!rawValue) {
    return "—";
  }

  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

    return Number.isNaN(parsedDate.getTime())
      ? "—"
      : DATE_ONLY_FORMATTER.format(parsedDate).replace(/\./g, "");
  }

  const parsedDate = new Date(rawValue);

  return Number.isNaN(parsedDate.getTime())
    ? "—"
    : DATE_ONLY_FORMATTER.format(parsedDate).replace(/\./g, "");
};

const sortByPeriodoDesc = (
  a: ConvocatoriaAdmisionDto,
  b: ConvocatoriaAdmisionDto,
): number => {
  const periodoA = parsePeriodo(a.periodo);
  const periodoB = parsePeriodo(b.periodo);

  if (periodoA.anio !== periodoB.anio) {
    return periodoB.anio - periodoA.anio;
  }

  return periodoB.semestre - periodoA.semestre;
};

const getConvocatoriaVigente = (
  convocatorias: ConvocatoriaAdmisionDto[],
): ConvocatoriaAdmisionDto | null => {
  const vigentes = convocatorias.filter((convocatoria) =>
    isConvocatoriaVigente(convocatoria),
  );

  return [...vigentes].sort(sortByPeriodoDesc)[0] ?? null;
};

const AdmisionesHomePage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaAdmisionDto[]>(
    [],
  );
  const [selectedPrevious, setSelectedPrevious] = useState<
    Record<number, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canManageConvocatorias =
    session?.kind === "SAPP" &&
    hasAnyRole(session.user.roles, [ROLES.ADMIN, ROLES.COORDINACION]);

  const loadConvocatorias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getConvocatoriasAdmision();
      setConvocatorias(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible cargar las convocatorias.";
      setError(message);
      setConvocatorias([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConvocatorias();
  }, [loadConvocatorias]);

  const programas = useMemo(() => {
    const grouped = new Map<
      number,
      {
        programaId: number;
        programa: string;
        convocatorias: ConvocatoriaAdmisionDto[];
      }
    >();

    convocatorias.forEach((convocatoria) => {
      if (!grouped.has(convocatoria.programaId)) {
        grouped.set(convocatoria.programaId, {
          programaId: convocatoria.programaId,
          programa: convocatoria.programa,
          convocatorias: [],
        });
      }

      grouped.get(convocatoria.programaId)?.convocatorias.push(convocatoria);
    });

    return Array.from(grouped.values()).sort(
      (a, b) => a.programaId - b.programaId,
    );
  }, [convocatorias]);

  const handleNavigate = useCallback(
    (convocatoria: ConvocatoriaAdmisionDto, programaNombre: string) => {
      navigate(`/admisiones/convocatoria/${convocatoria.id}`, {
        state: {
          programaId: convocatoria.programaId,
          programaNombre,
          periodoLabel: convocatoria.periodo,
          periodoAcademico: convocatoria.periodo,
          cupos: convocatoria.cupos,
        },
      });
    },
    [navigate],
  );

  const handlePreviousChange = useCallback(
    (
      programaId: number,
      programaNombre: string,
      anteriores: ConvocatoriaAdmisionDto[],
      value: string,
    ) => {
      setSelectedPrevious((prev) => ({ ...prev, [programaId]: value }));

      if (!value) {
        return;
      }

      const selectedId = Number(value);
      const selected = anteriores.find(
        (convocatoria) => convocatoria.id === selectedId,
      );

      if (!selected) {
        return;
      }

      handleNavigate(selected, programaNombre);
      setSelectedPrevious((prev) => ({ ...prev, [programaId]: "" }));
    },
    [handleNavigate],
  );

  return (
    <ModuleLayout title="Admisiones">
      <section className="admisiones-page" aria-label="Admisiones">
        <p className="admisiones-page__description">
          Gestiona las convocatorias de maestría y doctorado.
        </p>

        <section
          className="admisiones-section-card"
          aria-labelledby="admisiones-section-title"
        >
          <header className="admisiones-section-header">
            <div className="admisiones-section-header__content">
              <span className="admisiones-section-header__icon" aria-hidden="true">
                📣
              </span>
              <div>
                <h2
                  id="admisiones-section-title"
                  className="admisiones-section-header__title"
                >
                  Seleccione una convocatoria
                </h2>
                <p className="admisiones-section-header__description">
                  Elige un programa académico para ver la convocatoria vigente o
                  consultar convocatorias anteriores.
                </p>
              </div>
            </div>

            {canManageConvocatorias ? (
              <button
                type="button"
                className="admisiones-config-button"
                onClick={() => navigate("/fechas")}
              >
                <span aria-hidden="true">📅</span>
                Configurar fechas académicas
              </button>
            ) : null}
          </header>

          {isLoading ? (
            <p className="admisiones-status">Cargando convocatorias...</p>
          ) : null}

          {!isLoading && error ? (
            <div className="admisiones-status admisiones-status--error">
              <p>{error}</p>
              <button
                type="button"
                className="admisiones-retry-button"
                onClick={loadConvocatorias}
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!isLoading && !error && convocatorias.length === 0 ? (
            <p className="admisiones-status">
              No hay convocatorias disponibles.
            </p>
          ) : null}

          {!isLoading && !error && convocatorias.length > 0 ? (
            <div className="admisiones-program-grid">
              {programas.map((programa) => {
                const convocatoriaVigente = getConvocatoriaVigente(
                  programa.convocatorias,
                );
                const anteriores = convocatoriaVigente
                  ? programa.convocatorias.filter(
                      (convocatoria) =>
                        convocatoria.id !== convocatoriaVigente.id,
                    )
                  : programa.convocatorias;
                const anterioresOrdenadas = [...anteriores].sort(
                  sortByPeriodoDesc,
                );
                const programaNombre = getProgramaNombreLargo(
                  programa.programaId,
                  programa.programa,
                );
                const programaMeta = PROGRAM_META.get(programa.programaId);

                return (
                  <article
                    key={programa.programaId}
                    className="admisiones-program-card"
                  >
                    <header className="admisiones-program-card__header">
                      <span
                        className="admisiones-program-card__icon"
                        aria-hidden="true"
                      >
                        {programaMeta?.icon ?? "🎓"}
                      </span>
                      <div>
                        <h3 className="admisiones-program-card__title">
                          {programaNombre}
                        </h3>
                        <p className="admisiones-program-card__code">
                          {programaMeta?.code ?? programa.programa}
                        </p>
                      </div>
                    </header>

                    <section className="admisiones-current-callout">
                      <div className="admisiones-current-callout__header">
                        <span
                          className="admisiones-current-callout__label"
                          aria-live="polite"
                        >
                          <span
                            className="admisiones-current-callout__dot"
                            aria-hidden="true"
                          />
                          Convocatoria vigente
                        </span>
                        <span
                          className={`admisiones-current-callout__badge ${
                            convocatoriaVigente
                              ? "admisiones-current-callout__badge--active"
                              : "admisiones-current-callout__badge--inactive"
                          }`}
                        >
                          {convocatoriaVigente ? "VIGENTE" : "SIN VIGENCIA"}
                        </span>
                      </div>

                      {convocatoriaVigente ? (
                        <div className="admisiones-date-grid">
                          <div className="admisiones-date-item">
                            <span
                              className="admisiones-date-item__icon"
                              aria-hidden="true"
                            >
                              📅
                            </span>
                            <div>
                              <span className="admisiones-date-item__label">
                                Fecha de inicio
                              </span>
                              <strong className="admisiones-date-item__value">
                                {formatDateOnly(convocatoriaVigente.fechaInicio)}
                              </strong>
                            </div>
                          </div>
                          <div className="admisiones-date-item">
                            <span
                              className="admisiones-date-item__icon"
                              aria-hidden="true"
                            >
                              📅
                            </span>
                            <div>
                              <span className="admisiones-date-item__label">
                                Fecha de fin
                              </span>
                              <strong className="admisiones-date-item__value">
                                {formatDateOnly(convocatoriaVigente.fechaFin)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="admisiones-current-callout__empty">
                          No hay convocatoria vigente para este programa.
                        </p>
                      )}

                      <button
                        type="button"
                        className="admisiones-enter-button"
                        disabled={!convocatoriaVigente}
                        onClick={() =>
                          convocatoriaVigente &&
                          handleNavigate(convocatoriaVigente, programaNombre)
                        }
                      >
                        Entrar a la convocatoria
                        <span aria-hidden="true">→</span>
                      </button>
                    </section>

                    <div className="admisiones-previous-select">
                      <label
                        className="admisiones-previous-select__label"
                        htmlFor={`prev-${programa.programaId}`}
                      >
                        Convocatorias anteriores
                      </label>

                      {anterioresOrdenadas.length === 0 ? (
                        <p className="admisiones-previous-select__empty">
                          No hay convocatorias anteriores.
                        </p>
                      ) : (
                        <select
                          id={`prev-${programa.programaId}`}
                          className="admisiones-previous-select__control"
                          value={selectedPrevious[programa.programaId] ?? ""}
                          onChange={(event) =>
                            handlePreviousChange(
                              programa.programaId,
                              programaNombre,
                              anterioresOrdenadas,
                              event.target.value,
                            )
                          }
                        >
                          <option value="">Seleccione un período...</option>
                          {anterioresOrdenadas.map((convocatoria) => (
                            <option key={convocatoria.id} value={convocatoria.id}>
                              {convocatoria.periodo}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </section>
    </ModuleLayout>
  );
};

export default AdmisionesHomePage;
