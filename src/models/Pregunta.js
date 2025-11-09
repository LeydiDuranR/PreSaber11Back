import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Area from "./Area.js";
import Tema from "./Tema.js";

export const Pregunta = db.define( "pregunta", {
        id_pregunta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        enunciado: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imagen: {
            type: DataTypes.STRING(250),
            allowNull: true,
        },
        nivel_dificultad: {
            type: DataTypes.STRING(20),
            allowNull: false,
        }
    },
    {
        timestamps: false,
        freezeTableName: true
    }
);

// Relacion con area
Area.hasMany(Pregunta, {
    foreignKey: "id_area",
});
Pregunta.belongsTo(Area, {
    foreignKey: "id_area",
});


//Relacion con tema

Tema.hasMany(Pregunta, {
    foreignKey: "id_tema",
});
Pregunta.belongsTo(Tema, {
    foreignKey: "id_tema",
});

export default Pregunta;
