import bcrypt from 'bcrypt';
import userModel from '../models/user.model.js';
import itineraryModel from '../models/itinerary.model.js';
import { generateToken } from '../utils.js';
import { ENV } from '../config/ENV.js';
import { sendOtpEmail } from '../utils/email.js';

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
    const { email,otp,password,firstName, lastName, mobile_number } = req.body;

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