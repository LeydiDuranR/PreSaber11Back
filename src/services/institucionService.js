import Institucion from "../models/Institucion.js";
import Usuario from "../models/Usuario.js";
import db from "../db/db.js";
import { Op } from "sequelize";
import { createFirebaseUser } from "./firebaseService.js";

// Función para generar contraseña temporal
const generarPasswordTemporal = () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return password;
};

// Obtener todas las instituciones
export const obtenerInstituciones = async () => {
  return await Institucion.findAll({
    attributes: ["id_institucion", "nombre"],
    order: [["nombre", "ASC"]],
  });
};

// Listar instituciones con información completa
export const listarInstitucionesCompletas = async () => {
  try {
    const instituciones = await Institucion.findAll({
      order: [["nombre", "ASC"]]
    });

    // Para cada institución, buscar su director
    const institucionesConDirector = await Promise.all(
      instituciones.map(async (institucion) => {
        const director = await Usuario.findOne({
          where: {
            id_institucion: institucion.id_institucion,
            id_rol: 4 // Director
          },
          attributes: ['documento', 'nombre', 'apellido', 'correo', 'telefono']
        });

        return {
          id_institucion: institucion.id_institucion,
          nombre: institucion.nombre,
          departamento: institucion.departamento,
          municipio: institucion.municipio,
          direccion: institucion.direccion,
          correo: institucion.correo,
          telefono: institucion.telefono,
          director: director ? {
            documento: director.documento,
            nombre_completo: `${director.nombre} ${director.apellido}`,
            correo: director.correo,
            telefono: director.telefono
          } : null
        };
      })
    );

    return institucionesConDirector;
  } catch (error) {
    throw new Error(`Error al listar instituciones: ${error.message}`);
  }
};

// Crear institución con su director
export const crearInstitucion = async (data) => {
  const transaction = await db.transaction();

  try {
    // ========== DATOS DE LA INSTITUCIÓN ==========
    let { 
      nombre, 
      departamento, 
      municipio, 
      direccion, 
      correo, 
      telefono,
      // Datos del director
      director_documento,
      director_nombre,
      director_apellido,
      director_correo,
      director_telefono,
      director_fecha_nacimiento,
      director_id_tipo_documento
    } = data || {};

    // ========== VALIDACIONES DE INSTITUCIÓN ==========
    nombre = nombre?.toString().trim();
    departamento = departamento?.toString().trim();
    municipio = municipio?.toString().trim();
    direccion = direccion?.toString().trim();
    correo = correo?.toString().trim().toLowerCase();
    telefono = telefono?.toString().trim();

    if (!nombre || !departamento || !municipio || !direccion || !correo || !telefono) {
      throw new Error("Todos los campos de la institución son obligatorios.");
    }

    if (nombre.length < 3 || nombre.length > 150) {
      throw new Error("El nombre debe tener entre 3 y 150 caracteres.");
    }
    if (departamento.length > 150) throw new Error("Departamento demasiado largo.");
    if (municipio.length > 150) throw new Error("Municipio demasiado largo.");
    if (direccion.length > 150) throw new Error("Dirección demasiado larga.");

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(correo)) throw new Error("Correo de institución inválido.");

    const telefonoDigits = telefono.replace(/\D/g, "");
    if (telefonoDigits.length < 7 || telefonoDigits.length > 15) {
      throw new Error("Teléfono de institución inválido. Debe contener entre 7 y 15 dígitos.");
    }

    // Verificar conflictos de institución
    const institucionExistente = await Institucion.findOne({
      where: {
        [Op.or]: [{ correo }, { telefono: telefonoDigits }],
      },
      transaction
    });

    if (institucionExistente) {
      if (institucionExistente.correo && institucionExistente.correo.toLowerCase() === correo) {
        throw new Error("El correo de la institución ya está registrado.");
      }
      const existingPhoneDigits = institucionExistente.telefono ? 
        institucionExistente.telefono.toString().replace(/\D/g, "") : "";
      if (existingPhoneDigits && existingPhoneDigits === telefonoDigits) {
        throw new Error("El teléfono de la institución ya está registrado.");
      }
      throw new Error("Ya existe una institución con esos datos.");
    }

    // ========== VALIDACIONES DEL DIRECTOR ==========
    if (!director_documento || !director_nombre || !director_apellido || 
        !director_correo || !director_telefono || !director_fecha_nacimiento || 
        !director_id_tipo_documento) {
      throw new Error("Todos los campos del director son obligatorios.");
    }

    director_correo = director_correo.toString().trim().toLowerCase();
    if (!emailRegex.test(director_correo)) {
      throw new Error("Correo del director inválido.");
    }

    // Verificar que el director no exista
    const directorExistente = await Usuario.findOne({
      where: {
        [Op.or]: [
          { correo: director_correo },
          { documento: director_documento }
        ]
      },
      transaction
    });

    if (directorExistente) {
      throw new Error("El correo o documento del director ya están registrados.");
    }

    console.log("📝 Creando institución y director...");

    // ========== CREAR INSTITUCIÓN ==========
    const nuevaInstitucion = await Institucion.create(
      { 
        nombre, 
        departamento, 
        municipio, 
        direccion, 
        correo, 
        telefono: telefonoDigits 
      },
      {
        transaction,
        fields: ["nombre", "departamento", "municipio", "direccion", "correo", "telefono"]
      }
    );

    console.log("✅ Institución creada:", nuevaInstitucion.id_institucion);

    // ========== CREAR DIRECTOR ==========
    // Generar contraseña temporal
    const passwordTemporal = generarPasswordTemporal();
    console.log("🔑 Contraseña temporal generada para el director");

    // Crear usuario en Firebase
    const uid_firebase = await createFirebaseUser(
      director_correo,
      passwordTemporal,
      `${director_nombre} ${director_apellido}`
    );
    console.log("✅ Director creado en Firebase:", uid_firebase);

    // Crear director en BD
    const nuevoDirector = await Usuario.create(
      {
        documento: director_documento,
        nombre: director_nombre,
        apellido: director_apellido,
        correo: director_correo,
        telefono: director_telefono,
        fecha_nacimiento: director_fecha_nacimiento,
        id_tipo_documento: director_id_tipo_documento,
        id_rol: 4, // Rol Director
        id_institucion: nuevaInstitucion.id_institucion,
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

    console.log("✅ Director creado en BD:", nuevoDirector.documento);

    await transaction.commit();

    return {
      institucion: nuevaInstitucion,
      director: nuevoDirector,
      mensaje: "Institución y director creados exitosamente. Se ha enviado un correo al director para establecer su contraseña."
    };

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error al crear institución:", error);
    
    if (error && error.name === "SequelizeUniqueConstraintError") {
      throw new Error("Correo o teléfono ya registrado.");
    }
    throw new Error(error.message || "Error al crear institución.");
  }
};