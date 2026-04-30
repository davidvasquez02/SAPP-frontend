import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "../../components";
import { getConvocatoriasAdmision } from "../../modules/admisiones/api/convocatoriaAdmisionService";
import type { ConvocatoriaAdmisionDto } from "../../modules/admisiones/api/convocatoriaAdmisionTypes";
import { getPeriodosAcademicos } from "../../modules/configFechas/api/periodoAcademicoService";
import type { PeriodoAcademicoDto } from "../../modules/configFechas/api/types";
import { isConvocatoriaVigente } from "../../modules/admisiones/utils/convocatoriaEstado";
import "./ConfiguracionModulePage.css";

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

const ITEMS_PER_PAGE = 10;

const ConfiguracionModulePage = () => {
  const navigate = useNavigate();
  const [periodos, setPeriodos] = useState<PeriodoAcademicoDto[]>([]);
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
          getPeriodosAcademicos(),
          getConvocatoriasAdmision(),
        ]);

        if (cancelled) {
          return;
        }

        const sortedPeriodos = [...periodosResult].sort((a, b) => {
            if (a.anio !== b.anio) {
              return b.anio - a.anio;
            }

            return b.periodo - a.periodo;
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
              : "No fue posible cargar el módulo de configuración.",
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

  const totalPagesPeriodos = Math.max(1, Math.ceil(periodos.length / ITEMS_PER_PAGE));
  const totalPagesConvocatorias = Math.max(
    1,
    Math.ceil(convocatorias.length / ITEMS_PER_PAGE),
  );

  const periodosPreview = useMemo(() => {
    const start = (periodosPage - 1) * ITEMS_PER_PAGE;
    return periodos.slice(start, start + ITEMS_PER_PAGE);
  }, [periodos, periodosPage]);

  const convocatoriasPreview = useMemo(() => {
    const start = (convocatoriasPage - 1) * ITEMS_PER_PAGE;
    return convocatorias.slice(start, start + ITEMS_PER_PAGE);
  }, [convocatorias, convocatoriasPage]);

  return (
    <ModuleLayout title="Configuración">
      <section className="config-module">
        <header className="config-module__header">
          <h1>Módulo de configuración</h1>
          <p>
            Centraliza las configuraciones del sistema. Primero se visualizan
            los períodos académicos y luego las convocatorias.
          </p>
        </header>

        {isLoading ? (
          <p className="config-module__status">Cargando configuraciones...</p>
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
                  onClick={() => navigate("/admisiones/configuracion/fechas")}
                >
                  Gestionar períodos
                </button>
              </div>

              <div className="config-module__table-wrap sapp-table-shell">
                <table className="config-module__table sapp-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Fecha inicio</th>
                      <th>Fecha fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodosPreview.map((periodo) => (
                      <tr key={periodo.id}>
                        <td>{periodo.anioPeriodo}</td>
                        <td>{formatFecha(periodo.fechaInicio)}</td>
                        <td>{formatFecha(periodo.fechaFin)}</td>
                      </tr>
                    ))}
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

export default ConfiguracionModulePage;
