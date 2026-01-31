"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

// Generate a typed client for Amplify Data operations
export const client = generateClient<Schema>();

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
