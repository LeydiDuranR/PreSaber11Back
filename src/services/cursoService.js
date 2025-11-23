import Curso from "../models/Curso.js";
import Institucion from "../models/Institucion.js";
import Participante from "../models/Participante.js";
import Usuario from "../models/Usuario.js";
import Rol from "../models/Rol.js";

export const verificarCurso = async (grado, grupo, cohorte, id_institucion, clave_acceso) => {
  const curso = await Curso.findOne({
    where: { grado, grupo, cohorte, id_institucion, clave_acceso },
  });
  return !!curso; // true si existe, false si no
};

export const obtenerCursos = async () => {
  return await Curso.findAll();
};

export const obtenerCursosPorInstitucion = async (id_institucion) => {
  const cursos = await Curso.findAll({
    where: { id_institucion, habilitado: true },
    attributes: ["grado", "grupo", "cohorte"],
  });

  // construir nombre dinámico (ej: "10A", "11B")
  return cursos.map((curso) => ({
    id: `${curso.grado}${curso.grupo}${curso.cohorte}`,
    nombre: `${curso.grado}${curso.grupo}`,
  }));
};

export const listarCursosPorInstituciones = async (id_institucion) => {
  try {
    const cursos = await Curso.findAll({
      where: { id_institucion },
      include: [
        {
          model: Institucion,
          attributes: ["id_institucion", "nombre"]
        },
      ],
      attributes: ["grado", "grupo", "cohorte", "clave_acceso", "habilitado"]
    });

    if (!cursos || cursos.length === 0) {
      throw new Error("No se encontraron cursos registrados para esta institución.");
    }
    const cursosFormateados = await Promise.all(
      cursos.map(async (curso) => {
        // Buscar participantes de este curso específico
        const participantes = await Participante.findAll({
          where: {
            grado: curso.grado,
            grupo: curso.grupo,
            cohorte: curso.cohorte,
            id_institucion: curso.institucion.id_institucion
          },
          attributes: ["documento_participante"]
        });

        const documentos = participantes.map(p => p.documento_participante);

        // Buscar docente (rol 2) entre los participantes
        const docente = await Usuario.findOne({
          where: {
            documento: documentos,
            id_rol: 2
          },
          attributes: ["documento", "nombre", "apellido", "correo"],
          include: [
            {
              model: Rol,
              attributes: ["id_rol", "descripcion"]
            }
          ]
        });

        // Contar estudiantes (rol 3) entre los participantes
        const cantidadEstudiantes = await Usuario.count({
          where: {
            documento: documentos,
            id_rol: 3
          }
        });

        return {
          grado: curso.grado,
          grupo: curso.grupo,
          cohorte: curso.cohorte,
          clave_acceso: curso.clave_acceso,
          habilitado: curso.habilitado,
          institucion: curso.institucion,
          cantidad_estudiantes: cantidadEstudiantes,
          docente: docente ? {
            documento: docente.documento,
            nombre: docente.nombre,
            apellido: docente.apellido,
            nombre_completo: `${docente.nombre} ${docente.apellido}`,
            correo: docente.correo
          } : null
        };
      })
    );

    return cursosFormateados;
  } catch (error) {
    throw new Error(error.message);
  }
};

/** Crear un nuevo curso **/
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


export const actualizarEstadoCurso = async ({ grado, grupo, cohorte, id_institucion, habilitado }) => {
  try {
    const curso = await Curso.findOne({
      where: { grado, grupo, cohorte, id_institucion }
    });

    if (!curso) {
      throw new Error("Curso no encontrado.");
    }

    curso.habilitado = habilitado;
    await curso.save();

    return curso;
  } catch (error) {
    throw new Error(error.message);
  }
};