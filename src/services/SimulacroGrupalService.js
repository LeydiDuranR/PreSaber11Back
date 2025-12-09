import { admin } from "../config/firebase.js";
import SimulacroGrupal from '../models/SimulacroGrupal.js';
import ParticipanteSimulacro from '../models/ParticipanteSimulacro.js';
import Participante from '../models/Participante.js';
import PreguntasSimulacro from '../models/PreguntasSimulacro.js';
import RespuestaSimulacro from '../models/RespuestaSimulacro.js';
import Pregunta from '../models/Pregunta.js';
import Opcion from '../models/Opcion.js';
import Usuario from '../models/Usuario.js';
import Curso from '../models/Curso.js';
import Area from '../models/Area.js';
import db from '../db/db.js';
import { Op } from 'sequelize';

class SimulacroGrupalService {

  // Sistema de experiencia según dificultad
  obtenerPuntosExperiencia(nivelDificultad, esCorrecta) {
    if (!esCorrecta) return 0;

    const pesos = {
      'bajo': 5,
      'medio': 10,
      'alto': 15
    };

    return pesos[nivelDificultad.toLowerCase()] || 10;
  }

  // Crear simulacro grupal
async crearSimulacro(idDocente, grado, grupo, cohorte, idInstitucion, cantidadPreguntas, duracionMinutos) {
  const transaction = await db.transaction();

  try {
    // Validar docente
    const docente = await Usuario.findOne({
      where: {
        documento: idDocente,
        id_rol: 2
      },
      transaction
    });

    if (!docente) {
      throw new Error('Usuario no es docente o no existe');
    }

    // Validar curso
    const curso = await Curso.findOne({
      where: { grado, grupo, cohorte, id_institucion: idInstitucion },
      transaction
    });

    if (!curso) {
      throw new Error('El curso no existe');
    }

    // Validaciones mínimas
    if (cantidadPreguntas < 10) {
      throw new Error('La cantidad mínima de preguntas es 10');
    }

    if (duracionMinutos < 10) {
      throw new Error('La duración mínima es 10 minutos');
    }

    // 🔍 VALIDACIÓN NUEVA: ¿Hay suficientes preguntas?
    const totalPreguntas = await Pregunta.count({ transaction });

    if (totalPreguntas < cantidadPreguntas) {
      throw new Error(
        `No hay preguntas suficientes en la base de datos (disponibles: ${totalPreguntas}, solicitadas: ${cantidadPreguntas})`
      );
    }

    // Crear simulacro
    const simulacro = await SimulacroGrupal.create({
      id_docente: idDocente,
      grado,
      grupo,
      cohorte,
      id_institucion: idInstitucion,
      cantidad_preguntas: cantidadPreguntas,
      duracion_minutos: duracionMinutos,
      estado: 'esperando'
    }, { transaction });

    // Seleccionar preguntas aleatorias
    const preguntas = await this.seleccionarPreguntasAleatorias(cantidadPreguntas, transaction);

    // Asignar preguntas al simulacro
    for (let i = 0; i < preguntas.length; i++) {
      await PreguntasSimulacro.create({
        id_simulacro: simulacro.id_simulacro,
        id_pregunta: preguntas[i].id_pregunta,
        orden: i + 1
      }, { transaction });
    }

    await transaction.commit();

    return await this.obtenerSimulacroDetalle(simulacro.id_simulacro);

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw new Error(`Error al crear simulacro: ${error.message}`);
  }
}

