import express from 'express';
import retoController from '../controllers/RetoController.js';

const router = express.Router();

router.post('/crear', retoController.crear);
router.get('/area/:idArea', retoController.listarRetosPorArea);
router.get('/:idReto/preguntas', retoController.obtenerPreguntasReto);

router.post('/respuestas', retoController.guardarRespuesta);
router.get('/respuestas/:idEstudiante/:idReto', retoController.obtenerRespuestasEstudiante);

router.post('/resultado', retoController.calcularResultado);
router.get('/historial/:idEstudiante', retoController.obtenerHistorial);

export default router;