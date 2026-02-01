import { NextResponse } from "next/server";

/**
 * POST /api/simulate/arrival
 *
 * Simulates Marcus arriving at the parking spot (geofence ENTER event)
 * This triggers the full flow: Location → EventBridge → Lambda → IoT → Bollard Opens
 */

export async function POST() {
  console.log("🚗 SIMULATE: Marcus arriving at parking spot...");

  // Simulate the geofence event
  const geofenceEvent = {
    EventType: "ENTER",
    GeofenceId: "space_01",
    DeviceId: "marcus_phone_01",
    Position: [-122.4194, 37.7749],
    SampleTime: new Date().toISOString(),
  };

  console.log("📍 Geofence Event:", geofenceEvent);
  console.log("🔔 EventBridge triggered");
  console.log("⚡ Lambda executing...");
  console.log(
    "📡 Publishing UNLOCK to IoT topic: spaceshare/spaces/01/control",
  );
  console.log("🔓 Bollard_01 UNLOCKED!");

  return NextResponse.json({
    success: true,
    event: "ARRIVAL",
    geofenceId: "space_01",
    action: "UNLOCK",
    timestamp: new Date().toISOString(),
    flow: [
      "Location Update received",
      "Geofence ENTER detected",
      "EventBridge rule triggered",
      "Lambda published to IoT",
      "Bollard UNLOCKED",
    ],
  });
}
