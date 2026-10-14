import { type ChangeEvent, useEffect, useState } from "react";
import { FileSelectButton, ModuleLayout } from "../../components";
import { useAuth } from "../../context/Auth";
import {
  actualizarRubricaEvaluacion,
  getRubricaEvaluacion,
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

const RubricaEvaluacionPage = () => {
  const { session } = useAuth();
  const usuarioCargaId = session?.kind === "SAPP" ? Number(session.user.id) : null;

  const [rubrica, setRubrica] = useState<RubricaEvaluacionDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileAction, setFileAction] = useState<"view" | "download" | null>(null);

  const loadRubrica = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRubrica(await getRubricaEvaluacion());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la rúbrica de evaluación.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRubrica();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timeoutId = window.setTimeout(() => setSuccess(null), SUCCESS_MESSAGE_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  const handleFileAction = (action: "view" | "download") => {
    if (!rubrica) return;
    setError(null);
    setFileAction(action);
    try {
      if (action === "view") {
        openBase64InNewTab(rubrica.contenidoBase64, rubrica.mimeType, rubrica.nombreArchivo);
      } else {
        downloadBase64File(rubrica.contenidoBase64, rubrica.mimeType, rubrica.nombreArchivo);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No fue posible abrir el archivo.");
    } finally {
      setFileAction(null);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;

    setError(null);
    setSuccess(null);

    if (selected.type !== "application/pdf") {
      setError("La rúbrica de evaluación debe estar en formato PDF.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("El archivo no puede superar 15 MB.");
      return;
    }
    if (usuarioCargaId == null) {
      setError("No fue posible identificar al usuario actual. Vuelva a iniciar sesión e intente de nuevo.");
      return;
    }

    setIsSaving(true);
    try {
      const actualizada = await actualizarRubricaEvaluacion({
        nombreArchivo: selected.name,
        contenidoBase64: await fileToBase64(selected),
        mimeType: selected.type,
        tamanoBytes: selected.size,
        checksum: await getChecksum(selected),
        usuarioCargaId,
      });
      setRubrica(actualizada);
      setSuccess("La rúbrica de evaluación fue actualizada correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible actualizar la rúbrica de evaluación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModuleLayout title="Rúbrica de evaluación">
      <section className="rubrica-evaluacion">
        <header className="rubrica-evaluacion__hero">
          <div>
            <h1>Rúbrica de evaluación de jurados</h1>
            <p>
              Este es el formato que se le entrega a cada jurado para que lo diligencie y lo adjunte al emitir
              su concepto sobre un trabajo de grado. Solo hay una versión vigente a la vez.
            </p>
          </div>
        </header>

        {error ? <p className="rubrica-evaluacion__message rubrica-evaluacion__message--error" role="alert">{error}</p> : null}
        {success ? <p className="rubrica-evaluacion__message rubrica-evaluacion__message--success" role="status">{success}</p> : null}

        {isLoading ? (
          <p className="rubrica-evaluacion__empty" role="status">Cargando rúbrica de evaluación...</p>
        ) : (
          <section className="rubrica-evaluacion__card">
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
              <p className="rubrica-evaluacion__empty">Aún no se ha cargado ninguna rúbrica de evaluación.</p>
            )}

            <div className="rubrica-evaluacion__actions">
              {rubrica ? (
                <>
                  <button
                    type="button"
                    className="sapp-document-action"
                    disabled={fileAction !== null}
                    onClick={() => handleFileAction("view")}
                  >
                    {fileAction === "view" ? "Abriendo..." : "Ver"}
                  </button>
                  <button
                    type="button"
                    className="sapp-document-action"
                    disabled={fileAction !== null}
                    onClick={() => handleFileAction("download")}
                  >
                    {fileAction === "download" ? "Descargando..." : "Descargar"}
                  </button>
                </>
              ) : null}
              <FileSelectButton accept="application/pdf,.pdf" disabled={isSaving} onChange={(event) => void handleFile(event)}>
                {isSaving ? "Subiendo..." : rubrica ? "Reemplazar archivo" : "Subir rúbrica de evaluación"}
              </FileSelectButton>
            </div>
            <small className="rubrica-evaluacion__hint">Formato PDF, máximo 15 MB.</small>
          </section>
        )}
      </section>
    </ModuleLayout>
  );
};

export default RubricaEvaluacionPage;
