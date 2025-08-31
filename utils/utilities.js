import jwt from "jsonwebtoken";
import { LETTERS } from "./constant.js";
// create a function to generat a json web token
export function generateAuthToken(user) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return token;
}


/**
 * Helper to normalize options into { key, text, isCorrect }
 * Accepts options as:
 *  - ["t1","t2"]
 *  - [{ text: "t1", isCorrect: true }, { key: "C", text: "t2" }]
 */
export const normalizeOptions = (options) => {
  return options.map((opt, idx) => {
    if (typeof opt === "string") {
      return { key: LETTERS[idx], text: opt, isCorrect: false };
    }
    return {
      key: opt.key || LETTERS[idx],
      text: opt.text || "",
      isCorrect: !!opt.isCorrect,
    };
  });
};