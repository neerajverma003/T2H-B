import testimonialModel from '../models/testimonialVideos.model.js';
import { getPresignedViewUrl } from './admin/s3.controller.js';

export const testimonal = async (req, res) => {
  try {
    const testimonials = await testimonialModel
      .find({ visibility: { $in: ['public', 'Public'] } })
      .sort({ createdAt: -1 });

    if (!testimonials || testimonials.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No testimonials found',
        data: []
      });
    }

    // Process S3 keys to presigned view URLs
    const normalized = await Promise.all(
      testimonials.map(async (t) => {
        const obj = t.toObject ? t.toObject() : { ...t };
        if (obj.video_url && !obj.video_url.startsWith('http')) {
          obj.video_url = await getPresignedViewUrl(obj.video_url);
        }
        return obj;
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Testimonials fetched successfully',
      data: normalized
    });
  } catch (error) {
    console.error(`Fetch testimonials error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching testimonials'
    });
  }
};