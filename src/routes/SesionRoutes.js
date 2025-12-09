import { Router } from "express";
import sesionController from "../controllers/SesionController.js";

const router = Router();

// Obtener preguntas para una sesión según estudiante
router.get("/:id_sesion/estudiante/:id_estudiante", sesionController.obtenerPreguntasSesion);

// Guardar respuesta
router.post("/respuesta", sesionController.responderPregunta);

export default router;