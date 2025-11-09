import { Router } from "express";
import { listarCursos, verificarCursoClave } from "../controllers/cursoController.js";

const router = Router();
router.post("/verificar", verificarCursoClave);
router.get("/", listarCursos);

export default router;
