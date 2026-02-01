"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, MapPin, Calendar, DollarSign } from "lucide-react";
import type { Space } from "./CityMap";

interface BookingConfirmationProps {
  space: Space;
  days: number;
  totalPrice: number;
  onClose: () => void;
  onViewDashboard: () => void;
}

export function BookingConfirmation({
  space,
  days,
  totalPrice,
  onClose,
  onViewDashboard,
}: BookingConfirmationProps) {
  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-white">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Booking Confirmed!</h2>
          <p className="text-gray-600 mt-1">Your space has been reserved</p>
        </div>

        {/* Booking Details */}
        <div className="space-y-4 mb-6">
          {/* Space Name */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">{space.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{space.address}</span>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(startDate)} - {formatDate(endDate)}
              </p>
              <p className="text-xs text-gray-600">
                {days} {days === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Total Paid</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onViewDashboard}
          >
            View My Bookings
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Continue Browsing
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can view all booking details and get directions from your dashboard.
        </p>
      </Card>
    </div>
  );
}
