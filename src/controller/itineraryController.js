import itinerary from '../models/itinerary.model.js';
import { processItineraryImages } from './admin/itinaray.admin.controller.js';

export const getAllItinerary = async (req, res) => {
  try {
    const rawData = await itinerary.find({}).sort({ createdAt: -1 });
    if (!rawData || rawData.length === 0) {
      return res.status(404).json({ message: 'No Itinerary Found' });
    }
    
    const data = await processItineraryImages(rawData);
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get Trending Destinations (for homepage)
export const getTrendingDestinations = async (req, res) => {
  try {
    const destinations = await Destination.find({
      destination_type: { $in: ["trending"] },
    })
      .select(
        "destination_name title_image show_image days nights subtitle"
      )
      .limit(5)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: destinations,
    });
  } catch (error) {
    console.error("Trending fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending destinations",
    });
  }
};

// Get itineraries by destination ID
export const getItinerariesByDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const rawData = await itinerary.find({ selected_destination: destinationId }).sort({ createdAt: -1 });
    
    if (!rawData || rawData.length === 0) {
      return res.status(200).json([]); // Return empty array if no itineraries
    }
    
    const data = await processItineraryImages(rawData);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch itineraries by destination error:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getExclusivePackages = async (req, res) => {
  try {
    const rawData = await itinerary.find({ classification: { $regex: /^exclusive$/i } }).populate('selected_destination').sort({ createdAt: -1 });
    if (!rawData || rawData.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const data = await processItineraryImages(rawData);
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    console.error("Fetch exclusive itineraries error:", error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
