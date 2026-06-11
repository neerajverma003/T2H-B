import express from 'express';
import { auth } from '../../middleware/auth.js';
import {
    createGiftCard,
    verifyPayment,
    getInviteDetails,
    acceptGift,
    getMyGiftCards,
    getWalletDetails,
    renderGiftCardImage,
    razorpayWebhook,
    validateGiftCardCheckout
} from '../../controller/giftCard.controller.js';

const giftCardRouter = express.Router();

// Protected Routes (Requires Login)
giftCardRouter.post('/create', auth, createGiftCard);
giftCardRouter.post('/accept', auth, acceptGift);
giftCardRouter.get('/me', auth, getMyGiftCards);
giftCardRouter.get('/wallet/me', auth, getWalletDetails);
giftCardRouter.post('/validate', auth, validateGiftCardCheckout);

// Public or Server-to-Server Routes
giftCardRouter.post('/payment-webhook', verifyPayment);
giftCardRouter.post('/razorpay-webhook', razorpayWebhook);
giftCardRouter.get('/invite/:token', getInviteDetails);
giftCardRouter.get('/render/:token', renderGiftCardImage); // Support dynamic PNG endpoint

export default giftCardRouter;
