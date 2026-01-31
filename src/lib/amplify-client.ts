"use client";

import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import type { Schema } from "../../amplify/data/resource";

// Check if Amplify is properly configured with GraphQL
export function isAmplifyConfigured(): boolean {
  try {
    const config = Amplify.getConfig();
    return !!config?.API?.GraphQL?.endpoint;
  } catch {
    return false;
  }
}

// Lazy client generation - only create when actually needed
let _client: ReturnType<typeof generateClient<Schema>> | null = null;

export function getClient() {
  if (!isAmplifyConfigured()) {
    throw new Error("Amplify not configured");
  }
  if (!_client) {
    _client = generateClient<Schema>();
  }
  return _client;
}

// Simplified Space type for frontend use (without lazy loaders)
export interface Space {
  id: string;
  name: string;
  description?: string | null;
  type?: "PARKING" | "STORAGE" | "GARDEN" | null;
  pricePerHour: number;
  latitude: number;
  longitude: number;
  address?: string | null;
  status?: "AVAILABLE" | "BOOKED" | "OCCUPIED" | null;
  imageUrl?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  email: string;
  displayName?: string | null;
  userType?: "LISTER" | "RENTER" | null;
  phoneNumber?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  spaceId: string;
  renterId: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status?:
    | "PENDING"
    | "CONFIRMED"
    | "ACTIVE"
    | "COMPLETED"
    | "CANCELLED"
    | null;
  createdAt: string;
  updatedAt: string;
}
