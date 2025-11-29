import { DataTypes } from 'sequelize';
import db from '../db/db.js';
import SalaPrivada from './SalaPrivada.js';
import Pregunta from './Pregunta.js';

const PreguntasSala = db.define('preguntas_sala', {
  id_pregunta_sala: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_sala: {
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
    comment: 'Orden de aparición en el quiz (1 a N)'
  }
}, {
  tableName: 'preguntas_sala',
  timestamps: false,
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_sala', 'id_pregunta']
    }
  ]
});

// Relación con SalaPrivada
SalaPrivada.hasMany(PreguntasSala, {
  foreignKey: 'id_sala',
  as: 'preguntas_asignadas'
});
PreguntasSala.belongsTo(SalaPrivada, {
  foreignKey: 'id_sala',
  as: 'sala'
});

// Relación con Pregunta
Pregunta.hasMany(PreguntasSala, {
  foreignKey: 'id_pregunta',
  as: 'salas_asignadas'
});
PreguntasSala.belongsTo(Pregunta, {
  foreignKey: 'id_pregunta',
  as: 'pregunta'
});

export default PreguntasSala;