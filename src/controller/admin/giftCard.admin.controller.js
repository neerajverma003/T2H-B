import GiftCard from '../../models/giftCard.model.js';
import GiftCardTransaction from '../../models/giftCardTransaction.model.js';
import UserModel from '../../models/user.model.js';
import GiftCardBatch from '../../models/giftCardBatch.model.js';
import { processBulkGiftCards } from '../../services/bulkGiftCardWorker.js';

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
      .populate('sender_user_id', 'name firstName lastName email')
      .populate('accepted_by_user_id', 'name firstName lastName email')
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

// ==========================================
// 🏢 BULK GIFT CARD CAMPAIGN ENDPOINTS
// ==========================================

/**
 * Initiate a bulk gift card campaign (Registered Users or Custom Emails).
 * Runs asynchronously and triggers the background worker loop.
 */
export const bulkIssueGiftCards = async (req, res) => {
  try {
    const { campaign_name, recipient_type, gift_card_amount, message, expiry_days, emails } = req.body;
    const sender_admin_id = req.userId; // Decoded from JWT via auth middleware

    // 1. Core Parameter Validations
    if (!campaign_name || !recipient_type || !gift_card_amount) {
      return res.status(400).json({
        success: false,
        msg: 'Required fields missing: campaign_name, recipient_type, and gift_card_amount are mandatory.'
      });
    }

    const parsedAmount = Number(gift_card_amount);
    if (isNaN(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({
        success: false,
        msg: 'Gift card value must be a valid number and at least ₹100.'
      });
    }

    let finalEmails = [];

    // 2. Recipient Targeting Resolver
    if (recipient_type === 'registered') {
      // Fetch all active user accounts projection only email to keep it fast
      const registeredUsers = await UserModel.find({ email: { $exists: true } }, 'email');
      
      finalEmails = registeredUsers
        .map((u) => u.email?.trim().toLowerCase())
        .filter(Boolean);

      if (finalEmails.length === 0) {
        return res.status(400).json({
          success: false,
          msg: 'Database contains zero registered user accounts to target.'
        });
      }
    } else if (recipient_type === 'custom') {
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          msg: 'Please provide a non-empty list of emails for custom target option.'
        });
      }

      // Strict email regex validation and deduplication
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanSet = new Set();
      
      for (const email of emails) {
        if (email && typeof email === 'string') {
          const cleanEmail = email.trim().toLowerCase();
          if (emailRegex.test(cleanEmail)) {
            cleanSet.add(cleanEmail);
          }
        }
      }

      finalEmails = Array.from(cleanSet);

      if (finalEmails.length === 0) {
        return res.status(400).json({
          success: false,
          msg: 'Zero valid emails found in the provided custom list.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        msg: 'Invalid recipient type. Must be either "registered" or "custom".'
      });
    }

    // 3. Persist Campaign Job Document (Initial pending state)
    const batch = new GiftCardBatch({
      campaign_name,
      recipient_type,
      gift_card_amount: parsedAmount,
      message: message || undefined,
      expiry_days: expiry_days ? Number(expiry_days) : undefined,
      emails_list: finalEmails,
      total_records: finalEmails.length,
      sender_admin_id,
      status: 'pending'
    });

    await batch.save();

    // 4. Trigger Worker Asynchronously (Non-blocking response)
    processBulkGiftCards(batch._id, finalEmails).catch((err) => {
      console.error(`[CRITICAL] Error triggering worker for campaign ${batch._id}:`, err);
    });

    // 5. Instantly return HTTP 202 Accepted status for premium client UX
    return res.status(202).json({
      success: true,
      msg: `Campaign initiated successfully for ${finalEmails.length} recipients.`,
      batch: {
        _id: batch._id,
        campaign_name: batch.campaign_name,
        total_records: batch.total_records
      }
    });

  } catch (error) {
    console.error('bulkIssueGiftCards Error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Internal server error while initiating bulk distribution.'
    });
  }
};

/**
 * Get real-time progress, status, and failure audits of a campaign batch.
 */
export const getBulkCampaignProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await GiftCardBatch.findById(id).populate('sender_admin_id', 'username');
    if (!batch) {
      return res.status(404).json({ success: false, msg: 'Bulk campaign batch not found.' });
    }

    return res.status(200).json({
      success: true,
      batch
    });

  } catch (error) {
    console.error('getBulkCampaignProgress Error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Internal server error while fetching progress logs.'
    });
  }
};

/**
 * Retrieve a historical list of all bulk campaign batches ran by admins.
 */
export const getAllBulkCampaigns = async (req, res) => {
  try {
    const campaigns = await GiftCardBatch.find()
      .populate('sender_admin_id', 'username')
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      campaigns
    });

  } catch (error) {
    console.error('getAllBulkCampaigns Error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Failed to retrieve bulk campaigns log history.'
    });
  }
};

export const getRegisteredUsersCount = async (req, res) => {
  try {
    const users = await UserModel.find({ email: { $exists: true } }, 'name firstName lastName email');
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('getRegisteredUsersCount Error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Failed to retrieve registered users count.'
    });
  }
};
