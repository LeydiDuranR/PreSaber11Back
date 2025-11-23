import opcionService from "../services/OpcionService.js";

/** Crear una nueva opción **/
async function crearOpcion(req, res) {
    try {
        const { texto_opcion, es_correcta, id_pregunta } = req.body;
        const file = req.file; // imagen opcional

        const opcion = await opcionService.crearOpcion(texto_opcion, file, es_correcta, id_pregunta);
        res.status(201).json(opcion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

/**  Editar una opción existente **/
async function editarOpcion(req, res) {
    try {
        const { id } = req.params;
        const { texto_opcion, es_correcta, id_pregunta, eliminar_imagen } = req.body;
        const file = req.file;

        const opcion = await opcionService.editarOpcion(id, texto_opcion, file, es_correcta, id_pregunta, eliminar_imagen === 'true');
        res.status(200).json(opcion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

/**  Obtener todas las opciones de una pregunta **/
async function obtenerOpcionesDePregunta(req, res) {
    try {
        const { id_pregunta } = req.params;
        const opciones = await opcionService.obtenerOpcionesDePregunta(id_pregunta);
        res.status(200).json(opciones);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export default { crearOpcion, editarOpcion, obtenerOpcionesDePregunta };
