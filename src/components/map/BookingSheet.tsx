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
import { useAuth } from "@/contexts/AuthContext";

interface BookingSheetProps {
  space: Space | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (space: Space, days: number) => void;
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
  const [days, setDays] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const { user } = useAuth();

  if (!space) return null;

  // Check if user is trying to book their own space
  const isOwnSpace = space.isOwned;
  const maxDays = space.maxRentalDays || 30;

  const spaceType = (space.type || "PARKING") as SpaceType;
  const totalPrice = space.pricePerDay * days;
  const platformFee = totalPrice * 0.02;
  const finalTotal = totalPrice + platformFee;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDays(parseInt(e.target.value));
  };

  const handleConfirmBooking = async () => {
    setIsBooking(true);

    try {
      const response = await fetch("/api/pay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: space.id,
          renterId: user?.id || "guest",
          listerId: space.ownerId,
          amount: finalTotal,
          days,
        }),
      });

      if (response.ok) {
        onBook(space, days);
      }
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md px-6 bg-white">
        <SheetHeader className="text-center">
          <SheetTitle className="flex items-center justify-center gap-2 text-gray-900">
            <span className="text-2xl">{typeEmojis[spaceType]}</span>
            {space.name}
          </SheetTitle>
          <SheetDescription className="text-center text-gray-600">
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
            <p className="text-gray-700 text-center text-sm">
              {space.description}
            </p>
          )}

          {/* Duration Slider */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              How many days do you need it?
            </label>

            {/* Current selection display */}
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-gray-900">{days}</span>
              <span className="text-xl text-gray-600 ml-1">
                {days === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="1"
                max={maxDays}
                value={days}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 day</span>
                <span>{maxDays} days max</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 w-full">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                ${space.pricePerDay.toFixed(2)} x {days}{" "}
                {days === 1 ? "day" : "days"}
              </span>
              <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee (2%)</span>
              <span className="text-gray-900">${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-green-600">${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Confirm Button */}
          {isOwnSpace ? (
            <div className="w-full">
              <Button
                className="w-full h-12 text-lg bg-gray-400 cursor-not-allowed"
                disabled
              >
                Cannot Book Your Own Space
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                This is your listing. You cannot book your own space.
              </p>
            </div>
          ) : !user ? (
            <div className="w-full">
              <Button
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                onClick={() => (window.location.href = "/auth")}
              >
                Sign In to Book
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                You need an account to make a booking.
              </p>
            </div>
          ) : (
            <Button
              className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
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
          )}

          {/* Security Note */}
          <p className="text-xs text-gray-500 text-center">
            Secure payment processing. You won't be charged until you arrive.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
