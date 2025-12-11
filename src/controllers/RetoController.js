import retoService from "../services/RetoService.js";

class RetoController {
  
  async listarRetosPorArea(req, res) {
    try {
      const { idArea } = req.params;
      
      if (!idArea || isNaN(idArea)) {
        return res.status(400).json({
          success: false,
          message: "ID de área inválido"
        });
      }

      const retos = await retoService.listarRetosPorArea(parseInt(idArea));
      
      res.status(200).json({
        success: true,
        data: retos
      });
    } catch (error) {
      console.error('Error en listarRetosPorArea:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerPreguntasReto(req, res) {
    try {
      const { idReto } = req.params;
      
      if (!idReto || isNaN(idReto)) {
        return res.status(400).json({
          success: false,
          message: "ID de reto inválido"
        });
      }

      const datosReto = await retoService.obtenerPreguntasReto(parseInt(idReto));
      
      res.status(200).json({
        success: true,
        data: datosReto
      });
    } catch (error) {
      console.error('Error en obtenerPreguntasReto:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async guardarRespuesta(req, res) {
    try {
      const { id_estudiante, id_reto, id_opcion } = req.body;
      
      if (!id_estudiante || !id_reto || !id_opcion) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos requeridos: id_estudiante, id_reto, id_opcion"
        });
      }

      const respuesta = await retoService.guardarRespuesta(
        id_estudiante,
        parseInt(id_reto),
        parseInt(id_opcion)
      );
      
      res.status(201).json({
        success: true,
        message: "Respuesta guardada exitosamente",
        data: respuesta
      });
    } catch (error) {
      console.error('Error en guardarRespuesta:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerRespuestasEstudiante(req, res) {
    try {
      const { idEstudiante, idReto } = req.params;
      
      if (!idEstudiante || !idReto) {
        return res.status(400).json({
          success: false,
          message: "Faltan parámetros requeridos"
        });
      }

      const respuestas = await retoService.obtenerRespuestasEstudiante(
        idEstudiante,
        parseInt(idReto)
      );
      
      res.status(200).json({
        success: true,
        data: respuestas
      });
    } catch (error) {
      console.error('Error en obtenerRespuestasEstudiante:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async calcularResultado(req, res) {
    try {
      const { id_estudiante, id_reto, duracion } = req.body;
      
      if (!id_estudiante || !id_reto || !duracion) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos requeridos: id_estudiante, id_reto, duracion"
        });
      }

      const resultado = await retoService.calcularResultado(
        id_estudiante,
        parseInt(id_reto),
        duracion
      );
      
      res.status(201).json({
        success: true,
        message: "Resultado calculado exitosamente",
        data: resultado
      });
    } catch (error) {
      console.error('Error en calcularResultado:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerHistorial(req, res) {
    try {
      const { idEstudiante } = req.params;
      const { id_area } = req.query;
      
      if (!idEstudiante) {
        return res.status(400).json({
          success: false,
          message: "ID de estudiante requerido"
        });
      }

      const historial = await retoService.obtenerHistorialResultados(
        idEstudiante,
        id_area ? parseInt(id_area) : null
      );
      
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

  async crear(req, res) {
        try {
            const { nombre, descripcion, nivel_dificultad, duracion, cantidad_preguntas, id_tema } = req.body;

            // Validaciones básicas
            if (!nombre || !descripcion || !nivel_dificultad || !duracion || !cantidad_preguntas || !id_tema) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                });
            }

            const resultado = await RetoService.crearReto(req.body);

            return res.status(201).json(resultado);

        } catch (error) {
            console.error('Error en crearReto:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new RetoController();
