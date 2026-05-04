import express from 'express';
import { getAll, getResortById } from '../../controller/admin/resortController.js';

const resortRoute = express.Router();

// Public endpoints for resorts
resortRoute.get('/', getAll);
resortRoute.get('/:id', getResortById);

export default resortRoute;
