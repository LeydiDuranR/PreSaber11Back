import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import Usuario from './Usuario.js';
import Area from './Area.js';

const SalaPrivada = db.define('sala_privada', {
  id_sala: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo_sala: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false,
    comment: 'Código único para unirse (ej: AYC-7842)'
  },
  id_creador: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Documento del estudiante que creó la sala'
  },
  id_area: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nivel_dificultad: {
    type: DataTypes.ENUM('bajo', 'medio', 'alto'),
    allowNull: false
  },
  duracion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
    comment: 'Duración en minutos'
  },
  cantidad_preguntas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 25
  },
  estado: {
    type: DataTypes.ENUM('esperando', 'en_curso', 'finalizada', 'cancelada'),
    defaultValue: 'esperando'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_finalizacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expira_en: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Fecha de expiración si no se llena (10 minutos)'
  }
}, {
  tableName: 'sala_privada',
  timestamps: false,
  freezeTableName: true
});

// Relación con Area
Area.hasMany(SalaPrivada, {
  foreignKey: 'id_area'
});
SalaPrivada.belongsTo(Area, {
  foreignKey: 'id_area',
  as: 'area'
});

// Relación con Usuario (Creador)
Usuario.hasMany(SalaPrivada, {
  foreignKey: 'id_creador',
  as: 'salas_creadas'
});
SalaPrivada.belongsTo(Usuario, {
  foreignKey: 'id_creador',
  as: 'creador'
});

export default SalaPrivada;