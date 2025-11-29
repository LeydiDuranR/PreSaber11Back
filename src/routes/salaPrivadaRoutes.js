import express from 'express';
import SalaPrivadaController from '../controllers/SalaPrivadaController.js';

const router = express.Router();

// Crear sala privada
router.post('/crear', SalaPrivadaController.crearSala);

// Unirse a sala mediante código
router.post('/unirse', SalaPrivadaController.unirseASala);

// Obtener detalle de sala
router.get('/:idSala', SalaPrivadaController.obtenerSala);

// Obtener preguntas de la sala
router.get('/:idSala/preguntas', SalaPrivadaController.obtenerPreguntas);

// Guardar respuesta
router.post('/respuesta', SalaPrivadaController.guardarRespuesta);

// Finalizar participación
router.post('/finalizar', SalaPrivadaController.finalizarParticipacion);

// Obtener resultado final
router.get('/:idSala/resultado', SalaPrivadaController.obtenerResultado);

// Obtener progreso en tiempo real
router.get('/:idSala/progreso', SalaPrivadaController.obtenerProgreso);

// Obtener historial de salas de un estudiante
router.get('/historial/:idEstudiante', SalaPrivadaController.obtenerHistorial);

// Limpiar salas expiradas (para cron job)
router.post('/limpiar-expiradas', SalaPrivadaController.limpiarExpiradas);

export default router;