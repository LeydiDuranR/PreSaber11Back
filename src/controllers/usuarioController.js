import {
  crearUsuarioService,
  editarUsuarioService,
  obtenerUsuarioPorIdService,
  obtenerTodosUsuariosService,
  verificarUsuarioPorUidService,
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
