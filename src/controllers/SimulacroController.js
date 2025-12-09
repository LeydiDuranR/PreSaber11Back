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


export default { obtenerUltimoSimulacro, obtenerDisponibles };
