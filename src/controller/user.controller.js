import bcrypt from 'bcrypt';
import userModel from '../models/user.model.js';
import itineraryModel from '../models/itinerary.model.js';
import ItineraryBooking from '../models/itineraryBooking.model.js';
import ItineraryLead from '../models/itineraryLead.model.js';
import ConsultationLead from '../models/consultationLead.model.js';
import planYourTrip from '../models/planYourTrip.model.js';
import PlanYourJourney from '../models/planYourJourney.model.js';
import contactModel from '../models/contact.model.js';
import WalletTransaction from '../models/walletTransaction.model.js';
import { generateToken } from '../utils.js';
import { ENV } from '../config/ENV.js';
import { sendOtpEmail, sendReferralRewardEmail } from '../utils/email.js';
import Notification from '../models/notification.model.js';
import ReferralAuditLog from '../models/referralAuditLog.model.js';

const IS_DEV = ENV.NODE_ENV !== 'production';

/**
 * =============================================
 * SEND OTP
 * POST /user/send-otp
 * Body: { mobile_number: "9876543210", name?: "John" }
 * =============================================
 */
export const sendOtp = async (req, res) => {
  try {
    const { email, mobile_number } = req.body;

    // --- Validation ---
    if (!mobile_number) {
      return res.status(400).json({ msg: 'Mobile number is required', success: false });
    }
    if (!email) {
      return res.status(400).json({ msg: 'Email is required', success: false });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: 'Please enter a valid email address', success: false });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ msg: 'Email is already registered. Please login.', success: false });
    }

    // --- Generate 6-digit OTP ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expiry = new Date(Date.now() +  5 * 60 * 1000); // 5 minutes from n

    // --- Hash OTP before storing ---
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);
    
    // --- Upsert user (create if not exists, update if exists) --
    await userModel.findOneAndUpdate(
      { email },
      {
        email,
        mobile_number,
        otp: hashedOtp,
        otp_expiry,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // --- Send Email ---
    const emailSent = await sendOtpEmail(email, otp);

    // --- DEV MODE: Log OTP to server console (remove when SMS is integrated) ---
    if (IS_DEV) {
      console.log(`\n========================================`);
      console.log(`📱 DEV MODE OTP for ${email}: ${otp}`);
      console.log(`⏰ Expires at: ${otp_expiry.toISOString()}`);
      console.log(`========================================\n`);
    }

    if (!emailSent && !IS_DEV) {
      return res.status(500).json({ msg: 'Failed to send OTP email. Please check your mail configurations.', success: false });
    }

    return res.status(200).json({
      msg: `OTP sent successfully to +91 ${mobile_number}`,
      success: true,
      // DEV ONLY: expose OTP in response. Remove this in production!
      ...(IS_DEV && { dev_otp: otp }),
    });
  } catch (error) {
    console.error(`sendOtp error → ${error}`);
    return res.status(500).json({ msg: 'Failed to send OTP. Please try again.', success: false });
  }
};

