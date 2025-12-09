import { DataTypes } from "sequelize";
import db from "../db/db.js";
import Usuario from "./Usuario.js";
import Sesion from "./Sesion.js";
import Pregunta from "./Pregunta.js";


const ProgresoSesion = db.define("progreso_sesion", {
    id_progreso_sesion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    completada: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    fecha_inicio: {
        type: DataTypes.DATE, // Cuándo empezó
        allowNull: true
    },
    ultima_actualizacion: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: "progreso_sesion",
    timestamps: false,
    freezeTableName: true
});

Usuario.hasMany(ProgresoSesion, { foreignKey: "id_usuario" });
ProgresoSesion.belongsTo(Usuario, { foreignKey: "id_usuario" });

Sesion.hasMany(ProgresoSesion, { foreignKey: "id_sesion" });
ProgresoSesion.belongsTo(Sesion, { foreignKey: "id_sesion"});


Pregunta.hasMany(ProgresoSesion, { foreignKey: "ultima_pregunta" });
ProgresoSesion.belongsTo(Pregunta, { foreignKey: "ultima_pregunta" });

export default ProgresoSesion;
