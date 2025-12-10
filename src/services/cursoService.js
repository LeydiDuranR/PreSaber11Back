import Curso from "../models/Curso.js";
import Institucion from "../models/Institucion.js";
import Area from "../models/Area.js";
import ParticipanteSimulacro from "../models/ParticipanteSimulacro.js";
import Participante from "../models/Participante.js";
import Usuario from "../models/Usuario.js";
import Rol from "../models/Rol.js";
import db from "../db/db.js";
import { Op } from "sequelize";
import { admin } from "../config/firebase.js";

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
            id_rol: { [Op.in]: [2, 4] }
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

export const obtenerParticipantesCurso = async (grado, grupo, cohorte, idInstitucion) => {
  try {
    // Buscar participantes del curso
    const participantes = await Participante.findAll({
      where: {
        grado,
        grupo,
        cohorte,
        id_institucion: idInstitucion
      }
    });

    const documentos = participantes.map(p => p.documento_participante);

    // Buscar usuarios con sus roles
    const usuarios = await Usuario.findAll({
      where: {
        documento: documentos
      },
      include: [
        {
          model: Rol,
          attributes: ['id_rol', 'descripcion']
        }
      ],
      attributes: ['documento', 'nombre', 'apellido', 'correo', 'uid_firebase']
    });

    // Obtener datos de Firebase y formatear
    const participantesConFirebase = await Promise.all(
      usuarios.map(async (usuario) => {
        let firebasePhoto = null;
        let firebaseName = null;

        try {
          if (usuario.uid_firebase) {
            const firebaseUser = await admin.auth().getUser(usuario.uid_firebase);
            firebasePhoto = firebaseUser.photoURL || null;
            firebaseName = firebaseUser.displayName || null;
          }
        } catch (error) {
          console.log("Error obteniendo datos Firebase:", error.message);
        }

        return {
          documento: usuario.documento,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          nombre_completo: firebaseName || `${usuario.nombre} ${usuario.apellido}`,
          correo: usuario.correo,
          photoURL: firebasePhoto,
          rol: {
            id: usuario.rol.id_rol,
            descripcion: usuario.rol.descripcion
          }
        };
      })
    );

    // Ordenar: primero docentes, luego estudiantes por nombre
    participantesConFirebase.sort((a, b) => {
      const prioridad = (rolId) => {
        if (rolId === 2 || rolId === 4) return 1; // Docente o Director
        if (rolId === 3) return 2;               // Estudiante
        return 99;                               // Otros al final
      };

      const pa = prioridad(a.rol.id);
      const pb = prioridad(b.rol.id);

      if (pa !== pb) return pa - pb; // Orden por prioridad
      return a.nombre_completo.localeCompare(b.nombre_completo); // Orden alfabético
    });

    return participantesConFirebase;

  } catch (error) {
    throw new Error(`Error al obtener participantes: ${error.message}`);
  }
}

