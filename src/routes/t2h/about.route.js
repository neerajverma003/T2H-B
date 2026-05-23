import express from "express";
import { getAboutPageData } from "../../controller/about.controller.js";

const router = express.Router();

// Public route to fetch dynamically loaded About Page details
router.get("/about", getAboutPageData);

export default router;
