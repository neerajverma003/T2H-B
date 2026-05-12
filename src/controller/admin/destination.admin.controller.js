import mongoose from 'mongoose';
import destinatinInternationAndDomestic from '../../models/destinationInternationAndDomestic.model.js';
import imageGalleryModel from '../../models/imageGallery.model.js';
import { formatCountryName } from '../../utils.js';
import { getPresignedViewUrl, extractS3Key } from './s3.controller.js';
import { processDestinationImages } from '../destination.controller.js';
import { logActivity } from '../../utils/auditLogger.js';

// For sending name of place according to their type "Domestic/International"
export const destination_Internation_Or_Domestic = async (req, res) => {
  const { type } = req.params;
  try {
    if (!type) {
      return res.status(400).json({ msg: 'type is required', success: false });
    }

    const destinationType = await destinatinInternationAndDomestic
      .find({
        domestic_or_international: { $regex: `^${type}$`, $options: 'i' }, // Case-insensitive match
      })
      .sort({ destination_name: 1 });

    // If no destinations are found for this type, return an empty list (frontend expects an array)
    if (!destinationType || destinationType.length === 0) {
      return res.status(200).json({ msg: 'No destinations found for this type', success: true, places: [] });
    }

    const processedPlaces = await processDestinationImages(destinationType);

    return res
      .status(200)
      .json({ msg: 'Successfully fetched', success: true, places: processedPlaces });
  } catch (error) {
    console.log(`Get Destination by type Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

// Adding new destination
export const addDestination_Domestic_Internationl = async (req, res) => {
  try {
    const { destination_name, type, destination_type, title_image, best_time, ideal_duration, short_description } = req.body;
    // title_image should now be an array of S3 public URLs sent from frontend
    const titleImages = Array.isArray(title_image) ? title_image : (title_image ? [title_image] : []);

    if (!destination_name || !type) {
      return res.status(400).json({ msg: 'All the fields are required', success: false });
    }

    const alreadyExists = await destinatinInternationAndDomestic.find({
      destination_name: formatCountryName(destination_name),
    });

    if (alreadyExists.length > 0) {
      return res.status(409).json({ msg: 'The given destination already exists', success: false });
    }

    const newDestination = new destinatinInternationAndDomestic({
      domestic_or_international: formatCountryName(type),
      destination_name: formatCountryName(destination_name),
      title_image: titleImages,
      show_image: titleImages,
      destination_type: Array.isArray(destination_type) ? destination_type : [destination_type],
      best_time: best_time || "",
      ideal_duration: ideal_duration || "",
      short_description: short_description || "",
    });

    await newDestination.save();

    // Log the activity
    await logActivity({
      adminId: req.userId,
      action: 'CREATE',
      module: 'DESTINATION',
      details: `Added new destination: ${destination_name}`,
      targetId: newDestination._id,
      ipAddress: req.ip
    });

    // ✅ SYNC to imageGalleryModel so View Image Gallery can see the images
    console.log("Syncing new destination images to imageGalleryModel...");
    try {
      if (titleImages.length > 0) {
        const newImageGallery = new imageGalleryModel({
          destination_id: newDestination._id,
          image: titleImages,
        });
        await newImageGallery.save();
        console.log("Created image gallery for new destination with", titleImages.length, "images");
      }
    } catch (syncError) {
      console.error("Error syncing to imageGalleryModel:", syncError);
      // Don't fail the request, just log the sync error
    }

    return res.status(201).json({ msg: 'Destination created successfully', success: true, destination: newDestination });
  } catch (error) {
    console.log(`Add Destination Error: ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

// Delete destination
export const deleteDestination_Domestic_Internationl = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ msg: 'ID is required', success: false });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ msg: 'Invalid ID', success: false });
    }
    const destination = await destinatinInternationAndDomestic.findById(id);
    if (!destination) {
      return res.status(404).json({ msg: 'Destination not found', success: false });
    }
    await destinatinInternationAndDomestic.findByIdAndDelete(id);
    return res.status(200).json({ msg: 'Destination deleted successfully', success: true });
  } catch (error) {
    console.log(`Delete Destination Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

// Get single destination by ID
export const getSingleDestinationBYId = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ msg: 'ID is required', success: false });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ msg: 'Invalid ID', success: false });
    }
    const destination = await destinatinInternationAndDomestic.findById(id);
    if (!destination) {
      return res.status(404).json({ msg: 'Destination not found', success: false });
    }
    const processedDestination = await processDestinationImages([destination]);

    return res
      .status(200)
      .json({ msg: 'Destination fetched successfully', success: true, destination: processedDestination[0] });
  } catch (error) {
    console.log(`Get Single Destination Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

// Update destination
export const updateDestination_Domestic_Internationl = async (req, res) => {
  const { id } = req.params;
  const { destination_name, type, destination_type, show_image, best_time, ideal_duration, short_description } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ msg: 'ID is required', success: false });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ msg: 'Invalid ID', success: false });
    }

    const destination = await destinatinInternationAndDomestic.findById(id);
    if (!destination) {
      return res.status(404).json({ msg: 'Destination not found', success: false });
    }

    // (Legacy multer image upload logic removed)

    // ✅ Merge new S3 keys from direct upload (new flow - EditPage.jsx sends these)
    if (req.body.new_image_keys) {
      const newKeys = Array.isArray(req.body.new_image_keys)
        ? req.body.new_image_keys
        : [req.body.new_image_keys];
      if (newKeys.length > 0) {
        destination.title_image = Array.from(
          new Set([...(destination.title_image || []), ...newKeys])
        );
      }
    }

    // ✅ Handle show_image (tick/untick)
    if (show_image) {
      const selected = Array.isArray(show_image) ? show_image : [show_image];
      // Convert presigned URLs back to raw S3 keys for comparison
      const selectedKeys = selected.map(url => extractS3Key(url));
      
      destination.show_image = destination.title_image.filter((img) =>
        selectedKeys.includes(img)
      );
    }

    // Update basic fields
    if (destination_name) {
      destination.destination_name = formatCountryName(destination_name);
    }
    if (type) {
      destination.domestic_or_international = formatCountryName(type);
    }

    // Merge destination_type values
    if (destination_type) {
      destination.destination_type = Array.isArray(destination_type)
        ? destination_type
        : [destination_type];
    }
    
    // Update new quick facts
    if (best_time !== undefined) {
      destination.best_time = best_time;
    }
    if (ideal_duration !== undefined) {
      destination.ideal_duration = ideal_duration;
    }
    if (short_description !== undefined) {
      destination.short_description = short_description;
    }

    await destination.save();

    // Log the activity
    await logActivity({
      adminId: req.userId,
      action: 'UPDATE',
      module: 'DESTINATION',
      details: `Updated destination: ${destination_name || destination.destination_name}`,
      targetId: destination._id,
      ipAddress: req.ip
    });

    // ✅ SYNC to imageGalleryModel so View Image Gallery can see the images
    console.log("Syncing destination images to imageGalleryModel...");
    try {
      let imageGallery = await imageGalleryModel.findOne({ destination_id: id });

      if (imageGallery) {
        // Update existing gallery - merge new images with existing ones
        imageGallery.image = Array.from(
          new Set([...(imageGallery.image || []), ...(destination.title_image || [])])
        );
        await imageGallery.save();
        console.log("Updated existing image gallery with", imageGallery.image.length, "total images");
      } else {
        // Create new gallery record with all title_image images
        if (destination.title_image && destination.title_image.length > 0) {
          imageGallery = new imageGalleryModel({
            destination_id: id,
            image: destination.title_image,
          });
          await imageGallery.save();
          console.log("Created new image gallery with", imageGallery.image.length, "images");
        }
      }
    } catch (syncError) {
      console.error("Error syncing to imageGalleryModel:", syncError);
      // Don't fail the request, just log the sync error
    }

    return res.status(200).json({ msg: 'Destination updated successfully', success: true });
  } catch (error) {
    console.log(`Update Destination Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};



export const deleteDestinationImage = async (req, res) => {
  const { id } = req.params;
  const { imagePath } = req.body; // frontend sends the image path to delete

  try {
    if (!id) {
      return res.status(400).json({ msg: 'ID is required', success: false });
    }
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ msg: 'Invalid ID', success: false });
    }
    const destination = await destinatinInternationAndDomestic.findById(id);
    if (!destination) {
      return res.status(404).json({ msg: 'Destination not found', success: false });
    }

    // Remove the image (frontend might send presigned URL or raw key)
    const keyToDelete = extractS3Key(imagePath);

    destination.title_image = destination.title_image.filter((img) => img !== keyToDelete);
    destination.show_image = destination.show_image.filter((img) => img !== keyToDelete);

    await destination.save();


    return res
      .status(200)
      .json({ msg: 'Image deleted successfully', success: true, data: destination });
  } catch (error) {
    console.log(`Delete Destination Image Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};
