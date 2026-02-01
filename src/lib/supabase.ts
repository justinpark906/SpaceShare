import { createBrowserClient } from "@supabase/ssr";

// Supabase client for browser/client components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Types for our database
export interface DbSpace {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  name: string;
  description: string | null;
  type: "PARKING" | "STORAGE" | "GARDEN";
  price_per_hour: number;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  status: "AVAILABLE" | "BOOKED" | "INACTIVE";
  image_url: string | null;
  // Dimensions
  width_ft: number | null;
  length_ft: number | null;
  height_ft: number | null;
  // Additional details
  amenities: string[] | null;
  availability_hours: string | null; // JSON string for availability schedule
  instructions: string | null;
}

export interface DbUser {
  id: string;
  created_at: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

// Helper type for creating a new space
export type CreateSpaceInput = Omit<DbSpace, "id" | "created_at" | "updated_at" | "owner_id">;
