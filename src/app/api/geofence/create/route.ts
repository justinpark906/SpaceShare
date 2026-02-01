import { NextRequest, NextResponse } from "next/server";
import { createBookingGeofence } from "@/lib/aws-location";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/geofence/create
 *
 * Creates a geofence around a space when a booking is confirmed.
 * Called after successful booking creation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID required" },
        { status: 400 }
      );
    }

    // Get booking details from Supabase
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

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        space:spaces (
          id,
          latitude,
          longitude,
          name
        )
      `)
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const space = Array.isArray(booking.space) ? booking.space[0] : booking.space;

    if (!space) {
      return NextResponse.json(
        { error: "Space not found for booking" },
        { status: 404 }
      );
    }

    // Create geofence in AWS Location Service
    const result = await createBookingGeofence({
      bookingId: booking.id,
      latitude: space.latitude,
      longitude: space.longitude,
    });

    if (!result.success) {
      console.error("Failed to create geofence:", result.error);
      // Don't fail the booking - geofencing is optional enhancement
      return NextResponse.json({
        success: false,
        geofenceCreated: false,
        message: "Booking confirmed, but geofencing not available",
      });
    }

    return NextResponse.json({
      success: true,
      geofenceCreated: true,
      geofenceId: result.geofenceId,
      message: `Geofence created for ${space.name}`,
    });
  } catch (error) {
    console.error("Geofence creation error:", error);
    return NextResponse.json(
      { error: "Failed to create geofence" },
      { status: 500 }
    );
  }
}
