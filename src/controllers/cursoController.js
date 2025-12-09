import {
  obtenerCursos, 
  verificarCurso, 
  crearCurso, 
  listarCursosPorInstituciones,
  obtenerCursosPorInstitucion, 
  actualizarEstadoCurso, 
  actualizarCurso,
  obtenerParticipantesCurso,
  obtenerPromediosPorArea,
  obtenerRankingEstudiantes,
} from "../services/cursoService.js";

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


export const actualizarEstadoCursoController = async (req, res) => {
  try {
    const { grado, grupo, cohorte, id_institucion, habilitado } = req.body;

    if (!grado || !grupo || !cohorte || !id_institucion || habilitado === undefined) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const cursoActualizado = await actualizarEstadoCurso({
      grado,
      grupo,
      cohorte,
      id_institucion,
      habilitado
    });

    res.status(200).json({
      mensaje: "Estado del curso actualizado exitosamente.",
      data: cursoActualizado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/cursos/participantes
export const obtenerParticipantes = async (req, res) => {
  try {
    const { grado, grupo, cohorte, id_institucion } = req.body;

    if (!grado || !grupo || !cohorte || !id_institucion) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: grado, grupo, cohorte, id_institucion'
      });
    }

    const participantes = await obtenerParticipantesCurso(
      grado,
      grupo,
      parseInt(cohorte),
      parseInt(id_institucion)
    );

    return res.status(200).json({
      success: true,
      data: participantes
    });

  } catch (error) {
    console.error('Error al obtener participantes:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// POST /api/cursos/promedios
export const obtenerPromedios = async (req, res) => {
  try {
    const { grado, grupo, cohorte, id_institucion } = req.body;

    if (!grado || !grupo || !cohorte || !id_institucion) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: grado, grupo, cohorte, id_institucion'
      });
    }

    const promedios = await obtenerPromediosPorArea(
      grado,
      grupo,
      parseInt(cohorte),
      parseInt(id_institucion)
    );

    return res.status(200).json({
      success: true,
      data: promedios
    });

  } catch (error) {
    console.error('Error al obtener promedios:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// POST /api/cursos/ranking
export const obtenerRanking = async (req, res) => {
  try {
    const { grado, grupo, cohorte, id_institucion } = req.body;

    if (!grado || !grupo || !cohorte || !id_institucion) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: grado, grupo, cohorte, id_institucion'
      });
    }

    const ranking = await obtenerRankingEstudiantes(
      grado,
      grupo,
      parseInt(cohorte),
      parseInt(id_institucion)
    );

    return res.status(200).json({
      success: true,
      data: ranking
    });

  } catch (error) {
    console.error('Error al obtener ranking:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// PATCH /api/cursos/configuracion
export const actualizarConfiguracion = async (req, res) => {
  try {
    const { grado, grupo, cohorte, id_institucion, id_docente, ...datos } = req.body;

    if (!grado || !grupo || !cohorte || !id_institucion) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos requeridos"
      });
    }

    const cursoActualizado = await actualizarCurso(
      grado,
      grupo,
      parseInt(cohorte),
      parseInt(id_institucion),
      id_docente,   // el docente nuevo (si lo envían)
      datos         // clave_acceso y habilitado
    );

    return res.status(200).json({
      success: true,
      message: "Curso actualizado correctamente",
      data: cursoActualizado
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
