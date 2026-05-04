import express from 'express';

import { testimonal } from '../../controller/testimonial.controller.js';

const testimonialRoute = express.Router();

testimonialRoute.get('/testimonials', testimonal);

export default testimonialRoute;
