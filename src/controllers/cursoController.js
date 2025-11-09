import { obtenerCursos, verificarCurso } from "../services/cursoService.js";

export const verificarCursoClave = async (req, res) => {
  try {
    const { grado, grupo, cohorte, clave_acceso } = req.body;
    const valido = await verificarCurso(grado, grupo, cohorte, clave_acceso);
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
