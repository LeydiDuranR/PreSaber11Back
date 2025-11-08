import db from "../db/db.js";
import { DataTypes } from "sequelize";

const Participante = db.define("participante", {
    documento_participante: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false
    },
    grado: {
        type: DataTypes.STRING(2),
        primaryKey: true,
        allowNull: false
    },
    grupo: {
        type: DataTypes.STRING(2),
        primaryKey: true,
        allowNull: false
    },
    cohorte: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true
});

export default Participante;