// Obtener promedio del curso por áreas en simulacros POR SECCIONES
export const obtenerPromediosPorArea = async (grado, grupo, cohorte, idInstitucion) => {
  try {
    // Importar modelos de simulacro por secciones
    const Simulacro = (await import('../models/Simulacro.js')).default;
    const ResultadoSimulacro = (await import('../models/ResultadoSimulacro.js')).default;
    const ResultadoSesion = (await import('../models/ResultadoSesion.js')).default;
    const Sesion = (await import('../models/Sesion.js')).default;
    const SesionArea = (await import('../models/SesionArea.js')).default;

    // Obtener participantes del curso
    const participantes = await Participante.findAll({
      where: { grado, grupo, cohorte, id_institucion: idInstitucion }
    });

    const documentos = participantes.map(p => p.documento_participante);

    // Filtrar solo estudiantes (rol 3)
    const estudiantes = await Usuario.findAll({
      where: { documento: documentos, id_rol: 3 },
      attributes: ['documento']
    });

    const documentosEstudiantes = estudiantes.map(e => e.documento);

    if (documentosEstudiantes.length === 0) {
      return [];
    }

    // Obtener todos los resultados de simulacros completados de estos estudiantes
    const resultadosSimulacros = await ResultadoSimulacro.findAll({
      where: {
        id_estudiante: documentosEstudiantes,
        completado: true
      },
      include: [
        {
          model: Simulacro,
          attributes: ['id_simulacro']
        },
        {
          model: ResultadoSesion,
          include: [
            {
              model: Sesion,
              include: [
                {
                  model: SesionArea,
                  include: [
                    {
                      model: Area,
                      attributes: ['id_area', 'nombre']
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    // Agrupar puntajes por área
    const puntajesPorArea = {};

    resultadosSimulacros.forEach(resultado => {
      resultado.resultado_sesions.forEach(resultadoSesion => {
        const sesion = resultadoSesion.sesion;

        sesion.sesion_areas.forEach(sesionArea => {
          const area = sesionArea.area;
          const idArea = area.id_area;

          if (!puntajesPorArea[idArea]) {
            puntajesPorArea[idArea] = {
              id_area: idArea,
              nombre: area.nombre,
              suma_puntajes: 0,
              cantidad: 0
            };
          }

          puntajesPorArea[idArea].suma_puntajes += resultadoSesion.puntaje_sesion;
          puntajesPorArea[idArea].cantidad++;
        });
      });
    });

    // Calcular promedios
    const promedios = Object.values(puntajesPorArea).map(stats => ({
      id_area: stats.id_area,
      nombre_area: stats.nombre,
      promedio: stats.cantidad > 0
        ? Math.round((stats.suma_puntajes / stats.cantidad) * 100) / 100
        : 0
    }));

    // Ordenar por id_area
    promedios.sort((a, b) => a.id_area - b.id_area);

    return promedios;

  } catch (error) {
    throw new Error(`Error al obtener promedios por área: ${error.message}`);
  }
}

// Obtener ranking de estudiantes por experiencia TOTAL (todas las fuentes)
export const obtenerRankingEstudiantes = async (grado, grupo, cohorte, idInstitucion) => {
  try {
    const ParticipanteSala = (await import('../models/ParticipanteSala.js')).default;

    // Obtener participantes del curso
    const participantes = await Participante.findAll({
      where: { grado, grupo, cohorte, id_institucion: idInstitucion }
    });

    const documentos = participantes.map(p => p.documento_participante);

    // Obtener estudiantes (rol 3)
    const estudiantes = await Usuario.findAll({
      where: { documento: documentos, id_rol: 3 },
      attributes: ['documento', 'nombre', 'apellido', 'uid_firebase']
    });

    // Calcular experiencia total de cada estudiante
    const rankingConExperiencia = await Promise.all(
      estudiantes.map(async (estudiante) => {
        // 1. Experiencia de Simulacros Grupales
        const expSimulacrosGrupales = await ParticipanteSimulacro.sum('experiencia_ganada', {
          where: { id_estudiante: estudiante.documento }
        }) || 0;

        // 2. Experiencia de PvP (Salas Privadas)
        const expPvP = await ParticipanteSala.sum('experiencia_ganada', {
          where: { id_estudiante: estudiante.documento }
        }) || 0;

        // 3. Obtener último puntaje de simulacro por secciones
        const ResultadoSimulacro = (await import('../models/ResultadoSimulacro.js')).default;

        const ultimoResultado = await ResultadoSimulacro.findOne({
          where: {
            id_estudiante: estudiante.documento,
            completado: true
          },
          order: [['fecha_fin', 'DESC']],
          attributes: ['puntaje_total']
        });

        const ultimoPuntaje = ultimoResultado ? ultimoResultado.puntaje_total : 0;

        // Experiencia total
        const experienciaTotal = expSimulacrosGrupales + expPvP;

        // Obtener foto de Firebase
        let firebasePhoto = null;
        let firebaseName = null;

        try {
          if (estudiante.uid_firebase) {
            const firebaseUser = await admin.auth().getUser(estudiante.uid_firebase);
            firebasePhoto = firebaseUser.photoURL || null;
            firebaseName = firebaseUser.displayName || null;
          }
        } catch (error) {
          console.log("Error obteniendo datos Firebase:", error.message);
        }

        return {
          documento: estudiante.documento,
          nombre_completo: firebaseName || `${estudiante.nombre} ${estudiante.apellido}`,
          photoURL: firebasePhoto,
          experiencia_total: experienciaTotal,
          ultimo_puntaje_simulacro: ultimoPuntaje
        };
      })
    );

    // Ordenar por experiencia descendente
    rankingConExperiencia.sort((a, b) => b.experiencia_total - a.experiencia_total);

    // Asignar posiciones
    return rankingConExperiencia.map((estudiante, index) => ({
      posicion: index + 1,
      ...estudiante
    }));

  } catch (error) {
    throw new Error(`Error al obtener ranking: ${error.message}`);
  }
}

// Actualizar configuración del curso
export const actualizarCurso = async (grado, grupo, cohorte, idInstitucion, id_docente, datos) => {
  const transaction = await db.transaction();

  try {
    // Verificar curso
    const curso = await Curso.findOne({
      where: { grado, grupo, cohorte, id_institucion: idInstitucion },
      transaction
    });

    if (!curso) throw new Error("Curso no encontrado");

    // -----------------------------------
    // 1. Actualizar datos permitidos
    // -----------------------------------
    const camposPermitidos = ["clave_acceso", "habilitado"];
    const datosActualizar = {};

    camposPermitidos.forEach(campo => {
      if (datos[campo] !== undefined) datosActualizar[campo] = datos[campo];
    });

    await curso.update(datosActualizar, { transaction });

    // -----------------------------------
    // 2. CAMBIO DE DOCENTE
    // -----------------------------------
    if (id_docente) {

      // Validar que exista y sea docente/director
      const docenteNuevo = await Usuario.findOne({
        where: {
          documento: id_docente,
          id_rol: { [Op.in]: [2, 4] }
        },
        transaction
      });

      if (!docenteNuevo) throw new Error("El docente no existe o no tiene rol válido (2 o 4).");

      // Buscar participantes del curso
      const participantesCurso = await Participante.findAll({
        where: { grado, grupo, cohorte, id_institucion: idInstitucion },
        transaction
      });

      const documentos = participantesCurso.map(p => p.documento_participante);

      // Detectar docente actual
      const docenteAnterior = await Usuario.findOne({
        where: {
          documento: documentos,
          id_rol: { [Op.in]: [2, 4] }
        },
        transaction
      });

      // Si existe docente anterior → eliminarlo
      if (docenteAnterior) {
        await Participante.destroy({
          where: {
            documento_participante: docenteAnterior.documento,
            grado, grupo, cohorte, id_institucion: idInstitucion
          },
          transaction
        });
      }

      // Verificar si el nuevo ya está como participante
      const yaParticipa = await Participante.findOne({
        where: {
          documento_participante: docenteNuevo.documento,
          grado, grupo, cohorte, id_institucion: idInstitucion
        },
        transaction
      });

      // Si no está → agregarlo
      if (!yaParticipa) {
        await Participante.create({
          documento_participante: docenteNuevo.documento,
          grado,
          grupo,
          cohorte,
          id_institucion: idInstitucion
        }, { transaction });
      }
    }

    await transaction.commit();

    return {
      grado: curso.grado,
      grupo: curso.grupo,
      cohorte: curso.cohorte,
      clave_acceso: curso.clave_acceso,
      docente: id_docente || null,
      habilitado: curso.habilitado
    };

  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message);
  }
};