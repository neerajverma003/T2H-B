import nodemailer from 'nodemailer';
import { ENV } from '../config/ENV.js';
import GiftCardInvite from '../models/giftCardInvite.model.js';
import { renderGiftCardImageBuffer } from './giftCardImage.js';

export const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Trip to Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: `Your Trip to Honeymoon Verification Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 40px 10px;">
            <tr>
              <td align="center">
                <div style="width: 100%; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; text-align: left; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  
                  <div style="background-color: #0F3AB2; padding: 30px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                      Trip to Honeymoon
                    </h2>
                  </div>

                  <div style="padding: 30px; box-sizing: border-box;">
                    <p style="font-size: 15px; color: #334155; line-height: 24px; margin-top: 0;">
                      Hello,
                    </p>
                    <p style="font-size: 14px; color: #475569; line-height: 24px;">
                      Thank you for choosing Trip to Honeymoon. Please use the verification code below to complete your sign-up process:
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                      <span style="display: inline-block; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #0F3AB2; border: 1px solid #cbd5e1; padding: 12px 30px; border-radius: 8px; background-color: #f1f5f9;">
                        ${otp}
                      </span>
                    </div>

                    <p style="font-size: 13px; color: #64748b; line-height: 22px;">
                      This code is valid for the next 5 minutes. For security, please do not share this verification code with anyone.
                    </p>

                    <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 22px;">
                        Best regards,<br/>
                        <strong>The Trip to Honeymoon Concierge</strong>
                      </p>
                    </div>
                  </div>

                  <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
                    This is an automated system message. If you did not request a verification code, please ignore this email.<br/>
                    © 2026 Trip to Honeymoon. All rights reserved.
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL] Error sending email: `, error);
    return false;
  }
};

