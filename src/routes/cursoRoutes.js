import { Router } from "express";
import { verificarCursoClave } from "../controllers/cursoController.js";

const router = Router();
router.post("/verificar", verificarCursoClave);

export default router;
