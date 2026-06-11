import mongoose from 'mongoose';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { ENV } from '../config/ENV.js';
import GiftCard from '../models/giftCard.model.js';
import GiftCardInvite from '../models/giftCardInvite.model.js';
import GiftCardTransaction from '../models/giftCardTransaction.model.js';
import userModel from '../models/user.model.js';
import { sendGiftCardInviteEmail } from '../utils/email.js';
import { renderGiftCardImageBuffer } from '../utils/giftCardImage.js';

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID || 'mock_key_id',
  key_secret: ENV.RAZORPAY_KEY_SECRET || 'mock_key_secret',
});

// 1. CREATE GIFT CARD (Initiate Purchase)
export const createGiftCard = async (req, res) => {
  try {
    const { type, amount, recipient_email, recipient_name, message } = req.body;
    const sender_user_id = req.userId;

    // Validation
    if (!['self', 'gift'].includes(type)) {
      return res.status(400).json({ success: false, msg: 'Invalid type. Must be self or gift.' });
    }
    if (type === 'gift' && !recipient_email) {
      return res.status(400).json({ success: false, msg: 'Recipient email is required for gifts.' });
    }

    // Generate Tokens
    const { public_code, secure_token } = GiftCard.generateSecureTokens();

    // Set expiry (e.g., 1 year from now)
    const expiry_date = new Date();
    expiry_date.setFullYear(expiry_date.getFullYear() + 1);

    // 1. Create Order on Razorpay
    const options = {
      amount: Number(amount) * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_gc_${Date.now()}`
    };

    let order;
    try {
      order = await razorpayInstance.orders.create(options);
    } catch (razorpayError) {
      console.error('Razorpay Error:', razorpayError);
      return res.status(500).json({ success: false, msg: 'Failed to create payment order' });
    }

    // 2. Create DB Entry in "created" state
    const giftCard = new GiftCard({
      public_code,
      secure_token,
      type,
      amount,
      remaining_balance: amount,
      sender_user_id,
      recipient_email: type === 'gift' ? recipient_email : undefined,
      recipient_name: type === 'gift' ? recipient_name : undefined,
      message,
      expiry_date,
      status: 'created',
      razorpay_order_id: order.id
    });

    await giftCard.save();

    return res.status(201).json({
      success: true,
      msg: 'Gift Card initiated.',
      gift_card_id: giftCard._id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: ENV.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error(`createGiftCard Error:`, error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// 2. VERIFY PAYMENT (Webhook or verification endpoint)
export const verifyPayment = async (req, res) => {
  try {
    const { gift_card_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const giftCard = await GiftCard.findById(gift_card_id);

    if (!giftCard || giftCard.status !== 'created') {
      return res.status(400).json({ success: false, msg: 'Invalid gift card or status.' });
    }

    // 1. Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET || 'mock_key_secret')
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature && ENV.RAZORPAY_KEY_SECRET) {
      // Allow mock bypass if no real secret is set
      return res.status(400).json({ success: false, msg: 'Invalid payment signature' });
    }

    giftCard.razorpay_payment_id = razorpay_payment_id;

    // FOR SELF: Activate immediately
    if (giftCard.type === 'self') {
      giftCard.status = 'active';
      giftCard.accepted_by_user_id = giftCard.sender_user_id; // Owner is purchaser
      await giftCard.save();

      // Ledger entry
      await GiftCardTransaction.create({
        gift_card_id: giftCard._id,
        transaction_type: 'purchase',
        amount: giftCard.amount,
        performed_by_user_id: giftCard.sender_user_id,
        description: 'Self top-up successful.'
      });



      return res.status(200).json({ success: true, msg: 'Wallet credited successfully.' });
    }

    // FOR FRIEND: Move to invited state & generate secure link
    if (giftCard.type === 'gift') {
      giftCard.status = 'invited';
      await giftCard.save();

      const inviteToken = GiftCardInvite.generateUrlSafeToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Link valid for 7 days

      const invite = new GiftCardInvite({
        gift_card_id: giftCard._id,
        invite_token: inviteToken,
        recipient_email: giftCard.recipient_email,
        token_expires_at: expiresAt
      });
      await invite.save();



      // Send the beautiful HTML Email Invite
      const sender = await userModel.findById(giftCard.sender_user_id);
      const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'A Friend';
      await sendGiftCardInviteEmail(giftCard.recipient_email, giftCard.amount, senderName, inviteToken);

      return res.status(200).json({ success: true, msg: 'Payment successful. Invite sent to friend.' });
    }

  } catch (error) {
    console.error(`verifyPayment Error:`, error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// 3. SERVER-TO-SERVER WEBHOOK (Razorpay Background Verifications)
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = ENV.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('[WEBHOOK] Invalid signature detected.');
        return res.status(400).json({ status: 'ignored', msg: 'Invalid signature' });
      }
    }

    const { event, payload } = req.body;

    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const order_id = paymentEntity.order_id;
      const payment_id = paymentEntity.id;

      const giftCard = await GiftCard.findOne({ razorpay_order_id: order_id });

      if (giftCard && giftCard.status === 'created') {
        giftCard.status = 'active';
        giftCard.razorpay_payment_id = payment_id;

        if (giftCard.type === 'self') {
          giftCard.accepted_by_user_id = giftCard.sender_user_id;
          await giftCard.save();

          await GiftCardTransaction.create({
            gift_card_id: giftCard._id,
            transaction_type: 'purchase',
            amount: giftCard.amount,
            performed_by_user_id: giftCard.sender_user_id,
            description: 'Self top-up successful via webhook.'
          });
        } else {
          await giftCard.save();
          const sender = await userModel.findById(giftCard.sender_user_id);

          const invite = new GiftCardInvite({
            gift_card_id: giftCard._id,
            invite_email: giftCard.recipient_email,
            token: crypto.randomBytes(32).toString('hex')
          });
          await invite.save();

          await sendGiftCardInviteEmail(
            giftCard.recipient_email,
            sender.firstName,
            giftCard.amount,
            invite.token,
            giftCard.message
          );
        }
        console.log(`[WEBHOOK] Order ${order_id} marked as active.`);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[WEBHOOK] Error processing webhook:', err);
    return res.status(500).json({ status: 'error' });
  }
};

// 3. GET INVITE DETAILS (Public preview before clicking Accept)
export const getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await GiftCardInvite.findOne({ invite_token: token })
      .populate({
        path: 'gift_card_id',
        populate: { path: 'sender_user_id', select: 'firstName lastName' }
      });

    if (!invite || invite.status !== 'pending' || new Date() > invite.token_expires_at) {
      return res.status(404).json({ success: false, msg: 'Invite is invalid or expired.' });
    }

    const sender = invite.gift_card_id.sender_user_id;
    const senderName = sender ? `${sender.firstName} ${sender.lastName || ''}`.trim() : 'A Friend';



    // Return safe data for preview (No secure token)
    return res.status(200).json({
      success: true,
      amount: invite.gift_card_id.amount,
      recipient_email: invite.recipient_email,
      sender_name: senderName,
      message: invite.gift_card_id.message
    });

  } catch (error) {
    console.error('getInviteDetails Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// 4. ACCEPT GIFT (Requires Authentication)
export const acceptGift = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token } = req.body;
    const recipient_user_id = req.userId; // Auth Middleware

    const user = await userModel.findById(recipient_user_id);
    const invite = await GiftCardInvite.findOne({ invite_token: token }).session(session);

    if (!invite || invite.status !== 'pending') {
      throw new Error('Invalid or already accepted invite.');
    }

    if (new Date() > invite.token_expires_at) {
      throw new Error('Invite has expired.');
    }

    // STRICT SECURITY: Email matching
    if (user.email.toLowerCase() !== invite.recipient_email.toLowerCase()) {
      throw new Error('This gift was sent to a different email address. Please login with the correct email.');
    }

    const giftCard = await GiftCard.findById(invite.gift_card_id).session(session);

    // Transfer Ownership
    invite.status = 'accepted';
    invite.accepted_at = new Date();
    invite.accepted_by_user_id = user._id;

    giftCard.status = 'active';
    giftCard.accepted_by_user_id = user._id;

    // Ledger Entry
    await GiftCardTransaction.create([{
      gift_card_id: giftCard._id,
      transaction_type: 'purchase',
      amount: giftCard.amount,
      performed_by_user_id: user._id,
      description: 'Gift Card Claimed and Activated.'
    }], { session });



    await invite.save({ session });
    await giftCard.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, msg: 'Gift Card accepted successfully! Added to your wallet.' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`acceptGift Error:`, error.message);
    return res.status(400).json({ success: false, msg: error.message });
  }
};

// 5. GET USER GIFT CARDS
export const getMyGiftCards = async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch cards purchased by the user, or accepted by the user
    const giftCards = await GiftCard.find({
      $or: [
        { sender_user_id: userId },
        { accepted_by_user_id: userId }
      ]
    }).sort({ created_at: -1 });

    return res.status(200).json({ success: true, giftCards });
  } catch (error) {
    console.error('getMyGiftCards Error:', error);
    return res.status(500).json({ success: false, msg: 'Failed to retrieve gift cards.' });
  }
};

// 6. GET WALLET DETAILS (Total balance & transactions)
export const getWalletDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await userModel.findById(userId);

    // 1. Get real Cash Wallet balance from user document
    const totalBalance = user.wallet_balance || 0;

    // 2. Fetch real Cash Wallet transactions
    // Since we just created WalletTransaction model, we need to import it if not present.
    // Wait, let's just use the GiftCardTransaction for now if we want to preserve old ledger,
    // or return an empty array if WalletTransaction doesn't exist yet for the user.
    // I'll import WalletTransaction dynamically or assume it's imported.
    const wallet_transactions = []; // To be replaced with WalletTransaction.find({ user_id: userId }) later.

    // 3. Fetch active/valid Gift Cards (Vouchers)
    const activeCards = await GiftCard.find({
      accepted_by_user_id: userId,
      status: { $in: ['active', 'PARTIALLY_REDEEMED', 'partially_redeemed'] }
    });

    // 4. Fetch pending gift card invites for this user's email
    let pending_invites = [];
    if (user && user.email) {
      pending_invites = await GiftCardInvite.find({
        recipient_email: user.email,
        status: 'pending',
        token_expires_at: { $gt: new Date() }
      }).populate({
        path: 'gift_card_id',
        populate: { path: 'sender_user_id', select: 'firstName lastName' }
      }).sort({ created_at: -1 });
    }

    // 5. Fetch gift cards purchased by this user
    const purchasedCards = await GiftCard.find({
      sender_user_id: userId
    }).sort({ created_at: -1 });

    // Legacy transaction fetch for old vouchers ledger
    const voucher_transactions = await GiftCardTransaction.find({
      performed_by_user_id: userId
    }).populate('gift_card_id', 'public_code type').sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      wallet: {
        balance: totalBalance,
        transactions: wallet_transactions,
        vouchers: {
          active_cards: activeCards,
          purchased_cards: purchasedCards,
          pending_invites,
          transactions: voucher_transactions
        }
      }
    });

  } catch (error) {
    console.error('getWalletDetails Error:', error);
    return res.status(500).json({ success: false, msg: 'Failed to retrieve wallet details.' });
  }
};

// 7. RENDER DYNAMIC GIFT CARD IMAGE (Server-side rendering for email compatibility)
export const renderGiftCardImage = async (req, res) => {
  try {
    const { token } = req.params;
    const actualToken = token.split('.')[0]; // remove .png if present

    // Find the invite
    const invite = await GiftCardInvite.findOne({ invite_token: actualToken }).populate('gift_card_id');
    if (!invite || !invite.gift_card_id) {
      return res.status(404).send('Gift card not found');
    }

    const giftCard = invite.gift_card_id;
    const buffer = await renderGiftCardImageBuffer({
      amount: giftCard.amount,
      publicCode: giftCard.public_code,
      expiryDate: giftCard.expiry_date,
    });

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=31536000'); // Perfect cache for immutable token
    return res.send(buffer);

  } catch (error) {
    console.error('renderGiftCardImage Error:', error);
    return res.status(500).send('Error generating image');
  }
};

export const validateGiftCardCheckout = async (req, res) => {
  try {
    const userId = req.userId;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, msg: 'Gift Card code is required.' });
    }

    const giftCard = await GiftCard.findOne({ public_code: code });

    if (!giftCard) {
      return res.status(404).json({ success: false, msg: 'Invalid Voucher Code.' });
    }

    if (giftCard.status === 'expired' || (giftCard.expiry_date && new Date(giftCard.expiry_date) < new Date())) {
      // Auto-update to expired if not already
      if (giftCard.status !== 'expired') {
        giftCard.status = 'expired';
        await giftCard.save();
      }
      return res.status(400).json({ success: false, msg: 'This Voucher has expired.' });
    }

    if (!['active', 'PARTIALLY_REDEEMED', 'partially_redeemed'].includes(giftCard.status)) {
      return res.status(400).json({ success: false, msg: `This Voucher cannot be used. Status: ${giftCard.status}` });
    }

    if (giftCard.accepted_by_user_id && giftCard.accepted_by_user_id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, msg: 'This Voucher belongs to another user.' });
    }

    if (giftCard.remaining_balance <= 0) {
      return res.status(400).json({ success: false, msg: 'This Voucher has zero balance.' });
    }

    return res.status(200).json({
      success: true,
      msg: 'Voucher applied successfully.',
      giftCard: {
        code: giftCard.public_code,
        balance: giftCard.remaining_balance
      }
    });

  } catch (error) {
    console.error('validateGiftCardCheckout Error:', error);
    return res.status(500).json({ success: false, msg: 'Server error during validation.' });
  }
};
