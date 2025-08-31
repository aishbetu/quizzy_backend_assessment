// routes/attemptRoutes.js
import express from "express";
import {
  submitAttempt,
  listMyAttempts,
  getAttemptDetail,
  reportUserPerformance,
  reportSkillAverages,
} from "../controllers/AttemptController.js";
import { verifyRole } from "../middleware/authMiddleware.js";
import { adminRole, userRole } from "../utils/constant.js";


const router = express.Router();

// User routes (must be logged in)
router.post("/submit", verifyRole(userRole), submitAttempt);
router.get("/my", verifyRole(userRole), listMyAttempts);
router.get("/:id", verifyRole(userRole), getAttemptDetail);

// Admin reports (protect via verifyRole)
router.get("/reports/user-performance", verifyRole(adminRole), reportUserPerformance);
router.get("/reports/skill-averages", verifyRole(adminRole), reportSkillAverages);

export default router;
