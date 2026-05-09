import itineraryModel from '../../models/itinerary.model.js';
import { getPresignedViewUrl, extractS3Key } from './s3.controller.js';
import { logActivity } from '../../utils/auditLogger.js';

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Itineraries
export const processItineraryImages = async (itineraries) => {
  const itinerariesArray = Array.isArray(itineraries) ? itineraries : [itineraries];
  return await Promise.all(
    itinerariesArray.map(async (itinerary) => {
      const itObj = itinerary.toObject ? itinerary.toObject() : itinerary;

      // Process main images
      if (itObj.destination_images && Array.isArray(itObj.destination_images)) {
        const signed = await Promise.all(
          itObj.destination_images.map(img => img.startsWith('http') ? img : getPresignedViewUrl(img))
        );
        itObj.destination_images = signed.filter(u => u !== null);
      }

      // Process thumbnails
      if (itObj.destination_thumbnails && Array.isArray(itObj.destination_thumbnails)) {
        const signed = await Promise.all(
          itObj.destination_thumbnails.map(img => img.startsWith('http') ? img : getPresignedViewUrl(img))
        );
        itObj.destination_thumbnails = signed.filter(u => u !== null);
      }

      // Process video
      if (itObj.destination_video && !itObj.destination_video.startsWith('http')) {
        itObj.destination_video = await getPresignedViewUrl(itObj.destination_video);
      }

      // Process Days Information Images
      if (itObj.days_information && Array.isArray(itObj.days_information)) {
        itObj.days_information = await Promise.all(
          itObj.days_information.map(async (day) => {
            if (day.day_image && !day.day_image.startsWith('http')) {
              return { ...day, day_image: await getPresignedViewUrl(day.day_image) };
            }
            return day;
          })
        );
      }
      
      // Process Reviews Profile Images
      if (itObj.reviews && Array.isArray(itObj.reviews)) {
        itObj.reviews = await Promise.all(
          itObj.reviews.map(async (rev) => {
            if (rev.profileImage && !rev.profileImage.startsWith('http')) {
              return { ...rev, profileImage: await getPresignedViewUrl(rev.profileImage) };
            }
            return rev;
          })
        );
      }

      return itObj;
    })
  );
};

