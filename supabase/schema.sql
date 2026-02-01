-- SpaceShare Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT
);

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('PARKING', 'STORAGE', 'GARDEN')),
  price_per_hour DECIMAL(10, 2) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'INACTIVE')),
  image_url TEXT,
  -- Dimensions in feet
  width_ft DECIMAL(10, 2),
  length_ft DECIMAL(10, 2),
  height_ft DECIMAL(10, 2),
  -- Additional details
  amenities TEXT[],
  availability_hours JSONB,
  instructions TEXT
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE NOT NULL,
  renter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS spaces_owner_id_idx ON spaces(owner_id);
CREATE INDEX IF NOT EXISTS spaces_city_idx ON spaces(city);
CREATE INDEX IF NOT EXISTS spaces_type_idx ON spaces(type);
CREATE INDEX IF NOT EXISTS spaces_status_idx ON spaces(status);
CREATE INDEX IF NOT EXISTS spaces_location_idx ON spaces(latitude, longitude);
CREATE INDEX IF NOT EXISTS bookings_space_id_idx ON bookings(space_id);
CREATE INDEX IF NOT EXISTS bookings_renter_id_idx ON bookings(renter_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies (DROP IF EXISTS for idempotent re-runs)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Spaces policies
DROP POLICY IF EXISTS "Spaces are viewable by everyone" ON spaces;
CREATE POLICY "Spaces are viewable by everyone" ON spaces
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own spaces" ON spaces;
CREATE POLICY "Users can create their own spaces" ON spaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own spaces" ON spaces;
CREATE POLICY "Users can update their own spaces" ON spaces
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own spaces" ON spaces;
CREATE POLICY "Users can delete their own spaces" ON spaces
  FOR DELETE USING (auth.uid() = owner_id);

-- Bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = renter_id OR auth.uid() IN (
    SELECT owner_id FROM spaces WHERE spaces.id = bookings.space_id
  ));

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = renter_id);

-- Function to handle new user signup
-- Must use public.profiles explicitly + SET search_path for Supabase auth trigger context
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@placeholder.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Grant auth service permission to execute the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (DROP IF EXISTS for idempotent re-runs)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spaces_updated_at ON spaces;
CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