export const sendGiftCardInviteEmail = async (email, amount, senderName, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });

    const frontendUrl = ENV.FRONTEND_URL;
    const inviteLink = `${frontendUrl}/gift-cards/invite/${token}`;

    // 1. Fetch Dynamic Data for Image
    let publicCode = 'T2H-VOUCHER';
    let expiryDate = null;
    try {
      const invite = await GiftCardInvite.findOne({ invite_token: token }).populate('gift_card_id');
      if (invite && invite.gift_card_id) {
        publicCode = invite.gift_card_id.public_code;
        expiryDate = invite.gift_card_id.expiry_date;
      }
    } catch (e) {
      console.log('[MAIL] Error fetching invite details for image', e);
    }

    // 2. Generate Image Buffer
    const imageBuffer = await renderGiftCardImageBuffer({
      amount,
      publicCode,
      expiryDate,
    });

    // 3. Send Email with Inline Attachment
    const mailOptions = {
      from: `"Trip To Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: `${senderName} sent you a Trip To Honeymoon Gift Card!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 30px 10px;">
            <tr>
              <td align="center">
                <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); text-align: left; box-sizing: border-box;">
                  
                  <!-- Luxury Header -->
                  <div style="background-color: #0F3AB2; padding: 45px 20px; text-align: center; box-sizing: border-box;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">
                      Trip to Honeymoon
                    </h1>
                    <div style="display: inline-block; background-color: rgba(229, 184, 105, 0.15); border: 1px solid #E5B869; color: #E5B869; padding: 8px 20px; border-radius: 50px; margin-top: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
                      Exclusive Travel Voucher
                    </div>
                  </div>

                  <!-- Email Body Content -->
                  <div style="padding: 40px 30px; box-sizing: border-box;">
                    <p style="font-size: 16px; line-height: 26px; color: #334155; margin-top: 0; font-weight: 600;">
                      Dear Customer,
                    </p>
                    
                    <div style="background-color: #fdfaf3; border-left: 4px solid #E5B869; padding: 25px; border-radius: 0 12px 12px 0; margin-bottom: 35px;">
                      <p style="font-size: 16px; line-height: 28px; color: #475569; margin: 0; font-style: italic; font-weight: 500;">
                        A lifetime of romance deserves the most magical escapes. We are delighted to inform you that <strong style="color: #0F3AB2;">${senderName}</strong> has sent you a special travel token to celebrate your beautiful journey together!
                      </p>
                    </div>

                    <!-- Premium Light Theme Digital Gift Card (Inline Attachment) -->
                    <div style="text-align: center; margin: 35px 0;">
                      <img src="cid:giftcard_image" 
                           alt="Trip to Honeymoon Gift Card" 
                           style="width: 100%; max-width: 500px; height: auto; border-radius: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);" />
                    </div>

                    <p style="font-size: 15px; line-height: 26px; color: #475569; margin-bottom: 30px; text-align: center;">
                      This exclusive voucher can be instantly claimed and redeemed towards any luxury domestic or international honeymoon package, romantic getaway, or bespoke travel experience.
                    </p>

                    <!-- CTA Button Section -->
                    <div style="text-align: center; margin: 50px 0 30px;">
                      <a href="${inviteLink}" style="display: inline-block; background-color: #E5B869; color: #000000; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 20px 45px; text-decoration: none; border-radius: 50px; box-shadow: 0 10px 30px rgba(229, 184, 105, 0.4);">
                        Claim Your Travel Gift
                      </a>
                    </div>

                    <!-- Backup Link -->
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-top: 35px; word-break: break-word;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 22px;">
                        Button not working? Copy and paste this secure link into your web browser:<br/>
                        <a href="${inviteLink}" style="color: #0F3AB2; text-decoration: underline; font-weight: 700; display: inline-block; margin-top: 8px;">${inviteLink}</a>
                      </p>
                    </div>

                    <!-- Sign-off -->
                    <div style="margin-top: 45px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 26px;">
                        Warmest regards,<br/>
                        <strong style="color: #0F3AB2; font-size: 16px;">The Trip to Honeymoon Concierge</strong>
                      </p>
                    </div>

                  </div>

                  <!-- Footer Details -->
                  <div style="background-color: #0a192f; padding: 40px 30px; text-align: center; box-sizing: border-box;">
                    <h2 style="color: #E5B869; margin: 0 0 15px 0; font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Trip to Honeymoon</h2>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 22px; margin: 0;">
                      © 2026 Trip to Honeymoon. All Rights Reserved.<br/>
                      This email was sent securely. If you received this by mistake, please contact our support team.
                    </p>
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'TripToHoneymoon_GiftCard.png',
        content: imageBuffer,
        cid: 'giftcard_image' // matching cid in html img src
      }]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Invite email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL] Error sending invite email: `, error);
    return false;
  }
};

export const sendGiftCardReminderEmail = async (email, amount, customMessage, token, publicCode, expiryDate) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });

    const frontendUrl = ENV.FRONTEND_URL;
    const inviteLink = token ? `${frontendUrl}/gift-cards/invite/${token}` : frontendUrl;

    // Generate Image Buffer for the reminder email
    const imageBuffer = await renderGiftCardImageBuffer({
      amount,
      publicCode: publicCode || 'T2H-VOUCHER',
      expiryDate: expiryDate || null,
    });

    const displayExpiry = expiryDate
      ? new Date(expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Lifetime';

    const mailOptions = {
      from: `"Trip To Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: `Action Required: Your ₹${amount.toLocaleString('en-IN')} Trip To Honeymoon Voucher Awaits!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 30px 10px;">
            <tr>
              <td align="center">
                <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); text-align: left; box-sizing: border-box;">
                  
                  <!-- Luxury Header -->
                  <div style="background-color: #0F3AB2; padding: 45px 20px; text-align: center; box-sizing: border-box;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">
                      Trip to Honeymoon
                    </h1>
                    <div style="display: inline-block; background-color: rgba(229, 184, 105, 0.15); border: 1px solid #E5B869; color: #E5B869; padding: 8px 20px; border-radius: 50px; margin-top: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
                      Friendly Reminder
                    </div>
                  </div>

                  <!-- Content Body -->
                  <div style="padding: 40px 30px; box-sizing: border-box;">
                    <p style="font-size: 16px; line-height: 26px; color: #334155; margin-top: 0; font-weight: 600;">
                      Dear Customer,
                    </p>
                    
                    <div style="background-color: #fdfaf3; border-left: 4px solid #E5B869; padding: 25px; border-radius: 0 12px 12px 0; margin-bottom: 35px;">
                      <p style="font-size: 16px; line-height: 28px; color: #475569; margin: 0; font-style: italic; font-weight: 500;">
                        "${customMessage || 'Your exclusive travel voucher is waiting. Do not miss out on booking your perfect luxury getaway!'}"
                      </p>
                    </div>

                    <!-- Quick Info Card -->
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 40px; box-shadow: 0 10px 25px -5px rgba(15, 58, 178, 0.05); box-sizing: border-box;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="50%" align="left" valign="top">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px;">Voucher Value</p>
                            <p style="margin: 8px 0 0 0; font-size: 26px; color: #0F3AB2; font-weight: 900;">₹${amount.toLocaleString('en-IN')}</p>
                          </td>
                          <td width="50%" align="right" valign="top">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px;">Valid Until</p>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #334155; font-weight: 800;">${displayExpiry}</p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Gift Card Image -->
                    <div style="text-align: center; margin: 35px 0;">
                      <img src="cid:giftcard_image" 
                           alt="Trip to Honeymoon Gift Card" 
                           style="width: 100%; max-width: 500px; height: auto; border-radius: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);" />
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 50px 0 30px;">
                      <a href="${inviteLink}" style="display: inline-block; background-color: #E5B869; color: #000000; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 20px 45px; text-decoration: none; border-radius: 50px; box-shadow: 0 10px 30px rgba(229, 184, 105, 0.4);">
                        Claim & View Options
                      </a>
                    </div>

                    <!-- Backup Link -->
                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; margin-top: 35px; word-break: break-word;">
                      <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 22px;">
                        Button not working? Copy and paste this link:<br/>
                        <a href="${inviteLink}" style="color: #0F3AB2; text-decoration: underline; font-weight: 700; display: inline-block; margin-top: 8px;">${inviteLink}</a>
                      </p>
                    </div>

                    <!-- Sign-off -->
                    <div style="margin-top: 45px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 26px;">
                        Warmest regards,<br/>
                        <strong style="color: #0F3AB2; font-size: 16px;">The Trip to Honeymoon Concierge</strong>
                      </p>
                    </div>

                  </div>

                  <!-- Footer -->
                  <div style="background-color: #0a192f; padding: 40px 30px; text-align: center; box-sizing: border-box;">
                    <h2 style="color: #E5B869; margin: 0 0 15px 0; font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Trip to Honeymoon</h2>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 22px; margin: 0;">
                      © 2026 Trip to Honeymoon. All Rights Reserved.<br/>
                      This is a system generated reminder email. Please do not reply directly.
                    </p>
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments: [{
        filename: 'TripToHoneymoon_GiftCard.png',
        content: imageBuffer,
        cid: 'giftcard_image'
      }]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Reminder email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL] Error sending reminder email: `, error);
    return false;
  }
};

export const sendBookingConfirmationWithInvoice = async (email, customerName, bookingData, pdfBuffer) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });

    const frontendUrl = ENV.FRONTEND_URL;

    const mailOptions = {
      from: `"Trip To Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: `Booking Confirmed: Your Trip to ${bookingData.itineraryTitle} is set! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 30px 10px;">
            <tr>
              <td align="center">
                <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); text-align: left; box-sizing: border-box;">
                  
                  <!-- Luxury Header -->
                  <div style="background-color: #0F3AB2; padding: 45px 20px; text-align: center; box-sizing: border-box;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">
                      Trip to Honeymoon
                    </h1>
                    <div style="display: inline-block; background-color: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #bbf7d0; padding: 8px 20px; border-radius: 4px; margin-top: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
                      Booking Confirmed ✅
                    </div>
                  </div>

                  <!-- Content Body -->
                  <div style="padding: 40px 30px; box-sizing: border-box;">
                    <p style="font-size: 16px; line-height: 26px; color: #334155; margin-top: 0; font-weight: 600;">
                      Dear ${customerName},
                    </p>
                    
                    <div style="background-color: #fdfaf3; border-left: 4px solid #E5B869; padding: 25px; border-radius: 0 4px 4px 0; margin-bottom: 35px;">
                      <p style="font-size: 16px; line-height: 28px; color: #475569; margin: 0; font-style: italic; font-weight: 500;">
                        Pack your bags! Your luxury escape to <strong>${bookingData.itineraryTitle}</strong> is officially confirmed. We have attached your official Tax Invoice to this email for your records.
                      </p>
                    </div>

                    <!-- Booking Summary -->
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 25px; margin-bottom: 40px; box-shadow: 0 10px 25px -5px rgba(15, 58, 178, 0.05); box-sizing: border-box;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="50%" align="left" valign="top" style="padding-bottom: 15px;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px;">Booking ID</p>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #0F3AB2; font-weight: 900;">${bookingData.invoiceNumber}</p>
                          </td>
                          <td width="50%" align="right" valign="top" style="padding-bottom: 15px;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px;">Travel Date</p>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #334155; font-weight: 800;">${bookingData.travelDate}</p>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" align="left" valign="top" style="border-top: 1px solid #f1f5f9; padding-top: 15px;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px;">Total Amount</p>
                            <p style="margin: 8px 0 0 0; font-size: 16px; color: #334155; font-weight: 800;">₹${bookingData.totalAmount.toLocaleString('en-IN')}</p>
                          </td>
                          <td width="50%" align="right" valign="top" style="border-top: 1px solid #f1f5f9; padding-top: 15px;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px;">Status</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #22c55e; font-weight: 800;">PAID IN FULL</p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 50px 0 30px;">
                      <a href="${frontendUrl}/my-bookings" style="display: inline-block; background-color: #0F3AB2; color: #ffffff; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 20px 45px; text-decoration: none; border-radius: 6px; box-shadow: 0 10px 30px rgba(15, 58, 178, 0.3);">
                        View Full Itinerary
                      </a>
                    </div>

                    <!-- Sign-off -->
                    <div style="margin-top: 45px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 26px;">
                        Warmest regards,<br/>
                        <strong style="color: #0F3AB2; font-size: 16px;">The Trip to Honeymoon Concierge</strong>
                      </p>
                    </div>

                  </div>

                  <!-- Footer -->
                  <div style="background-color: #0a192f; padding: 40px 30px; text-align: center; box-sizing: border-box;">
                    <h2 style="color: #E5B869; margin: 0 0 15px 0; font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Trip to Honeymoon</h2>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 22px; margin: 0;">
                      © 2026 Trip to Honeymoon. All Rights Reserved.<br/>
                      Need help? Reply to this email or call our 24/7 concierge.
                    </p>
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments: [{
        filename: `Invoice_${bookingData.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Booking Confirmation email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL] Error sending booking confirmation email: `, error);
    return false;
  }
};

