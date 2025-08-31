import express from "express";
import { createQuestion, deleteQuestion, listQuestions, updateQuestion } from "../controllers/QuestionController.js";
import { verifyRole } from "../middleware/authMiddleware.js";
import { adminRole, userRole } from "../utils/constant.js";

const router = express.Router();

router.post("/", verifyRole(adminRole), createQuestion);
router.put("/:id", verifyRole(adminRole), updateQuestion);
router.delete("/:id", verifyRole(adminRole), deleteQuestion);
router.get("/", verifyRole(userRole, adminRole), listQuestions);

export default router;
