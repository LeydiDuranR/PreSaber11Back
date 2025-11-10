import { Router } from "express";
import { listarCursos, verificarCursoClave, listarCursosPorInstitucion } from "../controllers/cursoController.js";

const router = Router();
router.post("/verificar", verificarCursoClave);
router.get("/", listarCursos);
router.get("/institucion/:id_institucion", listarCursosPorInstitucion);

export default router;
