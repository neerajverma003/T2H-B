import express from "express";
import path from 'path';
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/corsOption.js";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import Route Handlers
import adminRoute from "./routes/adminRoutes/admin.route.js";
import blogRoute from './routes/t2h/blog.route.js';
import heroSectionRoute from './routes/t2h/heroSection.route.js';
import destinationRoute from './routes/t2h/destination.route.js';
import resortRoute from './routes/t2h/resort.route.js';
import leadsRoute from './routes/t2h/leads.routes.js';
import testimonialRoute from './routes/t2h/testimonial.route.js';
import subscribeRoute from './routes/t2h/subscribe.route.js';
import userRoute from './routes/t2h/user.route.js';
import itineraryLeadRoute from './routes/t2h/itineraryLead.route.js';
import textTestimonialRouter from './routes/t2h/textTestimonial.route.js';

const app = express();

/**
 * SECURITY & PERFORMANCE MIDDLEWARE
 * --------------------------------
 * 1. Helmet: Sets various HTTP headers for security.
 * 2. Compression: Gzip compression for all responses.
 * 3. Morgan: Request logging for audit trails.
 */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images/media from S3
  contentSecurityPolicy: false // Disabled for ease of integration with external scripts/CDNs
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/**
 * BODY PARSING & AUTH
 * -------------------
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors(corsOptions));

/**
 * STATIC ASSET FALLBACK
 * ---------------------
 * Local storage is only used in development. 
 * Production environments strictly use AWS S3/CloudFront.
 */
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
}

/**
 * DATABASE INITIALIZATION
 */
connectDB();

/**
 * SYSTEM HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.json({
    status: "Backend is operational 🚀",
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * API ROUTE REGISTRY
 */
app.use("/admin", adminRoute);
app.use('/blog', blogRoute);
app.use('/', heroSectionRoute);
app.use('/destination', destinationRoute);
app.use('/resort', resortRoute);
app.use('/leads', leadsRoute);
app.use('/', testimonialRoute);
app.use('/', subscribeRoute);
app.use('/user', userRoute);
app.use('/itinerary-leads', itineraryLeadRoute);
app.use('/textTestimonial', textTestimonialRouter);

/**
 * ERROR HANDLING
 * --------------
 * Must be placed AFTER all routes.
 */
app.use(notFound);
app.use(errorHandler);

/**
 * SERVER LIFECYCLE
 */
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`[SYSTEM] Server active on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

