import { obtenerTiposDocumento } from "../services/tipoDocumentoService.js";

export const listarTiposDocumento = async (req, res) => {
  try {
    const tipos = await obtenerTiposDocumento();
    res.status(200).json(tipos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
