import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Area from "./Area.js";

const Tema = db.define("tema", {
  id_tema: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.STRING(100),
    allowNull: false,
  }
}, {
  timestamps: false,
  freezeTableName: true,
});

// Relacion con area
Area.hasMany(Tema, {
  foreignKey: "id_area",
});

Tema.belongsTo(Area, {
  foreignKey: "id_area",
});

export default Tema;
