"use client";

import { Marker } from "react-map-gl/maplibre";
import type { Space } from "./CityMap";
import { Bike, Car, Truck, Package, Leaf } from "lucide-react";

interface SpaceMarkerProps {
  space: Space;
  onClick?: (space: Space) => void;
  isSelected?: boolean;
  isOwned?: boolean;
}

type SpaceType = "PARKING" | "STORAGE" | "GARDEN";
type ParkingType = "SMALL" | "MEDIUM" | "LARGE";

// Colors for parking types
const parkingTypeColors: Record<ParkingType, string> = {
  SMALL: "#EF4444", // red
  MEDIUM: "#3B82F6", // blue
  LARGE: "#EAB308", // yellow
};

// Default type colors (for non-parking or parking without type)
const typeColors: Record<SpaceType, string> = {
  PARKING: "#3B82F6", // blue (default for parking)
  STORAGE: "#F59E0B", // amber/orange
  GARDEN: "#10B981", // green
};

// Purple color for owned spaces
const ownedColor = "#8B5CF6";

// Get the appropriate color for a space
function getSpaceColor(space: Space, isOwned?: boolean): string {
  if (isOwned) return ownedColor;

  if (space.type === "PARKING" && space.parkingType) {
    return parkingTypeColors[space.parkingType];
  }

  return typeColors[space.type];
}

// Get the appropriate icon for a space
function getSpaceIcon(space: Space): React.ReactNode {
  if (space.type === "PARKING") {
    switch (space.parkingType) {
      case "SMALL":
        return <Bike className="w-5 h-5" />;
      case "MEDIUM":
        return <Car className="w-5 h-5" />;
      case "LARGE":
        return <Truck className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />; // Default to car
    }
  }

  if (space.type === "STORAGE") {
    return <Package className="w-5 h-5" />;
  }

  if (space.type === "GARDEN") {
    return <Leaf className="w-5 h-5" />;
  }

  return <Car className="w-5 h-5" />;
}

export function SpaceMarker({
  space,
  onClick,
  isSelected,
  isOwned,
}: SpaceMarkerProps) {
  const color = getSpaceColor(space, isOwned);
  const icon = getSpaceIcon(space);

  return (
    <Marker
      longitude={space.longitude}
      latitude={space.latitude}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick?.(space);
      }}
    >
      <div
        className={`cursor-pointer transition-all duration-200 ${
          isSelected ? "scale-125 z-10" : "hover:scale-110"
        }`}
        title={space.name}
      >
        {/* Pin shape */}
        <div
          className={`relative flex items-center justify-center rounded-full text-white shadow-lg ${
            isSelected ? "w-12 h-12" : "w-10 h-10"
          } ${isOwned ? "ring-4 ring-purple-300" : ""}`}
          style={{ backgroundColor: color }}
        >
          {icon}
          {/* Pulse animation for selected */}
          {isSelected && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
        {/* Pin point */}
        <div
          className="mx-auto w-3 h-3 -mt-1.5 rotate-45"
          style={{ backgroundColor: color }}
        />
        {/* Price tag */}
        <div
          className={`absolute -top-1 -right-1 bg-white rounded-full px-1.5 py-0.5 text-xs font-bold shadow-md ${
            isOwned ? "ring-2 ring-purple-300" : ""
          }`}
          style={{ color }}
        >
          ${space.pricePerDay}/d
        </div>
        {/* "Yours" badge for owned spaces */}
        {isOwned && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            YOURS
          </div>
        )}
      </div>
    </Marker>
  );
}
