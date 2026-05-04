import imageGalleryModel from '../../models/imageGallery.model.js';
import { formatCountryName } from '../../utils.js';
import { getPresignedViewUrl } from './s3.controller.js';

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs for Image Gallery
export const processGalleryImages = async (galleryData) => {
  if (!galleryData) return galleryData;
  const gObj = galleryData.toObject ? galleryData.toObject() : galleryData;
  if (gObj.image && Array.isArray(gObj.image)) {
    const signedUrls = await Promise.all(
      gObj.image.map((img) => getPresignedViewUrl(img))
    );
    gObj.image = signedUrls.filter(url => url !== null);
  }
  return gObj;
};

// posting image on image Gallery
export const postImageGallery = async (req, res) => {
  try {
    const { destination_id } = req.body;
    const images = req.body.images || [];

    if (!destination_id) {
      return res.status(400).json({ msg: 'Destination ID is required', success: false });
    }

    const filePaths = Array.isArray(images) ? images : [images];
    
    if (!filePaths || filePaths.length === 0) {
      return res.status(400).json({ msg: 'No images provided', success: false });
    }

    const existingGallery = await imageGalleryModel.findOne({ destination_id });

    if (existingGallery) {
      existingGallery.image.push(...filePaths);
      await existingGallery.save();
      return res.status(200).json({
        msg: 'Images uploaded successfully and gallery updated',
        success: true,
      });
    }

    const newImageGallery = new imageGalleryModel({
      destination_id,
      image: filePaths,
    });

    await newImageGallery.save();
    return res.status(201).json({
      msg: 'Image gallery created and images uploaded successfully',
      success: true,
    });
  } catch (error) {
    console.error(`Image Gallery Error: ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

// Getting image using name on place
export const getImageForPlace = async (req, res) => {
  const { destination_id } = req.params;
  try {
    if (!destination_id) {
      return res.status(400).json({ msg: 'destination_id is required', success: false });
    }
    
    const imageGalleryData = await imageGalleryModel
      .findOne({
        destination_id,
      })
      .populate('destination_id');
    
    if (!imageGalleryData) {
      return res.status(200).json({
        msg: 'No images found for this destination',
        success: true,
        imageGalleryData: { image: [] },
      });
    }
    
    const processedGallery = await processGalleryImages(imageGalleryData);
    
    return res.status(200).json({
      msg: 'Images for the destination found successfully',
      success: true,
      imageGalleryData: processedGallery,
    });
  } catch (error) {
    console.log(`Get Image For Place Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

// Delete image from gallery
export const deleteImageFromGallery = async (req, res) => {
  try {
    const { destination_id, image_urls } = req.body;

    if (!destination_id || !Array.isArray(image_urls) || image_urls.length === 0) {
      return res.status(400).json({
        msg: "Destination ID and image URLs are required",
        success: false,
      });
    }

    const imageGallery = await imageGalleryModel.findOne({ destination_id });

    if (!imageGallery) {
      return res.status(404).json({
        msg: "Image gallery not found",
        success: false,
      });
    }

    // Remove all matching image URLs (keys) from the array
    imageGallery.image = imageGallery.image.filter(
      (img) => !image_urls.includes(img)
    );

    await imageGallery.save();

    return res.status(200).json({
      msg: "Selected images deleted successfully",
      success: true,
      remainingImages: imageGallery.image,
    });
  } catch (error) {
    console.error("Delete Image Error:", error);
    return res.status(500).json({
      msg: "Server Error",
      success: false,
      error: error.message,
    });
  }
};


// import imageGalleryModel from "../../models/imageGallery.model.js";
// import mongoose from "mongoose";

// // ==============================
// // POST: Upload images
// // ==============================
// export const postImageGallery = async (req, res) => {
//   try {
//         console.log("RAW destination_id:", req.params.destination_id);
//     const { destination_id } = req.body;

//     if (!destination_id || !mongoose.Types.ObjectId.isValid(destination_id)) {
//       return res.status(400).json({
//         success: false,
//         msg: "Valid destination_id is required",
//       });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         msg: "No images uploaded",
//       });
//     }

//     const filePaths = req.files.map((file) => file.path);

//     let gallery = await imageGalleryModel.findOne({ destination_id });

//     if (!gallery) {
//       gallery = new imageGalleryModel({
//         destination_id,
//         image: filePaths,
//       });
//     } else {
//       gallery.image = [...gallery.image, ...filePaths];
//     }

//     await gallery.save();

//     return res.status(200).json({
//       success: true,
//       msg: "Images uploaded successfully",
//     });
//   } catch (error) {
//     console.error("Post Image Gallery Error:", error);
//     return res.status(500).json({
//       success: false,
//       msg: "Server Error",
//     });
//   }
// };

// // ==============================
// // GET: Fetch images
// // ==============================
// export const getImageForPlace = async (req, res) => {
//   try {
//     const { destination_id } = req.params;

//     if (!destination_id || !mongoose.Types.ObjectId.isValid(destination_id)) {
//       return res.status(400).json({
//         success: false,
//         msg: "Valid destination_id is required",
//       });
//     }

//     const gallery = await imageGalleryModel
//       .findOne({ destination_id })
//       .populate("destination_id");

//     if (!gallery) {
//       return res.status(200).json({
//         success: true,
//         imageGalleryData: { image: [] },
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       imageGalleryData: gallery,
//     });
//   } catch (error) {
//     console.error("Get Image For Place Error:", error);
//     return res.status(500).json({
//       success: false,
//       msg: "Server Error",
//     });
//   }
// };

// // ==============================
// // POST: Delete images
// // ==============================
// export const deleteImageFromGallery = async (req, res) => {
//   try {
//     const { destination_id, image_urls } = req.body;

//     if (
//       !destination_id ||
//       !mongoose.Types.ObjectId.isValid(destination_id) ||
//       !Array.isArray(image_urls)
//     ) {
//       return res.status(400).json({
//         success: false,
//         msg: "Invalid input",
//       });
//     }

//     const gallery = await imageGalleryModel.findOne({ destination_id });

//     if (!gallery) {
//       return res.status(200).json({
//         success: true,
//         remainingImages: [],
//       });
//     }

//     gallery.image = gallery.image.filter(
//       (img) => !image_urls.includes(img)
//     );

//     await gallery.save();

//     return res.status(200).json({
//       success: true,
//       msg: "Images deleted successfully",
//       remainingImages: gallery.image,
//     });
//   } catch (error) {
//     console.error("Delete Image Error:", error);
//     return res.status(500).json({
//       success: false,
//       msg: "Server Error",
//     });
//   }
// };
