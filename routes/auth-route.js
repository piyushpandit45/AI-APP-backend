import express from "express";
import { loginUser, registerUser } from "../controller/auth-controller.js";

const router = express.Router();

// Auth Routes
router.post("/signup", registerUser); // Register User
router.post("/login", loginUser); // Login User

export default router;
