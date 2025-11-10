import { obtenerCursos, verificarCurso, obtenerCursosPorInstitucion } from "../services/cursoService.js";

export const verificarCursoClave = async (req, res) => {
  try {
    const { grado, grupo, cohorte, id_institucion, clave_acceso } = req.body;
    const valido = await verificarCurso(grado, grupo, cohorte, id_institucion, clave_acceso);
    res.status(200).json({ valido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listarCursos = async (req, res) => {
  try {
    const tipos = await obtenerCursos();
    res.status(200).json(tipos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listarCursosPorInstitucion = async (req, res) => {
  try {
    const { id_institucion } = req.params;
    const cursos = await obtenerCursosPorInstitucion(id_institucion);
    res.json(cursos);
  } catch (error) {
    console.error("Error al listar cursos por institución:", error);
    res.status(500).json({ message: "Error al obtener cursos" });
  }
};
