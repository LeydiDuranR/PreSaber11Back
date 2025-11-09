import { Router } from "express";
import upload from "../middlewares/upload.js";
import OpcionController from "../controllers/OpcionController.js";

const router = Router();

// Crear nueva opción (puede incluir imagen)
router.post("/", upload.single("file"), OpcionController.crearOpcion);

// Editar opción (puede incluir imagen)
router.put("/:id", upload.single("file"), OpcionController.editarOpcion);

// Obtener opciones de una pregunta
router.get("/:id_pregunta", OpcionController.obtenerOpcionesDePregunta);

export default router;
