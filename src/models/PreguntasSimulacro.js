import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import SimulacroGrupal from './SimulacroGrupal.js';
import Pregunta from './Pregunta.js';

const PreguntasSimulacro = db.define('preguntas_simulacro', {
  id_pregunta_simulacro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_simulacro: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_pregunta: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Orden de aparición (1 a N)'
  }
}, {
  tableName: 'preguntas_simulacro',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_simulacro', 'id_pregunta']
    }
  ]
});

// Relación con SimulacroGrupal
SimulacroGrupal.hasMany(PreguntasSimulacro, {
  foreignKey: 'id_simulacro',
  as: 'preguntas_asignadas'
});
PreguntasSimulacro.belongsTo(SimulacroGrupal, {
  foreignKey: 'id_simulacro',
  as: 'simulacro'
});

// Relación con Pregunta
Pregunta.hasMany(PreguntasSimulacro, {
  foreignKey: 'id_pregunta',
  as: 'simulacros_asignados'
});
PreguntasSimulacro.belongsTo(Pregunta, {
  foreignKey: 'id_pregunta',
  as: 'pregunta'
});

export default PreguntasSimulacro;