  // Seleccionar preguntas aleatorias de todas las áreas con distribución balanceada
  async seleccionarPreguntasAleatorias(cantidad, transaction) {
    try {
      // Obtener todas las áreas
      const areas = await Area.findAll({ transaction });

      if (areas.length === 0) {
        throw new Error('No hay áreas disponibles');
      }

      // Calcular distribución: preguntas por área
      const preguntasPorArea = Math.floor(cantidad / areas.length);
      const preguntasExtra = cantidad % areas.length;

      let preguntasSeleccionadas = [];

      // Seleccionar preguntas de cada área
      for (let i = 0; i < areas.length; i++) {
        const cantidadParaEstaArea = preguntasPorArea + (i < preguntasExtra ? 1 : 0);

        // Obtener preguntas de diferentes niveles de dificultad
        const preguntasDelArea = await Pregunta.findAll({
          where: { id_area: areas[i].id_area },
          order: db.random(),
          limit: cantidadParaEstaArea,
          transaction
        });

        preguntasSeleccionadas = preguntasSeleccionadas.concat(preguntasDelArea);
      }

      // Si no alcanzamos la cantidad, completar con preguntas aleatorias
      if (preguntasSeleccionadas.length < cantidad) {
        const idsYaSeleccionados = preguntasSeleccionadas.map(p => p.id_pregunta);

        const preguntasAdicionales = await Pregunta.findAll({
          where: {
            id_pregunta: { [Op.notIn]: idsYaSeleccionados }
          },
          order: db.random(),
          limit: cantidad - preguntasSeleccionadas.length,
          transaction
        });

        preguntasSeleccionadas = preguntasSeleccionadas.concat(preguntasAdicionales);
      }

      if (preguntasSeleccionadas.length < cantidad) {
        throw new Error(`No hay suficientes preguntas (se necesitan ${cantidad}, hay ${preguntasSeleccionadas.length})`);
      }

      // Mezclar el orden de las preguntas
      return preguntasSeleccionadas.sort(() => Math.random() - 0.5);

    } catch (error) {
      throw new Error(`Error al seleccionar preguntas: ${error.message}`);
    }
  }

