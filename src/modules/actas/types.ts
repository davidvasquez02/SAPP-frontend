import type { ApiResponse } from "../../api/types";

export interface ActaDto {
  id: number;
  nombre: string;
  codigo: string;
  fechaCreacion: string;
  observaciones: string | null;
  documentoContenidoId: number;
  mimeType: string;
  tamanoBytes: number;
  checksum: string;
}

export interface CrearActaRequest {
  nombre: string;
  codigo: string;
  fechaCreacion: string;
  observaciones: string;
  contenidoBase64: string;
  mimeType: string;
  tamanoBytes: number;
  checksum: string;
}

export type ActasListResponse = ApiResponse<ActaDto[]>;
export type CrearActaResponse = ApiResponse<ActaDto> | ActaDto;
