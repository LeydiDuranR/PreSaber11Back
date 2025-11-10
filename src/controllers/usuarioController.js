import {
  crearUsuarioService,
  editarUsuarioService,
  obtenerUsuarioPorIdService,
  obtenerTodosUsuariosService,
  verificarUsuarioPorUidService,
  obtenerDocentesPorInstitucion,
  buscarDocentePorNombre,
  verificarUsuarioExistenteService
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
    const { documento, correo } = req.query;

    if (!documento && !correo) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar documento o correo para verificar." });
    }

    const usuario = await verificarUsuarioExistenteService(documento, correo);

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

export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { documento } = req.params;
    const usuario = await obtenerUsuarioPorIdService(documento);
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