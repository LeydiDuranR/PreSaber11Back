import Tema from "../models/Tema.js";
import Area from "../models/Area.js";

async function obtenerTemasPorArea(id_area) {
  try {
    if(!id_area) {
      throw new Error("Debe seleccionar primero el área.");
    }
    // Validar existencia del área
    const area = await Area.findByPk(id_area);
    if (!area) {
      throw new Error("Área no encontrada.");
    }

    // Obtener los temas asociados
    const temas = await Tema.findAll({
      where: { id_area },
      attributes: ["id_tema", "descripcion"],
      order: [["descripcion", "ASC"]],
    });

    if (!temas || temas.length === 0) {
      throw new Error("No se encontraron temas para esta área.");
    }

    return temas;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function crearTema(descripcion, id_area) {
  try {
    if (!descripcion || !id_area) {
      throw new Error("El area y el nombre del tema son obligatorios.");
    }

    // Verificar si el área existe
    const area = await Area.findByPk(id_area);
    if (!area) {
      throw new Error("Área no encontrada.");
    }

    // Crear el nuevo tema
    const nuevoTema = await Tema.create({
      descripcion,
      id_area,
    });

    return nuevoTema;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function listarTemasPorAreaConConteo(idArea) {
        try {
            const temas = await Tema.findAll({
                where: { id_area: idArea },
                attributes: [
                    'id_tema', 
                    'descripcion',
                    // Subconsulta para contar preguntas por tema
                    [db.literal(`(SELECT COUNT(*) FROM pregunta WHERE pregunta.id_tema = tema.id_tema)`), 'total_preguntas']
                ],
                raw: true
            });
            return temas;
        } catch (error) {
            throw new Error(`Error al listar temas: ${error.message}`);
        }
}

export default {
  obtenerTemasPorArea,
  listarTemasPorAreaConConteo,
  crearTema,
};
