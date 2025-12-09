import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import SimulacroGrupal from './SimulacroGrupal.js';
import Usuario from './Usuario.js';
import Pregunta from './Pregunta.js';
import Opcion from './Opcion.js';

const RespuestaSimulacro = db.define('respuesta_simulacro', {
  id_respuesta_simulacro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_simulacro: {
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
    comment: 'Tiempo que tardó en responder'
  },
  fecha_respuesta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'respuesta_simulacro',
  timestamps: false,
  freezeTableName: true
});

// Relación con SimulacroGrupal
SimulacroGrupal.hasMany(RespuestaSimulacro, {
  foreignKey: 'id_simulacro',
  as: 'respuestas'
});
RespuestaSimulacro.belongsTo(SimulacroGrupal, {
  foreignKey: 'id_simulacro',
  as: 'simulacro'
});

// Relación con Usuario (Estudiante)
Usuario.hasMany(RespuestaSimulacro, {
  foreignKey: 'id_estudiante',
  sourceKey: 'documento',
  as: 'respuestas_simulacro'
});
RespuestaSimulacro.belongsTo(Usuario, {
  foreignKey: 'id_estudiante',
  targetKey: 'documento',
  as: 'estudiante'
});

// Relación con Pregunta
Pregunta.hasMany(RespuestaSimulacro, {
  foreignKey: 'id_pregunta',
  as: 'respuestas_simulacro'
});
RespuestaSimulacro.belongsTo(Pregunta, {
  foreignKey: 'id_pregunta',
  as: 'pregunta'
});

// Relación con Opcion
Opcion.hasMany(RespuestaSimulacro, {
  foreignKey: 'id_opcion',
  as: 'respuestas_simulacro'
});
RespuestaSimulacro.belongsTo(Opcion, {
  foreignKey: 'id_opcion',
  as: 'opcion'
});

export default RespuestaSimulacro;