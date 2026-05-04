// routes/hero.routes.js
import express from "express";
const router = express.Router();

import { getAllVideo } from "../../controller/heroSection.controller.js";

// GET /api/hero-section
router.get("/video", getAllVideo);

export default router;
