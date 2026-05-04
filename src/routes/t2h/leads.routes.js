import express from 'express';

import {
  planYourJourney,
  contact,
  subscribe,
  suggestionComplain,
  planYourTripController
} from '../../controller/leads.controller.js';

const leadsRoute = express.Router();

// Test route
leadsRoute.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working fine 🎉'
  });
});

// Routes without validation for now (can add validation middleware later)
leadsRoute.post('/planYourJourney', planYourJourney);
leadsRoute.post('/contact', contact);
leadsRoute.post('/subscribe', subscribe);
leadsRoute.post('/suggestionComplain', suggestionComplain);
leadsRoute.post('/planYourTrip', planYourTripController);

console.log("✅ leads.route.js loaded");

export default leadsRoute;