  // Estudiante se une al simulacro
  async unirseASimulacro(idSimulacro, idEstudiante) {
    const transaction = await db.transaction();

    try {
      const simulacro = await SimulacroGrupal.findByPk(idSimulacro, { transaction });

      if (!simulacro) {
        throw new Error('Simulacro no encontrado');
      }

      // Verificar que esté en estado esperando
      if (simulacro.estado !== 'esperando') {
        throw new Error('El simulacro ya no está disponible para unirse');
      }

      const estudiante = await Usuario.findOne({
        where: {
          documento: idEstudiante,
          id_rol: 3
        },
        transaction
      });

      if (!estudiante) {
        throw new Error('El estudiante no existe o no es un estudiante');
      }

      // Verificar participación en el curso
      const participante = await Participante.findOne({
        where: {
          documento_participante: idEstudiante,
          grado: simulacro.grado,
          grupo: simulacro.grupo,
          cohorte: simulacro.cohorte,
          id_institucion: simulacro.id_institucion
        },
        transaction
      });

      if (!participante) {
        throw new Error('El estudiante no pertenece a este curso');
      }

      // Verificar que no esté ya unido
      const yaUnido = await ParticipanteSimulacro.findOne({
        where: {
          id_simulacro: idSimulacro,
          id_estudiante: idEstudiante
        },
        transaction
      });

      if (yaUnido) {
        throw new Error('Ya estás unido a este simulacro');
      }

      // Agregar participante
      await ParticipanteSimulacro.create({
        id_simulacro: idSimulacro,
        id_estudiante: idEstudiante,
        estado_jugador: 'esperando'
      }, { transaction });

      await transaction.commit();

      return await this.obtenerSimulacroDetalle(idSimulacro);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Iniciar simulacro (solo el docente)
  async iniciarSimulacro(idSimulacro, idDocente) {
    const transaction = await db.transaction();

    try {
      const simulacro = await SimulacroGrupal.findByPk(idSimulacro, { transaction });

      if (!simulacro) {
        throw new Error('Simulacro no encontrado');
      }

      // Verificar que quien inicia sea el docente creador
      if (simulacro.id_docente !== idDocente) {
        throw new Error('Solo el docente creador puede iniciar el simulacro');
      }

      // Verificar que esté en estado esperando
      if (simulacro.estado !== 'esperando') {
        throw new Error('El simulacro no se puede iniciar');
      }

      // Verificar que haya al menos un estudiante
      const participantes = await ParticipanteSimulacro.count({
        where: { id_simulacro: idSimulacro },
        transaction
      });

      if (participantes === 0) {
        throw new Error('No hay estudiantes unidos al simulacro');
      }

      // Iniciar simulacro
      await simulacro.update({
        estado: 'en_curso',
        fecha_inicio: new Date()
      }, { transaction });

      // Actualizar estado de todos los participantes a "jugando"
      await ParticipanteSimulacro.update(
        { estado_jugador: 'jugando' },
        {
          where: { id_simulacro: idSimulacro },
          transaction
        }
      );

      await transaction.commit();

      return await this.obtenerSimulacroDetalle(idSimulacro);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Obtener detalle del simulacro
  async obtenerSimulacroDetalle(idSimulacro) {
    try {
      const simulacro = await SimulacroGrupal.findByPk(idSimulacro, {
        include: [
          {
            model: Usuario,
            as: 'docente',
            attributes: ['documento', 'nombre', 'apellido', 'correo']
          },
          {
            model: ParticipanteSimulacro,
            as: 'participantes',
            include: [
              {
                model: Usuario,
                as: 'estudiante',
                attributes: ['documento', 'nombre', 'apellido', 'correo', 'uid_firebase']
              }
            ]
          }
        ]
      });

      if (!simulacro) {
        throw new Error('Simulacro no encontrado');
      }

      const participantesConFirebase = await Promise.all(
        simulacro.participantes.map(async (p) => {
          let firebasePhoto = null;
          let firebaseName = null;

          try {
            if (p.estudiante.uid_firebase) {
              const firebaseUser = await admin.auth().getUser(p.estudiante.uid_firebase);
              firebasePhoto = firebaseUser.photoURL || null;
              firebaseName = firebaseUser.displayName || null;
            }
          } catch (error) {
            console.log("Error obteniendo datos Firebase:", error.message);
          }

          return {
            id_estudiante: p.id_estudiante,
            estado_jugador: p.estado_jugador,
            preguntas_respondidas: p.preguntas_respondidas,
            preguntas_correctas: p.preguntas_correctas,
            posicion_final: p.posicion_final,
            estudiante: {
              documento: p.estudiante.documento,
              nombre: p.estudiante.nombre,
              apellido: p.estudiante.apellido,
              nombre_completo: firebaseName || `${p.estudiante.nombre} ${p.estudiante.apellido}`,
              photoURL: firebasePhoto
            }
          };
        })
      );

      return {
        id_simulacro: simulacro.id_simulacro,
        docente: {
          documento: simulacro.docente.documento,
          nombre: simulacro.docente.nombre,
          apellido: simulacro.apellido
        },
        curso: {
          grado: simulacro.grado,
          grupo: simulacro.grupo,
          cohorte: simulacro.cohorte
        },
        cantidad_preguntas: simulacro.cantidad_preguntas,
        duracion_minutos: simulacro.duracion_minutos,
        estado: simulacro.estado,
        fecha_creacion: simulacro.fecha_creacion,
        fecha_inicio: simulacro.fecha_inicio,
        fecha_finalizacion: simulacro.fecha_finalizacion,
        participantes: participantesConFirebase
      };

    } catch (error) {
      throw new Error(`Error al obtener simulacro: ${error.message}`);
    }
  }

  // Obtener preguntas del simulacro
  async obtenerPreguntasSimulacro(idSimulacro) {
    try {
      const simulacro = await SimulacroGrupal.findByPk(idSimulacro);

      if (!simulacro) {
        throw new Error('Simulacro no encontrado');
      }

      const preguntasSimulacro = await PreguntasSimulacro.findAll({
        where: { id_simulacro: idSimulacro },
        include: [
          {
            model: Pregunta,
            as: 'pregunta',
            include: [
              {
                model: Opcion,
                as: 'opciones',
                attributes: ['id_opcion', 'texto_opcion', 'imagen']
              },
              {
                model: Area,
                as: 'area',
                attributes: ['nombre']
              }
            ]
          }
        ],
        order: [['orden', 'ASC']]
      });

      return {
        simulacro: {
          id_simulacro: simulacro.id_simulacro,
          duracion_minutos: simulacro.duracion_minutos,
          cantidad_preguntas: simulacro.cantidad_preguntas
        },
        preguntas: preguntasSimulacro.map(ps => ({
          id_pregunta: ps.pregunta.id_pregunta,
          enunciado: ps.pregunta.enunciado,
          imagen: ps.pregunta.imagen,
          nivel_dificultad: ps.pregunta.nivel_dificultad,
          area: ps.pregunta.area.nombre,
          orden: ps.orden,
          opciones: ps.pregunta.opciones.map(op => ({
            id_opcion: op.id_opcion,
            texto_opcion: op.texto_opcion,
            imagen: op.imagen
          }))
        }))
      };
    } catch (error) {
      throw new Error(`Error al obtener preguntas: ${error.message}`);
    }
  }

  // Guardar respuesta en simulacro
  async guardarRespuestaSimulacro(idSimulacro, idEstudiante, idPregunta, idOpcion, tiempoRespuesta) {
    const transaction = await db.transaction();

    try {
      // Obtener la pregunta para conocer el nivel de dificultad
      const pregunta = await Pregunta.findByPk(idPregunta, { transaction });

      if (!pregunta) {
        throw new Error('Pregunta no encontrada');
      }

      // Verificar que la opción sea correcta
      const opcion = await Opcion.findByPk(idOpcion, { transaction });

      if (!opcion) {
        throw new Error('Opción no encontrada');
      }

      // Guardar respuesta
      await RespuestaSimulacro.create({
        id_simulacro: idSimulacro,
        id_estudiante: idEstudiante,
        id_pregunta: idPregunta,
        id_opcion: idOpcion,
        es_correcta: opcion.es_correcta,
        tiempo_respuesta_segundos: tiempoRespuesta
      }, { transaction });

      // Calcular puntos de experiencia según dificultad
      const puntosExperiencia = this.obtenerPuntosExperiencia(pregunta.nivel_dificultad, opcion.es_correcta);

      // Actualizar contador del participante
      const participante = await ParticipanteSimulacro.findOne({
        where: {
          id_simulacro: idSimulacro,
          id_estudiante: idEstudiante
        },
        transaction
      });

      await participante.update({
        preguntas_respondidas: participante.preguntas_respondidas + 1,
        preguntas_correctas: opcion.es_correcta
          ? participante.preguntas_correctas + 1
          : participante.preguntas_correctas,
        experiencia_ganada: participante.experiencia_ganada + puntosExperiencia
      }, { transaction });

      await transaction.commit();

      return {
        id_estudiante: idEstudiante,
        id_pregunta: idPregunta,
        es_correcta: opcion.es_correcta,
        preguntas_respondidas: participante.preguntas_respondidas + 1,
        preguntas_correctas: opcion.es_correcta
          ? participante.preguntas_correctas + 1
          : participante.preguntas_correctas
      };

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error al guardar respuesta: ${error.message}`);
    }
  }

  // Finalizar participación de un estudiante
  async finalizarParticipacion(idSimulacro, idEstudiante) {
    const transaction = await db.transaction();

    try {
      const participante = await ParticipanteSimulacro.findOne({
        where: {
          id_simulacro: idSimulacro,
          id_estudiante: idEstudiante
        },
        transaction
      });

      if (!participante) {
        throw new Error('Participante no encontrado');
      }

      const simulacro = await SimulacroGrupal.findByPk(idSimulacro, { transaction });
      const totalPreguntas = simulacro.cantidad_preguntas;
      const puntaje = totalPreguntas > 0
        ? (participante.preguntas_correctas / totalPreguntas) * 100
        : 0;

      await participante.update({
        estado_jugador: 'finalizado',
        puntaje_final: puntaje.toFixed(2),
        fecha_finalizacion: new Date()
      }, { transaction });

      await transaction.commit();

      return {
        id_estudiante: idEstudiante,
        puntaje_final: puntaje.toFixed(2),
        preguntas_correctas: participante.preguntas_correctas,
        total_preguntas: totalPreguntas,
        experiencia_ganada: participante.experiencia_ganada
      };

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error al finalizar: ${error.message}`);
    }
  }

  // Finalizar simulacro completo (solo docente)
  async finalizarSimulacro(idSimulacro, idDocente) {
    const transaction = await db.transaction();

    try {
      const simulacro = await SimulacroGrupal.findByPk(idSimulacro, { transaction });

      if (!simulacro) {
        throw new Error('Simulacro no encontrado');
      }

      // Verificar que quien finaliza sea el docente creador
      if (simulacro.id_docente !== idDocente) {
        throw new Error('Solo el docente creador puede finalizar el simulacro');
      }

      // Actualizar estado del simulacro
      await simulacro.update({
        estado: 'finalizado',
        fecha_finalizacion: new Date()
      }, { transaction });

      // Finalizar participantes que aún no han terminado
      await ParticipanteSimulacro.update(
        {
          estado_jugador: 'finalizado',
          fecha_finalizacion: new Date()
        },
        {
          where: {
            id_simulacro: idSimulacro,
            estado_jugador: { [Op.ne]: 'finalizado' }
          },
          transaction
        }
      );

      await transaction.commit();

      return await this.obtenerResultadoSimulacro(idSimulacro);

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Error al finalizar simulacro: ${error.message}`);
    }
  }

  // Obtener resultado final y podio
  async obtenerResultadoSimulacro(idSimulacro) {
    try {
      const simulacro = await SimulacroGrupal.findByPk(idSimulacro, {
        include: [
          {
            model: Usuario,
            as: 'docente',
            attributes: ['documento', 'nombre', 'apellido']
          },
          {
            model: ParticipanteSimulacro,
            as: 'participantes',
            include: [
              {
                model: Usuario,
                as: 'estudiante',
                attributes: ['documento', 'nombre', 'apellido', 'uid_firebase']
              }
            ]
          }
        ]
      });

      if (!simulacro) {
        throw new Error('Simulacro no encontrado');
      }

      // Ordenar participantes: primero por puntaje (descendente), luego por fecha de finalización (ascendente)
      const participantesOrdenados = simulacro.participantes.sort((a, b) => {
        const puntajeA = Number(a.puntaje_final) || 0;
        const puntajeB = Number(b.puntaje_final) || 0;

        // Si los puntajes son diferentes, ordenar por puntaje
        if (puntajeA !== puntajeB) {
          return puntajeB - puntajeA;
        }

        // Si hay empate, ordenar por quien terminó primero
        const fechaA = a.fecha_finalizacion ? new Date(a.fecha_finalizacion).getTime() : Infinity;
        const fechaB = b.fecha_finalizacion ? new Date(b.fecha_finalizacion).getTime() : Infinity;

        return fechaA - fechaB;
      });

      // Actualizar posiciones finales en la base de datos
      for (let i = 0; i < participantesOrdenados.length; i++) {
        await participantesOrdenados[i].update({
          posicion_final: i + 1
        });
      }

      const participantesConFirebase = await Promise.all(
        participantesOrdenados.map(async (p, index) => {
          let firebasePhoto = null;
          let firebaseName = null;

          try {
            if (p.estudiante.uid_firebase) {
              const firebaseUser = await admin.auth().getUser(p.estudiante.uid_firebase);
              firebasePhoto = firebaseUser.photoURL || null;
              firebaseName = firebaseUser.displayName || null;
            }
          } catch (error) {
            console.log("Error obteniendo datos Firebase:", error.message);
          }

          return {
            posicion: index + 1,
            id_estudiante: p.id_estudiante,
            nombre_completo: firebaseName || `${p.estudiante.nombre} ${p.estudiante.apellido}`,
            photoURL: firebasePhoto,
            preguntas_correctas: p.preguntas_correctas,
            puntaje_final: p.puntaje_final,
            experiencia_ganada: p.experiencia_ganada,
            en_podio: index < 3 // Top 3
          };
        })
      );

      return {
        id_simulacro: simulacro.id_simulacro,
        docente: {
          nombre: `${simulacro.docente.nombre} ${simulacro.docente.apellido}`
        },
        curso: {
          grado: simulacro.grado,
          grupo: simulacro.grupo,
          cohorte: simulacro.cohorte
        },
        duracion_minutos: simulacro.duracion_minutos,
        total_preguntas: simulacro.cantidad_preguntas,
        estado: simulacro.estado,
        fecha_inicio: simulacro.fecha_inicio,
        fecha_finalizacion: simulacro.fecha_finalizacion,
        participantes: participantesConFirebase
      };

    } catch (error) {
      throw new Error(`Error al obtener resultado: ${error.message}`);
    }
  }

  // Obtener progreso en tiempo real
  async obtenerProgreso(idSimulacro) {
    try {
      const participantes = await ParticipanteSimulacro.findAll({
        where: { id_simulacro: idSimulacro },
        include: [
          {
            model: Usuario,
            as: 'estudiante',
            attributes: ['documento', 'nombre', 'apellido', 'uid_firebase']
          }
        ],
        order: [['preguntas_correctas', 'DESC'], ['preguntas_respondidas', 'DESC']]
      });

      const participantesConFirebase = await Promise.all(
        participantes.map(async (p) => {
          let firebasePhoto = null;
          let firebaseName = null;

          try {
            if (p.estudiante.uid_firebase) {
              const firebaseUser = await admin.auth().getUser(p.estudiante.uid_firebase);
              firebasePhoto = firebaseUser.photoURL || null;
              firebaseName = firebaseUser.displayName || null;
            }
          } catch (error) {
            console.log("Error obteniendo datos Firebase:", error.message);
          }

          return {
            id_estudiante: p.id_estudiante,
            nombre: firebaseName || `${p.estudiante.nombre} ${p.estudiante.apellido}`,
            photoURL: firebasePhoto,
            preguntas_respondidas: p.preguntas_respondidas,
            preguntas_correctas: p.preguntas_correctas,
            estado: p.estado_jugador
          };
        })
      );

      return participantesConFirebase;

    } catch (error) {
      throw new Error(`Error al obtener progreso: ${error.message}`);
    }
  }

  // Obtener simulacros de un curso
  async obtenerSimulacrosCurso(grado, grupo, cohorte, idInstitucion) {
    try {
      const simulacros = await SimulacroGrupal.findAll({
        where: { grado, grupo, cohorte, id_institucion: idInstitucion },
        include: [
          {
            model: Usuario,
            as: 'docente',
            attributes: ['documento', 'nombre', 'apellido']
          }
        ],
        order: [['fecha_creacion', 'DESC']]
      });

      return simulacros.map(s => ({
        id_simulacro: s.id_simulacro,
        docente: `${s.docente.nombre} ${s.docente.apellido}`,
        cantidad_preguntas: s.cantidad_preguntas,
        duracion_minutos: s.duracion_minutos,
        estado: s.estado,
        fecha_creacion: s.fecha_creacion,
        fecha_inicio: s.fecha_inicio
      }));

    } catch (error) {
      throw new Error(`Error al obtener simulacros: ${error.message}`);
    }
  }

  // Obtener historial de simulacros de un estudiante
  async obtenerHistorialEstudiante(idEstudiante) {
    try {
      const participaciones = await ParticipanteSimulacro.findAll({
        where: { id_estudiante: idEstudiante },
        include: [
          {
            model: SimulacroGrupal,
            as: 'simulacro',
            where: { estado: 'finalizado' },
            include: [
              {
                model: Usuario,
                as: 'docente',
                attributes: ['nombre', 'apellido']
              }
            ]
          }
        ],
        order: [[{ model: SimulacroGrupal, as: 'simulacro' }, 'fecha_finalizacion', 'DESC']]
      });

      return participaciones.map(p => ({
        id_simulacro: p.simulacro.id_simulacro,
        docente: `${p.simulacro.docente.nombre} ${p.simulacro.docente.apellido}`,
        fecha_finalizacion: p.simulacro.fecha_finalizacion,
        preguntas_correctas: p.preguntas_correctas,
        total_preguntas: p.simulacro.cantidad_preguntas,
        puntaje_final: p.puntaje_final,
        experiencia_ganada: p.experiencia_ganada,
        posicion_final: p.posicion_final
      }));

    } catch (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }
}

export default new SimulacroGrupalService();