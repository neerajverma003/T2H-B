import express from 'express';
import {
  createTextTestimonial,
  getTextTestimonials,
  toggleVerifyTestimonial,
  deleteTextTestimonial,
} from '../../controller/textTestimonials.controller.js';

const textTestimonialRouter = express.Router();

// Submit new text testimonial (S3 keys sent as JSON — no multer needed)
textTestimonialRouter.post('/submit', createTextTestimonial);

// Fetch all text testimonials (admin)
textTestimonialRouter.get('/', getTextTestimonials);

// Toggle verify / toShow status
textTestimonialRouter.patch('/:id/verify', toggleVerifyTestimonial);

// Delete a text testimonial
textTestimonialRouter.delete('/:id', deleteTextTestimonial);

export default textTestimonialRouter;