import express from 'express';
import SimulacroGrupalController from '../controllers/SimulacroGrupalController.js';

const router = express.Router();

// Crear simulacro (Docente)
router.post('/crear', SimulacroGrupalController.crearSimulacro);

// Unirse a simulacro (Estudiante)
router.post('/:id/unirse', SimulacroGrupalController.unirseASimulacro);

// Iniciar simulacro (Docente)
router.post('/:id/iniciar', SimulacroGrupalController.iniciarSimulacro);

// Obtener detalle del simulacro
router.get('/:id', SimulacroGrupalController.obtenerSimulacroDetalle);

// Obtener preguntas del simulacro
router.get('/:id/preguntas', SimulacroGrupalController.obtenerPreguntasSimulacro);

// Guardar respuesta
router.post('/:id/respuesta', SimulacroGrupalController.guardarRespuesta);

// Finalizar participación de un estudiante
router.post('/:id/finalizar-participacion', SimulacroGrupalController.finalizarParticipacion);

// Finalizar simulacro completo (Docente)
router.post('/:id/finalizar', SimulacroGrupalController.finalizarSimulacro);

// Obtener resultado final y podio
router.get('/:id/resultado', SimulacroGrupalController.obtenerResultado);

// Obtener progreso en tiempo real
router.get('/:id/progreso', SimulacroGrupalController.obtenerProgreso);

// Obtener simulacros de un curso
router.get('/curso/:grado/:grupo/:cohorte/:id_institucion', SimulacroGrupalController.obtenerSimulacrosCurso);

// Obtener historial de un estudiante
router.get('/historial/:id_estudiante', SimulacroGrupalController.obtenerHistorialEstudiante);

export default router;