/**
 * Mock Location Update Script
 *
 * Simulates Marcus's phone sending location updates to Amazon Location Service.
 * When the location enters a geofence, it triggers the full flow:
 *
 * 1. This script → Amazon Location Tracker
 * 2. Tracker detects geofence ENTER → EventBridge
 * 3. EventBridge → GeofenceToBollard Lambda
 * 4. Lambda → IoT Topic → Bollard Simulator "OPENS"
 *
 * RUN: npx tsx scripts/mock_location_update.ts
 */

import {
  LocationClient,
  BatchUpdateDevicePositionCommand,
  GetDevicePositionCommand,
} from "@aws-sdk/client-location";

// Configuration - UPDATE THESE
const CONFIG = {
  region: process.env.AWS_REGION || "us-east-1",
  trackerName: process.env.TRACKER_NAME || "SpaceShareTracker",
  deviceId: "marcus_phone_01", // Simulates Marcus's device
};

// Test coordinates - Sarah's parking spot (inside geofence)
const SARAH_PARKING_SPOT = {
  longitude: -122.4194,
  latitude: 37.7749,
};

// Start position - Marcus is 100m away
const MARCUS_START = {
  longitude: -122.4184,
  latitude: 37.7739,
};

const client = new LocationClient({ region: CONFIG.region });

async function updateDevicePosition(
  longitude: number,
  latitude: number,
): Promise<void> {
  console.log(
    `📍 Updating position: (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
  );

  try {
    await client.send(
      new BatchUpdateDevicePositionCommand({
        TrackerName: CONFIG.trackerName,
        Updates: [
          {
            DeviceId: CONFIG.deviceId,
            Position: [longitude, latitude],
            SampleTime: new Date(),
          },
        ],
      }),
    );
    console.log("✅ Position updated successfully");
  } catch (error) {
    console.error("❌ Failed to update position:", error);
    throw error;
  }
}

async function getDevicePosition(): Promise<void> {
  try {
    const result = await client.send(
      new GetDevicePositionCommand({
        TrackerName: CONFIG.trackerName,
        DeviceId: CONFIG.deviceId,
      }),
    );
    console.log("📍 Current position:", result.Position);
    console.log("⏰ Sample time:", result.SampleTime);
  } catch (error) {
    console.error("❌ Failed to get position:", error);
  }
}

async function simulateMarcusArrival(): Promise<void> {
  console.log("\n🚗 Simulating Marcus driving to Sarah's parking spot...\n");
  console.log(`📱 Device ID: ${CONFIG.deviceId}`);
  console.log(`📍 Tracker: ${CONFIG.trackerName}`);
  console.log(
    `🎯 Destination: Sarah's Parking Spot (${SARAH_PARKING_SPOT.latitude}, ${SARAH_PARKING_SPOT.longitude})\n`,
  );

  // Step 1: Marcus starts 100m away
  console.log("Step 1: Marcus is 100m away from the parking spot");
  await updateDevicePosition(MARCUS_START.longitude, MARCUS_START.latitude);

  console.log("\n⏳ Waiting 3 seconds (simulating driving)...\n");
  await sleep(3000);

  // Step 2: Marcus arrives at the parking spot (ENTERS geofence)
  console.log(
    "Step 2: Marcus ARRIVES at the parking spot (entering geofence!)",
  );
  await updateDevicePosition(
    SARAH_PARKING_SPOT.longitude,
    SARAH_PARKING_SPOT.latitude,
  );

  console.log("\n🎉 Position update sent! If everything is configured:");
  console.log("   1. Amazon Location detects ENTER event");
  console.log("   2. EventBridge triggers Lambda");
  console.log("   3. Lambda publishes to IoT");
  console.log('   4. Bollard simulator shows "OPEN"');
  console.log(
    "\n👀 Check your bollard_sim.ts terminal for the OPEN message!\n",
  );
}

async function simulateMarcusLeaving(): Promise<void> {
  console.log("\n🚗 Simulating Marcus leaving the parking spot...\n");

  // Marcus leaves (EXITS geofence)
  console.log("Marcus is leaving the parking spot (exiting geofence)");
  await updateDevicePosition(MARCUS_START.longitude, MARCUS_START.latitude);

  console.log("\n🔒 Exit event sent! Gate should lock.\n");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "arrive";

  console.log("╔═══════════════════════════════════════════╗");
  console.log("║     SpaceShare Location Simulator         ║");
  console.log("╚═══════════════════════════════════════════╝\n");

  switch (command) {
    case "arrive":
      await simulateMarcusArrival();
      break;
    case "leave":
      await simulateMarcusLeaving();
      break;
    case "status":
      await getDevicePosition();
      break;
    default:
      console.log("Usage:");
      console.log(
        "  npx tsx scripts/mock_location_update.ts arrive  - Simulate Marcus arriving",
      );
      console.log(
        "  npx tsx scripts/mock_location_update.ts leave   - Simulate Marcus leaving",
      );
      console.log(
        "  npx tsx scripts/mock_location_update.ts status  - Get current position",
      );
  }
}

main().catch(console.error);
