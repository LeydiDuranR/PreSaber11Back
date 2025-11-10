import Institucion from "../models/Institucion.js";

export const obtenerInstituciones = async () => {
  return await Institucion.findAll({
    attributes: ["id_institucion", "nombre"],
    order: [["nombre", "ASC"]],
  });
};
