import Pregunta from "../models/Pregunta.js";
import { subirArchivoAFirebase, limpiarArchivosTemporales } from "../utils/fileHandlers.js";
import Area from "../models/Area.js";
import Tema from "../models/Tema.js";

async function crearPregunta(enunciado, file, nivel_dificultad, id_area, id_tema) {
    try {
        let imagenUrl = null;

        if (!enunciado && !file) {
            throw new Error("Debe proporcionar al menos un enunciado o un archivo.");
        }

        if (!nivel_dificultad || !id_area) {
            throw new Error("Nivel de dificultad y área son obligatorios.");
        }
        // Si hay archivo, subirlo a Firebase
        if (file) {
            imagenUrl = await subirArchivoAFirebase(file.path, file.path, "icons");
            limpiarArchivosTemporales(file.path); // Borrar archivo temporal
        }

        const pregunta = await Pregunta.create({
            enunciado: enunciado || null,
            imagen: imagenUrl || null,
            nivel_dificultad,
            id_area,
            id_tema: id_tema || null,
        });

        return pregunta;
    } catch (error) {
        throw new Error(error.message);
    }
}


/** Editar una pregunta existente **/
async function editarPregunta(id, enunciado, file, nivel_dificultad, id_area, id_tema) {
    try {
        if (!id) {
            throw new Error("El ID de la pregunta es obligatorio para editar.");
        }
        const pregunta = await Pregunta.findByPk(id);
        if (!pregunta) {
            throw new Error("Pregunta no encontrada.");
        }

        let imagenUrl = pregunta.imagen; // conservar imagen actual por defecto

        // Si hay nuevo archivo, subirlo y reemplazar la imagen
        if (file) {
            imagenUrl = await subirArchivoAFirebase(file.path, file.path, "icons");
            limpiarArchivosTemporales(file.path);
        }

        await pregunta.update({
            enunciado: enunciado || pregunta.enunciado || null,
            imagen: imagenUrl || null,
            nivel_dificultad: nivel_dificultad || pregunta.nivel_dificultad,
            id_area: id_area || pregunta.id_area,
            id_tema: id_tema || pregunta.id_tema || null,
        });

        return pregunta;
    } catch (error) {
        throw new Error(error.message);
    }
}


/** Obtener una pregunta por ID **/
async function obtenerPregunta(id) {
    try {
        if (!id) {
            throw new Error("El ID de la pregunta es obligatorio.");
        }
        const pregunta = await Pregunta.findByPk(id, {
            include: [
                {
                    model: Area,
                    attributes: ["id_area", "nombre"],
                },
                {
                    model: Tema,
                    attributes: ["id_tema", "descripcion"],
                },
            ],
        });
        if (!pregunta) {
            throw new Error("Pregunta no encontrada.");
        }
        return pregunta;
    } catch (error) {
        throw new Error(error.message);
    }
}



async function obtenerPreguntas() {
    try {
        const preguntas = await Pregunta.findAll({
            include: [
                {
                    model: Area,
                    attributes: ["id_area", "nombre"],
                },
                {
                    model: Tema,
                    attributes: ["id_tema", "descripcion"],
                },
            ],
        });
        if (!preguntas || preguntas.length === 0) {
            throw new Error("No se encontraron preguntas registradas");
        }
        return preguntas;

    } catch (error) {
        throw new Error(error.message);
    }
}


async function obtenerPreguntasPorArea(id_area) {
    try {
        if (!id_area) {
            throw new Error("El ID del área es obligatorio.");
        }
        const preguntas = await Pregunta.findAll({
            where: { id_area },
            include: [{
                model: Area,
                attributes: ["id_area", "nombre"],
            },
            {
                model: Tema,
                attributes: ["id_tema", "descripcion"],
            },]
        });

        if (!preguntas || preguntas.length === 0) {
            throw new Error("No se encontraron preguntas para esta área.");
        }

        return preguntas;
    } catch (error) {
        throw new Error(error.message);
    }
}

export default { crearPregunta, editarPregunta, obtenerPregunta, obtenerPreguntas, obtenerPreguntasPorArea };
