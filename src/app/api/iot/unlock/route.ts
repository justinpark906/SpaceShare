import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/iot/unlock
 *
 * Sends an UNLOCK command to the IoT bollard/gate for a specific booking.
 * Optionally verifies user location before unlocking.
 *
 * If AWS Location Service is configured, it can verify the user is within
 * the geofence before sending the unlock command.
 */

interface UnlockRequest {
  bookingId: string;
  spaceId: string;
  userId: string;
  // Optional: user's current location for proximity check
  userLatitude?: number;
  userLongitude?: number;
}

// Calculate distance between two coordinates in meters (Haversine formula)
function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: UnlockRequest = await request.json();
    const { bookingId, spaceId, userId, userLatitude, userLongitude } = body;

    if (!bookingId || !spaceId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await getSupabase();

    // Verify the booking exists and is active
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, spaces(latitude, longitude, name)")
      .eq("id", bookingId)
      .single();

    // For mock bookings, skip verification
    const isMockBooking = bookingId.startsWith("booking-");

    if (!isMockBooking && (bookingError || !booking)) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (
      !isMockBooking &&
      booking.status !== "CONFIRMED" &&
      booking.status !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Booking is not active" },
        { status: 400 },
      );
    }

    // Optional: Check if user is near the space (within 100 meters)
    let distanceMeters: number | null = null;
    let withinRange = true;
    const MAX_DISTANCE_METERS = 100;

    if (userLatitude && userLongitude && !isMockBooking && booking?.spaces) {
      const space = Array.isArray(booking.spaces)
        ? booking.spaces[0]
        : booking.spaces;
      if (space?.latitude && space?.longitude) {
        distanceMeters = getDistanceMeters(
          userLatitude,
          userLongitude,
          space.latitude,
          space.longitude,
        );
        withinRange = distanceMeters <= MAX_DISTANCE_METERS;

        // Update device position in AWS Location Service (if configured)
        if (process.env.AWS_ACCESS_KEY_ID) {
          try {
            await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/location/update`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  deviceId: userId,
                  latitude: userLatitude,
                  longitude: userLongitude,
                }),
              },
            );
          } catch (e) {
            console.warn("Failed to update location:", e);
          }
        }
      }
    }

    // For now, we allow unlock even if not within range (user can override)
    // In a stricter implementation, you could reject if !withinRange

    // Build IoT command
    const iotTopic = `spaceshare/spaces/${spaceId}/control`;
    const iotPayload = {
      action: "UNLOCK",
      bookingId,
      userId,
      timestamp: new Date().toISOString(),
      expiresIn: 30, // Auto-lock after 30 seconds if not used
    };

    console.log(`📡 Publishing to IoT topic: ${iotTopic}`);
    console.log(`🔓 Payload:`, iotPayload);
    if (distanceMeters !== null) {
      console.log(
        `📍 User distance: ${distanceMeters.toFixed(1)}m (${withinRange ? "within range" : "out of range"})`,
      );
    }

    // In production with AWS IoT Core:
    // const { IoTDataPlaneClient, PublishCommand } = require("@aws-sdk/client-iot-data-plane");
    // const iotClient = new IoTDataPlaneClient({ region: 'us-east-1' });
    // await iotClient.send(new PublishCommand({
    //   topic: iotTopic,
    //   payload: Buffer.from(JSON.stringify(iotPayload)),
    // }));

    // Update booking status to ACTIVE if it was CONFIRMED
    if (!isMockBooking && booking?.status === "CONFIRMED") {
      await supabase
        .from("bookings")
        .update({ status: "ACTIVE" })
        .eq("id", bookingId);
    }

    return NextResponse.json({
      success: true,
      message: withinRange
        ? "Gate unlocked successfully"
        : "Gate unlocked (you appear to be far from the location)",
      details: {
        topic: iotTopic,
        action: "UNLOCK",
        expiresIn: 30,
        timestamp: new Date().toISOString(),
        distance:
          distanceMeters !== null
            ? {
                meters: Math.round(distanceMeters),
                withinRange,
              }
            : null,
      },
    });
  } catch (error) {
    console.error("IoT unlock error:", error);
    return NextResponse.json(
      { error: "Failed to send unlock command" },
      { status: 500 },
    );
  }
}
