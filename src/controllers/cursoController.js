import { obtenerCursos, verificarCurso, crearCurso, listarCursosPorInstituciones, obtenerCursosPorInstitucion } from "../services/cursoService.js";

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


export const obtenerCursosPorInstituciones = async (req, res) => {
  try {
    const { id_institucion } = req.params;

    if (!id_institucion) {
      return res.status(400).json({ error: "Debe proporcionar el id de la institución." });
    }

    const cursos = await listarCursosPorInstituciones(id_institucion);
    res.status(200).json(cursos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const crearCursoInstitucion = async (req, res) => {
  try {
    const { grado, grupo, cohorte, clave_acceso, id_institucion, id_docente } = req.body;

    const nuevoCurso = await crearCurso(
      grado,
      grupo,
      cohorte,
      clave_acceso,
      id_institucion,
      id_docente
    );

    res.status(201).json({
      mensaje: "Curso creado exitosamente.",
      data: nuevoCurso
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
