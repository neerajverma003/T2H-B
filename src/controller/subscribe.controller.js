import subscribeModel from '../models/subscribe.model.js';

/**
 * Handle user subscription
 */
export const subscribe = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if user already subscribed
    const existingSubscriber = await subscribeModel.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed'
      });
    }

    // Create new subscriber
    const newSubscriber = new subscribeModel({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      archive: false
    });

    // Save to database
    await newSubscriber.save();

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing!',
      data: {
        id: newSubscriber._id,
        name: newSubscriber.name,
        email: newSubscriber.email
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while processing subscription'
    });
  }
};

/**
 * Get all subscribers (admin only)
 */
export const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await subscribeModel.find({ archive: false }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Subscribers fetched successfully',
      data: subscribers,
      total: subscribers.length
    });
  } catch (error) {
    console.error('Fetch subscribers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching subscribers'
    });
  }
};

/**
 * Archive a subscriber (soft delete)
 */
export const archiveSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Subscriber ID is required'
      });
    }

    const archived = await subscribeModel.findByIdAndUpdate(
      id,
      { archive: true },
      { new: true }
    );

    if (!archived) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscriber archived successfully',
      data: archived
    });
  } catch (error) {
    console.error('Archive subscriber error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while archiving subscriber'
    });
  }
};
