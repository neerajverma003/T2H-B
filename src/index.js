// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';

// import { ENV } from './config/ENV.js';
// import connectDB from './config/db.js';
// import { corsOptions } from './config/corsOption.js';
// import adminRoute from './routes/adminRoutes/admin.route.js';

// const app = express();

// app.use(cookieParser());
// app.use(cors(corsOptions));
// // Increase JSON body limit to 50MB to support large text field submissions (e.g., 50,000 char limits × multiple fields)
// app.use(express.json({ limit: '50mb' }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// // Connect to database
// connectDB();

// app.get('/', (req, res) => {
//   res.json({ status: 'API is working', version: '1.0' });
// });

// // Admin routes
// app.use('/admin', adminRoute);


// app.listen(ENV.PORT, () => {
//   console.log(`Server is running on port ${ENV.PORT} ✅`);
// });


import express from "express";
import path from 'path';
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/corsOption.js";
import connectDB from "./config/db.js";
import adminRoute from "./routes/adminRoutes/admin.route.js";
import blogRoute from './routes/t2h/blog.route.js';
import heroSectionRoute from './routes/t2h/heroSection.route.js';
import destinationRoute from './routes/t2h/destination.route.js';
import resortRoute from './routes/t2h/resort.route.js';
import leadsRoute from './routes/t2h/leads.routes.js';
import testimonialRoute from './routes/t2h/testimonial.route.js';
import subscribeRoute from './routes/t2h/subscribe.route.js';
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Serve local uploads directory as fallback
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


connectDB();

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.use("/admin", adminRoute);
// Public blog endpoints (no auth)
app.use('/blog', blogRoute);
// Public hero-section endpoints
app.use('/', heroSectionRoute);
// Public destination endpoints
app.use('/destination', destinationRoute);
// Public resort endpoints
app.use('/resort', resortRoute);
// Public leads endpoints (plan your trip, contact, etc.)
app.use('/leads', leadsRoute);
// Public testimonial endpoints
app.use('/', testimonialRoute);
// Public subscribe endpoints
app.use('/', subscribeRoute);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
