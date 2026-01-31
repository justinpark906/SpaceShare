"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { SpaceMarker } from "./SpaceMarker";
import { SpaceCard } from "./SpaceCard";
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

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={{
          longitude: DEFAULT_CENTER.longitude,
          latitude: DEFAULT_CENTER.latitude,
          zoom: 12,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        onClick={() => setSelectedSpace(null)}
      >
        <NavigationControl position="top-right" />

        {spaces.map((space) => (
          <SpaceMarker
            key={space.id}
            space={space}
            onClick={setSelectedSpace}
          />
        ))}
      </Map>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
          <span className="text-sm text-gray-600">Loading spaces...</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Space count */}
      {!loading && !error && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-md">
          <span className="text-sm text-gray-600">
            {spaces.length} space{spaces.length !== 1 ? "s" : ""} available
          </span>
        </div>
      )}

      {/* Selected space card */}
      {selectedSpace && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
          <SpaceCard
            space={selectedSpace}
            onClose={() => setSelectedSpace(null)}
          />
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md hidden md:block">
        <div className="text-xs font-medium text-gray-700 mb-2">
          Space Types
        </div>
        <div className="flex flex-col gap-1">
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
    </div>
  );
}

// Mock data for development before Amplify sandbox is running
function getMockSpaces(): Space[] {
  return [
    {
      id: "mock-1",
      name: "Sarah's Garden",
      description: "Beautiful backyard garden available for urban farming",
      type: "GARDEN",
      pricePerHour: 5.0,
      latitude: 37.7849,
      longitude: -122.4094,
      address: "123 Green St, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "owner-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      name: "Downtown Parking Spot",
      description: "Covered parking in downtown area",
      type: "PARKING",
      pricePerHour: 3.5,
      latitude: 37.7749,
      longitude: -122.4194,
      address: "456 Market St, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "owner-2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "mock-3",
      name: "Secure Storage Unit",
      description: "Climate-controlled storage space",
      type: "STORAGE",
      pricePerHour: 2.0,
      latitude: 37.7649,
      longitude: -122.4294,
      address: "789 Storage Ave, San Francisco",
      status: "AVAILABLE",
      imageUrl: null,
      ownerId: "owner-3",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as Space[];
}
