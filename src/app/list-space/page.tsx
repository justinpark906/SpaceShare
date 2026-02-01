"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Car,
  Package,
  Flower2,
  MapPin,
  DollarSign,
  Ruler,
  FileText,
  Check,
} from "lucide-react";

const SPACE_TYPES = [
  { id: "PARKING", label: "Parking", icon: Car, description: "Driveways, garages, parking spots" },
  { id: "STORAGE", label: "Storage", icon: Package, description: "Basements, sheds, spare rooms" },
  { id: "GARDEN", label: "Garden", icon: Flower2, description: "Backyards, plots, green spaces" },
] as const;

// City coordinates for geocoding
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "new york": { lat: 40.7128, lng: -74.006 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  "chicago": { lat: 41.8781, lng: -87.6298 },
  "houston": { lat: 29.7604, lng: -95.3698 },
  "phoenix": { lat: 33.4484, lng: -112.074 },
  "philadelphia": { lat: 39.9526, lng: -75.1652 },
  "san antonio": { lat: 29.4241, lng: -98.4936 },
  "san diego": { lat: 32.7157, lng: -117.1611 },
  "dallas": { lat: 32.7767, lng: -96.797 },
  "san jose": { lat: 37.3382, lng: -121.8863 },
  "austin": { lat: 30.2672, lng: -97.7431 },
  "jacksonville": { lat: 30.3322, lng: -81.6557 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "seattle": { lat: 47.6062, lng: -122.3321 },
  "denver": { lat: 39.7392, lng: -104.9903 },
  "boston": { lat: 42.3601, lng: -71.0589 },
  "nashville": { lat: 36.1627, lng: -86.7816 },
  "detroit": { lat: 42.3314, lng: -83.0458 },
  "portland": { lat: 45.5152, lng: -122.6784 },
  "las vegas": { lat: 36.1699, lng: -115.1398 },
  "miami": { lat: 25.7617, lng: -80.1918 },
  "atlanta": { lat: 33.749, lng: -84.388 },
  "providence": { lat: 41.824, lng: -71.4128 },
  "minneapolis": { lat: 44.9778, lng: -93.265 },
  "cleveland": { lat: 41.4993, lng: -81.6944 },
  "orlando": { lat: 28.5383, lng: -81.3792 },
  "sacramento": { lat: 38.5816, lng: -121.4944 },
  "pittsburgh": { lat: 40.4406, lng: -79.9959 },
  "charlotte": { lat: 35.2271, lng: -80.8431 },
  "salt lake city": { lat: 40.7608, lng: -111.891 },
};

export default function ListSpacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [spaceType, setSpaceType] = useState<"PARKING" | "STORAGE" | "GARDEN" | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [widthFt, setWidthFt] = useState("");
  const [lengthFt, setLengthFt] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [instructions, setInstructions] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setLoading(true);

    try {
      // Get coordinates from city
      const cityLower = city.toLowerCase().trim();
      const coords = CITY_COORDS[cityLower];

      if (!coords) {
        setError("City not found. Please enter a major US city.");
        setLoading(false);
        return;
      }

      // Add small random offset to coordinates so spaces don't stack
      const latOffset = (Math.random() - 0.5) * 0.02;
      const lngOffset = (Math.random() - 0.5) * 0.02;

      const { error: insertError } = await supabase.from("spaces").insert({
        owner_id: user.id,
        name,
        description: description || null,
        type: spaceType,
        price_per_hour: parseFloat(pricePerHour),
        latitude: coords.lat + latOffset,
        longitude: coords.lng + lngOffset,
        address,
        city: city.trim(),
        status: "AVAILABLE",
        width_ft: widthFt ? parseFloat(widthFt) : null,
        length_ft: lengthFt ? parseFloat(lengthFt) : null,
        height_ft: heightFt ? parseFloat(heightFt) : null,
        instructions: instructions || null,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        setError(insertError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Space Listed!</h2>
          <p className="text-gray-600">Your space is now visible on the map.</p>
          <p className="text-gray-500 text-sm mt-2">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white font-bold text-lg">
            S
          </div>
          <span className="text-2xl font-bold text-gray-900">SpaceShare</span>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Space</h1>
          <p className="text-gray-600">
            Turn your unused space into income. It only takes a few minutes.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? "bg-green-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Step 1: Space Type */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  What type of space do you have?
                </h2>
                <div className="grid gap-4">
                  {SPACE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSpaceType(type.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          spaceType === type.id
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            spaceType === type.id
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.label}</p>
                          <p className="text-sm text-gray-500">{type.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!spaceType}
                  className="w-full py-6 bg-green-600 hover:bg-green-700"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Location & Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Tell us about your space
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Name
                    </label>
                    <Input
                      placeholder="e.g., Sunny Backyard Garden"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="py-6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe your space - what makes it special?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        City
                      </label>
                      <Input
                        placeholder="e.g., San Francisco"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="py-6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <Input
                        placeholder="e.g., 123 Main St"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="py-6"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Price per Hour ($)
                    </label>
                    <Input
                      type="number"
                      step="0.50"
                      min="0.50"
                      placeholder="e.g., 5.00"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      required
                      className="py-6"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 py-6"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!name || !city || !address || !pricePerHour}
                    className="flex-1 py-6 bg-green-600 hover:bg-green-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Dimensions & Final */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Final details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Ruler className="inline h-4 w-4 mr-1" />
                      Dimensions (optional)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Width (ft)"
                          value={widthFt}
                          onChange={(e) => setWidthFt(e.target.value)}
                          className="py-6"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Length (ft)"
                          value={lengthFt}
                          onChange={(e) => setLengthFt(e.target.value)}
                          className="py-6"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Height (ft)"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          className="py-6"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="inline h-4 w-4 mr-1" />
                      Access Instructions (optional)
                    </label>
                    <textarea
                      placeholder="How should renters access your space? Any codes, keys, or special instructions?"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                    {error}
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Type:</span>{" "}
                      {SPACE_TYPES.find((t) => t.id === spaceType)?.label}
                    </p>
                    <p>
                      <span className="font-medium">Name:</span> {name}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span> {address}, {city}
                    </p>
                    <p>
                      <span className="font-medium">Price:</span> ${pricePerHour}/hour
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1 py-6"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-6 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Creating..." : "List My Space"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-center">
          <div className="p-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Free to List</p>
            <p className="text-xs text-gray-500">No upfront costs</p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">You Set the Price</p>
            <p className="text-xs text-gray-500">Full control over rates</p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Instant Visibility</p>
            <p className="text-xs text-gray-500">Show on map immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
}
