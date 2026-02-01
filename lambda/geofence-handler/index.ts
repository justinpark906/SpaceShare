/**
 * AWS Lambda Function: Geofence Event Handler
 *
 * This Lambda is triggered by AWS EventBridge when a device enters or exits a geofence.
 *
 * Flow:
 * 1. Device (renter's phone) position is tracked via AWS Location Service
 * 2. When device enters geofence around a booked space → ENTER event
 * 3. This Lambda receives the event and:
 *    - Looks up the booking from the geofence ID
 *    - Sends UNLOCK command to IoT device (bollard/gate)
 *    - Notifies the space owner via SNS
 * 4. When device exits geofence → EXIT event
 *    - Sends LOCK command to IoT device
 *    - Notifies owner that renter has left
 */

import { IoTDataPlaneClient, PublishCommand } from "@aws-sdk/client-iot-data-plane";
import { SNSClient, PublishCommand as SNSPublishCommand } from "@aws-sdk/client-sns";

// Types for the geofence event from EventBridge
interface GeofenceEvent {
  version: string;
  id: string;
  "detail-type": "Location Geofence Event";
  source: "aws.geo";
  account: string;
  time: string;
  region: string;
  detail: {
    EventType: "ENTER" | "EXIT";
    GeofenceId: string;
    DeviceId: string;
    SampleTime: string;
    Position: [number, number]; // [longitude, latitude]
  };
}

// Environment variables (set in Lambda configuration)
const IOT_ENDPOINT = process.env.IOT_ENDPOINT || "";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

// Initialize clients
const iotClient = new IoTDataPlaneClient({
  endpoint: `https://${IOT_ENDPOINT}`,
  region: process.env.AWS_REGION || "us-east-1",
});

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Main Lambda handler
 */
export async function handler(event: GeofenceEvent): Promise<{ statusCode: number; body: string }> {
  console.log("📍 Geofence Event Received:", JSON.stringify(event, null, 2));

  const { EventType, GeofenceId, DeviceId, Position } = event.detail;

  // Extract booking ID from geofence ID (format: booking_{bookingId})
  const bookingId = GeofenceId.replace("booking_", "");

  try {
    // Fetch booking details from Supabase
    const booking = await fetchBookingDetails(bookingId);

    if (!booking) {
      console.error(`Booking not found: ${bookingId}`);
      return { statusCode: 404, body: "Booking not found" };
    }

    if (EventType === "ENTER") {
      // Renter has arrived - unlock the gate/bollard
      await handleRenterArrival(booking, DeviceId, Position);
    } else if (EventType === "EXIT") {
      // Renter has left - lock the gate/bollard
      await handleRenterDeparture(booking, DeviceId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `${EventType} event processed for booking ${bookingId}`
      })
    };
  } catch (error) {
    console.error("Error processing geofence event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
}

/**
 * Fetch booking details from Supabase
 */
async function fetchBookingDetails(bookingId: string): Promise<any | null> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}&select=*,space:spaces(*,owner:profiles!owner_id(*)),renter:profiles!renter_id(*)`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase request failed: ${response.status}`);
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error("Failed to fetch booking:", error);
    return null;
  }
}

/**
 * Handle renter arrival - unlock access and notify owner
 */
async function handleRenterArrival(
  booking: any,
  deviceId: string,
  position: [number, number]
): Promise<void> {
  const spaceId = booking.space.id;
  const spaceName = booking.space.name;
  const ownerEmail = booking.space.owner.email;
  const renterName = booking.renter.full_name || booking.renter.email;

  console.log(`🚗 Renter ${renterName} arrived at ${spaceName}`);

  // 1. Send UNLOCK command to IoT device
  await sendIoTCommand(spaceId, "UNLOCK", {
    bookingId: booking.id,
    renterId: deviceId,
    timestamp: new Date().toISOString(),
  });

  // 2. Update booking status to ACTIVE in Supabase
  await updateBookingStatus(booking.id, "ACTIVE");

  // 3. Notify owner via SNS
  await sendSNSNotification({
    subject: `Renter Arrived: ${spaceName}`,
    message: `${renterName} has arrived at your space "${spaceName}". Access has been automatically unlocked.`,
    email: ownerEmail,
  });

  console.log(`✅ Arrival processed for booking ${booking.id}`);
}

/**
 * Handle renter departure - lock access and notify owner
 */
async function handleRenterDeparture(booking: any, deviceId: string): Promise<void> {
  const spaceId = booking.space.id;
  const spaceName = booking.space.name;
  const ownerEmail = booking.space.owner.email;
  const renterName = booking.renter.full_name || booking.renter.email;

  console.log(`👋 Renter ${renterName} left ${spaceName}`);

  // 1. Send LOCK command to IoT device
  await sendIoTCommand(spaceId, "LOCK", {
    bookingId: booking.id,
    renterId: deviceId,
    timestamp: new Date().toISOString(),
  });

  // 2. Notify owner via SNS
  await sendSNSNotification({
    subject: `Renter Left: ${spaceName}`,
    message: `${renterName} has left your space "${spaceName}". Access has been locked.`,
    email: ownerEmail,
  });

  console.log(`✅ Departure processed for booking ${booking.id}`);
}

/**
 * Send command to IoT device via AWS IoT Core
 */
async function sendIoTCommand(
  spaceId: string,
  action: "UNLOCK" | "LOCK",
  metadata: Record<string, string>
): Promise<void> {
  const topic = `spaceshare/spaces/${spaceId}/control`;
  const payload = {
    action,
    ...metadata,
  };

  console.log(`📡 Publishing to IoT topic: ${topic}`, payload);

  const command = new PublishCommand({
    topic,
    payload: Buffer.from(JSON.stringify(payload)),
    qos: 1, // At least once delivery
  });

  await iotClient.send(command);
  console.log(`✅ IoT command sent: ${action} to ${spaceId}`);
}

/**
 * Send notification via AWS SNS
 */
async function sendSNSNotification(params: {
  subject: string;
  message: string;
  email: string;
}): Promise<void> {
  const command = new SNSPublishCommand({
    TopicArn: SNS_TOPIC_ARN,
    Subject: params.subject,
    Message: params.message,
    MessageAttributes: {
      email: {
        DataType: "String",
        StringValue: params.email,
      },
    },
  });

  await snsClient.send(command);
  console.log(`📧 SNS notification sent: ${params.subject}`);
}

/**
 * Update booking status in Supabase
 */
async function updateBookingStatus(bookingId: string, status: string): Promise<void> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update booking: ${response.status}`);
    }

    console.log(`✅ Booking ${bookingId} status updated to ${status}`);
  } catch (error) {
    console.error("Failed to update booking status:", error);
  }
}
