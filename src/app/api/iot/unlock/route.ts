import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/iot/unlock
 *
 * Sends an UNLOCK command to the IoT bollard/gate for a specific booking
 * In production, this would publish to AWS IoT Core MQTT topic
 */

interface UnlockRequest {
  bookingId: string;
  spaceId: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UnlockRequest = await request.json();
    const { bookingId, spaceId, userId } = body;

    if (!bookingId || !spaceId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Verify the booking is active and belongs to the user
    // 2. Publish to AWS IoT Core topic: spaceshare/spaces/{spaceId}/control
    // 3. The IoT device (bollard/gate) would receive and execute the command

    const iotTopic = `spaceshare/spaces/${spaceId}/control`;
    const iotPayload = {
      action: "UNLOCK",
      bookingId,
      userId,
      timestamp: new Date().toISOString(),
      expiresIn: 30, // Auto-lock after 30 seconds if not used
    };

    console.log(`📡 Publishing to IoT topic: ${iotTopic}`);
    console.log(`🔓 Payload:`, iotPayload);

    // Simulate IoT publish (in production, use AWS IoT SDK)
    // const iotClient = new IoTDataPlaneClient({ region: 'us-east-1' });
    // await iotClient.send(new PublishCommand({
    //   topic: iotTopic,
    //   payload: Buffer.from(JSON.stringify(iotPayload)),
    // }));

    return NextResponse.json({
      success: true,
      message: "Unlock command sent",
      details: {
        topic: iotTopic,
        action: "UNLOCK",
        expiresIn: 30,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("IoT unlock error:", error);
    return NextResponse.json(
      { error: "Failed to send unlock command" },
      { status: 500 }
    );
  }
}
