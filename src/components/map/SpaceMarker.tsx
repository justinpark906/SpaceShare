"use client";

import { Marker } from "react-map-gl/maplibre";
import type { Space } from "./CityMap";

interface SpaceMarkerProps {
  space: Space;
  onClick?: (space: Space) => void;
  isSelected?: boolean;
  isOwned?: boolean;
}

type SpaceType = "PARKING" | "STORAGE" | "GARDEN";

const typeColors = {
  PARKING: "#3B82F6", // blue
  STORAGE: "#10B981", // green
  GARDEN: "#F59E0B", // amber
};

// Purple color for owned spaces
const ownedColor = "#8B5CF6";

// Custom SVG icons for each space type
const typeIcons = {
  PARKING: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M13 3H6v18h4v-6h3c3.31 0 6-2.69 6-6s-2.69-6-6-6zm.2 8H10V7h3.2c1.1 0 2 .9 2 2s-.9 2-2 2z" />
    </svg>
  ),
  STORAGE: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z" />
    </svg>
  ),
  GARDEN: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  ),
};

export function SpaceMarker({
  space,
  onClick,
  isSelected,
  isOwned,
}: SpaceMarkerProps) {
  const spaceType = (space.type || "PARKING") as SpaceType;
  // Use purple for owned spaces, otherwise use type color
  const color = isOwned ? ownedColor : typeColors[spaceType];
  const icon = typeIcons[spaceType];

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
          ${space.pricePerHour}
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
