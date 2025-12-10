import PerfilEstudianteService from '../services/PerfilEstudianteService.js';

class PerfilEstudianteController {

  // GET /api/estudiantes/:documento/perfil
  async obtenerPerfil(req, res) {
    try {
      const { documento } = req.params;

      if (!documento) {
        return res.status(400).json({
          success: false,
          message: 'El documento del estudiante es requerido'
        });
      }

      const perfil = await PerfilEstudianteService.obtenerPerfilCompleto(documento);

      return res.status(200).json({
        success: true,
        data: perfil
      });

    } catch (error) {
      console.error('Error en obtenerPerfil:', error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error al obtener el perfil del estudiante',
        error: error.message
      });
    }
  }

  // GET /api/estudiantes/:documento/racha
  async obtenerRacha(req, res) {
    try {
      const { documento } = req.params;

      if (!documento) {
        return res.status(400).json({
          success: false,
          message: 'El documento del estudiante es requerido'
        });
      }

      const racha = await PerfilEstudianteService.obtenerRachaVictorias(documento);

      return res.status(200).json({
        success: true,
        data: {
          racha_victorias: racha
        }
      });

    } catch (error) {
      console.error('Error en obtenerRacha:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la racha de victorias',
        error: error.message
      });
    }
  }
}

export default new PerfilEstudianteController();