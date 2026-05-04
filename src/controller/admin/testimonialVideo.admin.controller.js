import VideoTestimonialModel from '../../models/testimonialVideos.model.js';
import { getPresignedViewUrl } from './s3.controller.js';

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Testimonials
export const processTestimonialVideos = async (testimonials) => {
  const testimonialsArray = Array.isArray(testimonials) ? testimonials : [testimonials];
  return await Promise.all(
    testimonialsArray.map(async (t) => {
      const tObj = t.toObject ? t.toObject() : t;
      if (tObj.video_url && !tObj.video_url.startsWith('http')) {
        tObj.video_url = await getPresignedViewUrl(tObj.video_url);
      }
      return tObj;
    })
  );
};

export const testimonialVideo = async (req, res) => {
  const { title, visibility, location } = req.body;
  try {
    console.log('Upload request received:', { title, visibility, location, fileInfo: req.file?.filename });
    
    // Validate required fields
    if (!title || !visibility || !location) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, visibility, location) are required',
        received: { title, visibility, location }
      });
    }

    // Validate file upload
    // Now receiving S3 key from frontend
    const videoUrl = req.body.video_key || null;
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video key is required'
      });
    }

    const visibilityValue = visibility?.trim() || 'public';
    
    const newTestimonial = new VideoTestimonialModel({
      video_url: videoUrl,
      title: title?.trim(),
      visibility: visibilityValue,
      location: location?.trim(),
    });
    
    console.log('About to save testimonial:', { video_url: videoUrl, title: title?.trim(), visibility: visibilityValue, location: location?.trim() });

    await newTestimonial.save();
    
    console.log('Testimonial saved successfully:', newTestimonial);

    const [processed] = await processTestimonialVideos([newTestimonial]);

    return res.status(201).json({
      success: true,
      message: 'Testimonial video uploaded successfully',
      data: processed
    });
  } catch (error) {
    console.error(`Testimonial video error:`, error);
    console.error('Error details:', { name: error.name, message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while uploading testimonial video',
      errorDetails: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

export const getAllTestimonialVideos = async (req, res) => {
  try {
    const testimonials = await VideoTestimonialModel.find().sort({ createdAt: -1 });
    
    const processed = await processTestimonialVideos(testimonials);
    
    return res.status(200).json({
      success: true,
      message: 'Testimonial videos fetched successfully',
      data: processed,
      total: testimonials.length
    });
  } catch (error) {
    console.error(`Fetch testimonial videos error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching testimonial videos'
    });
  }
};

export const deleteTestimonialVideo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Testimonial ID is required'
      });
    }

    const deletedTestimonial = await VideoTestimonialModel.findByIdAndDelete(id);

    if (!deletedTestimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial video not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Testimonial video deleted successfully',
      data: deletedTestimonial
    });
  } catch (error) {
    console.error(`Delete testimonial video error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting testimonial video'
    });
  }
};
