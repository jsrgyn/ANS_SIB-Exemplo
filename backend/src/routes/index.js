import { Router } from "express";
import csvRoutes from "./csvRoutes.js";
import { validateXML } from "../validators/xmlValidator.js";

const router = Router();

router.use("/csv", csvRoutes);

router.post("/xml/validate", async (req, res) => {
  try {
    const { xml } = req.body;
    if (!xml) {
      return res.status(400).json({ error: "XML não fornecido" });
    }
    const validationResult = await validateXML(xml);
    res.json(validationResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
