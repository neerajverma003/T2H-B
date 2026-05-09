import express from 'express';
import { 
  createItineraryLead, 
  getAllItineraryLeads, 
  deleteItineraryLead 
} from '../../controller/itineraryLead.controller.js';

const router = express.Router();

router.post('/create', createItineraryLead);
router.get('/all', getAllItineraryLeads);
router.delete('/:id', deleteItineraryLead);

export default router;
