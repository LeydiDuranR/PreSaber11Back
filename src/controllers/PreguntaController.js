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

/** Obtener todas las preguntas **/
export const obtenerPreguntas = async (req, res) => {
  try {
    const preguntas = await PreguntaService.obtenerPreguntas();
    res.status(200).json(preguntas);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/** Obtener una pregunta por ID **/
export const obtenerPregunta = async (req, res) => {
  try {
    const { id } = req.params;
    const pregunta = await PreguntaService.obtenerPregunta(id);
    res.status(200).json(pregunta);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/** Obtener preguntas por área **/
export const obtenerPreguntasPorArea = async (req, res) => {
  try {
    const { id_area } = req.params;
    const preguntas = await PreguntaService.obtenerPreguntasPorArea(id_area);
    res.status(200).json(preguntas);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/** Editar una pregunta **/
export const editarPregunta = async (req, res) => {
  try {
    const { id } = req.params;
    const { enunciado, nivel_dificultad, id_area, id_tema } = req.body;
    const file = req.file || null;

    const pregunta = await PreguntaService.editarPregunta(
      id,
      enunciado,
      file,
      nivel_dificultad,
      id_area,
      id_tema
    );

    res.status(200).json(pregunta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default { crearPregunta, obtenerPreguntas, obtenerPregunta, obtenerPreguntasPorArea, editarPregunta };
