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
