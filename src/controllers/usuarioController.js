import Usuario from "../models/Usuario.js";
import {
  crearUsuarioService,
  editarUsuarioService,
  obtenerUsuarioPorIdService,
  obtenerTodosUsuariosService,
  verificarUsuarioPorUidService,
  obtenerDocentesPorInstitucion,
  buscarDocentePorNombre,
  verificarUsuarioExistenteService,
  obtenerUsuarioPorUidFirebase,
  crearDocenteService,
  obtenerCursosDeDocenteService,
  crearAdministradorService,
  listarAdministradoresService,
  obtenerAdministradorService
} from "../services/usuarioService.js";

export const crearUsuario = async (req, res) => {
  try {
    const nuevoUsuario = await crearUsuarioService(req.body);
    res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: nuevoUsuario,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearDocente = async (req, res) => {
  try {
    const resultado = await crearDocenteService(req.body);
    res.status(201).json({
      success: true,
      data: resultado.docente,
      mensaje: resultado.mensaje
    });
  } catch (error) {
    console.error("Error en crearDocente:", error);
    res.status(400).json({
      success: false,
      mensaje: error.message || "Error al crear docente"
    });
  }
};

export const editarUsuario = async (req, res) => {
  try {
    const { documento } = req.params;
    const usuario = await editarUsuarioService(documento, req.body);
    res.status(200).json({ mensaje: "Usuario actualizado", usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verificarUsuarioExistente = async (req, res) => {
  try {
    const { documento, correo, id_tipo_documento } = req.body;

    if (!documento && !correo) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar documento o correo para verificar." });
    }

    const usuario = await verificarUsuarioExistenteService(documento, correo, id_tipo_documento);

    if (!usuario) {
      return res.status(200).json({
        existe: false,
        mensaje: "No existe un usuario con los datos proporcionados.",
      });
    }

    res.status(200).json({
      existe: true,
      mensaje: "El usuario ya se encuentra registrado.",
      usuario,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verificarCorreoExiste = async (req, res) => {
  try {
    const { correo } = req.body;
    
    if (!correo) {
      return res.status(400).json({
        success: false,
        existe: false,
        mensaje: "El correo es requerido"
      });
    }

    const usuario = await Usuario.findOne({ where: { correo } });
    
    res.status(200).json({
      success: true,
      existe: !!usuario,
      mensaje: usuario 
        ? "Correo registrado" 
        : "No existe una cuenta con este correo electrónico"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      existe: false,
      mensaje: error.message
    });
  }
};

export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { documento } = req.params;
    const usuario = await obtenerUsuarioPorIdService(documento);
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerUsuarioPorUid = async (req, res) => {
  try {
    const { uid_firebase } = req.params;
    const usuario = await obtenerUsuarioPorUidFirebase(uid_firebase);
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodosUsuarios = async (req, res) => {
  try {
    const usuarios = await obtenerTodosUsuariosService();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerCursosDocente = async (req, res) => {
  try {
    const { documento } = req.params;

    const cursos = await obtenerCursosDeDocenteService(documento);

    return res.status(200).json({
      success: true,
      data: cursos
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

export const verificarUsuarioPorUid = async (req, res) => {
  try {
    const { uid_firebase } = req.params;
    const usuario = await verificarUsuarioPorUidService(uid_firebase);

    if (!usuario)
      return res
        .status(200)
        .json({ registrado: false, mensaje: "Usuario no registrado" });

    res.status(200).json({ registrado: true, usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerDocentesInstitucion = async (req, res) => {
  try {
    const { id_institucion } = req.params;

    if (!id_institucion) {
      return res.status(400).json({ error: "Debe proporcionar el id_institucion." });
    }

    const docentes = await obtenerDocentesPorInstitucion(id_institucion);
    res.status(200).json(docentes);

  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const obtenerDocentesPorNombreYApellido = async (req, res) => {
  try {
    const { id_institucion } = req.params;
    const { nombre } = req.query;

    if (!id_institucion || !nombre) {
      return res.status(400).json({ error: "Debe proporcionar el id_institucion y el nombre de búsqueda." });
    }

    const docentes = await buscarDocentePorNombre(nombre, id_institucion);
    res.status(200).json(docentes);

  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// POST /api/usuarios/administrador
export const crearAdministrador = async (req, res) => {
  try {
    const resultado = await crearAdministradorService(req.body);
    res.status(201).json({
      success: true,
      data: resultado.administrador,
      mensaje: resultado.mensaje
    });
  } catch (error) {
    console.error("Error en crearAdministrador:", error);
    res.status(400).json({
      success: false,
      mensaje: error.message || "Error al crear administrador"
    });
  }
};

// GET /api/usuarios/administradores
export const listarAdministradores = async (req, res) => {
  try {
    const administradores = await listarAdministradoresService();
    res.status(200).json({
      success: true,
      data: administradores
    });
  } catch (error) {
    console.error("Error en listarAdministradores:", error);
    res.status(500).json({
      success: false,
      mensaje: error.message || "Error al listar administradores"
    });
  }
};

// GET /api/usuarios/administrador/:documento
export const obtenerAdministrador = async (req, res) => {
  try {
    const { documento } = req.params;
    const administrador = await obtenerAdministradorService(documento);
    res.status(200).json({
      success: true,
      data: administrador
    });
  } catch (error) {
    console.error("Error en obtenerAdministrador:", error);
    res.status(404).json({
      success: false,
      mensaje: error.message || "Error al obtener administrador"
    });
  }
};