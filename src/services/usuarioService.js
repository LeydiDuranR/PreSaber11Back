import Usuario from "../models/Usuario.js";
import Participante from "../models/Participante.js";
import Curso from "../models/Curso.js";
import { createFirebaseUser } from "./firebaseService.js";
import Rol from "../models/Rol.js";
import TipoDocumento from "../models/TipoDocumento.js";
import { Op } from "sequelize";

export const crearUsuarioService = async (data) => {
  const {
    documento,
    nombre,
    apellido,
    correo,
    telefono,
    fecha_nacimiento,
    id_tipo_documento,
    id_institucion,
    grado,
    grupo,
    cohorte,
    password,
  } = data;

  const transaction = await Usuario.sequelize.transaction();
  try {

    console.log(data);
    // Verificar curso
    const curso = await Curso.findOne({
      where: { grado, grupo, cohorte, id_institucion },
    });

    if (!curso) throw new Error("Curso o clave incorrecta.");

    console.log(curso);
    // Crear en Firebase
    const uid_firebase = await createFirebaseUser(
      correo,
      password,
      `${nombre} ${apellido}`
    );

    console.log(uid_firebase);

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
        id_rol: 3, 
        id_institucion,
        uid_firebase,
      },
      { transaction }
    );

    console.log(nuevoUsuario);

    // Registrar en Participante
    await Participante.create(
      { documento_participante: nuevoUsuario.documento, grado, grupo, cohorte },
      { transaction }
    );

    console.log("Participante registrado");

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

export const verificarUsuarioExistenteService = async (documento, correo) => {
  try {
    const condiciones = [];

    if (documento) condiciones.push({ documento });
    if (correo) condiciones.push({ correo });

    if (condiciones.length === 0)
      throw new Error("Debe proporcionar un documento o correo para verificar.");

    const usuario = await Usuario.findOne({
      where: { [Op.or]: condiciones },
      attributes: ["documento", "nombre", "apellido", "correo"],
    });

    return usuario;
  } catch (error) {
    throw new Error(error.message);
  }
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


/** Obtener todos los docentes (id_rol = 2) **/
export const obtenerDocentesPorInstitucion = async (id_institucion) => {
  try {
    const docentes = await Usuario.findAll({
      where: { id_institucion: id_institucion, id_rol: 2 },
      include: [
        { model: Rol, attributes: ["id_rol", "descripcion"] },
        { model: TipoDocumento, attributes: ["id_tipo_documento", "descripcion"] }
      ],
      attributes: ["documento", "nombre", "apellido", "correo", "telefono", "fecha_nacimiento"]
    });

    if (!docentes || docentes.length === 0) {
      throw new Error("No se encontraron docentes registrados.");
    }

    return docentes;
  } catch (error) {
    throw new Error(error.message);
  }
}

/** 🔍 Buscar docentes por nombre o apellido **/
export const buscarDocentePorNombre = async (nombreBusqueda, id_institucion) => {
  try {
    const palabras = nombreBusqueda.trim().split(/\s+/); // separa por espacios
    let condiciones = [];

    if (palabras.length === 1) {
      // Buscar por nombre O apellido si solo hay una palabra
      condiciones = [
        { nombre: { [Op.like]: `%${palabras[0]}%` } },
        { apellido: { [Op.like]: `%${palabras[0]}%` } }
      ];
    } else {
      // Buscar combinando nombre y apellido
      condiciones = [
        {
          [Op.and]: [
            { nombre: { [Op.like]: `%${palabras[0]}%` } },
            { apellido: { [Op.like]: `%${palabras[1]}%` } }
          ]
        },
        {
          [Op.and]: [
            { nombre: { [Op.like]: `%${palabras[1]}%` } },
            { apellido: { [Op.like]: `%${palabras[0]}%` } }
          ]
        }
      ];
    }

    const docentes = await Usuario.findAll({
      where: {
        id_rol: 2,
        id_institucion: id_institucion,
        [Op.or]: condiciones
      },
      include: [
        { model: Rol, attributes: ["id_rol", "descripcion"] },
        { model: TipoDocumento, attributes: ["id_tipo_documento", "descripcion"] }
      ],
      attributes: ["documento", "nombre", "apellido", "correo", "telefono", "fecha_nacimiento"]
    });

    if (!docentes || docentes.length === 0) {
      throw new Error("No se encontraron docentes con ese nombre o apellido.");
    }

    return docentes;
  } catch (error) {
    throw new Error(error.message);
  }
}

