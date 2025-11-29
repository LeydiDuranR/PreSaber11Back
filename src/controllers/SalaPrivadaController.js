import SalaPrivadaService from '../services/SalaPrivadaService.js';

class SalaPrivadaController {

  // POST /api/salas/crear
  async crearSala(req, res) {
    try {
      const { 
        id_estudiante, 
        id_area, 
        nivel_dificultad, 
        duracion_minutos, 
        cantidad_preguntas 
      } = req.body;

      if (!id_estudiante || !id_area || !nivel_dificultad) {
        return res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos'
        });
      }

      const sala = await SalaPrivadaService.crearSala(
        id_estudiante,
        id_area,
        nivel_dificultad,
        duracion_minutos || 20,
        cantidad_preguntas || 25
      );

      res.status(201).json({
        success: true,
        message: 'Sala creada exitosamente',
        data: sala
      });
    } catch (error) {
      console.error('Error en crearSala:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/salas/unirse
  async unirseASala(req, res) {
    try {
      const { codigo_sala, id_estudiante } = req.body;

      if (!codigo_sala || !id_estudiante) {
        return res.status(400).json({
          success: false,
          message: 'Código de sala e ID de estudiante son requeridos'
        });
      }

      const sala = await SalaPrivadaService.unirseASala(codigo_sala, id_estudiante);

      res.status(200).json({
        success: true,
        message: 'Te has unido a la sala exitosamente',
        data: sala
      });
    } catch (error) {
      console.error('Error en unirseASala:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/salas/:idSala
  async obtenerSala(req, res) {
    try {
      const { idSala } = req.params;

      const sala = await SalaPrivadaService.obtenerSalaDetalle(parseInt(idSala));

      res.status(200).json({
        success: true,
        data: sala
      });
    } catch (error) {
      console.error('Error en obtenerSala:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/salas/:idSala/preguntas
  async obtenerPreguntas(req, res) {
    try {
      const { idSala } = req.params;

      const preguntas = await SalaPrivadaService.obtenerPreguntasSala(parseInt(idSala));

      res.status(200).json({
        success: true,
        data: preguntas
      });
    } catch (error) {
      console.error('Error en obtenerPreguntas:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/salas/respuesta
  async guardarRespuesta(req, res) {
    try {
      const { id_sala, id_estudiante, id_pregunta, id_opcion, tiempo_respuesta } = req.body;

      if (!id_sala || !id_estudiante || !id_pregunta || !id_opcion) {
        return res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos'
        });
      }

      const resultado = await SalaPrivadaService.guardarRespuestaPvP(
        id_sala,
        id_estudiante,
        id_pregunta,
        id_opcion,
        tiempo_respuesta || 0
      );

      res.status(200).json({
        success: true,
        message: 'Respuesta guardada',
        data: resultado
      });
    } catch (error) {
      console.error('Error en guardarRespuesta:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/salas/finalizar
  async finalizarParticipacion(req, res) {
    try {
      const { id_sala, id_estudiante, duracion_total } = req.body;

      if (!id_sala || !id_estudiante) {
        return res.status(400).json({
          success: false,
          message: 'Faltan parámetros requeridos'
        });
      }

      const resultado = await SalaPrivadaService.finalizarParticipacion(
        id_sala,
        id_estudiante,
        duracion_total || '00:00:00'
      );

      res.status(200).json({
        success: true,
        message: 'Participación finalizada',
        data: resultado
      });
    } catch (error) {
      console.error('Error en finalizarParticipacion:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/salas/:idSala/resultado
  async obtenerResultado(req, res) {
    try {
      const { idSala } = req.params;

      const resultado = await SalaPrivadaService.obtenerResultadoSala(parseInt(idSala));

      res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('Error en obtenerResultado:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/salas/:idSala/progreso
  async obtenerProgreso(req, res) {
    try {
      const { idSala } = req.params;

      const progreso = await SalaPrivadaService.obtenerProgreso(parseInt(idSala));

      res.status(200).json({
        success: true,
        data: progreso
      });
    } catch (error) {
      console.error('Error en obtenerProgreso:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // GET /api/salas/historial/:idEstudiante
  async obtenerHistorial(req, res) {
    try {
      const { idEstudiante } = req.params;

      const historial = await SalaPrivadaService.obtenerHistorialSalas(idEstudiante);

      res.status(200).json({
        success: true,
        data: historial
      });
    } catch (error) {
      console.error('Error en obtenerHistorial:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // POST /api/salas/limpiar-expiradas
  async limpiarExpiradas(req, res) {
    try {
      const resultado = await SalaPrivadaService.limpiarSalasExpiradas();

      res.status(200).json({
        success: true,
        message: 'Salas expiradas limpiadas',
        data: resultado
      });
    } catch (error) {
      console.error('Error en limpiarExpiradas:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new SalaPrivadaController();