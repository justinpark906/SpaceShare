import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/bookings/[id]/receipt
 *
 * Generates a receipt for a completed booking
 * Returns data that can be rendered as PDF or downloaded
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch booking with space details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select(`
        id,
        created_at,
        start_date,
        end_date,
        total_days,
        total_price,
        status,
        payment_status,
        renter_id,
        space:spaces (
          name,
          type,
          address,
          city,
          price_per_day,
          owner:profiles!owner_id (
            full_name,
            email
          )
        ),
        renter:profiles!renter_id (
          full_name,
          email
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify the user is either the renter or owner
    const space = Array.isArray(booking.space) ? booking.space[0] : booking.space;
    const owner = space?.owner;
    const ownerData = Array.isArray(owner) ? owner[0] : owner;

    if (booking.renter_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this receipt" },
        { status: 403 }
      );
    }

    // Calculate fee breakdown
    const subtotal = booking.total_price;
    const platformFee = subtotal * 0.02; // 2% platform fee
    const total = subtotal;

    const receipt = {
      receiptNumber: `SS-${booking.id.slice(0, 8).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      booking: {
        id: booking.id,
        createdAt: booking.created_at,
        startDate: booking.start_date,
        endDate: booking.end_date,
        totalDays: booking.total_days,
        status: booking.status,
        paymentStatus: booking.payment_status,
      },
      space: {
        name: space?.name,
        type: space?.type,
        address: space?.address,
        city: space?.city,
        pricePerDay: space?.price_per_day,
        owner: {
          name: ownerData?.full_name || "Space Owner",
          email: ownerData?.email,
        },
      },
      renter: {
        name: (Array.isArray(booking.renter) ? booking.renter[0] : booking.renter)?.full_name || "Renter",
        email: (Array.isArray(booking.renter) ? booking.renter[0] : booking.renter)?.email,
      },
      pricing: {
        pricePerDay: space?.price_per_day,
        days: booking.total_days,
        subtotal: subtotal,
        platformFee: platformFee,
        total: total,
      },
    };

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Receipt generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
