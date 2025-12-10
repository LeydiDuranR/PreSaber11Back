import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Reto from "./Reto.js";
import Usuario from "./Usuario.js";
import Opcion from "./Opcion.js";

const RespuestasReto = db.define("respuestas_reto", {
    id_respuestas_reto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    }
  },
  {
    timestamps: false,
    freezeTableName: true
  }
);

// Relacion con Reto
Reto.hasMany(RespuestasReto, {
  foreignKey: "id_reto",
}); 

RespuestasReto.belongsTo(Reto, {
    foreignKey: "id_reto",
});

// Relacion con Estudiante
Usuario.hasMany(RespuestasReto, {
  foreignKey: "id_estudiante",
});

RespuestasReto.belongsTo(Usuario, {
    foreignKey: "id_estudiante",
});

// Relacion con Opcion
Opcion.hasMany(RespuestasReto, {
    foreignKey: "id_opcion",
    as: "respuestas_reto"
});
RespuestasReto.belongsTo(Opcion, {
    foreignKey: "id_opcion",
    as: "opcion"
});

export default RespuestasReto;
