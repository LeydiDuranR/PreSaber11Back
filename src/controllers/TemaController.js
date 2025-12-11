import temaService from "../services/TemaService.js";

async function obtenerTemasPorArea (req, res) {
  try {
    const { id_area } = req.params;

    const temas = await temaService.obtenerTemasPorArea(id_area);
    return res.status(200).json(temas);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

async function listarPorArea(req, res) {
        try {
            const { idArea } = req.params;
            const temas = await temaService.listarTemasPorAreaConConteo(idArea);
            res.json({ success: true, data: temas });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
}

async function crearTema (req, res) {
  try {
    const { descripcion, id_area } = req.body;

    const nuevoTema = await temaService.crearTema(descripcion, id_area);
    return res.status(201).json({
      message: "Tema creado exitosamente",
      tema: nuevoTema,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


export default{crearTema, obtenerTemasPorArea, listarPorArea};