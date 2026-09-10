import { useState } from "react";
import type { InscripcionAdmisionDto } from "../../api/types";
import "./StudentCard.css";

const formatDateOnly = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "—";
  }

  const dateOnlyMatch = trimmedValue.match(/^\d{4}-\d{2}-\d{2}/);
  if (dateOnlyMatch) {
    return dateOnlyMatch[0];
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toISOString().slice(0, 10);
};

interface StudentCardProps {
  inscripcion: InscripcionAdmisionDto;
  photoUrl: string | null;
  onClick: () => void;
}

const StudentCard = ({ inscripcion, photoUrl, onClick }: StudentCardProps) => {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const posicionAdmision =
    inscripcion.posicionAdmision ?? inscripcion.posicion_admision ?? null;
  const cedula = inscripcion.cedula ?? inscripcion.numeroDocumento ?? "—";
  const correo = inscripcion.correo ?? inscripcion.emailPersonal ?? "—";
  const telefono = inscripcion.telefono ?? "—";
  const estadoNormalizado = (inscripcion.estado || "—").replaceAll("_", " ");
  const estadoClass = `applicant-card__badge--state-${(inscripcion.estado ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")}`;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  const showFallbackAvatar = !photoUrl || failedPhotoUrl === photoUrl;

  return (
    <div
      className="applicant-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="applicant-card__media">
        {showFallbackAvatar ? (
          <div
            className="applicant-card__avatar-fallback"
            aria-label="Sin foto"
          >
            <span aria-hidden="true">👤</span>
            <span>Sin foto</span>
          </div>
        ) : (
          <img
            className="applicant-card__photo"
            src={photoUrl}
            alt={`Foto de ${inscripcion.nombreAspirante}`}
            loading="lazy"
            onError={() => setFailedPhotoUrl(photoUrl)}
          />
        )}
      </div>

      <div className="applicant-card__body">
        <h2 className="applicant-card__name">{inscripcion.nombreAspirante}</h2>

        <div className="applicant-card__badges">
          <span
            className={`applicant-card__badge applicant-card__badge--state ${estadoClass}`}
          >
            {estadoNormalizado}
          </span>
          <span className="applicant-card__badge">
            {inscripcion.programaAcademico}
          </span>
        </div>

        <div className="applicant-card__meta">
          <div>
            <span className="applicant-card__label">Periodo</span>
            <span className="applicant-card__value">
              {inscripcion.periodoAcademico || "—"}
            </span>
          </div>
          <div>
            <span className="applicant-card__label">Puntaje</span>
            <span className="applicant-card__value">
              {inscripcion.puntajeTotal ?? "—"}
            </span>
          </div>
        </div>

        <div className="applicant-card__meta">
          <div>
            <span className="applicant-card__label">Cédula</span>
            <span className="applicant-card__value">{cedula || "—"}</span>
          </div>
          <div>
            <span className="applicant-card__label">Posición admisión</span>
            <span className="applicant-card__value">
              {posicionAdmision ?? "—"}
            </span>
          </div>
        </div>

        <div className="applicant-card__meta">
          <div>
            <span className="applicant-card__label">Correo</span>
            <span className="applicant-card__value">{correo || "—"}</span>
          </div>
          <div>
            <span className="applicant-card__label">Teléfono</span>
            <span className="applicant-card__value">{telefono || "—"}</span>
          </div>
        </div>

        <div className="applicant-card__meta applicant-card__meta--secondary">
          <span className="applicant-card__label">Fecha inscripción</span>
          <span className="applicant-card__value">
            {formatDateOnly(inscripcion.fechaInscripcion)}
          </span>
        </div>
      </div>

      <div className="applicant-card__footer">
        <span>Ver inscripción</span>
        <span aria-hidden="true">›</span>
      </div>
    </div>
  );
};

export default StudentCard;
