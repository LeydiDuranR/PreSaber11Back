import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import SimulacroGrupal from './SimulacroGrupal.js';
import Usuario from './Usuario.js';

const ParticipanteSimulacro = db.define('participante_simulacro', {
  id_participante_simulacro: {
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
  posicion_final: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Posición en el podio (1, 2, 3, etc.)'
  },
  estado_jugador: {
    type: DataTypes.ENUM('esperando', 'jugando', 'finalizado', 'abandonó'),
    defaultValue: 'esperando'
  },
  preguntas_respondidas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  preguntas_correctas: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  puntaje_final: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  experiencia_ganada: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  fecha_union: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_finalizacion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'participante_simulacro',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_simulacro', 'id_estudiante']
    }
  ]
});

// Relación con SimulacroGrupal
SimulacroGrupal.hasMany(ParticipanteSimulacro, {
  foreignKey: 'id_simulacro',
  as: 'participantes'
});
ParticipanteSimulacro.belongsTo(SimulacroGrupal, {
  foreignKey: 'id_simulacro',
  as: 'simulacro'
});

// Relación con Usuario (Estudiante)
Usuario.hasMany(ParticipanteSimulacro, {
  foreignKey: 'id_estudiante',
  sourceKey: 'documento',
  as: 'participaciones_simulacro'
});
ParticipanteSimulacro.belongsTo(Usuario, {
  foreignKey: 'id_estudiante',
  targetKey: 'documento',
  as: 'estudiante'
});

export default ParticipanteSimulacro;