import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Pregunta from "./Pregunta.js";
import Reto from "./Reto.js";

const RetoPregunta = db.define(
    "reto_pregunta",
    {
        id_pregunta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: Pregunta,
                key: "id_pregunta",
            },
        },
        id_reto: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            references: {
                model: Reto,
                key: "id_reto",
            },
        },
    },
    {
        timestamps: false,
        freezeTableName: true,
    }
);

export default RetoPregunta;
