import Pregunta from "../models/Pregunta.js";
import { subirArchivoAFirebase, limpiarArchivosTemporales } from "../utils/fileHandlers.js";
import Area from "../models/Area.js";
import Tema from "../models/Tema.js";
import Opcion from "../models/Opcion.js";
import db from "../db/db.js"
import OpcionService from "./OpcionService.js";

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
async function editarPregunta(id, enunciado, file, nivel_dificultad, id_area, id_tema, eliminar_imagen = false, options = {}) {
    try {
        if (!id) throw new Error("El ID de la pregunta es obligatorio.");
        const pregunta = await Pregunta.findByPk(id);
        if (!pregunta) throw new Error("Pregunta no encontrada.");

        let imagenUrl = pregunta.imagen;

        if (file) {
            imagenUrl = await subirArchivoAFirebase(file.path, file.path, "icons");
            limpiarArchivosTemporales(file.path);
        } else if (eliminar_imagen) {
            imagenUrl = null;
        }

        await pregunta.update({
            enunciado: enunciado ?? pregunta.enunciado,
            imagen: imagenUrl,
            nivel_dificultad: nivel_dificultad ?? pregunta.nivel_dificultad,
            id_area: id_area ?? pregunta.id_area,
            id_tema: id_tema ?? pregunta.id_tema,
        }, options);

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
                {
                    model: Opcion,
                    as: "opciones",
                    attributes: ["id_opcion", "texto_opcion", "imagen", "es_correcta"]
                }
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

async function crearPreguntasLote(preguntasArray, filesMap = {}) {
    const transaction = await db.transaction();
    try {
        const imagenesPromises = [];
        const imagenesKeys = [];

        for (let pIndex = 0; pIndex < preguntasArray.length; pIndex++) {
            const filePregunta = filesMap[`pregunta_${pIndex}`];
            if (filePregunta) {
                imagenesKeys.push({ tipo: 'pregunta', pIndex });
                imagenesPromises.push(
                    subirArchivoAFirebase(filePregunta.path, filePregunta.path, "icons")
                        .then(url => {
                            limpiarArchivosTemporales(filePregunta.path);
                            return url;
                        })
                );
            }

            const opciones = preguntasArray[pIndex].opciones || [];
            for (let oIndex = 0; oIndex < opciones.length; oIndex++) {
                const fileOpcion = filesMap[`opcion_${pIndex}_${oIndex}`];
                if (fileOpcion) {
                    imagenesKeys.push({ tipo: 'opcion', pIndex, oIndex });
                    imagenesPromises.push(
                        subirArchivoAFirebase(fileOpcion.path, fileOpcion.path, "icons")
                            .then(url => {
                                limpiarArchivosTemporales(fileOpcion.path);
                                return url;
                            })
                    );
                }
            }
        }

        const urlsSubidas = await Promise.all(imagenesPromises);

        const urlsMap = {};
        imagenesKeys.forEach((key, idx) => {
            if (key.tipo === 'pregunta') {
                urlsMap[`pregunta_${key.pIndex}`] = urlsSubidas[idx];
            } else {
                urlsMap[`opcion_${key.pIndex}_${key.oIndex}`] = urlsSubidas[idx];
            }
        });

        const preguntasPromises = preguntasArray.map(async (p, pIndex) => {
            const {
                enunciado,
                nivel_dificultad,
                id_area,
                id_tema,
                opciones = []
            } = p;

            if (!enunciado && !urlsMap[`pregunta_${pIndex}`]) {
                throw new Error(`Pregunta ${pIndex}: falta enunciado o imagen`);
            }
            if (!nivel_dificultad || !id_area) {
                throw new Error(`Pregunta ${pIndex}: nivel_dificultad e id_area son obligatorios`);
            }

            const nuevaPregunta = await Pregunta.create({
                enunciado: enunciado || null,
                imagen: urlsMap[`pregunta_${pIndex}`] || null,
                nivel_dificultad,
                id_area,
                id_tema: id_tema || null
            }, { transaction });

            const opcionesPromises = opciones.map(async (opt, oIndex) => {
                const urlOpcion = urlsMap[`opcion_${pIndex}_${oIndex}`];

                if (!opt.texto_opcion && !urlOpcion) {
                    throw new Error(`La opción ${oIndex} de la pregunta ${pIndex} debe tener texto o imagen`);
                }

                return await Opcion.create({
                    texto_opcion: opt.texto_opcion || null,
                    imagen: urlOpcion || null,
                    es_correcta: opt.es_correcta ?? false,
                    id_pregunta: nuevaPregunta.id_pregunta
                }, { transaction });
            });

            const opcionesCreadas = await Promise.all(opcionesPromises);

            return {
                pregunta: nuevaPregunta,
                opciones: opcionesCreadas
            };
        });

        const resultado = await Promise.all(preguntasPromises);

        await transaction.commit();
        return resultado;

    } catch (err) {
        await transaction.rollback();
        throw new Error(err.message);
    }
}

async function editarPreguntaConOpciones({ 
    id_pregunta, 
    enunciado, 
    nivel_dificultad, 
    id_area, 
    id_tema, 
    file, 
    eliminar_imagen = false, 
    opciones 
}) {
    let transaction;
    
    try {
        transaction = await db.transaction();
        
        // Editar la pregunta principal
        await editarPregunta(
            id_pregunta,
            enunciado,
            file,
            nivel_dificultad,
            id_area,
            id_tema,
            eliminar_imagen,
            { transaction }
        );

        // Editar cada opción
        if (opciones && Array.isArray(opciones)) {
            for (const op of opciones) {
                await OpcionService.editarOpcion(
                    op.id_opcion,
                    op.texto_opcion ?? null,
                    op.file ?? null,
                    op.es_correcta,
                    id_pregunta,
                    op.eliminar_imagen ?? false,
                    { transaction }
                );
            }
        }

        await transaction.commit();
        transaction = null;
        
        const preguntaActualizada = await Pregunta.findByPk(id_pregunta, { 
            include: [
                { model: Opcion, as: 'opciones' },
                { model: Area, as: 'area' },
                { model: Tema, as: 'tema' }
            ] 
        });

        return preguntaActualizada || { 
            id_pregunta, 
            mensaje: 'Pregunta actualizada exitosamente' 
        };

    } catch (error) {
        // Solo hacer rollback si la transacción aún existe
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Error al hacer rollback:', rollbackError);
            }
        }
        
        console.error('Error editando pregunta:', error);
        throw new Error(`Error al editar pregunta: ${error.message}`);
    }
}

async function contarPreguntasPorAreaYNivel(id_area, nivel_dificultad) {
    try {
        if (!id_area || !nivel_dificultad) {
            throw new Error("El área y el nivel de dificultad son obligatorios.");
        }

        const nivel = nivel_dificultad.toLowerCase();
        const nivelesValidos = ["bajo", "medio", "alto"];

        if (!nivelesValidos.includes(nivel)) {
            throw new Error("El nivel de dificultad debe ser: bajo, medio o alto.");
        }

        const total = await Pregunta.count({
            where: {
                id_area,
                nivel_dificultad: nivel
            }
        });

        return total;

    } catch (error) {
        throw new Error(error.message);
    }
}


export default { crearPregunta, editarPregunta, obtenerPregunta, obtenerPreguntas, obtenerPreguntasPorArea, crearPreguntasLote, editarPreguntaConOpciones, contarPreguntasPorAreaYNivel };
