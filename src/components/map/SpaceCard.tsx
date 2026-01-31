"use client";

import type { Space } from "@/lib/amplify-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SpaceCardProps {
  space: Space;
  onClose?: () => void;
}

const typeLabels = {
  PARKING: "Parking Spot",
  STORAGE: "Storage Space",
  GARDEN: "Garden Plot",
};

const typeBadgeColors = {
  PARKING: "bg-blue-100 text-blue-800",
  STORAGE: "bg-green-100 text-green-800",
  GARDEN: "bg-amber-100 text-amber-800",
};

type SpaceType = "PARKING" | "STORAGE" | "GARDEN";

export function SpaceCard({ space, onClose }: SpaceCardProps) {
  const spaceType = (space.type || "PARKING") as SpaceType;
  const typeLabel = typeLabels[spaceType];
  const badgeColor = typeBadgeColors[spaceType];

  return (
    <Card className="shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{space.name}</CardTitle>
            <CardDescription className="mt-1">
              {space.address || "Address not provided"}
            </CardDescription>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}
          >
            {typeLabel}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {space.status}
          </span>
        </div>

        {space.description && (
          <p className="text-sm text-gray-600 mb-3">{space.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${space.pricePerHour.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">/hour</span>
          </div>
          <Button>Book Now</Button>
        </div>
      </CardContent>
    </Card>
  );
}
