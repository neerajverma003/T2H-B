import bcrypt from 'bcrypt';
import userModel from '../models/user.model.js';
import { generateToken } from '../utils.js';

export const sendOtp = async (req, res) => {
  try {
    const { mobile_number, name } = req.body;

    if (!mobile_number) {
      return res.status(400).json({ msg: 'Mobile number required', success: false });
    }

    const otp = Math.floor(Math.random() * 9000) + 1000;
    const otp_expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp.toString(), salt);

    let user = await userModel.findOne({ mobile_number });

    if (!user) {
      // New user
      await userModel.create({
        mobile_number,
        name: name || null,
        otp: hashedOTP,
        otp_expiry,
      });
    } else {
      // Existing user
      user.otp = hashedOTP;
      user.otp_expiry = otp_expiry;
      await user.save();
    }

    // console.log(`OTP for ${mobile_number}: ${otp}`); // Replace with SMS API in production

    return res.status(200).json({ msg: 'OTP sent successfully', success: true });
  } catch (error) {
    console.error(`sendOtp error -> ${error}`);
    return res.status(500).json({ msg: 'Server error', success: false });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { mobile_number, otp } = req.body;

    const user = await userModel.findOne({ mobile_number });

    if (!user) {
      return res.status(400).json({ msg: 'User not found', success: false });
    }
    console.log(user)
    console.log(otp);

    const isOTPValid = await bcrypt.compare(otp.toString(), user.otp);

    if (!isOTPValid || Date.now() > user.otp_expiry) {
      return res.status(400).json({ msg: 'Invalid or expired OTP', success: false });
    }

    user.otp = undefined;
    user.otp_expiry = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ msg: 'Logged in successfully', success: true });
  } catch (error) {
    console.error(`verifyOtp error -> ${error}`);
    return res.status(500).json({ msg: 'Server error', success: false });
  }
};
