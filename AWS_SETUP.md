# AWS Setup Guide for SpaceShare

This guide walks you through setting up AWS services for SpaceShare's geofencing and notification features.

## Overview

SpaceShare uses:
- **AWS Location Service** - Geofencing to detect when renters arrive/leave
- **AWS Lambda** - Process geofence events and trigger actions
- **AWS SNS** - Send email/SMS notifications to space owners
- **AWS IoT Core** - Control smart locks/bollards (optional)

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- Node.js 18+

---

## Step 1: Create AWS Location Service Resources

### 1.1 Create a Tracker

```bash
aws location create-tracker \
  --tracker-name SpaceShareTracker \
  --pricing-plan RequestBasedUsage \
  --description "Tracks renter devices for geofence detection"
```

### 1.2 Create a Geofence Collection

```bash
aws location create-geofence-collection \
  --collection-name SpaceShareGeofences \
  --pricing-plan RequestBasedUsage \
  --description "Geofences around booked spaces"
```

### 1.3 Associate Tracker with Geofence Collection

```bash
aws location associate-tracker-consumer \
  --tracker-name SpaceShareTracker \
  --consumer-arn arn:aws:geo:us-east-1:YOUR_ACCOUNT_ID:geofence-collection/SpaceShareGeofences
```

---

## Step 2: Create SNS Topics

### 2.1 Create Booking Notification Topic

```bash
aws sns create-topic --name SpaceShareBookings
```

### 2.2 Create Arrival Notification Topic

```bash
aws sns create-topic --name SpaceShareArrivals
```

### 2.3 Subscribe Your Email (for testing)

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:SpaceShareBookings \
  --protocol email \
  --notification-endpoint your-email@example.com
```

---

## Step 3: Create Lambda Function

### 3.1 Create IAM Role for Lambda

Create a file `lambda-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create the role:

```bash
aws iam create-role \
  --role-name SpaceShareLambdaRole \
  --assume-role-policy-document file://lambda-trust-policy.json
```

### 3.2 Attach Policies

```bash
# Basic Lambda execution
aws iam attach-role-policy \
  --role-name SpaceShareLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# IoT publish access
aws iam attach-role-policy \
  --role-name SpaceShareLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AWSIoTDataAccess

# SNS publish access
aws iam attach-role-policy \
  --role-name SpaceShareLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonSNSFullAccess
```

### 3.3 Build and Deploy Lambda

```bash
cd lambda/geofence-handler

# Install dependencies
npm init -y
npm install @aws-sdk/client-iot-data-plane @aws-sdk/client-sns

# Build
npx tsc index.ts --outDir dist --esModuleInterop --target ES2020 --module commonjs

# Zip
cd dist && zip -r ../function.zip . && cd ..

# Deploy
aws lambda create-function \
  --function-name SpaceShareGeofenceHandler \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/SpaceShareLambdaRole \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --environment Variables="{
    IOT_ENDPOINT=YOUR_IOT_ENDPOINT,
    SNS_TOPIC_ARN=arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:SpaceShareArrivals,
    SUPABASE_URL=YOUR_SUPABASE_URL,
    SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
  }"
```

---

## Step 4: Create EventBridge Rule

Connect Location Service geofence events to Lambda:

```bash
aws events put-rule \
  --name SpaceShareGeofenceEvents \
  --event-pattern '{
    "source": ["aws.geo"],
    "detail-type": ["Location Geofence Event"],
    "detail": {
      "EventType": ["ENTER", "EXIT"]
    }
  }' \
  --description "Route geofence events to Lambda"

# Add Lambda as target
aws events put-targets \
  --rule SpaceShareGeofenceEvents \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:SpaceShareGeofenceHandler"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name SpaceShareGeofenceHandler \
  --statement-id EventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/SpaceShareGeofenceEvents
```

---

## Step 5: Create IAM User for App

Create an IAM user for the Next.js app to call AWS services:

```bash
aws iam create-user --user-name spaceshare-app

aws iam create-access-key --user-name spaceshare-app
```

Save the Access Key ID and Secret Access Key.

### Attach Policy

Create `app-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:PutGeofence",
        "geo:BatchDeleteGeofence",
        "geo:BatchUpdateDevicePosition"
      ],
      "Resource": [
        "arn:aws:geo:us-east-1:YOUR_ACCOUNT_ID:geofence-collection/SpaceShareGeofences",
        "arn:aws:geo:us-east-1:YOUR_ACCOUNT_ID:tracker/SpaceShareTracker"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": [
        "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:SpaceShareBookings",
        "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:SpaceShareArrivals"
      ]
    }
  ]
}
```

```bash
aws iam put-user-policy \
  --user-name spaceshare-app \
  --policy-name SpaceShareAppPolicy \
  --policy-document file://app-policy.json
```

---

## Step 6: Configure Environment Variables

Add to your `.env.local`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_AWS_REGION=us-east-1

# AWS Location Service
NEXT_PUBLIC_AWS_TRACKER_NAME=SpaceShareTracker
NEXT_PUBLIC_AWS_GEOFENCE_COLLECTION=SpaceShareGeofences

# AWS SNS
AWS_SNS_BOOKING_TOPIC_ARN=arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:SpaceShareBookings
AWS_SNS_ARRIVAL_TOPIC_ARN=arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:SpaceShareArrivals

# AWS IoT (optional)
AWS_IOT_ENDPOINT=your-iot-endpoint.iot.us-east-1.amazonaws.com
```

---

## Step 7: (Optional) Set Up IoT Core

If you have physical smart locks/bollards:

### 7.1 Create IoT Thing

```bash
aws iot create-thing --thing-name SpaceShareBollard001
```

### 7.2 Create and Attach Certificate

```bash
aws iot create-keys-and-certificate \
  --set-as-active \
  --certificate-pem-outfile cert.pem \
  --public-key-outfile public.key \
  --private-key-outfile private.key
```

### 7.3 Create IoT Policy

```bash
aws iot create-policy \
  --policy-name SpaceShareDevicePolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["iot:Connect", "iot:Subscribe", "iot:Receive"],
        "Resource": "*"
      }
    ]
  }'
```

---

## Testing

### Test Geofence Creation

```bash
curl -X POST http://localhost:3000/api/geofence/create \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "test-123"}'
```

### Test Location Update

```bash
curl -X POST http://localhost:3000/api/location/update \
  -H "Content-Type: application/json" \
  -d '{"latitude": 41.824, "longitude": -71.4128}'
```

---

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Renter's      │     │  AWS Location   │     │   EventBridge   │
│   Phone/App     │────▶│    Service      │────▶│                 │
│  (GPS Updates)  │     │   (Tracker)     │     │  (Geofence      │
└─────────────────┘     └─────────────────┘     │   Events)       │
                                                └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Space Owner   │◀────│    AWS SNS      │◀────│  AWS Lambda     │
│   (Email/SMS)   │     │  (Notifications)│     │  (Handler)      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  AWS IoT Core   │
                                                │  (Smart Lock)   │
                                                └─────────────────┘
```

---

## Costs (Free Tier)

- **Location Service**: 10,000 geofence evaluations/month free
- **Lambda**: 1M requests/month free
- **SNS**: 1,000 email notifications/month free
- **IoT Core**: 250,000 messages/month free

For a small deployment, this should stay within free tier limits.
