import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";
import Skill from "./Skill.js";

const Question = sequelize.define(
  "Question",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    questionText: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.ENUM("single", "multiple", "text"), allowNull: false, defaultValue: "single" },
    points: { type: DataTypes.INTEGER, defaultValue: 1 },
  },
  {
    tableName: "questions",
    timestamps: true,
  }
);

Question.belongsTo(Skill, { foreignKey: "skillId", as: "skill", onDelete: "CASCADE" });
Skill.hasMany(Question, { foreignKey: "skillId", as: "questions" });

export default Question;
