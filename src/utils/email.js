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

    const frontendUrl = ENV.FRONTEND_URL ;
    const inviteLink = `${frontendUrl}/gift-cards/invite/${token}`;

    const mailOptions = {
      from: `"Trip To Honeymoon" <${ENV.EMAIL_USER}>`,
      to: email,
      subject: `${senderName} sent you a Trip To Honeymoon Gift Card!`,
      html: `
        <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; padding: 40px 20px; text-align: center; color: #1e293b; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 58, 178, 0.05); border: 1px solid #e2e8f0; text-align: left;">
            
            <!-- Deep Premium Header -->
            <div style="background: linear-gradient(135deg, #0F3AB2 0%, #051A5A 100%); padding: 35px 40px; text-align: center; border-bottom: 4px solid #f59e0b;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
                Trip to Honeymoon
              </h1>
              <p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                Exclusive Travel Gift Card
              </p>
            </div>

            <!-- Email Body Content -->
            <div style="padding: 40px;">
              <p style="font-size: 15px; line-height: 24px; color: #475569; margin-top: 0;">
                Dear Customer,
              </p>
              
              <p style="font-size: 16px; line-height: 26px; color: #334155; margin-bottom: 30px;">
                A lifetime of romance deserves the most magical escapes. We are delighted to inform you that <strong>${senderName}</strong> has sent you a special travel token to celebrate your beautiful journey together!
              </p>

              <!-- Real Digital Gift Card Graphic inside Email -->
              <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 30px; margin: 30px 0; color: #ffffff; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 15px 30px rgba(0,0,0,0.15); overflow: hidden;">
                
                <div style="margin-bottom: 20px; overflow: hidden;">
                  <div style="float: left;">
                    <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #f59e0b;">
                      Trip Voucher
                    </p>
                    <p style="margin: 3px 0 0 0; font-size: 16px; font-weight: 800; letter-spacing: 0.5px;">
                      Trip to Honeymoon
                    </p>
                  </div>
                  <div style="float: right; font-size: 24px; line-height: 1;">✈️</div>
                  <div style="clear: both;"></div>
                </div>

                <div style="margin: 25px 0 20px 0;">
                  <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                    Gift Value
                  </p>
                  <p style="margin: 5px 0 0 0; font-size: 38px; font-weight: 900; color: #ffffff; letter-spacing: -1px; font-family: Arial, sans-serif;">
                    ₹${Number(amount).toLocaleString('en-IN')}
                  </p>
                </div>

                <div style="border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 15px; font-size: 11px; color: #cbd5e1; overflow: hidden;">
                  <span style="float: left;">Secured By T2H Vault</span>
                  <span style="float: right; font-weight: 700; color: #f59e0b;">1 Year Validity</span>
                  <div style="clear: both;"></div>
                </div>
              </div>

              <p style="font-size: 15px; line-height: 24px; color: #475569; margin-bottom: 30px; text-align: center;">
                This exclusive voucher can be instantly claimed and redeemed towards any luxury domestic or international honeymoon package, romantic getaway, or bespoke travel experience.
              </p>

              <!-- CTA Button Section -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #0F3AB2 0%, #051A5A 100%); color: #ffffff; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 18px 38px; text-decoration: none; border-radius: 50px; box-shadow: 0 8px 20px rgba(15, 58, 178, 0.25); border: 1px solid #0F3AB2;">
                  Claim Your Travel Gift
                </a>
              </div>

              <!-- Backup Link -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px 20px; border: 1px solid #e2e8f0; margin-top: 30px;">
                <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 18px; word-break: break-all; text-align: center;">
                  If the button above does not work, copy and paste this secure link into your web browser:<br/>
                  <a href="${inviteLink}" style="color: #0F3AB2; text-decoration: underline; font-weight: 600;">${inviteLink}</a>
                </p>
              </div>

              <!-- Sign-off -->
              <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 25px;">
                <p style="margin: 0; font-size: 14px; color: #475569; line-height: 22px;">
                  Warmest regards,<br/>
                  <strong style="color: #0f172a;">The Trip to Honeymoon Concierge Team</strong>
                </p>
              </div>

            </div>

            <!-- Footer Details -->
            <div style="background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 18px;">
              <p style="margin: 0 0 8px 0;">
                © 2026 Trip to Honeymoon. All Rights Reserved.
              </p>
              <p style="margin: 0;">
                This email was sent securely. If you received this by mistake, please contact our support team.
              </p>
            </div>

          </div>
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
