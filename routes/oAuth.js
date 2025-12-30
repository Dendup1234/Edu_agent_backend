import express from 'express';
import { authController } from '../controllers/oAuthController.js';

const router = express.Router();

router.get('/', authController.initiateGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);

router.post('/mobile', authController.handleMobileAuth);

export default router;