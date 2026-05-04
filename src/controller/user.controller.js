import bcrypt from 'bcrypt';
import userModel from '../models/user.model.js';
import { generateToken } from '../utils.js';
import { ENV } from '../config/ENV.js';

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
    const { mobile_number, name } = req.body;

    // --- Validation ---
    if (!mobile_number) {
      return res.status(400).json({ msg: 'Mobile number is required', success: false });
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile_number)) {
      return res
        .status(400)
        .json({ msg: 'Please enter a valid 10-digit Indian mobile number', success: false });
    }

    // --- Generate 6-digit OTP ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // --- Hash OTP before storing ---
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    // --- Upsert user (create if not exists, update if exists) ---
    await userModel.findOneAndUpdate(
      { mobile_number },
      {
        mobile_number,
        name: name?.trim() || undefined,
        otp: hashedOtp,
        otp_expiry,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // --- DEV MODE: Log OTP to server console (remove when SMS is integrated) ---
    if (IS_DEV) {
      console.log(`\n========================================`);
      console.log(`📱 DEV MODE OTP for ${mobile_number}: ${otp}`);
      console.log(`⏰ Expires at: ${otp_expiry.toISOString()}`);
      console.log(`========================================\n`);
    }

    // TODO: Replace this with Fast2SMS or Twilio in production
    // await sendSMS(mobile_number, `Your TripToHoneymoon OTP is: ${otp}. Valid for 5 minutes.`);

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
    const { mobile_number, otp } = req.body;

    // --- Validation ---
    if (!mobile_number || !otp) {
      return res
        .status(400)
        .json({ msg: 'Mobile number and OTP are required', success: false });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ msg: 'OTP must be a 6-digit number', success: false });
    }

    // --- Find user ---
    const user = await userModel.findOne({ mobile_number });

    if (!user) {
      return res
        .status(400)
        .json({ msg: 'No OTP request found. Please request a new OTP.', success: false });
    }

    // --- Check expiry first (fast fail before bcrypt) ---
    if (!user.otp_expiry || new Date() > user.otp_expiry) {
      return res
        .status(400)
        .json({ msg: 'OTP has expired. Please request a new one.', success: false });
    }

    // --- Verify OTP hash ---
    if (!user.otp) {
      return res
        .status(400)
        .json({ msg: 'No OTP found. Please request a new one.', success: false });
    }

    const isOtpValid = await bcrypt.compare(otp.toString(), user.otp);

    if (!isOtpValid) {
      return res.status(400).json({ msg: 'Invalid OTP. Please try again.', success: false });
    }

    // --- OTP is valid: clear it and mark user as verified ---
    user.otp = undefined;
    user.otp_expiry = undefined;
    user.is_verified = true;
    user.last_login = new Date();
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
      msg: 'Login successful',
      success: true,
      token, // Also return in body for localStorage fallback
      user: {
        id: user._id,
        name: user.name || null,
        mobile_number: user.mobile_number,
      },
    });
  } catch (error) {
    console.error(`verifyOtp error → ${error}`);
    return res.status(500).json({ msg: 'Verification failed. Please try again.', success: false });
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
    const user = await userModel.findById(req.userId).select('-otp -otp_expiry');

    if (!user) {
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name || null,
        mobile_number: user.mobile_number,
        is_verified: user.is_verified,
        last_login: user.last_login,
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
