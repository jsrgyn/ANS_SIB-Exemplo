import { Router } from "express";
import csvRoutes from "./csvRoutes.js";
const router = Router();
router.use("/csv", csvRoutes);
export default router;
