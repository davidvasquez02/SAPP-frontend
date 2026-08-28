import { httpGet, httpPost } from "../../shared/http/httpClient";
import type {
  ActaDto,
  ActasListResponse,
  CrearActaRequest,
  CrearActaResponse,
} from "./types";

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