export const createItinerary = async (req, res) => {
  try {
    // Utility to safely parse JSON
    const parseJSON = (data) => {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    };

    // Helpful debug logs to diagnose why submissions fail
    console.log('=== Create Itinerary Request ===');
    console.log('Headers:', {
      host: req.get('host'),
      protocol: req.protocol,
      'content-type': req.get('content-type'),
    });
    console.log('Body keys:', Object.keys(req.body || {}));
    // Only print a subset (avoid logging large base64 blobs fully)
    const bodyPreview = Object.fromEntries(
      Object.entries(req.body || {}).map(([k, v]) => [k, typeof v === 'string' && v.length > 200 ? `${v.slice(0, 200)}...` : v])
    );
    console.log('Body (preview):', bodyPreview);
    // Now receiving S3 keys directly from body
    const { video_key } = req.body;
    const videoPath = video_key || null;

    const {
      title,
      itinerary_visibility,
      itinerary_type,
      cancellation_policy,
      classification,
      days_information,
      destination_detail,
      destination_images_urls,
      destination_thumbnails_urls,
      // support frontend field names `destination_images` and `destination_thumbnails` (they send selected URLs and base64 previews)
      destination_images,
      destination_thumbnails,
      duration,
      exclusion,
      hotel_as_per_category,
      inclusion,
      itinerary_theme,
      payment_mode,
      pricing,
      selected_destination_id,
      terms_and_conditions,
      reviews,
    } = req.body;

    const parsedClassification = parseJSON(classification);
    const parsedDaysInformation = parseJSON(days_information);
    const parsedDestinationDetail = parseJSON(destination_detail);
    // Parse gallery S3 Keys from the body
    const parsedDestinationImages = parseJSON(destination_images) || [];
    const parsedDestinationThumbnails = parseJSON(destination_thumbnails) || [];
    const parsedReviews = parseJSON(reviews);

    const uploadedDestinationImages = [];
    const uploadedDestinationThumbnails = [];
    const parsedItineraryTheme = parseJSON(itinerary_theme);
    const parsedPricing = parseJSON(pricing);

    // Validate pricing format
    let finalPricing;
    if (typeof parsedPricing === 'string') {
      if (parsedPricing.trim() === '' || parsedPricing === 'As per best quote') {
        finalPricing = { is_price_on_request: true };
      } else if (parsedPricing !== 'As per the destination') {
        return res.status(400).json({
          success: false,
          message: "Invalid pricing format. Must be 'As per the destination' or pricing object.",
        });
      } else {
        finalPricing = parsedPricing;
      }
    } else if (
      typeof parsedPricing === 'object' &&
      parsedPricing !== null &&
      (parsedPricing.is_price_on_request === true ||
        (typeof parsedPricing.standard_price === 'number' && typeof parsedPricing.discounted_price === 'number'))
    ) {
      finalPricing = parsedPricing;
    } else {
      return res.status(400).json({
        success: false,
        message:
          'Invalid pricing object. Must contain is_price_on_request or standard_price/discounted_price.',
      });
    }

    // Ensure required fields
    if (!title || !selected_destination_id || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing. title, selected_destination_id and duration are mandatory.',
      });
    }

    // Ensure at least one destination image exists (from JSON or uploaded files)
    const providedDestinationImages = Array.isArray(parsedDestinationImages)
      ? parsedDestinationImages.map((image) => image?.url || image).filter((u) => typeof u === 'string' && u.trim() !== '')
      : [];

    if (providedDestinationImages.length === 0 && uploadedDestinationImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one destination image is required (upload or provide URL).',
      });
    }

    const newItinerary = new itineraryModel({
      title,
      itinerary_visibility,
      itinerary_type,
      cancellation_policy,
      classification: parsedClassification,
      days_information: Array.isArray(parsedDaysInformation)
        ? parsedDaysInformation.map(day => ({ ...day, day_image: extractS3Key(day.day_image) }))
        : parsedDaysInformation,
      destination_detail: parsedDestinationDetail,
      // Merge any JSON-provided images with actual uploaded file paths (uploaded files take precedence appended at end)
      destination_images: [
        ...(providedDestinationImages || []),
        ...uploadedDestinationImages,
      ],
      destination_thumbnails: [
        ...(Array.isArray(parsedDestinationThumbnails) ? parsedDestinationThumbnails.map((image) => image?.url || image).filter((u) => typeof u === 'string' && u.trim() !== '') : []),
        ...uploadedDestinationThumbnails,
      ],
      destination_video: videoPath,
      duration,
      exclusion,
      hotel_as_per_category,
      inclusion,
      itinerary_theme: parsedItineraryTheme,
      payment_mode,
      pricing: finalPricing,
      selected_destination: selected_destination_id,
      terms_and_conditions,
      reviews: Array.isArray(parsedReviews)
        ? parsedReviews.map(rev => ({ ...rev, profileImage: extractS3Key(rev.profileImage) }))
        : [],
    });

    const savedItinerary = await newItinerary.save();

    const [processedItinerary] = await processItineraryImages([savedItinerary]);

    // Log the activity
    await logActivity({
      adminId: req.userId,
      action: 'CREATE',
      module: 'ITINERARY',
      details: `Created new itinerary: ${title}`,
      targetId: savedItinerary._id,
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Itinerary created successfully.',
      data: processedItinerary,
    });
  } catch (error) {
    console.error('Create Itinerary Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create itinerary.',
      error: error.message,
    });
  }
};

export const getAllItinerary = async (req, res) => {
  try {
    const itineraries = await itineraryModel
      .find({})
      .populate('selected_destination')
      .sort({ createdAt: -1 }); //find the itineraries according to the latest created date
    console.log('Fetched Itineraries count:', itineraries.length);
    const processed = await processItineraryImages(itineraries);
    return res.status(200).json({
      success: true,
      data: processed,
    });
  } catch (error) {
    console.error('Get All Itineraries Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch itineraries.',
      error: error.message,
    });
  }
};




export const getItineraryById = async (req, res) => {
  try {
    const { id } = req.params;
    const itinerary = await itineraryModel.findById(id).populate('selected_destination');

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found.',
      });
    }

    const [processed] = await processItineraryImages([itinerary]);

    return res.status(200).json({
      success: true,
      data: processed,
    });
  } catch (error) {
    console.error('Get Itinerary By ID Error:', error);
    return res.status(500).json({
      success: false,
      msg: 'Failed to fetch itinerary.',
      error: error.message,
    });
  }
};

export const deleteItinerary = async (req, res) => {
  console.log('Delete Itinerary Request:', req.params);
  try {
    const { id } = req.params;
    const deletedItinerary = await itineraryModel.findByIdAndDelete(id);

    if (!deletedItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found.',
      });
    }

    return res.status(200).json({
      success: true,
      msg: 'Itinerary deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Itinerary Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete itinerary.',
      error: error.message,
    });
  }
};

