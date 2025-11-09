import { Router } from "express";
import PreguntaController from "../controllers/PreguntaController.js";
import upload from "../middlewares/upload.js";

const router = Router();

router.post("/crear", upload.single("file"), PreguntaController.crearPregunta);
router.get("/", PreguntaController.obtenerPreguntas);
router.get("/:id", PreguntaController.obtenerPregunta);
router.get("/area/:id_area", PreguntaController.obtenerPreguntasPorArea);
router.put("/:id", upload.single("file"), PreguntaController.editarPregunta);

export default router;
