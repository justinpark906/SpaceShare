import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { AWS_CONFIG } from "./aws-config";

// Initialize AWS SNS client
function getSNSClient() {
  return new SNSClient({
    region: AWS_CONFIG.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

/**
 * Send notification when a new booking is created
 */
export async function notifyNewBooking(params: {
  ownerEmail: string;
  ownerPhone?: string;
  renterName: string;
  spaceName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
}): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, renterName, spaceName, startDate, endDate, totalPrice } =
    params;

  try {
    const client = getSNSClient();

    const message = `
New Booking on SpaceShare!

Space: ${spaceName}
Renter: ${renterName}
Dates: ${startDate} to ${endDate}
Total: $${totalPrice.toFixed(2)}

Log in to your dashboard to manage this booking.
    `.trim();

    const command = new PublishCommand({
      TopicArn: AWS_CONFIG.sns.bookingTopicArn,
      Message: message,
      Subject: `New Booking: ${spaceName}`,
      MessageAttributes: {
        email: {
          DataType: "String",
          StringValue: ownerEmail,
        },
      },
    });

    await client.send(command);

    console.log(`📧 Booking notification sent to ${ownerEmail}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to send booking notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification when renter arrives at the space (geofence triggered)
 */
export async function notifyRenterArrival(params: {
  ownerEmail: string;
  ownerPhone?: string;
  renterName: string;
  spaceName: string;
}): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, renterName, spaceName } = params;

  try {
    const client = getSNSClient();

    const message = `
${renterName} has arrived at your space "${spaceName}"!

The access has been automatically unlocked.
    `.trim();

    const command = new PublishCommand({
      TopicArn: AWS_CONFIG.sns.arrivalTopicArn,
      Message: message,
      Subject: `Renter Arrived: ${spaceName}`,
      MessageAttributes: {
        email: {
          DataType: "String",
          StringValue: ownerEmail,
        },
      },
    });

    await client.send(command);

    console.log(`📧 Arrival notification sent to ${ownerEmail}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to send arrival notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification when renter leaves the space
 */
export async function notifyRenterDeparture(params: {
  ownerEmail: string;
  renterName: string;
  spaceName: string;
  sessionDuration: string;
}): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, renterName, spaceName, sessionDuration } = params;

  try {
    const client = getSNSClient();

    const message = `
${renterName} has left your space "${spaceName}".

Session duration: ${sessionDuration}
Your earnings will be disbursed shortly.
    `.trim();

    const command = new PublishCommand({
      TopicArn: AWS_CONFIG.sns.arrivalTopicArn,
      Message: message,
      Subject: `Session Ended: ${spaceName}`,
      MessageAttributes: {
        email: {
          DataType: "String",
          StringValue: ownerEmail,
        },
      },
    });

    await client.send(command);

    console.log(`📧 Departure notification sent to ${ownerEmail}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to send departure notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS notification (for urgent alerts)
 */
export async function sendSMS(params: {
  phoneNumber: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const { phoneNumber, message } = params;

  try {
    const client = getSNSClient();

    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    });

    await client.send(command);

    console.log(`📱 SMS sent to ${phoneNumber}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Notify space owner of an issue reported by renter
 */
export async function notifyOwnerOfIssue(params: {
  ownerEmail: string;
  ownerPhone?: string;
  spaceName: string;
  issueType: string;
  renterName: string;
}): Promise<{ success: boolean; error?: string }> {
  const { ownerEmail, ownerPhone, spaceName, issueType, renterName } = params;

  try {
    const client = getSNSClient();

    const message = `
ISSUE REPORTED - SpaceShare

${renterName} reported an issue with "${spaceName}":
${issueType}

Please check your dashboard and contact the renter to resolve this issue.
    `.trim();

    // Send to SNS topic
    const command = new PublishCommand({
      TopicArn: AWS_CONFIG.sns.bookingTopicArn, // Reuse booking topic for now
      Message: message,
      Subject: `Issue Reported: ${spaceName}`,
      MessageAttributes: {
        email: {
          DataType: "String",
          StringValue: ownerEmail,
        },
      },
    });

    await client.send(command);

    // Also send SMS if phone number available (urgent)
    if (ownerPhone) {
      await sendSMS({
        phoneNumber: ownerPhone,
        message: `SpaceShare Alert: ${renterName} reported "${issueType}" at ${spaceName}. Check your dashboard.`,
      });
    }

    console.log(`📧 Issue notification sent to ${ownerEmail}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to send issue notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
