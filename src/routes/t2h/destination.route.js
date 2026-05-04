import express from 'express';
import {
  getImageGalleryByType,
  //
  getSingleItineraryById,
  getExclusiveAndWeekendItinerary,
  getTopSellingItinerary,
  getTrendingDestination,
  domesticAndInternationForHome,
  getOnlyDomesticDestinationOrInternational,
  getInternationalHolidaysPackages,
  getItineraryByDestinationId,
  getAllTrendingDestination,
  getDestinationById,
  testing,
  getHoneymoonDestinations,
  getPublicGallery
} from '../../controller/destination.controller.js';

const destinationRoute = express.Router();
destinationRoute.get('/home/get', getAllTrendingDestination);
destinationRoute.get('/test', testing);
destinationRoute.get('/image-gallery/:type', getImageGalleryByType); // Fetch image gallery by type
destinationRoute.get('/gallery/:destination_id', getPublicGallery); // Public direct gallery fetch
destinationRoute.get('/itinerary/:id', getSingleItineraryById); // Fetch single itinerary by ID
destinationRoute.get('/classified-itinerary', getExclusiveAndWeekendItinerary); // Fetch exclusive and weekend itineraries for home page
destinationRoute.get('/top-selling-itinerary', getTopSellingItinerary); // Fetch top selling itineraries
destinationRoute.get('/home/trending-destination', getTrendingDestination); // Fetch trending destinations
destinationRoute.get('/home/honeymoon-destination', getHoneymoonDestinations); // Fetch honeymoon destinations
destinationRoute.get('/home/international-packages', getInternationalHolidaysPackages); // Fetch international holiday packages
destinationRoute.get('/home/DomesticAndInternational', domesticAndInternationForHome); // Fetch domestic and international destinations for home page
destinationRoute.get(
  '/only-domestic-or-international/:type',
  getOnlyDomesticDestinationOrInternational
); // Fetch only domestic or international destinations
destinationRoute.get('/only-domestic-or-international/id/:id', getDestinationById);
destinationRoute.get('/itineraries/:id', getItineraryByDestinationId);
export default destinationRoute;
