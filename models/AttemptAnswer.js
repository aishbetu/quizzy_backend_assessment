import { DataTypes } from "sequelize";
import QuizAttempt from "./QuizAttempt.js";
import Question from "./Question.js";
import Option from "./Option.js";
import sequelize from "../database/db.js";

const AttemptAnswer = sequelize.define(
  "AttemptAnswer",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    attemptId: { type: DataTypes.INTEGER, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    chosenOptionIds: { type: DataTypes.JSON, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
    pointsAwarded: { type: DataTypes.FLOAT, defaultValue: 0 },
  },
  {
    tableName: "attempt_answers",
    timestamps: true,
  }
);

AttemptAnswer.belongsTo(QuizAttempt, { foreignKey: "attemptId", as: "attempt", onDelete: "CASCADE" });
QuizAttempt.hasMany(AttemptAnswer, { foreignKey: "attemptId", as: "answers" });

AttemptAnswer.belongsTo(Question, { foreignKey: "questionId", as: "question" });
Question.hasMany(AttemptAnswer, { foreignKey: "questionId", as: "attemptAnswers" });

export default AttemptAnswer;
