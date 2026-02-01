import {
  IoTDataPlaneClient,
  PublishCommand,
} from "@aws-sdk/client-iot-data-plane";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

/**
 * GeofenceToBollard Lambda
 *
 * This is the "glue" that connects geofence events to physical (simulated) hardware.
 *
 * Flow:
 * 1. Marcus's phone location enters Sarah's parking spot geofence
 * 2. Amazon Location Service detects "ENTER" event
 * 3. EventBridge triggers this Lambda
 * 4. Lambda publishes UNLOCK command to IoT topic
 * 5. Bollard simulator receives command and "opens"
 *
 * Also updates DynamoDB for the "hack" shortcut (frontend polling)
 */

const iotClient = new IoTDataPlaneClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Map geofence IDs to IoT topics
const GEOFENCE_TO_TOPIC: Record<string, string> = {
  space_01: "spaceshare/spaces/01/control",
  space_02: "spaceshare/spaces/02/control",
  space_03: "spaceshare/spaces/03/control",
};

interface GeofenceEvent {
  version: string;
  id: string;
  "detail-type": string;
  source: string;
  account: string;
  time: string;
  region: string;
  detail: {
    EventType: "ENTER" | "EXIT";
    GeofenceId: string;
    DeviceId: string;
    SampleTime: string;
    Position: [number, number];
  };
}

export const handler = async (
  event: GeofenceEvent,
): Promise<{ statusCode: number; body: string }> => {
  console.log("Received geofence event:", JSON.stringify(event, null, 2));

  const { EventType, GeofenceId, DeviceId, Position } = event.detail;

  console.log(
    `Event: ${EventType} | Geofence: ${GeofenceId} | Device: ${DeviceId}`,
  );
  console.log(`Position: ${Position[0]}, ${Position[1]}`);

  // Determine the IoT topic for this geofence
  const topic = GEOFENCE_TO_TOPIC[GeofenceId];

  if (!topic) {
    console.warn(`No IoT topic mapped for geofence: ${GeofenceId}`);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: `Unknown geofence: ${GeofenceId}` }),
    };
  }

  // Determine command based on event type
  const command = EventType === "ENTER" ? "UNLOCK" : "LOCK";

  try {
    // 1. Publish to IoT topic (for real IoT devices / simulator)
    await publishToIoT(topic, {
      command,
      geofenceId: GeofenceId,
      deviceId: DeviceId,
      timestamp: new Date().toISOString(),
    });

    // 2. Update DynamoDB (for frontend polling - "hack" shortcut)
    await updateSpaceStatus(GeofenceId, command === "UNLOCK");

    console.log(`Successfully sent ${command} command for ${GeofenceId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `${command} command sent`,
        geofenceId: GeofenceId,
        topic,
      }),
    };
  } catch (error) {
    console.error("Error processing geofence event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process geofence event" }),
    };
  }
};

async function publishToIoT(topic: string, payload: object): Promise<void> {
  console.log(`Publishing to IoT topic: ${topic}`);
  console.log("Payload:", JSON.stringify(payload));

  try {
    await iotClient.send(
      new PublishCommand({
        topic,
        payload: Buffer.from(JSON.stringify(payload)),
        qos: 1,
      }),
    );
    console.log("IoT publish successful");
  } catch (error) {
    console.error("IoT publish failed:", error);
    // Don't throw - we still want to update DynamoDB
  }
}

async function updateSpaceStatus(
  geofenceId: string,
  isUnlocked: boolean,
): Promise<void> {
  // Extract space ID from geofence ID (e.g., "space_01" -> "01")
  const spaceId = geofenceId.replace("space_", "");

  console.log(`Updating space ${spaceId} isUnlocked=${isUnlocked}`);

  // Note: In production, you'd query by geofenceId or have a mapping table
  // For hackathon, we'll use a simple approach with environment variable
  const tableName = process.env.SPACE_TABLE_NAME;

  if (!tableName) {
    console.warn("SPACE_TABLE_NAME not set, skipping DynamoDB update");
    return;
  }

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id: spaceId },
        UpdateExpression: "SET isUnlocked = :unlocked, lastUpdated = :time",
        ExpressionAttributeValues: {
          ":unlocked": isUnlocked,
          ":time": new Date().toISOString(),
        },
      }),
    );
    console.log("DynamoDB update successful");
  } catch (error) {
    console.error("DynamoDB update failed:", error);
  }
}