// Updating the itinerary

export const updateItinerary = async (req, res) => {
  try {
    const parseJSON = (data) => {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    };

    const {
      title,
      itinerary_visibility,
      itinerary_type,
      cancellation_policy,
      classification,
      days_information,
      destination_detail,
      destination_images,
      destination_thumbnails,
      duration,
      exclusion,
      hotel_as_per_category,
      inclusion,
      itinerary_theme,
      payment_mode,
      pricing,
      selected_destination_id,
      terms_and_conditions,
      reviews,
    } = req.body;

    // --- Parse inputs the same way as creation ---
    const parsedClassification = parseJSON(classification);
    const parsedDaysInformation = parseJSON(days_information);
    const parsedDestinationDetail = parseJSON(destination_detail);
    const parsedDestinationImages = parseJSON(destination_images);
    const parsedDestinationThumbnails = parseJSON(destination_thumbnails);
    const parsedItineraryTheme = parseJSON(itinerary_theme);
    const parsedPricing = parseJSON(pricing);
    const parsedReviews = parseJSON(reviews);

    console.log('--- DEBUG PRICING ---');
    console.log('pricing from body:', pricing);
    console.log('parsedPricing:', parsedPricing);
    console.log('type of parsedPricing:', typeof parsedPricing);

    // --- Validate pricing ---
    let finalPricing;
    if (typeof parsedPricing === 'string') {
      if (parsedPricing.trim() === '' || parsedPricing === 'As per best quote') {
        finalPricing = { is_price_on_request: true };
      } else if (parsedPricing !== 'As per the destination') {
        return res.status(400).json({
          success: false,
          message: "Invalid pricing format. Must be 'As per the destination' or pricing object.",
        });
      } else {
        finalPricing = parsedPricing;
      }
    } else if (
      typeof parsedPricing === 'object' &&
      parsedPricing !== null &&
      (parsedPricing.is_price_on_request === true ||
        (typeof parsedPricing.standard_price === 'number' && typeof parsedPricing.discounted_price === 'number'))
    ) {
      finalPricing = parsedPricing;
    } else {
      return res.status(400).json({
        success: false,
        message:
          'Invalid pricing object. Must contain is_price_on_request or standard_price/discounted_price.',
      });
    }

    // --- Handle S3 Keys from body ---
    const video_key = req.body.video_key;
    const videoPath = video_key || undefined;

    const uploadedDestinationImagesUpdate = [];
    const uploadedDestinationThumbnailsUpdate = [];

    const updateFields = {
      title,
      itinerary_visibility,
      itinerary_type,
      cancellation_policy,
      classification: parsedClassification,
      days_information: Array.isArray(parsedDaysInformation)
        ? parsedDaysInformation.map(day => ({ ...day, day_image: extractS3Key(day.day_image) }))
        : parsedDaysInformation,
      destination_detail: parsedDestinationDetail,
      destination_images: [
        ...(Array.isArray(parsedDestinationImages) ? parsedDestinationImages.map((image) => extractS3Key(image?.url || image)) : []),
        ...uploadedDestinationImagesUpdate,
      ],
      destination_thumbnails: [
        ...(Array.isArray(parsedDestinationThumbnails) ? parsedDestinationThumbnails.map((image) => extractS3Key(image?.url || image)) : []),
        ...uploadedDestinationThumbnailsUpdate,
      ],
      duration,
      exclusion,
      hotel_as_per_category,
      inclusion,
      itinerary_theme: parsedItineraryTheme,
      payment_mode,
      pricing: finalPricing,
      selected_destination: selected_destination_id,
      terms_and_conditions,
      reviews: Array.isArray(parsedReviews)
        ? parsedReviews.map(rev => ({ ...rev, profileImage: extractS3Key(rev.profileImage) }))
        : [],
    };

    if (videoPath) {
      updateFields.destination_video = videoPath;
    }

    const updatedItinerary = await itineraryModel.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!updatedItinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found.',
      });
    }

    const [processed] = await processItineraryImages([updatedItinerary]);

    // Log the activity
    await logActivity({
      adminId: req.userId,
      action: 'UPDATE',
      module: 'ITINERARY',
      details: `Updated itinerary: ${title}`,
      targetId: updatedItinerary._id,
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Itinerary updated successfully.',
      data: processed,
    });
  } catch (error) {
    console.error('Update Itinerary Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update itinerary.',
      error: error.message,
    });
  }
};
