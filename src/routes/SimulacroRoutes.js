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



export default router;
