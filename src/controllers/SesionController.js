import SesionService from "../services/SesionService.js";

async function obtenerPreguntasSesion(req, res) {
  try {
    const { id_sesion, id_estudiante } = req.params;

    const resultado = await SesionService.obtenerPreguntasParaSesion(Number(id_sesion), id_estudiante);

    // Si no puede ingresar (p.ej. sesión previa incompleta), devolvemos 403 con mensaje claro
    if (!resultado.puedeIngresar) {
      return res.status(403).json({
        message: "No puede ingresar a esta sesión porque hay sesiones previas incompletas."
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
    /*
      Body esperado:
      {
        "id_estudiante": "...",
        "id_sesion": 5,
        "id_sesion_pregunta": 32,
        "id_opcion": 10,
        "orden": 12,
        "tiempo_usado": 450   // opcional
      }
    */

    if (!body.id_estudiante || !body.id_sesion || !body.id_sesion_pregunta || !body.id_opcion) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    const resultado = await SesionService.guardarRespuesta(body);

    return res.status(200).json(resultado);

  } catch (error) {
    console.error("Error responderPregunta:", error);
    return res.status(500).json({ message: error.message });
  }
}

export default { obtenerPreguntasSesion, responderPregunta };
