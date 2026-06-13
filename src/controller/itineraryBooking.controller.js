import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Razorpay from 'razorpay';
import { ENV } from '../config/ENV.js';
import ItineraryBooking from '../models/itineraryBooking.model.js';
import ItineraryMain from '../models/itinerary.model.js';
import userModel from '../models/user.model.js';
import GiftCard from '../models/giftCard.model.js';
import GiftCardTransaction from '../models/giftCardTransaction.model.js';
import WalletTransaction from '../models/walletTransaction.model.js';
import { generateInvoiceHtml } from '../utils/invoiceTemplate.js';
import { generatePdfBuffer } from '../utils/pdfGenerator.js';
import { sendBookingConfirmationWithInvoice, sendReferralRewardEmail } from '../utils/email.js';
import Notification from '../models/notification.model.js';
import ReferralAuditLog from '../models/referralAuditLog.model.js';

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID || 'mock_key_id',
  key_secret: ENV.RAZORPAY_KEY_SECRET || 'mock_key_secret',
});

// 1. CREATE BOOKING (Soft Booking + Order Gen)
export const createBooking = async (req, res) => {
  try {
    const { itinerary_id, travel_date, adults, kids, payment_type, notes, used_gift_card_code, voucher_amount_used, wallet_amount_used } = req.body;
    const user_id = req.userId;

    if (!itinerary_id || !travel_date || !adults) {
      return res.status(400).json({ success: false, msg: 'Missing required booking details.' });
    }

    const itinerary = await ItineraryMain.findById(itinerary_id);
    if (!itinerary) {
      return res.status(404).json({ success: false, msg: 'Itinerary not found.' });
    }

    // Calculate Price
    let basePricePerPerson = 0;
    if (itinerary.pricing && itinerary.pricing.discounted_price) {
      basePricePerPerson = itinerary.pricing.discounted_price;
    } else if (itinerary.pricing && itinerary.pricing.standard_price) {
      basePricePerPerson = itinerary.pricing.standard_price;
    }

    if (basePricePerPerson === 0) {
      return res.status(400).json({ success: false, msg: 'This itinerary is priced on request.' });
    }

    const baseTotalPrice = basePricePerPerson * (adults + (kids * 0.5)); // Example: Kids at 50%
    const totalPrice = req.body.calculated_total !== undefined ? req.body.calculated_total : baseTotalPrice;

    // Verify wallet cap backend-side to prevent malicious requests
    let validatedWalletAmountUsed = wallet_amount_used || 0;
    if (validatedWalletAmountUsed > 0) {
      const maxAllowed = Math.min(baseTotalPrice * 0.10, 1000);
      if (validatedWalletAmountUsed > maxAllowed) {
        validatedWalletAmountUsed = Math.floor(maxAllowed);
      }
    }

    // Default token amount if they choose token payment
    const tokenAmount = 5000;
    let amountToPay = payment_type === 'token' ? tokenAmount : totalPrice;

    // Razorpay fails if amount is 0, so if 100% wallet paid, we either handle bypass or charge ₹1.
    if (amountToPay <= 0) {
      amountToPay = 1; // 1 INR minimum for Razorpay to not crash, though technically we should bypass Razorpay entirely for 0 amount.
    }

    // 1. Create Razorpay Order
    const options = {
      amount: Math.round(amountToPay * 100), // paise
      currency: "INR",
      receipt: `bkg_${Date.now()}_${user_id.toString().substring(0, 6)}`
    };

    let order;
    try {
      order = await razorpayInstance.orders.create(options);
    } catch (razorpayError) {
      console.error('Razorpay Order Error:', razorpayError);
      return res.status(500).json({ success: false, msg: 'Payment gateway error.' });
    }

    // 2. Soft Booking in Database (Singleton Intent Logic)
    let booking = await ItineraryBooking.findOne({
      user_id,
      itinerary_id,
      status: 'payment_pending'
    });

    if (booking) {
      // Upsert: Update existing pending booking instead of duplicating
      booking.travel_date = travel_date;
      booking.adults = adults;
      booking.kids = kids;
      booking.total_price = totalPrice;
      booking.payment_type = payment_type || 'full';
      booking.razorpay_order_id = order.id;
      booking.notes = notes;
      booking.used_gift_card_code = used_gift_card_code || null;
      booking.voucher_amount_used = voucher_amount_used || 0;
      booking.wallet_amount_used = validatedWalletAmountUsed;
      await booking.save();
    } else {
      // Create new booking if none exists
      booking = new ItineraryBooking({
        user_id,
        itinerary_id,
        travel_date,
        adults,
        kids,
        total_price: totalPrice,
        payment_type: payment_type || 'full',
        razorpay_order_id: order.id,
        status: 'payment_pending',
        payment_status: 'pending',
        notes,
        used_gift_card_code: used_gift_card_code || null,
        voucher_amount_used: voucher_amount_used || 0,
        wallet_amount_used: validatedWalletAmountUsed
      });
      await booking.save();
    }

    return res.status(201).json({
      success: true,
      msg: 'Booking intent registered.',
      booking_id: booking._id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: ENV.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('createBooking Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// 2. VERIFY BOOKING PAYMENT
export const verifyBookingPayment = async (req, res) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const booking = await ItineraryBooking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found.' });
    }

    if (booking.status === 'confirmed') {
      return res.status(200).json({ success: true, msg: 'Payment already verified.' });
    }

    if (booking.status !== 'payment_pending') {
      return res.status(400).json({ success: false, msg: 'Invalid booking or already confirmed.' });
    }

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET || 'mock_key_secret')
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature && ENV.RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ success: false, msg: 'Invalid payment signature' });
    }

    // Payment Successful -> Update Booking Status
    booking.razorpay_payment_id = razorpay_payment_id;
    booking.status = 'confirmed';
    booking.payment_status = booking.payment_type === 'token' ? 'partial_paid' : 'paid';

    if (booking.payment_type === 'token') {
      booking.token_amount_paid = 5000;
    } else {
      booking.token_amount_paid = booking.total_price;
    }

    // -----------------------------------------------------
    // 1. DEDUCT GIFT CARD BALANCE (If applied)
    // -----------------------------------------------------
    if (booking.used_gift_card_code && booking.voucher_amount_used > 0) {
      const giftCard = await GiftCard.findOne({ public_code: booking.used_gift_card_code });
      if (giftCard && giftCard.remaining_balance >= booking.voucher_amount_used) {
        giftCard.remaining_balance -= booking.voucher_amount_used;
        
        // If balance becomes 0, mark as fully redeemed
        if (giftCard.remaining_balance === 0) {
          giftCard.status = 'redeemed';
        } else {
          giftCard.status = 'partially_redeemed';
        }
        await giftCard.save();

        // Create GiftCardTransaction Log
        const gcTx = new GiftCardTransaction({
          gift_card_id: giftCard._id,
          performed_by_user_id: booking.user_id,
          amount: booking.voucher_amount_used,
          transaction_type: 'redeem',
          description: `Applied to Booking ID: ${booking._id}`
        });
        await gcTx.save();
      }
    }

    // -----------------------------------------------------
    // 2. DEDUCT TRAVEL WALLET BALANCE (If applied)
    // -----------------------------------------------------
    if (booking.wallet_amount_used > 0) {
      const user = await userModel.findById(booking.user_id);
      if (user && user.wallet_balance >= booking.wallet_amount_used) {
        user.wallet_balance -= booking.wallet_amount_used;
        await user.save();

        // Create WalletTransaction Log
        const walletTx = new WalletTransaction({
          user_id: booking.user_id,
          amount: booking.wallet_amount_used,
          transaction_type: 'debit',
          description: `Used for Booking ID: ${booking._id}`,
          reference_id: booking._id.toString()
        });
        await walletTx.save();
      }
    }

    await booking.save();

    // -----------------------------------------------------
    // 3. BOOKING REFERRAL BONUS (Rs. 500 to Referrer A)
    // -----------------------------------------------------
    try {
      const B_user = await userModel.findById(booking.user_id);
      if (B_user && B_user.referred_by) {
        const previousBookings = await ItineraryBooking.countDocuments({
          user_id: booking.user_id,
          status: 'confirmed',
          _id: { $ne: booking._id }
        });

        if (previousBookings === 0) {
          const A_user = await userModel.findOne({ referral_code: B_user.referred_by });
          if (A_user) {
            // 1. Velocity check (last 24 hours referrals count)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const referralsCount = await userModel.countDocuments({
              referred_by: A_user.referral_code,
              is_verified: true,
              createdAt: { $gte: oneDayAgo }
            });

            if (referralsCount >= 30) {
              // Auto-freeze referrer
              A_user.is_wallet_frozen = true;
              A_user.wallet_frozen_reason = `Auto-frozen: Exceeded velocity threshold of 30 referrals per 24 hours (Current: ${referralsCount + 1}).`;
              await A_user.save();

              const auditLog = new ReferralAuditLog({
                referrerId: A_user._id,
                action: 'AUTO_FREEZE',
                details: `Wallet frozen automatically due to exceeding 30 referrals in 24 hours. Triggered by booking of referee: ${B_user.email}.`,
                referralCountIn24h: referralsCount + 1,
                triggeredBySystem: true
              });
              await auditLog.save();

              const freezeNotification = new Notification({
                userId: A_user._id,
                title: 'Wallet Frozen',
                message: 'Your wallet has been frozen due to suspicious referral activity. Please contact support.',
                type: 'system'
              });
              await freezeNotification.save();
            } else if (!A_user.is_wallet_frozen) {
              A_user.wallet_balance = (A_user.wallet_balance || 0) + 500;
              await A_user.save();

              const referralWalletTx = new WalletTransaction({
                user_id: A_user._id,
                amount: 500,
                transaction_type: 'credit',
                description: `Referral Booking Bonus (Friend: ${B_user.firstName} ${B_user.lastName || ''})`,
                reference_id: booking._id.toString()
              });
              await referralWalletTx.save();

              // Create In-App Notification
              const notif = new Notification({
                userId: A_user._id,
                title: 'Referral Booking Reward! 🎉',
                message: `You earned ₹500 because your referred friend ${B_user.firstName} booked their first tour.`,
                type: 'referral'
              });
              await notif.save();

              // Send Email asynchronously
              sendReferralRewardEmail(
                A_user.email,
                `${A_user.firstName} ${A_user.lastName}`,
                `${B_user.firstName} ${B_user.lastName || ''}`,
                500,
                'booking'
              ).catch(err => console.error('[MAIL] Failed sending booking referral email:', err));
            }
          }
        }
      }
    } catch (refError) {
      console.error('Referral booking reward calculation failed:', refError);
    }

    // Trigger Success Email Asynchronously
    try {
      const userDetails = await userModel.findById(booking.user_id);
      const itineraryDetails = await ItineraryMain.findById(booking.itinerary_id);
      
      const invoiceData = compileInvoiceData(booking, userDetails, itineraryDetails);

      // Run generation and email sending without blocking the response
      (async () => {
        try {
          console.log(`[INVOICE] Generating HTML for Booking: ${booking._id}`);
          const html = generateInvoiceHtml(invoiceData);
          console.log(`[INVOICE] Generating PDF for Booking: ${booking._id}`);
          const pdfBuffer = await generatePdfBuffer(html);
          console.log(`[INVOICE] PDF Generated. Sending Email to: ${userDetails.email}`);
          await sendBookingConfirmationWithInvoice(userDetails.email, invoiceData.customerName, invoiceData, pdfBuffer);
        } catch (emailErr) {
          console.error('[INVOICE/EMAIL] Background Process Failed:', emailErr);
        }
      })();
    } catch (dbErr) {
      console.error('[INVOICE] Failed to fetch data for email:', dbErr);
    }

    return res.status(200).json({
      success: true,
      msg: 'Payment verified successfully. Booking confirmed.'
    });

  } catch (error) {
    console.error('verifyBookingPayment Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// Reusable Helper to compile booking invoice variables with fallback parsing
const compileInvoiceData = (booking, userDetails, itineraryDetails) => {
  // 1. Load logo base64 safely
  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'TripLogo.png');
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    }
  } catch (logoErr) {
    console.error('[INVOICE] Failed to read logo file:', logoErr);
  }

  // 2. Parse selected addons, requests, and city from notes safely
  let selectedAddonsList = [];
  let specialRequestsList = [];
  let departureCity = '';
  let rawNote = '';

  const notesStr = booking.notes || '';
  if (notesStr) {
    const isStandardFormat = /Addons:|Requests:|DepCity:/i.test(notesStr);
    if (isStandardFormat) {
      // Extract Addons
      const addonsMatch = notesStr.match(/Addons:\s*([^.]*)/i);
      if (addonsMatch && addonsMatch[1]) {
        const addonIds = addonsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        
        const ADDONS_DATA_MAP = {
          'candle_dinner': { title: 'Candle Light Dinner', price: 5500 },
          'beach_dinner': { title: 'Private Beach Dinner', price: 8500 },
          'couple_spa': { title: 'Couple Spa Therapy', price: 5000 },
          'flower_bed': { title: 'Flower Bed Decor', price: 1500 },
          'photoshoot': { title: 'Pro Couple Photoshoot', price: 7000 }
        };

        addonIds.forEach(id => {
          if (ADDONS_DATA_MAP[id]) {
            selectedAddonsList.push(ADDONS_DATA_MAP[id]);
          }
        });
      }

      // Extract Requests
      const requestsMatch = notesStr.match(/Requests:\s*([^.]*)/i);
      if (requestsMatch && requestsMatch[1]) {
        specialRequestsList = requestsMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      }

      // Extract DepCity
      const depCityMatch = notesStr.match(/DepCity:\s*(.*)/i);
      if (depCityMatch && depCityMatch[1]) {
        departureCity = depCityMatch[1].trim();
      }
    } else {
      // Non-standard format / custom legacy note fallback
      rawNote = notesStr;
    }
  }

  // 3. Pricing Math
  const voucherUsed = booking.voucher_amount_used || 0;
  const walletUsed = booking.wallet_amount_used || 0;
  const subtotalInclusive = booking.total_price + voucherUsed + walletUsed;
  
  const baseValue = subtotalInclusive / 1.18;
  const gstAmount = subtotalInclusive - baseValue;

  const addonsTotal = selectedAddonsList.reduce((sum, a) => sum + a.price, 0);
  const basePackagePrice = Math.max(0, subtotalInclusive - addonsTotal);

  // Amount paid vs remaining balance
  const amountPaid = booking.payment_type === 'token' ? 5000 : booking.total_price;
  const balanceDue = booking.payment_type === 'token' ? Math.max(0, booking.total_price - 5000) : 0;

  return {
    invoiceNumber: `INV-T2H-${booking._id.toString().substring(0, 8).toUpperCase()}`,
    dateOfIssue: new Date(booking.createdAt || new Date()).toLocaleDateString('en-IN'),
    customerName: `${userDetails.firstName} ${userDetails.lastName || ''}`.trim(),
    customerEmail: userDetails.email,
    customerPhone: userDetails.phone || '',
    customerCity: departureCity || userDetails.city || '', 
    itineraryTitle: itineraryDetails.title,
    travelDate: new Date(booking.travel_date).toLocaleDateString('en-IN'),
    adults: booking.adults,
    children: booking.kids,
    basePrice: basePackagePrice,
    gstAmount: gstAmount,
    totalAmount: subtotalInclusive,
    selectedAddonsList,
    specialRequestsList,
    usedGiftCardCode: booking.used_gift_card_code,
    voucherAmountUsed: voucherUsed,
    walletAmountUsed: walletUsed,
    amountPaid,
    balanceDue,
    logoBase64,
    rawNote
  };
};

