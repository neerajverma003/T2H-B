import express from 'express';
import { subscribe, getAllSubscribers, archiveSubscriber } from '../../controller/subscribe.controller.js';
import { auth, authorizeAdmin } from '../../middleware/auth.js';

const subscribeRoute = express.Router();

// Public endpoint - User subscribes
subscribeRoute.post('/subscribe', subscribe);

// Admin endpoints - Manage subscribers
subscribeRoute.get('/admin/subscribers', auth, authorizeAdmin, getAllSubscribers);
subscribeRoute.patch('/admin/subscribers/:id/archive', auth, authorizeAdmin, archiveSubscriber);

export default subscribeRoute;
