import textTestimonialModel from '../models/textTestimonial.model.js';
import { getPresignedViewUrl } from './admin/s3.controller.js';

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Text Testimonials
export const processTextTestimonialImages = async (testimonials) => {
  const arr = Array.isArray(testimonials) ? testimonials : [testimonials];
  return await Promise.all(
    arr.map(async (t) => {
      const tObj = t.toObject ? t.toObject() : t;
      // Process profileImage
      if (tObj.profileImage && !tObj.profileImage.startsWith('http')) {
        tObj.profileImage = await getPresignedViewUrl(tObj.profileImage);
      }
      // Process trip_image array
      if (tObj.trip_image && Array.isArray(tObj.trip_image)) {
        tObj.trip_image = await Promise.all(
          tObj.trip_image.map((img) =>
            img && !img.startsWith('http') ? getPresignedViewUrl(img) : img
          )
        );
        tObj.trip_image = tObj.trip_image.filter(Boolean);
      }
      return tObj;
    })
  );
};

export const createTextTestimonial = async (req, res) => {
  try {
    const { name, location, rating, travelDate, destination, message, toShow } = req.body;

    // Now receiving S3 keys from frontend (JSON body)
    const profileImage = req.body.profileImage_key || null;
    const trip_image = req.body.trip_image_keys
      ? Array.isArray(req.body.trip_image_keys)
        ? req.body.trip_image_keys
        : [req.body.trip_image_keys]
      : [];

    const newTestimonial = new textTestimonialModel({
      name,
      location,
      rating,
      travelDate,
      destination,
      profileImage,
      trip_image,
      message,
      toShow: toShow === 'true' || toShow === true || false,
    });
    const savedTestimonial = await newTestimonial.save();
    res.status(201).json({ success: true, data: savedTestimonial });
  } catch (error) {
    console.error('Error creating text testimonial:', error);
    
    // Handle Mongoose Validation Errors specifically
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// Fetch all text testimonials (for admin list)
export const getTextTestimonials = async (req, res) => {
  try {
    const testimonials = await textTestimonialModel.find().sort({ createdAt: -1 });
    const processed = await processTextTestimonialImages(testimonials);
    return res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error('Error fetching text testimonials:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Fetch only verified text testimonials (for public frontend)
export const getActiveTextTestimonials = async (req, res) => {
  try {
    const testimonials = await textTestimonialModel.find({ toShow: true }).sort({ createdAt: -1 });
    const processed = await processTextTestimonialImages(testimonials);
    return res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error('Error fetching active testimonials:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Toggle the `toShow` / verification flag for a testimonial
export const toggleVerifyTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { toShow } = req.body;
    const updated = await textTestimonialModel.findByIdAndUpdate(
      id,
      { toShow },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error toggling testimonial verify:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Delete a text testimonial
export const deleteTextTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await textTestimonialModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    return res.status(200).json({ success: true, message: 'Testimonial deleted successfully', data: deleted });
  } catch (error) {
    console.error('Error deleting text testimonial:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};