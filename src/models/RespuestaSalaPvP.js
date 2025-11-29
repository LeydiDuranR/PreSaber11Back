import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import SalaPrivada from './SalaPrivada.js';
import Usuario from './Usuario.js';
import Pregunta from './Pregunta.js';
import Opcion from './Opcion.js';

const RespuestaSalaPvP = db.define('respuesta_sala_pvp', {
  id_respuesta_pvp: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_sala: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_estudiante: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  id_pregunta: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_opcion: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  es_correcta: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  tiempo_respuesta_segundos: {
    type: DataTypes.INTEGER,
    comment: 'Tiempo que tardó en responder esta pregunta'
  },
  fecha_respuesta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'respuesta_sala_pvp',
  timestamps: false,
  freezeTableName: true
});

// Relación con SalaPrivada
SalaPrivada.hasMany(RespuestaSalaPvP, {
  foreignKey: 'id_sala',
  as: 'respuestas'
});
RespuestaSalaPvP.belongsTo(SalaPrivada, {
  foreignKey: 'id_sala',
  as: 'sala'
});

// Relación con Usuario (Estudiante)
Usuario.hasMany(RespuestaSalaPvP, {
  foreignKey: 'id_estudiante',
  sourceKey: 'documento',
  as: 'respuestas_pvp'
});
RespuestaSalaPvP.belongsTo(Usuario, {
  foreignKey: 'id_estudiante',
  targetKey: 'documento',
  as: 'estudiante'
});

// Relación con Pregunta
Pregunta.hasMany(RespuestaSalaPvP, {
  foreignKey: 'id_pregunta',
  as: 'respuestas_pvp'
});
RespuestaSalaPvP.belongsTo(Pregunta, {
  foreignKey: 'id_pregunta',
  as: 'pregunta'
});

// Relación con Opcion
Opcion.hasMany(RespuestaSalaPvP, {
  foreignKey: 'id_opcion',
  as: 'respuestas_pvp'
});
RespuestaSalaPvP.belongsTo(Opcion, {
  foreignKey: 'id_opcion',
  as: 'opcion'
});

export default RespuestaSalaPvP;