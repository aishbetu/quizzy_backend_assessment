import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";
import Question from "./Question.js";

const Option = sequelize.define(
  "Option",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(2), allowNull: false },     // "A","B","C","D"
    text: { type: DataTypes.TEXT, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "options",
    timestamps: true,
  }
);

Option.belongsTo(Question, { foreignKey: "questionId", as: "question", onDelete: "CASCADE" });
Question.hasMany(Option, { foreignKey: "questionId", as: "options" });

export default Option;
