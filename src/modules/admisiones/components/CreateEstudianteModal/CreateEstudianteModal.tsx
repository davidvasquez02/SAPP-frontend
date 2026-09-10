import { useEffect, useRef, useState } from "react";
import { admitirAspiranteComoEstudiante } from "../../api/estudianteAdmisionService";
import type {
  EstudianteCreadoDto,
  InscripcionAdmisionDto,
} from "../../api/types";
import "./CreateEstudianteModal.css";

interface CreateEstudianteModalProps {
  aspirante: InscripcionAdmisionDto | null;
  onClose: () => void;
  onCreated: (estudiante: EstudianteCreadoDto) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CreateEstudianteModal = ({
  aspirante,
  onClose,
  onCreated,
}: CreateEstudianteModalProps) => {
  const [codigoUIS, setCodigoUIS] = useState("");
  const [emailInstitucional, setEmailInstitucional] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codigoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!aspirante) return;
    setCodigoUIS("");
    setEmailInstitucional("");
    setError(null);
    window.setTimeout(() => codigoInputRef.current?.focus(), 0);
  }, [aspirante]);

  if (!aspirante) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const codigo = codigoUIS.trim();
    const email = emailInstitucional.trim();

    if (!codigo) {
      setError("El código UIS es obligatorio.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError("Ingresa un correo institucional válido.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const estudiante = await admitirAspiranteComoEstudiante({
        idAspirante: aspirante.aspiranteId,
        codigoUIS: codigo,
        emailInstitucional: email,
      });
      onCreated(estudiante);
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No fue posible crear el estudiante.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-student-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="create-student-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-student-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="create-student-modal__header">
          <div>
            <p>Crear estudiante</p>
            <h2 id="create-student-title">{aspirante.nombreAspirante}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" disabled={isSubmitting}>×</button>
        </header>

        <p className="create-student-modal__description">
          Completa los datos institucionales. El correo personal se obtiene del registro del aspirante.
        </p>

        <form className="create-student-modal__form" onSubmit={handleSubmit}>
          <label>
            Código UIS <span aria-hidden="true">*</span>
            <input
              ref={codigoInputRef}
              value={codigoUIS}
              onChange={(event) => setCodigoUIS(event.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="off"
            />
          </label>
          <label>
            Correo institucional <span aria-hidden="true">*</span>
            <input
              type="email"
              value={emailInstitucional}
              onChange={(event) => setEmailInstitucional(event.target.value)}
              placeholder="usuario@uis.edu.co"
              required
              disabled={isSubmitting}
              autoComplete="email"
            />
          </label>

          {error ? <p className="create-student-modal__error" role="alert">{error}</p> : null}

          <div className="create-student-modal__actions">
            <button type="button" className="create-student-modal__cancel" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="create-student-modal__submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear estudiante"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
