import { DataTypes } from "sequelize";
import db from "../db/db.js";
import SesionArea from "./SesionArea.js";
import ResultadoSesion from "./ResultadoSesion.js";

const ResultadoArea = db.define("resultado_area", {
    id_resultado_area: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    correctas: { type: DataTypes.INTEGER, allowNull: false },
    incorrectas: { type: DataTypes.INTEGER, allowNull: false },
    // puntaje_area: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: "resultado_area",
    timestamps: false
});

//relaciones

SesionArea.hasMany(ResultadoArea, { foreignKey: "id_sesion_area", as: "resultado" });
ResultadoArea.belongsTo(SesionArea, { foreignKey: "id_sesion_area", as: "sesion_area" });


ResultadoSesion.hasMany(ResultadoArea, { foreignKey: "id_resultado_sesion", as: "areas" });
ResultadoArea.belongsTo(ResultadoSesion, { foreignKey: "id_resultado_sesion", as: "resultado_sesion" });


export default ResultadoArea;
