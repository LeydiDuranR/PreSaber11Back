import { obtenerInstituciones, crearInstitucion as crearInstitucionService } from "../services/institucionService.js";

export const listarInstituciones = async (req, res) => {
  try {
    const instituciones = await obtenerInstituciones();
    res.json(instituciones);
  } catch (error) {
    // Loguear error completo para la depuración
    console.error("Error al listar instituciones:", error);

    // Si la causa fue un timeout de conexión a la base de datos, responder 503 (Service Unavailable)
    const isTimeout =
      (error && error.parent && error.parent.code === "ETIMEDOUT") ||
      (error && typeof error.message === "string" && error.message.includes("ETIMEDOUT"));

    if (isTimeout) {
      return res.status(503).json({ message: "No se pudo conectar a la base de datos (timeout)." });
    }

    // Respuesta genérica para otros errores
    res.status(500).json({ message: "Error al obtener instituciones" });
  }
};

export const crearInstitucion = async (req, res) => {
  try {
    const nueva = await crearInstitucionService(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    console.error("Error al crear institución:", error);
    const mensaje = error.message || "Error al crear institución";
    res.status(400).json({ message: mensaje });
  }
};
