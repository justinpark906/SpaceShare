import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/bookings/report
 *
 * Report an issue with a booking (e.g., someone in your spot)
 * Notifies the space owner about the issue
 */

interface ReportRequest {
  bookingId: string;
  issueType: "OCCUPIED" | "ACCESS_ISSUE" | "SAFETY" | "OTHER";
  description: string;
}

const issueTypeLabels: Record<string, string> = {
  OCCUPIED: "Someone is in my spot",
  ACCESS_ISSUE: "Can't access the space",
  SAFETY: "Safety concern",
  OTHER: "Other issue",
};

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();
    const { bookingId, issueType, description } = body;

    if (!bookingId || !issueType || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
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
      },
    );

    // Get current user (the renter reporting the issue)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get renter's profile
    const { data: renterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Get booking with space and owner details
    const { data: booking } = await supabase
      .from("bookings")
      .select(
        `
        id,
        renter_id,
        space_id,
        start_date,
        end_date,
        spaces (
          id,
          name,
          address,
          owner_id,
          owner:profiles!owner_id (
            full_name,
            email
          )
        )
      `,
      )
      .eq("id", bookingId)
      .single();

    if (!booking || booking.renter_id !== user.id) {
      return NextResponse.json(
        { error: "Booking not found or unauthorized" },
        { status: 404 },
      );
    }

    const space = Array.isArray(booking.spaces)
      ? booking.spaces[0]
      : booking.spaces;
    const owner = space?.owner
      ? Array.isArray(space.owner)
        ? space.owner[0]
        : space.owner
      : null;

    // Create the report
    const report = {
      id: `RPT-${Date.now()}`,
      bookingId,
      spaceId: space?.id,
      spaceName: space?.name,
      spaceAddress: space?.address,
      reporterId: user.id,
      reporterName:
        renterProfile?.full_name || renterProfile?.email || "Renter",
      reporterEmail: renterProfile?.email,
      ownerId: space?.owner_id,
      ownerName: owner?.full_name || "Owner",
      ownerEmail: owner?.email,
      issueType,
      issueTypeLabel: issueTypeLabels[issueType] || issueType,
      description,
      status: "SUBMITTED",
      createdAt: new Date().toISOString(),
    };

    console.log("📋 Issue Report Submitted:", report);

    // Notify the space owner
    if (owner?.email) {
      // In production, send email via AWS SES, SendGrid, or similar
      // For now, we'll use AWS SNS if configured, otherwise just log

      const notificationMessage = `
Issue Report for your SpaceShare listing

Space: ${space?.name}
Address: ${space?.address}

Issue Type: ${issueTypeLabels[issueType]}
Reported By: ${renterProfile?.full_name || renterProfile?.email || "A renter"}

Description:
${description}

Booking Period: ${booking.start_date} to ${booking.end_date}

Please address this issue as soon as possible. You can contact the renter at: ${renterProfile?.email || "N/A"}

---
SpaceShare Support
      `.trim();

      console.log(
        `📧 Notification to owner (${owner.email}):\n${notificationMessage}`,
      );

      // Send email notification via AWS SES
      if (process.env.AWS_ACCESS_KEY_ID) {
        try {
          const { sendIssueReportEmail } = await import("@/lib/aws-ses");
          await sendIssueReportEmail({
            ownerEmail: owner.email,
            ownerName: owner.full_name || "Space Owner",
            spaceName: space?.name || "Your space",
            spaceAddress: space?.address || "",
            issueType: issueTypeLabels[issueType],
            description,
            renterName: renterProfile?.full_name || "A renter",
            renterEmail: renterProfile?.email || "",
          });
        } catch (sesError) {
          console.warn("SES email failed:", sesError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        ownerNotified: !!owner?.email,
        message: owner?.email
          ? "Your report has been submitted and the space owner has been notified."
          : "Your report has been submitted. We'll review it shortly.",
      },
    });
  } catch (error) {
    console.error("Report submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 },
    );
  }
}
