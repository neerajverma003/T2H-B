import GiftCard from '../../models/giftCard.model.js';
import GiftCardTransaction from '../../models/giftCardTransaction.model.js';

// 1. VERIFY GIFT CARD BY CODE
export const verifyGiftCardByAdmin = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ success: false, msg: 'Gift Card public code is required.' });
    }

    const giftCard = await GiftCard.findOne({ public_code: code.trim().toUpperCase() })
      .populate('sender_user_id', 'firstName lastName email')
      .populate('accepted_by_user_id', 'firstName lastName email');

    if (!giftCard) {
      return res.status(404).json({ success: false, msg: 'Gift Card not found.' });
    }

    // Return the safe data
    return res.status(200).json({
      success: true,
      giftCard: {
        _id: giftCard._id,
        public_code: giftCard.public_code,
        type: giftCard.type,
        amount: giftCard.amount,
        remaining_balance: giftCard.remaining_balance,
        currency: giftCard.currency,
        status: giftCard.status,
        expiry_date: giftCard.expiry_date,
        created_at: giftCard.created_at,
        sender: giftCard.sender_user_id ? {
          name: `${giftCard.sender_user_id.firstName} ${giftCard.sender_user_id.lastName || ''}`.trim(),
          email: giftCard.sender_user_id.email
        } : null,
        recipient_email: giftCard.recipient_email,
        recipient_name: giftCard.recipient_name,
        accepted_by: giftCard.accepted_by_user_id ? {
          name: `${giftCard.accepted_by_user_id.firstName} ${giftCard.accepted_by_user_id.lastName || ''}`.trim(),
          email: giftCard.accepted_by_user_id.email
        } : null
      }
    });

  } catch (error) {
    console.error('verifyGiftCardByAdmin Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error while verifying gift card.' });
  }
};

// 2. UPDATE GIFT CARD STATUS (Terminate / Expire)
export const updateGiftCardStatusByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected: 'expired', 'revoked', 'cancelled'

    if (!['expired', 'revoked', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, msg: 'Invalid status update requested.' });
    }

    const giftCard = await GiftCard.findById(id);

    if (!giftCard) {
      return res.status(404).json({ success: false, msg: 'Gift Card not found.' });
    }

    // Don't allow reviving an already terminated card via this API
    if (['expired', 'revoked', 'cancelled'].includes(giftCard.status)) {
       return res.status(400).json({ success: false, msg: `Card is already ${giftCard.status}.` });
    }

    giftCard.status = status;

    if (status === 'expired') {
      giftCard.expiry_date = new Date(); // Set expiry to now
    }

    await giftCard.save();

    // Create a transaction ledger entry for the admin action
    await GiftCardTransaction.create({
      gift_card_id: giftCard._id,
      transaction_type: 'refund', // using refund/adjustment conceptually
      amount: 0, // Admin action, doesn't directly add money
      performed_by_user_id: req.userId, // Admin who did this
      description: `Admin changed status to ${status}.`
    });

    return res.status(200).json({ 
      success: true, 
      msg: `Gift card successfully marked as ${status}.` 
    });

  } catch (error) {
    console.error('updateGiftCardStatusByAdmin Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error while updating gift card.' });
  }
};

// 3. GET ALL GIFT CARDS
export const getAllGiftCardsByAdmin = async (req, res) => {
  try {
    const giftCards = await GiftCard.find()
      .populate('sender_user_id', 'firstName lastName email')
      .populate('accepted_by_user_id', 'firstName lastName email')
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      giftCards
    });
  } catch (error) {
    console.error('getAllGiftCardsByAdmin Error:', error);
    return res.status(500).json({ success: false, msg: 'Failed to retrieve gift cards.' });
  }
};
