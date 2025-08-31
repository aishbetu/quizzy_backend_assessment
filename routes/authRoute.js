import express from "express";
import { get_users, login, register } from "../controllers/AuthController.js";
import { verifyRole } from "../middleware/authMiddleware.js";
import { adminRole } from "../utils/constant.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/users", verifyRole(adminRole), get_users);

export default router;
