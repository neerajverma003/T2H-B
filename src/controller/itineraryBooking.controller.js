import crypto from 'crypto';
import Razorpay from 'razorpay';
import { ENV } from '../config/ENV.js';
import ItineraryBooking from '../models/itineraryBooking.model.js';
import ItineraryMain from '../models/itinerary.model.js';
import userModel from '../models/user.model.js';
import GiftCard from '../models/giftCard.model.js';
import GiftCardTransaction from '../models/giftCardTransaction.model.js';
import WalletTransaction from '../models/walletTransaction.model.js';

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
      booking.wallet_amount_used = wallet_amount_used || 0;
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
        wallet_amount_used: wallet_amount_used || 0
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
    if (!booking || booking.status !== 'payment_pending') {
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
          transaction_type: 'redemption',
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

    // Trigger Success Email (TODO)

    return res.status(200).json({
      success: true,
      msg: 'Payment verified successfully. Booking confirmed.'
    });

  } catch (error) {
    console.error('verifyBookingPayment Error:', error);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
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
