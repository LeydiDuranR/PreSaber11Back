import {
  obtenerInstituciones,
  listarInstitucionesCompletas,
  crearInstitucion
} from "../services/institucionService.js";
import {
  obtenerDepartamentos,
  obtenerMunicipios
} from "../services/colombiaApiService.js";

// GET /api/instituciones (lista simple)
export const listarInstituciones = async (req, res) => {
  try {
    const instituciones = await obtenerInstituciones();
    res.status(200).json({
      success: true,
      data: instituciones
    });
  } catch (error) {
    console.error("Error al listar instituciones:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/instituciones/completas (con información completa)
export const listarInstitucionesCompletasController = async (req, res) => {
  try {
    const instituciones = await listarInstitucionesCompletas();
    res.status(200).json({
      success: true,
      data: instituciones
    });
  } catch (error) {
    console.error("Error al listar instituciones completas:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/instituciones
export const crearInstitucionController = async (req, res) => {
  try {
    const resultado = await crearInstitucion(req.body);
    
    res.status(201).json({
      success: true,
      data: {
        institucion: resultado.institucion,
        director: {
          documento: resultado.director.documento,
          nombre: resultado.director.nombre,
          apellido: resultado.director.apellido,
          correo: resultado.director.correo
        }
      },
      mensaje: resultado.mensaje
    });
  } catch (error) {
    console.error("Error al crear institución:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/instituciones/departamentos
export const listarDepartamentos = async (req, res) => {
  try {
    const departamentos = await obtenerDepartamentos();
    res.status(200).json({
      success: true,
      data: departamentos
    });
  } catch (error) {
    console.error("Error al obtener departamentos:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/instituciones/departamentos/:id/municipios
export const listarMunicipios = async (req, res) => {
  try {
    const { id } = req.params;
    const municipios = await obtenerMunicipios(id);
    
    res.status(200).json({
      success: true,
      data: municipios
    });
  } catch (error) {
    console.error("Error al obtener municipios:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};