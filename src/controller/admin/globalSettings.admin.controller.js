/**
 * Global Settings Admin Controller
 * Manages site-wide configuration: contact info, social links.
 * Uses a single-document singleton pattern (upsert on a fixed key).
 */

import GlobalSettingsModel from '../../models/globalSettings.model.js';

// ---------------------------------------------------------------------------
// GET /admin/global-settings  (public — used by frontend footer)
// ---------------------------------------------------------------------------
export const getGlobalSettings = async (req, res) => {
  try {
    // findOne() returns the first (and only) settings doc, or null
    let settings = await GlobalSettingsModel.findOne();

    // If no settings exist yet, return safe defaults so the frontend never breaks
    if (!settings) {
      settings = {
        supportEmail: 'info@gmail.com',
        supportPhone: '+91 11 4061 2834',
        officeAddress: 'New Delhi, India',
        facebookUrl: '#',
        instagramUrl: '#',
        twitterUrl: '#',
      };
    }

    return res.status(200).json({ success: true, data: settings });
  } catch (err) {
    console.error('[GlobalSettings] GET error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching settings.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /admin/global-settings  (admin only — protected by auth + authorizeAdmin)
// ---------------------------------------------------------------------------
export const updateGlobalSettings = async (req, res) => {
  const { supportEmail, supportPhone, officeAddress, facebookUrl, instagramUrl, twitterUrl } = req.body;

  try {
    // Upsert: update the single document or create it if it doesn't exist
    const updated = await GlobalSettingsModel.findOneAndUpdate(
      {}, // match the first (and only) document
      {
        ...(supportEmail !== undefined && { supportEmail }),
        ...(supportPhone !== undefined && { supportPhone }),
        ...(officeAddress !== undefined && { officeAddress }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      data: updated,
    });
  } catch (err) {
    console.error('[GlobalSettings] PUT error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating settings.' });
  }
};
