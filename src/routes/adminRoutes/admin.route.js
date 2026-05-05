import express from 'express'
import { AdminUserVerify,
  AdminUserCreate,
  changePassword,
  userExistedInAdmin,
  getMe,
  logout,
  deleteUser,} from "../../controller/admin/admin.controller.js";
import {authorizeAdmin} from "../../middleware/auth.js"
import { auth } from '../../middleware/auth.js';

import {
  heroSection,
  getAllHeroVideo,
  updateHeroVideo,
  deleteHeroVideo,
} from '../../controller/admin/heroSection.admin.controller.js';
import {
  postImageGallery,
  getImageForPlace,
  deleteImageFromGallery,
} from "../../controller/admin/imageGallery.controller.js";

import {
  destination_Internation_Or_Domestic,
  deleteDestination_Domestic_Internationl,
  updateDestination_Domestic_Internationl,
  addDestination_Domestic_Internationl,
  getSingleDestinationBYId,
  deleteDestinationImage
} from '../../controller/admin/destination.admin.controller.js';
import {
  createCity,
  getStateCity,
  getCity,
  UpdateCity,
  DeleteCity,
} from '../../controller/admin/city.admin.controller.js';
import {
  postBlog,
  getBlog,
  updateBlog,
  deleteBlog,
  getSingleBlog,
} from '../../controller/admin/Blog.admin.controller.js';

import { testimonialVideo, getAllTestimonialVideos, deleteTestimonialVideo }
 from '../../controller/admin/testimonialVideo.admin.controller.js';

 import {
  createItinerary,
  getAllItinerary,
  getItineraryById,
  deleteItinerary,
  updateItinerary,
} from '../../controller/admin/itinaray.admin.controller.js';

import { createResort, deleteResort, getAll, getResortById, updateResort } from '../../controller/admin/resortController.js';


import {
  getPaymentMode,
  getHoneymoonPaymentMode,
  postHoneymoonPaymentMode,
  getTncByDestination,
  patchTnc,
  getHoneymoonCancellationPolicy,
  putHoneymoonCancellationPolicy,
  getGlobalTnc,
  updateGlobalTnc,
} from '../../controller/admin/settings.admin.controller.js';
import {
  getPlanYourJourneyList,
  deletePlanYourJourney,
} from '../../controller/admin/planYourJourney.admin.controller.js';
import {
  getPlanYourTripList,
  deletePlanYourTrip,
} from '../../controller/admin/planYourTrip.admin.controller.js';
import {
  getContacts,
  deleteContact,
  getSuggestions,
  deleteSuggestion,
  getConsultationLeads,
  getSubscribes,
  deleteSubscribe
} from '../../controller/admin/leads.admin.controller.js';
import { getGlobalSettings, updateGlobalSettings } from '../../controller/admin/globalSettings.admin.controller.js';
import { getDashboardStats } from '../../controller/admin/reports.admin.controller.js';
const adminRoute = express.Router();



adminRoute.post('/admin-login', AdminUserVerify);
adminRoute.post('/adminRegister',AdminUserCreate)
adminRoute.get('/me', auth, authorizeAdmin, getMe);
adminRoute.patch('/change-password', auth, authorizeAdmin, changePassword);

adminRoute.post('/add-user', auth, authorizeAdmin, AdminUserCreate);
adminRoute.get('/get-admin-user', auth, authorizeAdmin, userExistedInAdmin);
adminRoute.delete('/delete-user/:userId', auth, authorizeAdmin, deleteUser);

// Image Gallery Admin Routes (S3 keys sent as JSON — no multer needed)
adminRoute.post("/image-Gallery", auth, postImageGallery);
adminRoute.get(
  "/image-Gallery/:destination_id",
  auth,
  getImageForPlace
);

adminRoute.post(
  "/image-Gallery/delete",
  auth,
  authorizeAdmin,
  deleteImageFromGallery
);

import { generatePresignedUrl } from '../../controller/admin/s3.controller.js';

// AWS S3 Presigned URL Route
adminRoute.post('/generate-presigned-url', auth, generatePresignedUrl);

// Destination Admin Routes
adminRoute.get('/destination/:type', auth, destination_Internation_Or_Domestic);
adminRoute.post(
  '/new-destination',
  auth,
  addDestination_Domestic_Internationl
);
adminRoute.delete(
  '/destination/delete/:id',
  auth,
  authorizeAdmin,
  deleteDestination_Domestic_Internationl
);
adminRoute.get('/destination/edit/:id', auth, getSingleDestinationBYId);
adminRoute.patch('/destination/:id', auth, updateDestination_Domestic_Internationl);
adminRoute.patch('/destination/:id/delete-image', deleteDestinationImage);


