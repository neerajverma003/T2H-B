import express from 'express';
import { sendOtp, verifyOtp, getMe, logout } from '../../controller/user.controller.js';
import { auth } from '../../middleware/auth.js';

const userRouter = express.Router();

// Public routes
userRouter.post('/send-otp', sendOtp);
userRouter.post('/verify-otp', verifyOtp);
userRouter.post('/logout', logout);

// Protected routes (requires valid user_token)
userRouter.get('/me', auth, getMe);

export default userRouter;