import PreguntaService from "../services/PreguntaService.js";

async function crearPregunta(req, res) {
  try {
    const { enunciado, nivel_dificultad, id_area, id_tema } = req.body;
    const file = req.file; // multer guarda el archivo aquí
    const pregunta = await PreguntaService.crearPregunta(
      enunciado,
      file || null,
      nivel_dificultad,
      id_area,
      id_tema
    );
    res.status(201).json(pregunta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export default { crearPregunta };
