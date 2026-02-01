import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { AWS_CONFIG } from "./aws-config";

// Initialize AWS SES client
function getSESClient() {
  return new SESClient({
    region: AWS_CONFIG.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

// The "from" email must be verified in AWS SES
const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || "noreply@spaceshare.app";

/**
 * Send an email via AWS SES
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, body, html } = params;

  try {
    const client = getSESClient();

    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: body,
            Charset: "UTF-8",
          },
          ...(html && {
            Html: {
              Data: html,
              Charset: "UTF-8",
            },
          }),
        },
      },
    });

    const response = await client.send(command);

    console.log(`📧 Email sent to ${to}, MessageId: ${response.MessageId}`);

    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send issue report notification to space owner
 */
export async function sendIssueReportEmail(params: {
  ownerEmail: string;
  ownerName: string;
  spaceName: string;
  spaceAddress: string;
  issueType: string;
  description: string;
  renterName: string;
  renterEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  const {
    ownerEmail,
    ownerName,
    spaceName,
    spaceAddress,
    issueType,
    description,
    renterName,
    renterEmail,
  } = params;

  const subject = `Issue Reported: ${spaceName} - SpaceShare`;

  const body = `
Hi ${ownerName},

A renter has reported an issue with your space on SpaceShare.

SPACE DETAILS
-------------
Space: ${spaceName}
Address: ${spaceAddress}

ISSUE DETAILS
-------------
Type: ${issueType}
Reported by: ${renterName} (${renterEmail})

Description:
${description}

NEXT STEPS
----------
Please contact the renter to resolve this issue as soon as possible.
You can reply directly to this email or contact them at: ${renterEmail}

Log in to your dashboard for more details:
https://spaceshare.app/dashboard

---
SpaceShare Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; color: #111; margin-bottom: 8px; }
    .highlight { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 12px 0; }
    .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">Issue Reported</h2>
      <p style="margin:8px 0 0 0; opacity: 0.9;">${spaceName}</p>
    </div>
    <div class="content">
      <p>Hi ${ownerName},</p>
      <p>A renter has reported an issue with your space on SpaceShare.</p>

      <div class="section">
        <div class="section-title">Space Details</div>
        <p><strong>${spaceName}</strong><br>${spaceAddress}</p>
      </div>

      <div class="highlight">
        <div class="section-title">Issue: ${issueType}</div>
        <p style="margin: 8px 0 0 0;">${description}</p>
      </div>

      <div class="section">
        <div class="section-title">Reported By</div>
        <p>${renterName}<br><a href="mailto:${renterEmail}">${renterEmail}</a></p>
      </div>

      <p>Please contact the renter to resolve this issue as soon as possible.</p>

      <a href="https://spaceshare.app/dashboard" class="button">View Dashboard</a>
    </div>
    <div class="footer">
      <p>SpaceShare - Share Your Space, Earn More</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: ownerEmail, subject, body, html });
}

/**
 * Send new booking notification to space owner
 */
export async function sendNewBookingEmail(params: {
  ownerEmail: string;
  ownerName: string;
  spaceName: string;
  renterName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
}): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, ownerName, spaceName, renterName, startDate, endDate, totalPrice } = params;

  const subject = `New Booking: ${spaceName} - SpaceShare`;

  const body = `
Hi ${ownerName},

Great news! You have a new booking on SpaceShare.

BOOKING DETAILS
---------------
Space: ${spaceName}
Renter: ${renterName}
Dates: ${startDate} to ${endDate}
Total Earnings: $${totalPrice.toFixed(2)}

Log in to your dashboard to view the full details:
https://spaceshare.app/dashboard

---
SpaceShare Team
  `.trim();

  return sendEmail({ to: ownerEmail, subject, body });
}
