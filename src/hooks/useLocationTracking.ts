"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LocationTrackingState {
  isTracking: boolean;
  lastPosition: { latitude: number; longitude: number } | null;
  error: string | null;
  permissionStatus: "granted" | "denied" | "prompt" | "unknown";
}

/**
 * Hook for tracking user location and sending updates to AWS Location Service
 * Used when user has an active booking to enable geofence detection
 */
export function useLocationTracking(enabled: boolean = false) {
  const { user } = useAuth();
  const [state, setState] = useState<LocationTrackingState>({
    isTracking: false,
    lastPosition: null,
    error: null,
    permissionStatus: "unknown",
  });

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Send position to backend
  const sendPositionUpdate = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        console.warn("Position update failed:", response.status);
      }
    } catch (error) {
      console.error("Failed to send position update:", error);
    }
  }, []);

  // Handle position update from geolocation API
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;

    setState(prev => ({
      ...prev,
      lastPosition: { latitude, longitude },
      error: null,
    }));

    // Send to AWS Location Service
    sendPositionUpdate(latitude, longitude);
  }, [sendPositionUpdate]);

  // Handle geolocation error
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "Location access failed";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied";
        setState(prev => ({ ...prev, permissionStatus: "denied" }));
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isTracking: false,
    }));
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation not supported",
        isTracking: false,
      }));
      return;
    }

    // Check permission
    navigator.permissions?.query({ name: "geolocation" }).then((result) => {
      setState(prev => ({
        ...prev,
        permissionStatus: result.state as "granted" | "denied" | "prompt",
      }));
    });

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Cache position for 30 seconds
      }
    );

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    // Also set up interval for periodic updates (every 30 seconds)
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        handlePositionError,
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }, 30000);
  }, [handlePositionUpdate, handlePositionError]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Effect to start/stop tracking based on enabled prop
  useEffect(() => {
    if (enabled && user) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, user, startTracking, stopTracking]);

  // Request permission manually
  const requestPermission = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState(prev => ({ ...prev, permissionStatus: "granted" }));
        handlePositionUpdate(position);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState(prev => ({ ...prev, permissionStatus: "denied" }));
        }
      }
    );
  }, [handlePositionUpdate]);

  return {
    ...state,
    startTracking,
    stopTracking,
    requestPermission,
  };
}
