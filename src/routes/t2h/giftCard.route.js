import express from 'express';
import { auth } from '../../middleware/auth.js';
import { 
    createGiftCard, 
    verifyPayment, 
    getInviteDetails, 
    acceptGift,
    getMyGiftCards,
    getWalletDetails
} from '../../controller/giftCard.controller.js';

const giftCardRouter = express.Router();

// Protected Routes (Requires Login)
giftCardRouter.post('/create', auth, createGiftCard);
giftCardRouter.post('/accept', auth, acceptGift);
giftCardRouter.get('/me', auth, getMyGiftCards);
giftCardRouter.get('/wallet/me', auth, getWalletDetails);

// Public or Server-to-Server Routes
giftCardRouter.post('/payment-webhook', verifyPayment);
giftCardRouter.get('/invite/:token', getInviteDetails);

export default giftCardRouter;
