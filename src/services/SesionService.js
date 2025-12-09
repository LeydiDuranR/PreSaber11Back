import SesionService from "../services/SesionService.js";

async function obtenerPreguntasSesion(req, res) {
  try {
    const { id_sesion, id_estudiante } = req.params;

    const resultado = await SesionService.obtenerPreguntasParaSesion(
      Number(id_sesion),
      id_estudiante
    );

    if (!resultado.puedeIngresar) {
      return res.status(403).json({
        message: resultado.mensaje || "No puede ingresar a esta sesión porque hay sesiones previas incompletas."
      });
    }

    return res.status(200).json(resultado);

  } catch (error) {
    console.error("Error obtenerPreguntasSesion:", error);
    return res.status(500).json({ message: error.message });
  }
}

async function responderPregunta(req, res) {
  try {
    const body = req.body;

    if (
      !body.id_estudiante ||
      !body.id_sesion ||
      !body.id_sesion_pregunta ||
      !body.id_opcion
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    const resultado = await SesionService.guardarRespuesta(body);

    return res.status(200).json(resultado);

  } catch (error) {
    console.error("Error responderPregunta:", error);
    return res.status(500).json({ message: error.message });
  }
}

async function finalizarSesion(req, res) {
  try {
    const { id_sesion, id_estudiante } = req.body;

    const resultado = await SesionService.finalizarSesion({
      id_sesion,
      id_estudiante,
      tiempo_usado_final: req.body.tiempo_usado_final || null
    });

    return res.status(200).json(resultado);

  } catch (error) {
    console.error("Error finalizarSesion:", error);
    return res.status(500).json({ message: error.message });
  }
}

async function obtenerResultadosSesion(req, res) {
  try {
    const { id_sesion, id_estudiante } = req.params;

    const resultado = await SesionService.obtenerResultadosSesion(
      Number(id_sesion),
      id_estudiante
    );

    return res.status(200).json(resultado);

  } catch (error) {
    console.error("Error obtenerResultadosSesion:", error);
    return res.status(500).json({ message: error.message });
  }
}

export default {
  obtenerPreguntasSesion,
  responderPregunta,
  finalizarSesion,
  obtenerResultadosSesion
};
