import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { canManagePosgrados } from "../../auth/roleGuards";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "../../components";
import { useAuth } from "../../context/Auth";
import { getConvocatoriasAdmision } from "../../modules/admisiones/api/convocatoriaAdmisionService";
import type { ConvocatoriaAdmisionDto } from "../../modules/admisiones/api/convocatoriaAdmisionTypes";
import { getProgramaNombreLargo } from "../../modules/admisiones/utils/programNames";
import { parsePeriodo } from "../../modules/admisiones/utils/periodo";
import { isConvocatoriaVigente } from "../../modules/admisiones/utils/convocatoriaEstado";
import { CompactPeriodSelect } from "./CompactPeriodSelect";
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

const getPeriodoAcademicoActual = (): { anio: number; semestre: number } => {
  const parts = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const anio = Number(parts.find((part) => part.type === "year")?.value);
  const mes = Number(parts.find((part) => part.type === "month")?.value);

  return { anio, semestre: mes <= 6 ? 1 : 2 };
};

const getConvocatoriaDestacada = (
  convocatorias: ConvocatoriaAdmisionDto[],
): ConvocatoriaAdmisionDto | null => {
  const periodoActual = getPeriodoAcademicoActual();
  const delPeriodoActual = convocatorias.filter((convocatoria) => {
    const periodo = parsePeriodo(convocatoria.periodo);

    return (
      periodo.anio === periodoActual.anio &&
      periodo.semestre === periodoActual.semestre
    );
  });

  if (delPeriodoActual.length > 0) {
    return [...delPeriodoActual].sort(
      (a, b) =>
        Number(isConvocatoriaVigente(b)) -
        Number(isConvocatoriaVigente(a)),
    )[0];
  }

  const vigentes = convocatorias.filter((convocatoria) =>
    isConvocatoriaVigente(convocatoria),
  );

  return [...vigentes].sort(sortByPeriodoDesc)[0] ?? null;
};

const MOBILE_PROGRAM_QUERY = "(max-width: 900px)";

