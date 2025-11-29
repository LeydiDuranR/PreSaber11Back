import SalaPrivada from './SalaPrivada.js';
import ParticipanteSala from './ParticipanteSala.js';
import RespuestaSalaPvP from './RespuestaSalaPvP.js';
import PreguntasSala from './PreguntasSala.js';
import Usuario from './Usuario.js';
import Area from './Area.js';
import Pregunta from './Pregunta.js';

// Sala -> Participantes
SalaPrivada.hasMany(ParticipanteSala, {
  foreignKey: 'id_sala',
  as: 'participantes'
});

ParticipanteSala.belongsTo(SalaPrivada, {
  foreignKey: 'id_sala',
  as: 'sala'
});

// Participante -> Usuario
ParticipanteSala.belongsTo(Usuario, {
  foreignKey: 'id_estudiante',
  as: 'estudiante'
});

// Sala -> Area
SalaPrivada.belongsTo(Area, {
  foreignKey: 'id_area',
  as: 'area'
});

// Sala -> Creador
SalaPrivada.belongsTo(Usuario, {
  foreignKey: 'id_creador',
  as: 'creador'
});

// Sala -> Preguntas
SalaPrivada.hasMany(PreguntasSala, {
  foreignKey: 'id_sala',
  as: 'preguntas_asignadas'
});

PreguntasSala.belongsTo(Pregunta, {
  foreignKey: 'id_pregunta',
  as: 'pregunta'
});

// Sala -> Respuestas
SalaPrivada.hasMany(RespuestaSalaPvP, {
  foreignKey: 'id_sala',
  as: 'respuestas'
});

RespuestaSalaPvP.belongsTo(ParticipanteSala, {
  foreignKey: 'id_estudiante',
  targetKey: 'id_estudiante',
  as: 'participante'
});

export {
  SalaPrivada,
  ParticipanteSala,
  RespuestaSalaPvP,
  PreguntasSala
};