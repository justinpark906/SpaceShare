# AWS Location Service Setup Guide

## Phase 1.4: Metropolis Map Engine

This guide walks you through setting up Amazon Location Service in the AWS Console.

### Step 1: Create a Map Resource

1. Go to **AWS Console → Amazon Location Service → Maps**
2. Click **Create map**
3. Configure:
   - Name: `EcoSquareMap`
   - Map style: `VectorEsriNavigation` (or your preferred style)
4. Click **Create map**

### Step 2: Create a Place Index (for Address Search)

1. Go to **Amazon Location Service → Place indexes**
2. Click **Create place index**
3. Configure:
   - Name: `EcoSquarePlaceIndex`
   - Data provider: `Esri` (recommended for accuracy)
   - Data storage: `SingleUse` (for search without storing results)
4. Click **Create place index**

This allows Marcus to type "123 Main St" and find spaces nearby.

### Step 3: Create a Geofence Collection

1. Go to **Amazon Location Service → Geofence collections**
2. Click **Create geofence collection**
3. Configure:
   - Name: `EcoSquareGeofences`
4. Click **Create geofence collection**

This is the "invisible fence" that detects when Marcus arrives at a parking spot.

### Step 4: Create an API Key

1. Go to **Amazon Location Service → API keys**
2. Click **Create API key**
3. Configure:
   - Name: `EcoSquareAPIKey`
   - Resources: Select your map, place index, and geofence collection
   - Actions: Allow `geo:GetMap*`, `geo:SearchPlaceIndex*`, `geo:GetGeofence*`
   - Expiration: Set appropriate expiration (e.g., 1 year)
4. Click **Create API key**
5. **Copy the API key value** - you'll need this for the frontend

### Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_LOCATION_API_KEY=your-api-key-here
NEXT_PUBLIC_AWS_LOCATION_MAP_NAME=EcoSquareMap
NEXT_PUBLIC_AWS_LOCATION_PLACE_INDEX=EcoSquarePlaceIndex
NEXT_PUBLIC_AWS_LOCATION_GEOFENCE_COLLECTION=EcoSquareGeofences
```

### Architecture Notes

- **Map Resource**: Renders the interactive map in your app
- **Place Index**: Powers address autocomplete and geocoding
- **Geofence Collection**: Triggers events when devices enter/exit areas
- **API Key**: Simplifies frontend authentication (no Cognito signing required)

### Cost Considerations

- Maps: $0.04 per 1,000 tiles requested
- Place Index: $0.40 per 1,000 search requests
- Geofences: $0.05 per geofence per month (first 10,000 free)

For a hackathon, you'll likely stay within the free tier.
