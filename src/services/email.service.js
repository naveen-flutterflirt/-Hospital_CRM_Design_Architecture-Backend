import nodemailer from 'nodemailer';

/**
 * Enterprise Email Service using Gmail / SMTP (Nodemailer)
 * Dispatches HTML onboarding emails directly to the user's inbox.
 */
export class EmailService {
  /**
   * Initialize Nodemailer SMTP transporter
   */
  static getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth: {
          user,
          pass,
        },
      });
    }

    return null;
  }

  /**
   * Send CRM login credentials to newly created user using SMTP
   */
  static async sendUserCredentials({ toEmail, name, role, tempPassword }) {
    const loginUrl = process.env.FRONTEND_LOGIN_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const user = process.env.SMTP_USER;
    const fromAddress = process.env.SMTP_FROM || (user ? `"ApexCare Hospital CRM" <${user}>` : '"ApexCare Hospital CRM" <no-reply@hospitalcrm.com>');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0B5E5E; padding: 28px 32px; text-align: left; }
          .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
          .header p { margin: 4px 0 0; color: #a7f3d0; font-size: 13px; font-weight: 500; }
          .content { padding: 32px; }
          .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
          .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .credentials-table { width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; overflow: hidden; }
          .credentials-table td { padding: 12px 18px; border-bottom: 1px solid #edf2f7; font-size: 13px; }
          .credentials-table tr:last-child td { border-bottom: none; }
          .cred-label { color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; width: 40%; }
          .cred-val { color: #0f172a; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; word-break: break-all; }
          .btn-container { text-align: center; margin: 30px 0 10px; }
          .btn { background-color: #0B5E5E; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; }
          .footer { background-color: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ApexCare Hospital Management System</h1>
            <p>Official CRM Portal Access Provisioning</p>
          </div>
          <div class="content">
            <p class="greeting">Hello ${name},</p>
            <p class="desc">
              Your hospital CRM management portal access has been provisioned by the <strong>Super Administrator</strong>.
            </p>
            
            <table class="credentials-table" cellpadding="0" cellspacing="0">
              <tr>
                <td class="cred-label" style="width: 160px; color: #64748b; font-weight: bold; font-size: 11px; text-transform: uppercase;">Login Email</td>
                <td class="cred-val" style="color: #0B5E5E; font-weight: bold; font-size: 14px;">${toEmail}</td>
              </tr>
              <tr>
                <td class="cred-label" style="width: 160px; color: #64748b; font-weight: bold; font-size: 11px; text-transform: uppercase;">Temporary Password</td>
                <td class="cred-val" style="color: #0f172a; font-weight: bold; font-size: 15px; font-family: monospace; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; display: inline-block; margin: 6px 0;">${tempPassword}</td>
              </tr>
              <tr>
                <td class="cred-label" style="width: 160px; color: #64748b; font-weight: bold; font-size: 11px; text-transform: uppercase;">Assigned Role</td>
                <td class="cred-val" style="color: #334155; font-weight: bold; font-size: 13px;">
                  <span style="background: #e6f4ea; color: #137333; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${role}</span>
                </td>
              </tr>
            </table>

            <div class="btn-container">
              <a href="${loginUrl}" class="btn">Log In to CRM Dashboard &rarr;</a>
            </div>

            <p class="desc" style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">
              <strong>Security Recommendation:</strong> Please change your password upon your first successful login from the platform settings.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ApexCare Hospital & Research Centre. All rights reserved.<br/>
            Confidential &bull; This email was automatically generated.
          </div>
        </div>
      </body>
      </html>
    `;

    const transporter = this.getTransporter();

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: `🔐 Your ApexCare CRM Credentials - Role: ${role}`,
          text: `Hello ${name},\n\nYour CRM access has been created.\nEmail: ${toEmail}\nPassword: ${tempPassword}\nRole: ${role}\nLogin: ${loginUrl}`,
          html: htmlContent,
        });

        console.log(`✅ [GMAIL SMTP DELIVERED] Real email dispatched to ${toEmail}. MessageId: ${info.messageId}`);
        return { success: true, mode: 'SMTP', messageId: info.messageId };
      } catch (err) {
        console.error(`❌ [GMAIL SMTP ERROR] Failed to send email:`, err.message);
        return { success: false, error: err.message };
      }
    }

    // Console fallback if SMTP_USER is not yet set
    console.log(`\n======================================================`);
    console.log(`📧 [GMAIL SMTP READY TO DISPATCH]`);
    console.log(`To: ${name} <${toEmail}>`);
    console.log(`Role: ${role}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log(`Status: Transporter ready. Fill SMTP_USER and SMTP_PASS in backend/.env for live delivery.`);
    console.log(`======================================================\n`);

    return {
      success: true,
      mode: 'LOG_FALLBACK',
      message: `Credentials generated for ${toEmail}`
    };
  }
}
