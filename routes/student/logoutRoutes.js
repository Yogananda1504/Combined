/**
 * @module routes/logoutRoutes
 * @file Routes for handling user logout operations.
 */
import { Router } from "express";
import logoutController from "../../controllers/student/logoutController.js";

const router = Router();

/**
 * @route POST /logout
 * @desc Logout user
 * @access Private
 */
router.post("/", logoutController);

export default router;