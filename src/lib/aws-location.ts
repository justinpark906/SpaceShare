import {
  LocationClient,
  PutGeofenceCommand,
  BatchDeleteGeofenceCommand,
  BatchUpdateDevicePositionCommand,
} from "@aws-sdk/client-location";
import { AWS_CONFIG, GEOFENCE_RADIUS_METERS } from "./aws-config";

// Initialize AWS Location Service client
function getLocationClient() {
  return new LocationClient({
    region: AWS_CONFIG.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

/**
 * Create a geofence around a space when a booking is confirmed
 * The geofence ID format: booking_{bookingId}
 */
export async function createBookingGeofence(params: {
  bookingId: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}): Promise<{ success: boolean; geofenceId: string; error?: string }> {
  const { bookingId, latitude, longitude, radiusMeters = GEOFENCE_RADIUS_METERS } = params;
  const geofenceId = `booking_${bookingId}`;

  try {
    const client = getLocationClient();

    const command = new PutGeofenceCommand({
      CollectionName: AWS_CONFIG.location.geofenceCollectionName,
      GeofenceId: geofenceId,
      Geometry: {
        Circle: {
          Center: [longitude, latitude], // Note: [lng, lat] order for GeoJSON
          Radius: radiusMeters,
        },
      },
    });

    await client.send(command);

    console.log(`✅ Geofence created: ${geofenceId} at [${latitude}, ${longitude}]`);

    return { success: true, geofenceId };
  } catch (error) {
    console.error("Failed to create geofence:", error);
    return {
      success: false,
      geofenceId,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Delete a geofence when a booking ends or is cancelled
 */
export async function deleteBookingGeofence(bookingId: string): Promise<{ success: boolean; error?: string }> {
  const geofenceId = `booking_${bookingId}`;

  try {
    const client = getLocationClient();

    const command = new BatchDeleteGeofenceCommand({
      CollectionName: AWS_CONFIG.location.geofenceCollectionName,
      GeofenceIds: [geofenceId],
    });

    await client.send(command);

    console.log(`🗑️ Geofence deleted: ${geofenceId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete geofence:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Update device (renter's phone) position for geofence evaluation
 * Called from the mobile app or web client with GPS coordinates
 */
export async function updateDevicePosition(params: {
  deviceId: string; // Usually the renter's userId
  latitude: number;
  longitude: number;
}): Promise<{ success: boolean; error?: string }> {
  const { deviceId, latitude, longitude } = params;

  try {
    const client = getLocationClient();

    const command = new BatchUpdateDevicePositionCommand({
      TrackerName: AWS_CONFIG.location.trackerName,
      Updates: [
        {
          DeviceId: deviceId,
          Position: [longitude, latitude], // Note: [lng, lat] order
          SampleTime: new Date(),
        },
      ],
    });

    await client.send(command);

    console.log(`📍 Position updated for device ${deviceId}: [${latitude}, ${longitude}]`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update device position:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
