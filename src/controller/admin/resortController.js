import Resort from "../../models/resort.model.js"
import mongoose from "mongoose";
import { getPresignedViewUrl, extractS3Key } from "./s3.controller.js";

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Resorts
export const processResortImages = async (resorts) => {
  const resortsArray = Array.isArray(resorts) ? resorts : [resorts];
  return await Promise.all(
    resortsArray.map(async (resort) => {
      const resortObj = resort.toObject ? resort.toObject() : resort;
      if (resortObj.images && Array.isArray(resortObj.images)) {
        const signedUrls = await Promise.all(
          resortObj.images.map((img) => getPresignedViewUrl(img))
        );
        resortObj.images = signedUrls.filter(url => url !== null);
      }
      return resortObj;
    })
  );
};



export const createResort = async (req, res) => {
  try {
    const {
      title,
      description,
      price_per_night,
      is_active,
      address,
      city,
      state,
      country,
      average_rating,
      review_count,
      number_of_ratings,
      amenities,
      tags,
      visibility,
      discount,
      check_in_time,
      check_out_time,
      availability_status,
      activities,
      policies,
      contact_email,
      contact_phone,
      is_featured,
    } = req.body;

    // Handle image upload - Now receiving S3 keys from frontend JSON payload
    const images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? [req.body.images] : []);

    const resortObj = new Resort({
      title,
      description,
      images: images, // <- Now an array of S3 Keys
      price_per_night,
      is_active,
      address,
      city,
      state,
      country,
      average_rating,
      review_count,
      number_of_ratings,
      amenities,
      tags,
      visibility,
      discount,
      check_in_time,
      check_out_time,
      availability_status,
      activities,
      policies,
      contact_email,
      contact_phone,
      is_featured,
    });

    await resortObj.save();

    return res.status(201).json({ message: "Resort created", resortObj });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getResortById = async (req, res) => {
  try {
    const { id } = req.params;
    const itinerary = await Resort.findById({_id:id})

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary not found.',
      });
    }

    const [processedResort] = await processResortImages([itinerary]);

    return res.status(200).json({
      success: true,
      data: processedResort,
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






export const getAll = async(req , res)=>{
    try {
        const data = await Resort.find().sort({ createdAt: -1 });
        const processedData = await processResortImages(data);
        return res.status(200).json({
            success: true,
            data: processedData || [],
            message: data?.length ? "Resorts fetched successfully" : "No resorts found"
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message:"Server error"
        })
    }
}


export const updateResort = async (req, res) => {
  try {
    const { id } = req.params; // get id from URL param

    const {
      title,
      description,
      price_per_night,
      is_active,
      address,
      city,
      state,
      country,
      average_rating,
      review_count,
      number_of_ratings,
      amenities,
      tags,
      visibility,
      discount,
      check_in_time,
      check_out_time,
      availability_status,
      activities,
      policies,
      contact_email,
      contact_phone,
      is_featured,
    } = req.body;
    const removedImageIndexesStr = req.body.removedImageIndexes;

    // Find the resort by id
    const resort = await Resort.findOne({ _id: id });
    if (!resort) {
      return res.status(404).json({ message: "Resort not found" });
    }

    // Check if title already exists on a DIFFERENT resort (exclude current resort)
    if (title !== resort.title) {
      const duplicate = await Resort.findOne({ title, _id: { $ne: new mongoose.Types.ObjectId(id) } });
      if (duplicate) {
        return res.status(400).json({ message: "Title already exists" });
      }
    }

    // Handle image removal: remove images by index if specified
    if (removedImageIndexesStr) {
      try {
        const removedIndexes = JSON.parse(removedImageIndexesStr);
        if (Array.isArray(removedIndexes) && removedIndexes.length > 0) {
          // Filter out removed images (keep images at indices not in removedIndexes)
          resort.images = resort.images.filter((_, idx) => !removedIndexes.includes(idx));
        }
      } catch (err) {
        console.warn("Failed to parse removedImageIndexes:", err);
      }
    }

    // Update images if new S3 keys sent from frontend
    if (req.body.images) {
      const incomingImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      // Strip presigned tokens if present
      const cleanedImages = incomingImages.map(url => extractS3Key(url));
      resort.images = Array.from(new Set([...resort.images, ...cleanedImages]));
    }

    // (Legacy multer uploaded files logic removed)

    // Update other fields
    resort.title = title;
    resort.description = description;
    resort.price_per_night = price_per_night;
    resort.is_active = is_active;
    resort.address = address;
    resort.city = city;
    resort.state = state;
    resort.country = country;
    resort.average_rating = average_rating;
    resort.review_count = review_count;
    resort.number_of_ratings = number_of_ratings;
    resort.amenities = amenities;
    resort.tags = tags;
    resort.visibility = visibility;
    resort.discount = discount;
    resort.check_in_time = check_in_time;
    resort.check_out_time = check_out_time;
    resort.availability_status = availability_status;
    resort.activities = activities;
    resort.policies = policies;
    resort.contact_email = contact_email;
    resort.contact_phone = contact_phone;
    resort.is_featured = is_featured;

    await resort.save();

    return res.status(200).json({ message: "Resort updated successfully" });
  } catch (error) {
    console.error("Error updating resort:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




export const deleteResort = async(req,res)=>{
  try {
    const {id} = req.params;
    const del = await Resort.findByIdAndDelete(id);
    if (!del) {
      return res.status(404).json({ message: "Resort not found" });
    }
    return res.status(200).json({ message: "Deleted Successfully" });
  } catch (error) {
    console.log(error)
    return res.status(500).json({message:"Server Error"})
  }
}