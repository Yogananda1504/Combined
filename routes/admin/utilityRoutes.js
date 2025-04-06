import { Router } from "express";
import protect from "../../middleware/admin/protect.js";
import {
	serve_complaint,
	serve_logs,
} from "../../controllers/admin/utilityController.js";
const router = Router();

// The main purpose of this file is to serve the log files for the Respective Categories

router.get("/:category", protect, serve_complaint);
router.post("/log/:category", protect, serve_logs);

// Changed export from default to a named export "utilityRoutes"
export const utilityRoutes = router;
