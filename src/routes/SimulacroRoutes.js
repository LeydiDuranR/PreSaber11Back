import { Router } from "express";
import SimulacroController from "../controllers/SimulacroController.js";

const router = Router();


router.get("/ultimo/:id_usuario", SimulacroController.obtenerUltimoSimulacro);
router.get("/disponibles/:id_estudiante", SimulacroController.obtenerDisponibles);
router.get("/:id_simulacro/estudiante/:id_estudiante/resultados", SimulacroController.obtenerResultadosSimulacro);

// POST /api/simulacros
router.post("/", SimulacroController.crearSimulacro);


/**
 * Obtener estructura oficial ICFES
 * GET /api/simulacros/estructura-icfes
 */
router.get('/estructura-icfes', SimulacroController.obtenerEstructuraICFES);

/**
 * Obtener un simulacro por ID
 * GET /api/simulacros/:id_simulacro
 */
router.get('/:id_simulacro', SimulacroController.obtenerPorId);

/**
 * Obtener todos los simulacros con filtros y paginación
 * GET /api/simulacros?activo=true&page=1&limit=10
 */
router.get('/', SimulacroController.obtenerTodos);


/**
 * Crear un nuevo simulacro
 * POST /api/simulacros/crear
 */
router.post('/crear', 
    // authMiddleware.verificarAdmin, // Descomentar cuando tengas auth
    SimulacroController.crearSimulacro
);


/**
 * Actualizar un simulacro
 * PUT /api/simulacros/:id_simulacro
 */
router.put('/:id_simulacro', 
    // authMiddleware.verificarAdmin,
    SimulacroController.actualizarSimulacro
);

/**
 * Desactivar un simulacro (soft delete)
 * DELETE /api/simulacros/:id_simulacro
 */
router.delete('/:id_simulacro', 
    // authMiddleware.verificarAdmin,
    SimulacroController.desactivarSimulacro
);

/**
 * Asignar simulacro a cursos
 * POST /api/simulacros/:id_simulacro/asignar
 */
router.post('/:id_simulacro/asignar', SimulacroController.asignarSimulacro);

/**
 * Agregar pregunta a sesión/área
 * POST /api/simulacros/:id_simulacro/sesiones/:numero_sesion/areas/:id_area/preguntas
 */
router.post('/:id_simulacro/sesiones/:numero_sesion/areas/:id_area/preguntas', SimulacroController.agregarPregunta);

/**
 * Eliminar pregunta de sesión/área
 * DELETE /api/simulacros/:id_simulacro/sesiones/:numero_sesion/areas/:id_area/preguntas/:id_pregunta
 */
router.delete('/:id_simulacro/sesiones/:numero_sesion/areas/:id_area/preguntas/:id_pregunta', SimulacroController.eliminarPregunta);

export default router;
