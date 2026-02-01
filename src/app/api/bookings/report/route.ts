import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/bookings/report
 *
 * Report an issue with a booking (e.g., someone in your spot)
 */

interface ReportRequest {
  bookingId: string;
  issueType: "OCCUPIED" | "ACCESS_ISSUE" | "SAFETY" | "OTHER";
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();
    const { bookingId, issueType, description } = body;

    if (!bookingId || !issueType || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    // Verify booking belongs to user
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, renter_id, space_id")
      .eq("id", bookingId)
      .single();

    if (!booking || booking.renter_id !== user.id) {
      return NextResponse.json(
        { error: "Booking not found or unauthorized" },
        { status: 404 }
      );
    }

    // In production, this would:
    // 1. Store the report in a database table
    // 2. Notify the space owner
    // 3. Potentially trigger support workflow

    const report = {
      id: `RPT-${Date.now()}`,
      bookingId,
      spaceId: booking.space_id,
      reporterId: user.id,
      issueType,
      description,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    console.log("📋 Issue Report Submitted:", report);

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        message: "Your report has been submitted. We'll review it shortly.",
      },
    });
  } catch (error) {
    console.error("Report submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
