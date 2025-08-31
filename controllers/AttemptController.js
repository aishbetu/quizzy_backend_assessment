// controllers/attemptController.js
import sequelize from "../database/db.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AttemptAnswer from "../models/AttemptAnswer.js";
import Question from "../models/Question.js";
import Option from "../models/Option.js";
import Skill from "../models/Skill.js";
import { Op } from "sequelize";

/**
 * Helper: compare two arrays as sets (order doesn't matter)
 */
const sameSet = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const sa = new Set(a.map(String));
  for (const x of b) if (!sa.has(String(x))) return false;
  return true;
};

/**
 * POST /api/attempts/submit
 * body:
 * {
 *   "skillId": 5,
 *   "startedAt": 169xxx,     // optional epoch ms
 *   "finishedAt": 169xxx,    // optional epoch ms
 *   "answers": [
 *     { "questionId": 10, "chosenOptionIds": [21] },
 *     { "questionId": 11, "chosenOptionIds": [25,26] }
 *   ]
 * }
 */
export const submitAttempt = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { skillId, startedAt, finishedAt, answers } = req.body;

    if (!skillId) {
      await t.rollback();
      return res.status(400).json({ error: "skillId is required" });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: "answers array is required" });
    }

    // validate skill exists
    const skill = await Skill.findByPk(skillId);
    if (!skill) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid skillId" });
    }

    // Create attempt placeholder
    const attempt = await QuizAttempt.create(
      {
        userId,
        skillId,
        score: 0,
        meta: { startedAt: startedAt ?? null, finishedAt: finishedAt ?? null },
      },
      { transaction: t }
    );

    let totalScore = 0;
    const perQuestionResults = [];

    // Fetch questions in batch to avoid N queries
    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.findAll({
      where: { id: { [Op.in]: questionIds } },
      include: [{ model: Option, as: "options" }],
      transaction: t,
    });

    const questionMap = new Map();
    for (const q of questions) questionMap.set(q.id, q);

    // process each answer
    for (const a of answers) {
      const { questionId, chosenOptionIds } = a;
      const question = questionMap.get(questionId);
      if (!question) {
        // If question not found -> mark incorrect, 0 points
        await AttemptAnswer.create(
          {
            attemptId: attempt.id,
            questionId,
            chosenOptionIds: chosenOptionIds || [],
            isCorrect: false,
            pointsAwarded: 0,
          },
          { transaction: t }
        );
        perQuestionResults.push({ questionId, isCorrect: false, pointsAwarded: 0 });
        continue;
      }

      // determine correct option ids from Question.options
      const correctOptionIds = (question.options || []).filter((o) => o.isCorrect).map((o) => o.id);

      // Basic checks
      const chosen = Array.isArray(chosenOptionIds) ? chosenOptionIds.map(Number) : [];

      // For single type, ensure single choice
      if (question.type === "single" && chosen.length !== 1) {
        await AttemptAnswer.create(
          {
            attemptId: attempt.id,
            questionId,
            chosenOptionIds: chosen,
            isCorrect: false,
            pointsAwarded: 0,
          },
          { transaction: t }
        );
        perQuestionResults.push({ questionId, isCorrect: false, pointsAwarded: 0 });
        continue;
      }

      // Determine correctness: exact set match => full credit
      const isCorrect = sameSet(chosen, correctOptionIds);

      const pointsAwarded = isCorrect ? Number(question.points || 0) : 0;

      await AttemptAnswer.create(
        {
          attemptId: attempt.id,
          questionId,
          chosenOptionIds: chosen,
          isCorrect,
          pointsAwarded,
        },
        { transaction: t }
      );

      totalScore += pointsAwarded;
      perQuestionResults.push({ questionId, isCorrect, pointsAwarded, chosen, correctOptionIds });
    }

    // compute durationSeconds if both timestamps provided
    let durationSeconds = null;
    if (startedAt && finishedAt) {
      const dur = Math.max(0, Number(finishedAt) - Number(startedAt));
      durationSeconds = Math.round(dur / 1000);
    }

    // update attempt with score and duration
    attempt.score = totalScore;
    if (durationSeconds !== null) attempt.durationSeconds = durationSeconds;
    await attempt.save({ transaction: t });

    await t.commit();

    // Return attempt summary (do NOT include correctOptionIds in production if returning to client — but show here for admin)
    return res.status(201).json({
      message: "Attempt submitted",
      attemptId: attempt.id,
      score: totalScore,
      durationSeconds,
      perQuestionResults,
    });
  } catch (err) {
    await t.rollback();
    console.error("submitAttempt err:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * GET /api/attempts/my
 * List attempts belonging to current user (paginated optional)
 */
export const listMyAttempts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const attempts = await QuizAttempt.findAll({
      where: { userId },
      include: [{ model: Skill, as: "skill", attributes: ["id", "title"] }],
      order: [["createdAt", "DESC"]],
      limit: 100,
    });

    return res.json({ attempts });
  } catch (err) {
    console.error("listMyAttempts err:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * GET /api/attempts/:id
 * Get attempt detail (owner or admin)
 */
export const getAttemptDetail = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const attempt = await QuizAttempt.findByPk(attemptId, {
      include: [
        { model: AttemptAnswer, as: "answers" },
        { model: Skill, as: "skill", attributes: ["id", "title"] },
      ],
    });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    // allow owner or admin
    const requester = req.user;
    if (requester.id !== attempt.userId && requester.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json({ attempt });
  } catch (err) {
    console.error("getAttemptDetail err:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * ---- Reports (admin) ----
 * - user-wise performance
 * - skill-level averages
 * - time-based filters
 *
 * These examples use raw SQL (fast) but you can convert to Sequelize aggregated queries.
 */

/**
 * GET /api/attempts/reports/user-performance?userId=1&from=2025-01-01&to=2025-08-01
 */
export const reportUserPerformance = async (req, res) => {
  try {
    // admin-only route should be protected via verifyRole("admin")
    const { userId, from, to } = req.query;
    const replacements = { userId: Number(userId) || null, from: from || null, to: to || null };
    let where = `WHERE 1=1`;
    if (replacements.userId) where += ` AND qa."userId" = :userId`;
    if (from) where += ` AND qa."createdAt" >= :from`;
    if (to) where += ` AND qa."createdAt" <= :to`;

    const sql = `
      SELECT qa."userId",
             COUNT(*) AS attempts,
             AVG(qa.score) AS avgScore,
             MIN(qa.score) AS minScore,
             MAX(qa.score) AS maxScore
      FROM quiz_attempts qa
      ${where}
      GROUP BY qa."userId";
    `;

    const [rows] = await sequelize.query(sql, { replacements });
    return res.json({ report: rows });
  } catch (err) {
    console.error("reportUserPerformance err:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

/**
 * GET /api/attempts/reports/skill-averages?from=2025-01-01&to=2025-08-01
 */
export const reportSkillAverages = async (req, res) => {
  try {
    const { from, to } = req.query;
    const replacements = { from: from || null, to: to || null };
    let where = `WHERE 1=1`;
    if (from) where += ` AND qa."createdAt" >= :from`;
    if (to) where += ` AND qa."createdAt" <= :to`;

    const sql = `
      SELECT s.id AS "skillId", s.title AS "skill",
             COUNT(qa.id) AS attempts,
             AVG(qa.score) AS avgScore
      FROM quiz_attempts qa
      JOIN skills s ON s.id = qa."skillId"
      ${where}
      GROUP BY s.id, s.title
      ORDER BY avgScore ASC;
    `;

    const [rows] = await sequelize.query(sql, { replacements });
    return res.json({ report: rows });
  } catch (err) {
    console.error("reportSkillAverages err:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};
