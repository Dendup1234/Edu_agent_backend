import express from 'express';
import { authController } from '../controllers/oAuthController.js';

const router = express.Router();

router.post('/google-signin-agency', authController.handleWebAuth);

router.post('/google-signin-student', authController.handleMobileAuth);

export default router;