// 3. GET MY BOOKINGS (Dashboard API)
export const getMyBookings = async (req, res) => {
  try {
    const user_id = req.userId;
    const bookings = await ItineraryBooking.find({ user_id })
      .populate('itinerary_id', 'title destination_images pricing')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('getMyBookings Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// 4. DOWNLOAD BOOKING INVOICE PDF (Dynamic On-the-Fly Streaming)
export const downloadBookingInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the booking
    const booking = await ItineraryBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, msg: 'Booking not found' });
    }

    // Check ownership or admin access
    const isOwner = booking.user_id.toString() === req.userId;
    const isAdmin = req.userRole === 'admin' || req.userRole === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, msg: 'Forbidden: Access denied' });
    }

    // Retrieve user and itinerary details
    const userDetails = await userModel.findById(booking.user_id);
    const itineraryDetails = await ItineraryMain.findById(booking.itinerary_id);

    if (!userDetails || !itineraryDetails) {
      return res.status(404).json({ success: false, msg: 'Associated user or itinerary details not found' });
    }

    // Compile invoice data and HTML template
    const invoiceData = compileInvoiceData(booking, userDetails, itineraryDetails);
    const html = generateInvoiceHtml(invoiceData);

    // Generate PDF Buffer
    const pdfBuffer = await generatePdfBuffer(html);

    // Stream PDF file response directly to browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoiceData.invoiceNumber}.pdf`);
    return res.end(pdfBuffer);

  } catch (error) {
    console.error('downloadBookingInvoice Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error', error: error.message });
  }
};

// 5. GET ALL BOOKINGS (Admin API)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await ItineraryBooking.find()
      .populate('user_id', 'firstName lastName email phone city')
      .populate('itinerary_id', 'title destination_images pricing')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('getAllBookings Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};
