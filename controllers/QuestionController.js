import sequelize from "../database/db.js";
import Option from "../models/Option.js";
import Question from "../models/Question.js";
import Skill from "../models/Skill.js";
import { normalizeOptions } from "../utils/utilities.js";

export const createQuestion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      skillId,
      questionText,
      type = "single",
      options = [],
      points,
    } = req.body;

    const skill = await Skill.findByPk(skillId);
    if (!skill) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid skillId" });
    }

    // Validate type
    if (!["single", "multiple", "text"].includes(type)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid question type" });
    }

    // For non-text questions options required (2..4)
    if (type !== "text") {
      if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "Options must be an array of 2..4 items" });
      }
    }
    // Create Question
    const question = await Question.create(
      {
        skillId,
        questionText,
        type,
        points: points || 1,
      },
      { transaction: t }
    );
    // Create Options if needed
    if (type !== "text") {
      const normalized = normalizeOptions(options);

      // Validation: single -> exactly 1 correct; multiple -> at least 1 correct
      const correctCount = normalized.filter((o) => o.isCorrect).length;
      if (type === "single" && correctCount !== 1) {
        await t.rollback();
        return res.status(400).json({
          error:
            "single questions must have exactly 1 option with isCorrect=true",
        });
      }
      if (type === "multiple" && correctCount < 1) {
        await t.rollback();
        return res.status(400).json({
          error: "multiple questions must have at least 1 correct option",
        });
      }
      const optionRecords = normalized.map((o) => ({
        questionId: question.id,
        key: o.key,
        text: o.text,
        isCorrect: o.isCorrect,
      }));
      await Option.bulkCreate(optionRecords, { transaction: t });
    }
    await t.commit();
    // Return created question with options (admin view includes isCorrect)
    const created = await Question.findByPk(question.id, {
      include: [
        {
          model: Option,
          as: "options",
          attributes: ["id", "key", "text", "isCorrect"],
        },
      ],
    });
    return res
      .status(201)
      .json({ message: "Question created", question: created });
  } catch (error) {
    console.error("Error creating question:", error);
    await t.rollback();
    res.status(500).json({ error: "Failed to create question" });
  }
};

export const updateQuestion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const questionId = req.params.id;
    const { questionText, type, points, options } = req.body;
    const question = await Question.findByPk(questionId);
    if (!question) {
      await t.rollback();
      return res.status(404).json({ error: "Question not found" });
    }
    // Only update core fields
    if (questionText !== undefined) question.questionText = questionText;
    if (type !== undefined && ["single", "multiple", "text"].includes(type))
      question.type = type;
    if (points !== undefined) question.points = points;
    await question.save({ transaction: t });
    // If options provided, replace existing options atomically
    if (Array.isArray(options)) {
      if (question.type === "text") {
        // text question should not have options
        await Option.destroy({
          where: { questionId: question.id },
          transaction: t,
        });
      } else {
        if (options.length < 2 || options.length > 4) {
          await t.rollback();
          return res
            .status(400)
            .json({ error: "Options must be array of 2..4 items" });
        }
        const normalized = normalizeOptions(options);
        const correctCount = normalized.filter((o) => o.isCorrect).length;
        if (question.type === "single" && correctCount !== 1) {
          await t.rollback();
          return res.status(400).json({
            error: "single questions must have exactly 1 correct option",
          });
        }
        if (question.type === "multiple" && correctCount < 1) {
          await t.rollback();
          return res.status(400).json({
            error: "multiple questions must have at least 1 correct option",
          });
        }
        // Delete old options, insert new ones
        await Option.destroy({
          where: { questionId: question.id },
          transaction: t,
        });
        const optionRecords = normalized.map((o) => ({
          questionId: question.id,
          key: o.key,
          text: o.text,
          isCorrect: o.isCorrect,
        }));
        await Option.bulkCreate(optionRecords, { transaction: t });
      }
    }
    await t.commit();
    const updated = await Question.findByPk(question.id, {
      include: [
        {
          model: Option,
          as: "options",
          attributes: ["id", "key", "text", "isCorrect"],
        },
      ],
    });
    return res.json({ message: "Question updated", question: updated });
  } catch (error) {
    await t.rollback();
    console.error("updateQuestion err:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

export const deleteQuestion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const questionId = req.params.id;
    const question = await Question.findByPk(questionId);
    if (!question) {
      await t.rollback();
      return res.status(404).json({ error: "Question not found" });
    }
    await Option.destroy({ where: { questionId }, transaction: t });
    await question.destroy({ transaction: t });
    await t.commit();
    return res.json({ message: "Question deleted" });
  } catch (error) {
    await t.rollback();
    console.error("deleteQuestion err:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};

export const listQuestions = async (req, res) => {
  try {
    const { skillId } = req.query;
    const where = {};
    if (skillId) where.skillId = skillId;
    const questions = await Question.findAll({
      where,
      include: [
        {
          model: Option,
          as: "options",
          attributes: ["id", "key", "text", "isCorrect"],
        },
        { model: Skill, as: "skill", attributes: ["id", "title"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ questions });
  } catch (error) {
    console.error("listQuestions err:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
};
