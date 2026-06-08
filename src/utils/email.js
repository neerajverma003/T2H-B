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
      from: `"Trip To Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Trip To Honeymoon OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #0F3AB2; text-align: center;">Trip To Honeymoon</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p>Dear Customer,</p>
          <p>Thank you for choosing Trip To Honeymoon. Use the following OTP to verify your email address and complete registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0F3AB2; border: 1px dashed #0F3AB2; padding: 10px 20px; border-radius: 5px; background-color: #F8FAFC;">
              ${otp}
            </span>
          </div>
          <p>This OTP is valid for 5 minutes. Please do not share this OTP with anyone.</p>
          <p>Warm regards,<br/>The Trip To Honeymoon Team</p>
        </div>
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

    const frontendUrl = ENV.FRONTEND_URL ;
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
    } catch(e) {
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
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center; color: #1e293b; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(15, 58, 178, 0.08); border: 1px solid #f1f5f9; text-align: left;">
            
            <!-- Elegant Light Header -->
            <div style="background-color: #ffffff; padding: 45px 40px 30px; text-align: center;">
              <h1 style="color: #0F3AB2; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                Trip to Honeymoon
              </h1>
              <p style="color: #E5B869; margin: 10px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px;">
                Exclusive Travel Voucher
              </p>
            </div>

            <!-- Email Body Content -->
            <div style="padding: 10px 40px 40px;">
              <p style="font-size: 15px; line-height: 26px; color: #475569; margin-top: 0;">
                Dear Customer,
              </p>
              
              <p style="font-size: 16px; line-height: 28px; color: #334155; margin-bottom: 35px;">
                A lifetime of romance deserves the most magical escapes. We are delighted to inform you that <strong style="color: #0F3AB2;">${senderName}</strong> has sent you a special travel token to celebrate your beautiful journey together!
              </p>

              <!-- Premium Light Theme Digital Gift Card (Inline Attachment) -->
              <div style="text-align: center; margin: 35px 0;">
                <img src="cid:giftcard_image" 
                     alt="Trip to Honeymoon Gift Card" 
                     style="width: 100%; max-width: 500px; height: auto; border-radius: 12px; box-shadow: 0 15px 35px rgba(229, 184, 105, 0.15);" />
              </div>

              <p style="font-size: 15px; line-height: 26px; color: #475569; margin-bottom: 35px; text-align: center;">
                This exclusive voucher can be instantly claimed and redeemed towards any luxury domestic or international honeymoon package, romantic getaway, or bespoke travel experience.
              </p>

              <!-- CTA Button Section -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteLink}" style="display: inline-block; background-color: #0F3AB2; color: #ffffff; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 20px 40px; text-decoration: none; border-radius: 50px; box-shadow: 0 10px 25px rgba(15, 58, 178, 0.3);">
                  Claim Your Travel Gift
                </a>
              </div>
              </div>

              <!-- Backup Link -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px 20px; border: 1px dashed #cbd5e1; margin-top: 35px;">
                <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 20px; word-break: break-all; text-align: center;">
                  If the button above does not work, copy and paste this secure link into your web browser:<br/>
                  <a href="${inviteLink}" style="color: #0F3AB2; text-decoration: underline; font-weight: 600;">${inviteLink}</a>
                </p>
              </div>

              <!-- Sign-off -->
              <div style="margin-top: 45px; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                <p style="margin: 0; font-size: 15px; color: #475569; line-height: 24px;">
                  Warmest regards,<br/>
                  <strong style="color: #0F3AB2;">The Trip to Honeymoon Concierge</strong>
                </p>
              </div>

            </div>

            <!-- Footer Details -->
            <div style="background-color: #f8fafc; padding: 30px 40px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 20px;">
              <p style="margin: 0 0 10px 0; font-weight: 600;">
                © 2026 Trip to Honeymoon. All Rights Reserved.
              </p>
              <p style="margin: 0;">
                This email was sent securely. If you received this by mistake, please contact our support team.
              </p>
            </div>

          </div>
        </div>
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
