"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { SpaceMarker } from "./SpaceMarker";
import { BookingSheet } from "./BookingSheet";
import { ActiveSession } from "./ActiveSession";
import {
  getClient,
  isAmplifyConfigured,
  type Space,
} from "@/lib/amplify-client";

// Default center (San Francisco - change to your city)
const DEFAULT_CENTER = {
  longitude: -122.4194,
  latitude: 37.7749,
};

// For demo without AWS Location Service, use OpenStreetMap tiles
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function CityMap() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking flow state
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    space: Space;
    hours: number;
    transactionId?: string;
  } | null>(null);

  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);

      // Check if Amplify backend is configured
      if (!isAmplifyConfigured()) {
        console.log("Amplify not configured, using mock data");
        setSpaces(getMockSpaces());
        setError(null);
        return;
      }

      const client = getClient();
      const { data, errors } = await client.models.Space.list({
        filter: {
          status: { eq: "AVAILABLE" },
        },
      });

      if (errors) {
        console.error("Error fetching spaces:", errors);
        setError("Failed to load spaces");
        return;
      }

      // Map Amplify data to our simplified Space type
      const mappedSpaces: Space[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        pricePerHour: item.pricePerHour,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        status: item.status,
        imageUrl: item.imageUrl,
        ownerId: item.ownerId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      setSpaces(mappedSpaces);
      setError(null);
    } catch (err) {
      console.error("Error fetching spaces:", err);
      // For demo purposes, show mock data if Amplify isn't configured
      setSpaces(getMockSpaces());
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const handleMarkerClick = (space: Space) => {
    setSelectedSpace(space);
    setShowBookingSheet(true);
  };

  const handleBookingConfirm = (space: Space, hours: number) => {
    setShowBookingSheet(false);
    setActiveSession({
      space,
      hours,
      transactionId: `txn_${Date.now()}`,
    });
  };

  const handleSessionEnd = () => {
    setActiveSession(null);
    setSelectedSpace(null);
    // Refresh spaces to show updated availability
    fetchSpaces();
  };

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={{
          longitude: DEFAULT_CENTER.longitude,
          latitude: DEFAULT_CENTER.latitude,
          zoom: 13,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onClick={() => {
          if (!activeSession) {
            setSelectedSpace(null);
            setShowBookingSheet(false);
          }
        }}
      >
        <NavigationControl position="top-right" />

        {spaces.map((space) => (
          <SpaceMarker
            key={space.id}
            space={space}
            onClick={handleMarkerClick}
            isSelected={selectedSpace?.id === space.id}
          />
        ))}
      </Map>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Finding spaces...
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Space count & Legend */}
      {!loading && !error && !activeSession && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm font-medium text-gray-900 mb-3">
            {spaces.length} space{spaces.length !== 1 ? "s" : ""} available
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">Parking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Garden</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Sheet */}
      <BookingSheet
        space={selectedSpace}
        isOpen={showBookingSheet && !activeSession}
        onClose={() => {
          setShowBookingSheet(false);
          setSelectedSpace(null);
        }}
        onBook={handleBookingConfirm}
      />

      {/* Active Session Overlay */}
      {activeSession && (
        <ActiveSession
          space={activeSession.space}
          hours={activeSession.hours}
          transactionId={activeSession.transactionId}
          onEndSession={handleSessionEnd}
        />
      )}
    </div>
  );
}

// Mock data for development before Amplify sandbox is running
function getMockSpaces(): Space[] {
  return [
    {
      id: "mock-1",
      name: "Sarah's Garden",
      description:
        "Beautiful backyard garden available for urban farming. Perfect for growing vegetables or flowers.",
      type: "GARDEN",
      pricePerHour: 5.0,
      latitude: 37.7849,
      longitude: -122.4094,
      address: "123 Green St, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "sarah_123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      name: "Downtown Parking Spot",
      description:
        "Covered parking spot in the heart of downtown. 24/7 access, well-lit area.",
      type: "PARKING",
      pricePerHour: 3.5,
      latitude: 37.7749,
      longitude: -122.4194,
      address: "456 Market St, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "sarah_123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mock-3",
      name: "Secure Storage Unit",
      description:
        "Climate-controlled storage space. Great for seasonal items or business inventory.",
      type: "STORAGE",
      pricePerHour: 2.0,
      latitude: 37.7649,
      longitude: -122.4294,
      address: "789 Storage Ave, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "sarah_123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mock-4",
      name: "Sunset Parking",
      description:
        "Easy access parking near Golden Gate Park. Perfect for day trips.",
      type: "PARKING",
      pricePerHour: 4.0,
      latitude: 37.7699,
      longitude: -122.4544,
      address: "321 Sunset Blvd, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "owner_456",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mock-5",
      name: "Community Garden Plot",
      description:
        "Shared garden space with water access. Join our community of urban farmers!",
      type: "GARDEN",
      pricePerHour: 3.0,
      latitude: 37.7599,
      longitude: -122.4144,
      address: "567 Garden Way, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "owner_789",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as Space[];
}
