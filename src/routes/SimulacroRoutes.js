import { Router } from "express";
import SimulacroController from "../controllers/SimulacroController.js";

const router = Router();


router.get("/ultimo/:id_usuario", SimulacroController.obtenerUltimoSimulacro);
router.get("/disponibles/:id_estudiante", SimulacroController.obtenerDisponibles);

export default router;
