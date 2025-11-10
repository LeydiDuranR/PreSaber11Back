import { Router } from "express";
import {
    listarCursos, verificarCursoClave, listarCursosPorInstitucion,
    obtenerCursosPorInstituciones, crearCursoInstitucion
} from "../controllers/cursoController.js";

const router = Router();
router.post("/verificar", verificarCursoClave);
router.get("/", listarCursos);
router.get("/curso/institucion/:id_institucion", listarCursosPorInstitucion);
router.get("/institucion/:id_institucion", obtenerCursosPorInstituciones);
router.post("/crear", crearCursoInstitucion);

export default router;
