import { Router } from "express";
import  authController  from "../../controllers/admin/authController.js";
export const router = Router();

router.post("/",authController);


