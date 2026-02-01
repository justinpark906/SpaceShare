import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/bookings/end
 *
 * Prematurely ends a booking. The renter loses the remaining days but
 * the space becomes available for others again.
 */

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
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // Handle mock bookings
    if (bookingId.startsWith("booking-")) {
      return NextResponse.json({
        success: true,
        message: "Booking ended successfully (demo)",
        booking: {
          id: bookingId,
          status: "COMPLETED",
          ended_early: true,
        },
      });
    }

    const supabase = await getSupabase();

    // Get the booking to find the space_id
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, spaces(id, owner_id)")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Update booking status to COMPLETED (ended early)
    const { error: updateBookingError } = await supabase
      .from("bookings")
      .update({
        status: "COMPLETED",
        end_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", bookingId);

    if (updateBookingError) {
      console.error("Error ending booking:", updateBookingError);
      return NextResponse.json(
        { error: "Failed to end booking" },
        { status: 500 }
      );
    }

    // Make the space available again
    const { error: updateSpaceError } = await supabase
      .from("spaces")
      .update({ status: "AVAILABLE" })
      .eq("id", booking.space_id);

    if (updateSpaceError) {
      console.error("Error updating space status:", updateSpaceError);
      // Don't fail - booking was ended successfully
    }

    // Delete the geofence if AWS is configured
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/geofence/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
    } catch (geofenceError) {
      console.warn("Geofence deletion failed:", geofenceError);
    }

    return NextResponse.json({
      success: true,
      message: "Booking ended successfully. No refund will be issued.",
      booking: {
        id: bookingId,
        status: "COMPLETED",
        ended_early: true,
      },
    });
  } catch (error) {
    console.error("End booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
