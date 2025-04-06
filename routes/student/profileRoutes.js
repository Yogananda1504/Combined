/**
 * @module routes/profileRoutes
 * @file Routes for handling profile-related operations.
 */
import { Router } from "express";
import { getProfileDetails } from "../../controllers/student/profileController.js";
import { protect } from "../../middleware/student/protect.js";
const router = Router();

/**
 * @route GET /profile
 * @desc Get profile details
 * @access Private
 */
router.get("/", protect, getProfileDetails);

export default router;