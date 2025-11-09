import Usuario from "../models/Usuario.js";
import Participante from "../models/Participante.js";
import Curso from "../models/Curso.js";
import { createFirebaseUser } from "./firebaseService.js";

export const crearUsuarioService = async (data) => {
  const {
    documento,
    nombre,
    apellido,
    correo,
    telefono,
    fecha_nacimiento,
    id_tipo_documento,
    grado,
    grupo,
    cohorte,
    clave_acceso,
    password,
  } = data;

  const transaction = await Usuario.sequelize.transaction();
  try {
    // Verificar curso
    const curso = await Curso.findOne({
      where: { grado, grupo, cohorte, clave_acceso },
    });

    if (!curso) throw new Error("Curso o clave incorrecta.");

    // Crear en Firebase
    const uid_firebase = await createFirebaseUser(
      correo,
      password,
      `${nombre} ${apellido}`
    );

    // Crear usuario en BD
    const nuevoUsuario = await Usuario.create(
      {
        documento,
        nombre,
        apellido,
        correo,
        telefono,
        fecha_nacimiento,
        id_tipo_documento,
        id_rol: 3, // estudiante
        uid_firebase,
      },
      { transaction }
    );

    // Registrar en Participantes
    await Participantes.create(
      { documento_Participantes: documento, grado, grupo, cohorte },
      { transaction }
    );

    await transaction.commit();
    return nuevoUsuario;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const editarUsuarioService = async (documento, datos) => {
  const usuario = await Usuario.findByPk(documento);
  if (!usuario) throw new Error("Usuario no encontrado.");
  await usuario.update(datos);
  return usuario;
};

export const obtenerUsuarioPorIdService = async (documento) => {
  const usuario = await Usuario.findByPk(documento);
  if (!usuario) throw new Error("Usuario no encontrado.");
  return usuario;
};

export const obtenerTodosUsuariosService = async () => {
  return await Usuario.findAll({ include: ["rol", "tipo_documento"] });
};

export const verificarUsuarioPorUidService = async (uid_firebase) => {
  const usuario = await Usuario.findOne({ where: { uid_firebase } });
  return usuario;
};
