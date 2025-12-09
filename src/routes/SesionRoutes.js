// routes/SesionRoutes.js
import { Router } from "express";
import sesionController from "../controllers/SesionController.js";

const router = Router();

// Obtener preguntas de una sesión para un estudiante
router.get(
  "/:id_sesion/estudiante/:id_estudiante",
  sesionController.obtenerPreguntasSesion
);

// Guardar/actualizar respuesta
router.post("/respuesta", sesionController.responderPregunta);

// Finalizar sesión
router.post("/finalizar", sesionController.finalizarSesion);

// Obtener resultados de sesión
router.get(
  "/resultado/:id_sesion/estudiante/:id_estudiante",
  sesionController.obtenerResultadosSesion
);

export default router;
