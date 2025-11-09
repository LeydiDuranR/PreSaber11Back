import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Pregunta from "./Pregunta.js";

export const Opcion = db.define("opcion", {
    id_opcion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    texto_opcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    imagen: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    es_correcta: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }
},
    {
        tableName: "opcion",
        timestamps: false,
    }
);

// Relación con Pregunta
Pregunta.hasMany(Opcion, { foreignKey: "id_pregunta" });
Opcion.belongsTo(Pregunta, { foreignKey: "id_pregunta" });


export default Opcion;