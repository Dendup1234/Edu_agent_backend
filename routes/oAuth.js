import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

router.get('/google', authController.initiateGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);

router.post('/mobile', authController.handleMobileAuth);

export default router;