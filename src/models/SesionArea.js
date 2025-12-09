import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Area from "./Area.js";
import Sesion from "./Sesion.js";

const SesionArea = db.define("sesion_area", {
    id_sesion_area: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cantidad_preguntas: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    orden_area: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // ponderacion: {
    //     type: DataTypes.INTEGER
    // }
}, {
    tableName: "sesion_area",
    timestamps: false,
    freezeTableName: true
});

// Relaciones
Area.hasMany(SesionArea, { foreignKey: "id_area" });
SesionArea.belongsTo(Area, { foreignKey: "id_area" });

Sesion.hasMany(SesionArea, { foreignKey: "id_sesion" });
SesionArea.belongsTo(Sesion, { foreignKey: "id_sesion" });

export default SesionArea;
