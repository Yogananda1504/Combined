/**
 * @module routes/complainRoutes
 * @file Routes for managing complaints, including registration, retrieval, updating, and deletion.
 */
import { Router } from "express";
import {
    registerComplain,
    updateComplaints,
    getComplaints,
    deleteComplaints,
    getComplaintsByDate_main
} from "../../controllers/student/complainControllers.js";
import { protect } from "../../middleware/student/protect.js";
import {searchController} from "../../controllers/student/searchController.js";

import handleFileUpload from "../../middleware/student/uploadFile.js";
import dotenv from "dotenv";
import csrfProtection from "../../middleware/student/csrfMiddleware.js";
dotenv.config();


const router = Router();

/**
 * @route POST /register/:type
 * @desc Register a new complaint
 * @access Private
 */
router.post("/register/:type", protect,csrfProtection,handleFileUpload, registerComplain);

/**
 * @route GET /get-complaints/:type
 * @desc Get complaints by type
 * @access Private
 */
router.get("/get-complaints/:type", protect, getComplaints);

/**
 * @route GET /get-complaints-date/:type
 * @desc Get complaints by date and type
 * @access Private
 */
router.get("/get-complaints-date/:type", protect, getComplaintsByDate_main);

/**
 * @route PUT /update-complaints/:type
 * @desc Update complaints by type
 * @access Private
 */
router.put("/update-complaints/:type", protect,csrfProtection,updateComplaints);

/**
 * @route DELETE /delete-complaints/:type
 * @desc Delete complaints by type
 * @access Private
 */
router.delete("/delete-complaints/:type", protect,csrfProtection,deleteComplaints);
router.get("/search/:type",protect,searchController);
export default router;
