import { NextRequest, NextResponse } from "next/server";
import { deleteBookingGeofence } from "@/lib/aws-location";

/**
 * POST /api/geofence/delete
 *
 * Deletes a geofence when a booking ends or is cancelled.
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

    // Delete geofence from AWS Location Service
    const result = await deleteBookingGeofence(bookingId);

    if (!result.success) {
      console.error("Failed to delete geofence:", result.error);
      return NextResponse.json({
        success: false,
        message: "Geofence deletion failed",
        error: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Geofence deleted successfully",
    });
  } catch (error) {
    console.error("Geofence deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete geofence" },
      { status: 500 }
    );
  }
}
