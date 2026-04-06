import express from "express";
import { createContact, getContacts } from "../controller/contact-controller.js";

const router = express.Router();

// POST /api/contact - Create new contact message (Public)
router.post("/", createContact);

// GET /api/contact - Get all contact messages (Admin only)
router.get("/", getContacts);

export default router;
