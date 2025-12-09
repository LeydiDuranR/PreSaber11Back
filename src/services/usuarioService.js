import Usuario from "../models/Usuario.js";
import Participante from "../models/Participante.js";
import Curso from "../models/Curso.js";
import { createFirebaseUser } from "./firebaseService.js";
import Rol from "../models/Rol.js";
import TipoDocumento from "../models/TipoDocumento.js";
import { Op } from "sequelize";
import { admin } from "../config/firebase.js";


const generarPasswordTemporal = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

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

    // Crear usuario en BD (forzamos los campos para incluir id_tipo_documento)
    const nuevoUsuario = await Usuario.create(
      {
        documento,
        nombre,
        apellido,
        correo,
        telefono,
        fecha_nacimiento,
        id_tipo_documento,
        id_rol: 3, // rol estudiante
        id_institucion,
        uid_firebase,
      },
      {
        transaction,
        fields: [
          "documento",
          "nombre",
          "apellido",
          "correo",
          "telefono",
          "fecha_nacimiento",
          "id_tipo_documento",
          "id_rol",
          "id_institucion",
          "uid_firebase",
        ],
      }
    );

    console.log(nuevoUsuario);

    // Registrar en Participante
    await Participante.create(
      {
        documento_participante: nuevoUsuario.documento,
        grado,
        grupo,
        cohorte,
        id_institucion,
      },
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

export const crearDocenteService = async (data) => {
  const {
    documento,
    nombre,
    apellido,
    correo,
    telefono,
    fecha_nacimiento,
    id_tipo_documento,
    id_institucion,
  } = data;

  const transaction = await Usuario.sequelize.transaction();

  try {
    console.log("📝 Iniciando creación de docente:", data);

    // 1. Verificar que el correo y documento no existan
    const usuarioExistente = await Usuario.findOne({
      where: {
        [Op.or]: [
          { correo },
          { documento, id_tipo_documento }
        ]
      }
    });

    if (usuarioExistente) {
      throw new Error("El correo o documento ya están registrados en el sistema.");
    }

    // 2. Generar contraseña temporal
    const passwordTemporal = generarPasswordTemporal();
    console.log("🔑 Contraseña temporal generada");

    // 3. Crear usuario en Firebase
    const uid_firebase = await createFirebaseUser(
      correo,
      passwordTemporal,
      `${nombre} ${apellido}`
    );
    console.log("✅ Usuario creado en Firebase:", uid_firebase);

    // 4. Crear usuario en BD con rol de docente (id_rol = 2)
    const nuevoDocente = await Usuario.create(
      {
        documento,
        nombre,
        apellido,
        correo,
        telefono,
        fecha_nacimiento,
        id_tipo_documento,
        id_rol: 2, // Rol docente
        id_institucion,
        uid_firebase,
      },
      {
        transaction,
        fields: [
          "documento",
          "nombre",
          "apellido",
          "correo",
          "telefono",
          "fecha_nacimiento",
          "id_tipo_documento",
          "id_rol",
          "id_institucion",
          "uid_firebase",
        ],
      }
    );

    console.log("✅ Docente creado en BD:", nuevoDocente.documento);

    await transaction.commit();
    
    return {
      docente: nuevoDocente,
      mensaje: "Docente creado exitosamente. Se ha enviado un correo para establecer la contraseña."
    };

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error al crear docente:", error);
    throw error;
  }
};

export const editarUsuarioService = async (documento, datos) => {
  const usuario = await Usuario.findByPk(documento);
  if (!usuario) throw new Error("Usuario no encontrado.");
  await usuario.update(datos);
  return usuario;
};

export const verificarUsuarioExistenteService = async (documento, correo, id_tipo_documento) => {
  try {
    const condiciones = [];

    // Si se envía documento + tipo de documento
    if (documento && id_tipo_documento) {
      condiciones.push({ documento, id_tipo_documento });
    }
    // Si solo se envía documento
    else if (documento) {
      condiciones.push({ documento });
    }

    // Si se envía correo
    if (correo) condiciones.push({ correo });

    if (condiciones.length === 0)
      throw new Error("Debe proporcionar un documento, correo o tipo de documento para verificar.");

    const usuario = await Usuario.findOne({
      where: { [Op.or]: condiciones },
      attributes: ["documento", "nombre", "apellido", "correo", "id_tipo_documento"],
      include: [
        {
          model: TipoDocumento,
          attributes: ["id_tipo_documento", "descripcion"], // ✅ CAMBIO AQUÍ
        },
      ],
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

export const obtenerUsuarioPorUidFirebase = async (uid_firebase) => {
  const usuario = await Usuario.findOne({
    where: { uid_firebase }
  });

  if (!usuario) throw new Error("Usuario no encontrado.");

  const participante = await Participante.findOne({
    where: { documento_participante: usuario.documento },
    attributes: ["grado", "grupo", "cohorte", "id_institucion"]
  });

  // Convertir usuario a JSON normal
  const userJSON = usuario.toJSON();

  return {
    ...userJSON,
    grado: participante?.grado || null,
    grupo: participante?.grupo || null,
    cohorte: participante?.cohorte || null,
  };
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
      attributes: ["documento", "nombre", "apellido", "correo", "telefono", "fecha_nacimiento", "uid_firebase"]
    });

    if (!docentes || docentes.length === 0) {
      throw new Error("No se encontraron docentes registrados.");
    }

    const docentesConFoto = await Promise.all(
      docentes.map(async (docente) => {
        let photoURL = null;
        let displayName = null;

        if (docente.uid_firebase) {
          try {
            const userRecord = await admin.auth().getUser(docente.uid_firebase);
            photoURL = userRecord.photoURL || null;
            displayName = userRecord.displayName || null;
          } catch (error) {
            console.error("Error al obtener usuario de Firebase:", error);
            photoURL = null;
          }
        }

        return {
          ...docente.dataValues,
          photoURL,
          displayName
        };
      })
    );

    return docentesConFoto;

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

