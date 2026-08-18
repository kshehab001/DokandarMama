import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import customersRouter from "./customers";
import salesRouter from "./sales";
import reportsRouter from "./reports";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// Health checks stay public so uptime monitors don't need auth.
router.use(healthRouter);

// Everything else is the shopkeeper's private business data.
router.use(requireAuth);
router.use(productsRouter);
router.use(customersRouter);
router.use(salesRouter);
router.use(reportsRouter);

export default router;
