import itineraryModel from '../models/itinerary.model.js';
import imageGalleryModel from '../models/imageGallery.model.js';
import { formatCountryName } from '../utils.js';
import DestinationInternationAndDomesticModel from '../models/destinationInternationAndDomestic.model.js';
import mongoose from 'mongoose';

import { getPresignedViewUrl } from './admin/s3.controller.js';
import { processItineraryImages } from './admin/itinaray.admin.controller.js';

// Helper: Convert stored S3 keys to 5-hour Presigned GET URLs
export const processDestinationImages = async (destinations) => {
  return await Promise.all(
    destinations.map(async (dest) => {
      const destObj = dest.toObject ? dest.toObject() : dest;
      if (destObj.title_image && Array.isArray(destObj.title_image)) {
        const signedUrls = await Promise.all(
          destObj.title_image.map((img) => getPresignedViewUrl(img))
        );
        destObj.title_image = signedUrls.filter(url => url !== null);
      }
      if (destObj.show_image && Array.isArray(destObj.show_image)) {
        const signedUrls = await Promise.all(
          destObj.show_image.map((img) => getPresignedViewUrl(img))
        );
        destObj.show_image = signedUrls.filter(url => url !== null);
      }
      return destObj;
    })
  );
};

export const getImageGalleryByType = async (req, res) => {
  const { type } = req.params;

  try {
    const normalizedType = formatCountryName(type); // e.g., 'Domestic' or 'International'

    const result = await imageGalleryModel.aggregate([
      {
        $lookup: {
          from: 'destinationinternationanddomestics', // collection name (in lowercase and plural)
          localField: 'destination_id',
          foreignField: '_id',
          as: 'destinationData',
        },
      },
      {
        $unwind: {
          path: '$destinationData',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          'destinationData.domestic_or_international': {
            $regex: `^${normalizedType}$`,
            $options: 'i',
          }, // Match the type
        },
      },
      {
        $project: {
          _id: 1,
          destination_id: 1,
          image: 1,
          destination_name: '$destinationData.destination_name',
          destination_tye: '$destinationData.domestic_or_international',
        },
      },
    ]);

    if (!result || result.length === 0) {
      return res.status(401).json({ success: false, message: 'No data available' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error in getImageGalleryByType:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getSingleItineraryById = async (req, res) => {
  try {
    const { id } = req.params;
    const itinerary = await itineraryModel.findById(id).populate('selected_destination');
    if (!itinerary) {
      return res.status(404).json({ success: false, message: 'Itinerary not found' });
    }
    
    const processed = await processItineraryImages(itinerary);
    const itineraryData = processed[0];
    if (itineraryData && itineraryData.reviews) {
      itineraryData.reviews = itineraryData.reviews.filter(rev => rev.isApproved !== false);
    }
    return res.status(200).json({ success: true, data: itineraryData });
  } catch (error) {
    console.error('Error in getSingleItineraryById:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get Exclusive Itinerary
export const getExclusiveAndWeekendItinerary = async (req, res) => {
  try {
    const [exclusiveItineraryData, weekendItineraryDetails] = await Promise.all([
      itineraryModel
        .find({ classification: { $regex: /^exclusive$/i } })
        .populate('selected_destination'),
      itineraryModel
        .find({ classification: { $regex: /^weekend$/i } })
        .populate('selected_destination'),
    ]);

    const [exclusive, weekend] = await Promise.all([
      processItineraryImages(exclusiveItineraryData),
      processItineraryImages(weekendItineraryDetails)
    ]);

    return res
      .status(200)
      .json({ success: true, data: { exclusiveItineraryData: exclusive, weekendItineraryDetails: weekend } });
  } catch (error) {
    console.log('Error in getExclusiveItinerary:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get Top Selling Itineraries
export const getTopSellingItinerary = async (req, res) => {
  try {
    const topSellingItineraries = await itineraryModel
      .find({ classification: { $in: [/top\s*selling/i] } })
      .populate('selected_destination')
      .sort({ createdAt: -1 })
      .limit(20);

    if (!topSellingItineraries || topSellingItineraries.length === 0) {
      return res.status(200).json({ success: true, data: [], message: 'No top selling itineraries found' });
    }

    const processed = await processItineraryImages(topSellingItineraries);
    console.log('Top Selling Itineraries fetched:', processed.length);
    return res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error('Error in getTopSellingItinerary:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Trending Detsination
export const getTrendingDestination = async (req, res) => {
  try {
    const trendingDestination = await DestinationInternationAndDomesticModel.find({
      destination_type: { $all: [/^trending$/i, /^home$/i] },
    })
      .sort({ createdAt: -1 })
      .limit(20);
    if (!trendingDestination) {
      return res.status(404).json({ success: false, message: 'No trending destination found' });
    }
    const processedData = await processDestinationImages(trendingDestination);
    return res.status(200).json({ success: true, data: processedData });
  } catch (error) {
    console.error('Error in getTrendingDestination:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
export const getAllTrendingDestination = async (req, res) => {
  // console.log('run1');
  try {
    // console.log('run2');
    const data = await DestinationInternationAndDomesticModel.find({});
    if (!data) {
      return res.status(404).json({ message: 'No data found' });
    }
    const processedData = await processDestinationImages(data);
    return res.status(200).json({ success: true, data: processedData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'server error' });
  }
};

// getting International Holidays packages
export const getInternationalHolidaysPackages = async (req, res) => {
  try {
    const internationalHolidaysPackage = await itineraryModel.find().populate({
      path: 'selected_destination',
      match: { domestic_or_international: { $regex: /^international$/i } },
    });
    if (!internationalHolidaysPackage || internationalHolidaysPackage.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No International Holidays packages found' });
    }
    const filteredItineraries = internationalHolidaysPackage.filter(
      (itinerary) => itinerary.selected_destination !== null
    );
    
    const processed = await processItineraryImages(filteredItineraries);
    return res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error('Error in getInternationalHolidaysPackages:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// International and Domestic Destination for Home page
export const domesticAndInternationForHome = async (req, res) => {
  try {
    const [Domestic, International] = await Promise.all([
      DestinationInternationAndDomesticModel.find({
        domestic_or_international: { $regex: /^domestic$/i },
      })
        .sort({ createdAt: -1 })
        .limit(10),
      DestinationInternationAndDomesticModel.find({
        domestic_or_international: { $regex: /^international$/i },
      })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    if (!Domestic || Domestic.length == 0) {
      return res.status(404).json({ message: 'The Domestic data are not present', success: false });
    }
    if (!International || International.length == 0) {
      return res
        .status(404)
        .json({ message: 'The International data are not present', success: false });
    }

    const processedDomestic = await processDestinationImages(Domestic);
    const processedInternational = await processDestinationImages(International);

    return res
      .status(200)
      .json({ message: 'Successfully fetched', success: true, data: { Domestic: processedDomestic, International: processedInternational } });
  } catch (error) {
    console.error(`Error in geting Domestic and International:, ${error}`);
    return res.status(500).json({ message: 'Server Error', success: false });
  }
};

// Get only Domestic Destination
export const getOnlyDomesticDestinationOrInternational = async (req, res) => {
  console.log("inside the domestic controller mohit")
  const { type } = req.params;
  try {
    const destinations = await DestinationInternationAndDomesticModel.find({
      domestic_or_international: { $regex: new RegExp(`^${type}$`, 'i') },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    if (!destinations || destinations.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: `No ${type} destinations found`,
      });
    }

    const normalizedDestinations = await processDestinationImages(destinations);

    return res.status(200).json({ success: true, data: normalizedDestinations });
  } catch (error) {
    console.error('Error in getOnlyDomesticDestinationOrInternational:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get Single Destination by ID (Now also accepts Slug)
export const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First try finding by slug
    let destination = await DestinationInternationAndDomesticModel.findOne({ slug: id });
    
    // Fallback for old MongoDB IDs if slug wasn't found
    if (!destination && id.match(/^[0-9a-fA-F]{24}$/)) {
      destination = await DestinationInternationAndDomesticModel.findById(id);
    }
    
    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }
    const [processed] = await processDestinationImages([destination]);
    return res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error('Error in getDestinationById:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get Itinerary by Destination ID (or Slug)
export const getItineraryByDestinationId = async (req, res) => {
  try {
    const { id } = req.params;
    
    let destId = id;
    
    // If id is not a valid ObjectId, assume it's a slug and resolve it to an _id
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const destination = await DestinationInternationAndDomesticModel.findOne({ slug: id });
      if (!destination) {
        return res.status(200).json({ success: true, data: [], message: 'Destination not found' });
      }
      destId = destination._id;
    }

    const itineraries = await itineraryModel.find({
      selected_destination: new mongoose.Types.ObjectId(destId),
    });
    if (!itineraries || itineraries.length === 0) {
      return res
        .status(200)
        .json({ success: true, data: [], message: 'No itineraries found for this destination' });
    }
    
    const processed = await processItineraryImages(itineraries);
    return res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error('Error in getItineraryByDestinationId:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


export const testing = async (req, res) => {
  try {
    console.log("Running /testing");

    // ✅ Log all data for debugging
    const allDocs = await itineraryModel.find({});
    console.log("ALL DOCUMENTS:", allDocs);

    // ✅ Exact query (case-sensitive)
    const result = await itineraryModel.find({
      domestic_or_international: "international", // ← matches your data exactly
    });

    console.log("Query Result:", result);

    if (result.length === 0) {
      console.log("No international itineraries found");
      return res.status(404).json({
        success: false,
        message: "No International Holidays packages found",
      });
    }

    // ✅ Success
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in /testing:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Honeymoon Destinations
export const getHoneymoonDestinations = async (req, res) => {
  try {
    const honeymoonDestinations = await DestinationInternationAndDomesticModel.find({
      destination_type: { $in: [/^honeymoon$/i] },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    if (!honeymoonDestinations || honeymoonDestinations.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No honeymoon destinations found'
      });
    }

    const normalizedDestinations = await processDestinationImages(honeymoonDestinations);

    return res.status(200).json({
      success: true,
      data: normalizedDestinations
    });
  } catch (error) {
    console.error('Error in getHoneymoonDestinations:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * Public Gallery Fetcher
 * Fetches processed images (presigned URLs) for any destination ID
 */
export const getPublicGallery = async (req, res) => {
  const { destination_id } = req.params;
  try {
    if (!destination_id) {
      return res.status(400).json({ msg: 'destination_id is required', success: false });
    }
    
    const imageGalleryData = await imageGalleryModel.findOne({ destination_id });
    
    if (!imageGalleryData) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No images found'
      });
    }

    // Process keys to Presigned URLs
    let images = [];
    if (imageGalleryData.image && Array.isArray(imageGalleryData.image)) {
      const signedUrls = await Promise.all(
        imageGalleryData.image.map((img) => getPresignedViewUrl(img))
      );
      images = signedUrls.filter(url => url !== null);
    }
    
    return res.status(200).json({
      success: true,
      data: images,
      destination_id
    });
  } catch (error) {
    console.error(`Public Gallery Error -> ${error}`);
    return res.status(500).json({ msg: 'Server Error', success: false });
  }
};

