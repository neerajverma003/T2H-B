import express from 'express';
import { 
  createItineraryLead, 
  getAllItineraryLeads, 
  deleteItineraryLead,
  updateItineraryLeadStatus
} from '../../controller/itineraryLead.controller.js';

const router = express.Router();

router.post('/create', createItineraryLead);
router.get('/all', getAllItineraryLeads);
router.put('/:id/status', updateItineraryLeadStatus);
router.delete('/:id', deleteItineraryLead);

export default router;
