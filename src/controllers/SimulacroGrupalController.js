import SimulacroGrupalService from '../services/SimulacroGrupalService.js';

class SimulacroGrupalController {

  // POST /api/simulacro-grupal/crear
  async crearSimulacro(req, res) {
    try {
      const {
        id_docente,
        grado,
        grupo,
        cohorte,
        id_institucion,
        cantidad_preguntas,
        duracion_minutos
      } = req.body;

      // Validaciones de campos requeridos
      if (!id_docente || !grado || !grupo || !cohorte || !id_institucion || !cantidad_preguntas || !duracion_minutos) {
        return res.status(400).json({
          success: false,
          error: 'Faltan datos requeridos'
        });
      }

      // Llamar al servicio
      const simulacro = await SimulacroGrupalService.crearSimulacro(
        id_docente,
        grado,
        grupo,
        cohorte,
        id_institucion,
        cantidad_preguntas,
        duracion_minutos
      );

      return res.status(201).json({
        success: true,
        message: 'Simulacro creado exitosamente',
        data: simulacro
      });

    } catch (error) {
      console.error('Error al crear simulacro:', error.message);

      // ⚠️ ERRORES CONTROLADOS DEL SERVICIO
      if (
        error.message.includes('No hay preguntas suficientes') ||
        error.message.includes('cantidad mínima') ||
        error.message.includes('duración mínima') ||
        error.message.includes('docente') ||
        error.message.includes('curso')
      ) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // ⚠️ ERROR INTERNO — no controlado
      return res.status(500).json({
        success: false,
        error: 'Error del servidor: ' + error.message
      });
    }
  }

  // POST /api/simulacro-grupal/:id/unirse
  async unirseASimulacro(req, res) {
    try {
      const { id } = req.params;
      const { id_estudiante } = req.body;

      if (!id_estudiante) {
        return res.status(400).json({
          success: false,
          error: 'Falta el ID del estudiante'
        });
      }

      const simulacro = await SimulacroGrupalService.unirseASimulacro(
        parseInt(id),
        id_estudiante
      );

      return res.status(200).json({
        success: true,
        message: 'Unido al simulacro exitosamente',
        data: simulacro
      });

    } catch (error) {
      console.error('Error al unirse al simulacro:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/simulacro-grupal/:id/iniciar
  async iniciarSimulacro(req, res) {
    try {
      const { id } = req.params;
      const { id_docente } = req.body;

      if (!id_docente) {
        return res.status(400).json({
          success: false,
          error: 'Falta el ID del docente'
        });
      }

      const simulacro = await SimulacroGrupalService.iniciarSimulacro(
        parseInt(id),
        id_docente
      );

      return res.status(200).json({
        success: true,
        message: 'Simulacro iniciado exitosamente',
        data: simulacro
      });

    } catch (error) {
      console.error('Error al iniciar simulacro:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/simulacro-grupal/:id
  async obtenerSimulacroDetalle(req, res) {
    try {
      const { id } = req.params;

      const simulacro = await SimulacroGrupalService.obtenerSimulacroDetalle(parseInt(id));

      return res.status(200).json({
        success: true,
        data: simulacro
      });

    } catch (error) {
      console.error('Error al obtener simulacro:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/simulacro-grupal/:id/preguntas
  async obtenerPreguntasSimulacro(req, res) {
    try {
      const { id } = req.params;

      const preguntas = await SimulacroGrupalService.obtenerPreguntasSimulacro(parseInt(id));

      return res.status(200).json({
        success: true,
        data: preguntas
      });

    } catch (error) {
      console.error('Error al obtener preguntas:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/simulacro-grupal/:id/respuesta
  async guardarRespuesta(req, res) {
    try {
      const { id } = req.params;
      const { id_estudiante, id_pregunta, id_opcion, tiempo_respuesta } = req.body;

      if (!id_estudiante || !id_pregunta || !id_opcion || tiempo_respuesta === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Faltan datos requeridos'
        });
      }

      const resultado = await SimulacroGrupalService.guardarRespuestaSimulacro(
        parseInt(id),
        id_estudiante,
        id_pregunta,
        id_opcion,
        tiempo_respuesta
      );

      return res.status(200).json({
        success: true,
        message: 'Respuesta guardada',
        data: resultado
      });

    } catch (error) {
      console.error('Error al guardar respuesta:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/simulacro-grupal/:id/finalizar-participacion
  async finalizarParticipacion(req, res) {
    try {
      const { id } = req.params;
      const { id_estudiante } = req.body;

      if (!id_estudiante) {
        return res.status(400).json({
          success: false,
          error: 'Falta el ID del estudiante'
        });
      }

      const resultado = await SimulacroGrupalService.finalizarParticipacion(
        parseInt(id),
        id_estudiante
      );

      return res.status(200).json({
        success: true,
        message: 'Participación finalizada',
        data: resultado
      });

    } catch (error) {
      console.error('Error al finalizar participación:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // POST /api/simulacro-grupal/:id/finalizar
  async finalizarSimulacro(req, res) {
    try {
      const { id } = req.params;
      const { id_docente } = req.body;

      if (!id_docente) {
        return res.status(400).json({
          success: false,
          error: 'Falta el ID del docente'
        });
      }

      const resultado = await SimulacroGrupalService.finalizarSimulacro(
        parseInt(id),
        id_docente
      );

      return res.status(200).json({
        success: true,
        message: 'Simulacro finalizado',
        data: resultado
      });

    } catch (error) {
      console.error('Error al finalizar simulacro:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/simulacro-grupal/:id/resultado
  async obtenerResultado(req, res) {
    try {
      const { id } = req.params;

      const resultado = await SimulacroGrupalService.obtenerResultadoSimulacro(parseInt(id));

      return res.status(200).json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('Error al obtener resultado:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/simulacro-grupal/:id/progreso
  async obtenerProgreso(req, res) {
    try {
      const { id } = req.params;

      const progreso = await SimulacroGrupalService.obtenerProgreso(parseInt(id));

      return res.status(200).json({
        success: true,
        data: progreso
      });

    } catch (error) {
      console.error('Error al obtener progreso:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/simulacro-grupal/curso/:grado/:grupo/:cohorte/:id_institucion
  async obtenerSimulacrosCurso(req, res) {
    try {
      const { grado, grupo, cohorte, id_institucion } = req.params;

      const simulacros = await SimulacroGrupalService.obtenerSimulacrosCurso(
        grado,
        grupo,
        parseInt(cohorte),
        parseInt(id_institucion)
      );

      return res.status(200).json({
        success: true,
        data: simulacros
      });

    } catch (error) {
      console.error('Error al obtener simulacros del curso:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // GET /api/simulacro-grupal/historial/:id_estudiante
  async obtenerHistorialEstudiante(req, res) {
    try {
      const { id_estudiante } = req.params;

      const historial = await SimulacroGrupalService.obtenerHistorialEstudiante(id_estudiante);

      return res.status(200).json({
        success: true,
        data: historial
      });

    } catch (error) {
      console.error('Error al obtener historial:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new SimulacroGrupalController();