adminRoute.post('/itinerary', auth, createItinerary);
adminRoute.patch('/itinerary/:id', auth, updateItinerary);
adminRoute.delete('/itinerary/:id', auth, authorizeAdmin, deleteItinerary);
adminRoute.get('/itinerary', auth, getAllItinerary);
adminRoute.get('/itinerary/:id', auth, getItineraryById);
// Payment Mode & TNC & Cancellation policy endpoints (admin + public)
adminRoute.get('/payment-mode/:type', getPaymentMode);
adminRoute.get('/honeymoon/payment-mode/:type', getHoneymoonPaymentMode);
adminRoute.post('/honeymoon/payment-mode', auth, postHoneymoonPaymentMode);

adminRoute.get('/tnc/:destinationId', getTncByDestination);
adminRoute.patch('/tnc', auth, patchTnc);

adminRoute.get('/global-tnc', getGlobalTnc);
adminRoute.put('/global-tnc', auth, updateGlobalTnc);

adminRoute.get('/cancellation-policy', getHoneymoonCancellationPolicy);
adminRoute.get('/honeymoon-cancellation-policy', getHoneymoonCancellationPolicy);
adminRoute.put('/honeymoon-cancellation-policy', auth, putHoneymoonCancellationPolicy);
// Hero Section Admin Routes

adminRoute.post( "/hero-section", auth, heroSection);
adminRoute.get( "/hero-section/:page", auth, getAllHeroVideo );
adminRoute.patch("/hero-section/:videoId",auth, updateHeroVideo );
adminRoute.delete( "/hero-section/:videoId", auth, authorizeAdmin, deleteHeroVideo);

// Plan Your Journey admin endpoints (list + delete)
adminRoute.get('/plan-your-journey', auth, authorizeAdmin, getPlanYourJourneyList);
adminRoute.delete('/plan-your-journey/:id', auth, authorizeAdmin, deletePlanYourJourney);

// Plan Your Trip admin endpoints (detailed honeymoon requests)
adminRoute.get('/plan-your-trip', auth, authorizeAdmin, getPlanYourTripList);
adminRoute.delete('/plan-your-trip/:id', auth, authorizeAdmin, deletePlanYourTrip);

// General Leads admin endpoints
adminRoute.get('/get-contact', auth, authorizeAdmin, getContacts);
adminRoute.delete('/get-contact/:id', auth, authorizeAdmin, deleteContact);

adminRoute.get('/get-suggestions', auth, authorizeAdmin, getSuggestions);
adminRoute.delete('/get-suggestions/:id', auth, authorizeAdmin, deleteSuggestion);

adminRoute.get('/consultation-leads', auth, authorizeAdmin, getConsultationLeads);
adminRoute.delete('/consultation-leads/:id', auth, authorizeAdmin, deletePlanYourTrip); 

adminRoute.get('/get-subscribe', auth, authorizeAdmin, getSubscribes);
adminRoute.delete('/get-subscribe/:id', auth, authorizeAdmin, deleteSubscribe);

// City Admin Routes
adminRoute.post('/city', auth, createCity);
adminRoute.get('/state/:destinationId', auth, getStateCity);
adminRoute.get('/city/:cityId', auth, getCity);
adminRoute.patch('/city/:cityId', auth, UpdateCity);
adminRoute.delete('/city/:cityId', auth, authorizeAdmin, DeleteCity);


//Blog Section
adminRoute.post('/blog', auth, postBlog);
adminRoute.get('/blog', auth, getBlog);
adminRoute.get('/blog/:blogId', auth, getSingleBlog);
adminRoute.patch('/blog/:blogId', auth, updateBlog);
adminRoute.delete('/blog/:blogId', auth, authorizeAdmin, deleteBlog);

// Testimonial Video Routes
adminRoute.post('/testimonial-video', auth, testimonialVideo);
adminRoute.get('/testimonial-video', auth, getAllTestimonialVideos);
adminRoute.delete('/testimonial-video/:id', auth, deleteTestimonialVideo);

// Resort Routes
adminRoute.post('/resort', auth, createResort);
adminRoute.get('/resort/all', auth, getAll);
adminRoute.get('/resort/get/:id', auth, getResortById);
adminRoute.patch('/resort/update/:id', auth, updateResort);
adminRoute.delete('/resort/delete/:id', auth, authorizeAdmin, deleteResort);
// Settings & Reports
adminRoute.get('/global-settings', getGlobalSettings); // Publicly accessible for frontend footer
adminRoute.put('/global-settings', auth, authorizeAdmin, updateGlobalSettings);
import { getAuditLogs } from '../../controller/admin/auditLog.admin.controller.js';
adminRoute.get('/audit-logs', auth, authorizeAdmin, getAuditLogs);
adminRoute.get('/reports/stats', auth, authorizeAdmin, getDashboardStats);

export default adminRoute;

