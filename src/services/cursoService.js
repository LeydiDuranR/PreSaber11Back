import Curso from "../models/Curso.js";

export const verificarCurso = async (grado, grupo, cohorte, clave_acceso) => {
  const curso = await Curso.findOne({
    where: { grado, grupo, cohorte, clave_acceso },
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
