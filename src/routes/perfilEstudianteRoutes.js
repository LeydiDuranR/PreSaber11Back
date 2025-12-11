import express from 'express';
import PerfilEstudianteController from '../controllers/PerfilEstudianteController.js';

const router = express.Router();

/**
 * @route   GET /api/estudiantes/:documento/perfil
 * @desc    Obtener perfil completo del estudiante
 * @access  Private (agregar middleware de autenticación si es necesario)
 * @params  documento - Documento del estudiante
 * @returns {
 *   estudiante: { documento, nombre, apellido, nombre_completo, photoURL, institucion },
 *   resumen: { racha_victorias, experiencia_total, modulos_resueltos, ultimo_puntaje_simulacro },
 *   areas: [{ id_area, nombre, correctas, incorrectas, total, porcentaje }],
 *   historial: [{ tipo, estado, titulo, correctas, total, fecha, avatares }]
 * }
 */
router.get('/:documento/perfil', PerfilEstudianteController.obtenerPerfil);

/**
 * @route   GET /api/estudiantes/:documento/racha
 * @desc    Obtener racha de victorias (días consecutivos con actividad)
 * @access  Private (agregar middleware de autenticación si es necesario)
 * @params  documento - Documento del estudiante
 * @returns { racha_victorias: number }
 */
router.get('/:documento/racha', PerfilEstudianteController.obtenerRacha);

export default router;