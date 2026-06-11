import express from 'express';
import { auth } from '../../middleware/auth.js';
import {
  createBooking,
  verifyBookingPayment,
  getMyBookings
} from '../../controller/itineraryBooking.controller.js';

const itineraryBookingRouter = express.Router();

// Protected Routes
itineraryBookingRouter.post('/create', auth, createBooking);
itineraryBookingRouter.post('/payment-webhook', auth, verifyBookingPayment);
itineraryBookingRouter.get('/me', auth, getMyBookings);

export default itineraryBookingRouter;
