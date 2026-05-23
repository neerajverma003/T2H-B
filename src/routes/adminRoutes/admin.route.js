import express from 'express'
import { AdminUserVerify,
  AdminUserCreate,
  changePassword,
  userExistedInAdmin,
  getMe,
  logout,
  deleteUser,} from "../../controller/admin/admin.controller.js";
import {authorizeAdmin, authorizeSuperadmin} from "../../middleware/auth.js"
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
  getPendingReviews,
  approveReview,
  rejectReview,
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
import {
  createTextTestimonial,
  getTextTestimonials,
  toggleVerifyTestimonial,
  deleteTextTestimonial,
} from '../../controller/textTestimonials.controller.js';

import {
  verifyGiftCardByAdmin,
  updateGiftCardStatusByAdmin,
  getAllGiftCardsByAdmin
} from '../../controller/admin/giftCard.admin.controller.js';


const adminRoute = express.Router();

import {
  updateAboutStory,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} from "../../controller/admin/about.admin.controller.js";


adminRoute.post('/team/add-member', auth, authorizeAdmin, createTeamMember);
adminRoute.post('/admin-login', AdminUserVerify);
adminRoute.post('/adminRegister',AdminUserCreate)
adminRoute.get('/me', auth, authorizeAdmin, getMe);
adminRoute.patch('/change-password', auth, authorizeAdmin, changePassword);

adminRoute.post('/add-user', auth, authorizeSuperadmin, AdminUserCreate);
adminRoute.get('/get-admin-user', auth, authorizeSuperadmin, userExistedInAdmin);
adminRoute.delete('/delete-user/:userId', auth, authorizeSuperadmin, deleteUser);

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
  authorizeSuperadmin,
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
  authorizeSuperadmin,
  deleteDestination_Domestic_Internationl
);
adminRoute.get('/destination/edit/:id', auth, getSingleDestinationBYId);
adminRoute.patch('/destination/:id', auth, updateDestination_Domestic_Internationl);
adminRoute.patch('/destination/:id/delete-image', deleteDestinationImage);


adminRoute.post('/itinerary', auth, createItinerary);
adminRoute.patch('/itinerary/:id', auth, updateItinerary);
adminRoute.delete('/itinerary/:id', auth, authorizeSuperadmin, deleteItinerary);
adminRoute.get('/itinerary', auth, getAllItinerary);
adminRoute.get('/itinerary/:id', auth, getItineraryById);

// Itinerary Review Approval Routes
adminRoute.get('/itinerary-reviews/pending', auth, authorizeSuperadmin, getPendingReviews);
adminRoute.patch('/itinerary/:itineraryId/review/:reviewId/approve', auth, authorizeSuperadmin, approveReview);
adminRoute.delete('/itinerary/:itineraryId/review/:reviewId', auth, authorizeSuperadmin, rejectReview);
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
adminRoute.delete( "/hero-section/:videoId", auth, authorizeSuperadmin, deleteHeroVideo);

// Plan Your Journey admin endpoints (list + delete)
adminRoute.get('/plan-your-journey', auth, authorizeAdmin, getPlanYourJourneyList);
adminRoute.delete('/plan-your-journey/:id', auth, authorizeSuperadmin, deletePlanYourJourney);

// Plan Your Trip admin endpoints (detailed honeymoon requests)
adminRoute.get('/plan-your-trip', auth, authorizeAdmin, getPlanYourTripList);
adminRoute.delete('/plan-your-trip/:id', auth, authorizeSuperadmin, deletePlanYourTrip);

// General Leads admin endpoints
adminRoute.get('/get-contact', auth, authorizeAdmin, getContacts);
adminRoute.delete('/get-contact/:id', auth, authorizeSuperadmin, deleteContact);

adminRoute.get('/get-suggestions', auth, authorizeAdmin, getSuggestions);
adminRoute.delete('/get-suggestions/:id', auth, authorizeSuperadmin, deleteSuggestion);

adminRoute.get('/consultation-leads', auth, authorizeAdmin, getConsultationLeads);
adminRoute.delete('/consultation-leads/:id', auth, authorizeSuperadmin, deletePlanYourTrip); 

adminRoute.get('/get-subscribe', auth, authorizeAdmin, getSubscribes);
adminRoute.delete('/get-subscribe/:id', auth, authorizeSuperadmin, deleteSubscribe);

// City Admin Routes
adminRoute.post('/city', auth, createCity);
adminRoute.get('/state/:destinationId', auth, getStateCity);
adminRoute.get('/city/:cityId', auth, getCity);
adminRoute.patch('/city/:cityId', auth, UpdateCity);
adminRoute.delete('/city/:cityId', auth, authorizeSuperadmin, DeleteCity);


//Blog Section
adminRoute.post('/blog', auth, postBlog);
adminRoute.get('/blog', auth, getBlog);
adminRoute.get('/blog/:blogId', auth, getSingleBlog);
adminRoute.patch('/blog/:blogId', auth, updateBlog);
adminRoute.delete('/blog/:blogId', auth, authorizeSuperadmin, deleteBlog);

// Testimonial Video Routes
adminRoute.post('/testimonial-video', auth, testimonialVideo);
adminRoute.get('/testimonial-video', auth, getAllTestimonialVideos);
adminRoute.delete('/testimonial-video/:id', auth, authorizeSuperadmin, deleteTestimonialVideo);

// Text Testimonial Admin Routes
adminRoute.post('/text-testimonial', auth, createTextTestimonial);
adminRoute.get('/text-testimonial', auth, getTextTestimonials);
adminRoute.patch('/text-testimonial/toggle-verify/:id', auth, toggleVerifyTestimonial);
adminRoute.delete('/text-testimonial/:id', auth, authorizeSuperadmin, deleteTextTestimonial);

// Resort Routes
adminRoute.post('/resort', auth, createResort);
adminRoute.get('/resort/all', auth, getAll);
adminRoute.get('/resort/get/:id', auth, getResortById);
adminRoute.patch('/resort/update/:id', auth, updateResort);
adminRoute.delete('/resort/delete/:id', auth, authorizeSuperadmin, deleteResort);
// Settings & Reports
adminRoute.get('/global-settings', getGlobalSettings); // Publicly accessible for frontend footer
adminRoute.put('/global-settings', auth, authorizeSuperadmin, updateGlobalSettings);
import { getAuditLogs } from '../../controller/admin/auditLog.admin.controller.js';
adminRoute.get('/audit-logs', auth, authorizeSuperadmin, getAuditLogs);
adminRoute.get('/reports/stats', auth, authorizeSuperadmin, getDashboardStats);

// Gift Card Admin Routes
adminRoute.get('/giftcard/all', auth, authorizeSuperadmin, getAllGiftCardsByAdmin);
adminRoute.get('/giftcard/verify/:code', auth, authorizeSuperadmin, verifyGiftCardByAdmin);
adminRoute.put('/giftcard/update-status/:id', auth, authorizeSuperadmin, updateGiftCardStatusByAdmin);


// ==========================================
// 🏢 ABOUT US & TEAM ADMIN OPERATIONS
// ==========================================
// Update company story, banner videos/images, or stats targets
adminRoute.put("/about-settings", auth, authorizeAdmin, updateAboutStory);
// CRUD operations for team list
adminRoute.post("/team", auth, authorizeAdmin, createTeamMember);
adminRoute.patch("/team/:id", auth, authorizeAdmin, updateTeamMember);
adminRoute.delete("/team/:id", auth, authorizeSuperadmin, deleteTeamMember); // superadmin only!
export default adminRoute;

