"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Space } from "./CityMap";

interface BookingSheetProps {
  space: Space | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (space: Space, hours: number) => void;
}

type SpaceType = "PARKING" | "STORAGE" | "GARDEN";

const typeLabels = {
  PARKING: "Parking Spot",
  STORAGE: "Storage Space",
  GARDEN: "Garden Plot",
};

const typeEmojis = {
  PARKING: "🚗",
  STORAGE: "📦",
  GARDEN: "🌱",
};

export function BookingSheet({
  space,
  isOpen,
  onClose,
  onBook,
}: BookingSheetProps) {
  const [hours, setHours] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  if (!space) return null;

  const spaceType = (space.type || "PARKING") as SpaceType;
  const totalPrice = space.pricePerHour * hours;
  const platformFee = totalPrice * 0.02;
  const finalTotal = totalPrice + platformFee;

  const handleConfirmBooking = async () => {
    setIsBooking(true);

    try {
      // Call the payment initiation API
      const response = await fetch("/api/pay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: space.id,
          renterId: "marcus_demo", // Demo user
          listerId: space.ownerId,
          amount: finalTotal,
          hours,
        }),
      });

      if (response.ok) {
        onBook(space, hours);
      }
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md px-6">
        <SheetHeader className="text-center">
          <SheetTitle className="flex items-center justify-center gap-2">
            <span className="text-2xl">{typeEmojis[spaceType]}</span>
            {space.name}
          </SheetTitle>
          <SheetDescription className="text-center">
            {space.address || "Location available"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 flex flex-col items-center w-full">
          {/* Space Type Badge */}
          <div className="flex items-center gap-2 justify-center">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {typeLabels[spaceType]}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Available Now
            </span>
          </div>

          {/* Description */}
          {space.description && (
            <p className="text-gray-600 text-center">{space.description}</p>
          )}

          {/* Duration Selector */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              How long do you need it?
            </label>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHours(Math.max(1, hours - 1))}
                disabled={hours <= 1}
              >
                -
              </Button>
              <span className="text-2xl font-bold w-16 text-center">
                {hours}h
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHours(Math.min(24, hours + 1))}
                disabled={hours >= 24}
              >
                +
              </Button>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 w-full">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                ${space.pricePerHour.toFixed(2)} x {hours} hour
                {hours > 1 ? "s" : ""}
              </span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">City Improvement Fee (2%)</span>
              <span>${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-green-600">${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Owner Info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg w-full">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
              S
            </div>
            <div>
              <p className="font-medium text-sm">Hosted by Sarah</p>
              <p className="text-xs text-gray-500">⭐ 4.9 (127 reviews)</p>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            className="w-full h-12 text-lg"
            onClick={handleConfirmBooking}
            disabled={isBooking}
          >
            {isBooking ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                Processing...
              </span>
            ) : (
              `Confirm Booking - $${finalTotal.toFixed(2)}`
            )}
          </Button>

          {/* Security Note */}
          <p className="text-xs text-gray-500 text-center">
            🔒 Payment secured by Visa Direct. You won't be charged until you
            arrive.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
