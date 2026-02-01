"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Space } from "./CityMap";

interface ActiveSessionProps {
  space: Space;
  days: number;
  onEndSession: () => void;
  transactionId?: string;
}

type SessionPhase =
  | "navigating"
  | "arriving"
  | "unlocking"
  | "active"
  | "ending";

export function ActiveSession({
  space,
  days,
  onEndSession,
  transactionId,
}: ActiveSessionProps) {
  // Convert days to hours for the timer display (simplified demo)
  const hours = days;
  const [phase, setPhase] = useState<SessionPhase>("navigating");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Poll for unlock status (the "hack" shortcut)
  useEffect(() => {
    if (phase !== "arriving" && phase !== "unlocking") return;

    const pollInterval = setInterval(async () => {
      try {
        // In production, poll DynamoDB for space.isUnlocked
        // For demo, we'll check a mock endpoint or use simulation
        const response = await fetch(`/api/space/${space.id}/status`).catch(
          () => null,
        );
        if (response?.ok) {
          const data = await response.json();
          if (data.isUnlocked) {
            setIsUnlocked(true);
            setPhase("active");
          }
        }
      } catch (error) {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [phase, space.id]);

  // Timer for active session
  useEffect(() => {
    if (phase !== "active") return;

    const timer = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [phase]);

  // Simulate arrival for demo
  const simulateArrival = () => {
    setPhase("arriving");
    setTimeout(() => {
      setPhase("unlocking");
      setTimeout(() => {
        setIsUnlocked(true);
        setPhase("active");
      }, 2000);
    }, 1500);
  };

  // End session
  const handleEndSession = async () => {
    setPhase("ending");

    try {
      // Trigger disbursement
      await fetch("/api/pay/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
    } catch (error) {
      console.error("Disbursement error:", error);
    }

    setTimeout(() => {
      onEndSession();
    }, 2000);
  };

  const totalCost = space.pricePerDay * days;
  const remainingMinutes = hours * 60 - elapsedMinutes;

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold">Active Session</h2>
          <p className="text-gray-600">{space.name}</p>
        </div>

        {/* Status Display */}
        <div className="flex justify-center">
          {phase === "navigating" && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Navigate to Location</p>
                <p className="text-sm text-gray-500">
                  The gate will unlock when you arrive
                </p>
              </div>
              <Button onClick={simulateArrival} className="w-full">
                Simulate Arrival (Demo)
              </Button>
            </div>
          )}

          {phase === "arriving" && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-12 h-12 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Detecting Location...</p>
                <p className="text-sm text-gray-500">Please wait</p>
              </div>
            </div>
          )}

          {phase === "unlocking" && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-orange-600 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-orange-600">Unlocking Gate...</p>
                <p className="text-sm text-gray-500">
                  Sending signal to bollard
                </p>
              </div>
            </div>
          )}

          {phase === "active" && (
            <div className="text-center space-y-4 w-full">
              <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">Gate Open!</p>
                <p className="text-sm text-gray-500">Welcome to {space.name}</p>
              </div>

              {/* Session Timer */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Time Remaining</span>
                  <span className="font-mono font-bold text-lg">
                    {Math.floor(remainingMinutes / 60)}:
                    {(remainingMinutes % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(remainingMinutes / (hours * 60)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Cost so far */}
              <div className="flex justify-between text-sm p-3 bg-blue-50 rounded-lg">
                <span>Session Cost</span>
                <span className="font-bold">${totalCost.toFixed(2)}</span>
              </div>

              {/* End Session Button */}
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleEndSession}
              >
                End Session & Pay
              </Button>
            </div>
          )}

          {phase === "ending" && (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-purple-600 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-purple-600">
                  Processing Payment...
                </p>
                <p className="text-sm text-gray-500">
                  Sending ${totalCost.toFixed(2)} via Visa Direct
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {phase === "active" && (
          <div className="text-center text-xs text-gray-500">
            <p>Gate will auto-lock when you leave the geofence area</p>
          </div>
        )}
      </Card>
    </div>
  );
}
