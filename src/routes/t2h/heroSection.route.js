import express from 'express';
import { getHeroSectionVideo } from '../../controller/heroSection.controller.js';

const heroSectionRoute = express.Router();

heroSectionRoute.get('/hero-section/:title', getHeroSectionVideo);
export default heroSectionRoute;
