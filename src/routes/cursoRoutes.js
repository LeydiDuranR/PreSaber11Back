import { Router } from "express";
import {
    listarCursos, 
    verificarCursoClave, 
    listarCursosPorInstitucion,
    obtenerCursosPorInstituciones,
    crearCursoInstitucion, 
    actualizarEstadoCursoController,
    obtenerParticipantes,
    obtenerPromedios,
    obtenerRanking,
    actualizarConfiguracion
} from "../controllers/cursoController.js";

const router = Router();
router.post("/verificar", verificarCursoClave);
router.get("/", listarCursos);
router.get("/curso/institucion/:id_institucion", listarCursosPorInstitucion);
router.get("/institucion/:id_institucion", obtenerCursosPorInstituciones);
router.post("/crear", crearCursoInstitucion);
router.put("/actualizar-estado", actualizarEstadoCursoController);

router.post('/participantes', obtenerParticipantes);
router.post('/promedios', obtenerPromedios);
router.post('/ranking', obtenerRanking);
router.patch('/configuracion', actualizarConfiguracion);

export default router;
