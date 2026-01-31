'use client';

import { useState, useEffect } from 'react';
import { getClient, isAmplifyConfigured } from '@/lib/amplify-client';

interface GateStatusProps {
  spaceId: string;
  spaceName: string;
  onClose: () => void;
}

export function GateStatus({ spaceId, spaceName, onClose }: GateStatusProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [countdown, setCountdown] = useState(10);

  // Poll for unlock status every 2 seconds
  useEffect(() => {
    if (!isPolling) return;

    const pollStatus = async () => {
      if (!isAmplifyConfigured()) {
        // Demo mode - simulate unlock after 5 seconds
        return;
      }

      try {
        const client = getClient();
        const { data } = await client.models.Space.get({ id: spaceId });
        if (data?.isUnlocked) {
          setIsUnlocked(true);
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error polling space status:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [spaceId, isPolling]);

  // Auto-lock countdown
  useEffect(() => {
    if (!isUnlocked) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsUnlocked(false);
          setIsPolling(true);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnlocked]);

  // Demo: Simulate unlock after button press
  const simulateUnlock = () => {
    setIsUnlocked(true);
    setIsPolling(false);
    setCountdown(10);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-2">{spaceName}</h2>

        {!isUnlocked ? (
          <>
            {/* Waiting State */}
            <div className="my-8">
              <div className="relative w-32 h-32 mx-auto">
                {/* Lock icon */}
                <svg
                  className="w-full h-full text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                {/* Pulsing ring */}
                <div className="absolute inset-0 animate-ping opacity-20">
                  <div className="w-full h-full rounded-full border-4 border-blue-500" />
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Waiting for you to arrive at the location...
            </p>
            <p className="text-sm text-gray-400 mb-6">
              The gate will unlock automatically when your phone enters the geofence
            </p>

            {/* Demo button for testing */}
            <button
              onClick={simulateUnlock}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Simulate Arrival (Demo)
            </button>
          </>
        ) : (
          <>
            {/* Unlocked State */}
            <div className="my-8">
              <div className="relative w-32 h-32 mx-auto">
                {/* Animated unlock icon */}
                <svg
                  className="w-full h-full text-green-500 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                {/* Success ring */}
                <div className="absolute inset-0">
                  <div className="w-full h-full rounded-full border-4 border-green-500 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="bg-green-100 border border-green-300 rounded-xl p-4 mb-4">
              <p className="text-2xl font-bold text-green-700">GATE OPENED!</p>
              <p className="text-green-600">Please drive through now</p>
            </div>

            <div className="text-sm text-gray-500">
              Auto-locking in <span className="font-bold text-orange-600">{countdown}</span> seconds
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-1000"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
