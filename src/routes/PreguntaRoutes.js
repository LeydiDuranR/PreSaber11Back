import { Router } from "express";
import PreguntaController from "../controllers/PreguntaController.js";
import upload from "../middlewares/upload.js";

const router = Router();

router.post("/crear", upload.single("file"), PreguntaController.crearPregunta);

export default router;
