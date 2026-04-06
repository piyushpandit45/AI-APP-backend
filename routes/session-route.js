import express from "express";
import {
  createSession,
  getMySessions,
  getSessionById,
  updateSession,
  deleteSession,
} from "../controller/session-controller.js";
import { protect } from "../middlewares/auth-middleware.js";

const router = express.Router();

router.post("/create", protect, createSession);
router.get("/my-sessions", protect, getMySessions);
router.get("/:id", protect, getSessionById);
router.put("/:id", protect, updateSession);
router.delete("/:id", protect, deleteSession);

export default router;
