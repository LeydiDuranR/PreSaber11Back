import Institucion from "../models/Institucion.js";
import { Op } from "sequelize";

export const obtenerInstituciones = async () => {
  return await Institucion.findAll({
    attributes: ["id_institucion", "nombre"],
    order: [["nombre", "ASC"]],
  });
};

export const crearInstitucion = async (data) => {
  try {
    let { nombre, departamento, municipio, direccion, correo, telefono } = data || {};

    // Normalizar y sanitizar
    nombre = nombre?.toString().trim();
    departamento = departamento?.toString().trim();
    municipio = municipio?.toString().trim();
    direccion = direccion?.toString().trim();
    correo = correo?.toString().trim().toLowerCase();
    telefono = telefono?.toString().trim();

    // Validaciones básicas
    if (!nombre || !departamento || !municipio || !direccion || !correo || !telefono) {
      throw new Error("Todos los campos son obligatorios.");
    }

    // Validar longitudes razonables
    if (nombre.length < 3 || nombre.length > 150) throw new Error("El nombre debe tener entre 3 y 150 caracteres.");
    if (departamento.length > 150) throw new Error("Departamento demasiado largo.");
    if (municipio.length > 150) throw new Error("Municipio demasiado largo.");
    if (direccion.length > 150) throw new Error("Dirección demasiado larga.");

    // Validar formato de correo
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(correo)) throw new Error("Correo inválido.");

    // Normalizar teléfono (solo dígitos) y validar longitud
    const telefonoDigits = telefono.replace(/\D/g, "");
    if (telefonoDigits.length < 7 || telefonoDigits.length > 15) throw new Error("Teléfono inválido. Debe contener entre 7 y 15 dígitos.");

    // Verificar conflictos de correo o teléfono (comprobación flexible)
    const existente = await Institucion.findOne({
      where: {
        [Op.or]: [{ correo }, { telefono: telefonoDigits }],
      },
    });

    if (existente) {
      // Comparaciones más seguras/insensibles
      if (existente.correo && existente.correo.toLowerCase() === correo) throw new Error("El correo ya está registrado.");
      const existingPhoneDigits = existente.telefono ? existente.telefono.toString().replace(/\D/g, "") : "";
      if (existingPhoneDigits && existingPhoneDigits === telefonoDigits) throw new Error("El teléfono ya está registrado.");
      throw new Error("Ya existe una institución con esos datos.");
    }

    // Crear con teléfono normalizado y correo en minúsculas
    const nuevaInstitucion = await Institucion.create(
      { nombre, departamento, municipio, direccion, correo, telefono: telefonoDigits },
      {
        fields: [
          "nombre",
          "departamento",
          "municipio",
          "direccion",
          "correo",
          "telefono",
        ],
      }
    );

    return nuevaInstitucion;
  } catch (error) {
    // Manejo más específico para errores de constraint
    if (error && error.name === "SequelizeUniqueConstraintError") {
      throw new Error("Correo o teléfono ya registrado.");
    }
    throw new Error(error.message || "Error al crear institución.");
  }
};
