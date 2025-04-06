import { feedbackController } from "../../controllers/student/feedbackController.js";
import handleFileUpload from "../../middleware/student/uploadFile.js";
import { Router } from "express";
const router = Router();

router.post("/",handleFileUpload,feedbackController);

export default router;