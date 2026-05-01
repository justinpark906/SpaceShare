# SpaceShare

A peer-to-peer urban space rental marketplace built at Hack@Brown 2026. Won **Visa City Experience** and **Capital One Best Financial Hack**.

SpaceShare lets users list, discover, and book underutilized urban spaces (parking spots, driveways, storage areas, etc.) with real-time geofence-based arrival detection and instant payouts via Visa Direct.

## Features

- Space listing and discovery with map-based search
- Real-time booking and availability management via Supabase
- Geofence-based arrival/departure detection using AWS Location Service
- Instant host payouts powered by Visa Direct
- Automated email/SMS notifications via AWS SNS
- Optional smart lock/bollard integration via AWS IoT Core

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime)
- **Cloud**: AWS Location Service, AWS Lambda, AWS SNS, AWS IoT Core, AWS EventBridge
- **Payments**: Visa Direct API

## Architecture

```
Renter GPS updates
       │
       ▼
AWS Location Service (Tracker)
       │
       ▼
EventBridge (Geofence ENTER/EXIT events)
       │
       ▼
AWS Lambda ──▶ AWS SNS ──▶ Host email/SMS
       │
       ▼
AWS IoT Core (smart lock control, optional)
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- AWS account with Location Service, Lambda, SNS configured (see [AWS_SETUP.md](./AWS_SETUP.md))

### Installation

```bash
git clone https://github.com/justinpark906/SpaceShare.git
cd SpaceShare
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AWS
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_TRACKER_NAME=SpaceShareTracker
NEXT_PUBLIC_AWS_GEOFENCE_COLLECTION=SpaceShareGeofences
AWS_SNS_BOOKING_TOPIC_ARN=your_sns_booking_arn
AWS_SNS_ARRIVAL_TOPIC_ARN=your_sns_arrival_arn

# Visa Direct
VISA_API_KEY=your_visa_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For full AWS setup (geofencing, Lambda, SNS, IoT), see [AWS_SETUP.md](./AWS_SETUP.md).
