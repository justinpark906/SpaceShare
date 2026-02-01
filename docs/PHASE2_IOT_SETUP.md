# Phase 2: Digital Twin Setup Guide

This guide walks you through setting up the IoT and Geofencing infrastructure.

## 2.1 Create IoT Thing (Virtual Hardware)

### Step 1: Create the Thing
1. Go to **AWS Console → IoT Core → All devices → Things**
2. Click **Create things** → **Create single thing**
3. Name: `Bollard_01`
4. Click **Next**

### Step 2: Create Certificates
1. Select **Auto-generate a new certificate**
2. Click **Next**

### Step 3: Create and Attach Policy
1. Click **Create policy**
2. Name: `SpaceShareBollardPolicy`
3. Policy document (JSON):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect",
        "iot:Subscribe",
        "iot:Receive",
        "iot:Publish"
      ],
      "Resource": "*"
    }
  ]
}
```
4. Create the policy, go back, and attach it to the certificate

### Step 4: Download Certificates
Download these files and save to `./certs/` folder:
- `xxxxxxxxxx-certificate.pem.crt` → rename to `device.pem.crt`
- `xxxxxxxxxx-private.pem.key` → rename to `private.pem.key`
- `AmazonRootCA1.pem` (click the link to download)

### Step 5: Get IoT Endpoint
1. Go to **IoT Core → Settings**
2. Copy the **Device data endpoint** (looks like `xxxxxx.iot.us-east-1.amazonaws.com`)
3. Set environment variable: `export IOT_ENDPOINT=your-endpoint`

---

## 2.2 Run Bollard Simulator

```bash
# Create certs folder
mkdir -p certs

# Copy your downloaded certificates to ./certs/

# Set environment variables
export IOT_ENDPOINT=your-endpoint.iot.us-east-1.amazonaws.com

# Run simulator
npx tsx scripts/bollard_sim.ts
```

You should see "Waiting for UNLOCK command..." - leave this terminal open!

---

## 2.3 Create Geofence (Invisible Fence)

### Step 1: Create Geofence Collection
1. Go to **AWS Console → Amazon Location Service → Geofence collections**
2. Click **Create geofence collection**
3. Name: `SpaceShareGeofences`
4. Click **Create**

### Step 2: Add a Geofence
1. Click on `SpaceShareGeofences`
2. Click **Create geofence**
3. Geofence ID: `space_01`
4. Draw a circle around your test coordinates:
   - Center: `37.7749, -122.4194` (San Francisco)
   - Radius: `20 meters`
5. Click **Add geofence**

### Step 3: Create Tracker
1. Go to **Trackers** → **Create tracker**
2. Name: `SpaceShareTracker`
3. Click **Create tracker**

### Step 4: Link Tracker to Geofence Collection
1. Go to your tracker `SpaceShareTracker`
2. Click **Link geofence collection**
3. Select `SpaceShareGeofences`
4. Click **Link**

---

## 2.4 Create "Glue" Lambda

### Step 1: Create Lambda Function
1. Go to **AWS Console → Lambda → Create function**
2. Function name: `GeofenceToBollard`
3. Runtime: `Node.js 20.x`
4. Click **Create function**

### Step 2: Add Code
Copy the contents of `amplify/functions/geofenceToBollard/handler.ts` (compiled to JS)

Or use this simplified version:
```javascript
const { IoTDataPlaneClient, PublishCommand } = require('@aws-sdk/client-iot-data-plane');

const iotClient = new IoTDataPlaneClient({ region: 'us-east-1' });

exports.handler = async (event) => {
  console.log('Geofence event:', JSON.stringify(event));
  
  const { EventType, GeofenceId } = event.detail;
  const command = EventType === 'ENTER' ? 'UNLOCK' : 'LOCK';
  
  // Map geofence to IoT topic
  const topic = `spaceshare/spaces/${GeofenceId.replace('space_', '')}/control`;
  
  await iotClient.send(new PublishCommand({
    topic,
    payload: Buffer.from(JSON.stringify({ command })),
  }));
  
  return { statusCode: 200, body: 'OK' };
};
```

### Step 3: Add IAM Permissions
Add this policy to the Lambda execution role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Publish",
      "Resource": "*"
    }
  ]
}
```

### Step 4: Create EventBridge Trigger
1. Go to **Amazon EventBridge → Rules**
2. Click **Create rule**
3. Name: `GeofenceEnterRule`
4. Event pattern:
```json
{
  "source": ["aws.geo"],
  "detail-type": ["Location Geofence Event"],
  "detail": {
    "EventType": ["ENTER"]
  }
}
```
5. Target: Select your `GeofenceToBollard` Lambda
6. Click **Create**

---

## 2.5 Test the Magic Moment!

### Terminal 1: Run Bollard Simulator
```bash
npx tsx scripts/bollard_sim.ts
```

### Terminal 2: Send Mock Location Update
```bash
npx tsx scripts/mock_location_update.ts arrive
```

### Expected Flow:
1. ✅ Script sends position update to tracker
2. ✅ Amazon Location detects ENTER into geofence
3. ✅ EventBridge triggers Lambda
4. ✅ Lambda publishes UNLOCK to IoT topic
5. ✅ Bollard simulator prints "OPEN" ASCII art!

---

## Hack Shortcut (If IoT is Too Complex)

Skip IoT entirely and use DynamoDB polling:

1. Lambda updates `isUnlocked: true` in Space table
2. Frontend polls Space every 2 seconds
3. When `isUnlocked` becomes true, show "GATE OPENED" animation

The code already supports this - see `SpaceCard.tsx` for the polling implementation.