/**
 * =============================================
 * VERIFY OTP
 * POST /user/verify-otp
 * Body: { mobile_number: "9876543210", otp: "123456" }
 * =============================================
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email,otp,password,firstName, lastName, mobile_number, referred_by } = req.body;

    // --- Validation ---
    if (!email || !otp || !password || !firstName || !lastName || !mobile_number ) {
      return res
        .status(400)
        .json({ msg: 'All registration fields (First name, Last name, Email, Mobile, Password, and OTP) are required', success: false });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ msg: 'OTP must be a 6-digit number', success: false });
    }

    // --- Find user ---
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'No OTP request found. Please request a new OTP.', success: false });
    }

    // --- Check expiry first (fast fail before bcrypt) ---
    if (!user.otp_expiry || new Date() > user.otp_expiry) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.', success: false });
    }

    const isOtpValid = await bcrypt.compare(otp.toString(), user.otp);
    if (!isOtpValid) {
      return res.status(400).json({ msg: 'Invalid OTP. Please try again.', success: false });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password,salt);

    // --- OTP is valid: clear it and mark user as verified ---
     user.firstName = firstName.trim();
     user.lastName = lastName.trim();
     user.mobile_number = mobile_number.trim();
     user.password = hashPassword;
     user.otp = undefined;
     user.otp_expiry = undefined;
     user.is_verified = true;
     user.last_login = new Date();

    // --- Check for referral code ---
    if (referred_by) {
      const referrer = await userModel.findOne({ referral_code: referred_by.trim() });
      if (referrer) {
        user.referred_by = referred_by.trim();
        
        // 1. Velocity check (last 24 hours referrals count)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const referralsCount = await userModel.countDocuments({
          referred_by: referrer.referral_code,
          is_verified: true,
          createdAt: { $gte: oneDayAgo }
        });

        if (referralsCount >= 30) {
          // Auto-freeze referrer
          referrer.is_wallet_frozen = true;
          referrer.wallet_frozen_reason = `Auto-frozen: Exceeded velocity threshold of 30 referrals per 24 hours (Current: ${referralsCount + 1}).`;
          await referrer.save();

          const auditLog = new ReferralAuditLog({
            referrerId: referrer._id,
            action: 'AUTO_FREEZE',
            details: `Wallet frozen automatically due to exceeding 30 referrals in 24 hours. Attempted signup by referee: ${email}.`,
            referralCountIn24h: referralsCount + 1,
            triggeredBySystem: true
          });
          await auditLog.save();

          // Also notify referrer that their wallet was frozen
          const freezeNotification = new Notification({
            userId: referrer._id,
            title: 'Wallet Frozen',
            message: 'Your wallet has been frozen due to suspicious referral activity. Please contact support.',
            type: 'system'
          });
          await freezeNotification.save();
        } else if (!referrer.is_wallet_frozen) {
          // If NOT frozen, award reward
          referrer.wallet_balance = (referrer.wallet_balance || 0) + 250;
          await referrer.save();

          const refTx = new WalletTransaction({
            user_id: referrer._id,
            amount: 250,
            transaction_type: 'credit',
            description: `Referral Signup Bonus (Friend: ${firstName.trim()} ${lastName.trim()})`,
            reference_id: user._id.toString()
          });
          await refTx.save();

          // Create In-App Notification
          const notif = new Notification({
            userId: referrer._id,
            title: 'Referral Bonus Credited! 💰',
            message: `You earned ₹250 because your friend ${firstName.trim()} joined Trip to Honeymoon.`,
            type: 'referral'
          });
          await notif.save();

          // Send Email asynchronously
          sendReferralRewardEmail(
            referrer.email,
            `${referrer.firstName} ${referrer.lastName}`,
            `${firstName.trim()} ${lastName.trim()}`,
            250,
            'signup'
          ).catch(err => console.error('[MAIL] Failed sending signup referral email:', err));
        }
      }
    }

    await user.save();

    // --- Generate JWT Token ---
    const token = generateToken(user._id);

    // --- Set secure HTTP-only cookie ---
    res.cookie('user_token', token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: ENV.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      msg: 'Registration successful',
      success: true,
      token, // Also return in body for localStorage fallback
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile_number: user.mobile_number,
        referral_code: user.referral_code,
      },
    });
  } catch (error) {
    console.error(`verifyOtp error → ${error}`);
    return res.status(500).json({ msg: 'Registration failed. Please try again.', success: false });
  }
};

/**
 * =============================================
 * GET CURRENT USER (protected)
 * GET /user/me
 * Requires: user_token cookie or Authorization header
 * =============================================
 */
export const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select('-otp -otp_expiry  -password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile_number: user.mobile_number,
        email: user.email,
        profilePicture: user.profilePicture || '',
        is_verified: user.is_verified,
        last_login: user.last_login,
        partnerName: user.partnerName || '',
        weddingDate: user.weddingDate || null,
        preferences: user.preferences || { honeymoonVibe: '', dietaryPreference: '', departureCity: '' },
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance || 0,
      },
    });
  } catch (error) {
    console.error(`getMe error → ${error}`);
    return res.status(500).json({ msg: 'Server error', success: false });
  }
};

