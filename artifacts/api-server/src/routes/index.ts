import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import customersRouter from "./customers";
import salesRouter from "./sales";
import reportsRouter from "./reports";
import shopsRouter from "./shops";
import organizationsRouter from "./organizations";
import masterProductsRouter from "./masterProducts";
import cashboxRouter from "./cashbox";
import purchasesRouter from "./purchases";
import subscriptionsRouter from "./subscriptions";
import adminRouter from "./admin";
import chotuRouter from "./chotu";
import { requireAuth } from "../lib/auth";
import { withShopContext } from "../lib/tenant";

const router: IRouter = Router();

// Health checks stay public so uptime monitors don't need auth.
router.use(healthRouter);

// Everything else is the shopkeeper's private business data.
router.use(requireAuth);
// Resolves req.shop from the Clerk identity (never from a client-sent id).
router.use(withShopContext);
// Onboarding/team routes must stay reachable before a shop exists.
router.use(shopsRouter);
router.use(organizationsRouter);
router.use(productsRouter);
router.use(masterProductsRouter);
router.use(customersRouter);
router.use(salesRouter);
router.use(reportsRouter);
router.use(cashboxRouter);
router.use(purchasesRouter);
router.use(subscriptionsRouter);
router.use(adminRouter);
router.use(chotuRouter);

export default router;
