import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModuleLayout } from "../../components";
import {
  cerrarConvocatoriaAdmision,
  getConvocatoriasAdmision,
} from "../../modules/admisiones/api/convocatoriaAdmisionService";
import type { ConvocatoriaAdmisionDto } from "../../modules/admisiones/api/convocatoriaAdmisionTypes";
import { CreateConvocatoriaModal } from "../../modules/admisiones/components/CreateConvocatoriaModal";
import { EditConvocatoriaFechasModal } from "../../modules/admisiones/components/EditConvocatoriaFechasModal";
import { isConvocatoriaVigente } from "../../modules/admisiones/utils/convocatoriaEstado";
import { getPeriodosAcademicosWithFechas } from "../../modules/configFechas/api/periodoAcademicoService";
import type { PeriodoAcademicoWithFechasDto } from "../../modules/configFechas/api/types";
import { TIPO_TRAMITE_ADMISIONES } from "../../modules/configFechas/constants";
import "./FechasModulePage.css";

type VigenteFilter = "TODOS" | "VIGENTE" | "CERRADA";

type ProgramaSection = {
  programaId: number;
  programaLabel: string;
  items: ConvocatoriaAdmisionDto[];
};

const PERIODOS_PER_PAGE = 4;
const CONVOCATORIAS_PER_PAGE = 4;

