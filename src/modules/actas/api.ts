import { httpDelete, httpGet, httpPost } from "../../shared/http/httpClient";
import type { DocumentoCompletoDto } from "../documentos/api/documentosService";
import type {
  ActaDto,
  ActasListResponse,
  CrearActaRequest,
  CrearActaResponse,
} from "./types";
import type { ApiResponse } from "../../api/types";

export const getActas = async (): Promise<ActaDto[]> => {
  const response = await httpGet<ActasListResponse>("/sapp/actas");

  if (!response.ok) {
    throw new Error(response.message || "No fue posible consultar las actas.");
  }

  return response.data ?? [];
};

export const crearActa = async (payload: CrearActaRequest): Promise<ActaDto> => {
  const response = await httpPost<CrearActaResponse>("/sapp/actas", payload);

  if ("ok" in response) {
    if (!response.ok) {
      throw new Error(response.message || "No fue posible crear el acta.");
    }

    return response.data;
  }

  return response;
};

export const eliminarActa = async (actaId: number): Promise<void> => {
  await httpDelete<unknown>(`/sapp/actas/${actaId}`);
};

export const getDocumentoActa = async (actaId: number): Promise<DocumentoCompletoDto> => {
  const response = await httpGet<ApiResponse<DocumentoCompletoDto>>(`/sapp/actas/${actaId}`);

  if (!response.ok) {
    throw new Error(response.message || "No fue posible cargar el archivo del acta.");
  }

  return response.data;
};
