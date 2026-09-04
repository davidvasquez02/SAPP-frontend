import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "../../components";
import { getConvocatoriasAdmision } from "../../modules/admisiones/api/convocatoriaAdmisionService";
import type { ConvocatoriaAdmisionDto } from "../../modules/admisiones/api/convocatoriaAdmisionTypes";
import { getPeriodosAcademicosWithFechas } from "../../modules/configFechas/api/periodoAcademicoService";
import type { PeriodoAcademicoWithFechasDto } from "../../modules/configFechas/api/types";
import { TIPO_TRAMITE_ADMISIONES } from "../../modules/configFechas/constants";
import { isConvocatoriaVigente } from "../../modules/admisiones/utils/convocatoriaEstado";
import "./FechasModulePage.css";

const formatFecha = (value: string | null) => {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const PERIODOS_PER_PAGE = 4;
const CONVOCATORIAS_PER_PAGE = 8;

const FechasModulePage = () => {
  const navigate = useNavigate();
  const [periodos, setPeriodos] = useState<PeriodoAcademicoWithFechasDto[]>([]);
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaAdmisionDto[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodosPage, setPeriodosPage] = useState(1);
  const [convocatoriasPage, setConvocatoriasPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const loadConfigData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [periodosResult, convocatoriasResult] = await Promise.all([
          getPeriodosAcademicosWithFechas(),
          getConvocatoriasAdmision(),
        ]);

        if (cancelled) {
          return;
        }

        const sortedPeriodos = [...periodosResult].sort((a, b) => {
            if (a.periodo.anio !== b.periodo.anio) {
              return b.periodo.anio - a.periodo.anio;
            }

            return b.periodo.periodo - a.periodo.periodo;
          });

        const sortedConvocatorias = [...convocatoriasResult].sort((a, b) =>
          b.periodo.localeCompare(a.periodo, "es"),
        );

        setPeriodos(sortedPeriodos);
        setConvocatorias(sortedConvocatorias);
        setPeriodosPage(1);
        setConvocatoriasPage(1);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No fue posible cargar el módulo de fechas académicas.",
          );
          setPeriodos([]);
          setConvocatorias([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadConfigData();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPagesPeriodos = Math.max(
    1,
    Math.ceil(periodos.length / PERIODOS_PER_PAGE),
  );
  const totalPagesConvocatorias = Math.max(
    1,
    Math.ceil(convocatorias.length / CONVOCATORIAS_PER_PAGE),
  );

  const periodosPreview = useMemo(() => {
    const start = (periodosPage - 1) * PERIODOS_PER_PAGE;
    return periodos.slice(start, start + PERIODOS_PER_PAGE);
  }, [periodos, periodosPage]);

  const convocatoriasPreview = useMemo(() => {
    const start = (convocatoriasPage - 1) * CONVOCATORIAS_PER_PAGE;
    return convocatorias.slice(start, start + CONVOCATORIAS_PER_PAGE);
  }, [convocatorias, convocatoriasPage]);

  return (
    <ModuleLayout title="Fechas">
      <section className="config-module">
        <header className="config-module__header">
          <h1>Módulo de fechas académicas</h1>
          <p>
            Centraliza las fechas académicas del sistema. Primero se visualizan
            los períodos académicos y luego las convocatorias.
          </p>
        </header>

        {isLoading ? (
          <p className="config-module__status">Cargando fechas académicas...</p>
        ) : null}
        {error ? (
          <p className="config-module__status config-module__status--error">
            {error}
          </p>
        ) : null}

        {!isLoading && !error ? (
          <>
            <article className="config-module__card">
              <div className="config-module__card-header">
                <div>
                  <h2>Períodos académicos</h2>
                  <p>
                    Base para definir rangos de fechas y habilitar procesos por
                    semestre.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/fechas/periodos")}
                >
                  Crear período académico
                </button>
              </div>

              <div className="config-module__table-wrap sapp-table-shell">
                <table className="config-module__table sapp-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Fecha inicio</th>
                      <th>Fecha fin</th>
                      <th>Inicio matrículas</th>
                      <th>Fin matrículas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodosPreview.map((item) => {
                      const fechaMatricula = item.fechas.find(
                        (fecha) => fecha.tipoTramite.id === TIPO_TRAMITE_ADMISIONES,
                      );

                      return (
                        <tr key={item.periodo.id}>
                          <td>{item.periodo.anioPeriodo}</td>
                          <td>{formatFecha(item.periodo.fechaInicio)}</td>
                          <td>{formatFecha(item.periodo.fechaFin)}</td>
                          <td>{formatFecha(fechaMatricula?.fechaInicio ?? null)}</td>
                          <td>{formatFecha(fechaMatricula?.fechaFin ?? null)}</td>
                          <td>
                            <button
                              type="button"
                              className="config-module__edit-button"
                              onClick={() =>
                                navigate(`/fechas/periodos?periodoId=${item.periodo.id}`)
                              }
                              aria-label={`Editar período ${item.periodo.anioPeriodo}`}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="config-module__pagination">
                <button
                  type="button"
                  onClick={() => setPeriodosPage((page) => Math.max(1, page - 1))}
                  disabled={periodosPage === 1}
                >
                  Anterior
                </button>
                <span>
                  Página {periodosPage} de {totalPagesPeriodos}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPeriodosPage((page) => Math.min(totalPagesPeriodos, page + 1))
                  }
                  disabled={periodosPage === totalPagesPeriodos}
                >
                  Siguiente
                </button>
              </div>
            </article>

            <article className="config-module__card">
              <div className="config-module__card-header">
                <div>
                  <h2>Convocatorias de admisión</h2>
                  <p>
                    Visualización general de convocatorias vigentes y cerradas
                    por programa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/admisiones/convocatorias")}
                >
                  Gestionar convocatorias
                </button>
              </div>

              <div className="config-module__table-wrap sapp-table-shell">
                <table className="config-module__table sapp-table">
                  <thead>
                    <tr>
                      <th>Programa</th>
                      <th>Período</th>
                      <th>Cupos</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convocatoriasPreview.map((convocatoria) => (
                      <tr key={convocatoria.id}>
                        <td>{convocatoria.programa}</td>
                        <td>{convocatoria.periodo}</td>
                        <td>{convocatoria.cupos}</td>
                        <td>
                          {isConvocatoriaVigente(convocatoria)
                            ? "Vigente"
                            : "Cerrada"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="config-module__pagination">
                <button
                  type="button"
                  onClick={() => setConvocatoriasPage((page) => Math.max(1, page - 1))}
                  disabled={convocatoriasPage === 1}
                >
                  Anterior
                </button>
                <span>
                  Página {convocatoriasPage} de {totalPagesConvocatorias}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setConvocatoriasPage((page) =>
                      Math.min(totalPagesConvocatorias, page + 1),
                    )
                  }
                  disabled={convocatoriasPage === totalPagesConvocatorias}
                >
                  Siguiente
                </button>
              </div>
            </article>
          </>
        ) : null}
      </section>
    </ModuleLayout>
  );
};

export default FechasModulePage;
