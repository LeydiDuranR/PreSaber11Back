import Curso from "../models/Curso.js";
import Institucion from "../models/Institucion.js";
import Participante from "../models/Participante.js";

export const verificarCurso = async (grado, grupo, cohorte, clave_acceso) => {
  const curso = await Curso.findOne({
    where: { grado, grupo, cohorte, clave_acceso },
  });
  return !!curso; // true si existe, false si no
};

export const obtenerCursos = async () => {
  return await Curso.findAll();
};


export const listarCursosPorInstitucion = async (id_institucion) => {
  try {
    const cursos = await Curso.findAll({
      where: { id_institucion },
      include: [
        {
          model: Institucion,
          attributes: ["id_institucion", "nombre"]
        }
      ],
      attributes: ["grado", "grupo", "cohorte", "clave_acceso", "habilitado"]
    });

    if (!cursos || cursos.length === 0) {
      throw new Error("No se encontraron cursos registrados para esta institución.");
    }

    return cursos;
  } catch (error) {
    throw new Error(error.message);
  }
};

/** 🏫 Crear un nuevo curso **/
export const crearCurso = async (grado, grupo, cohorte, clave_acceso, id_institucion, id_docente) => {
  try {
    if (!grado || !grupo || !cohorte || !clave_acceso || !id_institucion) {
      throw new Error("Todos los campos son obligatorios.");
    }

    const cursoExistente = await Curso.findOne({
      where: { grado, grupo, cohorte, id_institucion }
    });

    if (cursoExistente) {
      throw new Error("Ya existe un curso con ese grado, grupo y cohorte en esta institución.");
    }

    const nuevoCurso = await Curso.create({
      grado,
      grupo,
      cohorte,
      clave_acceso,
      id_institucion,
      habilitado: true
    });

    // Asociar docente solo si se proporciona
    let docenteAsignado = null;
    if (id_docente) {
      const docente = await Usuario.findByPk(id_docente);
      if (!docente) {
        throw new Error("Docente no encontrado.");
      }

      await Participante.create({
        documento_participante: docente.documento,
        grado,
        grupo,
        cohorte,
        id_institucion
      });

      docenteAsignado = docente;
    }

    return { curso: nuevoCurso, docente: docenteAsignado };
  } catch (error) {
    throw new Error(error.message);
  }
};