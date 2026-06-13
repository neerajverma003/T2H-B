import AdminModel from '../../models/adminUser.model.js';
import bcrypt from 'bcrypt';
import { generateToeknAdmin } from '../../utils.js';
import UserModel from '../../models/user.model.js';
import ReferralAuditLog from '../../models/referralAuditLog.model.js';
import Notification from '../../models/notification.model.js'; 
export const AdminUserVerify = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(username, password);
    if (!username || !password) {
      return res.status(400).json({ msg: 'username or password required', success: false });
    }
    const isUserExists = await AdminModel.findOne({ username });
    if (!isUserExists) {
      return res.status(400).json({ msg: 'User does not exists', success: false });
    }
    // console.log(isUserExists.password);
    const matchedPaswword = await bcrypt.compare(password, isUserExists.password);
    // console.log(matchedPaswword);
    if (!matchedPaswword) {
      return res.status(401).json({ msg: 'Incorrect Password', success: false });
    }
    const token = generateToeknAdmin(isUserExists._id, isUserExists.role);
    // console.log(token);
    
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,           // HTTPS only in production
      sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-subdomain in prod
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      msg: 'Login Successfull ',
      success: true,
      username: isUserExists.username,
      role: isUserExists.role,
      token,
    });
  } catch (error) {
    console.error(`itinerary Admin User -> ${error}`);
    return res.status(500).json({ msg: 'Server Pannel', success: false });
  }
};

// For Admin User Change Password
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ msg: 'All fields are required', success: false });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ msg: 'New password and confirm password do not match', success: false });
  }

  try {
    const loggedInuser = await AdminModel.findById(req.userId);

    if (!loggedInuser) {
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, loggedInuser.password);

    if (!isPasswordCorrect) {
      return res.status(409).json({ msg: 'Please enter correct old password', success: false });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    loggedInuser.password = hashedPassword;
    await loggedInuser.save();

    return res.status(200).json({ msg: 'Password changed successfully', success: true });
  } catch (error) {
    console.log(`Change Password Error -> ${error}`);
    return res.status(500).json({ msg: 'Server error', success: false });
  }
};

// For Admin User creation
export const AdminUserCreate = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ msg: 'All fields are required', success: false });
    }
    const isUserExist = await AdminModel.findOne({ username });
    if (isUserExist) {
      return res.status(400).json({ msg: 'User Already Exists', success: false });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new AdminModel({
      username,
      password: hashedPassword,
      role: req.body.role || 'admin', // Allow specifying role
    });
    await newUser.save();
    return res.status(200).json({ msg: 'Administrative user created successfully', success: true });
  } catch (error) {
    console.error(`itinerary Admin user create -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};
//  get all the existing user in dashboard

export const userExistedInAdmin = async (req, res) => {
  try {
    const adminUser = await AdminModel.find({}).sort({ createdAt: -1 });
    if (!adminUser) {
      return res.status(401).json({ msg: 'no othre user Exists', success: false });
    }

    return res.status(200).json({ msg: 'User fetched successfully', success: true, adminUser });
  } catch (error) {
    console.log(`Side Bar user for admin ${error}`);
    return res.status(500).json({ msg: 'Server error', success: false });
  }
};

// create /me controlller
export const getMe = async (req, res) => {
  try {
    const { userId } = req;

    // Fetch fresh user data from DB to prevent stale JWT roles
    const user = await AdminModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      userId: user.username, // Send username mapped to userId for frontend compatibility
      role: user.role,       // Send the fresh role from the database
      msg: 'User authenticated',
    });
  } catch (err) {
    console.error('/me error:', err);
    return res.status(500).json({ success: false, msg: 'Something went wrong' });
  }
};

export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    return res.status(200).json({ msg: 'Logout successful', success: true });
  } catch (error) {
    console.log(`Logout Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

// Delete admin user *Done only by Admin*

export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  // console.log(userId);
  try {
    const userData = await AdminModel.findById(userId);
    if (!userData) {
      return res
        .status(404)
        .json({ msg: 'User Which u wanted to delete does not exists', success: false });
    }
    if (userData.role === 'superadmin') {
      return res.status(403).json({ msg: 'You cannot delete a Superadmin account', success: false });
    }
    await AdminModel.findOneAndDelete({ _id: userId });
    return res.status(200).json({ msg: 'User Deleted Successfully', success: true });
  } catch (error) {
    console.log(`Delete User -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

export const getRegisteredCustomers = async (req, res) => {
  try {
    const users = await UserModel.find({}).sort({ createdAt: -1 });
    
    const usersList = await Promise.all(
      users.map(async (user) => {
        // Count how many referrals this user has made
        const referralCount = await UserModel.countDocuments({ referred_by: user.referral_code, is_verified: true });
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile_number: user.mobile_number,
          wallet_balance: user.wallet_balance || 0,
          referral_code: user.referral_code,
          referred_by: user.referred_by,
          is_wallet_frozen: user.is_wallet_frozen || false,
          wallet_frozen_reason: user.wallet_frozen_reason || '',
          referralCount,
          createdAt: user.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      msg: 'Customers fetched successfully',
      customers: usersList
    });
  } catch (error) {
    console.error('getRegisteredCustomers error:', error);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

export const toggleCustomerWalletFreeze = async (req, res) => {
  try {
    const { userId } = req.params;
    const { freeze, reason } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'Customer not found' });
    }

    user.is_wallet_frozen = freeze;
    user.wallet_frozen_reason = freeze ? (reason || 'Admin manual freeze') : '';
    await user.save();

    // Log the audit event
    const auditLog = new ReferralAuditLog({
      referrerId: user._id,
      action: freeze ? 'MANUAL_FREEZE' : 'MANUAL_UNFREEZE',
      details: freeze 
        ? `Wallet frozen manually by admin. Reason: ${reason || 'None provided'}`
        : 'Wallet unfrozen manually by admin.',
      referralCountIn24h: 0,
      triggeredBySystem: false,
      adminUser: req.username || 'Admin'
    });
    await auditLog.save();

    // Notify the user in-app
    const notif = new Notification({
      userId: user._id,
      title: freeze ? 'Wallet Frozen' : 'Wallet Unfrozen',
      message: freeze 
        ? `Your wallet has been frozen by administration. Reason: ${reason || 'None provided'}`
        : 'Your wallet has been unfrozen. You can now use your travel credits again.',
      type: 'system'
    });
    await notif.save();

    return res.status(200).json({
      success: true,
      msg: `Customer wallet successfully ${freeze ? 'frozen' : 'unfrozen'}`
    });
  } catch (error) {
    console.error('toggleCustomerWalletFreeze error:', error);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

export const getReferralAuditLogs = async (req, res) => {
  try {
    const logs = await ReferralAuditLog.find({})
      .populate('referrerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('getReferralAuditLogs error:', error);
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
};

