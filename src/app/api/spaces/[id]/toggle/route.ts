import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/spaces/[id]/toggle
 *
 * Toggles a space between AVAILABLE and INACTIVE status
 * Allows owners to quickly take their space offline
 */

export async function POST(
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

    // Get current space status
    const { data: space, error: fetchError } = await supabase
      .from("spaces")
      .select("status, owner_id")
      .eq("id", id)
      .single();

    if (fetchError || !space) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (space.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this space" },
        { status: 403 }
      );
    }

    // Toggle status
    const newStatus = space.status === "AVAILABLE" ? "INACTIVE" : "AVAILABLE";

    const { error: updateError } = await supabase
      .from("spaces")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update space status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      spaceId: id,
      newStatus,
      message: `Space is now ${newStatus === "AVAILABLE" ? "live" : "offline"}`,
    });
  } catch (error) {
    console.error("Toggle space error:", error);
    return NextResponse.json(
      { error: "Failed to toggle space status" },
      { status: 500 }
    );
  }
}
