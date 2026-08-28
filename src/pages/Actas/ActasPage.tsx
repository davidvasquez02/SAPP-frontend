import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { ModuleLayout } from "../../components";
import { crearActa, eliminarActa, getActas, getDocumentoActa } from "../../modules/actas/api";
import type { ActaDto, CrearActaRequest } from "../../modules/actas/types";
import { downloadBase64File, openBase64InNewTab } from "../../shared/files/base64FileUtils";
import "./ActasPage.css";

const PAGE_SIZE = 10;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const SUCCESS_MESSAGE_DURATION_MS = 5_000;

type FileAction = "view" | "download";

const getColombiaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getActaYear = (acta: ActaDto) => acta.codigo.match(/-(\d{4})$/)?.[1] ?? "";

const getActaCode = (acta: ActaDto) => acta.codigo.replace(/-\d{4}$/, "");

const compareActas = (a: ActaDto, b: ActaDto) => {
  const byCode = getActaCode(b).localeCompare(getActaCode(a), "es", {
    numeric: true,
    sensitivity: "base",
  });
  if (byCode !== 0) return byCode;

  const byYear = getActaYear(b).localeCompare(getActaYear(a));
  return byYear || b.codigo.localeCompare(a.codigo, "es", { numeric: true, sensitivity: "base" });
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("No fue posible leer el archivo seleccionado."));
    reader.readAsDataURL(file);
  });

