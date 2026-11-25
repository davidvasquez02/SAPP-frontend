import type { ApiResponse } from "../../api/types";

export interface ActaDto {
  id: number;
  nombre: string;
  codigo: string;
  fechaCreacion: string;
  observaciones: string | null;
  tipoConsejo: boolean | null;
  documentoContenidoId: number;
  mimeType: string;
  tamanoBytes: number;
  checksum: string;
}

export interface DocumentoActaRequest {
  contenidoBase64: string;
  mimeType: string;
  tamanoBytes: number;
  checksum: string;
}

export interface CrearActaRequest extends DocumentoActaRequest {
  nombre: string;
  codigo: string;
  fechaCreacion: string;
  observaciones: string;
  tipoConsejo: boolean;
}

export type ActasListResponse = ApiResponse<ActaDto[]>;
export type CrearActaResponse = ApiResponse<ActaDto> | ActaDto;
