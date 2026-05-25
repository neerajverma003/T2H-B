import nodemailer from 'nodemailer';
import { ENV } from '../config/ENV.js';

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

    const frontendUrl = ENV.FRONTEND_URL || 'http://localhost:5174';
    const inviteLink = `${frontendUrl}/gift-cards/invite/${token}`;

    const mailOptions = {
      from: `"Trip To Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: `${senderName} sent you a Trip To Honeymoon Gift Card!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #0F3AB2; text-align: center;">Trip To Honeymoon Gift Card</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p>Dear Customer,</p>
          <p><strong>${senderName}</strong> has sent you a Trip To Honeymoon Gift Card worth <strong>₹${amount}</strong>!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="font-size: 18px; font-weight: bold; color: white; background-color: #0F3AB2; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Claim Your Gift Card
            </a>
          </div>
          <p>Or copy and paste this link in your browser: <br/> <a href="${inviteLink}">${inviteLink}</a></p>
          <p>Warm regards,<br/>The Trip To Honeymoon Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Invite email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[MAIL] Error sending invite email: `, error);
    return false;
  }
};
