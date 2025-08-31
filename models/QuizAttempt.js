import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";
import Skill from "./Skill.js";
import User from "./User.js";

const QuizAttempt = sequelize.define(
  "QuizAttempt",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    skillId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.FLOAT, defaultValue: 0 },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: true }, 
    meta: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "quiz_attempts",
    timestamps: true,
  }
);


QuizAttempt.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "SET NULL" });
User.hasMany(QuizAttempt, { foreignKey: "userId", as: "attempts" });

QuizAttempt.belongsTo(Skill, { foreignKey: "skillId", as: "skill" });
Skill.hasMany(QuizAttempt, { foreignKey: "skillId", as: "attempts" });

export default QuizAttempt;