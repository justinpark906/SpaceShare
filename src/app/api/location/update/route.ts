import { NextRequest, NextResponse } from "next/server";
import { updateDevicePosition } from "@/lib/aws-location";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/location/update
 *
 * Called from the client to update the renter's position for geofence tracking.
 * This should be called periodically (e.g., every 30 seconds) when user has an active booking.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    // Get current user
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has an active booking
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("id, space_id")
      .eq("renter_id", user.id)
      .in("status", ["CONFIRMED", "ACTIVE"])
      .gte("end_date", new Date().toISOString().split("T")[0]);

    if (!activeBookings || activeBookings.length === 0) {
      return NextResponse.json(
        { error: "No active bookings found", tracked: false },
        { status: 200 }
      );
    }

    // Update device position in AWS Location Service
    const result = await updateDevicePosition({
      deviceId: user.id,
      latitude,
      longitude,
    });

    if (!result.success) {
      console.error("Failed to update position:", result.error);
      // Don't fail the request - position tracking is optional enhancement
      return NextResponse.json({
        success: false,
        tracked: false,
        message: "Position tracking not available",
      });
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      activeBookings: activeBookings.length,
      message: "Position updated successfully",
    });
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
