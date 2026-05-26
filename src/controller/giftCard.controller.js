import mongoose from 'mongoose';
import crypto from 'crypto';
import GiftCard from '../models/giftCard.model.js';
import GiftCardInvite from '../models/giftCardInvite.model.js';
import GiftCardTransaction from '../models/giftCardTransaction.model.js';
import userModel from '../models/user.model.js';
import { sendGiftCardInviteEmail } from '../utils/email.js';

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

    // Create DB Entry in "created" state
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
      // razorpay_order_id: razorpayOrder.id (assuming Razorpay integration here)
    });

    await giftCard.save();



    return res.status(201).json({
      success: true,
      msg: 'Gift Card initiated.',
      gift_card_id: giftCard._id,
      // return razorpay order details to frontend
    });

  } catch (error) {
    console.error(`createGiftCard Error:`, error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// 2. VERIFY PAYMENT (Webhook or verification endpoint)
export const verifyPayment = async (req, res) => {
  try {
    const { gift_card_id, razorpay_payment_id } = req.body; // Mock verification
    const giftCard = await GiftCard.findById(gift_card_id);

    if (!giftCard || giftCard.status !== 'created') {
      return res.status(400).json({ success: false, msg: 'Invalid gift card or status.' });
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

    // 1. Calculate active balance from all active/partially redeemed gift cards owned by user
    const activeCards = await GiftCard.find({
      accepted_by_user_id: userId,
      status: { $in: ['active', 'PARTIALLY_REDEEMED', 'partially_redeemed'] }
    });

    const totalBalance = activeCards.reduce((sum, card) => sum + card.remaining_balance, 0);

    // 2. Fetch all transaction ledgers performed by or for this user
    const transactions = await GiftCardTransaction.find({
      performed_by_user_id: userId
    })
      .populate('gift_card_id', 'public_code type')
      .sort({ created_at: -1 });

    // 3. Fetch pending gift card invites for this user's email
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

    // 4. Fetch gift cards purchased by this user
    const purchasedCards = await GiftCard.find({
      sender_user_id: userId
    }).sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      wallet: {
        balance: totalBalance,
        active_cards: activeCards,
        purchased_cards: purchasedCards,
        transactions,
        pending_invites
      }
    });

  } catch (error) {
    console.error('getWalletDetails Error:', error);
    return res.status(500).json({ success: false, msg: 'Failed to retrieve wallet details.' });
  }
};
