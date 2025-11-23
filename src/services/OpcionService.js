import Opcion from "../models/Opcion.js";
import Pregunta from "../models/Pregunta.js";
import { subirArchivoAFirebase, limpiarArchivosTemporales } from "../utils/fileHandlers.js";


async function crearOpcion(texto_opcion, file, es_correcta, id_pregunta) {
    try {
        // Validaciones
        if (!id_pregunta) {
            throw new Error("Debe especificar la pregunta a la que pertenece la opción.");
        }

        // Verificar que la pregunta exista
        const pregunta = await Pregunta.findByPk(id_pregunta);
        if (!pregunta) {
            throw new Error("Pregunta no encontrada.");
        }

        if (!texto_opcion && !file) {
            throw new Error("Debe proporcionar al menos un texto o una imagen para la opción.");
        }

        let imagenUrl = null;

        // Subir imagen si se proporciona
        if (file) {
            imagenUrl = await subirArchivoAFirebase(file.path, file.path, "icons");
            limpiarArchivosTemporales(file.path);
        }

        const opcion = await Opcion.create({
            texto_opcion: texto_opcion || null,
            imagen: imagenUrl || null,
            es_correcta: es_correcta ?? false,
            id_pregunta
        });

        return opcion;
    } catch (error) {
        throw new Error(error.message);
    }
}

/** Editar una opción existente **/
async function editarOpcion(id_opcion, texto_opcion, file, es_correcta, id_pregunta, eliminar_imagen = false, options = {}) {
    try {
        const opcion = await Opcion.findByPk(id_opcion);
        if (!opcion) throw new Error("Opción no encontrada.");

        let imagenUrl = opcion.imagen;

        if (file) {
            imagenUrl = await subirArchivoAFirebase(file.path, file.path, "icons");
            limpiarArchivosTemporales(file.path);
        } else if (eliminar_imagen) {
            imagenUrl = null;
        }

        await opcion.update({
            texto_opcion: texto_opcion ?? opcion.texto_opcion,
            imagen: imagenUrl,
            es_correcta: es_correcta ?? opcion.es_correcta,
            id_pregunta: id_pregunta ?? opcion.id_pregunta
        }, options);

        return opcion;
    } catch (error) {
        throw new Error(error.message);
    }
}

/**  Obtener todas las opciones de una pregunta **/
async function obtenerOpcionesDePregunta(id_pregunta) {
    try {
        if (!id_pregunta) {
            throw new Error("Debe especificar la pregunta.");
        }

        const pregunta = await Pregunta.findByPk(id_pregunta);
        if (!pregunta) {
            throw new Error("Pregunta no encontrada.");
        }

        const opciones = await Opcion.findAll({
            where: { id_pregunta },
        });

        if (!opciones || opciones.length === 0) {
            throw new Error("No se encontraron opciones para esta pregunta.");
        }

        return opciones;
    } catch (error) {
        throw new Error(error.message);
    }
}

export default {
    crearOpcion,
    editarOpcion,
    obtenerOpcionesDePregunta
};
