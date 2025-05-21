import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

router.post('/request-otp', authController.requestOTP);
router.post('/verify-otp', authController.verifyOTP);

export const authRoutes = router;