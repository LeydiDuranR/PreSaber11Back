import { Router } from "express";
import {
    listarCursos, verificarCursoClave, listarCursosPorInstitucion,
    obtenerCursosPorInstituciones,
    crearCursoInstitucion, actualizarEstadoCursoController
} from "../controllers/cursoController.js";

const router = Router();
router.post("/verificar", verificarCursoClave);
router.get("/", listarCursos);
router.get("/curso/institucion/:id_institucion", listarCursosPorInstitucion);
router.get("/institucion/:id_institucion", obtenerCursosPorInstituciones);
router.post("/crear", crearCursoInstitucion);
router.put("/actualizar-estado", actualizarEstadoCursoController);

export default router;
