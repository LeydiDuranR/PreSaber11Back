import { Router } from "express";
import { listarCursos, verificarCursoClave, 
    obtenerCursosPorInstitucion, crearCursoInstitucion} from "../controllers/cursoController.js";

const router = Router();
router.post("/verificar", verificarCursoClave);
router.get("/", listarCursos);
router.get("/institucion/:id_institucion", obtenerCursosPorInstitucion);
router.post("/crear", crearCursoInstitucion);

export default router;