const useMobileProgramLayout = (): boolean => {
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia(MOBILE_PROGRAM_QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_PROGRAM_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
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
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const programTabRefs = useRef(new Map<number, HTMLButtonElement>());
  const isMobileProgramLayout = useMobileProgramLayout();
  const canManageConvocatorias =
    session?.kind === "SAPP" &&
    canManagePosgrados(session.user.roles);

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

  const activeProgramId =
    selectedProgramId !== null &&
    programas.some(({ programaId }) => programaId === selectedProgramId)
      ? selectedProgramId
      : (programas[0]?.programaId ?? null);

  const selectProgramAndFocus = useCallback((programaId: number) => {
    setSelectedProgramId(programaId);
    requestAnimationFrame(() => programTabRefs.current.get(programaId)?.focus());
  }, []);

  const handleProgramTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, programaId: number) => {
      const currentIndex = programas.findIndex((programa) => programa.programaId === programaId);
      if (currentIndex < 0) return;

      let nextIndex: number | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % programas.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + programas.length) % programas.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = programas.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        selectProgramAndFocus(programas[nextIndex].programaId);
      }
    },
    [programas, selectProgramAndFocus],
  );

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
    <ModuleLayout title="Admisiones" compactOnMobile>
      <section
        className="admisiones-section-card"
        aria-labelledby="admisiones-section-title"
      >
        <header className="admisiones-section-header">
          <div className="admisiones-section-header__content">
            {/* <span className="admisiones-section-header__icon" aria-hidden="true">
              📣
            </span> */}
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
          <>
            <div
              className="admisiones-program-tabs"
              role="tablist"
              aria-label="Seleccione el programa académico"
            >
              {programas.map((programa) => {
                const isSelected = programa.programaId === activeProgramId;
                const programaNombre = getProgramaNombreLargo(
                  programa.programaId,
                  programa.programa,
                );
                const shortName = programaNombre.toLocaleLowerCase("es").includes("doctorado")
                  ? "Doctorado"
                  : programaNombre.toLocaleLowerCase("es").includes("maestría")
                    ? "Maestría"
                    : programa.programa;

                return (
                  <button
                    key={programa.programaId}
                    ref={(element) => {
                      if (element) programTabRefs.current.set(programa.programaId, element);
                      else programTabRefs.current.delete(programa.programaId);
                    }}
                    id={`program-tab-${programa.programaId}`}
                    type="button"
                    className="admisiones-program-tab"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={`program-panel-${programa.programaId}`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelectedProgramId(programa.programaId)}
                    onKeyDown={(event) => handleProgramTabKeyDown(event, programa.programaId)}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>

            <div className="admisiones-program-grid">
            {programas.map((programa) => {
              const convocatoriaDestacada = getConvocatoriaDestacada(
                programa.convocatorias,
              );
              const convocatoriaEstaAbierta = convocatoriaDestacada
                ? isConvocatoriaVigente(convocatoriaDestacada)
                : false;
              const periodoActual = getPeriodoAcademicoActual();
              const periodoDestacado = convocatoriaDestacada
                ? parsePeriodo(convocatoriaDestacada.periodo)
                : null;
              const convocatoriaEsDelPeriodoActual = Boolean(
                periodoDestacado &&
                periodoDestacado.anio === periodoActual.anio &&
                periodoDestacado.semestre === periodoActual.semestre,
              );
              const anteriores = convocatoriaDestacada
                ? programa.convocatorias.filter(
                  (convocatoria) =>
                    convocatoria.id !== convocatoriaDestacada.id,
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
                  id={`program-panel-${programa.programaId}`}
                  role={isMobileProgramLayout ? "tabpanel" : undefined}
                  aria-labelledby={isMobileProgramLayout ? `program-tab-${programa.programaId}` : undefined}
                  hidden={isMobileProgramLayout && programa.programaId !== activeProgramId}
                >
                  <header className="admisiones-program-card__header">
                    {/* <span
                      className="admisiones-program-card__icon"
                      aria-hidden="true"
                    >
                      {programaMeta?.icon ?? "🎓"}
                    </span> */}
                    <div>
                      <h3 className="admisiones-program-card__title">
                        {programaNombre}
                      </h3>
                      <p className="admisiones-program-card__code">
                        {programaMeta?.code ?? programa.programa}
                      </p>
                    </div>
                  </header>

                  <section
                    className={`admisiones-current-callout ${convocatoriaEstaAbierta
                      ? "admisiones-current-callout--active"
                      : "admisiones-current-callout--inactive"
                      }`}
                    aria-label={
                      convocatoriaDestacada
                        ? `Convocatoria ${convocatoriaEstaAbierta ? "abierta" : "cerrada"} de ${programaNombre}`
                        : `Convocatoria no disponible de ${programaNombre}`
                    }
                  >
                    <div className="admisiones-current-callout__header">
                      <span
                        className="admisiones-current-callout__label"
                        aria-live="polite"
                      >
                        <span
                          className="admisiones-current-callout__dot"
                          aria-hidden="true"
                        />
                        {convocatoriaEsDelPeriodoActual
                          ? "Convocatoria actual"
                          : convocatoriaEstaAbierta
                            ? "Convocatoria vigente"
                            : "Convocatoria más reciente"}
                      </span>
                      <span
                        className={`admisiones-current-callout__badge ${convocatoriaEstaAbierta
                          ? "admisiones-current-callout__badge--active"
                          : "admisiones-current-callout__badge--inactive"
                          }`}
                      >
                        <span aria-hidden="true">
                          {convocatoriaEstaAbierta ? "✓" : "—"}
                        </span>
                        {convocatoriaDestacada
                          ? convocatoriaEstaAbierta
                            ? "ABIERTA"
                            : "CERRADA"
                          : "NO DISPONIBLE"}
                      </span>
                    </div>

                    {convocatoriaDestacada ? (
                      <p className="admisiones-current-callout__status-copy">
                        {convocatoriaEstaAbierta
                          ? "Inscripciones habilitadas. Esta convocatoria está recibiendo aspirantes."
                          : "Inscripciones finalizadas. La convocatoria permanece disponible para consulta."}
                      </p>
                    ) : null}

                    {convocatoriaDestacada ? (
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
                              {formatDateOnly(convocatoriaDestacada.fechaInicio)}
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
                              {formatDateOnly(convocatoriaDestacada.fechaFin)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="admisiones-current-callout__empty">
                        No hay convocatoria para el período actual ni una
                        convocatoria abierta para este programa.
                      </p>
                    )}

                    <button
                      type="button"
                      className={`admisiones-enter-button ${!convocatoriaEstaAbierta
                        ? "admisiones-enter-button--inactive"
                        : ""
                        }`}
                      disabled={!convocatoriaDestacada}
                      onClick={() =>
                        convocatoriaDestacada &&
                        handleNavigate(convocatoriaDestacada, programaNombre)
                      }
                    >
                      {convocatoriaEstaAbierta
                        ? "Entrar a la convocatoria"
                        : "Consultar convocatoria"}
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
                      <CompactPeriodSelect
                        id={`prev-${programa.programaId}`}
                        value={selectedPrevious[programa.programaId] ?? ""}
                        placeholder="Seleccione un período..."
                        options={anterioresOrdenadas.map((convocatoria) => ({
                          label: convocatoria.periodo,
                          value: String(convocatoria.id),
                        }))}
                        onChange={(value) =>
                          handlePreviousChange(
                            programa.programaId,
                            programaNombre,
                            anterioresOrdenadas,
                            value,
                          )
                        }
                      />
                    )}
                  </div>
                </article>
              );
            })}
            </div>
          </>
        ) : null}
      </section>
    </ModuleLayout>
  );
};

export default AdmisionesHomePage;
