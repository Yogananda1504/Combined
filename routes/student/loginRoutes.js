/**
 * @module routes/loginRoutes
 * @description Routes for handling user authentication and login.
 */

import { Router } from "express";
import authController from "../../controllers/student/authController.js";
const router = Router();

/**
 * Authenticate user and get token.
 * @function
 * @memberof module:routes/loginRoutes
 * @name postLogin
 * @route POST /login
 * @access Public
 */
router.post("/", authController);

export default router;