import TipoDocumento from "../models/TipoDocumento.js";

export const obtenerTiposDocumento = async () => {
  return await TipoDocumento.findAll();
};
