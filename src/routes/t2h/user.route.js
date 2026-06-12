import express from 'express';
import { sendOtp, verifyOtp, login, getMe, logout, updateProfile, addItineraryReview, getMyReviews, getMyEnquiries, getReferrals } from '../../controller/user.controller.js';
import { generatePresignedUrl } from '../../controller/admin/s3.controller.js';
import { auth } from '../../middleware/auth.js';

const userRouter = express.Router();

// Public routes
userRouter.post('/send-otp', sendOtp);
userRouter.post('/verify-otp', verifyOtp);
userRouter.post('/login', login);
userRouter.post('/logout', logout);


// Protected routes (requires valid user_token)
userRouter.get('/me', auth, getMe);
userRouter.put('/profile', auth, updateProfile);
userRouter.post('/generate-presigned-url', auth, generatePresignedUrl);
userRouter.post('/itinerary/:id/review', auth, addItineraryReview);
userRouter.get('/reviews', auth, getMyReviews);
userRouter.get('/enquiries', auth, getMyEnquiries);
userRouter.get('/referrals', auth, getReferrals);

export default userRouter;