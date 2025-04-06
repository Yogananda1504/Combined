import { getDashboardData } from "../../controllers/admin/DashboardController.js";
import { Router } from "express";
import protect from "../../middleware/admin/protect.js";

const router = Router();

router.get("/",getDashboardData);

export default router