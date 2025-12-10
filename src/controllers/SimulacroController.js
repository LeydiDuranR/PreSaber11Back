import SimulacroService from "../services/SimulacroService.js";

async function obtenerUltimoSimulacro(req, res) {
    try {
        const { id_usuario } = req.params;

        const data = await SimulacroService.obtenerUltimoSimulacro(id_usuario);

        if (!data) {
            return res.status(404).json({
                message: "El estudiante no tiene simulacros registrados."
            });
        }

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function obtenerDisponibles(req, res) {
    try {
        const { id_estudiante } = req.params;

        const simulacros = await SimulacroService.obtenerSimulacrosDisponibles(id_estudiante);

        res.status(200).json(simulacros);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function obtenerResultadosSimulacro(req, res) {
    try {
        const { id_simulacro, id_estudiante } = req.params;
        const resultados = await SimulacroService.obtenerResultadosSimulacro(id_simulacro, id_estudiante);
        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


// async function crearSimulacro(req, res) {
//     try {
//         const resultado = await SimulacroService.crearSimulacro(req.body);

//         res.status(201).json({
//             ok: true,
//             message: "Simulacro creado correctamente",
//             data: resultado
//         });

//     } catch (error) {
//         res.status(400).json({
//             ok: false,
//             message: error.message
//         });
//     }
// }


async function crearSimulacro(req, res) {
    try {
        const datos = req.body;

        // Validaciones básicas
        if (!datos.nombre_simulacro) {
            return res.status(400).json({
                status: "error",
                mensaje: "El nombre del simulacro es requerido"
            });
        }

        // Las preguntas son opcionales - se pueden agregar después
        const tienePreguntas = datos.preguntas_sesion1 && datos.preguntas_sesion2;

        // Si se proporcionan preguntas, validar estructura
        if (tienePreguntas) {
            const erroresValidacion = SimulacroService.validarEstructuraPreguntas(
                datos.preguntas_sesion1,
                datos.preguntas_sesion2
            );

            if (erroresValidacion.length > 0) {
                return res.status(400).json({
                    status: "error",
                    mensaje: "Estructura de preguntas inválida según ICFES",
                    errores: erroresValidacion
                });
            }
        }

        // Crear simulacro
        const resultado = await SimulacroService.crearSimulacro(datos);

        return res.status(201).json({
            status: "ok",
            mensaje: resultado.mensaje,
            data: resultado
        });

    } catch (error) {
        console.error("Error en crearSimulacro:", error);

        // Diferenciar errores de validación vs errores del servidor
        if (error.message.includes("debe tener exactamente") ||
            error.message.includes("no existe") ||
            error.message.includes("pertenece al área")) {
            return res.status(400).json({
                status: "error",
                mensaje: "Error de validación",
                error: error.message
            });
        }

        return res.status(500).json({
            status: "error",
            mensaje: "Error interno al crear el simulacro",
            error: error.message
        });
    }
}


/**
 * Obtener la estructura ICFES oficial
 * GET /api/simulacros/estructura-icfes
 * 
 * Útil para que el frontend sepa cuántas preguntas necesita por área
 */
async function obtenerEstructuraICFES(req, res) {
    try {
        const estructura = SimulacroService.obtenerEstructuraICFES();

        return res.status(200).json({
            status: "ok",
            data: estructura
        });

    } catch (error) {
        console.error("Error en obtenerEstructuraICFES:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al obtener estructura ICFES",
            error: error.message
        });
    }
}


/**
 * Obtener todos los simulacros (admin)
 * GET /api/simulacros
 */
async function obtenerTodos(req, res) {
    try {
        const { estado, page = 1, limit = 10 } = req.query;

        const filtros = {};
        if (estado !== undefined) {
            filtros.estado = estado === 'true';
        }

        const simulacros = await SimulacroService.obtenerTodos(filtros, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        return res.status(200).json({
            status: "ok",
            ...simulacros
        });

    } catch (error) {
        console.error("Error en obtenerTodos:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al obtener simulacros",
            error: error.message
        });
    }
}


/**
 * Obtener un simulacro por ID con todas sus relaciones
 * GET /api/simulacros/:id_simulacro
 */
async function obtenerPorId(req, res) {
    try {
        const { id_simulacro } = req.params;

        if (!id_simulacro) {
            return res.status(400).json({
                status: "error",
                mensaje: "El id_simulacro es requerido"
            });
        }

        const simulacro = await SimulacroService.obtenerPorId(id_simulacro);

        if (!simulacro) {
            return res.status(404).json({
                status: "error",
                mensaje: "Simulacro no encontrado"
            });
        }

        return res.status(200).json({
            status: "ok",
            data: simulacro
        });

    } catch (error) {
        console.error("Error en obtenerPorId:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al obtener el simulacro",
            error: error.message
        });
    }
}


/**
 * Actualizar un simulacro (solo nombre, descripción, activo)
 * PUT /api/simulacros/:id_simulacro
 */
async function actualizarSimulacro(req, res) {
    try {
        const { id_simulacro } = req.params;
        const { nombre, descripcion, estado } = req.body;

        if (!id_simulacro) {
            return res.status(400).json({
                status: "error",
                mensaje: "El id_simulacro es requerido"
            });
        }

        const resultado = await SimulacroService.actualizarSimulacro(id_simulacro, {
            nombre,
            descripcion,
            estado
        });

        return res.status(200).json({
            status: "ok",
            mensaje: "Simulacro actualizado correctamente",
            data: resultado
        });

    } catch (error) {
        console.error("Error en actualizarSimulacro:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al actualizar el simulacro",
            error: error.message
        });
    }
}


/**
 * Desactivar un simulacro (soft delete)
 * DELETE /api/simulacros/:id_simulacro
 */
async function desactivarSimulacro(req, res) {
    try {
        const { id_simulacro } = req.params;

        if (!id_simulacro) {
            return res.status(400).json({
                status: "error",
                mensaje: "El id_simulacro es requerido"
            });
        }

        await SimulacroService.desactivarSimulacro(id_simulacro);

        return res.status(200).json({
            status: "ok",
            mensaje: "Simulacro desactivado correctamente"
        });

    } catch (error) {
        console.error("Error en desactivarSimulacro:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al desactivar el simulacro",
            error: error.message
        });
    }
}




/**
 * Asignar simulacro a cursos
 * POST /api/simulacros/:id_simulacro/asignar
 */
async function asignarSimulacro(req, res) {
    try {
        const { id_simulacro } = req.params;
        const { asignaciones } = req.body;

        if (!asignaciones || !Array.isArray(asignaciones) || asignaciones.length === 0) {
            return res.status(400).json({
                status: "error",
                mensaje: "Debe proporcionar al menos una asignación"
            });
        }

        const resultado = await SimulacroService.asignarSimulacroACursos(id_simulacro, asignaciones);

        return res.status(200).json({
            status: "ok",
            mensaje: "Simulacro asignado correctamente",
            data: resultado
        });

    } catch (error) {
        console.error("Error en asignarSimulacro:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al asignar simulacro",
            error: error.message
        });
    }
}

/**
 * Agregar pregunta a sesión/área
 * POST /api/simulacros/:id_simulacro/sesiones/:numero_sesion/areas/:id_area/preguntas
 */
async function agregarPregunta(req, res) {
    try {
        const { id_simulacro, numero_sesion, id_area } = req.params;
        const { id_pregunta, puntaje_base } = req.body;

        if (!id_pregunta) {
            return res.status(400).json({
                status: "error",
                mensaje: "El id_pregunta es requerido"
            });
        }

        const resultado = await SimulacroService.agregarPreguntaASesion(
            parseInt(id_simulacro),
            parseInt(numero_sesion),
            parseInt(id_area),
            parseInt(id_pregunta),
            puntaje_base || 0.5
        );

        return res.status(200).json({
            status: "ok",
            ...resultado
        });

    } catch (error) {
        console.error("Error en agregarPregunta:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al agregar pregunta",
            error: error.message
        });
    }
}

/**
 * Eliminar pregunta de sesión/área
 * DELETE /api/simulacros/:id_simulacro/sesiones/:numero_sesion/areas/:id_area/preguntas/:id_pregunta
 */
async function eliminarPregunta(req, res) {
    try {
        const { id_simulacro, numero_sesion, id_area, id_pregunta } = req.params;

        const resultado = await SimulacroService.eliminarPreguntaDeSesion(
            parseInt(id_simulacro),
            parseInt(numero_sesion),
            parseInt(id_area),
            parseInt(id_pregunta)
        );

        return res.status(200).json({
            status: "ok",
            ...resultado
        });

    } catch (error) {
        console.error("Error en eliminarPregunta:", error);
        return res.status(500).json({
            status: "error",
            mensaje: "Error al eliminar pregunta",
            error: error.message
        });
    }
}

export default {
    obtenerUltimoSimulacro, obtenerDisponibles,
    obtenerResultadosSimulacro, crearSimulacro,
    obtenerEstructuraICFES, obtenerTodos, obtenerPorId,
    actualizarSimulacro, desactivarSimulacro,
    asignarSimulacro, agregarPregunta, eliminarPregunta
};
