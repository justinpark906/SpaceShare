"use client";

import { Marker } from "react-map-gl/maplibre";
import type { Space } from "@/lib/amplify-client";

interface SpaceMarkerProps {
  space: Space;
  onClick?: (space: Space) => void;
}

const typeColors = {
  PARKING: "#3B82F6", // blue
  STORAGE: "#10B981", // green
  GARDEN: "#F59E0B", // amber
};

const typeIcons = {
  PARKING: "P",
  STORAGE: "S",
  GARDEN: "G",
};

type SpaceType = "PARKING" | "STORAGE" | "GARDEN";

export function SpaceMarker({ space, onClick }: SpaceMarkerProps) {
  const spaceType = (space.type || "PARKING") as SpaceType;
  const color = typeColors[spaceType];
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
        className="cursor-pointer transition-transform hover:scale-110"
        title={space.name}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold shadow-lg"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <div
          className="mx-auto h-2 w-2 -mt-1 rotate-45"
          style={{ backgroundColor: color }}
        />
      </div>
    </Marker>
  );
}
