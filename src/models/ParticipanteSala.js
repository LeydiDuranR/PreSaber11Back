import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import SalaPrivada from './SalaPrivada.js';
import Usuario from './Usuario.js';

const ParticipanteSala = db.define('participante_sala', {
  id_participante_sala: {
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
  posicion: {
    type: DataTypes.INTEGER,
    comment: 'Orden de llegada: 1 o 2'
  },
  estado_jugador: {
    type: DataTypes.ENUM('esperando', 'listo', 'jugando', 'finalizado', 'abandonó'),
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
  tableName: 'participante_sala',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_sala', 'id_estudiante']
    }
  ]
});

// Relación con SalaPrivada
SalaPrivada.hasMany(ParticipanteSala, {
  foreignKey: 'id_sala',
  as: 'participantes'
});
ParticipanteSala.belongsTo(SalaPrivada, {
  foreignKey: 'id_sala',
  as: 'sala'
});

// Relación con Usuario (Estudiante)
Usuario.hasMany(ParticipanteSala, {
  foreignKey: 'id_estudiante',
  sourceKey: 'documento',
  as: 'participaciones_pvp'
});
ParticipanteSala.belongsTo(Usuario, {
  foreignKey: 'id_estudiante',
  targetKey: 'documento',
  as: 'estudiante'
});

export default ParticipanteSala;