const formatFecha = (value: string | null) => {
  if (!value) return "—";
  const datePart = value.trim().split(" ")[0];
  const [year, month, day] = datePart.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const resolveProgramaLabel = (programa: string) => {
  const upper = programa.toUpperCase();
  if (upper.includes("MISI")) return "Maestría en Ingeniería de Sistemas e Informática";
  if (upper.includes("DCC")) return "Doctorado en Ciencias de la Computación";
  return programa;
};

const FechasModulePage = () => {
  const navigate = useNavigate();
  const [periodos, setPeriodos] = useState<PeriodoAcademicoWithFechasDto[]>([]);
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaAdmisionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [periodosPage, setPeriodosPage] = useState(1);
  const [programPages, setProgramPages] = useState<Record<number, number>>({});
  const [periodoFilter, setPeriodoFilter] = useState("TODOS");
  const [vigenteFilter, setVigenteFilter] = useState<VigenteFilter>("TODOS");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingConvocatoria, setEditingConvocatoria] = useState<ConvocatoriaAdmisionDto | null>(null);

  const loadData = useCallback(async (silent = false): Promise<ConvocatoriaAdmisionDto[]> => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [periodosResult, convocatoriasResult] = await Promise.all([
        getPeriodosAcademicosWithFechas(),
        getConvocatoriasAdmision(),
      ]);
      setPeriodos([...periodosResult].sort((a, b) =>
        a.periodo.anio === b.periodo.anio
          ? b.periodo.periodo - a.periodo.periodo
          : b.periodo.anio - a.periodo.anio,
      ));
      setConvocatorias(convocatoriasResult);
      return convocatoriasResult;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el módulo de fechas académicas.");
      return [];
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => { setProgramPages({}); }, [periodoFilter, vigenteFilter]);

  const totalPagesPeriodos = Math.max(1, Math.ceil(periodos.length / PERIODOS_PER_PAGE));
  const periodosPreview = useMemo(() => {
    const start = (periodosPage - 1) * PERIODOS_PER_PAGE;
    return periodos.slice(start, start + PERIODOS_PER_PAGE);
  }, [periodos, periodosPage]);

  const periodosConvocatoria = useMemo(() => [
    "TODOS",
    ...Array.from(new Set(convocatorias.map((item) => item.periodo))).sort((a, b) => b.localeCompare(a, "es")),
  ], [convocatorias]);

  const sections = useMemo<ProgramaSection[]>(() => {
    const grouped = new Map<number, ConvocatoriaAdmisionDto[]>();
    convocatorias
      .filter((item) => {
        const vigente = isConvocatoriaVigente(item);
        return (periodoFilter === "TODOS" || item.periodo === periodoFilter)
          && (vigenteFilter === "TODOS" || (vigenteFilter === "VIGENTE" ? vigente : !vigente));
      })
      .forEach((item) => grouped.set(item.programaId, [...(grouped.get(item.programaId) ?? []), item]));

    return Array.from(grouped.entries()).map(([programaId, items]) => ({
      programaId,
      programaLabel: resolveProgramaLabel(items[0]?.programa ?? `Programa ${programaId}`),
      items: items.sort((a, b) => b.periodo.localeCompare(a.periodo, "es")),
    })).sort((a, b) => a.programaLabel.localeCompare(b.programaLabel, "es"));
  }, [convocatorias, periodoFilter, vigenteFilter]);

  const handleCloseConvocatoria = useCallback(async (convocatoria: ConvocatoriaAdmisionDto) => {
    if (!window.confirm(`¿Cerrar convocatoria ${convocatoria.periodo} - ${convocatoria.programa}?`)) return;
    try {
      await cerrarConvocatoriaAdmision(convocatoria.id);
      await loadData(true);
      setFeedback("Convocatoria cerrada correctamente.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible cerrar la convocatoria.");
    }
  }, [loadData]);

  return (
    <ModuleLayout title="Fechas">
      <section className="config-module">
        <header className="config-module__header">
          <h1>Módulo de fechas académicas</h1>
          <p>Centraliza los períodos académicos y la gestión de convocatorias de admisión por programa.</p>
        </header>

        {isLoading ? <p className="config-module__status">Cargando fechas académicas...</p> : null}
        {error ? <p className="config-module__status config-module__status--error">{error}</p> : null}
        {feedback ? <p className="config-module__feedback">{feedback}</p> : null}

        {!isLoading && !error ? <>
          <article className="config-module__card">
            <div className="config-module__card-header">
              <div><h2>Períodos académicos</h2><p>Base para definir rangos de fechas y habilitar procesos por semestre.</p></div>
              <button type="button" onClick={() => navigate("/fechas/periodos")}>Crear período académico</button>
            </div>
            <div className="config-module__table-wrap sapp-table-shell">
              <table className="config-module__table sapp-table"><thead><tr><th>Período</th><th>Fecha inicio</th><th>Fecha fin</th><th>Inicio matrículas</th><th>Fin matrículas</th><th>Acciones</th></tr></thead>
                <tbody>{periodosPreview.map((item) => {
                  const fechaMatricula = item.fechas.find((fecha) => fecha.tipoTramite.id === TIPO_TRAMITE_ADMISIONES);
                  return <tr key={item.periodo.id}><td>{item.periodo.anioPeriodo}</td><td>{formatFecha(item.periodo.fechaInicio)}</td><td>{formatFecha(item.periodo.fechaFin)}</td><td>{formatFecha(fechaMatricula?.fechaInicio ?? null)}</td><td>{formatFecha(fechaMatricula?.fechaFin ?? null)}</td><td><button type="button" className="config-module__edit-button" onClick={() => navigate(`/fechas/periodos?periodoId=${item.periodo.id}`)}>Editar</button></td></tr>;
                })}</tbody></table>
            </div>
            <div className="config-module__pagination"><button type="button" onClick={() => setPeriodosPage((page) => Math.max(1, page - 1))} disabled={periodosPage === 1}>Anterior</button><span>Página {periodosPage} de {totalPagesPeriodos}</span><button type="button" onClick={() => setPeriodosPage((page) => Math.min(totalPagesPeriodos, page + 1))} disabled={periodosPage === totalPagesPeriodos}>Siguiente</button></div>
          </article>

          <article className="config-module__card">
            <div className="config-module__card-header">
              <div><h2>Convocatorias de admisión</h2><p>Gestione convocatorias por programa, período y estado de vigencia.</p></div>
              <button type="button" onClick={() => setIsCreateModalOpen(true)}>Crear convocatoria</button>
            </div>
            <div className="config-module__filters sapp-filters-panel">
              <label className="sapp-filter-field"><span>Período</span><select value={periodoFilter} onChange={(event) => setPeriodoFilter(event.target.value)}>{periodosConvocatoria.map((periodo) => <option key={periodo} value={periodo}>{periodo === "TODOS" ? "Todos" : periodo}</option>)}</select></label>
              <label className="sapp-filter-field"><span>Vigente</span><select value={vigenteFilter} onChange={(event) => setVigenteFilter(event.target.value as VigenteFilter)}><option value="TODOS">Todos</option><option value="VIGENTE">Vigentes</option><option value="CERRADA">Cerradas</option></select></label>
            </div>
            {sections.length === 0 ? <p className="config-module__status">No hay convocatorias para los filtros seleccionados.</p> : null}
            <div className="config-module__program-sections">{sections.map((section) => {
              const page = programPages[section.programaId] ?? 1;
              const totalPages = Math.max(1, Math.ceil(section.items.length / CONVOCATORIAS_PER_PAGE));
              const pageItems = section.items.slice((page - 1) * CONVOCATORIAS_PER_PAGE, page * CONVOCATORIAS_PER_PAGE);
              return <section key={section.programaId} className="config-module__program" aria-labelledby={`programa-${section.programaId}`}>
                <h3 id={`programa-${section.programaId}`}>{section.programaLabel}</h3>
                <div className="config-module__table-wrap sapp-table-shell"><table className="config-module__table config-module__table--convocatorias sapp-table"><thead><tr><th>Período</th><th>Cupos</th><th>Fecha inicio</th><th>Fecha fin</th><th>Vigente</th><th>Observaciones</th><th>Acciones</th></tr></thead>
                  <tbody>{pageItems.map((item) => { const vigente = isConvocatoriaVigente(item); return <tr key={item.id}><td>{item.periodo}</td><td>{item.cupos}</td><td>{formatFecha(item.fechaInicio)}</td><td>{formatFecha(item.fechaFin)}</td><td><span className={`config-module__badge config-module__badge--${vigente ? "vigente" : "cerrada"}`}>{vigente ? "VIGENTE" : "CERRADA"}</span></td><td><span className="config-module__observaciones">{item.observaciones?.trim() || "—"}</span></td><td><div className="config-module__row-actions"><button type="button" className="config-module__edit-button" onClick={() => navigate(`/admisiones/convocatoria/${item.id}`, { state: { programaId: item.programaId, programaNombre: section.programaLabel, periodoLabel: item.periodo, periodoAcademico: item.periodo, cupos: item.cupos } })}>Ver inscripciones</button><button type="button" className="config-module__edit-button" onClick={() => setEditingConvocatoria(item)} disabled={isRefreshing}>Editar</button>{vigente ? <button type="button" onClick={() => void handleCloseConvocatoria(item)} disabled={isRefreshing}>Cerrar</button> : null}</div></td></tr>; })}</tbody></table></div>
                <div className="config-module__pagination"><button type="button" disabled={page === 1} onClick={() => setProgramPages((current) => ({ ...current, [section.programaId]: page - 1 }))}>Anterior</button><span>Página {page} de {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setProgramPages((current) => ({ ...current, [section.programaId]: page + 1 }))}>Siguiente</button></div>
              </section>;
            })}</div>
          </article>
        </> : null}
      </section>

      <CreateConvocatoriaModal open={isCreateModalOpen} convocatorias={convocatorias} onClose={() => setIsCreateModalOpen(false)} onRefreshConvocatorias={() => loadData(true)} onSuccess={setFeedback} />
      <EditConvocatoriaFechasModal convocatoria={editingConvocatoria} onClose={() => setEditingConvocatoria(null)} onSuccess={async (message) => { setEditingConvocatoria(null); await loadData(true); setFeedback(message); }} />
    </ModuleLayout>
  );
};

export default FechasModulePage;
