import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to create supabase server client
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

// POST - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spaceId, renterId, days, totalPrice } = body;

    if (!spaceId || !renterId || !days || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Handle mock spaces (for demo purposes)
    if (spaceId.startsWith("mock-")) {
      const mockBooking = {
        id: `booking-${Date.now()}`,
        space_id: spaceId,
        renter_id: renterId,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        total_days: days,
        total_price: totalPrice,
        status: "CONFIRMED",
        payment_status: "PAID",
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ booking: mockBooking });
    }

    const supabase = await getSupabase();

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: spaceId,
        renter_id: renterId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        total_days: days,
        total_price: totalPrice,
        status: "CONFIRMED",
        payment_status: "PAID",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking", details: bookingError.message },
        { status: 500 },
      );
    }

    // Update space status to BOOKED
    const { error: spaceError } = await supabase
      .from("spaces")
      .update({ status: "BOOKED" })
      .eq("id", spaceId);

    if (spaceError) {
      console.error("Error updating space status:", spaceError);
      // Don't fail the booking, just log the error
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const renterId = searchParams.get("renterId");

    if (!renterId) {
      return NextResponse.json({ error: "Missing renterId" }, { status: 400 });
    }

    const supabase = await getSupabase();

    // Get bookings with space details
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        spaces (
          id,
          name,
          address,
          type,
          parking_type,
          latitude,
          longitude,
          image_url
        )
      `,
      )
      .eq("renter_id", renterId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