/**
 * =============================================
 * LOGOUT
 * POST /user/logout
 * =============================================
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie('user_token', {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: ENV.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    return res.status(200).json({ msg: 'Logged out successfully', success: true });
  } catch (error) {
    console.error(`logout error → ${error}`);
    return res.status(500).json({ msg: 'Logout failed', success: false });
  }
};

export const login = async (req, res) => {
  try{
    const {email, password} = req.body;
    if(!email || !password){
      return res.status(400).json({msg: "Email and password are required", success: false});
    }
    const user = await userModel.findOne({email});
    if(!user || !user.is_verified){
      return res.status(400).json({msg: "User not found or not verified", success: false});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(400).json({msg: "Invalid password", success: false});
    }

    user.last_login = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.cookie('user_token', token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: ENV.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      msg: "Login successful",
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile_number: user.mobile_number,
        profilePicture: user.profilePicture || '',
        partnerName: user.partnerName || '',
        weddingDate: user.weddingDate || null,
        preferences: user.preferences || { honeymoonVibe: '', dietaryPreference: '', departureCity: '' },
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance || 0,
      },
    });
  }catch(error){
    console.error(`login error → ${error}`);
    return res.status(500).json({msg: "Login failed. Please try again.", success: false})
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, mobile_number, profilePicture, partnerName, weddingDate, preferences } = req.body;
    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (mobile_number) user.mobile_number = mobile_number.trim();
    if (profilePicture !== undefined) user.profilePicture = profilePicture.trim();
    if (partnerName !== undefined) user.partnerName = partnerName.trim();
    if (weddingDate !== undefined) user.weddingDate = weddingDate ? new Date(weddingDate) : null;
    
    if (preferences) {
      user.preferences = {
        honeymoonVibe: preferences.honeymoonVibe || '',
        dietaryPreference: preferences.dietaryPreference || '',
        departureCity: preferences.departureCity || '',
      };
    }

    await user.save();

    return res.status(200).json({
      msg: 'Profile updated successfully',
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile_number: user.mobile_number,
        profilePicture: user.profilePicture,
        partnerName: user.partnerName,
        weddingDate: user.weddingDate,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error(`updateProfile error → ${error}`);
    return res.status(500).json({ msg: 'Failed to update profile. Please try again.', success: false });
  }
};

export const addItineraryReview = async (req, res) => {
  try {
    const { id } = req.params; // Itinerary ID
    const { rating, message } = req.body;

    if (!rating || !message) {
      return res.status(400).json({ msg: 'Rating and message are required', success: false });
    }

    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    const itinerary = await itineraryModel.findById(id);
    if (!itinerary) {
      return res.status(404).json({ msg: 'Itinerary not found', success: false });
    }

    const newReview = {
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
      message: message.trim(),
      rating: Number(rating),
      profileImage: user.profilePicture || '',
      isApproved: false, // Must be approved by superadmin
      userId: user._id,
    };

    itinerary.reviews.push(newReview);
    await itinerary.save();

    return res.status(200).json({
      msg: 'Review submitted successfully. It will be visible once approved by Superadmin.',
      success: true,
      review: newReview,
    });
  } catch (error) {
    console.error(`addItineraryReview error → ${error}`);
    return res.status(500).json({ msg: 'Failed to submit review.', success: false });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized access', success: false });
    }

    // Find all itineraries containing at least one review from this user
    const itineraries = await itineraryModel.find({ "reviews.userId": userId });

    let userReviews = [];
    itineraries.forEach(itinerary => {
      if (itinerary.reviews && Array.isArray(itinerary.reviews)) {
        itinerary.reviews.forEach(review => {
          if (review.userId && review.userId.toString() === userId.toString()) {
            userReviews.push({
              _id: review._id,
              rating: review.rating,
              message: review.message,
              isApproved: review.isApproved !== false,
              createdAt: review.createdAt || itinerary.updatedAt,
              itineraryId: itinerary._id,
              itineraryTitle: itinerary.title,
            });
          }
        });
      }
    });

    // Sort reviews by creation date descending
    userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      reviews: userReviews
    });
  } catch (error) {
    console.error(`getMyReviews error → ${error}`);
    return res.status(500).json({ msg: 'Failed to retrieve reviews.', success: false });
  }
};

export const getMyEnquiries = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ msg: 'Unauthorized access', success: false });
    }

    // Find user to get their email
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    // Fetch leads matching user's email from all collections
    const [itineraryLeads, consultationLeads, tripLeads, journeyLeads, contactLeads] = await Promise.all([
      ItineraryLead.find({ email: user.email }),
      ConsultationLead.find({ email: user.email }),
      planYourTrip.find({ email: user.email }),
      PlanYourJourney.find({ email: user.email }),
      contactModel.find({ email: user.email })
    ]);

    // Normalize all to a unified enquiry object format
    const allEnquiries = [
      ...itineraryLeads.map(l => ({
        ...l.toObject(),
        type: 'Itinerary Booking',
      })),
      ...consultationLeads.map(l => ({
        ...l.toObject(),
        type: 'Consultation',
        itineraryTitle: l.itineraryTitle || 'General Consultation',
      })),
      ...tripLeads.map(l => ({
        ...l.toObject(),
        type: 'Trip Request',
        itineraryTitle: `Trip: ${l.from || 'Origin'} to ${l.to || 'Destination'}`,
        travelers: `${(l.adults || 0) + (l.kids || 0)} People`,
      })),
      ...journeyLeads.map(l => ({
        ...l.toObject(),
        type: 'Journey Plan',
        itineraryTitle: `Journey to ${l.destination || 'Custom Destination'}`,
      })),
      ...contactLeads.map(l => ({
        ...l.toObject(),
        type: 'Contact Inquiry',
        itineraryTitle: `Subject: ${l.subject || 'General Inquiry'}`,
        status: l.status === 'resolved' ? 'booked' : (l.status === 'in_progress' ? 'in_progress' : 'new')
      }))
    ];

    // Sort by newest first
    const sortedEnquiries = allEnquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      enquiries: sortedEnquiries
    });
  } catch (error) {
    console.error(`getMyEnquiries error → ${error}`);
    return res.status(500).json({ msg: 'Failed to retrieve enquiries.', success: false });
  }
};

export const getReferrals = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    if (!user.referral_code) {
      let code;
      let exists = true;
      while (exists) {
        const prefix = user.firstName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'T2H';
        const suffix = Math.floor(1000 + Math.random() * 9000);
        code = `${prefix}${suffix}`;
        const found = await userModel.findOne({ referral_code: code });
        if (!found) {
          exists = false;
        }
      }
      user.referral_code = code;
      await user.save();
    }

    const referees = await userModel.find({ referred_by: user.referral_code }).select('firstName lastName email createdAt');

    const referralsList = await Promise.all(
      referees.map(async (referee) => {
        const bookingCount = await ItineraryBooking.countDocuments({
          user_id: referee._id,
          status: 'confirmed'
        });

        return {
          firstName: referee.firstName,
          lastName: referee.lastName,
          email: referee.email,
          joinedAt: referee.createdAt,
          hasPurchased: bookingCount > 0
        };
      })
    );

    const transactions = await WalletTransaction.find({ user_id: user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      referral_code: user.referral_code,
      wallet_balance: user.wallet_balance || 0,
      referrals: referralsList,
      transactions
    });
  } catch (error) {
    console.error('getReferrals error:', error);
    return res.status(500).json({ success: false, msg: 'Failed to retrieve referral dashboard data' });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId }).sort({ created_at: -1 }).limit(50);
    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, msg: 'Failed to retrieve notifications' });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({
      success: true,
      msg: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('markNotificationsRead error:', error);
    return res.status(500).json({ success: false, msg: 'Failed to mark notifications as read' });
  }
};