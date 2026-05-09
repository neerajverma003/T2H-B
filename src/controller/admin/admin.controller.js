import AdminModel from '../../models/adminUser.model.js';
import bcrypt from 'bcrypt';
import { generateToeknAdmin } from '../../utils.js';
import UserModel from '../../models/user.model.js';
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
