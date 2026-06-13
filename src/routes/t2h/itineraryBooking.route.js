import express from 'express';
import { auth, authorizeAdmin } from '../../middleware/auth.js';
import {
  createBooking,
  verifyBookingPayment,
  getMyBookings,
  downloadBookingInvoice,
  getAllBookings
} from '../../controller/itineraryBooking.controller.js';

const itineraryBookingRouter = express.Router();

// Protected Routes
itineraryBookingRouter.post('/create', auth, createBooking);
itineraryBookingRouter.post('/payment-webhook', auth, verifyBookingPayment);
itineraryBookingRouter.get('/me', auth, getMyBookings);
itineraryBookingRouter.get('/all', auth, authorizeAdmin, getAllBookings);
itineraryBookingRouter.get('/:id/invoice/download', auth, downloadBookingInvoice);

export default itineraryBookingRouter;
