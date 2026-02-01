"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Map, { NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { SpaceMarker } from "./SpaceMarker";
import { BookingSheet } from "./BookingSheet";
import { ActiveSession } from "./ActiveSession";
import { createClient, DbSpace } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// Default center (United States)
const DEFAULT_CENTER = {
  longitude: -98.5795,
  latitude: 39.8283,
};

// Map style - using Carto's Voyager for Google Maps-like appearance
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// Simplified Space type for the map
export interface Space {
  id: string;
  name: string;
  description: string | null;
  type: "PARKING" | "STORAGE" | "GARDEN";
  pricePerHour: number;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  imageUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isOwned?: boolean; // Whether current user owns this space
}

interface CityMapProps {
  initialCenter?: { lat: number; lng: number; zoom: number } | null;
}

export function CityMap({ initialCenter }: CityMapProps) {
  const mapRef = useRef<MapRef>(null);
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customMapStyle, setCustomMapStyle] = useState<any>(null);

  // Use default Voyager style without customization
  useEffect(() => {
    setCustomMapStyle(MAP_STYLE);
  }, []);

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
      const supabase = createClient();

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.log("Supabase not configured, using mock data");
        setSpaces(getMockSpaces(user?.id));
        setError(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("spaces")
        .select("*")
        .eq("status", "AVAILABLE");

      if (fetchError) {
        console.error("Error fetching spaces:", fetchError);
        // Fall back to mock data
        setSpaces(getMockSpaces(user?.id));
        setError(null);
        return;
      }

      // Map Supabase data to our Space type
      const mappedSpaces: Space[] = (data || []).map((item: DbSpace) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        pricePerHour: item.price_per_hour,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        status: item.status,
        imageUrl: item.image_url,
        ownerId: item.owner_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        isOwned: user?.id === item.owner_id,
      }));

      // If we have data from Supabase, use it; otherwise fall back to mock
      if (mappedSpaces.length > 0) {
        setSpaces(mappedSpaces);
      } else {
        // Mix mock data with any real data for demo
        setSpaces(getMockSpaces(user?.id));
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching spaces:", err);
      // For demo purposes, show mock data if Supabase isn't configured
      setSpaces(getMockSpaces(user?.id));
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // Fly to searched city when initialCenter changes
  useEffect(() => {
    if (initialCenter && mapRef.current) {
      mapRef.current.flyTo({
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialCenter.zoom,
        duration: 2000,
      });
    }
  }, [initialCenter]);

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

  // Customize map colors on load to match Google Maps dark mode
  const handleMapLoad = useCallback((event: any) => {
    // Map loaded successfully - no need to override styles
  }, []);

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER.longitude,
          latitude: DEFAULT_CENTER.latitude,
          zoom: 4,
          pitch: 0,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={customMapStyle || MAP_STYLE}
        maxZoom={18}
        minZoom={2}
        projection={{ type: "globe" } as any}
        onLoad={handleMapLoad}
        onClick={() => {
          if (!activeSession) {
            setSelectedSpace(null);
            setShowBookingSheet(false);
          }
        }}
      >
        <NavigationControl position="top-right" style={{ marginTop: "5rem" }} />

        {spaces.map((space) => (
          <SpaceMarker
            key={space.id}
            space={space}
            onClick={handleMarkerClick}
            isSelected={selectedSpace?.id === space.id}
            isOwned={space.isOwned}
          />
        ))}
      </Map>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-20 left-4 bg-white px-4 py-2 rounded-lg shadow-md">
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
        <div className="absolute top-20 left-4 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Space count & Legend */}
      {!loading && !error && !activeSession && (
        <div className="absolute top-20 left-4 bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm font-medium text-gray-900 mb-3">
            {spaces.length} space{spaces.length !== 1 ? "s" : ""} available
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600">Parking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">Garden</span>
            </div>
            {user && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <div className="h-4 w-4 rounded-full bg-purple-500 ring-2 ring-purple-300" />
                <span className="text-xs text-gray-600">Your spaces</span>
              </div>
            )}
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

// Mock data for development
function getMockSpaces(currentUserId?: string): Space[] {
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
      isOwned: false,
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
      isOwned: false,
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
      isOwned: false,
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
      isOwned: false,
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
      isOwned: false,
    },
  ];
}
