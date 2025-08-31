import express from "express";
import {verifyRole}  from "../middleware/authMiddleware.js";
import { adminRole, userRole } from "../utils/constant.js";
import { addSkill, deleteSkill, getAllSkills, updateSkill } from "../controllers/SkillController.js";
const router = express.Router();

router.post("/", verifyRole(adminRole), addSkill);
router.put("/:id", verifyRole(adminRole), updateSkill);
router.delete("/:id", verifyRole(adminRole), deleteSkill);
router.get("/", verifyRole(userRole, adminRole), getAllSkills);

export default router;
