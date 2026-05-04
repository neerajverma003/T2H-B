import express from 'express'
import { sendOtp, verifyOtp } from '../../controller/user.controller.js';
const userRouter=express.Router();

userRouter.post('/send-otp', sendOtp)
userRouter.post('/verify-otp', verifyOtp)

export default userRouter