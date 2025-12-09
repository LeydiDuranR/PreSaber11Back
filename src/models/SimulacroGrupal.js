import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import Usuario from './Usuario.js';

const SimulacroGrupal = db.define('simulacro_grupal', {
  id_simulacro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_docente: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Documento del docente que crea el simulacro'
  },
  grado: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  grupo: {
    type: DataTypes.STRING(2),
    allowNull: false
  },
  cohorte: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_institucion: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad_preguntas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 10
    }
  },
  duracion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 10
    }
  },
  estado: {
    type: DataTypes.ENUM('esperando', 'en_curso', 'finalizado', 'cancelado'),
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
  }
}, {
  tableName: 'simulacro_grupal',
  timestamps: false,
  freezeTableName: true
});

Usuario.hasMany(SimulacroGrupal, {
  foreignKey: 'id_docente',
  sourceKey: 'documento',
  as: 'simulacros_creados'
});

SimulacroGrupal.belongsTo(Usuario, {
  foreignKey: 'id_docente',
  targetKey: 'documento',
  as: 'docente'
});


export default SimulacroGrupal;
