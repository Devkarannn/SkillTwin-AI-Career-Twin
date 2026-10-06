import { Router, type IRouter } from "express";
import healthRouter from "./health";
import skillTwinRouter from "./skilltwin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(skillTwinRouter);

export default router;
