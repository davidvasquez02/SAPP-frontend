import { type ChangeEvent, useEffect, useState } from "react";
import { FileSelectButton, ModuleLayout } from "../../components";
import { useAuth } from "../../context/Auth";
import {
  actualizarRubricaEvaluacion,
  getRubricaEvaluacion,
  getRubricasEvaluacion,
} from "../../api/rubricaEvaluacionService";
import type { RubricaEvaluacionDto } from "../../api/rubricaEvaluacionService";
import { downloadBase64File, openBase64InNewTab } from "../../shared/files/base64FileUtils";
import "./RubricaEvaluacionPage.css";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const SUCCESS_MESSAGE_DURATION_MS = 5_000;

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

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatFecha = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-CO", { dateStyle: "long" });
};

/** Los trámites de trabajo de grado que se evalúan con jurados, cada uno con su propia rúbrica. */
const TIPOS_RUBRICA = [
  { codigo: "PROP_TI_MISI", nombre: "Propuesta de trabajo de investigación" },
  { codigo: "DEF_TI_MISI", nombre: "Defensa de trabajo de investigación" },
  { codigo: "PROP_TESIS_DCC", nombre: "Propuesta de tesis" },
  { codigo: "DEF_TESIS_DCC", nombre: "Defensa de tesis" },
  { codigo: "CAND_DOCTORAL", nombre: "Examen de candidatura" },
] as const;

interface RubricaCardProps {
  codigo: string;
  nombre: string;
  rubrica: RubricaEvaluacionDto | null;
  usuarioCargaId: number | null;
  onActualizada: (rubrica: RubricaEvaluacionDto) => void;
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
}

const RubricaCard = ({ codigo, nombre, rubrica, usuarioCargaId, onActualizada, onError, onSuccess }: RubricaCardProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [fileAction, setFileAction] = useState<"view" | "download" | null>(null);

  const handleFileAction = async (action: "view" | "download") => {
    onError(null);
    setFileAction(action);
    try {
      // el listado no trae el archivo: se pide al abrirlo o descargarlo
      const completa = await getRubricaEvaluacion(codigo);
      if (!completa?.contenidoBase64) throw new Error("La rúbrica no tiene un archivo disponible.");
      if (action === "view") {
        openBase64InNewTab(completa.contenidoBase64, completa.mimeType, completa.nombreArchivo);
      } else {
        downloadBase64File(completa.contenidoBase64, completa.mimeType, completa.nombreArchivo);
      }
    } catch (actionError) {
      onError(actionError instanceof Error ? actionError.message : "No fue posible abrir el archivo.");
    } finally {
      setFileAction(null);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;

    onError(null);
    onSuccess(null);

    if (selected.type !== "application/pdf") {
      onError("La rúbrica de evaluación debe estar en formato PDF.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      onError("El archivo no puede superar 15 MB.");
      return;
    }
    if (usuarioCargaId == null) {
      onError("No fue posible identificar al usuario actual. Vuelva a iniciar sesión e intente de nuevo.");
      return;
    }

    setIsSaving(true);
    try {
      const actualizada = await actualizarRubricaEvaluacion(codigo, {
        nombreArchivo: selected.name,
        contenidoBase64: await fileToBase64(selected),
        mimeType: selected.type,
        tamanoBytes: selected.size,
        checksum: await getChecksum(selected),
        usuarioCargaId,
      });
      onActualizada(actualizada);
      onSuccess(`La rúbrica de "${nombre}" fue actualizada correctamente.`);
    } catch (saveError) {
      onError(saveError instanceof Error ? saveError.message : "No fue posible actualizar la rúbrica de evaluación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rubrica-evaluacion__card" aria-label={nombre}>
      <h2 className="rubrica-evaluacion__card-title">{nombre}</h2>
      {rubrica ? (
        <dl className="rubrica-evaluacion__details">
          <div>
            <dt>Archivo actual</dt>
            <dd>{rubrica.nombreArchivo} · PDF · {formatSize(rubrica.tamanoBytes)}</dd>
          </div>
          <div>
            <dt>Última actualización</dt>
            <dd>{formatFecha(rubrica.fechaCarga)}</dd>
          </div>
        </dl>
      ) : (
        <p className="rubrica-evaluacion__empty">Aún no se ha cargado la rúbrica.</p>
      )}

      <div className="rubrica-evaluacion__actions">
        {rubrica ? (
          <>
            <button
              type="button"
              className="sapp-document-action"
              disabled={fileAction !== null}
              onClick={() => void handleFileAction("view")}
            >
              {fileAction === "view" ? "Abriendo..." : "Ver"}
            </button>
            <button
              type="button"
              className="sapp-document-action"
              disabled={fileAction !== null}
              onClick={() => void handleFileAction("download")}
            >
              {fileAction === "download" ? "Descargando..." : "Descargar"}
            </button>
          </>
        ) : null}
        <FileSelectButton accept="application/pdf,.pdf" disabled={isSaving} onChange={(event) => void handleFile(event)}>
          {isSaving ? "Subiendo..." : rubrica ? "Reemplazar archivo" : "Subir rúbrica"}
        </FileSelectButton>
      </div>
    </section>
  );
};

const RubricaEvaluacionPage = () => {
  const { session } = useAuth();
  const usuarioCargaId = session?.kind === "SAPP" ? Number(session.user.id) : null;

  const [rubricas, setRubricas] = useState<Record<string, RubricaEvaluacionDto>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const vigentes = await getRubricasEvaluacion();
        if (!cancelled) setRubricas(Object.fromEntries(vigentes.map((rubrica) => [rubrica.tipoSolicitudCodigo, rubrica])));
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las rúbricas de evaluación.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!success) return;

    const timeoutId = window.setTimeout(() => setSuccess(null), SUCCESS_MESSAGE_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  return (
    <ModuleLayout title="Rúbricas de evaluación">
      <section className="rubrica-evaluacion">
        <header className="rubrica-evaluacion__hero">
          <div>
            <h1>Rúbricas de evaluación de jurados</h1>
          </div>
        </header>

        {error ? <p className="rubrica-evaluacion__message rubrica-evaluacion__message--error" role="alert">{error}</p> : null}
        {success ? <p className="rubrica-evaluacion__message rubrica-evaluacion__message--success" role="status">{success}</p> : null}

        {isLoading ? (
          <p className="rubrica-evaluacion__empty" role="status">Cargando rúbricas de evaluación...</p>
        ) : (
          <div className="rubrica-evaluacion__grid">
            {TIPOS_RUBRICA.map((tipo) => (
              <RubricaCard
                key={tipo.codigo}
                codigo={tipo.codigo}
                nombre={tipo.nombre}
                rubrica={rubricas[tipo.codigo] ?? null}
                usuarioCargaId={usuarioCargaId}
                onActualizada={(actualizada) => setRubricas((actuales) => ({ ...actuales, [tipo.codigo]: actualizada }))}
                onError={setError}
                onSuccess={setSuccess}
              />
            ))}
          </div>
        )}
        <small className="rubrica-evaluacion__hint">Formato PDF, máximo 15 MB.</small>
      </section>
    </ModuleLayout>
  );
};

export default RubricaEvaluacionPage;
