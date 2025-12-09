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

        if (!datos.duracion_sesion_1 || !datos.duracion_sesion_2) {
            return res.status(400).json({
                status: "error",
                mensaje: "Las duraciones de ambas sesiones son requeridas"
            });
        }

        if (!datos.preguntas_sesion1 || !datos.preguntas_sesion2) {
            return res.status(400).json({
                status: "error",
                mensaje: "Las preguntas de ambas sesiones son requeridas"
            });
        }

        // Validar estructura de preguntas
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

        // Crear simulacro
        const resultado = await SimulacroService.crearSimulacro(datos);

        return res.status(201).json({
            status: "ok",
            mensaje: "Simulacro creado correctamente",
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
        const { activo, page = 1, limit = 10 } = req.query;

        const filtros = {};
        if (activo !== undefined) {
            filtros.activo = activo === 'true';
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
        const { nombre, descripcion, activo } = req.body;

        if (!id_simulacro) {
            return res.status(400).json({
                status: "error",
                mensaje: "El id_simulacro es requerido"
            });
        }

        const resultado = await SimulacroService.actualizarSimulacro(id_simulacro, {
            nombre,
            descripcion,
            activo
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




export default {
    obtenerUltimoSimulacro, obtenerDisponibles,
    obtenerResultadosSimulacro, crearSimulacro,
    obtenerEstructuraICFES, obtenerTodos, obtenerPorId,
    actualizarSimulacro, desactivarSimulacro
};
