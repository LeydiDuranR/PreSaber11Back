import { obtenerInstituciones } from "../services/institucionService.js";

export const listarInstituciones = async (req, res) => {
  try {
    const instituciones = await obtenerInstituciones();
    res.json(instituciones);
  } catch (error) {
    console.error("Error al listar instituciones:", error);
    res.status(500).json({ message: "Error al obtener instituciones" });
  }
};