const getChecksum = async (file: File) => {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const ActasPage = () => {
  const currentYear = getColombiaToday().slice(0, 4);
  const [actas, setActas] = useState<ActaDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [codigoActa, setCodigoActa] = useState("");
  const [anio, setAnio] = useState(currentYear);
  const [observaciones, setObservaciones] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileAction, setFileAction] = useState<{ actaId: number; action: FileAction } | null>(null);
  const [deletingActaId, setDeletingActaId] = useState<number | null>(null);

  const loadActas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getActas();
      setActas([...data].sort(compareActas));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las actas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActas();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timeoutId = window.setTimeout(() => setSuccess(null), SUCCESS_MESSAGE_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  const codigo = `ACT-${codigoActa.trim().toUpperCase()}-${anio}`;
  const years = useMemo(
    () => Array.from(new Set(actas.map(getActaYear).filter(Boolean))).sort().reverse(),
    [actas],
  );
  const filteredActas = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return actas.filter(
      (acta) =>
        (!yearFilter || getActaYear(acta) === yearFilter) &&
        (!term ||
          acta.nombre.toLocaleLowerCase("es").includes(term) ||
          acta.codigo.toLocaleLowerCase("es").includes(term)),
    );
  }, [actas, search, yearFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredActas.length / PAGE_SIZE));
  const visibleActas = filteredActas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, yearFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleFileAction = async (acta: ActaDto, action: FileAction) => {
    setError(null);
    setFileAction({ actaId: acta.id, action });
    try {
      const document = await getDocumentoActa(acta.id);
      if (!document.contenidoBase64) {
        throw new Error("El acta todavía no tiene un archivo disponible.");
      }

      const mimeType = document.mimeType || acta.mimeType || "application/pdf";
      const filename = document.nombreArchivo || `${acta.codigo}.pdf`;
      if (action === "view") {
        openBase64InNewTab(document.contenidoBase64, mimeType, filename);
      } else {
        downloadBase64File(document.contenidoBase64, mimeType, filename);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No fue posible obtener el archivo del acta.");
    } finally {
      setFileAction(null);
    }
  };

  const handleDelete = async (acta: ActaDto) => {
    const confirmed = window.confirm(
      `¿Está seguro de que desea eliminar el acta "${acta.nombre}" (${acta.codigo})? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setDeletingActaId(acta.id);
    try {
      await eliminarActa(acta.id);
      setActas((currentActas) => currentActas.filter((currentActa) => currentActa.id !== acta.id));
      setSuccess(`El acta ${acta.codigo} fue eliminada correctamente.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No fue posible eliminar el acta.");
    } finally {
      setDeletingActaId(null);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    if (selected && selected.type !== "application/pdf") {
      setFile(null);
      setError("El archivo del acta debe estar en formato PDF.");
      event.target.value = "";
      return;
    }
    if (selected && selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("El archivo no puede superar 15 MB.");
      event.target.value = "";
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file || !nombre.trim() || !codigoActa.trim() || !/^\d{4}$/.test(anio)) {
      setError("Complete el nombre, el código, el año y seleccione un archivo PDF.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: CrearActaRequest = {
        nombre: nombre.trim(),
        codigo,
        fechaCreacion: getColombiaToday(),
        observaciones: observaciones.trim(),
        contenidoBase64: await fileToBase64(file),
        mimeType: file.type || "application/pdf",
        tamanoBytes: file.size,
        checksum: await getChecksum(file),
      };
      await crearActa(payload);
      setSuccess(`El acta ${codigo} fue creada correctamente.`);
      setNombre("");
      setCodigoActa("");
      setAnio(currentYear);
      setObservaciones("");
      setFile(null);
      setShowForm(false);
      await loadActas();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible crear el acta.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModuleLayout title="Actas">
      <section className="actas-page">
        <header className="actas-page__hero">
          <div><h1>Gestión de actas</h1><p>Consulte las actas institucionales y registre nuevos documentos en PDF.</p></div>
          <button type="button" className="actas-page__primary" onClick={() => setShowForm((value) => !value)}>
            {showForm ? "Cancelar carga" : "+ Cargar acta"}
          </button>
        </header>

        {error ? <p className="actas-page__message actas-page__message--error" role="alert">{error}</p> : null}
        {success ? <p className="actas-page__message actas-page__message--success" role="status">{success}</p> : null}

        {showForm ? (
          <form className="actas-form" onSubmit={handleSubmit}>
            <div className="actas-form__heading"><h2>Nueva acta</h2><p>La fecha de creación se asignará automáticamente: {formatDate(getColombiaToday())}.</p></div>
            <label><span>Nombre del acta *</span><input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej. Consejo de Escuela" required /></label>
            <label><span>Código del acta *</span><div className="actas-form__code"><span>ACT-</span><input value={codigoActa} onChange={(event) => setCodigoActa(event.target.value.replace(/[^a-zA-Z0-9]/g, ""))} placeholder="001" required /><span>-</span><input aria-label="Año del acta" inputMode="numeric" maxLength={4} value={anio} onChange={(event) => setAnio(event.target.value.replace(/\D/g, ""))} required /></div><small>Código generado: {codigo}</small></label>
            <label className="actas-form__wide"><span>Observaciones</span><textarea rows={3} value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Información adicional del acta" /></label>
            <label className="actas-form__wide actas-form__file"><span>Archivo del acta (PDF, máximo 15 MB) *</span><input type="file" accept="application/pdf,.pdf" onChange={handleFile} required={!file} />{file ? <small>{file.name} · {formatSize(file.size)}</small> : null}</label>
            <div className="actas-form__actions"><button className="actas-page__primary" type="submit" disabled={isSaving}>{isSaving ? "Procesando archivo..." : "Crear acta"}</button></div>
          </form>
        ) : null}

        <section className="actas-list" aria-labelledby="actas-list-title">
          <div className="actas-list__heading"><h2 id="actas-list-title">Listado de actas</h2></div>
          <div className="sapp-filters-panel">
            <label className="sapp-filter-field"><span>Buscar por nombre o código</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. ACT-001" /></label>
            <label className="sapp-filter-field"><span>Año</span><select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}><option value="">Todos</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          </div>
          {isLoading ? <p className="actas-page__empty">Cargando actas...</p> : null}
          {!isLoading && visibleActas.length === 0 ? <p className="actas-page__empty">No hay actas que coincidan con los filtros.</p> : null}
          {!isLoading && visibleActas.length > 0 ? <div className="sapp-table-shell"><table className="sapp-table actas-table"><thead><tr><th>Código</th><th>Nombre</th><th>Año</th><th>Fecha de creación</th><th>Observaciones</th><th>Archivo</th><th>Acciones</th></tr></thead><tbody>{visibleActas.map((acta) => {
            const isViewing = fileAction?.actaId === acta.id && fileAction.action === "view";
            const isDownloading = fileAction?.actaId === acta.id && fileAction.action === "download";
            const isDeleting = deletingActaId === acta.id;
            const actionsDisabled = fileAction !== null || deletingActaId !== null;
            return <tr key={acta.id}><td><strong>{acta.codigo}</strong></td><td>{acta.nombre}</td><td>{getActaYear(acta) || "—"}</td><td>{formatDate(acta.fechaCreacion)}</td><td>{acta.observaciones || "—"}</td><td><span className="actas-table__file">PDF · {formatSize(acta.tamanoBytes)}</span></td><td><div className="actas-table__actions"><button type="button" disabled={actionsDisabled} onClick={() => void handleFileAction(acta, "view")}>{isViewing ? "Abriendo..." : "Ver"}</button><button type="button" disabled={actionsDisabled} onClick={() => void handleFileAction(acta, "download")}>{isDownloading ? "Descargando..." : "Descargar"}</button><button type="button" className="actas-table__delete" disabled={actionsDisabled} onClick={() => void handleDelete(acta)}>{isDeleting ? "Eliminando..." : "Eliminar"}</button></div></td></tr>;
          })}</tbody></table></div> : null}
          {totalPages > 1 ? <nav className="actas-pagination" aria-label="Paginación de actas"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Página {page} de {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></nav> : null}
        </section>
      </section>
    </ModuleLayout>
  );
};

export default ActasPage;
