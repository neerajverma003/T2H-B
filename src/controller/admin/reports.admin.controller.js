/**
 * Reports and Analytics Admin Controller
 * Aggregates statistics across all business collections for the dashboard.
 */

import DestinationModel from '../../models/destinationInternationAndDomestic.model.js';
import ItineraryModel from '../../models/itinerary.model.js';
import ResortModel from '../../models/resort.model.js';
import BlogModel from '../../models/blog.model.js';
import SubscribeModel from '../../models/subscribe.model.js';
import ContactModel from '../../models/contact.model.js';
import ConsultationModel from '../../models/consultationLead.model.js';
import PlanYourTripModel from '../../models/planYourTrip.model.js';

// ---------------------------------------------------------------------------
// GET /admin/reports/stats
// Aggregates counts for the dashboard overview
// ---------------------------------------------------------------------------
export const getDashboardStats = async (req, res) => {
  try {
    const [
      destinationsCount,
      domesticCount,
      internationalCount,
      itinerariesCount,
      resortsCount,
      blogsCount,
      subscribersCount,
      contactsCount,
      consultationsCount,
      tripRequestsCount,
      recentContacts,
      recentTripRequests,
      recentConsultations
    ] = await Promise.all([
      DestinationModel.countDocuments(),
      DestinationModel.countDocuments({ domestic_or_international: 'domestic' }),
      DestinationModel.countDocuments({ domestic_or_international: 'international' }),
      ItineraryModel.countDocuments(),
      ResortModel.countDocuments(),
      BlogModel.countDocuments(),
      SubscribeModel.countDocuments({ archive: false }),
      ContactModel.countDocuments({ archive: false }),
      ConsultationModel.countDocuments(),
      PlanYourTripModel.countDocuments(),
      // Fetch recent leads
      ContactModel.find({ archive: false }).sort({ createdAt: -1 }).limit(5).select('name createdAt'),
      PlanYourTripModel.find().sort({ createdAt: -1 }).limit(5).select('name createdAt'),
      ConsultationModel.find().sort({ createdAt: -1 }).limit(5).select('name createdAt')
    ]);

    // Combine and sort recent activity
    const recentActivity = [
      ...recentContacts.map(c => ({ name: c.name, type: 'Contact', date: c.createdAt })),
      ...recentTripRequests.map(t => ({ name: t.name, type: 'Trip Request', date: t.createdAt })),
      ...recentConsultations.map(cs => ({ name: cs.name, type: 'Consultation', date: cs.createdAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    // Calculate total leads
    const totalLeads = subscribersCount + contactsCount + consultationsCount + tripRequestsCount;

    return res.status(200).json({
      success: true,
      data: {
        content: {
          destinations: destinationsCount,
          domestic: domesticCount,
          international: internationalCount,
          itineraries: itinerariesCount,
          resorts: resortsCount,
          blogs: blogsCount,
        },
        leads: {
          subscribers: subscribersCount,
          contacts: contactsCount,
          consultations: consultationsCount,
          tripRequests: tripRequestsCount,
          total: totalLeads
        },
        recentActivity
      }
    });
  } catch (err) {
    console.error('[Reports] Dashboard stats error:', err);
    return res.status(500).json({ success: false, message: 'Server error generating reports.' });
  }
};
