import express from 'express';
import { authController } from '../controllers/oAuthController.js';

const router = express.Router();

router.post('/google/callback', authController.handleGoogleCallback);

router.post('/mobile', authController.handleMobileAuth);

export default router;