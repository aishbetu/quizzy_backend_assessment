import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Skill = sequelize.define(
  "Skill",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "skills",
    timestamps: true,
  }
);

export default Skill;
