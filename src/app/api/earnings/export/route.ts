import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/earnings/export
 *
 * Exports earnings data as CSV for tax reporting
 */

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();

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

    // Get all spaces owned by user
    const { data: spaces } = await supabase
      .from("spaces")
      .select("id, name, type, address, city")
      .eq("owner_id", user.id);

    if (!spaces || spaces.length === 0) {
      return NextResponse.json(
        { error: "No spaces found" },
        { status: 404 }
      );
    }

    const spaceIds = spaces.map(s => s.id);
    const spaceMap = new Map(spaces.map(s => [s.id, s]));

    // Get all completed bookings for these spaces in the given year
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        id,
        space_id,
        start_date,
        end_date,
        total_days,
        total_price,
        status,
        created_at,
        renter:profiles!renter_id (
          full_name,
          email
        )
      `)
      .in("space_id", spaceIds)
      .in("status", ["COMPLETED", "ACTIVE"])
      .gte("start_date", startOfYear)
      .lte("start_date", endOfYear)
      .order("start_date", { ascending: true });

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        csv: "No earnings data for the selected year",
        summary: {
          year,
          totalEarnings: 0,
          totalBookings: 0,
          platformFees: 0,
          netEarnings: 0,
        },
      });
    }

    // Calculate summary
    const totalEarnings = bookings.reduce((sum, b) => sum + b.total_price, 0);
    const platformFees = totalEarnings * 0.02;
    const netEarnings = totalEarnings - platformFees;

    // Generate CSV
    const csvHeaders = [
      "Date",
      "Space Name",
      "Space Type",
      "Address",
      "City",
      "Renter",
      "Start Date",
      "End Date",
      "Days",
      "Gross Amount",
      "Platform Fee (2%)",
      "Net Amount",
      "Status",
    ];

    const csvRows = bookings.map(b => {
      const space = spaceMap.get(b.space_id);
      const renter = Array.isArray(b.renter) ? b.renter[0] : b.renter;
      const platformFee = b.total_price * 0.02;
      const netAmount = b.total_price - platformFee;

      return [
        new Date(b.created_at).toLocaleDateString(),
        space?.name || "",
        space?.type || "",
        space?.address || "",
        space?.city || "",
        renter?.full_name || renter?.email || "Anonymous",
        b.start_date,
        b.end_date,
        b.total_days,
        b.total_price.toFixed(2),
        platformFee.toFixed(2),
        netAmount.toFixed(2),
        b.status,
      ].map(field => `"${field}"`).join(",");
    });

    const csv = [csvHeaders.join(","), ...csvRows].join("\n");

    // Add summary at the end
    const summary = `\n\n"SUMMARY FOR ${year}"\n"Total Gross Earnings","$${totalEarnings.toFixed(2)}"\n"Total Platform Fees (2%)","$${platformFees.toFixed(2)}"\n"Total Net Earnings","$${netEarnings.toFixed(2)}"\n"Total Bookings","${bookings.length}"`;

    return new NextResponse(csv + summary, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="spaceshare-earnings-${year}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export earnings error:", error);
    return NextResponse.json(
      { error: "Failed to export earnings" },
      { status: 500 }
    );
  }
}
