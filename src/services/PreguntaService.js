import Pregunta from "../models/Pregunta.js";
import { subirArchivoAFirebase, limpiarArchivosTemporales } from "../utils/fileHandlers.js";

async function crearPregunta(enunciado, file, nivel_dificultad, id_area, id_tema) {
    try {
        let imagenUrl = null;

        if (!nivel_dificultad || !id_area) {
            throw new Error("Nivel de dificultad y área son obligatorios.");
        }
        // Si hay archivo, subirlo a Firebase
        if (file) {
            imagenUrl = await subirArchivoAFirebase(file.path, file.path, "icons");
            limpiarArchivosTemporales(file.path); // Borrar archivo temporal
        }

        const pregunta = await Pregunta.create({
            enunciado,
            imagen: imagenUrl,
            nivel_dificultad,
            id_area,
            id_tema,
        });

        return pregunta;
    } catch (error) {
        throw new Error(error.message);
    }
}

export default { crearPregunta };
