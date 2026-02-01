"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Plus,
  Package,
  Car,
  Flower2,
  ChevronRight,
  User,
} from "lucide-react";

interface Booking {
  id: string;
  space_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
  status: string;
  space: {
    name: string;
    type: string;
    address: string;
    city: string;
    price_per_day: number;
  } | null;
  owner?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface Space {
  id: string;
  name: string;
  type: string;
  price_per_day: number;
  address: string;
  city: string;
  status: string;
  max_rental_days: number;
  created_at: string;
  bookings: {
    id: string;
    start_date: string;
    end_date: string;
    total_days: number;
    total_price: number;
    status: string;
    renter: {
      full_name: string | null;
      email: string;
    } | null;
  }[];
}

const typeIcons: Record<string, React.ReactNode> = {
  PARKING: <Car className="h-5 w-5" />,
  STORAGE: <Package className="h-5 w-5" />,
  GARDEN: <Flower2 className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  PARKING: "bg-blue-100 text-blue-700",
  STORAGE: "bg-amber-100 text-amber-700",
  GARDEN: "bg-green-100 text-green-700",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [myListings, setMyListings] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "listings">(
    "bookings",
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }

    async function fetchData() {
      if (!user) return;
      const supabase = createClient();

      try {
        // Fetch bookings where I am the renter
        const { data: bookings } = await supabase
          .from("bookings")
          .select(
            `
            id,
            space_id,
            start_date,
            end_date,
            total_days,
            total_price,
            status,
            space:spaces (
              name,
              type,
              address,
              city,
              price_per_day,
              owner_id
            )
          `,
          )
          .eq("renter_id", user.id)
          .order("created_at", { ascending: false });

        // Map bookings data - Supabase returns single objects for relations, not arrays
        const mappedBookings: Booking[] = (bookings || []).map((b: any) => ({
          ...b,
          space: Array.isArray(b.space) ? b.space[0] : b.space,
        }));
        setMyBookings(mappedBookings);

        // Fetch spaces I own with their bookings
        const { data: spaces } = await supabase
          .from("spaces")
          .select(
            `
            id,
            name,
            type,
            price_per_day,
            address,
            city,
            status,
            max_rental_days,
            created_at,
            bookings (
              id,
              start_date,
              end_date,
              total_days,
              total_price,
              status,
              renter:profiles!renter_id (
                full_name,
                email
              )
            )
          `,
          )
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        // Map spaces data - handle nested relations
        const mappedSpaces: Space[] = (spaces || []).map((s: any) => ({
          ...s,
          bookings: (s.bookings || []).map((b: any) => ({
            ...b,
            renter: Array.isArray(b.renter) ? b.renter[0] : b.renter,
          })),
        }));
        setMyListings(mappedSpaces);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const activeBookings = myBookings.filter(
    (b) => b.status === "ACTIVE" || b.status === "CONFIRMED",
  );
  const totalEarnings = myListings.reduce((sum, listing) => {
    return (
      sum +
      listing.bookings
        .filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE")
        .reduce((s, b) => s + b.total_price, 0)
    );
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-green-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold">
              S
            </div>
            <span className="text-xl font-semibold text-white">SpaceShare</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage your bookings and listings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">Active Bookings</p>
              <p className="text-2xl font-bold text-white">
                {activeBookings.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">My Listings</p>
              <p className="text-2xl font-bold text-white">
                {myListings.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-green-500">
                ${totalEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-gray-400 text-sm">Active Renters</p>
              <p className="text-2xl font-bold text-white">
                {myListings.reduce(
                  (sum, l) =>
                    sum +
                    l.bookings.filter((b) => b.status === "ACTIVE").length,
                  0,
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "bookings" ? "default" : "outline"}
            onClick={() => setActiveTab("bookings")}
            className={
              activeTab === "bookings"
                ? "bg-green-600 hover:bg-green-700"
                : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }
          >
            My Bookings ({myBookings.length})
          </Button>
          <Button
            variant={activeTab === "listings" ? "default" : "outline"}
            onClick={() => setActiveTab("listings")}
            className={
              activeTab === "listings"
                ? "bg-green-600 hover:bg-green-700"
                : "border-gray-700 text-gray-300 hover:bg-gray-800"
            }
          >
            My Listings ({myListings.length})
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "bookings" ? (
          <BookingsSection bookings={myBookings} />
        ) : (
          <ListingsSection listings={myListings} />
        )}
      </main>
    </div>
  );
}

function BookingsSection({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No bookings yet
          </h3>
          <p className="text-gray-400 mb-6">
            Find a space on the map and make your first booking!
          </p>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700">
              Explore Spaces
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Separate active and past bookings
  const activeBookings = bookings.filter(
    (b) =>
      b.status === "ACTIVE" ||
      b.status === "CONFIRMED" ||
      b.status === "PENDING",
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED",
  );

  return (
    <div className="space-y-6">
      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Active Bookings
          </h2>
          <div className="space-y-4">
            {activeBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} isActive />
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-400 mb-4">
            Past Bookings
          </h2>
          <div className="space-y-4">
            {pastBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                isActive={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  isActive,
}: {
  booking: Booking;
  isActive: boolean;
}) {
  const space = booking.space;
  const daysRemaining = getDaysRemaining(booking.end_date);

  return (
    <Card
      className={`${isActive ? "bg-gray-800/50" : "bg-gray-800/30"} border-gray-700`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {/* Type Icon */}
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                typeColors[space?.type || "PARKING"]
              }`}
            >
              {typeIcons[space?.type || "PARKING"]}
            </div>

            {/* Details */}
            <div>
              <h3 className="font-semibold text-white">
                {space?.name || "Space"}
              </h3>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {space?.address}, {space?.city}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-400">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {formatDate(booking.start_date)} -{" "}
                  {formatDate(booking.end_date)}
                </span>
                <span className="text-gray-400">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {booking.total_days} days
                </span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="text-right">
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[booking.status]
              }`}
            >
              {booking.status}
            </span>
            <p className="text-xl font-bold text-white mt-2">
              ${booking.total_price.toFixed(2)}
            </p>
            {isActive && daysRemaining > 0 && (
              <p className="text-sm text-green-500 mt-1">
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListingsSection({ listings }: { listings: Space[] }) {
  if (listings.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No listings yet
          </h3>
          <p className="text-gray-400 mb-6">
            Start earning by listing your unused space!
          </p>
          <Link href="/list-space">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              List Your Space
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Listing Button */}
      <div className="flex justify-end">
        <Link href="/list-space">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Listing
          </Button>
        </Link>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Space }) {
  const activeBookings = listing.bookings.filter(
    (b) => b.status === "ACTIVE" || b.status === "CONFIRMED",
  );
  const totalEarned = listing.bookings
    .filter((b) => b.status === "COMPLETED" || b.status === "ACTIVE")
    .reduce((sum, b) => sum + b.total_price, 0);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {/* Type Icon */}
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                typeColors[listing.type]
              }`}
            >
              {typeIcons[listing.type]}
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{listing.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    listing.status === "AVAILABLE"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {listing.status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {listing.address}, {listing.city}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-400">
                  <DollarSign className="h-3 w-3 inline" />
                  {listing.price_per_day}/day
                </span>
                <span className="text-gray-400">
                  Max {listing.max_rental_days} days
                </span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Earned</p>
            <p className="text-xl font-bold text-green-500">
              ${totalEarned.toFixed(2)}
            </p>
            {activeBookings.length > 0 && (
              <p className="text-sm text-blue-400 mt-1">
                {activeBookings.length} active booking
                {activeBookings.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Active Bookings for this listing */}
        {activeBookings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm font-medium text-gray-300 mb-2">
              Current Renters
            </p>
            <div className="space-y-2">
              {activeBookings.map((booking) => {
                const daysRemaining = getDaysRemaining(booking.end_date);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          {booking.renter?.full_name ||
                            booking.renter?.email ||
                            "Renter"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(booking.start_date)} -{" "}
                          {formatDate(booking.end_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        ${booking.total_price.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-500">
                        {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
