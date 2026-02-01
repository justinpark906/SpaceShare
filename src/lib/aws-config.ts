// AWS Configuration for SpaceShare
// These values should be set in your .env.local file

export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",

  // AWS Location Service
  location: {
    trackerName: process.env.NEXT_PUBLIC_AWS_TRACKER_NAME || "SpaceShareTracker",
    geofenceCollectionName: process.env.NEXT_PUBLIC_AWS_GEOFENCE_COLLECTION || "SpaceShareGeofences",
    mapName: process.env.NEXT_PUBLIC_AWS_MAP_NAME || "SpaceShareMap",
  },

  // AWS SNS
  sns: {
    bookingTopicArn: process.env.AWS_SNS_BOOKING_TOPIC_ARN || "",
    arrivalTopicArn: process.env.AWS_SNS_ARRIVAL_TOPIC_ARN || "",
  },

  // AWS IoT Core
  iot: {
    endpoint: process.env.AWS_IOT_ENDPOINT || "",
    topicPrefix: "spaceshare/spaces",
  },
};

// Geofence radius in meters (how close renter needs to be to trigger unlock)
export const GEOFENCE_RADIUS_METERS = 50;
