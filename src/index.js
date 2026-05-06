import express from "express";
import path from 'path';
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/corsOption.js";
import connectDB from "./config/db.js";

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

const app = express();

/**
 * MIDDLEWARE CONFIGURATION
 * ------------------------
 * 1. Body Parser: Increased to 50MB for large text fields and content.
 * 2. Cookie Parser: For handling authentication tokens.
 * 3. CORS: Controlled via whitelist in ./config/corsOption.js
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
    timestamp: new Date().toISOString()
  });
});

/**
 * API ROUTE REGISTRY
 * ------------------
 * Note: '/admin' routes are protected and require superadmin privileges.
 * Public routes (blog, destination, etc.) are available for the main website.
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

/**
 * SERVER LIFECYCLE
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SYSTEM] Server active on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
