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
    const { enunciado, nivel_dificultad, id_area, id_tema, eliminar_imagen } = req.body;
    const file = req.file || null;

    const pregunta = await PreguntaService.editarPregunta(
      id,
      enunciado,
      file,
      nivel_dificultad,
      id_area,
      id_tema,
      eliminar_imagen === 'true'
    );

    res.status(200).json(pregunta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


async function crearPreguntasLote(req, res) {
  try {
    const filesMap = {};
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        filesMap[file.fieldname] = file;
      }
    }

    const raw = req.body.data;
    if (!raw) return res.status(400).json({ message: "Campo 'data' ausente" });

    const payload = JSON.parse(raw);
    const preguntas = payload.preguntas;

    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({ message: "El arreglo 'preguntas' es requerido" });
    }

    res.status(202).json({
      success: true,
      message: "Procesando preguntas...",
      total: preguntas.length
    });

    PreguntaService.crearPreguntasLote(preguntas, filesMap)
      .then(() => console.log("✅ Preguntas creadas"))
      .catch(err => console.error("❌ Error:", err));

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function editarPreguntaConOpciones(req, res) {
  try {
    const { id } = req.params;
    const { enunciado, nivel_dificultad, id_area, id_tema, opciones } = req.body;
    const filesArray = req.files || [];

    const filesMap = {};
    for (const file of filesArray) {
      filesMap[file.fieldname] = file;
    }

    const opcionesConImagen = JSON.parse(opciones).map(op => {
      const key = `file_${op.id_opcion}`;
      if (filesMap[key]) op.file = filesMap[key];
      return op;
    });

    const preguntaActualizada = await PreguntaService.editarPreguntaConOpciones({
      id_pregunta: id,
      enunciado,
      nivel_dificultad,
      id_area,
      id_tema,
      file: filesMap["file"] || null,
      eliminar_imagen: req.body.eliminar_imagen === 'true',
      opciones: opcionesConImagen
    });

    res.status(200).json(preguntaActualizada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

async function contarPreguntasPorAreaYNivel(req, res) {
    try {
        const { id_area, nivel_dificultad } = req.query;

        const total = await PreguntaService.contarPreguntasPorAreaYNivel(
            id_area,
            nivel_dificultad
        );

        return res.json({
            ok: true,
            total
        });

    } catch (error) {
        return res.status(400).json({
            ok: false,
            mensaje: error.message
        });
    }
}


export default {
  crearPregunta, obtenerPreguntas, obtenerPregunta,
  obtenerPreguntasPorArea, editarPregunta, crearPreguntasLote,
  editarPreguntaConOpciones, contarPreguntasPorAreaYNivel
};
