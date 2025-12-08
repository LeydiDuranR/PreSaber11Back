import { admin } from "../config/firebase.js";
import SalaPrivada from '../models/SalaPrivada.js';
import ParticipanteSala from '../models/ParticipanteSala.js';
import PreguntasSala from '../models/PreguntasSala.js';
import RespuestaSalaPvP from '../models/RespuestaSalaPvP.js';
import Pregunta from '../models/Pregunta.js';
import Opcion from '../models/Opcion.js';
import Usuario from '../models/Usuario.js';
import Area from '../models/Area.js';
import db from '../db/db.js';
import { Op } from 'sequelize';

class SalaPrivadaService {

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

  // Generar código único para la sala (formato: ABC-1234)
  generarCodigoSala() {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';

    let codigo = '';
    for (let i = 0; i < 3; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    codigo += '-';
    for (let i = 0; i < 4; i++) {
      codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }

    return codigo;
  }

  // Crear sala privada
  async crearSala(idCreador, idArea, nivelDificultad, duracionMinutos, cantidadPreguntas) {
    const transaction = await db.transaction();

    try {
      // Generar código único
      let codigoSala;
      let existeCodigo = true;

      while (existeCodigo) {
        codigoSala = this.generarCodigoSala();
        const salaExistente = await SalaPrivada.findOne({
          where: { codigo_sala: codigoSala },
          transaction
        });
        existeCodigo = !!salaExistente;
      }

      // Calcular tiempo de expiración (10 minutos desde ahora)
      const expiraEn = new Date();
      expiraEn.setMinutes(expiraEn.getMinutes() + 10);

      // Crear sala
      const sala = await SalaPrivada.create({
        codigo_sala: codigoSala,
        id_creador: idCreador,
        id_area: idArea,
        nivel_dificultad: nivelDificultad,
        duracion_minutos: duracionMinutos,
        cantidad_preguntas: cantidadPreguntas,
        estado: 'esperando',
        expira_en: expiraEn
      }, { transaction });

      // Agregar al creador como primer participante
      await ParticipanteSala.create({
        id_sala: sala.id_sala,
        id_estudiante: idCreador,
        posicion: 1,
        estado_jugador: 'esperando'
      }, { transaction });

      // Seleccionar preguntas aleatorias según área y dificultad
      const preguntas = await this.seleccionarPreguntas(
        idArea,
        nivelDificultad,
        cantidadPreguntas,
        transaction
      );

      // Asignar preguntas a la sala
      for (let i = 0; i < preguntas.length; i++) {
        await PreguntasSala.create({
          id_sala: sala.id_sala,
          id_pregunta: preguntas[i].id_pregunta,
          orden: i + 1
        }, { transaction });
      }

      await transaction.commit();

      // Obtener sala completa con relaciones
      return await this.obtenerSalaDetalle(sala.id_sala);

    } catch (error) {
      // Solo hacer rollback si la transacción no fue finalizada
      if (!transaction.finished) {
        await transaction.rollback();
      }
      throw new Error(`Error al crear sala: ${error.message}`);
    }
  }

  // Seleccionar preguntas aleatorias
  async seleccionarPreguntas(idArea, nivelDificultad, cantidad, transaction) {
    try {
      // Normalizar nivel de dificultad (convertir a minúsculas)
      const nivelNormalizado = nivelDificultad.toLowerCase();

      const preguntas = await Pregunta.findAll({
        where: {
          id_area: idArea,
          nivel_dificultad: nivelNormalizado
        },
        order: db.random(),
        limit: cantidad,
        transaction
      });

      if (preguntas.length < cantidad) {
        throw new Error(`No hay suficientes preguntas (se necesitan ${cantidad}, hay ${preguntas.length})`);
      }

      return preguntas;
    } catch (error) {
      throw new Error(`Error al seleccionar preguntas: ${error.message}`);
    }
  }

  // Unirse a una sala mediante código
  async unirseASala(codigoSala, idEstudiante) {
    const transaction = await db.transaction();

    try {
      // Buscar sala
      const sala = await SalaPrivada.findOne({
        where: { codigo_sala: codigoSala },
        transaction
      });

      if (!sala) {
        throw new Error('Sala no encontrada');
      }

      // Verificar que la sala esté esperando
      if (sala.estado !== 'esperando') {
        throw new Error('La sala ya no está disponible');
      }

      // Verificar que no haya expirado
      if (new Date() > sala.expira_en) {
        await sala.update({ estado: 'cancelada' }, { transaction });
        await transaction.commit();
        throw new Error('La sala ha expirado');
      }

      // Verificar que no esté llena
      const participantes = await ParticipanteSala.count({
        where: { id_sala: sala.id_sala },
        transaction
      });

      if (participantes >= 2) {
        throw new Error('La sala está llena');
      }

      // Verificar que el estudiante no esté ya en la sala
      const yaUnido = await ParticipanteSala.findOne({
        where: {
          id_sala: sala.id_sala,
          id_estudiante: idEstudiante
        },
        transaction
      });

      if (yaUnido) {
        throw new Error('Ya estás en esta sala');
      }

      // Agregar participante
      await ParticipanteSala.create({
        id_sala: sala.id_sala,
        id_estudiante: idEstudiante,
        posicion: 2,
        estado_jugador: 'listo'
      }, { transaction });

      // Actualizar estado de la sala a "en_curso" y fecha de inicio
      await sala.update({
        estado: 'en_curso',
        fecha_inicio: new Date()
      }, { transaction });

      await transaction.commit();

      return await this.obtenerSalaDetalle(sala.id_sala);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Obtener detalle completo de una sala
  async obtenerSalaDetalle(idSala) {
    try {
      const sala = await SalaPrivada.findByPk(idSala, {
        include: [
          {
            model: Area,
            as: 'area',
            attributes: ['id_area', 'nombre']
          },
          {
            model: ParticipanteSala,
            as: 'participantes',
            include: [
              {
                model: Usuario,
                as: 'estudiante',
                attributes: ['documento', 'nombre', 'apellido', 'correo', 'uid_firebase']
              }
            ],
            order: [['posicion', 'ASC']]
          }
        ]
      });

      if (!sala) {
        throw new Error('Sala no encontrada');
      }

      const participantesConFirebase = await Promise.all(
        sala.participantes.map(async (p) => {
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
            posicion: p.posicion,
            estado_jugador: p.estado_jugador,
            preguntas_respondidas: p.preguntas_respondidas,
            preguntas_correctas: p.preguntas_correctas,
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
        id_sala: sala.id_sala,
        codigo_sala: sala.codigo_sala,
        id_creador: sala.id_creador,
        area: sala.area,
        nivel_dificultad: sala.nivel_dificultad,
        duracion_minutos: sala.duracion_minutos,
        cantidad_preguntas: sala.cantidad_preguntas,
        estado: sala.estado,
        fecha_creacion: sala.fecha_creacion,
        fecha_inicio: sala.fecha_inicio,
        expira_en: sala.expira_en,
        participantes: participantesConFirebase
      };

    } catch (error) {
      throw new Error(`Error al obtener sala: ${error.message}`);
    }
  }

  // Obtener preguntas de una sala
  async obtenerPreguntasSala(idSala) {
    try {
      const sala = await SalaPrivada.findByPk(idSala);

      if (!sala) {
        throw new Error('Sala no encontrada');
      }

      const preguntasSala = await PreguntasSala.findAll({
        where: { id_sala: idSala },
        include: [
          {
            model: Pregunta,
            as: 'pregunta',
            include: [
              {
                model: Opcion,
                as: 'opciones',
                attributes: ['id_opcion', 'texto_opcion', 'imagen']
              }
            ]
          }
        ],
        order: [['orden', 'ASC']]
      });

      return {
        sala: {
          id_sala: sala.id_sala,
          codigo_sala: sala.codigo_sala,
          duracion_minutos: sala.duracion_minutos,
          cantidad_preguntas: sala.cantidad_preguntas
        },
        preguntas: preguntasSala.map(ps => ({
          id_pregunta: ps.pregunta.id_pregunta,
          enunciado: ps.pregunta.enunciado,
          imagen: ps.pregunta.imagen,
          nivel_dificultad: ps.pregunta.nivel_dificultad,
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

  // Guardar respuesta en sala PvP
  async guardarRespuestaPvP(idSala, idEstudiante, idPregunta, idOpcion, tiempoRespuesta) {
    const transaction = await db.transaction();

    try {
      // Obtener la sala para conocer el nivel de dificultad
      const sala = await SalaPrivada.findByPk(idSala, { transaction });
      
      if (!sala) {
        throw new Error('Sala no encontrada');
      }

      // Verificar que la opción sea correcta
      const opcion = await Opcion.findByPk(idOpcion, { transaction });

      if (!opcion) {
        throw new Error('Opción no encontrada');
      }

      // Guardar respuesta
      await RespuestaSalaPvP.create({
        id_sala: idSala,
        id_estudiante: idEstudiante,
        id_pregunta: idPregunta,
        id_opcion: idOpcion,
        es_correcta: opcion.es_correcta,
        tiempo_respuesta_segundos: tiempoRespuesta
      }, { transaction });

      // Calcular puntos de experiencia según dificultad
      const puntosExperiencia = this.obtenerPuntosExperiencia(sala.nivel_dificultad, opcion.es_correcta);

      // Actualizar contador del participante
      const participante = await ParticipanteSala.findOne({
        where: {
          id_sala: idSala,
          id_estudiante: idEstudiante
        },
        transaction
      });

      await participante.update({
        preguntas_respondidas: participante.preguntas_respondidas + 1,
        preguntas_correctas: opcion.es_correcta
          ? participante.preguntas_correctas + 1
          : participante.preguntas_correctas,
        experiencia_ganada: participante.experiencia_ganada + puntosExperiencia,
        estado_jugador: 'jugando'
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

  // Finalizar participación en sala
  async finalizarParticipacion(idSala, idEstudiante, duracionTotal) {
    const transaction = await db.transaction();

    try {
      const participante = await ParticipanteSala.findOne({
        where: {
          id_sala: idSala,
          id_estudiante: idEstudiante
        },
        transaction
      });

      if (!participante) {
        throw new Error('Participante no encontrado');
      }

      const sala = await SalaPrivada.findByPk(idSala, { transaction });
      const totalPreguntas = sala.cantidad_preguntas;
      const puntaje = totalPreguntas > 0
        ? (participante.preguntas_correctas / totalPreguntas) * 100
        : 0;

      await participante.update({
        estado_jugador: 'finalizado',
        puntaje_final: puntaje.toFixed(2),
        fecha_finalizacion: new Date()
      }, { transaction });

      // Verificar si ambos finalizaron
      const participantes = await ParticipanteSala.findAll({
        where: { id_sala: idSala },
        transaction
      });

      const todosFinalizados = participantes.every(p => p.estado_jugador === 'finalizado');

      if (todosFinalizados) {
        await sala.update({
          estado: 'finalizada',
          fecha_finalizacion: new Date()
        }, { transaction });
      }

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

  // Obtener resultado final de la sala
  async obtenerResultadoSala(idSala) {
    try {
      const sala = await SalaPrivada.findByPk(idSala, {
        include: [
          {
            model: Area,
            as: 'area',
            attributes: ['nombre']
          },
          {
            model: ParticipanteSala,
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

      if (!sala) {
        throw new Error('Sala no encontrada');
      }

      // Ordenar participantes: primero por puntaje (descendente), luego por fecha de finalización (ascendente)
      const participantesOrdenados = sala.participantes.sort((a, b) => {
        const puntajeA = Number(a.puntaje_final);
        const puntajeB = Number(b.puntaje_final);
        
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
          posicion: i + 1
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
            es_ganador: index === 0
          };
        })
      );

      return {
        id_sala: sala.id_sala,
        codigo_sala: sala.codigo_sala,
        area: sala.area.nombre,
        nivel_dificultad: sala.nivel_dificultad,
        duracion_minutos: sala.duracion_minutos,
        total_preguntas: sala.cantidad_preguntas,
        estado: sala.estado,
        participantes: participantesConFirebase
      };

    } catch (error) {
      throw new Error(`Error al obtener resultado: ${error.message}`);
    }
  }

  // Obtener progreso en tiempo real
  async obtenerProgreso(idSala) {
    try {
      const participantes = await ParticipanteSala.findAll({
        where: { id_sala: idSala },
        include: [
          {
            model: Usuario,
            as: 'estudiante',
            attributes: ['documento', 'nombre', 'apellido', 'uid_firebase']
          }
        ],
        order: [['posicion', 'ASC']]
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
            posicion: p.posicion,
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


  // Obtener historial de salas de un estudiante
  async obtenerHistorialSalas(idEstudiante) {
    try {
      const participaciones = await ParticipanteSala.findAll({
        where: { id_estudiante: idEstudiante },
        include: [
          {
            model: SalaPrivada,
            as: 'sala',
            where: {
              estado: { [Op.in]: ['finalizada', 'cancelada'] }
            },
            include: [
              {
                model: Area,
                as: 'area',
                attributes: ['nombre']
              }
            ]
          }
        ],
        order: [[{ model: SalaPrivada, as: 'sala' }, 'fecha_finalizacion', 'DESC']]
      });

      return participaciones.map(p => ({
        id_sala: p.sala.id_sala,
        codigo_sala: p.sala.codigo_sala,
        area: p.sala.area.nombre,
        nivel_dificultad: p.sala.nivel_dificultad,
        fecha_finalizacion: p.sala.fecha_finalizacion,
        preguntas_correctas: p.preguntas_correctas,
        total_preguntas: p.sala.cantidad_preguntas,
        puntaje_final: p.puntaje_final,
        experiencia_ganada: p.experiencia_ganada,
        resultado: p.posicion === 1 ? 'victoria' : 'derrota'
      }));
    } catch (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }

  // Por implementar 
  async limpiarSalasExpiradas() {
    try {
      const ahora = new Date();

      const salasExpiradas = await SalaPrivada.update(
        { estado: 'cancelada' },
        {
          where: {
            estado: 'esperando',
            expira_en: { [Op.lt]: ahora }
          }
        }
      );

      return { salasActualizadas: salasExpiradas[0] };
    } catch (error) {
      throw new Error(`Error al limpiar salas: ${error.message}`);
    }
  }
}

export default new SalaPrivadaService();