import express from 'express';
import {
  createTextTestimonial,
  getTextTestimonials,
  getActiveTextTestimonials,
  toggleVerifyTestimonial,
  deleteTextTestimonial,
} from '../../controller/textTestimonials.controller.js';

const textTestimonialRouter = express.Router();

// Submit new text testimonial
textTestimonialRouter.post('/submit', createTextTestimonial);

// Fetch only active text testimonials (PUBLIC FRONTEND)
textTestimonialRouter.get('/', getActiveTextTestimonials);

// Fetch all text testimonials (ADMIN)
textTestimonialRouter.get('/all', getTextTestimonials);

// Toggle verify / toShow status
textTestimonialRouter.patch('/:id/verify', toggleVerifyTestimonial);

// Delete a text testimonial
textTestimonialRouter.delete('/:id', deleteTextTestimonial);

export default textTestimonialRouter;