export const sendReferralRewardEmail = async (email, referrerName, refereeName, rewardAmount, type) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ENV.EMAIL_USER,
        pass: ENV.EMAIL_PASS,
      },
    });

    const isSignup = type === 'signup';
    const milestoneText = isSignup 
      ? `joined Trip to Honeymoon using your referral link` 
      : `completed their first tour booking`;

    const mailOptions = {
      from: `"Trip to Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: `Trip to Honeymoon - Referral Reward Credited`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 30px 10px;">
            <tr>
              <td align="center">
                <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); text-align: left; box-sizing: border-box;">
                  
                  <!-- Luxury Header -->
                  <div style="background-color: #0F3AB2; padding: 45px 20px; text-align: center; box-sizing: border-box;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">
                      Trip to Honeymoon
                    </h1>
                    <div style="display: inline-block; background-color: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #bbf7d0; padding: 8px 20px; border-radius: 50px; margin-top: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
                      Referral Reward Credited
                    </div>
                  </div>

                  <!-- Content Body -->
                  <div style="padding: 40px 30px; box-sizing: border-box;">
                    <p style="font-size: 16px; line-height: 26px; color: #334155; margin-top: 0; font-weight: 600;">
                      Dear ${referrerName},
                    </p>
                    
                    <div style="background-color: #fdfaf3; border-left: 4px solid #E5B869; padding: 25px; border-radius: 0 12px 12px 0; margin-bottom: 35px;">
                      <p style="font-size: 16px; line-height: 28px; color: #475569; margin: 0; font-weight: 500;">
                        Your friend <strong>${refereeName}</strong> has successfully ${milestoneText}. As a token of appreciation, we have credited your travel wallet.
                      </p>
                    </div>

                    <!-- Reward Card -->
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 40px; box-shadow: 0 10px 25px -5px rgba(15, 58, 178, 0.05); box-sizing: border-box; text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px;">Referral Bonus Credited</p>
                      <p style="margin: 10px 0 0 0; font-size: 36px; color: #10B981; font-weight: 900;">+ ₹${rewardAmount.toLocaleString('en-IN')}</p>
                    </div>

                    <p style="font-size: 15px; line-height: 26px; color: #475569; margin-bottom: 30px; text-align: center;">
                      You can use this balance directly on your next domestic or international booking checkout. Refer more friends to earn additional rewards.
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0 20px;">
                      <a href="${ENV.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #0F3AB2; color: #ffffff; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 20px 45px; text-decoration: none; border-radius: 50px; box-shadow: 0 10px 30px rgba(15, 58, 178, 0.3);">
                        View Wallet Dashboard
                      </a>
                    </div>

                    <!-- Sign-off -->
                    <div style="margin-top: 45px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 26px;">
                        Warmest regards,<br/>
                        <strong style="color: #0F3AB2; font-size: 16px;">The Trip to Honeymoon Concierge</strong>
                      </p>
                    </div>

                  </div>

                  <!-- Footer -->
                  <div style="background-color: #0a192f; padding: 40px 30px; text-align: center; box-sizing: border-box;">
                    <h2 style="color: #E5B869; margin: 0 0 15px 0; font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Trip to Honeymoon</h2>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 22px; margin: 0;">
                      © 2026 Trip to Honeymoon. All Rights Reserved.<br/>
                      You are receiving this transactional notification email regarding activity on your Trip to Honeymoon account.<br/>
                      Need help? Contact our 24/7 concierge support.
                    </p>
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Referral credit email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL] Error sending referral credit email: `, error);
    return false;
  }
};

